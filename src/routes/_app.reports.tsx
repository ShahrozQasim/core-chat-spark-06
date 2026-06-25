import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, Flame, MessageSquare, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { reportService } from "@/services/api";
import type { Report } from "@/lib/types";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Report card — CoreChat AI" },
      { name: "description", content: "Your AI usage at a glance." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    void reportService.get().then(setReport);
  }, []);

  if (!report) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">Loading report…</div>
    );
  }

  const stats = [
    {
      label: "Total chats",
      value: report.totalChats.toLocaleString(),
      icon: MessageSquare,
    },
    {
      label: "Messages",
      value: report.totalMessages.toLocaleString(),
      icon: Sparkles,
    },
    {
      label: "Tokens used",
      value: `${(report.tokensUsed / 1000).toFixed(1)}k`,
      icon: Zap,
    },
    {
      label: "Top personality",
      value: report.favoritePersonality,
      icon: Flame,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Report card</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A snapshot of how you've been using CoreChat this week.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.35 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <s.icon className="size-3.5" /> {s.label}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Daily activity" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={report.dailyActivity} margin={{ top: 10, right: 16, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="var(--color-foreground)"
                strokeWidth={2.2}
                dot={{ r: 3, fill: "var(--color-foreground)" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="chats"
                stroke="var(--color-muted-foreground)"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category mix">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Pie
                data={report.categoryUsage}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                stroke="var(--color-background)"
              >
                {report.categoryUsage.map((_, i) => (
                  <Cell
                    key={i}
                    fill={[
                      "var(--color-chart-1)",
                      "var(--color-chart-2)",
                      "var(--color-chart-3)",
                      "var(--color-chart-4)",
                      "var(--color-chart-5)",
                    ][i % 5]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {report.categoryUsage.map((c, i) => (
              <li key={c.name} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{
                      background: [
                        "var(--color-chart-1)",
                        "var(--color-chart-2)",
                        "var(--color-chart-3)",
                        "var(--color-chart-4)",
                        "var(--color-chart-5)",
                      ][i % 5],
                    }}
                  />
                  {c.name}
                </span>
                <span>{c.value}%</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Chats per day" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={report.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="chats" fill="var(--color-foreground)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Achievements
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.achievements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.35 }}
              className={cn(
                "rounded-2xl border border-border bg-card p-5",
                !a.unlocked && "opacity-90",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    a.unlocked
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground/70",
                  )}
                >
                  <Award className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                  <div className="mt-3">
                    <Progress value={Math.min(100, (a.progress / a.goal) * 100)} className="h-1.5" />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {a.progress} / {a.goal}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
