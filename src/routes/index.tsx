import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";

import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoreChat AI — Your conversations, refined" },
      {
        name: "description",
        content:
          "CoreChat AI: a minimalist black-and-white AI workspace with personalities, history, and beautiful insights.",
      },
      { property: "og:title", content: "CoreChat AI" },
      {
        property: "og:description",
        content: "A minimalist black-and-white AI workspace.",
      },
    ],
  }),
  component: SplashScreen,
});

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/login" }), 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-foreground">
      <motion.div
        className="absolute inset-0 -z-10 [background:radial-gradient(circle_at_50%_50%,var(--color-accent),transparent_60%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <motion.span
            className="absolute inset-0 rounded-3xl cc-pulse-ring border border-foreground/40"
            aria-hidden
          />
          <Logo size={80} />
        </div>
        <div className="text-center">
          <motion.h1
            className="text-3xl font-semibold tracking-tight"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
          >
            CoreChat AI
          </motion.h1>
          <motion.p
            className="mt-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            Conversations, refined.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 flex items-center gap-1.5 text-foreground"
        >
          <span className="cc-typing-dot" />
          <span className="cc-typing-dot" style={{ animationDelay: "0.15s" }} />
          <span className="cc-typing-dot" style={{ animationDelay: "0.3s" }} />
        </motion.div>
      </motion.div>
    </div>
  );
}
