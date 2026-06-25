import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useState } from "react";

import { Wordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setLoading(true);
    try {
      await authService.signIn(email, password);
      navigate({ to: "/chat" });
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      navigate({ to: "/chat" });
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

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@corechat.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-9"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Sign in <ArrowRight className="ml-1 size-4" />
              </>
            )}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          OR
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl"
          onClick={onGoogle}
          disabled={loading}
        >
          <GoogleIcon /> Continue with Google
        </Button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
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
              “The fastest way I've ever moved from a half-formed thought to a finished
              answer. CoreChat just gets out of the way.”
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
    <svg viewBox="0 0 24 24" className="size-4">
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
