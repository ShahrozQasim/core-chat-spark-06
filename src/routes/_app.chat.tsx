import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Mic,
  Paperclip,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { Wordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { chatService, personalityService } from "@/services/api";

const searchSchema = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/_app/chat")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Chat — CoreChat AI" }],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  { title: "Draft a launch email", subtitle: "for a minimalist productivity app" },
  { title: "Explain a concept", subtitle: "transformers, like I'm 12" },
  { title: "Plan my week", subtitle: "around 3 deep-work blocks" },
  { title: "Refactor this", subtitle: "TypeScript snippet for clarity" },
];

function ChatPage() {
  const { c: chatId } = Route.useSearch();
  const navigate = useNavigate();
  const { chat, isStreaming, send } = useChat(chatId ?? null);
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const personality = useMemo(
    () => (chat?.personalityId ? personalityService.get(chat.personalityId) : undefined),
    [chat],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length, isStreaming]);

  async function handleSend(text: string) {
    const value = text.trim();
    if (!value) return;
    let id = chatId;
    if (!id) {
      const created = chatService.create();
      id = created.id;
      navigate({ to: "/chat", search: { c: id }, replace: true });
    }
    setDraft("");
    await send(value);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(draft);
    }
  }

  const empty = !chat || chat.messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:h-screen">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <Wordmark className="hidden md:flex" />
          {personality && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs">
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                {personality.avatar}
              </span>
              {personality.name}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {chat?.messages.length ?? 0} messages
        </div>
      </div>

      <div ref={scrollRef} className="cc-scroll flex-1 overflow-y-auto">
        {empty ? (
          <EmptyState onPick={(t) => void handleSend(t)} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:px-8">
            <AnimatePresence initial={false}>
              {chat!.messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex gap-3",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {m.role !== "user" && <Avatar label={personality?.avatar ?? "C"} />}
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-secondary text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-3"
              >
                <Avatar label={personality?.avatar ?? "C"} />
                <div className="flex items-center gap-1 rounded-2xl bg-secondary px-4 py-3 text-foreground">
                  <span className="cc-typing-dot" />
                  <span className="cc-typing-dot" style={{ animationDelay: "0.15s" }} />
                  <span className="cc-typing-dot" style={{ animationDelay: "0.3s" }} />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm focus-within:border-foreground">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={() => undefined}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
            >
              <Paperclip className="size-4" />
            </Button>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message CoreChat…"
              rows={1}
              className="max-h-48 min-h-9 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm shadow-none focus-visible:ring-0"
            />
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative size-9 shrink-0",
                recording && "text-foreground",
              )}
              onClick={() => setRecording((r) => !r)}
              aria-label={recording ? "Stop recording" : "Start voice input"}
            >
              <Mic className="size-4" />
              {recording && (
                <span className="absolute inset-0 rounded-full border border-foreground cc-pulse-ring" />
              )}
            </Button>
            <Button
              size="icon"
              className="size-9 shrink-0 rounded-xl"
              onClick={() => void handleSend(draft)}
              disabled={!draft.trim() || isStreaming}
              aria-label="Send message"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            CoreChat may produce inaccurate information. Verify important answers.
          </p>
        </div>
      </div>
    </div>
  );
}

function Avatar({ label }: { label: string }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
      {label}
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center md:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex size-14 items-center justify-center rounded-2xl bg-foreground text-background"
      >
        <Sparkles className="size-6" />
      </motion.div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        What would you like to do today?
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask anything, brainstorm, or pick one of the prompts below to get going.
      </p>

      <div className="mt-10 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            onClick={() => onPick(`${s.title} — ${s.subtitle}`)}
            className="rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-foreground hover:shadow-sm"
          >
            <p className="text-sm font-medium">{s.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.subtitle}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
