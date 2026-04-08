import { useState, useMemo } from "react";
import { BookOpen, Star, Shield, Moon, Plus, TrendingUp, Clock, Brain, Focus, Dumbbell, Code, Heart, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  playerProfile, questHistory, calculateStats, getStatBreakdown,
} from "@/lib/data";

const statMeta: Record<string, { label: string; desc: string; icon: typeof Brain; color: string }> = {
  INT: { label: '智力', desc: '用腦解決問題嘅能力 — 文案、翻譯、分析、策略任務越多越高', icon: Brain, color: '#60a5fa' },
  FOC: { label: '專注', desc: '攝影同拍照嘅專注力 — 攝影、剪接、拍照任務越多越高', icon: Focus, color: '#a855f7' },
  STR: { label: '體力', desc: '體力同耐力 — 現場任務、體力勞動越多越高', icon: Dumbbell, color: '#ef4444' },
  LOG: { label: '邏輯', desc: 'IT同編程能力 — 數據、編程、分析任務越多越高', icon: Code, color: '#0ea5e9' },
  HP: { label: '血量', desc: '每日任務工時累積 — 每日做得越耐血量越多', icon: Heart, color: '#4ade80' },
  CHA: { label: '魅力', desc: '外在吸引力 — MODEL、試鏡、推廣、銷售任務越多越高', icon: Sparkles, color: '#fbbf24' },
};

interface ProfileData {
  displayName: string;
  level: number;
  xp: number;
  xpMax: number;
  currency: number;
  stats: Record<string, number>;
  completedQuests: number;
  totalEarnings: number;
  avgRating: number;
  activeDays: number;
  ownedCards: number;
  totalHours: number;
  questHistoryCount: number;
}

interface StatsData {
  stats: Record<string, number>;
  breakdown: Record<string, { fromQuests: string; totalHours: number; questCount: number }>;
}

export default function Profile() {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["/api/profile/stats"],
  });

  // Fallback static data
  const fallbackStats = useMemo(() => calculateStats(questHistory), []);
  const fallbackBreakdown = useMemo(() => getStatBreakdown(questHistory), []);
  const fallbackTotalHours = useMemo(
    () => Math.round(questHistory.reduce((s, q) => s + q.hoursSpent, 0) * 10) / 10,
    [],
  );

  if ((profileLoading || statsLoading) && !profile && !statsData) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-5">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const p = profile || {
    displayName: playerProfile.hunterName,
    level: playerProfile.level,
    xp: playerProfile.xp,
    xpMax: playerProfile.xpMax,
    currency: playerProfile.currency,
    stats: fallbackStats,
    completedQuests: playerProfile.completedQuests,
    totalEarnings: playerProfile.totalEarnings,
    avgRating: playerProfile.avgRating,
    activeDays: playerProfile.activeDays,
    ownedCards: playerProfile.ownedCards,
    totalHours: fallbackTotalHours,
    questHistoryCount: questHistory.length,
  };

  const stats = statsData?.stats || p.stats;
  const breakdown = statsData?.breakdown || (profile ? {} : fallbackBreakdown);

  const radarData = Object.entries(statMeta).map(([key, meta]) => ({
    stat: key,
    value: stats[key] || 0,
    fullMark: 100,
    label: meta.label,
  }));

  const statItems = [
    { label: '已完成任務', value: `${p.completedQuests}`, icon: '📋' },
    { label: '總收入', value: `${p.totalEarnings.toLocaleString()} 奧里`, icon: '💰' },
    { label: '平均評分', value: p.avgRating > 0 ? `${p.avgRating}⭐` : '—', icon: '⭐' },
    { label: '連續活躍', value: `${p.activeDays}天`, icon: '🔥' },
    { label: '擁有卡牌', value: `${p.ownedCards}種`, icon: '🃏' },
    { label: '總工時', value: `${p.totalHours}h`, icon: '⏱️' },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5" data-testid="profile-page">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">獵人檔案</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Bounty Profile — 你的冒險紀錄</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Hunter Card */}
        <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="hunter-card">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-gold/10 relative">
            <div className="absolute -bottom-8 left-5">
              <div className="w-16 h-16 rounded-xl bg-card border-2 border-primary flex items-center justify-center">
                <BookOpen size={28} className="text-primary" />
              </div>
            </div>
          </div>
          <div className="p-5 pt-12">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-lg text-foreground" data-testid="text-hunter-name">{p.displayName}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              賞金獵人 · <span className="text-primary">Bounty Hunter</span>
            </p>
            <div className="mt-4 bg-accent rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">等級</span>
                <span className="font-display font-bold text-sm text-primary">Lv.{p.level}</span>
              </div>
              <Progress value={p.xpMax > 0 ? (p.xp / p.xpMax) * 100 : 0} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{p.xp} XP</span>
                <span className="text-[10px] text-muted-foreground">{p.xpMax} XP</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
              <Clock size={14} className="text-primary" />
              <span>已累積工作 <span className="text-primary font-bold">{p.totalHours}</span> 小時，完成 <span className="text-primary font-bold">{p.questHistoryCount}</span> 個任務</span>
            </div>
          </div>
        </div>

        {/* Dynamic Radar Chart */}
        <div className="bg-card rounded-xl border border-border p-5" data-testid="attribute-chart">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">能力值</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">根據你完成嘅任務類型同工時自動計算</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(220, 12%, 22%)" />
              <PolarAngleAxis
                dataKey="stat"
                tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                  const item = radarData.find(d => d.stat === payload.value);
                  const meta = statMeta[payload.value];
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text textAnchor="middle" fill={meta?.color || "hsl(42, 12%, 90%)"} fontSize={11} fontFamily="'Clash Display', sans-serif" fontWeight={600} dy={-4}>
                        {meta?.label || payload.value}
                      </text>
                      <text textAnchor="middle" fill="hsl(175, 100%, 36%)" fontSize={10} fontFamily="'General Sans', sans-serif" fontWeight={400} dy={10}>
                        {item?.value || 0}
                      </text>
                    </g>
                  );
                }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="hsl(175, 100%, 36%)" fill="hsl(175, 100%, 36%)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stat Breakdown */}
      <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="stat-breakdown">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
          data-testid="button-toggle-breakdown"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="font-display font-bold text-sm text-foreground">能力成長來源</h3>
            <span className="text-[10px] text-muted-foreground">— 睇下邊啲任務令你變強</span>
          </div>
          {showBreakdown ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>
        {showBreakdown && (
          <div className="px-4 pb-4 grid grid-cols-3 gap-3">
            {Object.entries(statMeta).map(([key, meta]) => {
              const Icon = meta.icon;
              const bd = breakdown[key] || { fromQuests: '暫無', totalHours: 0, questCount: 0 };
              return (
                <div key={key} className="bg-accent rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${meta.color}22` }}>
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <span className="font-display font-bold text-sm" style={{ color: meta.color }}>{meta.label}</span>
                      <span className="text-muted-foreground text-[10px] ml-1.5">{stats[key] || 0}/100</span>
                    </div>
                  </div>
                  <Progress value={stats[key] || 0} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{meta.desc}</p>
                  <div className="text-[10px] space-y-0.5 pt-1 border-t border-border/50">
                    {key === 'HP' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">活躍日數</span>
                          <span className="text-foreground font-medium">{bd.questCount} 日</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">總工時</span>
                          <span className="text-foreground">{bd.totalHours} 小時</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">主要來源</span>
                          <span className="text-foreground font-medium">{bd.fromQuests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">相關任務數</span>
                          <span className="text-foreground">{bd.questCount} 個</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">相關工時</span>
                          <span className="text-foreground">{bd.totalHours} 小時</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-6 gap-3" data-testid="stats-grid">
        {statItems.map((item) => (
          <div key={item.label} className="bg-card rounded-xl border border-border p-4 text-center" data-testid={`stat-${item.label}`}>
            <span className="text-xl">{item.icon}</span>
            <p className="font-display font-bold text-sm text-foreground mt-2">{item.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
