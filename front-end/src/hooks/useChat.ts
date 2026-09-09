
import { useState, useEffect, useCallback, useRef } from 'react';

import { Conversation, Message, Attachment } from '../types';

import { api, getToken } from '../services/api';

import { useAuth } from '../store/AuthContext';

export interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  last7Days: Conversation[];
  older: Conversation[];
}

export function useChat() {
  const {
    user,
    isAuthenticated,
    openAuthModal,
    preservedPrompt,
    preservedAttachments,
    clearPreservedDraft,
  } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active abort controller for stream cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch user conversations
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      return;
    }

    setIsLoadingConversations(true);

    try {
      const res = await api.getConversations();

      if (res.success) {
        setConversations(res.conversations);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load selected conversation
  const selectConversation = useCallback(
    async (conversationId: string) => {
      if (conversationId === currentConversationId) return;

      setCurrentConversationId(conversationId);
      setIsLoadingMessages(true);
      setError(null);

      try {
        const res = await api.getConversation(conversationId);

        if (res.success) {
          setMessages(res.messages);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load conversation');
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [currentConversationId]
  );

  // Start fresh chat
  const startNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setCurrentConversationId(null);
    setMessages([]);
    setIsSending(false);
    setStreamingMessageId(null);
    setError(null);
  }, []);

  // Send message implementation
  const sendMessage = useCallback(
    async (prompt: string, attachments: Attachment[] = []) => {
      const cleanPrompt = prompt.trim();

      if (!cleanPrompt && (!attachments || attachments.length === 0)) return;

      if (isSending) return; // Prevent duplicate submissions

      // Action-gated auth check
      if (!isAuthenticated) {
        openAuthModal('signup', cleanPrompt, attachments);
        return;
      }

      setError(null);
      setIsSending(true);

      // Create optimistic user message
      const tempUserMsgId = `temp-user-${Date.now()}`;

      const optimisticUserMsg: Message = {
        _id: tempUserMsgId,
        conversationId: currentConversationId || 'pending',
        role: 'user',
        content: cleanPrompt,
        attachments,
        createdAt: new Date().toISOString(),
      };

      // Create placeholder assistant message
      const tempAssistantMsgId = `temp-assistant-${Date.now()}`;

      const placeholderAssistantMsg: Message = {
        _id: tempAssistantMsgId,
        conversationId: currentConversationId || 'pending',
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, optimisticUserMsg, placeholderAssistantMsg]);
      setStreamingMessageId(tempAssistantMsgId);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const token = getToken();

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Use the production backend URL when VITE_API_URL is configured.
        // When VITE_API_URL is not configured locally, keep the relative URL
        // so the Vite development proxy continues to handle /api requests.
        const apiBase =
          ((import.meta as any).env?.VITE_API_URL as string)?.replace(/\/$/, '') || '';

        const response = await fetch(`${apiBase}/api/chat`, {
          method: 'POST',
          headers,
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({
            prompt: cleanPrompt,
            conversationId: currentConversationId || undefined,
            attachments,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));

          throw new Error(
            errData.message || `Server responded with ${response.status}`
          );
        }

        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error('Response body stream is unavailable.');
        }

        const decoder = new TextDecoder('utf-8');

        let accumulatedAssistantContent = '';
        let resolvedConversationId = currentConversationId;
        let buffer = '';
        let streamError: string | null = null;
        let receivedAnyChunk = false;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            const trimmed = block.trim();

            if (!trimmed.startsWith('data: ')) continue;

            const dataStr = trimmed.slice(6);

            if (!dataStr) continue;

            let event: any = null;

            try {
              event = JSON.parse(dataStr);
            } catch (jsonErr) {
              console.warn('Failed to parse SSE event chunk:', jsonErr);
              continue;
            }

            if (event.type === 'init') {
              resolvedConversationId = event.conversationId;
              setCurrentConversationId(event.conversationId);

              // Update optimistic user message with server ID
              if (event.userMessage) {
                setMessages(prev =>
                  prev.map(m =>
                    m._id === tempUserMsgId ? event.userMessage : m
                  )
                );
              }

              // Immediately refresh conversations so sidebar updates without waiting for stream to finish
              loadConversations();
            } else if (event.type === 'chunk') {
              receivedAnyChunk = true;
              accumulatedAssistantContent += event.chunk;

              setMessages(prev =>
                prev.map(m =>
                  m._id === tempAssistantMsgId
                    ? { ...m, content: accumulatedAssistantContent }
                    : m
                )
              );
            } else if (event.type === 'done') {
              resolvedConversationId = event.conversationId;

              if (event.assistantMessage) {
                setMessages(prev =>
                  prev.map(m =>
                    m._id === tempAssistantMsgId
                      ? event.assistantMessage
                      : m
                  )
                );
              }

              // Reload conversations list to capture new conversation / updated timestamp
              loadConversations();
            } else if (event.type === 'error') {
              streamError =
                event.error || 'Gemini encountered an error.';

              break;
            }
          }

          if (streamError) {
            break;
          }
        }

        if (streamError) {
          throw new Error(streamError);
        }

        // Safety verification: if stream closed without sending any chunk or content
        if (
          !receivedAnyChunk &&
          !accumulatedAssistantContent.trim()
        ) {
          throw new Error(
            'No response was generated by the AI assistant. Please try again.'
          );
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Stream aborted by user');
        } else {
          console.error('Chat error:', err);

          let cleanMessage =
            err.message ||
            'Failed to generate response. Please try again.';

          try {
            if (
              typeof cleanMessage === 'string' &&
              cleanMessage.startsWith('{')
            ) {
              const parsed = JSON.parse(cleanMessage);

              if (parsed?.error?.message) {
                cleanMessage = parsed.error.message;
              }
            }
          } catch {
            // Keep cleanMessage
          }

          setError(cleanMessage);

          // Clean up empty placeholder assistant message so UI never stays stuck in "Thinking..."
          setMessages(prev =>
            prev.filter(m => m._id !== tempAssistantMsgId)
          );
        }
      } finally {
        setIsSending(false);
        setStreamingMessageId(null);
        abortControllerRef.current = null;
      }
    },
    [
      currentConversationId,
      isAuthenticated,
      isSending,
      loadConversations,
      openAuthModal,
    ]
  );

  // Automatically submit preserved prompt once authentication succeeds
  useEffect(() => {
    if (isAuthenticated && preservedPrompt) {
      const promptToRun = preservedPrompt;
      const attachmentsToRun = preservedAttachments;

      clearPreservedDraft();

      // Auto-send with slight tick to allow state to settle
      setTimeout(() => {
        sendMessage(promptToRun, attachmentsToRun);
      }, 50);
    }
  }, [
    isAuthenticated,
    preservedPrompt,
    preservedAttachments,
    clearPreservedDraft,
    sendMessage,
  ]);

  // Rename conversation
  const renameConversation = useCallback(
    async (id: string, newTitle: string) => {
      try {
        const res = await api.updateConversation(id, newTitle);

        if (res.success) {
          setConversations(prev =>
            prev.map(c =>
              c._id === id ? { ...c, title: newTitle } : c
            )
          );

          return true;
        }
      } catch (err: any) {
        setError(err.message || 'Failed to rename conversation');
      }

      return false;
    },
    []
  );

  // Delete conversation
  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        const res = await api.deleteConversation(id);

        if (res.success) {
          setConversations(prev =>
            prev.filter(c => c._id !== id)
          );

          if (currentConversationId === id) {
            startNewChat();
          }

          return true;
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete conversation');
      }

      return false;
    },
    [currentConversationId, startNewChat]
  );

  // Group conversations by date
  const groupedConversations: GroupedConversations = {
    today: [],
    yesterday: [],
    last7Days: [],
    older: [],
  };

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  const startOfYesterday =
    startOfToday - 24 * 60 * 60 * 1000;

  const startOfLast7Days =
    startOfToday - 7 * 24 * 60 * 60 * 1000;

  for (const conv of conversations) {
    const time = new Date(
      conv.updatedAt || conv.createdAt
    ).getTime();

    if (time >= startOfToday) {
      groupedConversations.today.push(conv);
    } else if (time >= startOfYesterday) {
      groupedConversations.yesterday.push(conv);
    } else if (time >= startOfLast7Days) {
      groupedConversations.last7Days.push(conv);
    } else {
      groupedConversations.older.push(conv);
    }
  }

  return {
    conversations,
    groupedConversations,
    currentConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    streamingMessageId,
    error,
    selectConversation,
    startNewChat,
    sendMessage,
    renameConversation,
    deleteConversation,
    clearError: () => setError(null),
  };
}






// import { useState, useEffect, useCallback, useRef } from 'react';
// import { Conversation, Message, Attachment } from '../types';
// import { api, getToken } from '../services/api';
// import { useAuth } from '../store/AuthContext';

// export interface GroupedConversations {
//   today: Conversation[];
//   yesterday: Conversation[];
//   last7Days: Conversation[];
//   older: Conversation[];
// }

// export function useChat() {
//   const { user, isAuthenticated, openAuthModal, preservedPrompt, preservedAttachments, clearPreservedDraft } = useAuth();

//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
//   const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
//   const [isSending, setIsSending] = useState<boolean>(false);
//   const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   // Active abort controller for stream cancellation
//   const abortControllerRef = useRef<AbortController | null>(null);

//   // Fetch user conversations
//   const loadConversations = useCallback(async () => {
//     if (!isAuthenticated) {
//       setConversations([]);
//       return;
//     }
//     setIsLoadingConversations(true);
//     try {
//       const res = await api.getConversations();
//       if (res.success) {
//         setConversations(res.conversations);
//       }
//     } catch (err: any) {
//       console.error('Failed to load conversations:', err);
//     } finally {
//       setIsLoadingConversations(false);
//     }
//   }, [isAuthenticated]);

//   useEffect(() => {
//     loadConversations();
//   }, [loadConversations]);

//   // Load selected conversation
//   const selectConversation = useCallback(async (conversationId: string) => {
//     if (conversationId === currentConversationId) return;

//     setCurrentConversationId(conversationId);
//     setIsLoadingMessages(true);
//     setError(null);

//     try {
//       const res = await api.getConversation(conversationId);
//       if (res.success) {
//         setMessages(res.messages);
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to load conversation');
//     } finally {
//       setIsLoadingMessages(false);
//     }
//   }, [currentConversationId]);

//   // Start fresh chat
//   const startNewChat = useCallback(() => {
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//       abortControllerRef.current = null;
//     }
//     setCurrentConversationId(null);
//     setMessages([]);
//     setIsSending(false);
//     setStreamingMessageId(null);
//     setError(null);
//   }, []);

//   // Send message implementation
//   const sendMessage = useCallback(
//     async (prompt: string, attachments: Attachment[] = []) => {
//       const cleanPrompt = prompt.trim();
//       if (!cleanPrompt && (!attachments || attachments.length === 0)) return;
//       if (isSending) return; // Prevent duplicate submissions

//       // Action-gated auth check
//       if (!isAuthenticated) {
//         openAuthModal('signup', cleanPrompt, attachments);
//         return;
//       }

//       setError(null);
//       setIsSending(true);

//       // Create optimistic user message
//       const tempUserMsgId = `temp-user-${Date.now()}`;
//       const optimisticUserMsg: Message = {
//         _id: tempUserMsgId,
//         conversationId: currentConversationId || 'pending',
//         role: 'user',
//         content: cleanPrompt,
//         attachments,
//         createdAt: new Date().toISOString(),
//       };

//       // Create placeholder assistant message
//       const tempAssistantMsgId = `temp-assistant-${Date.now()}`;
//       const placeholderAssistantMsg: Message = {
//         _id: tempAssistantMsgId,
//         conversationId: currentConversationId || 'pending',
//         role: 'assistant',
//         content: '',
//         createdAt: new Date().toISOString(),
//       };

//       setMessages(prev => [...prev, optimisticUserMsg, placeholderAssistantMsg]);
//       setStreamingMessageId(tempAssistantMsgId);

//       const controller = new AbortController();
//       abortControllerRef.current = controller;

//       try {
//         const token = getToken();
//         const headers: Record<string, string> = {
//           'Content-Type': 'application/json',
//         };
//         if (token) {
//           headers['Authorization'] = `Bearer ${token}`;
//         }

//         const response = await fetch('/api/chat', {
//           method: 'POST',
//           headers,
//           credentials: 'include',
//           signal: controller.signal,
//           body: JSON.stringify({
//             prompt: cleanPrompt,
//             conversationId: currentConversationId || undefined,
//             attachments,
//             stream: true,
//           }),
//         });

//         if (!response.ok) {
//           const errData = await response.json().catch(() => ({}));
//           throw new Error(errData.message || `Server responded with ${response.status}`);
//         }

//         const reader = response.body?.getReader();
//         if (!reader) {
//           throw new Error('Response body stream is unavailable.');
//         }

//         const decoder = new TextDecoder('utf-8');
//         let accumulatedAssistantContent = '';
//         let resolvedConversationId = currentConversationId;
//         let buffer = '';
//         let streamError: string | null = null;
//         let receivedAnyChunk = false;

//         while (true) {
//           const { done, value } = await reader.read();
//           if (done) break;

//           buffer += decoder.decode(value, { stream: true });
//           const lines = buffer.split('\n\n');
//           buffer = lines.pop() || '';

//           for (const block of lines) {
//             const trimmed = block.trim();
//             if (!trimmed.startsWith('data: ')) continue;
//             const dataStr = trimmed.slice(6);
//             if (!dataStr) continue;

//             let event: any = null;
//             try {
//               event = JSON.parse(dataStr);
//             } catch (jsonErr) {
//               console.warn('Failed to parse SSE event chunk:', jsonErr);
//               continue;
//             }

//             if (event.type === 'init') {
//               resolvedConversationId = event.conversationId;
//               setCurrentConversationId(event.conversationId);
//               // Update optimistic user message with server ID
//               if (event.userMessage) {
//                 setMessages(prev =>
//                   prev.map(m => (m._id === tempUserMsgId ? event.userMessage : m))
//                 );
//               }
//               // Immediately refresh conversations so sidebar updates without waiting for stream to finish
//               loadConversations();
//             } else if (event.type === 'chunk') {
//               receivedAnyChunk = true;
//               accumulatedAssistantContent += event.chunk;
//               setMessages(prev =>
//                 prev.map(m =>
//                   m._id === tempAssistantMsgId
//                     ? { ...m, content: accumulatedAssistantContent }
//                     : m
//                 )
//               );
//             } else if (event.type === 'done') {
//               resolvedConversationId = event.conversationId;
//               if (event.assistantMessage) {
//                 setMessages(prev =>
//                   prev.map(m => (m._id === tempAssistantMsgId ? event.assistantMessage : m))
//                 );
//               }
//               // Reload conversations list to capture new conversation / updated timestamp
//               loadConversations();
//             } else if (event.type === 'error') {
//               streamError = event.error || 'Gemini encountered an error.';
//               break;
//             }
//           }

//           if (streamError) {
//             break;
//           }
//         }

//         if (streamError) {
//           throw new Error(streamError);
//         }

//         // Safety verification: if stream closed without sending any chunk or content
//         if (!receivedAnyChunk && !accumulatedAssistantContent.trim()) {
//           throw new Error('No response was generated by the AI assistant. Please try again.');
//         }
//       } catch (err: any) {
//         if (err.name === 'AbortError') {
//           console.log('Stream aborted by user');
//         } else {
//           console.error('Chat error:', err);
//           let cleanMessage = err.message || 'Failed to generate response. Please try again.';
//           try {
//             if (typeof cleanMessage === 'string' && cleanMessage.startsWith('{')) {
//               const parsed = JSON.parse(cleanMessage);
//               if (parsed?.error?.message) {
//                 cleanMessage = parsed.error.message;
//               }
//             }
//           } catch {
//             // Keep cleanMessage
//           }
//           setError(cleanMessage);
//           // Clean up empty placeholder assistant message so UI never stays stuck in "Thinking..."
//           setMessages(prev => prev.filter(m => m._id !== tempAssistantMsgId));
//         }
//       } finally {
//         setIsSending(false);
//         setStreamingMessageId(null);
//         abortControllerRef.current = null;
//       }
//     },
//     [currentConversationId, isAuthenticated, isSending, loadConversations, openAuthModal]
//   );

//   // Automatically submit preserved prompt once authentication succeeds
//   useEffect(() => {
//     if (isAuthenticated && preservedPrompt) {
//       const promptToRun = preservedPrompt;
//       const attachmentsToRun = preservedAttachments;
//       clearPreservedDraft();
//       // Auto-send with slight tick to allow state to settle
//       setTimeout(() => {
//         sendMessage(promptToRun, attachmentsToRun);
//       }, 50);
//     }
//   }, [isAuthenticated, preservedPrompt, preservedAttachments, clearPreservedDraft, sendMessage]);

//   // Rename conversation
//   const renameConversation = useCallback(
//     async (id: string, newTitle: string) => {
//       try {
//         const res = await api.updateConversation(id, newTitle);
//         if (res.success) {
//           setConversations(prev =>
//             prev.map(c => (c._id === id ? { ...c, title: newTitle } : c))
//           );
//           return true;
//         }
//       } catch (err: any) {
//         setError(err.message || 'Failed to rename conversation');
//       }
//       return false;
//     },
//     []
//   );

//   // Delete conversation
//   const deleteConversation = useCallback(
//     async (id: string) => {
//       try {
//         const res = await api.deleteConversation(id);
//         if (res.success) {
//           setConversations(prev => prev.filter(c => c._id !== id));
//           if (currentConversationId === id) {
//             startNewChat();
//           }
//           return true;
//         }
//       } catch (err: any) {
//         setError(err.message || 'Failed to delete conversation');
//       }
//       return false;
//     },
//     [currentConversationId, startNewChat]
//   );

//   // Group conversations by date
//   const groupedConversations: GroupedConversations = {
//     today: [],
//     yesterday: [],
//     last7Days: [],
//     older: [],
//   };

//   const now = new Date();
//   const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
//   const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
//   const startOfLast7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;

//   for (const conv of conversations) {
//     const time = new Date(conv.updatedAt || conv.createdAt).getTime();
//     if (time >= startOfToday) {
//       groupedConversations.today.push(conv);
//     } else if (time >= startOfYesterday) {
//       groupedConversations.yesterday.push(conv);
//     } else if (time >= startOfLast7Days) {
//       groupedConversations.last7Days.push(conv);
//     } else {
//       groupedConversations.older.push(conv);
//     }
//   }

//   return {
//     conversations,
//     groupedConversations,
//     currentConversationId,
//     messages,
//     isLoadingConversations,
//     isLoadingMessages,
//     isSending,
//     streamingMessageId,
//     error,
//     selectConversation,
//     startNewChat,
//     sendMessage,
//     renameConversation,
//     deleteConversation,
//     clearError: () => setError(null),
//   };
// }
