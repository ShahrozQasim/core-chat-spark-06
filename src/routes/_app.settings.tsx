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

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "hi", label: "हिन्दी" },
  { code: "tr", label: "Türkçe" },
  { code: "ko", label: "한국어" },
];

// Simple UI label translations for instant feedback
const UI_LABELS: Record<string, Record<string, string>> = {
  en: { settings: "Settings", tune: "Tune the experience to your preferences.", appearance: "Appearance", theme: "Theme", language: "Language", notifications: "Notifications", push: "Push notifications", data: "Data", deleteChats: "Delete all chats", account: "Account", signOut: "Sign out", deleteDesc: "Permanently removes your chat history from this device.", signOutDesc: "End your session on this device.", pushDesc: "Get notified when replies arrive or workflows finish.", light: "Light", dark: "Dark", deleteBtn: "Delete chats", logoutBtn: "Log out", langDesc: "The default language for the interface.", themeDesc: "Pick how CoreChat looks. Affects every page." },
  es: { settings: "Configuración", tune: "Ajusta la experiencia a tus preferencias.", appearance: "Apariencia", theme: "Tema", language: "Idioma", notifications: "Notificaciones", push: "Notificaciones push", data: "Datos", deleteChats: "Eliminar todos los chats", account: "Cuenta", signOut: "Cerrar sesión", deleteDesc: "Elimina permanentemente tu historial de chats.", signOutDesc: "Termina tu sesión en este dispositivo.", pushDesc: "Recibe notificaciones cuando lleguen respuestas.", light: "Claro", dark: "Oscuro", deleteBtn: "Eliminar chats", logoutBtn: "Cerrar sesión", langDesc: "El idioma predeterminado para la interfaz.", themeDesc: "Elige cómo se ve CoreChat." },
  fr: { settings: "Paramètres", tune: "Personnalisez l'expérience selon vos préférences.", appearance: "Apparence", theme: "Thème", language: "Langue", notifications: "Notifications", push: "Notifications push", data: "Données", deleteChats: "Supprimer tous les chats", account: "Compte", signOut: "Se déconnecter", deleteDesc: "Supprime définitivement votre historique de chats.", signOutDesc: "Terminer votre session sur cet appareil.", pushDesc: "Soyez notifié quand les réponses arrivent.", light: "Clair", dark: "Sombre", deleteBtn: "Supprimer chats", logoutBtn: "Se déconnecter", langDesc: "La langue par défaut pour l'interface.", themeDesc: "Choisissez l'apparence de CoreChat." },
  de: { settings: "Einstellungen", tune: "Passen Sie die Erfahrung Ihren Vorlieben an.", appearance: "Erscheinungsbild", theme: "Design", language: "Sprache", notifications: "Benachrichtigungen", push: "Push-Benachrichtigungen", data: "Daten", deleteChats: "Alle Chats löschen", account: "Konto", signOut: "Abmelden", deleteDesc: "Löscht Ihren Chat-Verlauf dauerhaft.", signOutDesc: "Beenden Sie Ihre Sitzung auf diesem Gerät.", pushDesc: "Benachrichtigungen erhalten wenn Antworten eintreffen.", light: "Hell", dark: "Dunkel", deleteBtn: "Chats löschen", logoutBtn: "Abmelden", langDesc: "Die Standardsprache für die Benutzeroberfläche.", themeDesc: "Wählen Sie das Aussehen von CoreChat." },
  ar: { settings: "الإعدادات", tune: "ضبط التجربة وفق تفضيلاتك.", appearance: "المظهر", theme: "السمة", language: "اللغة", notifications: "الإشعارات", push: "إشعارات الدفع", data: "البيانات", deleteChats: "حذف جميع المحادثات", account: "الحساب", signOut: "تسجيل الخروج", deleteDesc: "يحذف محفوظات المحادثات نهائياً.", signOutDesc: "إنهاء جلستك على هذا الجهاز.", pushDesc: "الحصول على إشعارات عند وصول الردود.", light: "فاتح", dark: "داكن", deleteBtn: "حذف المحادثات", logoutBtn: "تسجيل الخروج", langDesc: "اللغة الافتراضية للواجهة.", themeDesc: "اختر كيف يبدو CoreChat." },
};

function t(lang: string, key: string): string {
  const code = LANGUAGES.find((l) => l.label === lang)?.code ?? "en";
  return UI_LABELS[code]?.[key] ?? UI_LABELS["en"]?.[key] ?? key;
}

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
    // Apply RTL for Arabic
    document.documentElement.dir =
      LANGUAGES.find((l) => l.label === settings.language)?.code === "ar" ? "rtl" : "ltr";
  }, [settings]);

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function deleteAllChats() {
    if (!confirm(t(settings.language, "deleteChats") + "?")) return;
    await chatService.clearAll();
  }

  function logout() {
    authService.signOut();
    navigate({ to: "/login" });
  }

  const lang = settings.language;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {t(lang, "settings")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t(lang, "tune")}</p>

      <div className="mt-8 space-y-4">
        <Section title={t(lang, "appearance")}>
          <Row label={t(lang, "theme")} description={t(lang, "themeDesc")}>
            <div className="flex gap-1.5 rounded-xl border border-border bg-card p-1">
              <ThemeButton
                active={settings.theme === "light"}
                onClick={() => update("theme", "light")}
              >
                <Sun className="size-4" /> {t(lang, "light")}
              </ThemeButton>
              <ThemeButton
                active={settings.theme === "dark"}
                onClick={() => update("theme", "dark")}
              >
                <Moon className="size-4" /> {t(lang, "dark")}
              </ThemeButton>
            </div>
          </Row>

          <Row label={t(lang, "language")} description={t(lang, "langDesc")} icon={Globe}>
            <select
              value={settings.language}
              onChange={(e) => update("language", e.target.value)}
              className="flex h-10 w-48 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.label}>
                  {l.label}
                </option>
              ))}
            </select>
          </Row>
        </Section>

        <Section title={t(lang, "notifications")}>
          <Row label={t(lang, "push")} description={t(lang, "pushDesc")} icon={Bell}>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(v) => update("notifications", v)}
            />
          </Row>
        </Section>

        <Section title={t(lang, "data")}>
          <Row label={t(lang, "deleteChats")} description={t(lang, "deleteDesc")}>
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              onClick={() => void deleteAllChats()}
            >
              <Trash2 className="size-4" /> {t(lang, "deleteBtn")}
            </Button>
          </Row>
        </Section>

        <Section title={t(lang, "account")}>
          <Row label={t(lang, "signOut")} description={t(lang, "signOutDesc")}>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={logout}>
              <LogOut className="size-4" /> {t(lang, "logoutBtn")}
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
                                             
