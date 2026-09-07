import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';
import { IMessage, IAttachment } from '../types/index.js';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

const SYSTEM_INSTRUCTION = `You are an ultra-premium, highly intelligent, thoughtful, and articulate AI assistant.
You possess deep expertise in programming, architecture, science, mathematics, reasoning, writing, and creative problem solving.
You have native bilingual mastery in both Bengali (বাংলা) and English.

Language Protocol:
1. Always respond in the language of the user's latest prompt by default:
   - If the user asks in Bengali (বাংলায় প্রশ্ন), respond in natural, elegant, grammatically flawless Bengali (বাংলায় উত্তর দিন).
   - If the user asks in English, respond in articulate, clear, polished English.
2. If the user uses Banglish or mixed Bengali/English, understand the intent effortlessly and respond in clean Bengali or English as appropriate.
3. Explicit Language Instruction: If the user specifies the language (e.g., "বাংলায় বলুন", "explain in English"), ALWAYS prioritize and adhere strictly to their explicit request.
4. Presentation & Formatting:
   - Format answers using clean, scannable, modern Markdown.
   - Use code blocks with appropriate language tags for code snippets.
   - Keep answers well-structured, insightful, direct, and free of fluff.`;

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

export class GeminiService {
  /**
   * Generate streaming response from Gemini for a conversation with model resilience.
   */
  static async streamChat({
    history = [],
    newPrompt,
    attachments = [],
    onChunk,
  }: {
    history: IMessage[];
    newPrompt: string;
    attachments?: IAttachment[];
    onChunk: (text: string) => void;
  }): Promise<string> {
    const ai = getAiClient();

    // Build contents payload with past history (up to last 16 turns for optimal context & speed)
    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }> = [];

    // Context management: take recent messages
    const recentHistory = history.slice(-16);
    for (const msg of recentHistory) {
      if (msg.role === 'system') continue;
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          if (att.dataUrl) {
            const base64Data = att.dataUrl.includes('base64,')
              ? att.dataUrl.split('base64,')[1]
              : att.dataUrl;
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: base64Data,
              },
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    // Add current user prompt and current attachments
    const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (att.dataUrl) {
          const base64Data = att.dataUrl.includes('base64,')
            ? att.dataUrl.split('base64,')[1]
            : att.dataUrl;
          currentParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: base64Data,
            },
          });
        }
      }
    }
    currentParts.push({ text: newPrompt });
    contents.push({ role: 'user', parts: currentParts });

    let lastError: any = null;
    for (const model of CANDIDATE_MODELS) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        let fullText = '';
        for await (const chunk of responseStream) {
          const chunkText = chunk.text || '';
          if (chunkText) {
            fullText += chunkText;
            onChunk(chunkText);
          }
        }

        if (fullText.trim().length > 0) {
          return fullText;
        }
      } catch (err: any) {
        console.warn(`[GeminiService] Model ${model} encountered an issue: ${err?.message || err}. Attempting fallback...`);
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini candidate models were unavailable.');
  }

  /**
   * Generates a concise title for a conversation given the first prompt.
   */
  static async generateTitle(prompt: string): Promise<string> {
    const titlePrompt = `Create a brief, clean, 3 to 6 words title summarizing this conversation topic.
Return ONLY the plain title text without quotes, punctuation, or preamble.
User prompt: "${prompt.slice(0, 300)}"`;

    const ai = getAiClient();
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: titlePrompt,
        });
        const title = (response.text || '').trim().replace(/^["']|["']$/g, '');
        if (title) {
          return title.slice(0, 50);
        }
      } catch (e) {
        // Try fallback model
      }
    }

    return prompt.trim().slice(0, 32) + (prompt.length > 32 ? '...' : '');
  }
}
