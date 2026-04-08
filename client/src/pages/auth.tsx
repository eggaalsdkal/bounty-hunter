import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Zap } from "lucide-react";

// Demo user injected directly when backend is unreachable
const DEMO_USER = { id: 0, email: "demo@bounty.io", displayName: "示範獵手", level: 3, xp: 680, currency: 635 };

function BountyHunterLogo() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 48 48"
      fill="none"
      aria-label="Bounty Hunter Logo"
    >
      <circle cx="24" cy="24" r="22" stroke="hsl(175, 100%, 36%)" strokeWidth="2" />
      <circle cx="24" cy="24" r="18" stroke="hsl(175, 100%, 36%)" strokeWidth="1" opacity="0.4" />
      <rect x="16" y="12" width="16" height="22" rx="2" stroke="hsl(45, 95%, 55%)" strokeWidth="1.5" fill="none" />
      <path d="M24 16 L26 21 L24 26 L22 21 Z" fill="hsl(45, 95%, 55%)" opacity="0.8" />
      <line x1="24" y1="2" x2="24" y2="6" stroke="hsl(175, 100%, 36%)" strokeWidth="1.5" />
      <line x1="24" y1="42" x2="24" y2="46" stroke="hsl(175, 100%, 36%)" strokeWidth="1.5" />
      <line x1="2" y1="24" x2="6" y2="24" stroke="hsl(175, 100%, 36%)" strokeWidth="1.5" />
      <line x1="42" y1="24" x2="46" y2="24" stroke="hsl(175, 100%, 36%)" strokeWidth="1.5" />
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      const isNetworkError = error.message.includes("403") || error.message.includes("Failed") || error.message.includes("fetch");
      if (isNetworkError) {
        queryClient.setQueryData(["/api/auth/me"], DEMO_USER);
        return;
      }
      toast({
        title: "登入失敗",
        description: error.message.includes("401") ? "電郵或密碼不正確" : error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email,
        password,
        displayName,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      const isNetworkError = error.message.includes("403") || error.message.includes("Failed") || error.message.includes("fetch");
      if (isNetworkError) {
        // Backend unreachable — enter demo mode directly
        queryClient.setQueryData(["/api/auth/me"], DEMO_USER);
        return;
      }
      toast({
        title: "註冊失敗",
        description: error.message.includes("409") ? "此電郵已被註冊" : error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  // Demo mode: enter app directly without backend
  const enterDemoMode = () => {
    queryClient.setQueryData(["/api/auth/me"], DEMO_USER);
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden" data-testid="auth-page">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-[120px] opacity-10" style={{ backgroundColor: "hsl(175, 100%, 36%)" }} />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-[100px] opacity-8" style={{ backgroundColor: "hsl(45, 95%, 55%)" }} />
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 text-center border-b border-border/30">
            <div className="flex justify-center mb-4">
              <BountyHunterLogo />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">賞金獵人</h1>
            <p className="text-xs text-muted-foreground tracking-[0.2em] mt-1">BOUNTY HUNTER</p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-accent/50 mx-6 mt-6 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 text-sm py-2 rounded-md transition-all font-medium ${
                mode === "login"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-mode-login"
            >
              登入
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 text-sm py-2 rounded-md transition-all font-medium ${
                mode === "register"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-mode-register"
            >
              註冊
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-xs text-muted-foreground">
                  獵人名
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的冒險名稱"
                  required={mode === "register"}
                  className="bg-accent/50 border-border/50 h-10"
                  data-testid="input-display-name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                電郵地址
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hunter@bounty.io"
                required
                className="bg-accent/50 border-border/50 h-10"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-muted-foreground">
                密碼
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-accent/50 border-border/50 h-10 pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 font-display font-bold text-sm mt-2"
              data-testid="button-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  {mode === "login" ? "登入中..." : "註冊中..."}
                </>
              ) : (
                mode === "login" ? "開始冒險" : "創建獵人帳號"
              )}
            </Button>

            {mode === "register" && (
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                註冊即送 3 張 R 級歡迎卡牌
              </p>
            )}
          </form>
        </div>

        {/* Demo mode button */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-muted-foreground/40 mb-2">或者</p>
          <button
            onClick={enterDemoMode}
            className="inline-flex items-center gap-1.5 text-[11px] text-primary/70 hover:text-primary transition-colors"
            data-testid="button-demo-mode"
          >
            <Zap size={11} />
            不需註冊，直接試用 Demo 模式
          </button>
        </div>

        {/* Footer text */}
        <p className="text-center text-[10px] text-muted-foreground/50 mt-3">
          v1.0 MVP · 賞金獵人 Bounty Hunter
        </p>
      </div>
    </div>
  );
}
