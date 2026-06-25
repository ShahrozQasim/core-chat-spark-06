import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { personalityService } from "@/services/api";
import type { Personality } from "@/lib/types";

export const Route = createFileRoute("/_app/personalities/")({
  head: () => ({
    meta: [
      { title: "AI Personalities — CoreChat AI" },
      { name: "description", content: "Choose or create your AI personality." },
    ],
  }),
  component: PersonalitiesPage,
});

function PersonalitiesPage() {
  const navigate = useNavigate();
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const list = await personalityService.list();
    setPersonalities(list);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this personality?")) return;
    await personalityService.remove(id);
    await load();
  }

  async function handleStartChat(personalityId: string) {
    const chat = await personalityService.get(personalityId);
    if (!chat) return;
    const { chatService } = await import("@/services/api");
    const newChat = await chatService.create(personalityId);
    navigate({ to: "/chat", search: { c: newChat.id } });
  }

  const defaults = personalities.filter((p) => p.category === "Default");
  const custom = personalities.filter((p) => p.category !== "Default");

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">Loading personalities…</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            AI Personalities
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Pick a voice that fits the task, or create your own.
          </p>
        </div>
        <Button asChild className="h-10 gap-2 rounded-xl">
          <Link to="/personalities/new">
            <Plus className="size-4" /> Create personality
          </Link>
        </Button>
      </div>

      {/* Default personalities */}
      <div className="mt-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Default
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {defaults.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i, duration: 0.4 }}
            >
              <button
                onClick={() => void handleStartChat(p.id)}
                className="group flex h-full w-full flex-col rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-foreground hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-2xl text-background">
                    {p.avatar}
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {p.category}
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.tagline}</p>
                <p className="mt-3 text-xs text-muted-foreground/70">Click to start chat →</p>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Custom personalities */}
      <div className="mt-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your custom personalities
        </h2>
        {custom.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No custom personalities yet.{" "}
            <Link to="/personalities/new" className="underline underline-offset-4 hover:text-foreground">
              Create one
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {custom.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.4 }}
                className="group relative"
              >
                <button
                  onClick={() => void handleStartChat(p.id)}
                  className="flex h-full w-full flex-col rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-foreground hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background">
                      {p.avatar}
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      Custom
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.tagline}</p>
                  <p className="mt-3 text-xs text-muted-foreground/70">Click to start chat →</p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(p.id);
                  }}
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-background hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete personality"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
                        }
