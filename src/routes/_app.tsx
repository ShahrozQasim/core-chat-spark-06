import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/api";
import { Menu, Loader2 } from "lucide-react";
import { Wordmark } from "@/components/Logo";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  
  // CRITICAL FIX: Pehle check karo agar local storage mein user pehle se hai
  const [ready, setReady] = useState(() => !!authService.current());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = authService.onAuthChange((user) => {
      if (!user) {
        // Agar real mein user logout ho jaye tabhi login par bhejo
        void navigate({ to: "/login", replace: true });
      } else {
        setReady(true);
      }
    });
    return unsubscribe;
  }, [navigate]);

  // Loading state jab tak sync chal raha ho
  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-foreground" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

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
