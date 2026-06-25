// CoreChat AI — shared domain types. Database-ready shapes.

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  personalityId?: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Personality {
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatar: string; // emoji or initial
  category: string;
  rating: number;
  chats: number;
  isPublic: boolean;
  systemPrompt: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

export interface Report {
  totalChats: number;
  totalMessages: number;
  tokensUsed: number;
  favoritePersonality: string;
  dailyActivity: { day: string; chats: number; messages: number }[];
  categoryUsage: { name: string; value: number }[];
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  goal: number;
}

export interface ChatRequest {
  chatId: string;
  message: string;
  personalityId?: string;
  history: { role: Message["role"]; content: string }[];
}

export interface ChatResponse {
  message: Message;
}
