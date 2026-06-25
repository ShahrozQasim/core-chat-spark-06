// CoreChat AI — service layer
// Firebase Auth + Firestore (with fallback to localStorage)
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

// ─── Firebase (with graceful fallback) ────────────────────────────────────
let auth: any = null;
let db: any = null;
let fbInitialized = false;

async function initFirebase() {
  if (fbInitialized) return;
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getAuth } = await import("firebase/auth");
    const { getFirestore } = await import("firebase/firestore");

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.authDomain ||
      !firebaseConfig.projectId
    ) {
      console.warn("Firebase env vars missing — using localStorage fallback");
      return false;
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    fbInitialized = true;
    return true;
  } catch (e) {
    console.warn("Firebase init failed — using localStorage fallback", e);
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────
const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function fbUserToUser(fb: any): User {
  return {
    id: fb.uid,
    email: fb.email ?? "",
    name: fb.displayName ?? fb.email?.split("@")[0] ?? "User",
    avatarUrl: fb.photoURL ?? undefined,
    createdAt: new Date().toISOString(),
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authService = {
  async signInWithGoogle(): Promise<User> {
    const hasFirebase = await initFirebase();
    
    if (hasFirebase && auth) {
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = fbUserToUser(result.user);
      storage.set(STORAGE_KEYS.user, user);
      
      // Create user doc in Firestore
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      try {
        await setDoc(doc(db, "users", result.user.uid), {
          id: result.user.uid,
          email: result.user.email ?? "",
          name: result.user.displayName ?? "",
          avatarUrl: result.user.photoURL ?? null,
          createdAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Could not create user doc", e);
      }
      return user;
    }
    
    // Fallback: mock login
    const user: User = {
      id: uid("u"),
      email: `user_${Date.now()}@corechat.local`,
      name: "Demo User",
      avatarUrl: undefined,
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.user, user);
    return user;
  },

  signOut(): void {
    if (auth) {
      import("firebase/auth").then(({ signOut: fbSignOut }) => {
        void fbSignOut(auth);
      });
    }
    storage.remove(STORAGE_KEYS.user);
  },

  current(): User | null {
    return storage.get<User | null>(STORAGE_KEYS.user, null);
  },

  onAuthChange(cb: (user: User | null) => void): () => void {
    if (!auth) {
      const user = this.current();
      cb(user);
      return () => {};
    }

    import("firebase/auth").then(({ onAuthStateChanged }) => {
      const unsub = onAuthStateChanged(auth, (fb) => {
        if (fb) {
          const user = fbUserToUser(fb);
          storage.set(STORAGE_KEYS.user, user);
          cb(user);
        } else {
          storage.remove(STORAGE_KEYS.user);
          cb(null);
        }
      });
      return unsub;
    });

    return () => {};
  },
};

// ─── Chats (localStorage fallback) ────────────────────────────────────────
const MAX_CHATS = 5;
const CHATS_KEY = "chats_v1";

function getChatsFromStorage(): Chat[] {
  return storage.get<Chat[]>(CHATS_KEY, []) || [];
}

function saveChatsToStorage(chats: Chat[]): void {
  storage.set(CHATS_KEY, chats);
}

export const chatService = {
  async list(): Promise<Chat[]> {
    const userId = authService.current()?.id;
    if (!userId) return [];

    // Try Firestore first
    if (db) {
      try {
        const { collection, query, where, orderBy, getDocs, limit } =
          await import("firebase/firestore");
        const q = query(
          collection(db, "chats"),
          where("userId", "==", userId),
          orderBy("updatedAt", "desc"),
          limit(MAX_CHATS)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => d.data() as Chat);
      } catch (e) {
        console.warn("Firestore list failed, using localStorage", e);
      }
    }

    // Fallback: localStorage
    return getChatsFromStorage().filter((c) => c.userId === userId);
  },

  async get(id: string): Promise<Chat | undefined> {
    if (db) {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "chats", id));
        return snap.exists() ? (snap.data() as Chat) : undefined;
      } catch (e) {
        console.warn("Firestore get failed, using localStorage", e);
      }
    }

    const chats = getChatsFromStorage();
    return chats.find((c) => c.id === id);
  },

  async create(personalityId?: string): Promise<Chat> {
    const userId = authService.current()?.id ?? "anon";
    const existing = await this.list();

    // Enforce FIFO
    if (existing.length >= MAX_CHATS) {
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

    if (db) {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "chats", chat.id), chat);
      } catch (e) {
        console.warn("Firestore create failed, using localStorage", e);
        const chats = getChatsFromStorage();
        chats.push(chat);
        saveChatsToStorage(chats);
      }
    } else {
      const chats = getChatsFromStorage();
      chats.push(chat);
      saveChatsToStorage(chats);
    }

    return chat;
  },

  async update(id: string, patch: Partial<Chat>): Promise<void> {
    const updated = { ...patch, updatedAt: new Date().toISOString() };

    if (db) {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "chats", id), updated, { merge: true });
      } catch (e) {
        console.warn("Firestore update failed, using localStorage", e);
        const chats = getChatsFromStorage();
        const idx = chats.findIndex((c) => c.id === id);
        if (idx >= 0) chats[idx] = { ...chats[idx], ...updated };
        saveChatsToStorage(chats);
      }
    } else {
      const chats = getChatsFromStorage();
      const idx = chats.findIndex((c) => c.id === id);
      if (idx >= 0) chats[idx] = { ...chats[idx], ...updated };
      saveChatsToStorage(chats);
    }
  },

  async remove(id: string): Promise<void> {
    if (db) {
      try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "chats", id));
      } catch (e) {
        console.warn("Firestore remove failed, using localStorage", e);
        const chats = getChatsFromStorage();
        saveChatsToStorage(chats.filter((c) => c.id !== id));
      }
    } else {
      const chats = getChatsFromStorage();
      saveChatsToStorage(chats.filter((c) => c.id !== id));
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

// ─── AI provider (modular) ────────────────────────────────────────────────
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

// ─── Personalities (2 defaults + custom) ──────────────────────────────────
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

function getPersonalitiesFromStorage(): Personality[] {
  return storage.get<Personality[]>(PERSONALITIES_KEY, []) || [];
}

function savePersonalitiesToStorage(personalities: Personality[]): void {
  storage.set(PERSONALITIES_KEY, personalities);
}

export const personalityService = {
  async list(): Promise<Personality[]> {
    const userId = authService.current()?.id;
    if (!userId) return DEFAULT_PERSONALITIES;

    if (db) {
      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const q = query(collection(db, "personalities"), where("userId", "==", userId));
        const snap = await getDocs(q);
        const custom = snap.docs.map((d) => d.data() as Personality);
        return [...DEFAULT_PERSONALITIES, ...custom];
      } catch (e) {
        console.warn("Firestore personalities list failed, using localStorage", e);
      }
    }

    const custom = getPersonalitiesFromStorage().filter((p) => p.creator.id === userId);
    return [...DEFAULT_PERSONALITIES, ...custom];
  },

  async get(id: string): Promise<Personality | undefined> {
    const def = DEFAULT_PERSONALITIES.find((p) => p.id === id);
    if (def) return def;

    if (db) {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "personalities", id));
        return snap.exists() ? (snap.data() as Personality) : undefined;
      } catch (e) {
        console.warn("Firestore get personality failed, using localStorage", e);
      }
    }

    return getPersonalitiesFromStorage().find((p) => p.id === id);
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

    if (db) {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "personalities", personality.id), {
          ...personality,
          userId: user?.id ?? "anon",
        });
      } catch (e) {
        console.warn("Firestore create personality failed, using localStorage", e);
        const all = getPersonalitiesFromStorage();
        all.push(personality);
        savePersonalitiesToStorage(all);
      }
    } else {
      const all = getPersonalitiesFromStorage();
      all.push(personality);
      savePersonalitiesToStorage(all);
    }

    return personality;
  },

  async remove(id: string): Promise<void> {
    if (db) {
      try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "personalities", id));
      } catch (e) {
        console.warn("Firestore remove personality failed, using localStorage", e);
        const all = getPersonalitiesFromStorage();
        savePersonalitiesToStorage(all.filter((p) => p.id !== id));
      }
    } else {
      const all = getPersonalitiesFromStorage();
      savePersonalitiesToStorage(all.filter((p) => p.id !== id));
    }
  },
};

// ─── Reports (localStorage fallback) ──────────────────────────────────────
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

    if (db) {
      try {
        const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        await addDoc(collection(db, "reports"), {
          ...report,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore submit report failed, using localStorage", e);
        const reports = storage.get<typeof report[]>(REPORTS_KEY, []) || [];
        reports.push(report);
        storage.set(REPORTS_KEY, reports);
      }
    } else {
      const reports = storage.get<typeof report[]>(REPORTS_KEY, []) || [];
      reports.push(report);
      storage.set(REPORTS_KEY, reports);
    }
  },
};

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
  }
