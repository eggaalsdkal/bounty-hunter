import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

// Get visitor ID from request header (injected by proxy)
function getVisitorId(req: Request): string {
  return (req.headers["x-visitor-id"] as string) || "";
}

// Auth middleware — look up user by visitorId header
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const visitorId = getVisitorId(req);
  if (!visitorId) return res.status(401).json({ message: "Not authenticated" });
  const user = storage.getUserByVisitorId(visitorId);
  if (!user) return res.status(401).json({ message: "Not authenticated" });
  (req as any).user = user;
  (req as any).userId = user.id;
  next();
}

// ===== STATIC GAME DATA (cards + quests definitions) =====
// These are imported inline to avoid circular dependencies with client data.ts

type Rarity = "R" | "SR" | "SSR" | "UR";

interface CardDef {
  id: string;
  name: string;
  type: string;
  subType: string;
  rarity: Rarity;
  description: string;
  effect: string;
  icon: string;
  cardNumber: string;
  imagePath: string;
}

interface QuestDef {
  id: string;
  title: string;
  description: string;
  region: string;
  difficulty: number;
  rarity: Rarity;
  reward: number;
  timeLimit: string;
  requirements: string;
  type: string;
  status: string;
}

// Gacha rates
const GACHA_RATES: Record<Rarity, number> = {
  R: 0.7,
  SR: 0.2,
  SSR: 0.08,
  UR: 0.02,
};

// Stat contribution mapping
const statContributions: Record<string, { primary: string[]; secondary: string[] }> = {
  '文案': { primary: ['INT'], secondary: ['CHA'] },
  '翻譯': { primary: ['INT'], secondary: ['LOG'] },
  '校對': { primary: ['INT'], secondary: [] },
  '設計': { primary: ['INT'], secondary: ['FOC'] },
  '攝影': { primary: ['FOC'], secondary: ['STR'] },
  '剪接': { primary: ['FOC'], secondary: ['INT'] },
  '數據': { primary: ['LOG', 'INT'], secondary: [] },
  '編程': { primary: ['LOG', 'INT'], secondary: [] },
  '分析': { primary: ['INT', 'LOG'], secondary: [] },
  '推廣': { primary: ['CHA'], secondary: ['INT'] },
  '銷售': { primary: ['CHA'], secondary: ['STR'] },
  '現場': { primary: ['STR'], secondary: ['CHA'] },
  '策略': { primary: ['INT', 'LOG', 'FOC'], secondary: ['CHA'] },
  '配送': { primary: ['STR'], secondary: [] },
  '問卷': { primary: ['STR', 'CHA'], secondary: [] },
  '模特': { primary: ['CHA'], secondary: ['STR'] },
  '試鏡': { primary: ['CHA'], secondary: [] },
};

// Quest type to stats (for recommendation)
const questTypeToStats: Record<string, string[]> = {
  '文案': ['INT'], '翻譯': ['INT'], '校對': ['INT'],
  '設計': ['INT', 'FOC'], '攝影': ['FOC'], '剪接': ['FOC'],
  '數據': ['LOG', 'INT'], '編程': ['LOG', 'INT'], '分析': ['INT', 'LOG'],
  '推廣': ['CHA'], '銷售': ['CHA'], '現場': ['STR'],
  '策略': ['INT', 'LOG', 'FOC'], '配送': ['STR'],
  '問卷': ['STR', 'CHA'], '模特': ['CHA'], '試鏡': ['CHA'],
};

function calculateStatsFromHistory(history: Array<{ type: string; hoursSpent: number; rating: number; completedAt: string }>) {
  const stats: Record<string, number> = { INT: 0, FOC: 0, STR: 0, LOG: 0, HP: 0, CHA: 0 };

  // HP calculation
  const dailyHours: Record<string, number> = {};
  for (const quest of history) {
    const day = quest.completedAt;
    dailyHours[day] = (dailyHours[day] || 0) + quest.hoursSpent;
  }
  const sortedDays = Object.keys(dailyHours).sort();
  if (sortedDays.length > 0) {
    const firstDay = new Date(sortedDays[0]);
    const today = new Date();
    let hp = 0;
    const d = new Date(firstDay);
    while (d <= today) {
      const dayStr = d.toISOString().split("T")[0];
      if (dailyHours[dayStr]) {
        hp += Math.min(dailyHours[dayStr] * 1.5, 15);
      } else {
        hp -= 2;
      }
      hp = Math.max(0, hp);
      d.setDate(d.getDate() + 1);
    }
    stats.HP = hp;
  }

  // Other stats
  for (const quest of history) {
    const contrib = statContributions[quest.type];
    if (!contrib) continue;
    for (const stat of contrib.primary) {
      if (stat === "HP") continue;
      stats[stat] += 2 + quest.hoursSpent * 0.5;
      if (quest.rating >= 5) stats[stat] += 1;
    }
    for (const stat of contrib.secondary) {
      if (stat === "HP") continue;
      stats[stat] += 1 + quest.hoursSpent * 0.2;
    }
    const growthBonus = quest.hoursSpent * 0.3;
    for (const key of Object.keys(stats)) {
      if (key === "HP") continue;
      stats[key] += growthBonus;
    }
  }

  // Cap at 100
  for (const key of Object.keys(stats)) {
    stats[key] = Math.min(100, Math.round(stats[key]));
  }
  return stats;
}

function getStatBreakdown(history: Array<{ type: string; hoursSpent: number; completedAt: string }>) {
  const breakdown: Record<string, { types: Record<string, number>; hours: number; count: number }> = {
    INT: { types: {}, hours: 0, count: 0 },
    FOC: { types: {}, hours: 0, count: 0 },
    STR: { types: {}, hours: 0, count: 0 },
    LOG: { types: {}, hours: 0, count: 0 },
    HP: { types: {}, hours: 0, count: 0 },
    CHA: { types: {}, hours: 0, count: 0 },
  };

  const dailyHoursMap: Record<string, number> = {};
  for (const quest of history) {
    dailyHoursMap[quest.completedAt] = (dailyHoursMap[quest.completedAt] || 0) + quest.hoursSpent;
  }
  breakdown["HP"].count = Object.keys(dailyHoursMap).length;
  breakdown["HP"].hours = Object.values(dailyHoursMap).reduce((s, h) => s + h, 0);

  for (const quest of history) {
    const contrib = statContributions[quest.type];
    if (!contrib) continue;
    for (const stat of contrib.primary) {
      if (stat === "HP") continue;
      breakdown[stat].types[quest.type] = (breakdown[stat].types[quest.type] || 0) + 1;
      breakdown[stat].hours += quest.hoursSpent;
      breakdown[stat].count += 1;
    }
    for (const stat of contrib.secondary) {
      if (stat === "HP") continue;
      breakdown[stat].types[quest.type] = (breakdown[stat].types[quest.type] || 0) + 1;
      breakdown[stat].hours += quest.hoursSpent * 0.4;
      breakdown[stat].count += 1;
    }
  }

  const result: Record<string, { fromQuests: string; totalHours: number; questCount: number }> = {};
  for (const [stat, data] of Object.entries(breakdown)) {
    const topTypes = Object.entries(data.types)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type}×${count}`);
    result[stat] = {
      fromQuests: topTypes.length > 0 ? topTypes.join("、") : "暫無",
      totalHours: Math.round(data.hours * 10) / 10,
      questCount: data.count,
    };
  }
  return result;
}

function getRecommendedQuests(
  allQuests: QuestDef[],
  stats: Record<string, number>,
  history: Array<{ type: string; region: string }>
) {
  const typeCounts: Record<string, number> = {};
  for (const q of history) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
  }

  const statEntries = Object.entries(stats);
  const sortedStats = [...statEntries].sort((a, b) => b[1] - a[1]);
  const topStats = sortedStats.slice(0, 3).map((s) => s[0]);

  const scored = allQuests
    .filter((q) => q.status === "available")
    .map((quest) => {
      let score = 0;
      const reasons: string[] = [];
      const relevantStats = questTypeToStats[quest.type] || [];

      const statMatchCount = relevantStats.filter((s) => topStats.includes(s)).length;
      if (statMatchCount > 0) {
        const statBonus = Math.min(40, statMatchCount * 20);
        score += statBonus;
        const labels: Record<string, string> = { INT: "智力", FOC: "專注", STR: "體力", LOG: "邏輯", HP: "血量", CHA: "魅力" };
        const matchedLabels = relevantStats.filter((s) => topStats.includes(s)).map((s) => labels[s] || s);
        reasons.push(`匹配你嘅${matchedLabels.join("、")}優勢`);
      }

      const typeCount = typeCounts[quest.type] || 0;
      if (typeCount >= 5) {
        score += 30;
        reasons.push(`已完成${typeCount}個同類任務，經驗豐富`);
      } else if (typeCount >= 2) {
        score += 20;
        reasons.push(`有${typeCount}次同類經驗`);
      } else if (typeCount === 1) {
        score += 10;
        reasons.push("曾完成同類任務");
      }

      const avgRelevantStat =
        relevantStats.length > 0 ? relevantStats.reduce((sum, s) => sum + (stats[s] || 0), 0) / relevantStats.length : 0;
      const idealDifficulty = Math.ceil(avgRelevantStat / 20);
      const diffGap = Math.abs(quest.difficulty - idealDifficulty);
      if (diffGap === 0) {
        score += 20;
        reasons.push("難度專為你設計");
      } else if (diffGap === 1) {
        score += 12;
        reasons.push(quest.difficulty > idealDifficulty ? "稍有挑戰，助你成長" : "得心應手");
      } else if (diffGap >= 3) {
        score -= 10;
      }

      const regionQuests = history.filter((h) => h.region === quest.region).length;
      if (regionQuests >= 3) {
        score += 10;
        reasons.push(`${quest.region}常客`);
      } else if (regionQuests >= 1) {
        score += 5;
      }

      return {
        ...quest,
        matchScore: Math.max(0, Math.min(100, score)),
        matchReasons: reasons,
      };
    });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

// XP / Level calculation helpers
function getXpMaxForLevel(level: number): number {
  return level * 500;
}

function calculateLevelAndXp(currentLevel: number, currentXp: number, xpGain: number) {
  let level = currentLevel;
  let xp = currentXp + xpGain;
  let xpMax = getXpMaxForLevel(level);
  while (xp >= xpMax) {
    xp -= xpMax;
    level += 1;
    xpMax = getXpMaxForLevel(level);
  }
  return { level, xp, xpMax };
}

// Lazy-loaded card and quest data (loaded once from a generated JSON at startup)
let allCards: CardDef[] = [];
let allQuests: QuestDef[] = [];

// We'll load these from a server-side data file
function loadGameData() {
  // Static quest data
  allQuests = [
    { id: 'q1', title: '社交媒體文案（3篇）', description: '為本地餐廳撰寫三篇 Instagram 宣傳文案，需配合品牌語調，每篇100-150字。', region: '文字之森', difficulty: 1, rarity: 'R', reward: 15, timeLimit: '24小時', requirements: '無', type: '文案', status: 'available' },
    { id: 'q2', title: 'SEO文章撰寫（1500字）', description: '撰寫一篇關於「香港數碼營銷趨勢」的SEO優化文章，需包含關鍵詞植入及內部連結建議。', region: '文字之森', difficulty: 2, rarity: 'SR', reward: 25, timeLimit: '48小時', requirements: 'INT 25+', type: '文案', status: 'available' },
    { id: 'q3', title: '中英商業文件翻譯', description: '翻譯一份2000字的商業企劃書，要求專業用語精準，保持原文語氣。', region: '文字之森', difficulty: 3, rarity: 'SR', reward: 40, timeLimit: '72小時', requirements: 'INT 30+', type: '翻譯', status: 'available' },
    { id: 'q4', title: '品牌Logo設計', description: '為新創咖啡品牌設計Logo，需提供3個方案及延伸應用展示。要求現代簡約風格。', region: '視覺神殿', difficulty: 3, rarity: 'SSR', reward: 80, timeLimit: '72小時', requirements: 'FOC 40+', type: '設計', status: 'available' },
    { id: 'q5', title: '產品攝影（10件）', description: '為電商平台拍攝10件服飾產品照片，白底去背，多角度拍攝。', region: '視覺神殿', difficulty: 2, rarity: 'SR', reward: 60, timeLimit: '48小時', requirements: 'FOC 25+', type: '攝影', status: 'available' },
    { id: 'q6', title: 'Excel數據整理（500行）', description: '整理及清洗500行客戶數據，包括去重、格式統一、缺失值填補。', region: '數字迷城', difficulty: 2, rarity: 'SR', reward: 20, timeLimit: '48小時', requirements: 'LOG 15+', type: '數據', status: 'available' },
    { id: 'q7', title: 'Python自動化腳本', description: '開發一個Python腳本，自動從指定網站收集產品價格資訊並整理成CSV。', region: '數字迷城', difficulty: 4, rarity: 'SSR', reward: 150, timeLimit: '7天', requirements: 'LOG 50+, INT 40+', type: '編程', status: 'available' },
    { id: 'q8', title: '市場調查報告', description: '針對香港飲品市場進行桌面研究，提交3000字市調報告含數據圖表。', region: '數字迷城', difficulty: 3, rarity: 'SR', reward: 50, timeLimit: '5天', requirements: 'LOG 30+, INT 25+', type: '分析', status: 'available' },
    { id: 'q9', title: '社媒推廣文案+排期', description: '為健身品牌制定一週社媒推廣計劃，包含7篇文案及最佳發布時間建議。', region: '商旅驛站', difficulty: 2, rarity: 'SR', reward: 35, timeLimit: '48小時', requirements: 'CHA 15+', type: '推廣', status: 'available' },
    { id: 'q10', title: '電話銷售（50通）', description: '根據提供的客戶名單進行電話推銷，介紹新產品並記錄客戶反饋。', region: '商旅驛站', difficulty: 2, rarity: 'R', reward: 30, timeLimit: '3天', requirements: 'CHA 20+', type: '銷售', status: 'available' },
    { id: 'q11', title: '神秘顧客探訪', description: '到指定連鎖餐廳進行神秘顧客探訪，填寫評估表格並拍攝紀錄照片。', region: '現場戰場', difficulty: 1, rarity: 'R', reward: 15, timeLimit: '24小時', requirements: '無', type: '現場', status: 'available' },
    { id: 'q12', title: '活動現場攝影', description: '為企業年度晚宴進行現場攝影，需4小時駐場，交付200+精修照片。', region: '現場戰場', difficulty: 3, rarity: 'SR', reward: 60, timeLimit: '48小時', requirements: 'FOC 30+, STR 20+', type: '現場', status: 'available' },
    { id: 'q13', title: '年度品牌視覺策略', description: '為大型企業制定年度品牌視覺策略，包括品牌指南、模板系統、視覺語言定義。', region: '傳說聖域', difficulty: 5, rarity: 'UR', reward: 1500, timeLimit: '30天', requirements: 'Lv.6+, FOC 80+, INT 60+', type: '策略', status: 'available' },
    { id: 'q14', title: 'UI介面設計（App）', description: '為健康管理App設計5個核心頁面的UI界面，需提供高保真原型。', region: '視覺神殿', difficulty: 4, rarity: 'UR', reward: 250, timeLimit: '7天', requirements: 'FOC 55+, INT 35+', type: '設計', status: 'available' },
    { id: 'q15', title: '企業內部系統開發', description: '開發一個員工考勤管理系統，包含打卡、請假、報表功能。React+Node.js。', region: '數字迷城', difficulty: 5, rarity: 'UR', reward: 800, timeLimit: '14天', requirements: 'LOG 70+, INT 50+, Lv.5+', type: '編程', status: 'available' },
    { id: 'q16', title: '問卷調查執行', description: '在指定商場進行100份消費者問卷調查，需完成數據輸入及基本統計。', region: '現場戰場', difficulty: 2, rarity: 'R', reward: 25, timeLimit: '3天', requirements: 'STR 10+, CHA 10+', type: '現場', status: 'available' },
  ];

  // Static card definitions (without quantity — that's user-specific)
  allCards = [
    { id: 'c001', name: '疾風之靴', type: '技能卡', subType: '主動', rarity: 'R', description: "風之力量注入雙足，讓你在任務戰場上搶先一步。", effect: "使用後 24 小時內，新任務通知比其他獵人早 10 分鐘推送。", icon: 'Zap', cardNumber: '#001/100', imagePath: './cards/card-c001.webp' },
    { id: 'c002', name: '獵人日誌', type: '任務卡', subType: '成就', rarity: 'R', description: "記錄每一次出征，讓你的傳說在歷史中留名。", effect: "完成首次任務後解鎖，個人檔案顯示「初出茅廬」成就徽章。", icon: 'BookOpen', cardNumber: '#002/100', imagePath: './cards/card-c002.webp' },
    { id: 'c003', name: '鷹眼透鏡', type: '技能卡', subType: '主動', rarity: 'R', description: "戴上這面魔法透鏡，任務的細節一覽無遺。", effect: "使用後可查看任意 3 個任務的完整細節，有效期 48 小時。", icon: 'Eye', cardNumber: '#003/100', imagePath: './cards/card-c003.webp' },
    { id: 'c004', name: '晨星鬧鈴', type: '技能卡', subType: '主動', rarity: 'R', description: "讓晨星為你報時，每天第一個搶先行動。", effect: "使用後，連續 3 天每日早上 8:00 推送當日新增任務摘要通知。", icon: 'Bell', cardNumber: '#004/100', imagePath: './cards/card-c004.webp' },
    { id: 'c005', name: '新手護符', type: '技能卡', subType: '被動', rarity: 'R', description: "初入江湖，護符護你平安踏出第一步。", effect: "裝備後，首次收到的評價若低於 3 星，自動隱藏不計入平均分。", icon: 'Shield', cardNumber: '#005/100', imagePath: './cards/card-c005.webp' },
    { id: 'c006', name: '經驗水晶（小）', type: '技能卡', subType: '主動', rarity: 'R', description: "細小的水晶中蘊藏著純粹的成長之力。", effect: "使用後 24 小時內，完成任務所獲得的經驗值 +15%。", icon: 'Gem', cardNumber: '#006/100', imagePath: './cards/card-c006.webp' },
    { id: 'c007', name: '任務收藏夾', type: '技能卡', subType: '主動', rarity: 'R', description: "好的任務不能錯過，先收藏再說。", effect: "使用後解鎖「任務收藏」功能，可永久收藏最多 10 個任務快速查看。", icon: 'Bookmark', cardNumber: '#007/100', imagePath: './cards/card-c007.webp' },
    { id: 'c008', name: '初心探針', type: '任務卡', subType: '成就', rarity: 'R', description: "探索三個不同類型的任務，發現自己的潛力所在。", effect: "完成 3 種不同類別任務後解鎖。", icon: 'Compass', cardNumber: '#008/100', imagePath: './cards/card-c008.webp' },
    { id: 'c009', name: '幸運骰子', type: '技能卡', subType: '主動', rarity: 'R', description: "擲出幸運一擲，命運掌握在自己手中。", effect: "使用後獲得 1 次額外每日抽卡機會。", icon: 'Dice5', cardNumber: '#009/100', imagePath: './cards/card-c009.webp' },
    { id: 'c010', name: '速覽鏡', type: '技能卡', subType: '被動', rarity: 'R', description: "任務列表在眼前展開，重要資訊一眼看透。", effect: "裝備後，任務列表中每個任務顯示額外一行摘要資訊，持續 7 天。", icon: 'ScanSearch', cardNumber: '#010/100', imagePath: './cards/card-c010.webp' },
  ];

  // Generate placeholder cards for c011-c100 with proper rarity distribution
  // R: c011-c040, SR: c041-c070, SSR: c071-c090, UR: c091-c100
  const rarityRanges: Array<{ start: number; end: number; rarity: Rarity }> = [
    { start: 11, end: 40, rarity: 'R' },
    { start: 41, end: 70, rarity: 'SR' },
    { start: 71, end: 90, rarity: 'SSR' },
    { start: 91, end: 100, rarity: 'UR' },
  ];

  for (const range of rarityRanges) {
    for (let i = range.start; i <= range.end; i++) {
      const cid = `c${String(i).padStart(3, '0')}`;
      if (!allCards.find(c => c.id === cid)) {
        allCards.push({
          id: cid,
          name: `卡牌 #${i}`,
          type: '技能卡',
          subType: '主動',
          rarity: range.rarity,
          description: `神秘的 ${range.rarity} 級卡牌。`,
          effect: `${range.rarity} 級效果。`,
          icon: 'Sparkles',
          cardNumber: `#${String(i).padStart(3, '0')}/100`,
          imagePath: `./cards/card-${cid}.webp`,
        });
      }
    }
  }

  // Sort by id
  allCards.sort((a, b) => a.id.localeCompare(b.id));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Load game data
  loadGameData();

  // Health check endpoint for Railway
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // ===== AUTH API =====

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, displayName } = req.body;
      const visitorId = getVisitorId(req);

      if (!email || !password || !displayName) {
        return res.status(400).json({ message: "Email, password, and display name are required" });
      }

      // Check if email already exists
      const existing = storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = storage.createUser({
        email,
        password: hashedPassword,
        displayName,
      });

      // Create initial stats (all 0)
      storage.createUserStats({
        userId: user.id,
        INT: 0,
        FOC: 0,
        STR: 0,
        LOG: 0,
        HP: 0,
        CHA: 0,
      });

      // Give 3 random R-rarity welcome cards
      const rCards = allCards.filter((c) => c.rarity === "R");
      const welcomeCardIds: string[] = [];
      const usedIds = new Set<string>();
      while (welcomeCardIds.length < 3 && welcomeCardIds.length < rCards.length) {
        const randomCard = rCards[Math.floor(Math.random() * rCards.length)];
        if (!usedIds.has(randomCard.id)) {
          usedIds.add(randomCard.id);
          welcomeCardIds.push(randomCard.id);
        }
      }
      for (let i = 0; i < welcomeCardIds.length; i++) {
        storage.upsertUserCard(user.id, welcomeCardIds[i], 1);
      }

      // Bind visitorId to user
      if (visitorId) {
        storage.updateVisitorId(user.id, visitorId);
      }

      return res.status(201).json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        level: user.level,
        xp: user.xp,
        currency: user.currency,
      });
    } catch (error: any) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const visitorId = getVisitorId(req);

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Bind visitorId to user
      if (visitorId) {
        storage.updateVisitorId(user.id, visitorId);
      }

      return res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        level: user.level,
        xp: user.xp,
        currency: user.currency,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const visitorId = getVisitorId(req);
    if (!visitorId) return res.status(401).json({ message: "Not authenticated" });
    const user = storage.getUserByVisitorId(visitorId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    return res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      level: user.level,
      xp: user.xp,
      currency: user.currency,
    });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const visitorId = getVisitorId(req);
    const user = storage.getUserByVisitorId(visitorId);
    if (user) {
      storage.clearVisitorId(user.id);
    }
    return res.json({ message: "Logged out" });
  });

  // ===== CARDS API =====

  app.get("/api/cards", (_req: Request, res: Response) => {
    return res.json(allCards);
  });

  app.get("/api/cards/inventory", requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const inventory = storage.getUserCards(userId);
    // Return a map of cardId -> quantity
    const inventoryMap: Record<string, number> = {};
    for (const item of inventory) {
      inventoryMap[item.cardId] = item.quantity;
    }
    return res.json(inventoryMap);
  });

  app.post("/api/cards/draw", requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const today = new Date().toISOString().split("T")[0];

    // Check if already drawn today
    const existing = storage.getDailyDraw(userId, today);
    if (existing) {
      return res.status(400).json({ message: "Already drawn today", alreadyDrawn: true });
    }

    // Roll rarity
    const roll = Math.random();
    let rarity: Rarity = "R";
    let cumulative = 0;
    for (const [r, rate] of Object.entries(GACHA_RATES) as [Rarity, number][]) {
      cumulative += rate;
      if (roll < cumulative) {
        rarity = r;
        break;
      }
    }

    // Pick random card of that rarity
    const pool = allCards.filter((c) => c.rarity === rarity);
    const drawnCard = pool[Math.floor(Math.random() * pool.length)];

    // Add to inventory
    const updatedCard = storage.upsertUserCard(userId, drawnCard.id, 1);

    // Log the draw
    storage.addDailyDraw({
      userId,
      cardId: drawnCard.id,
      drawnAt: today,
    });

    return res.json({
      card: drawnCard,
      quantity: updatedCard.quantity,
    });
  });

  app.post("/api/cards/use/:cardId", requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const cardId = String(req.params.cardId);

    const userCard = storage.getUserCard(userId, cardId);
    if (!userCard || userCard.quantity <= 0) {
      return res.status(400).json({ message: "You don't have this card" });
    }

    // Consume 1 card
    const updated = storage.upsertUserCard(userId, cardId, -1);

    return res.json({
      cardId,
      remainingQuantity: updated.quantity,
      message: "Card used successfully",
    });
  });

  // ===== QUESTS API =====

  app.get("/api/quests", requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId;

    // Get user's quest history for recommendations
    const history = storage.getQuestHistory(userId);
    const historyForCalc = history.map((h) => ({
      type: h.type,
      hoursSpent: h.hoursSpent,
      rating: h.rating,
      completedAt: h.completedAt,
      region: "", // We need region from quest data
    }));

    // Compute stats for recommendation
    const stats = calculateStatsFromHistory(historyForCalc);

    // For recommendations, enrich history with region info
    const historyWithRegion = history.map((h) => {
      const quest = allQuests.find((q) => q.id === h.questId);
      return { type: h.type, region: quest?.region || "" };
    });

    const recommended = getRecommendedQuests(allQuests, stats, historyWithRegion);

    // Mark accepted quests
    const accepted = storage.getAcceptedQuests(userId);
    const acceptedMap = new Map(accepted.map((a) => [a.questId, a.status]));

    const result = recommended.map((q) => ({
      ...q,
      userStatus: acceptedMap.get(q.id) || null,
    }));

    return res.json(result);
  });

  app.post("/api/quests/:id/accept", requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const questId = String(req.params.id);

    const quest = allQuests.find((q) => q.id === questId);
    if (!quest) {
      return res.status(404).json({ message: "Quest not found" });
    }

    // Check if already accepted
    const existing = storage.getAcceptedQuest(userId, questId);
    if (existing && existing.status === "active") {
      return res.status(400).json({ message: "Quest already accepted" });
    }

    const accepted = storage.acceptQuest({
      userId,
      questId,
      acceptedAt: new Date().toISOString(),
      status: "active",
    });

    return res.json(accepted);
  });

  app.post("/api/quests/:id/complete", requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const questId = String(req.params.id);
    const { hoursSpent, rating } = req.body;

    const quest = allQuests.find((q) => q.id === questId);
    if (!quest) {
      return res.status(404).json({ message: "Quest not found" });
    }

    // Check if accepted
    const accepted = storage.getAcceptedQuest(userId, questId);
    if (!accepted || accepted.status !== "active") {
      return res.status(400).json({ message: "Quest not active" });
    }

    // Mark as completed
    storage.updateAcceptedQuestStatus(userId, questId, "completed");

    // Add to quest history
    storage.addQuestHistory({
      userId,
      questId,
      type: quest.type,
      hoursSpent: hoursSpent || 3,
      rating: rating || 5,
      reward: quest.reward,
      completedAt: new Date().toISOString().split("T")[0],
    });

    // Update user currency + XP
    const user = storage.getUser(userId)!;
    const xpGain = quest.reward * 2; // 2 XP per 奧里
    const { level, xp: newXp } = calculateLevelAndXp(user.level, user.xp, xpGain);

    storage.updateUser(userId, {
      level,
      xp: newXp,
      currency: user.currency + quest.reward,
    });

    // Recalculate stats
    const allHistory = storage.getQuestHistory(userId);
    const calcHistory = allHistory.map((h) => ({
      type: h.type,
      hoursSpent: h.hoursSpent,
      rating: h.rating,
      completedAt: h.completedAt,
    }));
    const newStats = calculateStatsFromHistory(calcHistory);
    storage.updateUserStats(userId, {
      INT: newStats.INT,
      FOC: newStats.FOC,
      STR: newStats.STR,
      LOG: newStats.LOG,
      HP: newStats.HP,
      CHA: newStats.CHA,
    });

    return res.json({
      message: "Quest completed!",
      reward: quest.reward,
      xpGain,
      newLevel: level,
      newXp,
      newCurrency: user.currency + quest.reward,
    });
  });

  app.get("/api/quests/active", requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const accepted = storage.getAcceptedQuests(userId).filter((a) => a.status === "active");

    // Enrich with quest data
    const result = accepted.map((a) => {
      const quest = allQuests.find((q) => q.id === a.questId);
      return {
        ...a,
        quest,
      };
    });

    return res.json(result);
  });

  // ===== PROFILE API =====

  app.get("/api/profile", requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const user = storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = storage.getUserStats(userId);
    const history = storage.getQuestHistory(userId);
    const cards = storage.getUserCards(userId);
    const accepted = storage.getAcceptedQuests(userId);

    const completedCount = accepted.filter((a) => a.status === "completed").length;
    const totalEarnings = history.reduce((sum, h) => sum + h.reward, 0);
    const avgRating = history.length > 0 ? Math.round((history.reduce((sum, h) => sum + h.rating, 0) / history.length) * 10) / 10 : 0;
    const totalHours = Math.round(history.reduce((sum, h) => sum + h.hoursSpent, 0) * 10) / 10;
    const ownedCardTypes = cards.filter((c) => c.quantity > 0).length;

    // Calculate active days
    const activeDays = new Set(history.map((h) => h.completedAt)).size;

    return res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      level: user.level,
      xp: user.xp,
      xpMax: getXpMaxForLevel(user.level),
      currency: user.currency,
      stats: stats
        ? { INT: stats.INT, FOC: stats.FOC, STR: stats.STR, LOG: stats.LOG, HP: stats.HP, CHA: stats.CHA }
        : { INT: 0, FOC: 0, STR: 0, LOG: 0, HP: 0, CHA: 0 },
      completedQuests: completedCount,
      totalEarnings,
      avgRating,
      activeDays,
      ownedCards: ownedCardTypes,
      totalHours,
      questHistoryCount: history.length,
    });
  });

  app.get("/api/profile/stats", requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const history = storage.getQuestHistory(userId);

    const calcHistory = history.map((h) => ({
      type: h.type,
      hoursSpent: h.hoursSpent,
      rating: h.rating,
      completedAt: h.completedAt,
    }));

    const stats = calculateStatsFromHistory(calcHistory);
    const breakdown = getStatBreakdown(calcHistory);

    // Update stored stats
    storage.updateUserStats(userId, {
      INT: stats.INT,
      FOC: stats.FOC,
      STR: stats.STR,
      LOG: stats.LOG,
      HP: stats.HP,
      CHA: stats.CHA,
    });

    return res.json({
      stats,
      breakdown,
    });
  });

  return httpServer;
}
