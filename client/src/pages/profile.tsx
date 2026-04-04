import { BookOpen, Star, Shield, Moon, Flame, Award, Swords } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";
import { playerProfile } from "@/lib/data";

const radarData = [
  { stat: 'INT', value: playerProfile.stats.INT, fullMark: 100, label: '智力' },
  { stat: 'DEX', value: playerProfile.stats.DEX, fullMark: 100, label: '靈巧' },
  { stat: 'STR', value: playerProfile.stats.STR, fullMark: 100, label: '體力' },
  { stat: 'LOG', value: playerProfile.stats.LOG, fullMark: 100, label: '邏輯' },
  { stat: 'LNG', value: playerProfile.stats.LNG, fullMark: 100, label: '語感' },
  { stat: 'CHA', value: playerProfile.stats.CHA, fullMark: 100, label: '魅力' },
];

const statItems = [
  { label: '已完成任務', value: `${playerProfile.completedQuests}`, icon: '📋' },
  { label: '總收入', value: `HK$${playerProfile.totalEarnings.toLocaleString()}`, icon: '💰' },
  { label: '平均評分', value: `${playerProfile.avgRating}⭐`, icon: '⭐' },
  { label: '連續活躍', value: `${playerProfile.activeDays}天`, icon: '🔥' },
  { label: '擁有卡牌', value: `${playerProfile.ownedCards}張`, icon: '🃏' },
  { label: '公會', value: playerProfile.guild, icon: '⚔️' },
];

export default function Profile() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5" data-testid="profile-page">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">獵人檔案</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Hunter Profile — 你的冒險紀錄</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Hunter Card */}
        <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="hunter-card">
          {/* Card header with gradient */}
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-gold/10 relative">
            <div className="absolute -bottom-8 left-5">
              <div className="w-16 h-16 rounded-xl bg-card border-2 border-primary flex items-center justify-center">
                <BookOpen size={28} className="text-primary" />
              </div>
            </div>
          </div>

          <div className="p-5 pt-12">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-lg text-foreground" data-testid="text-hunter-name">{playerProfile.hunterName}</h3>
              <Badge variant="outline" className="text-gold border-gold/30 text-[10px]">
                {playerProfile.title}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {playerProfile.className} · <span className="text-primary">{playerProfile.classEn}</span>
            </p>

            {/* Level */}
            <div className="mt-4 bg-accent rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">等級</span>
                <span className="font-display font-bold text-sm text-primary">
                  Lv.{playerProfile.level} {playerProfile.levelTitle}
                </span>
              </div>
              <Progress value={(playerProfile.xp / playerProfile.xpMax) * 100} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{playerProfile.xp} XP</span>
                <span className="text-[10px] text-muted-foreground">{playerProfile.xpMax} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-card rounded-xl border border-border p-5" data-testid="attribute-chart">
          <h3 className="font-display font-bold text-sm text-foreground mb-2">屬性值</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(220, 12%, 22%)" />
              <PolarAngleAxis
                dataKey="stat"
                tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                  const item = radarData.find(d => d.stat === payload.value);
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        textAnchor="middle"
                        fill="hsl(42, 12%, 90%)"
                        fontSize={11}
                        fontFamily="'Clash Display', sans-serif"
                        fontWeight={600}
                        dy={-4}
                      >
                        {payload.value}
                      </text>
                      <text
                        textAnchor="middle"
                        fill="hsl(175, 100%, 36%)"
                        fontSize={10}
                        fontFamily="'General Sans', sans-serif"
                        dy={10}
                      >
                        {item?.value}
                      </text>
                    </g>
                  );
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                dataKey="value"
                stroke="hsl(175, 100%, 36%)"
                fill="hsl(175, 100%, 36%)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
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

      {/* Titles / Achievements */}
      <div className="bg-card rounded-xl border border-border p-5" data-testid="titles-section">
        <h3 className="font-display font-bold text-sm text-foreground mb-3">稱號展示</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {playerProfile.titles.map((title) => (
            <Badge
              key={title}
              variant="outline"
              className="flex-shrink-0 border-gold/30 text-gold text-xs px-3 py-1"
            >
              {title}
            </Badge>
          ))}
        </div>
      </div>

      {/* Equipped skill cards */}
      <div className="bg-card rounded-xl border border-border p-5" data-testid="equipped-cards">
        <h3 className="font-display font-bold text-sm text-foreground mb-3">裝備中的技能卡（3/3）</h3>
        <div className="grid grid-cols-3 gap-3">
          {playerProfile.equippedCards.map((cardName, i) => (
            <div key={i} className="bg-accent rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                {i === 0 && <Star size={20} className="text-primary" />}
                {i === 1 && <Shield size={20} className="text-primary" />}
                {i === 2 && <Moon size={20} className="text-primary" />}
              </div>
              <div>
                <p className="font-display font-bold text-sm text-foreground">{cardName}</p>
                <p className="text-[10px] text-muted-foreground">被動技能 · 裝備中</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
