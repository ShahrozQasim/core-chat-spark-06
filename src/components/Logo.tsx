import { cn } from "@/lib/utils";

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl bg-foreground text-background shadow-[0_8px_30px_-6px_rgba(0,0,0,0.4)]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="CoreChat AI"
    >
      <svg
        viewBox="0 0 32 32"
        width={Math.round(size * 0.55)}
        height={Math.round(size * 0.55)}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="16" cy="16" r="10" />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" stroke="none" />
        <path d="M16 2v3M16 27v3M2 16h3M27 16h3" />
      </svg>
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo size={28} />
      <span className="text-base font-semibold tracking-tight">CoreChat AI</span>
    </div>
  );
}
