



import { Response } from 'express';
import { StorageService } from '../services/storage.service.js';
import { GeminiService } from '../services/gemini.service.js';
import { AuthRequest } from '../types/index.js';

function extractCleanErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred while processing your request.';
  const raw = typeof err === 'string' ? err : err?.message || String(err);
  try {
    const parsed = typeof raw === 'string' && raw.trim().startsWith('{') ? JSON.parse(raw) : null;
    if (parsed?.error?.message) {
      const innerMsg = parsed.error.message;
      if (typeof innerMsg === 'string' && innerMsg.trim().startsWith('{')) {
        try {
          const innerParsed = JSON.parse(innerMsg);
          return innerParsed?.error?.message || innerMsg;
        } catch {
          return innerMsg;
        }
      }
      return innerMsg;
    }
  } catch {
    // fallback
  }

  if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
    return 'The AI service is currently experiencing high demand. Please try again in a few moments.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Rate limit reached. Please wait a brief moment before sending another prompt.';
  }
  return raw;
}

export class ChatController {
  static async streamChat(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { prompt, conversationId, attachments, stream = true } = req.body;

    let activeConversationId = conversationId;
    let isNewConversation = false;
    let newTitle = '';

    try {
      // 1. Resolve or create conversation
      if (!activeConversationId) {
        // Create new conversation
        const initialTitle = prompt ? prompt.trim().slice(0, 30) : 'New Conversation';
        const newConv = await StorageService.createConversation(userId, initialTitle);
        activeConversationId = newConv._id;
        isNewConversation = true;
      } else {
        // Verify ownership
        const existing = await StorageService.getConversationById(activeConversationId, userId);
        if (!existing) {
          res.status(404).json({
            success: false,
            message: 'Conversation not found or access denied.',
            code: 'CONVERSATION_NOT_FOUND',
          });
          return;
        }
      }

      // 2. Fetch past conversation messages for context
      const priorMessages = await StorageService.getConversationMessages(activeConversationId);

      // 3. Persist the incoming user message
      const savedUserMessage = await StorageService.createMessage({
        conversationId: activeConversationId,
        role: 'user',
        content: prompt || '',
        attachments: attachments || [],
      });

      // 4. Setup SSE headers if stream requested
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        // Notify client of setup
        res.write(
          `data: ${JSON.stringify({
            type: 'init',
            conversationId: activeConversationId,
            userMessage: savedUserMessage,
            isNewConversation,
          })}\n\n`
        );

        let assistantContent = '';

        try {
          // Stream from Gemini
          await GeminiService.streamChat({
            history: priorMessages,
            newPrompt: prompt || '',
            attachments: attachments || [],
            onChunk: (chunk: string) => {
              assistantContent += chunk;
              res.write(
                `data: ${JSON.stringify({
                  type: 'chunk',
                  chunk,
                })}\n\n`
              );
            },
          });

          // 5. Persist assistant message
          const savedAssistantMessage = await StorageService.createMessage({
            conversationId: activeConversationId,
            role: 'assistant',
            content: assistantContent,
          });

          // If new conversation, generate a smart title in the background or right now
          if (isNewConversation && prompt) {
            newTitle = await GeminiService.generateTitle(prompt);
            await StorageService.updateConversationTitle(activeConversationId, userId, newTitle);
          }

          // 6. Complete stream
          res.write(
            `data: ${JSON.stringify({
              type: 'done',
              conversationId: activeConversationId,
              assistantMessage: savedAssistantMessage,
              title: newTitle || undefined,
            })}\n\n`
          );

          res.end();
        } catch (streamError: any) {
          const cleanErrorMessage = extractCleanErrorMessage(streamError);
          console.error('[Gemini Stream Error]:', cleanErrorMessage);
          res.write(
            `data: ${JSON.stringify({
              type: 'error',
              error: cleanErrorMessage,
            })}\n\n`
          );
          res.end();
        }
      } else {
        // Direct non-streaming fallback
        let assistantContent = '';
        await GeminiService.streamChat({
          history: priorMessages,
          newPrompt: prompt || '',
          attachments: attachments || [],
          onChunk: (chunk: string) => {
            assistantContent += chunk;
          },
        });

        const savedAssistantMessage = await StorageService.createMessage({
          conversationId: activeConversationId,
          role: 'assistant',
          content: assistantContent,
        });

        if (isNewConversation && prompt) {
          newTitle = await GeminiService.generateTitle(prompt);
          await StorageService.updateConversationTitle(activeConversationId, userId, newTitle);
        }

        res.status(200).json({
          success: true,
          conversationId: activeConversationId,
          userMessage: savedUserMessage,
          assistantMessage: savedAssistantMessage,
          title: newTitle || undefined,
        });
      }
    } catch (error: any) {
      const cleanErrorMessage = extractCleanErrorMessage(error);
      console.error('[Chat Controller Error]:', cleanErrorMessage);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: cleanErrorMessage,
          code: 'CHAT_PROCESSING_ERROR',
        });
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: cleanErrorMessage,
          })}\n\n`
        );
        res.end();
      }
    }
  }
}
