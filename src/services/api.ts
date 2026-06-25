// CoreChat AI — Service Layer
// Firebase Auth + Firestore with proper error handling

import { N8N_WEBHOOK_URL } from "@/lib/api";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import type {
  Chat,
  ChatRequest,
  ChatResponse,
  Message,
  Personality,
  User,
} from "@/lib/types";

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FBUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";

// ─── Firebase Init ───────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyDUdare1dGvNq8HVgLuPC7ZgeYtXLZHJ_w",
  authDomain: "corechat-ai.firebaseapp.com",
  projectId: "corechat-ai",
  storageBucket: "corechat-ai.appspot.com",
  messagingSenderId: "1971555902",
  appId: "1:1971555902:web:0c82fd7dbae4371c15cb6f",
};

let app: any;
let auth: any;
let db: any;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init error:", e);
}

// ─── Helpers ─────────────────────────────────────────────────────────────
const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function fbUserToUser(fb: FBUser): User {
  return {
    id: fb.uid,
    email: fb.email ?? "",
    name: fb.displayName ?? fb.email?.split("@")[0] ?? "User",
    avatarUrl: fb.photoURL ?? undefined,
    createdAt: new Date().toISOString(),
  };
}

async function ensureUserDoc(fb: FBUser): Promise<void> {
  try {
    if (!db) return;
    const ref = doc(db, "users", fb.uid);
    await setDoc(
      ref,
      {
        id: fb.uid,
        email: fb.email ?? "",
        name: fb.displayName ?? fb.email?.split("@")[0] ?? "User",
        avatarUrl: fb.photoURL ?? null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("Could not create user doc:", e);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authService = {
  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await ensureUserDoc(result.user);
      const user = fbUserToUser(result.user);
      storage.set(STORAGE_KEYS.user, user);
      return user;
    } catch (e) {
      console.error("Google sign in error:", e);
      throw e;
    }
  },

  signOut(): void {
    try {
      if (auth) void fbSignOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    storage.remove(STORAGE_KEYS.user);
  },

  current(): User | null {
    return storage.get<User | null>(STORAGE_KEYS.user, null);
  },

  onAuthChange(cb: (user: User | null) => void): () => void {
    if (!auth) {
      cb(this.current());
      return () => {};
    }
    return onAuthStateChanged(auth, (fb) => {
      if (fb) {
        const user = fbUserToUser(fb);
        storage.set(STORAGE_KEYS.user, user);
        cb(user);
      } else {
        storage.remove(STORAGE_KEYS.user);
        cb(null);
      }
    });
  },
};

// ─── Chats ────────────────────────────────────────────────────────────────
const MAX_CHATS = 5;
const CHATS_KEY = "chats_v1";

function getChatsLocal(): Chat[] {
  try {
    return storage.get<Chat[]>(CHATS_KEY, []) || [];
  } catch {
    return [];
  }
}

function saveChatsLocal(chats: Chat[]): void {
  try {
    storage.set(CHATS_KEY, chats);
  } catch (e) {
    console.warn("Could not save chats:", e);
  }
}

export const chatService = {
  async list(): Promise<Chat[]> {
    const userId = authService.current()?.id;
    if (!userId) return [];

    // Try Firestore
    if (db) {
      try {
        const q = query(
          collection(db, "chats"),
          where("userId", "==", userId),
          orderBy("updatedAt", "desc"),
          limit(MAX_CHATS)
        );
        const snap = await getDocs(q);
        const fbChats = snap.docs.map((d) => d.data() as Chat);
        // Also save to local for speed
        saveChatsLocal(fbChats);
        return fbChats;
      } catch (e) {
        console.warn("Firestore list error, using local:", e);
        return getChatsLocal().filter((c) => c.userId === userId);
      }
    }

    return getChatsLocal().filter((c) => c.userId === userId);
  },

  async get(id: string): Promise<Chat | undefined> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, "chats", id));
        return snap.exists() ? (snap.data() as Chat) : undefined;
      } catch (e) {
        console.warn("Firestore get error:", e);
      }
    }

    return getChatsLocal().find((c) => c.id === id);
  },

  async create(personalityId?: string): Promise<Chat> {
    const userId = authService.current()?.id ?? "anon";
    const existing = await this.list();

    // FIFO: delete oldest if at limit
    if (existing.length >= MAX_CHATS && existing.length > 0) {
      const oldest = existing[existing.length - 1];
      if (oldest) await this.remove(oldest.id);
    }

    const chat: Chat = {
      id: uid("c"),
      userId,
      title: "New chat",
      personalityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    // Save to local first (instant)
    const local = getChatsLocal();
    local.push(chat);
    saveChatsLocal(local);

    // Then sync to Firestore
    if (db) {
      try {
        await setDoc(doc(db, "chats", chat.id), chat);
      } catch (e) {
        console.warn("Firestore create error:", e);
      }
    }

    return chat;
  },

  async update(id: string, patch: Partial<Chat>): Promise<void> {
    const updated = { ...patch, updatedAt: new Date().toISOString() };

    // Update local first
    const local = getChatsLocal();
    const idx = local.findIndex((c) => c.id === id);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...updated };
      saveChatsLocal(local);
    }

    // Then sync to Firestore
    if (db) {
      try {
        await setDoc(doc(db, "chats", id), updated, { merge: true });
      } catch (e) {
        console.warn("Firestore update error:", e);
      }
    }
  },

  async remove(id: string): Promise<void> {
    // Remove from local first
    const local = getChatsLocal();
    saveChatsLocal(local.filter((c) => c.id !== id));

    // Then from Firestore
    if (db) {
      try {
        await deleteDoc(doc(db, "chats", id));
      } catch (e) {
        console.warn("Firestore remove error:", e);
      }
    }
  },

  async clearAll(): Promise<void> {
    const chats = await this.list();
    await Promise.all(chats.map((c) => this.remove(c.id)));
  },

  async appendMessage(chatId: string, message: Message): Promise<void> {
    const chat = await this.get(chatId);
    if (!chat) return;

    const messages = [...chat.messages, message];
    const title =
      chat.title === "New chat" && message.role === "user"
        ? message.content.slice(0, 48)
        : chat.title;

    await this.update(chatId, { messages, title });
  },
};

// ─── AI Provider ──────────────────────────────────────────────────────────
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

// ─── Personalities ────────────────────────────────────────────────────────
const DEFAULT_PERSONALITIES: Personality[] = [
  {
    id: "default_friendly",
    name: "Friendly",
    tagline: "Warm, approachable, and easy to talk to",
    description: "A helpful companion that keeps things light and encouraging.",
    avatar: "😊",
    category: "Default",
    rating: 5,
    chats: 0,
    isPublic: true,
    systemPrompt: "You are a friendly, warm, and approachable AI assistant. Keep your tone conversational, encouraging, and easy to understand.",
    creator: { id: "system", name: "CoreChat", avatar: "C" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "default_professional",
    name: "Professional",
    tagline: "Clear, concise, and business-focused",
    description: "Formal and precise — ideal for work tasks and business writing.",
    avatar: "💼",
    category: "Default",
    rating: 5,
    chats: 0,
    isPublic: true,
    systemPrompt: "You are a professional AI assistant. Keep responses concise, formal, and business-appropriate. Focus on clarity and accuracy.",
    creator: { id: "system", name: "CoreChat", avatar: "C" },
    createdAt: new Date().toISOString(),
  },
];

const PERSONALITIES_KEY = "personalities_v1";

function getPersonalitiesLocal(): Personality[] {
  try {
    return storage.get<Personality[]>(PERSONALITIES_KEY, []) || [];
  } catch {
    return [];
  }
}

function savePersonalitiesLocal(personalities: Personality[]): void {
  try {
    storage.set(PERSONALITIES_KEY, personalities);
  } catch (e) {
    console.warn("Could not save personalities:", e);
  }
}

export const personalityService = {
  async list(): Promise<Personality[]> {
    const userId = authService.current()?.id;
    if (!userId) return DEFAULT_PERSONALITIES;

    let custom: Personality[] = [];

    if (db) {
      try {
        const q = query(collection(db, "personalities"), where("userId", "==", userId));
        const snap = await getDocs(q);
        custom = snap.docs.map((d) => d.data() as Personality);
        savePersonalitiesLocal(custom);
      } catch (e) {
        console.warn("Firestore personalities error:", e);
        custom = getPersonalitiesLocal().filter((p) => p.creator.id === userId);
      }
    } else {
      custom = getPersonalitiesLocal().filter((p) => p.creator.id === userId);
    }

    return [...DEFAULT_PERSONALITIES, ...custom];
  },

  async get(id: string): Promise<Personality | undefined> {
    const def = DEFAULT_PERSONALITIES.find((p) => p.id === id);
    if (def) return def;

    if (db) {
      try {
        const snap = await getDoc(doc(db, "personalities", id));
        return snap.exists() ? (snap.data() as Personality) : undefined;
      } catch (e) {
        console.warn("Firestore get personality error:", e);
      }
    }

    return getPersonalitiesLocal().find((p) => p.id === id);
  },

  async create(
    input: Omit<Personality, "id" | "createdAt" | "rating" | "chats" | "creator">
  ): Promise<Personality> {
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

    // Save local first
    const local = getPersonalitiesLocal();
    local.push(personality);
    savePersonalitiesLocal(local);

    // Then Firestore
    if (db) {
      try {
        await setDoc(doc(db, "personalities", personality.id), {
          ...personality,
          userId: user?.id ?? "anon",
        });
      } catch (e) {
        console.warn("Firestore create personality error:", e);
      }
    }

    return personality;
  },

  async remove(id: string): Promise<void> {
    // Remove local first
    const local = getPersonalitiesLocal();
    savePersonalitiesLocal(local.filter((p) => p.id !== id));

    // Then Firestore
    if (db) {
      try {
        await deleteDoc(doc(db, "personalities", id));
      } catch (e) {
        console.warn("Firestore remove personality error:", e);
      }
    }
  },
};

// ─── Reports ──────────────────────────────────────────────────────────────
const REPORTS_KEY = "reports_v1";

export const reportService = {
  async submit(type: "feedback" | "report", message: string): Promise<void> {
    const user = authService.current();
    const report = {
      uid: user?.id ?? "anon",
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    // Save local first
    const local = storage.get<typeof report[]>(REPORTS_KEY, []) || [];
    local.push(report);
    storage.set(REPORTS_KEY, local);

    // Then Firestore
    if (db) {
      try {
        await addDoc(collection(db, "reports"), {
          ...report,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore submit report error:", e);
      }
    }
  },
};

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
  }
