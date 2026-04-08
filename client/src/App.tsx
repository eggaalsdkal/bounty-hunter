import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import QuestBoard from "@/pages/quest-board";
import CardCollection from "@/pages/card-collection";
import Profile from "@/pages/profile";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  level: number;
  xp: number;
  currency: number;
}

// Demo user used when backend is unreachable
const DEMO_USER: AuthUser = {
  id: 0,
  email: "demo@bounty.io",
  displayName: "示範獵手",
  level: 3,
  xp: 680,
  currency: 635,
};

function useAuth() {
  return useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const fn = getQueryFn({ on401: "returnNull" });
        const result = await (fn as any)({ queryKey: ["/api/auth/me"] });
        return result;
      } catch {
        // Backend unreachable — use demo user so app is always testable
        return DEMO_USER;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

function AppRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/quests" component={QuestBoard} />
        <Route path="/cards" component={CardCollection} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function AuthGuard() {
  const { data: user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <AppRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AuthGuard />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
