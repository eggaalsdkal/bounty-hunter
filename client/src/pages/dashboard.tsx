import { BookOpen, Palette, Code2, TrendingUp, Zap, Crown, CheckCircle, Circle, Scroll, CreditCard, Activity, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { playerProfile, regions, dailyQuests, recentActivity } from "@/lib/data";

const iconMap: Record<string, typeof BookOpen> = {
  BookOpen, Palette, Code2, TrendingUp, Zap, Crown,
};

const activityIcons: Record<string, typeof Scroll> = {
  quest: Scroll,
  card: CreditCard,
  level: Activity,
  achievement: Award,
};

export default function Dashboard() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6" data-testid="dashboard-page">
      {/* Top bar - Player stats */}
      <div className="flex items-center justify-between bg-card rounded-xl border border-border p-4" data-testid="player-stats-bar">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <BookOpen size={20} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-foreground" data-testid="text-hunter-name">{playerProfile.hunterName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                Lv.{playerProfile.level} {playerProfile.levelTitle}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(playerProfile.xp / playerProfile.xpMax) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">{playerProfile.xp}/{playerProfile.xpMax} XP</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gold font-display font-bold" data-testid="text-currency">
          <span className="text-lg">HK${playerProfile.currency.toLocaleString()}</span>
        </div>
      </div>

      {/* Page title */}
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">任務大陸</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Quest Continent — 選擇你的冒險區域</p>
      </div>

      {/* Region grid */}
      <div className="grid grid-cols-3 gap-4" data-testid="region-grid">
        {regions.map((region) => {
          const Icon = iconMap[region.icon] || BookOpen;
          const isLegend = region.name === '傳說聖域';
          return (
            <div
              key={region.name}
              className={`region-card relative rounded-xl border p-5 cursor-pointer overflow-hidden ${
                isLegend
                  ? 'border-gold/40'
                  : 'border-border hover:border-primary/30'
              }`}
              style={{
                backgroundColor: '#1a2030',
                backgroundImage: `radial-gradient(ellipse at bottom right, ${region.color}15 0%, transparent 60%)`,
                boxShadow: isLegend ? `0 0 24px rgba(255,215,0,0.12), inset 0 0 40px rgba(255,215,0,0.03)` : undefined,
              }}
              data-testid={`region-card-${region.en.toLowerCase().replace(/[^a-z]/g, '-')}`}
            >
              {/* Region glow */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-15"
                style={{ backgroundColor: region.color }}
              />
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${region.color}22` }}
                >
                  <Icon size={20} style={{ color: region.color }} />
                </div>
                <h3 className="font-display font-bold text-sm text-foreground">{region.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{region.en} · {region.desc}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-[11px] text-muted-foreground">
                    進行中任務 <span className="text-foreground font-medium">{region.quests}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Lv.<span className="text-foreground font-medium">{region.playerLevel}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom section: Daily quests + Activity */}
      <div className="grid grid-cols-2 gap-4">
        {/* Daily Quests */}
        <div className="bg-card rounded-xl border border-border p-5" data-testid="daily-quests">
          <h3 className="font-display font-bold text-sm text-foreground mb-4">每日任務</h3>
          <div className="space-y-3">
            {dailyQuests.map((dq) => (
              <div key={dq.id} className="flex items-center gap-3" data-testid={`daily-quest-${dq.id}`}>
                {dq.completed ? (
                  <CheckCircle size={18} className="text-primary flex-shrink-0" />
                ) : (
                  <Circle size={18} className="text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${dq.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {dq.title}
                  </p>
                </div>
                <span className="text-[11px] text-primary flex-shrink-0">{dq.reward}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">完成進度</span>
              <span className="text-foreground font-medium">2/3</span>
            </div>
            <Progress value={66} className="mt-1.5 h-1.5" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-5" data-testid="recent-activity">
          <h3 className="font-display font-bold text-sm text-foreground mb-4">最近動態</h3>
          <div className="space-y-3">
            {recentActivity.map((item) => {
              const Icon = activityIcons[item.type] || Activity;
              return (
                <div key={item.id} className="flex items-start gap-3" data-testid={`activity-${item.id}`}>
                  <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
