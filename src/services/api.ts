// CoreChat AI — high-level service layer.
// Swap the mock implementations with real backend calls (n8n, Supabase, etc.)
// without touching the UI.

import { N8N_WEBHOOK_URL } from "@/lib/api";
import { seedPersonalities, seedReport } from "@/lib/seed";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import type {
  Chat,
  ChatRequest,
  ChatResponse,
  Message,
  Personality,
  Report,
  User,
} from "@/lib/types";

const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ===== Auth =====
export const authService = {
  async signIn(email: string, _password: string): Promise<User> {
    await delay(600);
    const user: User = {
      id: uid("u"),
      email,
      name: email.split("@")[0] ?? "User",
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.user, user);
    return user;
  },
  async signUp(name: string, email: string, _password: string): Promise<User> {
    await delay(800);
    const user: User = { id: uid("u"), email, name, createdAt: new Date().toISOString() };
    storage.set(STORAGE_KEYS.user, user);
    return user;
  },
  async signInWithGoogle(): Promise<User> {
    await delay(700);
    const user: User = {
      id: uid("u"),
      email: "you@google.com",
      name: "Google User",
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.user, user);
    return user;
  },
  signOut(): void {
    storage.remove(STORAGE_KEYS.user);
  },
  current(): User | null {
    return storage.get<User | null>(STORAGE_KEYS.user, null);
  },
};

// ===== Chats =====
export const chatService = {
  list(): Chat[] {
    return storage.get<Chat[]>(STORAGE_KEYS.chats, []);
  },
  get(id: string): Chat | undefined {
    return this.list().find((c) => c.id === id);
  },
  create(personalityId?: string): Chat {
    const chats = this.list();
    const chat: Chat = {
      id: uid("c"),
      userId: authService.current()?.id ?? "anon",
      title: "New chat",
      personalityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    storage.set(STORAGE_KEYS.chats, [chat, ...chats]);
    return chat;
  },
  update(id: string, patch: Partial<Chat>): Chat | undefined {
    const chats = this.list();
    const next = chats.map((c) =>
      c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
    );
    storage.set(STORAGE_KEYS.chats, next);
    return next.find((c) => c.id === id);
  },
  remove(id: string): void {
    storage.set(
      STORAGE_KEYS.chats,
      this.list().filter((c) => c.id !== id),
    );
  },
  clearAll(): void {
    storage.set(STORAGE_KEYS.chats, []);
  },
  appendMessage(chatId: string, message: Message): void {
    const chat = this.get(chatId);
    if (!chat) return;
    const messages = [...chat.messages, message];
    const title =
      chat.title === "New chat" && message.role === "user"
        ? message.content.slice(0, 48)
        : chat.title;
    this.update(chatId, { messages, title });
  },
};

// ===== AI provider abstraction =====
// Sends to your n8n webhook when configured. Otherwise produces a local reply.
export const aiProvider = {
  async send(req: ChatRequest): Promise<ChatResponse> {
    if (N8N_WEBHOOK_URL) {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`n8n webhook failed: ${res.status}`);
      const data = (await res.json()) as { reply: string };
      return {
        message: {
          id: uid("m"),
          chatId: req.chatId,
          role: "assistant",
          content: data.reply,
          createdAt: new Date().toISOString(),
        },
      };
    }
    await delay(700 + Math.random() * 600);
    return {
      message: {
        id: uid("m"),
        chatId: req.chatId,
        role: "assistant",
        content: mockReply(req.message),
        createdAt: new Date().toISOString(),
      },
    };
  },
};

function mockReply(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "I'm here. What's on your mind?";
  const openings = [
    "Good question.",
    "Here's how I'd think about it.",
    "Let me work through that with you.",
    "Short answer first, then detail.",
  ];
  const head = openings[Math.floor(Math.random() * openings.length)];
  return `${head}\n\nYou asked: "${trimmed}". To respond meaningfully I'd normally call your AI backend, but this preview is running with local stubs. Wire up VITE_N8N_WEBHOOK_URL in your .env to stream real responses.`;
}

// ===== Personalities =====
export const personalityService = {
  list(): Personality[] {
    const stored = storage.get<Personality[] | null>(STORAGE_KEYS.personalities, null);
    if (stored && stored.length > 0) return stored;
    storage.set(STORAGE_KEYS.personalities, seedPersonalities);
    return seedPersonalities;
  },
  get(id: string): Personality | undefined {
    return this.list().find((p) => p.id === id);
  },
  create(input: Omit<Personality, "id" | "createdAt" | "rating" | "chats" | "creator">): Personality {
    const user = authService.current();
    const personality: Personality = {
      ...input,
      id: uid("p"),
      rating: 5,
      chats: 0,
      createdAt: new Date().toISOString(),
      creator: {
        id: user?.id ?? "u_you",
        name: user?.name ?? "You",
        avatar: (user?.name ?? "Y").charAt(0).toUpperCase(),
      },
    };
    const next = [personality, ...this.list()];
    storage.set(STORAGE_KEYS.personalities, next);
    return personality;
  },
};

// ===== Reports =====
export const reportService = {
  async get(): Promise<Report> {
    await delay(200);
    return seedReport;
  },
};

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
