import { useCallback, useEffect, useState, useRef } from "react";
import { aiProvider, chatService } from "@/services/api";
import type { Chat, Message } from "@/lib/types";

const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function useChat(chatId: string | null) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Stale closure bug se bachne ke liye latest chatId ko ref mein rakha hai
  const chatIdRef = useRef<string | null>(chatId);

  useEffect(() => {
    chatIdRef.current = chatId;
    
    async function loadChat() {
      if (!chatId) {
        setChat(null);
        return;
      }

      try {
        const data = await chatService.get(chatId);
        setChat(data ?? null);
      } catch (err) {
        console.error("Error loading chat in hook:", err);
        setChat(null);
      }
    }

    loadChat();
  }, [chatId]);

  const refresh = useCallback(async () => {
    const activeId = chatIdRef.current;
    if (!activeId) return;

    try {
      const data = await chatService.get(activeId);
      setChat(data ?? null);
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  }, []);

  const send = useCallback(
    async (text: string, overrideChatId?: string) => {
      // Pehle freshly created id check karega, nahi toh fallback to latest ref
      const activeChatId = overrideChatId || chatIdRef.current;
      
      if (!activeChatId || !text.trim()) {
        console.warn("Cannot send message: activeChatId is null");
        return;
      }

      const userMessage: Message = {
        id: uid("m"),
        chatId: activeChatId,
        role: "user",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };

      try {
        // 1. Save user message in firestore
        await chatService.appendMessage(activeChatId, userMessage);
        
        // 2. UI ko instantly update karein taaki sync delay na aaye
        setChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...(prev.messages || []), userMessage],
          };
        });

        setIsStreaming(true);

        // 3. Fetch latest chat history context ke liye
        const current = await chatService.get(activeChatId);

        // 4. Request to AI provider
        const res = await aiProvider.send({
          chatId: activeChatId,
          message: text.trim(),
          personalityId: current?.personalityId,
          history:
            current?.messages?.map((m) => ({
              role: m.role,
              content: m.content,
            })) ?? [],
        });

        // 5. Append AI response
        await chatService.appendMessage(activeChatId, res.message);
        
        // 6. Pull final response from service
        const finalData = await chatService.get(activeChatId);
        setChat(finalData ?? null);

      } catch (error) {
        console.error("Error in send flow:", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  return {
    chat,
    isStreaming,
    send,
    refresh,
  };
}
