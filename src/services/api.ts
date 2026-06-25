// CoreChat AI — service layer with Firebase Auth + Firestore
// Swap aiProvider with n8n or any external AI backend without touching UI.

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

// ─── Firebase ────────────────────────────────────────────────────────────────
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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
const auth = getAuth(app);
const db = getFirestore(app);

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
  const ref = doc(db, "users", fb.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      id: fb.uid,
      email: fb.email ?? "",
      name: fb.displayName ?? fb.email?.split("@")[0] ?? "User",
      avatarUrl: fb.photoURL ?? null,
      createdAt: serverTimestamp(),
    });
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await ensureUserDoc(result.user);
    const user = fbUserToUser(result.user);
    storage.set(STORAGE_KEYS.user, user);
    return user;
  },

  signOut(): void {
    void fbSignOut(auth);
    storage.remove(STORAGE_KEYS.user);
  },

  current(): User | null {
    return storage.get<User | null>(STORAGE_KEYS.user, null);
  },

  onAuthChange(cb: (user: User | null) => void): () => void {
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

// ─── Chats (Firestore, max 5 per user, FIFO) ─────────────────────────────────
const MAX_CHATS = 5;

export const chatService = {
  async list(): Promise<Chat[]> {
    const userId = authService.current()?.id;
    if (!userId) return [];
    const q = query(
      collection(db, "chats"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(MAX_CHATS)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Chat);
  },

  async get(id: string): Promise<Chat | undefined> {
    const snap = await getDoc(doc(db, "chats", id));
    return snap.exists() ? (snap.data() as Chat) : undefined;
  },

  async create(personalityId?: string): Promise<Chat> {
    const userId = authService.current()?.id ?? "anon";
    // Enforce FIFO: delete oldest if already at limit
    const existing = await this.list();
    if (existing.length >= MAX_CHATS) {
      const oldest = existing[existing.length - 1];
      if (oldest) await deleteDoc(doc(db, "chats", oldest.id));
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
    await setDoc(doc(db, "chats", chat.id), chat);
    return chat;
  },

  async update(id: string, patch: Partial<Chat>): Promise<void> {
    await setDoc(doc(db, "chats", id), { ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "chats", id));
  },

  async clearAll(): Promise<void> {
    const chats = await this.list();
    await Promise.all(chats.map((c) => deleteDoc(doc(db, "chats", c.id))));
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

// ─── AI provider (modular — swap for n8n/external backend) ───────────────────
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

// ─── Personalities (Firestore — 2 defaults + custom per user) ─────────────────
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

export const personalityService = {
  async list(): Promise<Personality[]> {
    const userId = authService.current()?.id;
    if (!userId) return DEFAULT_PERSONALITIES;
    const q = query(
      collection(db, "personalities"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const custom = snap.docs.map((d) => d.data() as Personality);
    return [...DEFAULT_PERSONALITIES, ...custom];
  },

  async get(id: string): Promise<Personality | undefined> {
    const def = DEFAULT_PERSONALITIES.find((p) => p.id === id);
    if (def) return def;
    const snap = await getDoc(doc(db, "personalities", id));
    return snap.exists() ? (snap.data() as Personality) : undefined;
  },

  async create(input: Omit<Personality, "id" | "createdAt" | "rating" | "chats" | "creator">): Promise<Personality> {
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
    await setDoc(doc(db, "personalities", personality.id), {
      ...personality,
      userId: user?.id ?? "anon",
    });
    return personality;
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "personalities", id));
  },
};

// ─── Reports (Firestore — feedback & report AI only) ──────────────────────────
export const reportService = {
  async submit(type: "feedback" | "report", message: string): Promise<void> {
    const user = authService.current();
    await addDoc(collection(db, "reports"), {
      uid: user?.id ?? "anon",
      type,
      message,
      timestamp: serverTimestamp(),
    });
  },
};
function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
