import { useState, useMemo, useCallback } from "react";
import { Clock, Star, Filter, X, Brain, Sparkles, Zap, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  rarityColors, rarityLabels, regionColors,
  type Rarity, type Region,
  quests as staticQuests, questHistory, calculateStats, getRecommendedQuests,
} from "@/lib/data";

interface RecommendedQuest {
  id: string;
  title: string;
  description: string;
  region: Region;
  difficulty: number;
  rarity: Rarity;
  reward: number;
  timeLimit: string;
  requirements: string;
  type: string;
  matchScore: number;
  matchReasons: string[];
  userStatus: string | null;
}

function DifficultyStars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={12} className={i < count ? "fill-gold text-gold" : "text-muted-foreground/30"} />
      ))}
    </div>
  );
}

function MatchScoreBadge({ score }: { score: number }) {
  let color = "text-muted-foreground border-border";
  let label = "普通";
  if (score >= 80) {
    color = "text-gold border-gold/40 bg-gold/10";
    label = "極高匹配";
  } else if (score >= 60) {
    color = "text-primary border-primary/40 bg-primary/10";
    label = "高匹配";
  } else if (score >= 40) {
    color = "text-blue-400 border-blue-400/40 bg-blue-400/10";
    label = "中匹配";
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${color}`}>
      <Target size={8} />
      {score}% {label}
    </span>
  );
}

export default function QuestBoard() {
  const [selectedQuest, setSelectedQuest] = useState<RecommendedQuest | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"recommended" | "all">("recommended");
  const { toast } = useToast();

  const { data: questsData, isLoading } = useQuery<RecommendedQuest[]>({
    queryKey: ["/api/quests"],
  });

  // Fallback: use static data when API is unreachable
  const fallbackQuests = useMemo<RecommendedQuest[]>(
    () =>
      getRecommendedQuests(staticQuests, calculateStats(questHistory), questHistory).map((q) => ({
        ...q,
        userStatus: null,
      })),
    [],
  );

  const acceptMutation = useMutation({
    mutationFn: async (questId: string) => {
      const res = await apiRequest("POST", `/api/quests/${questId}/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      toast({ title: "任務已接受", description: "前往完成任務獲取獎勵！" });
      setSelectedQuest(null);
    },
    onError: () => {
      toast({ title: "已接受任務（demo 模式）", description: "API 不可用，本地 demo 模式" });
      setSelectedQuest(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (questId: string) => {
      const res = await apiRequest("POST", `/api/quests/${questId}/complete`, {
        hoursSpent: 3,
        rating: 5,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "任務完成！",
        description: `獲得 ${data.reward} 奧里 + ${data.xpGain} XP`,
      });
      setSelectedQuest(null);
    },
    onError: () => {
      toast({ title: "已完成任務（demo 模式）", description: "API 不可用，本地 demo 模式" });
      setSelectedQuest(null);
    },
  });

  const quests = questsData ?? fallbackQuests;
  const topPicks = useMemo(() => quests.slice(0, 3), [quests]);

  const filtered = quests.filter((q) => {
    if (regionFilter !== "all" && q.region !== regionFilter) return false;
    if (difficultyFilter !== "all" && q.difficulty !== parseInt(difficultyFilter)) return false;
    if (rarityFilter !== "all" && q.rarity !== rarityFilter) return false;
    return true;
  });

  const displayQuests = viewMode === "recommended" ? filtered : filtered.sort((a, b) => a.id.localeCompare(b.id));

  if (isLoading && !quests.length) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5" data-testid="quest-board-page">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">任務看板</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Bounty Board — 接受任務，成為傳說</p>
      </div>

      {/* AI Recommendation banner */}
      <div className="bg-gradient-to-r from-primary/10 via-card to-gold/5 rounded-xl border border-primary/20 p-4" data-testid="ai-recommendation-banner">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Brain size={14} className="text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-foreground">AI 智能推薦</h3>
            <p className="text-[10px] text-muted-foreground">根據你嘅能力值同完成記錄，為你配對最適合嘅任務</p>
          </div>
          <Badge variant="outline" className="ml-auto text-[9px] border-primary/30 text-primary">
            <Sparkles size={8} className="mr-1" /> 大數據分析
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {topPicks.map((quest) => (
            <div
              key={quest.id}
              onClick={() => setSelectedQuest(quest)}
              className="bg-card/80 backdrop-blur rounded-lg border border-primary/20 p-3 cursor-pointer transition-all hover:border-primary/50 hover:-translate-y-0.5 relative overflow-hidden group"
              data-testid={`recommended-quest-${quest.id}`}
            >
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10 bg-primary group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${regionColors[quest.region as Region] || '#666'}22`,
                      color: regionColors[quest.region as Region] || '#666',
                    }}
                  >
                    {quest.region}
                  </span>
                  <MatchScoreBadge score={quest.matchScore} />
                </div>
                <h4 className="font-display font-bold text-xs text-foreground mb-1.5 leading-tight">{quest.title}</h4>
                <DifficultyStars count={quest.difficulty} />
                <div className="mt-2 space-y-0.5">
                  {quest.matchReasons.slice(0, 2).map((reason, i) => (
                    <p key={i} className="text-[9px] text-primary/80 flex items-center gap-1">
                      <Zap size={7} className="flex-shrink-0" /> {reason}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                  <span className="text-xs font-bold text-gold">{quest.reward.toLocaleString()} 奧里</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock size={10} />
                    <span className="text-[10px]">{quest.timeLimit}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-3" data-testid="quest-filters">
        <Filter size={16} className="text-muted-foreground" />
        <div className="flex items-center bg-accent rounded-lg p-0.5 mr-1">
          <button
            onClick={() => setViewMode("recommended")}
            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${viewMode === "recommended" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="button-view-recommended"
          >
            推薦排序
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${viewMode === "all" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="button-view-all"
          >
            全部
          </button>
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-accent border-border">
            <SelectValue placeholder="區域" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有區域</SelectItem>
            <SelectItem value="文字之森">文字之森</SelectItem>
            <SelectItem value="視覺神殿">視覺神殿</SelectItem>
            <SelectItem value="數字迷城">數字迷城</SelectItem>
            <SelectItem value="商旅驛站">商旅驛站</SelectItem>
            <SelectItem value="現場戰場">現場戰場</SelectItem>
            <SelectItem value="傳說聖域">傳說聖域</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-accent border-border">
            <SelectValue placeholder="難度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有難度</SelectItem>
            <SelectItem value="1">初級</SelectItem>
            <SelectItem value="2">普通</SelectItem>
            <SelectItem value="3">進階</SelectItem>
            <SelectItem value="4">困難</SelectItem>
            <SelectItem value="5">傳說</SelectItem>
          </SelectContent>
        </Select>
        <Select value={rarityFilter} onValueChange={setRarityFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-accent border-border">
            <SelectValue placeholder="稀有度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有稀有度</SelectItem>
            {(["R","SR","SSR","UR"] as Rarity[]).map(r => (
              <SelectItem key={r} value={r}>{r} ({rarityLabels[r]})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(regionFilter !== "all" || difficultyFilter !== "all" || rarityFilter !== "all") && (
          <button
            onClick={() => { setRegionFilter("all"); setDifficultyFilter("all"); setRarityFilter("all"); }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            data-testid="button-clear-filters"
          >
            <X size={12} /> 清除篩選
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{displayQuests.length} 個任務</span>
      </div>

      {/* Quest grid */}
      <div className="grid grid-cols-3 gap-4" data-testid="quest-grid">
        {displayQuests.map((quest, idx) => (
          <div
            key={quest.id}
            onClick={() => setSelectedQuest(quest)}
            className="bg-card rounded-xl border border-border cursor-pointer transition-all hover:border-primary/30 hover:-translate-y-0.5 overflow-hidden relative"
            data-testid={`quest-card-${quest.id}`}
          >
            {viewMode === "recommended" && idx < 3 && (
              <div className="absolute top-2 right-2 z-10">
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                  TOP {idx + 1}
                </span>
              </div>
            )}
            {quest.userStatus === "active" && (
              <div className="absolute top-2 right-2 z-10">
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 font-bold">
                  進行中
                </span>
              </div>
            )}
            {quest.userStatus === "completed" && (
              <div className="absolute top-2 right-2 z-10">
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                  已完成
                </span>
              </div>
            )}
            <div className="flex">
              <div
                className="w-1 flex-shrink-0"
                style={{ backgroundColor: rarityColors[quest.rarity] }}
              />
              <div className="p-4 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${regionColors[quest.region as Region] || '#666'}22`,
                      color: regionColors[quest.region as Region] || '#666',
                    }}
                  >
                    {quest.region}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{ color: rarityColors[quest.rarity] }}
                  >
                    {quest.rarity}
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm text-foreground mb-2">{quest.title}</h3>
                <DifficultyStars count={quest.difficulty} />
                {viewMode === "recommended" && quest.matchScore > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-muted-foreground">匹配度</span>
                      <span className="text-[9px] text-primary font-medium">{quest.matchScore}%</span>
                    </div>
                    <div className="w-full h-1 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${quest.matchScore}%`,
                          backgroundColor: quest.matchScore >= 80 ? '#ffd700' : quest.matchScore >= 60 ? 'hsl(175, 100%, 36%)' : '#60a5fa',
                        }}
                      />
                    </div>
                    {quest.matchReasons.length > 0 && (
                      <p className="text-[9px] text-primary/70 mt-1 flex items-center gap-0.5">
                        <Zap size={7} /> {quest.matchReasons[0]}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-sm font-bold text-gold">{quest.reward.toLocaleString()} 奧里</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock size={12} />
                    <span className="text-[11px]">{quest.timeLimit}</span>
                  </div>
                </div>
                {quest.requirements !== '無' && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    需求: {quest.requirements}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quest detail dialog */}
      <Dialog open={!!selectedQuest} onOpenChange={() => setSelectedQuest(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          {selectedQuest && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${regionColors[selectedQuest.region as Region] || '#666'}22`,
                      color: regionColors[selectedQuest.region as Region] || '#666',
                    }}
                  >
                    {selectedQuest.region}
                  </span>
                  <Badge variant="outline" style={{ borderColor: rarityColors[selectedQuest.rarity], color: rarityColors[selectedQuest.rarity] }}>
                    {selectedQuest.rarity}級 · {rarityLabels[selectedQuest.rarity]}
                  </Badge>
                  {selectedQuest.matchScore > 0 && (
                    <MatchScoreBadge score={selectedQuest.matchScore} />
                  )}
                </div>
                <DialogTitle className="font-display text-lg">{selectedQuest.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedQuest.description}</p>
                {selectedQuest.matchReasons.length > 0 && (
                  <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain size={12} className="text-primary" />
                      <span className="text-[11px] font-bold text-primary">AI 推薦原因</span>
                    </div>
                    <div className="space-y-1">
                      {selectedQuest.matchReasons.map((reason, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Zap size={8} className="text-primary flex-shrink-0" />
                          {reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-accent rounded-lg p-3">
                    <p className="text-[11px] text-muted-foreground">報酬</p>
                    <p className="font-display font-bold text-gold mt-0.5">{selectedQuest.reward.toLocaleString()} 奧里</p>
                  </div>
                  <div className="bg-accent rounded-lg p-3">
                    <p className="text-[11px] text-muted-foreground">時限</p>
                    <p className="font-display font-bold text-foreground mt-0.5">{selectedQuest.timeLimit}</p>
                  </div>
                  <div className="bg-accent rounded-lg p-3">
                    <p className="text-[11px] text-muted-foreground">難度</p>
                    <div className="mt-1"><DifficultyStars count={selectedQuest.difficulty} /></div>
                  </div>
                  <div className="bg-accent rounded-lg p-3">
                    <p className="text-[11px] text-muted-foreground">類型</p>
                    <p className="font-display font-bold text-foreground mt-0.5">{selectedQuest.type}</p>
                  </div>
                </div>
                {selectedQuest.requirements !== '無' && (
                  <div className="bg-accent rounded-lg p-3">
                    <p className="text-[11px] text-muted-foreground mb-1">接單要求</p>
                    <p className="text-sm text-foreground">{selectedQuest.requirements}</p>
                  </div>
                )}
                {selectedQuest.userStatus === "active" ? (
                  <Button
                    className="w-full font-display font-bold bg-gold hover:bg-gold/90 text-black"
                    onClick={() => completeMutation.mutate(selectedQuest.id)}
                    disabled={completeMutation.isPending}
                    data-testid="button-complete-quest"
                  >
                    {completeMutation.isPending ? "完成中..." : "完成任務"}
                  </Button>
                ) : selectedQuest.userStatus === "completed" ? (
                  <Button className="w-full font-display font-bold" disabled data-testid="button-quest-completed">
                    已完成
                  </Button>
                ) : (
                  <Button
                    className="w-full font-display font-bold"
                    onClick={() => acceptMutation.mutate(selectedQuest.id)}
                    disabled={acceptMutation.isPending}
                    data-testid="button-accept-quest"
                  >
                    {acceptMutation.isPending ? "接受中..." : "接受任務"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
