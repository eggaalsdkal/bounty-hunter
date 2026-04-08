import { useState, useMemo, useCallback } from "react";
import {
  BookOpen, Filter, Gift, Sparkles,
  Lock as LockIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  rarityColors, rarityLabels, GACHA_RATES,
  type Rarity, type CardType,
  cards as staticCards, drawCard as localDrawCard,
} from "@/lib/data";

interface CardDef {
  id: string;
  name: string;
  type: CardType;
  subType: string;
  rarity: Rarity;
  description: string;
  effect: string;
  icon: string;
  cardNumber: string;
  imagePath: string;
}

interface GameCardWithQty extends CardDef {
  quantity: number;
}

// ─── Combo definitions ────────────────────────────────────────────────────────
const combos = [
  { id: 'combo-01', name: '疾風套裝', bonus: '三卡同時持有：所有任務審批時間縮短 50%', cardIds: ['c001', 'c009', 'c043'] },
  { id: 'combo-02', name: '偵察三劍客', bonus: '三卡同時持有：每日額外解鎖 1 個隱藏任務', cardIds: ['c049', 'c058', 'c069'] },
  { id: 'combo-03', name: '商人之道', bonus: '三卡同時持有：平台手續費永久降低 5%', cardIds: ['c053', 'c063', 'c045'] },
  { id: 'combo-04', name: '時間掌控', bonus: '三卡同時持有：每月可復活 2 個已過期任務', cardIds: ['c044', 'c072', 'c085'] },
  { id: 'combo-05', name: '戰神之怒', bonus: '三卡同時持有：競爭任務搶單優先度提升至最高', cardIds: ['c092', 'c096', 'c098'] },
  { id: 'combo-06', name: '傳說獵人全套', bonus: '集齊所有 10 張 UR 卡：解鎖「傳說獵人」稱號、專屬邊框及絕密任務池', cardIds: ['c091', 'c092', 'c093', 'c094', 'c095', 'c096', 'c097', 'c098', 'c099', 'c100'] },
];

// ─── Rarity border style ──────────────────────────────────────────────────────
function getRarityBorderStyle(rarity: Rarity): React.CSSProperties {
  const color = rarityColors[rarity];
  if (rarity === 'UR') return { border: `2px solid ${color}`, boxShadow: `0 0 12px ${color}60, 0 0 4px ${color}40` };
  if (rarity === 'SSR') return { border: `2px solid ${color}`, boxShadow: `0 0 8px ${color}40` };
  if (rarity === 'SR') return { border: `2px solid ${color}80` };
  return { border: `1px solid ${color}50` };
}

// ─── Single Card Component ────────────────────────────────────────────────────
function GameCardComponent({ card, onClick }: { card: GameCardWithQty; onClick: () => void }) {
  const rarityColor = rarityColors[card.rarity];
  const isUR = card.rarity === 'UR';
  const isSSR = card.rarity === 'SSR';
  const borderStyle = getRarityBorderStyle(card.rarity);

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] select-none overflow-hidden ${isUR ? 'animate-ur-glow' : ''}`}
      style={{ background: '#1a2030', ...borderStyle }}
    >
      {isSSR && (
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
          <div className="absolute inset-0 animate-shimmer" style={{ background: `linear-gradient(105deg, transparent 40%, ${rarityColor}15 50%, transparent 60%)`, backgroundSize: '200% 100%' }} />
        </div>
      )}
      <div className="relative w-full aspect-square overflow-hidden rounded-t-xl">
        <img src={card.imagePath} alt={card.name} className={`w-full h-full object-cover ${card.quantity === 0 ? 'grayscale opacity-60' : ''}`} loading="lazy" />
        <span className="absolute top-1.5 right-1.5 text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded" style={{ color: rarityColor, backgroundColor: '#0a0e16cc', textShadow: isUR ? `0 0 8px ${rarityColor}` : isSSR ? `0 0 6px ${rarityColor}80` : undefined }}>{card.rarity}</span>
        <span className="absolute top-1.5 left-1.5 text-[8px] px-1.5 py-0.5 rounded font-medium truncate max-w-[70%]" style={{ backgroundColor: `${rarityColor}22`, color: rarityColor, border: `1px solid ${rarityColor}40`, backdropFilter: 'blur(4px)' }}>{card.type}</span>
        <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'linear-gradient(to bottom, transparent, #1a2030)' }} />
      </div>
      <div className="px-2.5 pb-2.5 pt-1.5 flex flex-col gap-1" style={{ backgroundImage: isUR || isSSR ? `radial-gradient(ellipse at top, ${rarityColor}08 0%, transparent 60%)` : undefined }}>
        <h3 className="font-bold text-xs leading-tight text-center" style={{ color: isUR ? rarityColor : '#e8e4d9', textShadow: isUR ? `0 0 10px ${rarityColor}50` : undefined }}>{card.name}</h3>
        {card.subType && (
          <div className="flex justify-center">
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#ffffff0a', color: '#ffffff50', border: '1px solid #ffffff15' }}>{card.subType}</span>
          </div>
        )}
        <p className="text-[8px] leading-snug text-center line-clamp-2 opacity-60" style={{ color: '#e8e4d9' }}>{card.effect}</p>
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[7px] text-white/30 font-mono">{card.cardNumber}</span>
          <span className="text-[7px] text-white/30">{rarityLabels[card.rarity]}</span>
        </div>
      </div>
      {card.quantity > 0 && (
        <div className="absolute bottom-[52px] right-1.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: card.quantity >= 3 ? '#ffd70030' : '#ffffff15', color: card.quantity >= 3 ? '#ffd700' : '#ffffffaa', border: `1px solid ${card.quantity >= 3 ? '#ffd70040' : '#ffffff20'}`, backdropFilter: 'blur(4px)' }}>
          ×{card.quantity}
        </div>
      )}
      {card.quantity === 0 && (
        <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center z-10" style={{ background: 'rgba(10,14,22,0.45)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <LockIcon size={16} style={{ color: '#ffffff40' }} strokeWidth={1.5} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Card Detail Dialog ───────────────────────────────────────────────────────
function CardDetailView({ card, onUse }: { card: GameCardWithQty; onUse: () => void }) {
  const rarityColor = rarityColors[card.rarity];
  const isUR = card.rarity === 'UR';
  const isSSR = card.rarity === 'SSR';

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" style={{ borderColor: rarityColor, color: rarityColor, fontSize: '11px' }}>{card.rarity} · {rarityLabels[card.rarity]}</Badge>
          <Badge variant="secondary" className="text-[11px]">{card.type}</Badge>
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-white/10">{card.subType}</Badge>
          <span className="text-[10px] text-muted-foreground font-mono ml-auto">{card.cardNumber}</span>
        </div>
        <DialogTitle className="text-xl font-bold" style={{ color: isUR ? rarityColor : undefined }}>{card.name}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-2">
        <div className="flex justify-center py-4 rounded-xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${rarityColor}10, transparent)` }}>
          <div className="relative rounded-xl overflow-hidden" style={{ width: 300, height: 300, boxShadow: isUR ? `0 0 40px ${rarityColor}50, 0 0 60px ${rarityColor}20` : isSSR ? `0 0 30px ${rarityColor}40` : `0 0 20px ${rarityColor}20`, border: `2px solid ${rarityColor}50` }}>
            <img src={card.imagePath} alt={card.name} className={`w-full h-full object-cover ${card.quantity === 0 ? 'grayscale opacity-70' : ''}`} />
            {card.quantity === 0 && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10,14,22,0.5)' }}>
                <LockIcon size={48} style={{ color: '#ffffff30' }} strokeWidth={1} />
              </div>
            )}
          </div>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">卡牌傳說</p>
          <p className="text-sm text-foreground/80 leading-relaxed italic">「{card.description}」</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: `${rarityColor}08`, borderColor: `${rarityColor}25` }}>
          <p className="text-[11px] uppercase tracking-wider mb-1.5" style={{ color: rarityColor }}>卡牌效果</p>
          <p className="text-sm font-medium" style={{ color: rarityColor }}>{card.effect}</p>
        </div>
        {card.quantity > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">擁有數量</span>
              <span className="text-sm font-bold" style={{ color: card.quantity >= 3 ? '#ffd700' : rarityColor }}>×{card.quantity}</span>
            </div>
            <Button className="w-full font-bold" style={{ background: rarityColor, color: '#0a0e16' }} onClick={onUse} data-testid="button-use-card">
              使用卡牌（消耗 1 張）
            </Button>
            <p className="text-[9px] text-center text-muted-foreground">所有卡牌都係消耗品，使用後數量 -1</p>
          </div>
        ) : (
          <div className="text-center py-2 rounded-lg bg-white/[0.02] border border-white/5">
            <LockIcon size={16} className="mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">尚未獲得 — 透過每日抽卡或完成任務獲得</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Rarity Progress Bar Row ──────────────────────────────────────────────────
function RarityProgressRow({ rarity, owned, total }: { rarity: Rarity; owned: number; total: number }) {
  const color = rarityColors[rarity];
  const pct = total > 0 ? (owned / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-black w-10 text-right shrink-0" style={{ color }}>{rarity}</span>
      <div className="flex-1 relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color, boxShadow: pct > 0 ? `0 0 6px ${color}60` : undefined }} />
      </div>
      <span className="text-xs text-muted-foreground font-mono w-12 shrink-0">{owned}/{total}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CardCollection() {
  const [selectedCard, setSelectedCard] = useState<GameCardWithQty | null>(null);
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [filterType, setFilterType] = useState<CardType | 'all'>('all');
  const [filterOwned, setFilterOwned] = useState<'all' | 'owned' | 'unowned'>('all');
  const [showDrawResult, setShowDrawResult] = useState(false);
  const [drawnCardResult, setDrawnCardResult] = useState<{ card: CardDef; quantity: number } | null>(null);
  const { toast } = useToast();

  // Fetch card definitions
  const { data: cardDefs, isLoading: cardsLoading } = useQuery<CardDef[]>({
    queryKey: ["/api/cards"],
  });

  // Fetch user inventory
  const { data: inventory, isLoading: inventoryLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/cards/inventory"],
  });

  // Fallback card definitions from static data
  const fallbackCardDefs: CardDef[] = useMemo(
    () => staticCards.map(({ quantity, ...rest }) => rest),
    [],
  );

  // Fallback inventory: first 35 cards each have 1
  const fallbackInventory: Record<string, number> = useMemo(() => {
    const inv: Record<string, number> = {};
    staticCards.slice(0, 35).forEach((c) => {
      inv[c.id] = 1;
    });
    return inv;
  }, []);

  const effectiveCardDefs = cardDefs ?? fallbackCardDefs;
  const effectiveInventory = inventory ?? fallbackInventory;

  // Merge cards with inventory
  const cards: GameCardWithQty[] = useMemo(() => {
    return effectiveCardDefs.map(c => ({
      ...c,
      quantity: effectiveInventory[c.id] || 0,
    }));
  }, [effectiveCardDefs, effectiveInventory]);

  // Draw mutation
  const drawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cards/draw");
      return res.json();
    },
    onSuccess: (data: { card: CardDef; quantity: number }) => {
      setDrawnCardResult(data);
      setShowDrawResult(true);
      queryClient.invalidateQueries({ queryKey: ["/api/cards/inventory"] });
    },
    onError: () => {
      // Demo mode: use local drawCard logic
      const drawn = localDrawCard(staticCards);
      const { quantity: _q, ...cardDef } = drawn;
      setDrawnCardResult({ card: cardDef, quantity: 1 });
      setShowDrawResult(true);
    },
  });

  // Use card mutation
  const useMutationCard = useMutation({
    mutationFn: async (cardId: string) => {
      const res = await apiRequest("POST", `/api/cards/use/${cardId}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards/inventory"] });
      toast({ title: "卡牌已使用", description: `剩餘 ${data.remainingQuantity} 張` });
      setSelectedCard(null);
    },
    onError: () => {
      toast({ title: "已使用（demo 模式）", description: "API 不可用，本地 demo 模式" });
      setSelectedCard(null);
    },
  });

  const totalCount = cards.length;
  const ownedCount = useMemo(() => cards.reduce((sum, c) => sum + (c.quantity > 0 ? 1 : 0), 0), [cards]);

  const rarityStats = useMemo(() => {
    const stats: Record<Rarity, { owned: number; total: number }> = {
      R: { owned: 0, total: 0 }, SR: { owned: 0, total: 0 }, SSR: { owned: 0, total: 0 }, UR: { owned: 0, total: 0 },
    };
    for (const c of cards) {
      stats[c.rarity].total++;
      if (c.quantity > 0) stats[c.rarity].owned++;
    }
    return stats;
  }, [cards]);

  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      if (filterRarity !== 'all' && c.rarity !== filterRarity) return false;
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (filterOwned === 'owned' && c.quantity === 0) return false;
      if (filterOwned === 'unowned' && c.quantity > 0) return false;
      return true;
    });
  }, [cards, filterRarity, filterType, filterOwned]);

  const totalCards = useMemo(() => cards.reduce((sum, c) => sum + c.quantity, 0), [cards]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cards) counts[c.type] = (counts[c.type] || 0) + 1;
    return counts;
  }, [cards]);

  const cardMap = useMemo(() => {
    const m: Record<string, GameCardWithQty> = {};
    for (const c of cards) m[c.id] = c;
    return m;
  }, [cards]);

  const rarities: Rarity[] = ['R', 'SR', 'SSR', 'UR'];
  const cardTypes: CardType[] = ['任務卡', '技能卡', '陷阱卡', '特殊卡', '挑戰卡'];

  if ((cardsLoading || inventoryLoading) && cards.length === 0) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes urGlow { 0%, 100% { box-shadow: 0 0 12px #ef444460, 0 0 4px #ef444440; } 50% { box-shadow: 0 0 20px #ef444480, 0 0 8px #ef444460, 0 0 32px #ef444420; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .animate-ur-glow { animation: urGlow 2.5s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 3s linear infinite; }
        @keyframes cardFlip { 0% { transform: rotateY(0deg) scale(0.8); opacity: 0.5; } 50% { transform: rotateY(180deg) scale(1.1); opacity: 0.8; } 100% { transform: rotateY(360deg) scale(1); opacity: 1; } }
        @keyframes gachaSpin { 0% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(10deg) scale(1.05); } 50% { transform: rotate(-10deg) scale(1.1); } 75% { transform: rotate(5deg) scale(1.05); } 100% { transform: rotate(0deg) scale(1); } }
        .animate-card-flip { animation: cardFlip 0.8s ease-out; }
        .animate-gacha-spin { animation: gachaSpin 0.5s ease-in-out infinite; }
      `}</style>

      <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-5" data-testid="card-collection-page">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">卡牌圖鑑</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Card Collection · 所有卡牌都係消耗品，用完即止</p>
        </div>

        {/* Daily Gacha Banner */}
        <div className="bg-gradient-to-r from-gold/10 via-card to-primary/10 rounded-xl border border-gold/20 p-4" data-testid="daily-gacha">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center ${drawMutation.isPending ? 'animate-gacha-spin' : ''}`}>
                <Gift size={24} className="text-gold" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-foreground">每日免費抽卡</h3>
                <p className="text-[10px] text-muted-foreground">每日登入可抽一張卡牌 — R 70% / SR 20% / SSR 8% / UR 2%</p>
              </div>
            </div>
            <Button
              onClick={() => drawMutation.mutate()}
              disabled={drawMutation.isPending}
              className="font-display font-bold gap-2 bg-gold hover:bg-gold/90 text-black"
              data-testid="button-daily-draw"
            >
              <Sparkles size={14} />
              {drawMutation.isPending ? '抽卡中...' : '抽卡！'}
            </Button>
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
            <span>已擁有卡種: <b className="text-foreground">{ownedCount}</b>/100</span>
            <span>總卡片數: <b className="text-foreground">{totalCards}</b> 張</span>
            <span className="text-gold">• 所有卡牌都係消耗品，用一次就消失</span>
          </div>
        </div>

        {/* Draw Result Dialog */}
        <Dialog open={showDrawResult} onOpenChange={setShowDrawResult}>
          <DialogContent className="bg-card border-border max-w-sm text-center">
            {drawnCardResult && (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-xs text-muted-foreground">今日抽到…</p>
                <div className="animate-card-flip rounded-xl overflow-hidden" style={{ ...getRarityBorderStyle(drawnCardResult.card.rarity as Rarity), width: 200, background: '#1a2030' }}>
                  <img src={drawnCardResult.card.imagePath} alt={drawnCardResult.card.name} className="w-full aspect-square object-cover" />
                  <div className="p-3 text-center">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ color: rarityColors[drawnCardResult.card.rarity as Rarity], backgroundColor: '#0a0e16cc' }}>{drawnCardResult.card.rarity}</span>
                    <h3 className="font-display font-bold text-sm text-foreground mt-2">{drawnCardResult.card.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1">{drawnCardResult.card.effect}</p>
                  </div>
                </div>
                <p className="text-xs text-gold font-medium">卡牌 +1，現有 {drawnCardResult.quantity} 張</p>
                <Button onClick={() => setShowDrawResult(false)} className="mt-2 font-display">收下卡牌</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Top Stats */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">已收集</p>
              <p className="font-display text-2xl font-bold text-foreground">{ownedCount}<span className="text-muted-foreground text-base font-normal"> / {totalCount}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">完成度</p>
              <p className="font-bold text-lg" style={{ color: '#fbbf24' }}>{totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0}%</p>
            </div>
          </div>
          <Progress value={totalCount > 0 ? (ownedCount / totalCount) * 100 : 0} className="h-2" />
          <div className="space-y-2 pt-1">
            {rarities.map(r => (
              <RarityProgressRow key={r} rarity={r} owned={rarityStats[r].owned} total={rarityStats[r].total} />
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 bg-card rounded-lg border border-border p-1.5 flex-wrap">
            <button onClick={() => setFilterRarity('all')} className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${filterRarity === 'all' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>全部稀有度</button>
            {rarities.map(r => (
              <button key={r} onClick={() => setFilterRarity(filterRarity === r ? 'all' : r)} className={`text-xs px-2.5 py-1 rounded-md transition-all font-black ${filterRarity === r ? 'bg-white/10' : 'opacity-60 hover:opacity-100'}`} style={{ color: rarityColors[r] }}>{r}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-card rounded-lg border border-border p-1.5 flex-wrap">
            <button onClick={() => setFilterType('all')} className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${filterType === 'all' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>全部類型</button>
            {cardTypes.filter(t => typeCounts[t] > 0).map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? 'all' : t)} className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${filterType === t ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-muted-foreground hover:text-foreground'}`}>{t}<span className="ml-1 opacity-60">({typeCounts[t] || 0})</span></button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-card rounded-lg border border-border p-1.5">
            {(['all', 'owned', 'unowned'] as const).map(o => (
              <button key={o} onClick={() => setFilterOwned(o)} className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${filterOwned === o ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{o === 'all' ? '全部' : o === 'owned' ? '已擁有' : '未擁有'}</button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">顯示 {filteredCards.length} 張卡牌</span>
        </div>

        {/* Card Grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3" data-testid="card-grid" style={{ maxWidth: '1280px' }}>
            {filteredCards.map(card => (
              <GameCardComponent key={card.id} card={card} onClick={() => setSelectedCard(card)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Filter size={32} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground">沒有符合篩選條件的卡牌</p>
            <button onClick={() => { setFilterRarity('all'); setFilterType('all'); setFilterOwned('all'); }} className="mt-3 text-sm text-teal-400 hover:underline">清除篩選條件</button>
          </div>
        )}

        {/* Combo Showcase */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-foreground">卡牌組合</h3>
            <span className="text-xs text-muted-foreground">收集特定組合可解鎖額外效果</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {combos.map(combo => {
              const comboCards = combo.cardIds.map(id => cardMap[id]).filter(Boolean);
              const ownedComboCards = comboCards.filter(c => c.quantity > 0);
              const isComplete = ownedComboCards.length === comboCards.length;
              const progress = comboCards.length > 0 ? (ownedComboCards.length / comboCards.length) * 100 : 0;
              return (
                <div key={combo.id} className="bg-card rounded-xl border border-border p-4 space-y-3" style={isComplete ? { borderColor: '#fbbf2440', boxShadow: '0 0 12px #fbbf2415' } : undefined}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{combo.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{ownedComboCards.length}/{comboCards.length}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: isComplete ? '#fbbf24' : '#14b8a6' }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{combo.bonus}</p>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {comboCards.map(c => (
                      <button key={c.id} onClick={() => setSelectedCard(c)} className="relative group" title={c.name}>
                        <div className="w-8 h-8 rounded overflow-hidden" style={{ border: c.quantity > 0 ? `1px solid ${rarityColors[c.rarity]}60` : '1px solid rgba(255,255,255,0.1)', opacity: c.quantity > 0 ? 1 : 0.4 }}>
                          <img src={c.imagePath} alt={c.name} className={`w-full h-full object-cover ${c.quantity === 0 ? 'grayscale' : ''}`} loading="lazy" />
                        </div>
                      </button>
                    ))}
                    <span className="text-[9px] text-muted-foreground ml-1">{comboCards.map(c => c.name).join('·')}</span>
                  </div>
                  {isComplete && (
                    <div className="text-center py-1">
                      <span className="text-[11px] font-bold" style={{ color: '#fbbf24' }}>✦ 組合已激活</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          {selectedCard && <CardDetailView card={selectedCard} onUse={() => useMutationCard.mutate(selectedCard.id)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
