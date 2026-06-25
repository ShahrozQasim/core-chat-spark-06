import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Flag, MessageSquare, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reportService } from "@/services/api";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — CoreChat AI" },
      { name: "description", content: "Send feedback or report an issue." },
    ],
  }),
  component: ReportsPage,
});

type ReportType = "feedback" | "report";

function ReportsPage() {
  const [selected, setSelected] = useState<ReportType | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!selected || !message.trim()) {
      setError("Please select a type and describe your issue.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await reportService.submit(selected, message.trim());
      setSubmitted(true);
      setMessage("");
      setSelected(null);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Reports</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Share feedback or report an issue with the AI.
      </p>

      <div className="mt-8 space-y-4">
        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setSelected("feedback"); setSubmitted(false); }}
            className={`flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition ${
              selected === "feedback"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:border-foreground/40"
            }`}
          >
            <MessageSquare className="size-6" />
            <span className="text-sm font-semibold">Feedback</span>
            <span className={`text-xs ${selected === "feedback" ? "text-background/70" : "text-muted-foreground"}`}>
              Share thoughts or suggestions
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setSelected("report"); setSubmitted(false); }}
            className={`flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition ${
              selected === "report"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:border-foreground/40"
            }`}
          >
            <Flag className="size-6" />
            <span className="text-sm font-semibold">Report AI</span>
            <span className={`text-xs ${selected === "report" ? "text-background/70" : "text-muted-foreground"}`}>
              Report a problem with AI response
            </span>
          </motion.button>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <label className="block text-sm font-medium">Describe your issue</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              selected === "feedback"
                ? "What would you like to share with us?"
                : selected === "report"
                ? "What went wrong with the AI response?"
                : "Select a type above first…"
            }
            rows={5}
            disabled={!selected}
            className="resize-none"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          {submitted && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-green-600 dark:text-green-400"
            >
              ✓ Submitted successfully. Thank you!
            </motion.p>
          )}

          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || !selected || !message.trim()}
            className="gap-2 rounded-xl"
          >
            <Send className="size-4" />
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
                                        }
