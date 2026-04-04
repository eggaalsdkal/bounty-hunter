import { useState } from "react";
import {
  FileText, Search, Gem, Database, Eye, Languages, Camera, Terminal,
  Megaphone, Sparkles, Layout, Server, Zap, Shield, Sword, Coins,
  Target, Send, TrendingUp, Star, Moon, Medal, Flame, Trophy, BookOpen
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cards, rarityColors, rarityLabels, rarityCssClass, regionColors,
  type GameCard, type CardType,
} from "@/lib/data";

const iconMap: Record<string, typeof FileText> = {
  FileText, Search, Gem, Database, Eye, Languages, Camera, Terminal,
  Megaphone, Sparkles, Layout, Server, Zap, Shield, Sword, Coins,
  Target, Send, TrendingUp, Star, Moon, Medal, Flame, Trophy, BookOpen,
};

function GameCardComponent({ card, onClick }: { card: GameCard; onClick: () => void }) {
  const Icon = iconMap[card.icon] || BookOpen;
  const rarityClass = rarityCssClass[card.rarity];
  const rarityColor = rarityColors[card.rarity];
  const isHighRarity = ['S', 'SS'].includes(card.rarity);
  const isMedRarity = ['B', 'A'].includes(card.rarity);

  return (
    <div
      onClick={onClick}
      className={`game-card relative rounded-xl cursor-pointer ${rarityClass}`}
      style={{
        minHeight: '260px',
      }}
      data-testid={`card-${card.id}`}
    >
      {/* Inner content (above the ::before and ::after pseudo-elements) */}
      <div
        className="relative z-10 h-full flex flex-col p-3"
        style={{
          backgroundColor: '#1a2030',
          margin: isHighRarity ? '3px' : '2px',
          borderRadius: '10px',
          backgroundImage: isHighRarity
            ? `radial-gradient(ellipse at top, ${rarityColor}08 0%, transparent 50%)`
            : isMedRarity
              ? `radial-gradient(ellipse at top, ${rarityColor}06 0%, transparent 40%)`
              : undefined,
        }}
      >
        {/* Top: Region + Rarity */}
        <div className="flex items-center justify-between mb-3">
          {card.region !== '通用' ? (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: `${regionColors[card.region as keyof typeof regionColors]}22`,
                color: regionColors[card.region as keyof typeof regionColors],
              }}
            >
              {card.region}
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-white/5 text-muted-foreground">
              通用
            </span>
          )}
          <span
            className="text-[11px] px-1.5 py-0.5 rounded font-black tracking-wider"
            style={{
              color: rarityColor,
              textShadow: isHighRarity ? `0 0 10px ${rarityColor}` : isMedRarity ? `0 0 6px ${rarityColor}80` : undefined,
            }}
          >
            {card.rarity}
          </span>
        </div>

        {/* Icon area */}
        <div className="flex-1 flex items-center justify-center py-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${rarityColor}18, ${rarityColor}08)`,
              boxShadow: isHighRarity
                ? `0 0 30px ${rarityColor}25, inset 0 0 20px ${rarityColor}10`
                : isMedRarity
                  ? `0 0 20px ${rarityColor}15`
                  : undefined,
            }}
          >
            <Icon
              size={32}
              style={{ color: rarityColor }}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Card name */}
        <h3
          className="font-display font-bold text-sm text-center leading-tight"
          style={{
            color: isHighRarity ? rarityColor : '#e8e4d9',
            textShadow: isHighRarity ? `0 0 12px ${rarityColor}40` : undefined,
          }}
        >
          {card.name}
        </h3>

        {/* Bottom: Type + Number */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <span className="text-[9px] text-muted-foreground">{card.type}</span>
          <span className="text-[9px] text-muted-foreground font-mono">{card.cardNumber}</span>
        </div>

        {/* Owned indicator */}
        {!card.isOwned && (
          <div className="absolute inset-0 bg-black/60 rounded-[10px] flex items-center justify-center z-20 backdrop-blur-[1px]">
            <span className="text-xs text-white/40 font-medium">未獲得</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CardCollection() {
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const ownedCount = cards.filter(c => c.isOwned).length;
  const totalCount = 100;

  const filteredCards = cards.filter(c => {
    if (activeTab === "all") return true;
    if (activeTab === "任務卡") return c.type === "任務卡";
    if (activeTab === "技能卡") return c.type === "技能卡";
    if (activeTab === "成就卡") return c.type === "成就卡";
    return true;
  });

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5" data-testid="card-collection-page">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">卡牌圖鑑</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Card Collection — 收集所有卡牌，成為卡牌之王</p>
      </div>

      {/* Collection progress */}
      <div className="bg-card rounded-xl border border-border p-4" data-testid="collection-progress">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground font-medium">已收集卡牌</span>
          <span className="font-display font-bold text-primary">{ownedCount}/{totalCount} 張</span>
        </div>
        <Progress value={(ownedCount / totalCount) * 100} className="h-2" />
        <p className="text-[11px] text-muted-foreground mt-2">收集更多任務卡、技能卡與成就卡來解鎖隱藏獎勵</p>
      </div>

      {/* Tab filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="card-type-tabs">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="all" className="text-xs" data-testid="tab-all">全部 ({cards.length})</TabsTrigger>
          <TabsTrigger value="任務卡" className="text-xs" data-testid="tab-task">任務卡 ({cards.filter(c => c.type === '任務卡').length})</TabsTrigger>
          <TabsTrigger value="技能卡" className="text-xs" data-testid="tab-skill">技能卡 ({cards.filter(c => c.type === '技能卡').length})</TabsTrigger>
          <TabsTrigger value="成就卡" className="text-xs" data-testid="tab-achievement">成就卡 ({cards.filter(c => c.type === '成就卡').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Card grid */}
      <div className="grid grid-cols-5 gap-4" data-testid="card-grid">
        {filteredCards.map((card) => (
          <GameCardComponent key={card.id} card={card} onClick={() => setSelectedCard(card)} />
        ))}
      </div>

      {/* Card detail dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          {selectedCard && (
            <CardDetailView card={selectedCard} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardDetailView({ card }: { card: GameCard }) {
  const Icon = iconMap[card.icon] || BookOpen;
  const rarityColor = rarityColors[card.rarity];
  const isHighRarity = ['S', 'SS'].includes(card.rarity);

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          {card.region !== '通用' ? (
            <span
              className="text-[10px] px-2 py-0.5 rounded font-medium"
              style={{
                backgroundColor: `${regionColors[card.region as keyof typeof regionColors]}22`,
                color: regionColors[card.region as keyof typeof regionColors],
              }}
            >
              {card.region}
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-accent text-muted-foreground">
              通用
            </span>
          )}
          <Badge variant="outline" style={{ borderColor: rarityColor, color: rarityColor }}>
            {card.rarity}級 · {rarityLabels[card.rarity]}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono ml-auto">{card.cardNumber}</span>
        </div>
        <DialogTitle className="font-display text-lg">{card.name}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 mt-2">
        {/* Large icon */}
        <div className="flex justify-center py-6">
          <div
            className={`w-24 h-24 rounded-2xl flex items-center justify-center ${rarityCssClass[card.rarity]}`}
            style={{
              background: `linear-gradient(135deg, ${rarityColor}20, ${rarityColor}08)`,
              boxShadow: isHighRarity ? `0 0 40px ${rarityColor}30` : `0 0 20px ${rarityColor}15`,
            }}
          >
            <Icon size={48} style={{ color: rarityColor }} strokeWidth={1.5} />
          </div>
        </div>

        {/* Description / Lore */}
        <div className="bg-accent rounded-lg p-4">
          <p className="text-sm text-muted-foreground leading-relaxed italic">「{card.description}」</p>
        </div>

        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">類型:</span>
          <Badge variant="secondary" className="text-[11px]">{card.type}</Badge>
        </div>

        {/* Requirements / Reward / Effect */}
        {card.requirements && (
          <div className="bg-accent rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground">獲得條件</p>
            <p className="text-sm text-foreground mt-0.5">{card.requirements}</p>
          </div>
        )}
        {card.reward && (
          <div className="bg-accent rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground">報酬</p>
            <p className="text-sm font-bold text-gold mt-0.5">{card.reward}</p>
          </div>
        )}
        {card.effect && (
          <div className="bg-accent rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground">效果</p>
            <p className="text-sm text-primary mt-0.5">{card.effect}</p>
          </div>
        )}

        {/* Action buttons */}
        {card.type === '技能卡' && card.isOwned && (
          <Button className="w-full font-display font-bold" data-testid="button-use-card">
            使用
          </Button>
        )}
        {!card.isOwned && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">尚未獲得此卡牌</p>
          </div>
        )}
      </div>
    </>
  );
}
