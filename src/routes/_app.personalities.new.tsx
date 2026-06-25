import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { personalityService } from "@/services/api";

const CATEGORIES = ["Engineering", "Writing", "Wellness", "Business", "Education", "Other"];

export const Route = createFileRoute("/_app/personalities/new")({
  head: () => ({ meta: [{ title: "New personality — CoreChat AI" }] }),
  component: NewPersonality,
});

function NewPersonality() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !tagline.trim() || !systemPrompt.trim()) {
      setError("Name, tagline, and system instructions are required.");
      return;
    }
    const p = personalityService.create({
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim() || tagline.trim(),
      avatar: name.trim().charAt(0).toUpperCase(),
      category,
      isPublic,
      systemPrompt: systemPrompt.trim(),
    });
    navigate({ to: "/personalities/$id", params: { id: p.id } });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <Link
        to="/personalities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Create a personality
            </h1>
            <p className="text-sm text-muted-foreground">
              Define a voice, expertise, and tone — then chat with it like any other.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Atlas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              placeholder="A one-line description"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell people what this personality is great at."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">System instructions</Label>
            <Textarea
              id="prompt"
              placeholder='e.g. "You are Atlas, a senior software architect…"'
              rows={5}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
            <div>
              <p className="text-sm font-medium">Make public</p>
              <p className="text-xs text-muted-foreground">
                Public personalities appear in the gallery for everyone.
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button asChild type="button" variant="outline" className="rounded-xl">
              <Link to="/personalities">Cancel</Link>
            </Button>
            <Button type="submit" className="rounded-xl">
              Create personality
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
