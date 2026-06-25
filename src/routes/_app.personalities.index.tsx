import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { personalityService } from "@/services/api";

export const Route = createFileRoute("/_app/personalities/")({
  head: () => ({
    meta: [
      { title: "AI Personalities — CoreChat AI" },
      {
        name: "description",
        content: "Browse and create AI personalities for every task and tone.",
      },
    ],
  }),
  component: PersonalitiesPage,
});

function PersonalitiesPage() {
  const all = personalityService.list();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    all.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [all]);

  const filtered = useMemo(() => {
    return all.filter((p) => {
      const matchesQ =
        !query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.tagline.toLowerCase().includes(query.toLowerCase());
      const matchesC = active === "All" || p.category === active;
      return matchesQ && matchesC;
    });
  }, [all, query, active]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            AI Personalities
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Pick a voice that fits the task. Each personality has its own tone, expertise, and
            way of thinking — or design your own.
          </p>
        </div>
        <Button asChild className="h-10 gap-2 rounded-xl">
          <Link to="/personalities/new">
            <Plus className="size-4" /> Create personality
          </Link>
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search personalities"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <div className="cc-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                active === c
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground/70 hover:border-foreground/40",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to="/personalities/$id"
              params={{ id: p.id }}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-foreground hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background">
                  {p.avatar}
                </div>
                <Badge variant="outline" className="rounded-full">
                  {p.category}
                </Badge>
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-current" /> {p.rating.toFixed(1)}
                </span>
                <span>{p.chats.toLocaleString()} chats</span>
              </div>
            </Link>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-muted-foreground">
            No personalities match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
