import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Wordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — CoreChat AI" },
      { name: "description", content: "Sign in to your CoreChat AI workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogle() {
    setError(null);
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      navigate({ to: "/chat" });
    } catch (e) {
      setError("Could not sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Wordmark className="mb-10" />
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to continue your conversations.
        </p>

        <div className="mt-8 space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl"
            onClick={onGoogle}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <GoogleIcon /> Continue with Google
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">{children}</div>
      <div className="relative hidden overflow-hidden border-l border-border bg-foreground text-background lg:flex">
        <div className="absolute inset-0 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <Wordmark className="text-background [&_*]:text-background" />
          <motion.blockquote
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-md"
          >
            <p className="text-2xl font-medium leading-snug tracking-tight">
              "The fastest way I've ever moved from a half-formed thought to a finished
              answer. CoreChat just gets out of the way."
            </p>
            <footer className="mt-6 text-sm opacity-70">— Mira K., Product Designer</footer>
          </motion.blockquote>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 size-4">
      <path
        fill="currentColor"
        d="M21.6 12.227c0-.818-.073-1.604-.21-2.36H12v4.46h5.385a4.6 4.6 0 0 1-2 3.022v2.51h3.235c1.89-1.741 2.98-4.305 2.98-7.632Z"
      />
      <path
        fill="currentColor"
        opacity=".7"
        d="M12 22c2.7 0 4.965-.895 6.62-2.42l-3.235-2.51c-.896.6-2.042.955-3.385.955-2.605 0-4.812-1.76-5.6-4.123H3.054v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="currentColor"
        opacity=".5"
        d="M6.4 13.902a6 6 0 0 1 0-3.804V7.508H3.055a10 10 0 0 0 0 8.984L6.4 13.902Z"
      />
      <path
        fill="currentColor"
        opacity=".3"
        d="M12 5.977c1.468 0 2.786.504 3.823 1.494l2.866-2.866C16.96 3.05 14.695 2 12 2A10 10 0 0 0 3.055 7.508L6.4 10.098C7.188 7.736 9.395 5.977 12 5.977Z"
      />
    </svg>
  );
        }
