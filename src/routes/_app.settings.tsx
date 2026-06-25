import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Globe, LogOut, Moon, Sun, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { storage } from "@/lib/storage";
import { authService, chatService } from "@/services/api";

interface SettingsState {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  theme: "light",
  language: "English",
  notifications: true,
};

const LANGUAGES = ["English", "Español", "Français", "Deutsch", "日本語", "العربية"];

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — CoreChat AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(storage.get("settings", DEFAULT_SETTINGS));
  }, []);

  useEffect(() => {
    storage.set("settings", settings);
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings]);

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function deleteAllChats() {
    if (!confirm("Delete every chat? This cannot be undone.")) return;
    chatService.clearAll();
  }

  function logout() {
    authService.signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tune the experience to your preferences.
      </p>

      <div className="mt-8 space-y-4">
        <Section title="Appearance">
          <Row
            label="Theme"
            description="Pick how CoreChat looks. Affects every page."
          >
            <div className="flex gap-1.5 rounded-xl border border-border bg-card p-1">
              <ThemeButton
                active={settings.theme === "light"}
                onClick={() => update("theme", "light")}
              >
                <Sun className="size-4" /> Light
              </ThemeButton>
              <ThemeButton
                active={settings.theme === "dark"}
                onClick={() => update("theme", "dark")}
              >
                <Moon className="size-4" /> Dark
              </ThemeButton>
            </div>
          </Row>

          <Row
            label="Language"
            description="The default language for the interface."
            icon={Globe}
          >
            <select
              value={settings.language}
              onChange={(e) => update("language", e.target.value)}
              className="flex h-10 w-44 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Row>
        </Section>

        <Section title="Notifications">
          <Row
            label="Push notifications"
            description="Get notified when replies arrive or workflows finish."
            icon={Bell}
          >
            <Switch
              checked={settings.notifications}
              onCheckedChange={(v) => update("notifications", v)}
            />
          </Row>
        </Section>

        <Section title="Data">
          <Row
            label="Delete all chats"
            description="Permanently removes your chat history from this device."
          >
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              onClick={deleteAllChats}
            >
              <Trash2 className="size-4" /> Delete chats
            </Button>
          </Row>
        </Section>

        <Section title="Account">
          <Row label="Sign out" description="End your session on this device.">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={logout}>
              <LogOut className="size-4" /> Log out
            </Button>
          </Row>
        </Section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <Wordmark />
          <p className="mt-3 text-sm text-muted-foreground">
            CoreChat AI · Version 1.0.0 · A minimalist, production-ready AI workspace.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <h2 className="border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({
  label,
  description,
  children,
  icon: Icon,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-secondary text-foreground">
            <Icon className="size-4" />
          </div>
        )}
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ThemeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
