import { useCallback, useEffect, useState } from "react";

import { aiProvider, chatService } from "@/services/api";
import type { Chat, Message } from "@/lib/types";

const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function useChat(chatId: string | null) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!chatId) {
      setChat(null);
      return;
    }
    setChat(chatService.get(chatId) ?? null);
  }, [chatId]);

  const refresh = useCallback(() => {
    if (!chatId) return;
    setChat(chatService.get(chatId) ?? null);
  }, [chatId]);

  const send = useCallback(
    async (text: string) => {
      if (!chatId || !text.trim()) return;
      const userMessage: Message = {
        id: uid("m"),
        chatId,
        role: "user",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };
      chatService.appendMessage(chatId, userMessage);
      refresh();
      setIsStreaming(true);
      try {
        const current = chatService.get(chatId);
        const res = await aiProvider.send({
          chatId,
          message: text.trim(),
          personalityId: current?.personalityId,
          history:
            current?.messages.map((m) => ({ role: m.role, content: m.content })) ?? [],
        });
        chatService.appendMessage(chatId, res.message);
        refresh();
      } finally {
        setIsStreaming(false);
      }
    },
    [chatId, refresh],
  );

  return { chat, isStreaming, send, refresh };
}
