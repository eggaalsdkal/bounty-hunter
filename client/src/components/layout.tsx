import { Link, useLocation } from "wouter";
import { Map, ClipboardList, BookOpen, User, Settings } from "lucide-react";

const navItems = [
  { path: "/", label: "任務大陸", en: "Dashboard", icon: Map },
  { path: "/quests", label: "任務看板", en: "Bounty Board", icon: ClipboardList },
  { path: "/cards", label: "卡牌圖鑑", en: "Cards", icon: BookOpen },
  { path: "/profile", label: "獵人檔案", en: "Profile", icon: User },
];

function BountyHunterLogo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 48 48"
      fill="none"
      aria-label="Bounty Hunter Logo"
    >
      {/* Compass outer ring */}
      <circle cx="24" cy="24" r="22" stroke="hsl(175, 100%, 36%)" strokeWidth="2" />
      <circle cx="24" cy="24" r="18" stroke="hsl(175, 100%, 36%)" strokeWidth="1" opacity="0.4" />
      {/* Card shape in center */}
      <rect x="16" y="12" width="16" height="22" rx="2" stroke="hsl(45, 95%, 55%)" strokeWidth="1.5" fill="none" />
      {/* Star/compass point on card */}
      <path d="M24 16 L26 21 L24 26 L22 21 Z" fill="hsl(45, 95%, 55%)" opacity="0.8" />
      {/* Compass points */}
      <line x1="24" y1="2" x2="24" y2="6" stroke="hsl(175, 100%, 36%)" strokeWidth="1.5" />
      <line x1="24" y1="42" x2="24" y2="46" stroke="hsl(175, 100%, 36%)" strokeWidth="1.5" />
      <line x1="2" y1="24" x2="6" y2="24" stroke="hsl(175, 100%, 36%)" strokeWidth="1.5" />
      <line x1="42" y1="24" x2="46" y2="24" stroke="hsl(175, 100%, 36%)" strokeWidth="1.5" />
    </svg>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-testid="app-layout">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border" data-testid="sidebar">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <BountyHunterLogo />
          <div>
            <h1 className="font-display text-sm font-bold text-foreground leading-tight">賞金獵人</h1>
            <p className="text-[10px] text-muted-foreground tracking-wider">BOUNTY HUNTER</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  data-testid={`nav-${item.en.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Settings size={14} />
            <span className="text-xs">設定</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50">v1.0 MVP</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
