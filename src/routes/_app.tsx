import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/api";
import { Menu } from "lucide-react";
import { Wordmark } from "@/components/Logo";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!authService.current()) {
      navigate({ to: "/login" });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
          <Wordmark />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </header>
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { Link };
