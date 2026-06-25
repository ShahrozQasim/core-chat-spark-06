import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Lock, MessageSquarePlus, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { chatService, personalityService } from "@/services/api";

export const Route = createFileRoute("/_app/personalities/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Personality — CoreChat AI` }, { name: "personality-id", content: params.id }],
  }),
  component: PersonalityDetail,
  notFoundComponent: () => (
    <div className="p-12 text-center text-sm text-muted-foreground">Personality not found.</div>
  ),
});

function PersonalityDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const personality = personalityService.get(id);

  if (!personality) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-xl font-semibold">Personality not found</h2>
        <Button asChild className="mt-6">
          <Link to="/personalities">Back to personalities</Link>
        </Button>
      </div>
    );
  }

  function startChat() {
    const chat = chatService.create(personality!.id);
    navigate({ to: "/chat", search: { c: chat.id } });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <Link
        to="/personalities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All personalities
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-foreground text-background"
      >
        <div className="absolute inset-0 [background:radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.15),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="relative grid grid-cols-1 gap-6 px-6 py-10 md:grid-cols-[auto_1fr] md:px-12 md:py-14">
          <div className="flex size-24 items-center justify-center rounded-3xl bg-background text-3xl font-semibold text-foreground">
            {personality.avatar}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-background/40 text-background">
                {personality.category}
              </Badge>
              {personality.isPublic ? (
                <Badge variant="outline" className="border-background/40 text-background">
                  <Globe className="mr-1 size-3" /> Public
                </Badge>
              ) : (
                <Badge variant="outline" className="border-background/40 text-background">
                  <Lock className="mr-1 size-3" /> Private
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {personality.name}
            </h1>
            <p className="mt-2 max-w-2xl text-base opacity-80">{personality.tagline}</p>
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={startChat}
                className="h-11 gap-2 rounded-xl bg-background text-foreground hover:bg-background/90"
              >
                <MessageSquarePlus className="size-4" /> Start chat
              </Button>
              <div className="flex items-center gap-1 text-sm">
                <Star className="size-4 fill-current" /> {personality.rating.toFixed(1)} ·{" "}
                {personality.chats.toLocaleString()} chats
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            About
          </h2>
          <p className="mt-3 text-base leading-relaxed text-foreground/90">
            {personality.description}
          </p>

          <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            System instructions
          </h2>
          <pre className="cc-scroll mt-3 overflow-x-auto rounded-2xl border border-border bg-secondary p-4 text-sm leading-relaxed">
            {personality.systemPrompt}
          </pre>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Creator
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                {personality.creator.avatar}
              </div>
              <div>
                <p className="text-sm font-medium">{personality.creator.name}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(personality.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stats
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Rating</dt>
                <dd>{personality.rating.toFixed(1)} / 5</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Conversations</dt>
                <dd>{personality.chats.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Visibility</dt>
                <dd>{personality.isPublic ? "Public" : "Private"}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
