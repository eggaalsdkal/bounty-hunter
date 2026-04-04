import { useState } from "react";
import { Clock, Star, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { quests, rarityColors, rarityLabels, regionColors, type Quest, type Region, type Rarity } from "@/lib/data";

function DifficultyStars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={12} className={i < count ? "fill-gold text-gold" : "text-muted-foreground/30"} />
      ))}
    </div>
  );
}

export default function QuestBoard() {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");

  const filtered = quests.filter((q) => {
    if (regionFilter !== "all" && q.region !== regionFilter) return false;
    if (difficultyFilter !== "all" && q.difficulty !== parseInt(difficultyFilter)) return false;
    if (rarityFilter !== "all" && q.rarity !== rarityFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5" data-testid="quest-board-page">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">任務看板</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Quest Board — 接受任務，成為傳說</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-3" data-testid="quest-filters">
        <Filter size={16} className="text-muted-foreground" />
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
            <SelectItem value="1">⭐ 初級</SelectItem>
            <SelectItem value="2">⭐⭐ 普通</SelectItem>
            <SelectItem value="3">⭐⭐⭐ 進階</SelectItem>
            <SelectItem value="4">⭐⭐⭐⭐ 困難</SelectItem>
            <SelectItem value="5">⭐⭐⭐⭐⭐ 傳說</SelectItem>
          </SelectContent>
        </Select>
        <Select value={rarityFilter} onValueChange={setRarityFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-accent border-border">
            <SelectValue placeholder="稀有度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有稀有度</SelectItem>
            {(["H","G","F","E","D","C","B","A","S","SS"] as Rarity[]).map(r => (
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
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} 個任務</span>
      </div>

      {/* Quest grid */}
      <div className="grid grid-cols-3 gap-4" data-testid="quest-grid">
        {filtered.map((quest) => (
          <div
            key={quest.id}
            onClick={() => setSelectedQuest(quest)}
            className="bg-card rounded-xl border border-border cursor-pointer transition-all hover:border-primary/30 hover:-translate-y-0.5 overflow-hidden"
            data-testid={`quest-card-${quest.id}`}
          >
            {/* Rarity left accent */}
            <div className="flex">
              <div
                className="w-1 flex-shrink-0"
                style={{ backgroundColor: rarityColors[quest.rarity] }}
              />
              <div className="p-4 flex-1">
                {/* Top: Region + Rarity */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${regionColors[quest.region]}22`,
                      color: regionColors[quest.region],
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

                {/* Title */}
                <h3 className="font-display font-bold text-sm text-foreground mb-2">{quest.title}</h3>

                {/* Difficulty */}
                <DifficultyStars count={quest.difficulty} />

                {/* Bottom info */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-sm font-bold text-gold">HK${quest.reward.toLocaleString()}</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock size={12} />
                    <span className="text-[11px]">{quest.timeLimit}</span>
                  </div>
                </div>

                {/* Requirements */}
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
                      backgroundColor: `${regionColors[selectedQuest.region]}22`,
                      color: regionColors[selectedQuest.region],
                    }}
                  >
                    {selectedQuest.region}
                  </span>
                  <Badge variant="outline" style={{ borderColor: rarityColors[selectedQuest.rarity], color: rarityColors[selectedQuest.rarity] }}>
                    {selectedQuest.rarity}級 · {rarityLabels[selectedQuest.rarity]}
                  </Badge>
                </div>
                <DialogTitle className="font-display text-lg">{selectedQuest.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedQuest.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-accent rounded-lg p-3">
                    <p className="text-[11px] text-muted-foreground">報酬</p>
                    <p className="font-display font-bold text-gold mt-0.5">HK${selectedQuest.reward.toLocaleString()}</p>
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

                <Button className="w-full font-display font-bold" data-testid="button-accept-quest">
                  接受任務
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
