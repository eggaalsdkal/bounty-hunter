// Bounty Hunter — Sample Data
// Currency: 奧里 (Ori) — 1 奧里 = 10 HKD

export type Rarity = 'R' | 'SR' | 'SSR' | 'UR';
export type CardType = '任務卡' | '技能卡' | '陷阱卡' | '特殊卡' | '挑戰卡';
export type Region = '文字之森' | '視覺神殿' | '數字迷城' | '商旅驛站' | '現場戰場' | '傳說聖域';

export interface PlayerProfile {
  hunterName: string;
  title: string;
  className: string;
  classEn: string;
  level: number;
  levelTitle: string;
  xp: number;
  xpMax: number;
  currency: number;
  stats: {
    INT: number;
    FOC: number;
    STR: number;
    LOG: number;
    HP: number;
    CHA: number;
  };
  completedQuests: number;
  totalEarnings: number;
  avgRating: number;
  activeDays: number;
  ownedCards: number;
  guild: string;
  titles: string[];
  equippedCards: string[];
}

export interface GameCard {
  id: string;
  name: string;
  type: CardType;
  subType: '主動' | '被動' | '成就' | '攻擊' | '防禦' | '特殊';
  rarity: Rarity;
  description: string;
  effect: string;
  icon: string;
  cardNumber: string; // #001/100 格式
  imagePath: string;  // AI 生成圖片路徑
  quantity: number;   // 擁有數量（消耗品，用一次 -1，0 = 未擁有）
}

// 每日抽卡系統 — 每天免費抽一張
// 抽卡機率：R 70% / SR 20% / SSR 8% / UR 2%
export const GACHA_RATES: Record<Rarity, number> = {
  R: 0.70,
  SR: 0.20,
  SSR: 0.08,
  UR: 0.02,
};

export function drawCard(allCards: GameCard[]): GameCard {
  // Step 1: Roll rarity
  const roll = Math.random();
  let rarity: Rarity = 'R';
  let cumulative = 0;
  for (const [r, rate] of Object.entries(GACHA_RATES) as [Rarity, number][]) {
    cumulative += rate;
    if (roll < cumulative) {
      rarity = r;
      break;
    }
  }
  // Step 2: Pick random card of that rarity
  const pool = allCards.filter(c => c.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  region: Region;
  difficulty: number; // 1-5 stars
  rarity: Rarity;
  reward: number; // 奧里
  timeLimit: string;
  requirements: string;
  type: string;
  status: 'available' | 'accepted' | 'completed';
}

export interface DailyQuest {
  id: string;
  title: string;
  reward: string;
  completed: boolean;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  type: 'quest' | 'card' | 'level' | 'achievement';
}

// Rarity color mapping
export const rarityColors: Record<Rarity, string> = {
  R: '#60a5fa',      // 藍色
  SR: '#a855f7',     // 紫色
  SSR: '#fbbf24',    // 金色
  UR: '#ef4444',     // 紅色（帶光暈）
};

export const rarityLabels: Record<Rarity, string> = {
  R: '稀有',
  SR: '超稀有',
  SSR: '極稀有',
  UR: '究極稀有',
};

export const rarityCssClass: Record<Rarity, string> = {
  R: 'rarity-r',
  SR: 'rarity-sr',
  SSR: 'rarity-ssr',
  UR: 'rarity-ur',
};

export const regionColors: Record<Region, string> = {
  '文字之森': '#2d5a3d',
  '視覺神殿': '#7c3aed',
  '數字迷城': '#0ea5e9',
  '商旅驛站': '#d97706',
  '現場戰場': '#dc2626',
  '傳說聖域': '#fbbf24',
};

export const regionIcons: Record<Region, string> = {
  '文字之森': 'BookOpen',
  '視覺神殿': 'Palette',
  '數字迷城': 'Code2',
  '商旅驛站': 'TrendingUp',
  '現場戰場': 'Zap',
  '傳說聖域': 'Crown',
};

export const regionEnNames: Record<Region, string> = {
  '文字之森': 'Inkwood',
  '視覺神殿': 'Visia',
  '數字迷城': 'Datahex',
  '商旅驛站': 'Tradehaven',
  '現場戰場': 'Frontline',
  '傳說聖域': "Legend's Hall",
};

export const regionDescriptions: Record<Region, string> = {
  '文字之森': '文案/翻譯',
  '視覺神殿': '設計/攝影',
  '數字迷城': '數據/編程',
  '商旅驛站': '銷售/推廣',
  '現場戰場': '現場任務',
  '傳說聖域': 'SS級任務',
};

// ===== DYNAMIC STAT SYSTEM =====
// Stats are calculated from completed quest history, NOT hardcoded.

export interface CompletedQuest {
  id: string;
  title: string;
  region: Region;
  type: string; // 文案, 翻譯, 設計, 攝影, 數據, 編程, 分析, 推廣, 銷售, 現場, 策略
  hoursSpent: number; // hours spent on this quest
  rating: number; // 1-5 stars received
  reward: number; // 奧里
  completedAt: string; // date string
}

// Stat contribution mapping: which quest types boost which stats
// Each quest type has primary stats (big boost) and secondary stats (small boost)
const statContributions: Record<string, { primary: (keyof PlayerProfile['stats'])[]; secondary: (keyof PlayerProfile['stats'])[] }> = {
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

// Calculate stats dynamically from quest history
// Rules:
// - Primary stat: +2 points per quest + 0.5 per hour spent
// - Secondary stat: +1 point per quest + 0.2 per hour spent
// - HP (血量): Calculated DIFFERENTLY — based on daily total task hours.
//   Each day with tasks: HP += dailyHours * 1.5 (max 15 per day).
//   Days without tasks (gaps in history): HP decays by -2 per inactive day.
// - High rating bonus: 5-star quests give +1 bonus to primary stats
// - Base: all stats start at 0 — you earn everything from scratch
export function calculateStats(history: CompletedQuest[]): PlayerProfile['stats'] {
  const stats = { INT: 0, FOC: 0, STR: 0, LOG: 0, HP: 0, CHA: 0 };

  // --- HP calculation: daily task time based with decay ---
  const dailyHours: Record<string, number> = {};
  for (const quest of history) {
    const day = quest.completedAt;
    dailyHours[day] = (dailyHours[day] || 0) + quest.hoursSpent;
  }
  // Sort all dates
  const sortedDays = Object.keys(dailyHours).sort();
  if (sortedDays.length > 0) {
    const firstDay = new Date(sortedDays[0]);
    const lastDay = new Date(sortedDays[sortedDays.length - 1]);
    const today = new Date('2026-04-04'); // current date
    // Walk through each day from first to today
    let hp = 0;
    const d = new Date(firstDay);
    while (d <= today) {
      const dayStr = d.toISOString().split('T')[0];
      if (dailyHours[dayStr]) {
        // Active day: gain HP based on hours worked (capped at 15 per day)
        hp += Math.min(dailyHours[dayStr] * 1.5, 15);
      } else {
        // Inactive day: HP decays
        hp -= 2;
      }
      hp = Math.max(0, hp); // HP can't go below 0
      d.setDate(d.getDate() + 1);
    }
    stats.HP = hp;
  }

  // --- Other stats: quest-type based ---
  for (const quest of history) {
    const contrib = statContributions[quest.type];
    if (!contrib) continue;

    // Primary stats: big boost
    for (const stat of contrib.primary) {
      if (stat === 'HP') continue; // HP handled above
      stats[stat] += 2 + quest.hoursSpent * 0.5;
      if (quest.rating >= 5) stats[stat] += 1; // Perfect rating bonus
    }

    // Secondary stats: small boost
    for (const stat of contrib.secondary) {
      if (stat === 'HP') continue;
      stats[stat] += 1 + quest.hoursSpent * 0.2;
    }

    // General growth: every hour of work slightly boosts non-HP stats
    const growthBonus = quest.hoursSpent * 0.3;
    for (const key of Object.keys(stats) as (keyof typeof stats)[]) {
      if (key === 'HP') continue;
      stats[key] += growthBonus;
    }
  }

  // Cap all stats at 100, round to integers
  for (const key of Object.keys(stats) as (keyof typeof stats)[]) {
    stats[key] = Math.min(100, Math.round(stats[key]));
  }

  return stats;
}

// Explain which quests contributed most to each stat
export function getStatBreakdown(history: CompletedQuest[]): Record<keyof PlayerProfile['stats'], { fromQuests: string; totalHours: number; questCount: number }> {
  const breakdown: Record<string, { types: Record<string, number>; hours: number; count: number }> = {
    INT: { types: {}, hours: 0, count: 0 },
    FOC: { types: {}, hours: 0, count: 0 },
    STR: { types: {}, hours: 0, count: 0 },
    LOG: { types: {}, hours: 0, count: 0 },
    HP: { types: {}, hours: 0, count: 0 },
    CHA: { types: {}, hours: 0, count: 0 },
  };

  // HP special: count active days and total daily hours
  const dailyHoursMap: Record<string, number> = {};
  for (const quest of history) {
    const day = quest.completedAt;
    dailyHoursMap[day] = (dailyHoursMap[day] || 0) + quest.hoursSpent;
  }
  const activeDayCount = Object.keys(dailyHoursMap).length;
  const totalDailyHours = Object.values(dailyHoursMap).reduce((s, h) => s + h, 0);
  breakdown['HP'].count = activeDayCount;
  breakdown['HP'].hours = totalDailyHours;
  breakdown['HP'].types['活躍日'] = activeDayCount;

  for (const quest of history) {
    const contrib = statContributions[quest.type];
    if (!contrib) continue;

    for (const stat of contrib.primary) {
      if (stat === 'HP') continue;
      breakdown[stat].types[quest.type] = (breakdown[stat].types[quest.type] || 0) + 1;
      breakdown[stat].hours += quest.hoursSpent;
      breakdown[stat].count += 1;
    }
    for (const stat of contrib.secondary) {
      if (stat === 'HP') continue;
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
      fromQuests: topTypes.length > 0 ? topTypes.join('、') : '暫無',
      totalHours: Math.round(data.hours * 10) / 10,
      questCount: data.count,
    };
  }

  return result as Record<keyof PlayerProfile['stats'], { fromQuests: string; totalHours: number; questCount: number }>;
}

// Sample quest history — this drives ALL stats dynamically
export const questHistory: CompletedQuest[] = [
  // 文字類（大量） → 推高 INT, LNG
  { id: 'h1', title: '社交媒體文案（3篇）', region: '文字之森', type: '文案', hoursSpent: 1.5, rating: 5, reward: 15, completedAt: '2026-03-23' },
  { id: 'h2', title: 'SEO文章撰寫', region: '文字之森', type: '文案', hoursSpent: 3, rating: 4, reward: 25, completedAt: '2026-03-24' },
  { id: 'h3', title: '產品描述翻譯', region: '文字之森', type: '翻譯', hoursSpent: 2, rating: 5, reward: 20, completedAt: '2026-03-25' },
  { id: 'h4', title: '品牌故事撰寫', region: '文字之森', type: '文案', hoursSpent: 4, rating: 5, reward: 40, completedAt: '2026-03-26' },
  { id: 'h5', title: '英文新聞翻譯', region: '文字之森', type: '翻譯', hoursSpent: 2.5, rating: 4, reward: 30, completedAt: '2026-03-26' },
  { id: 'h6', title: 'IG限時動態文案', region: '文字之森', type: '文案', hoursSpent: 0.5, rating: 5, reward: 8, completedAt: '2026-03-27' },
  { id: 'h7', title: '電郵行銷文案', region: '文字之森', type: '文案', hoursSpent: 2, rating: 4, reward: 20, completedAt: '2026-03-27' },
  { id: 'h8', title: '法律文件翻譯', region: '文字之森', type: '翻譯', hoursSpent: 5, rating: 5, reward: 60, completedAt: '2026-03-28' },
  { id: 'h9', title: '產品說明書校對', region: '文字之森', type: '校對', hoursSpent: 1, rating: 4, reward: 10, completedAt: '2026-03-28' },
  { id: 'h10', title: '部落格文章（3篇）', region: '文字之森', type: '文案', hoursSpent: 6, rating: 5, reward: 45, completedAt: '2026-03-29' },
  { id: 'h11', title: '中英合約翻譯', region: '文字之森', type: '翻譯', hoursSpent: 4, rating: 5, reward: 50, completedAt: '2026-03-30' },
  { id: 'h12', title: '網站文案改寫', region: '文字之森', type: '文案', hoursSpent: 2, rating: 4, reward: 18, completedAt: '2026-03-30' },
  { id: 'h13', title: '社媒文案（週計劃）', region: '文字之森', type: '文案', hoursSpent: 3, rating: 5, reward: 35, completedAt: '2026-03-31' },
  { id: 'h14', title: '日文翻譯（菜單）', region: '文字之森', type: '翻譯', hoursSpent: 1.5, rating: 4, reward: 18, completedAt: '2026-04-01' },
  // 數據/編程類 → 推高 LOG, INT
  { id: 'h15', title: 'Excel數據整理', region: '數字迷城', type: '數據', hoursSpent: 3, rating: 4, reward: 20, completedAt: '2026-03-24' },
  { id: 'h16', title: '銷售數據分析報告', region: '數字迷城', type: '分析', hoursSpent: 5, rating: 5, reward: 50, completedAt: '2026-03-26' },
  { id: 'h17', title: 'Google Sheet自動化', region: '數字迷城', type: '編程', hoursSpent: 4, rating: 4, reward: 40, completedAt: '2026-03-28' },
  { id: 'h18', title: '客戶數據庫清洗', region: '數字迷城', type: '數據', hoursSpent: 2, rating: 5, reward: 25, completedAt: '2026-03-30' },
  { id: 'h19', title: '市場競品分析', region: '數字迷城', type: '分析', hoursSpent: 6, rating: 5, reward: 60, completedAt: '2026-04-01' },
  // 設計類 → 推高 DEX
  { id: 'h20', title: '社媒圖片設計（5張）', region: '視覺神殿', type: '設計', hoursSpent: 3, rating: 4, reward: 30, completedAt: '2026-03-25' },
  { id: 'h21', title: '名片設計', region: '視覺神殿', type: '設計', hoursSpent: 2, rating: 5, reward: 25, completedAt: '2026-03-27' },
  { id: 'h22', title: '活動海報設計', region: '視覺神殿', type: '設計', hoursSpent: 4, rating: 4, reward: 40, completedAt: '2026-03-31' },
  { id: 'h23', title: '產品攝影（5件）', region: '視覺神殿', type: '攝影', hoursSpent: 3, rating: 5, reward: 35, completedAt: '2026-04-02' },
  // 推廣/銷售類 → 推高 CHA
  { id: 'h24', title: '社媒推廣文案+排期', region: '商旅驛站', type: '推廣', hoursSpent: 3, rating: 4, reward: 35, completedAt: '2026-03-27' },
  { id: 'h25', title: 'KOL合作聯繫', region: '商旅驛站', type: '推廣', hoursSpent: 2, rating: 5, reward: 20, completedAt: '2026-03-29' },
  { id: 'h26', title: '客戶回訪電話（30通）', region: '商旅驛站', type: '銷售', hoursSpent: 4, rating: 4, reward: 25, completedAt: '2026-04-01' },
  // 現場類 → 推高 STR
  { id: 'h27', title: '神秘顧客探訪（2間）', region: '現場戰場', type: '現場', hoursSpent: 3, rating: 5, reward: 25, completedAt: '2026-03-26' },
  { id: 'h28', title: '問卷調查執行', region: '現場戰場', type: '問卷', hoursSpent: 5, rating: 4, reward: 25, completedAt: '2026-03-28' },
  { id: 'h29', title: '活動場地佈置', region: '現場戰場', type: '現場', hoursSpent: 6, rating: 5, reward: 40, completedAt: '2026-03-30' },
  // 額外
  { id: 'h30', title: '品牌故事英文版', region: '文字之森', type: '翻譯', hoursSpent: 3, rating: 5, reward: 35, completedAt: '2026-04-02' },
  { id: 'h31', title: '數據儀表板設計', region: '數字迷城', type: '分析', hoursSpent: 4, rating: 5, reward: 45, completedAt: '2026-04-02' },
  { id: 'h32', title: '街頭訪問（50人）', region: '現場戰場', type: '問卷', hoursSpent: 4, rating: 4, reward: 30, completedAt: '2026-04-03' },
  // 模特類 → 推高 CHA
  { id: 'h33', title: '服裝品牌拍攝模特', region: '現場戰場', type: '模特', hoursSpent: 4, rating: 5, reward: 50, completedAt: '2026-03-29' },
  { id: 'h34', title: '美妆廣告試鏡', region: '現場戰場', type: '試鏡', hoursSpent: 2, rating: 4, reward: 30, completedAt: '2026-04-01' },
  // 攝影類 → 推高 FOC
  { id: 'h35', title: '美食攝影（20道菜）', region: '視覺神殿', type: '攝影', hoursSpent: 4, rating: 5, reward: 40, completedAt: '2026-03-28' },
  { id: 'h36', title: '活動現場攝影', region: '視覺神殿', type: '攝影', hoursSpent: 5, rating: 4, reward: 50, completedAt: '2026-04-03' },
];

// Player profile — stats are NOW calculated dynamically from questHistory
export const playerProfile: PlayerProfile = {
  hunterName: '墨影',
  title: '急稿王者',
  className: '文字獵人',
  classEn: 'Inkblade',
  level: 3,
  levelTitle: '正式獵人',
  xp: 680,
  xpMax: 1000,
  currency: 635,
  stats: calculateStats(questHistory),
  completedQuests: 42,
  totalEarnings: 635,
  avgRating: 4.6,
  activeDays: 12,
  ownedCards: 35,
  guild: '墨水戰士',
  titles: ['急稿王者', '七日連勝', '文字新星', '夜貓獵人'],
  equippedCards: ['經驗加成卡', '品質加持卡', '夜貓卡'],
};

// Region data for dashboard
export const regions: Array<{
  name: Region;
  en: string;
  desc: string;
  quests: number;
  playerLevel: number;
  color: string;
  icon: string;
}> = [
  { name: '文字之森', en: 'Inkwood', desc: '文案/翻譯', quests: 8, playerLevel: 5, color: '#2d5a3d', icon: 'BookOpen' },
  { name: '視覺神殿', en: 'Visia', desc: '設計/攝影', quests: 5, playerLevel: 2, color: '#7c3aed', icon: 'Palette' },
  { name: '數字迷城', en: 'Datahex', desc: '數據/編程', quests: 12, playerLevel: 3, color: '#0ea5e9', icon: 'Code2' },
  { name: '商旅驛站', en: 'Tradehaven', desc: '銷售/推廣', quests: 6, playerLevel: 2, color: '#d97706', icon: 'TrendingUp' },
  { name: '現場戰場', en: 'Frontline', desc: '現場任務', quests: 4, playerLevel: 1, color: '#dc2626', icon: 'Zap' },
  { name: '傳說聖域', en: "Legend's Hall", desc: 'SS級任務', quests: 1, playerLevel: 0, color: '#fbbf24', icon: 'Crown' },
];

// Daily quests
export const dailyQuests: DailyQuest[] = [
  { id: 'dq1', title: '完成一個文字類任務', reward: '+50 積分', completed: true },
  { id: 'dq2', title: '接受並開始一個新任務', reward: '+50 積分', completed: true },
  { id: 'dq3', title: '30分鐘內完成一個 R 級任務', reward: '+100 積分', completed: false },
];

// Recent activity
export const recentActivity: ActivityItem[] = [
  { id: 'a1', text: '完成了「社媒文案撰寫」任務', time: '2小時前', type: 'quest' },
  { id: 'a2', text: '獲得了 R級「疾風之靴」', time: '2小時前', type: 'card' },
  { id: 'a3', text: '連續活躍天數達到 12 天', time: '今天', type: 'achievement' },
  { id: 'a4', text: '完成了「產品描述翻譯」任務', time: '昨天', type: 'quest' },
  { id: 'a5', text: '獲得了 SR級「透視之眼」', time: '昨天', type: 'card' },
];

// Sample quests (15+) — rarity updated: H,G→R / F,E,D→SR / C,B→SSR / A,S,SS→UR
export const quests: Quest[] = [
  {
    id: 'q1', title: '社交媒體文案（3篇）', description: '為本地餐廳撰寫三篇 Instagram 宣傳文案，需配合品牌語調，每篇100-150字。',
    region: '文字之森', difficulty: 1, rarity: 'R', reward: 15, timeLimit: '24小時', requirements: '無', type: '文案', status: 'available',
  },
  {
    id: 'q2', title: 'SEO文章撰寫（1500字）', description: '撰寫一篇關於「香港數碼營銷趨勢」的SEO優化文章，需包含關鍵詞植入及內部連結建議。',
    region: '文字之森', difficulty: 2, rarity: 'SR', reward: 25, timeLimit: '48小時', requirements: 'INT 25+', type: '文案', status: 'available',
  },
  {
    id: 'q3', title: '中英商業文件翻譯', description: '翻譯一份2000字的商業企劃書，要求專業用語精準，保持原文語氣。',
    region: '文字之森', difficulty: 3, rarity: 'SR', reward: 40, timeLimit: '72小時', requirements: 'INT 30+', type: '翻譯', status: 'available',
  },
  {
    id: 'q4', title: '品牌Logo設計', description: '為新創咖啡品牌設計Logo，需提供3個方案及延伸應用展示。要求現代簡約風格。',
    region: '視覺神殿', difficulty: 3, rarity: 'SSR', reward: 80, timeLimit: '72小時', requirements: 'FOC 40+', type: '設計', status: 'available',
  },
  {
    id: 'q5', title: '產品攝影（10件）', description: '為電商平台拍攝10件服飾產品照片，白底去背，多角度拍攝。',
    region: '視覺神殿', difficulty: 2, rarity: 'SR', reward: 60, timeLimit: '48小時', requirements: 'FOC 25+', type: '攝影', status: 'available',
  },
  {
    id: 'q6', title: 'Excel數據整理（500行）', description: '整理及清洗500行客戶數據，包括去重、格式統一、缺失值填補。',
    region: '數字迷城', difficulty: 2, rarity: 'SR', reward: 20, timeLimit: '48小時', requirements: 'LOG 15+', type: '數據', status: 'available',
  },
  {
    id: 'q7', title: 'Python自動化腳本', description: '開發一個Python腳本，自動從指定網站收集產品價格資訊並整理成CSV。',
    region: '數字迷城', difficulty: 4, rarity: 'SSR', reward: 150, timeLimit: '7天', requirements: 'LOG 50+, INT 40+', type: '編程', status: 'available',
  },
  {
    id: 'q8', title: '市場調查報告', description: '針對香港飲品市場進行桌面研究，提交3000字市調報告含數據圖表。',
    region: '數字迷城', difficulty: 3, rarity: 'SR', reward: 50, timeLimit: '5天', requirements: 'LOG 30+, INT 25+', type: '分析', status: 'available',
  },
  {
    id: 'q9', title: '社媒推廣文案+排期', description: '為健身品牌制定一週社媒推廣計劃，包含7篇文案及最佳發布時間建議。',
    region: '商旅驛站', difficulty: 2, rarity: 'SR', reward: 35, timeLimit: '48小時', requirements: 'CHA 15+', type: '推廣', status: 'available',
  },
  {
    id: 'q10', title: '電話銷售（50通）', description: '根據提供的客戶名單進行電話推銷，介紹新產品並記錄客戶反饋。',
    region: '商旅驛站', difficulty: 2, rarity: 'R', reward: 30, timeLimit: '3天', requirements: 'CHA 20+', type: '銷售', status: 'available',
  },
  {
    id: 'q11', title: '神秘顧客探訪', description: '到指定連鎖餐廳進行神秘顧客探訪，填寫評估表格並拍攝紀錄照片。',
    region: '現場戰場', difficulty: 1, rarity: 'R', reward: 15, timeLimit: '24小時', requirements: '無', type: '現場', status: 'available',
  },
  {
    id: 'q12', title: '活動現場攝影', description: '為企業年度晚宴進行現場攝影，需4小時駐場，交付200+精修照片。',
    region: '現場戰場', difficulty: 3, rarity: 'SR', reward: 60, timeLimit: '48小時', requirements: 'FOC 30+, STR 20+', type: '現場', status: 'available',
  },
  {
    id: 'q13', title: '年度品牌視覺策略', description: '為大型企業制定年度品牌視覺策略，包括品牌指南、模板系統、視覺語言定義。',
    region: '傳說聖域', difficulty: 5, rarity: 'UR', reward: 1500, timeLimit: '30天', requirements: 'Lv.6+, FOC 80+, INT 60+', type: '策略', status: 'available',
  },
  {
    id: 'q14', title: 'UI介面設計（App）', description: '為健康管理App設計5個核心頁面的UI界面，需提供高保真原型。',
    region: '視覺神殿', difficulty: 4, rarity: 'UR', reward: 250, timeLimit: '7天', requirements: 'FOC 55+, INT 35+', type: '設計', status: 'available',
  },
  {
    id: 'q15', title: '企業內部系統開發', description: '開發一個員工考勤管理系統，包含打卡、請假、報表功能。React+Node.js。',
    region: '數字迷城', difficulty: 5, rarity: 'UR', reward: 800, timeLimit: '14天', requirements: 'LOG 70+, INT 50+, Lv.5+', type: '編程', status: 'available',
  },
  {
    id: 'q16', title: '問卷調查執行', description: '在指定商場進行100份消費者問卷調查，需完成數據輸入及基本統計。',
    region: '現場戰場', difficulty: 2, rarity: 'R', reward: 25, timeLimit: '3天', requirements: 'STR 10+, CHA 10+', type: '現場', status: 'available',
  },
];

// ===== CARDS — 100張完整卡牌（來自 cards-v2.json，含 AI 圖片路徑） =====
export const cards: GameCard[] = [

  // ============================================================
  // R 級卡牌 (40 張)
  // ============================================================
  { id: 'c001', name: '疾風之靴', type: '技能卡', subType: '主動', rarity: 'R', description: "風之力量注入雙足，讓你在任務戰場上搶先一步。", effect: "使用後 24 小時內，新任務通知比其他獵人早 10 分鐘推送。", icon: 'Zap', cardNumber: '#001/100', imagePath: './cards/card-c001.webp', quantity: 3 },
  { id: 'c002', name: '獵人日誌', type: '任務卡', subType: '成就', rarity: 'R', description: "記錄每一次出征，讓你的傳說在歷史中留名。", effect: "完成首次任務後解鎖，個人檔案顯示「初出茅廬」成就徽章。", icon: 'BookOpen', cardNumber: '#002/100', imagePath: './cards/card-c002.webp', quantity: 2 },
  { id: 'c003', name: '鷹眼透鏡', type: '技能卡', subType: '主動', rarity: 'R', description: "戴上這面魔法透鏡，任務的細節一覽無遺。", effect: "使用後可查看任意 3 個任務的完整細節（含聯絡方式預覽），有效期 48 小時。", icon: 'Eye', cardNumber: '#003/100', imagePath: './cards/card-c003.webp', quantity: 1 },
  { id: 'c004', name: '晨星鬧鈴', type: '技能卡', subType: '主動', rarity: 'R', description: "讓晨星為你報時，每天第一個搶先行動。", effect: "使用後，連續 3 天每日早上 8:00 推送當日新增任務摘要通知。", icon: 'Bell', cardNumber: '#004/100', imagePath: './cards/card-c004.webp', quantity: 1 },
  { id: 'c005', name: '新手護符', type: '技能卡', subType: '被動', rarity: 'R', description: "初入江湖，護符護你平安踏出第一步。", effect: "裝備後，首次收到的評價若低於 3 星，自動隱藏不計入平均分。", icon: 'Shield', cardNumber: '#005/100', imagePath: './cards/card-c005.webp', quantity: 2 },
  { id: 'c006', name: '經驗水晶（小）', type: '技能卡', subType: '主動', rarity: 'R', description: "細小的水晶中蘊藏著純粹的成長之力。", effect: "使用後 24 小時內，完成任務所獲得的經驗值 +15%。", icon: 'Gem', cardNumber: '#006/100', imagePath: './cards/card-c006.webp', quantity: 1 },
  { id: 'c007', name: '任務收藏夾', type: '技能卡', subType: '主動', rarity: 'R', description: "好的任務不能錯過，先收藏再說。", effect: "使用後解鎖「任務收藏」功能，可永久收藏最多 10 個任務快速查看。", icon: 'Bookmark', cardNumber: '#007/100', imagePath: './cards/card-c007.webp', quantity: 1 },
  { id: 'c008', name: '初心探針', type: '任務卡', subType: '成就', rarity: 'R', description: "探索三個不同類型的任務，發現自己的潛力所在。", effect: "完成 3 種不同類別任務後解鎖，個人檔案顯示「多才多藝」成就徽章。", icon: 'Compass', cardNumber: '#008/100', imagePath: './cards/card-c008.webp', quantity: 1 },
  { id: 'c009', name: '幸運骰子', type: '技能卡', subType: '主動', rarity: 'R', description: "擲出幸運一擲，命運掌握在自己手中。", effect: "使用後獲得 1 次額外每日抽卡機會，可在當天任意時間使用。", icon: 'Dice5', cardNumber: '#009/100', imagePath: './cards/card-c009.webp', quantity: 1 },
  { id: 'c010', name: '速覽鏡', type: '技能卡', subType: '被動', rarity: 'R', description: "任務列表在眼前展開，重要資訊一眼看透。", effect: "裝備後，任務列表中每個任務顯示額外一行摘要資訊（發佈時間、接單人數），持續 7 天。", icon: 'ScanSearch', cardNumber: '#010/100', imagePath: './cards/card-c010.webp', quantity: 3 },
  { id: 'c011', name: '獵人徽章 Lv.1', type: '任務卡', subType: '成就', rarity: 'R', description: "完成五次任務，踏上成為傳奇的第一步。", effect: "累積完成 5 個任務後解鎖，個人檔案顯示「初級獵人」銅色徽章。", icon: 'Award', cardNumber: '#011/100', imagePath: './cards/card-c011.webp', quantity: 1 },
  { id: 'c012', name: '篩選濾鏡', type: '技能卡', subType: '主動', rarity: 'R', description: "用魔法濾鏡過濾雜訊，找到真正適合你的任務。", effect: "使用後解鎖進階篩選功能（按酬勞範圍、任務時長篩選），有效期 7 天。", icon: 'Filter', cardNumber: '#012/100', imagePath: './cards/card-c012.webp', quantity: 1 },
  { id: 'c013', name: '通訊石', type: '技能卡', subType: '主動', rarity: 'R', description: "掌中一塊石頭，連接遠方的任務情報。", effect: "使用後 48 小時內，你感興趣任務類別的新增任務將即時推送通知。", icon: 'Radio', cardNumber: '#013/100', imagePath: './cards/card-c013.webp', quantity: 1 },
  { id: 'c014', name: '一日旅人', type: '任務卡', subType: '成就', rarity: 'R', description: "在一天之內展現驚人的效率，讓世界看見你的速度。", effect: "在同一天內完成 2 個任務後解鎖，個人檔案顯示「效率達人」成就紀錄。", icon: 'Timer', cardNumber: '#014/100', imagePath: './cards/card-c014.webp', quantity: 1 },
  { id: 'c015', name: '簡歷小亮點', type: '技能卡', subType: '主動', rarity: 'R', description: "為你的個人檔案加上一點光彩，吸引任務發佈方的目光。", effect: "使用後個人檔案在搜尋結果中靠前顯示 3 位，持續 24 小時。", icon: 'Sparkles', cardNumber: '#015/100', imagePath: './cards/card-c015.webp', quantity: 2 },
  { id: 'c016', name: '地區探測器', type: '技能卡', subType: '主動', rarity: 'R', description: "解鎖你所在地區的任務雷達，近在咫尺的機會不再錯過。", effect: "使用後可按地區篩選任務，並顯示任務距離（公里），有效期 7 天。", icon: 'MapPin', cardNumber: '#016/100', imagePath: './cards/card-c016.webp', quantity: 1 },
  { id: 'c017', name: '五星記憶', type: '任務卡', subType: '成就', rarity: 'R', description: "首次獲得滿分好評，是每個獵人最珍貴的回憶。", effect: "首次獲得 5 星評價後解鎖，個人檔案顯示「完美首秀」特殊紀錄標籤。", icon: 'Star', cardNumber: '#017/100', imagePath: './cards/card-c017.webp', quantity: 1 },
  { id: 'c018', name: '任務推薦票', type: '技能卡', subType: '主動', rarity: 'R', description: "持有此票，平台為你推薦一個最適合現在的任務。", effect: "使用後平台根據你的歷史紀錄，推送 1 個個人化推薦任務。", icon: 'Ticket', cardNumber: '#018/100', imagePath: './cards/card-c018.webp', quantity: 1 },
  { id: 'c019', name: '暗影偵察', type: '技能卡', subType: '主動', rarity: 'R', description: "悄悄查看競爭對手的動向，知己知彼方能百戰百勝。", effect: "使用後可查看同一任務中其他申請者的數量（不顯示身份），有效期 24 小時內 5 次。", icon: 'Search', cardNumber: '#019/100', imagePath: './cards/card-c019.webp', quantity: 1 },
  { id: 'c020', name: '活躍燈塔', type: '技能卡', subType: '被動', rarity: 'R', description: "保持線上，讓任務發佈方第一眼看到你的活躍狀態。", effect: "裝備後個人檔案顯示「活躍中」綠色狀態標示，持續 3 天。", icon: 'Wifi', cardNumber: '#020/100', imagePath: './cards/card-c020.webp', quantity: 1 },
  { id: 'c021', name: '時間管理術', type: '技能卡', subType: '被動', rarity: 'R', description: "善用每一分鐘，讓截止日期不再是壓力。", effect: "裝備後，任務截止前 2 小時自動發送提醒通知，持續 14 天。", icon: 'Clock', cardNumber: '#021/100', imagePath: './cards/card-c021.webp', quantity: 1 },
  { id: 'c022', name: '新人特權卡', type: '特殊卡', subType: '成就', rarity: 'R', description: "剛加入的你擁有特殊福利，讓起步更順暢。", effect: "新用戶專屬，使用後連續 7 天任務列表中新手友善任務優先顯示在前 5 名。", icon: 'Gift', cardNumber: '#022/100', imagePath: './cards/card-c022.webp', quantity: 1 },
  { id: 'c023', name: '快速匹配符', type: '技能卡', subType: '主動', rarity: 'R', description: "符咒一貼，平台自動為你配對最合適的任務類型。", effect: "使用後設定 1 個任務偏好標籤，同類型任務新增時自動通知，持續 3 天。", icon: 'Zap', cardNumber: '#023/100', imagePath: './cards/card-c023.webp', quantity: 1 },
  { id: 'c024', name: '獵人速記本', type: '技能卡', subType: '主動', rarity: 'R', description: "快速記下重要任務資訊，讓靈感和計劃永不消失。", effect: "使用後解鎖任務備忘功能，可為每個任務添加最多 200 字的私人筆記。", icon: 'NotebookPen', cardNumber: '#024/100', imagePath: './cards/card-c024.webp', quantity: 1 },
  { id: 'c025', name: '連勝護盾', type: '技能卡', subType: '被動', rarity: 'R', description: "連續成功的動力，成為你最堅實的防護。", effect: "裝備後，若連續 3 個任務均獲得 4 星以上評價，下一次評價的最低分自動提升 0.5 星。", icon: 'ShieldCheck', cardNumber: '#025/100', imagePath: './cards/card-c025.webp', quantity: 1 },
  { id: 'c026', name: '週末衝刺符', type: '技能卡', subType: '主動', rarity: 'R', description: "週末是獵人大展身手的時刻，衝刺加速！", effect: "在週六或週日使用，當天完成任務獲得的經驗值 +20%。", icon: 'TrendingUp', cardNumber: '#026/100', imagePath: './cards/card-c026.webp', quantity: 1 },
  { id: 'c027', name: '細節放大鏡', type: '技能卡', subType: '主動', rarity: 'R', description: "放大看清每一個任務細節，讓你做出最明智的選擇。", effect: "使用後 48 小時內，點開任務詳情可顯示「發佈方歷史評分」及「平均完成時間」。", icon: 'ZoomIn', cardNumber: '#027/100', imagePath: './cards/card-c027.webp', quantity: 1 },
  { id: 'c028', name: '冒險開始', type: '任務卡', subType: '成就', rarity: 'R', description: "每個傳奇都有一個起點，你的故事從今天開始。", effect: "完成帳號設定並提交第一份任務申請後解鎖，個人檔案顯示「踏上征途」紀念標記。", icon: 'Flag', cardNumber: '#028/100', imagePath: './cards/card-c028.webp', quantity: 1 },
  { id: 'c029', name: '夜行者通行證', type: '技能卡', subType: '主動', rarity: 'R', description: "深夜也有任務在等你，夜行者的機會從不沉睡。", effect: "使用後，設定一個時段（如 22:00-06:00），該時段內新增任務即時推送，持續 3 天。", icon: 'Moon', cardNumber: '#029/100', imagePath: './cards/card-c029.webp', quantity: 1 },
  { id: 'c030', name: '分類大師', type: '任務卡', subType: '成就', rarity: 'R', description: "涉獵廣泛，方能在各個領域立足。", effect: "完成 5 種不同類別任務後解鎖，個人檔案顯示「分類大師」成就徽章及已解鎖類別列表。", icon: 'LayoutGrid', cardNumber: '#030/100', imagePath: './cards/card-c030.webp', quantity: 1 },
  { id: 'c031', name: '輕量背包', type: '技能卡', subType: '被動', rarity: 'R', description: "精簡裝備，讓介面更清爽，效率更高。", effect: "裝備後，任務列表介面隱藏廣告位並啟用簡潔模式，持續 7 天。", icon: 'Backpack', cardNumber: '#031/100', imagePath: './cards/card-c031.webp', quantity: 1 },
  { id: 'c032', name: '評分回顧', type: '技能卡', subType: '主動', rarity: 'R', description: "了解自己在別人眼中的形象，找到進步的方向。", effect: "使用後可查看過去 30 天所有評價的詳細統計圖表（含分數分佈和關鍵字雲）。", icon: 'BarChart2', cardNumber: '#032/100', imagePath: './cards/card-c032.webp', quantity: 1 },
  { id: 'c033', name: '新任務哨兵', type: '技能卡', subType: '被動', rarity: 'R', description: "哨兵在崗，任何新任務都逃不過你的眼睛。", effect: "裝備後，每天最新發布的 5 個任務在列表頂部標記「最新」標籤，持續 5 天。", icon: 'Eye', cardNumber: '#033/100', imagePath: './cards/card-c033.webp', quantity: 1 },
  { id: 'c034', name: '完成慶功', type: '任務卡', subType: '成就', rarity: 'R', description: "每一次完成都值得慶祝，這是你努力的成果。", effect: "累積完成 10 個任務後解鎖，個人檔案顯示「十全十美」里程碑徽章。", icon: 'PartyPopper', cardNumber: '#034/100', imagePath: './cards/card-c034.webp', quantity: 1 },
  { id: 'c035', name: '時區調諧器', type: '技能卡', subType: '主動', rarity: 'R', description: "調整你的任務雷達，捕捉不同時區的任務機會。", effect: "使用後可選擇 1 個額外城市/時區的任務列表查看，有效期 48 小時。", icon: 'Globe', cardNumber: '#035/100', imagePath: './cards/card-c035.webp', quantity: 1 },
  { id: 'c036', name: '勤勞勳章', type: '任務卡', subType: '成就', rarity: 'R', description: "連續七天出勤，勤勞是獵人最大的美德。", effect: "連續 7 天各完成至少 1 個任務後解鎖，個人檔案顯示「週功達人」特殊勳章。", icon: 'Medal', cardNumber: '#036/100', imagePath: './cards/card-c036.webp', quantity: 0 },
  { id: 'c037', name: '搶先預覽', type: '技能卡', subType: '主動', rarity: 'R', description: "在任務正式發布前搶先一步看到預告。", effect: "使用後 24 小時內，即將發布的任務提前 5 分鐘出現在你的任務列表中。", icon: 'FastForward', cardNumber: '#037/100', imagePath: './cards/card-c037.webp', quantity: 0 },
  { id: 'c038', name: '技能標籤貼', type: '技能卡', subType: '主動', rarity: 'R', description: "為自己貼上專業標籤，讓對的任務找到你。", effect: "使用後可在個人檔案新增最多 5 個技能標籤，並根據標籤推薦相關任務。", icon: 'Tag', cardNumber: '#038/100', imagePath: './cards/card-c038.webp', quantity: 0 },
  { id: 'c039', name: '黃昏巡邏', type: '技能卡', subType: '主動', rarity: 'R', description: "黃昏時分，新一批任務悄悄上線，你是第一個知道的人。", effect: "使用後設定下午 17:00-19:00 任務新增即時通知，持續 5 天。", icon: 'Sunset', cardNumber: '#039/100', imagePath: './cards/card-c039.webp', quantity: 0 },
  { id: 'c040', name: '口碑積累', type: '任務卡', subType: '成就', rarity: 'R', description: "每一個好評都是你寶貴的財富，積累口碑才是長久之道。", effect: "累積獲得 20 個 4 星以上評價後解鎖，個人檔案顯示「好評如潮」信譽標章。", icon: 'ThumbsUp', cardNumber: '#040/100', imagePath: './cards/card-c040.webp', quantity: 0 },

  // ============================================================
  // SR 級卡牌 (30 張)
  // ============================================================
  { id: 'c041', name: '銀翼追蹤者', type: '技能卡', subType: '主動', rarity: 'SR', description: "銀色羽翼展開，精英任務的軌跡清晰可見。", effect: "使用後 48 小時內，酬勞排名前 10% 的任務在列表中以銀色邊框標記並置頂顯示。", icon: 'TrendingUp', cardNumber: '#041/100', imagePath: './cards/card-c041.webp', quantity: 0 },
  { id: 'c042', name: '差評護甲', type: '技能卡', subType: '被動', rarity: 'SR', description: "堅固的護甲為你抵擋不公平的批評，維護你的聲譽。", effect: "裝備後，下一次收到 3 星以下評價時自動隱藏，不計入平均分（最多使用 1 次後消耗）。", icon: 'ShieldOff', cardNumber: '#042/100', imagePath: './cards/card-c042.webp', quantity: 0 },
  { id: 'c043', name: '同盟徽記', type: '技能卡', subType: '主動', rarity: 'SR', description: "號召周圍的獵人，組成強大的同盟共同出擊。", effect: "使用後解鎖「組隊功能」，可邀請同區域獵人組成 2 人小隊共同申請任務（需雙方同意）。", icon: 'Users', cardNumber: '#043/100', imagePath: './cards/card-c043.webp', quantity: 0 },
  { id: 'c044', name: '精英篩選器', type: '技能卡', subType: '主動', rarity: 'SR', description: "只有最好的才符合你的標準，精英篩選器幫你一步到位。", effect: "使用後解鎖高級篩選功能（含：發佈方評分下限、任務緊急度、申請人數上限），有效期 14 天。", icon: 'Settings2', cardNumber: '#044/100', imagePath: './cards/card-c044.webp', quantity: 0 },
  { id: 'c045', name: '排名躍升券', type: '技能卡', subType: '主動', rarity: 'SR', description: "一躍而上，讓你的名字出現在更多人的視線中。", effect: "使用後個人檔案在搜尋結果和推薦欄位中靠前顯示 10 位，持續 48 小時。", icon: 'ChevronsUp', cardNumber: '#045/100', imagePath: './cards/card-c045.webp', quantity: 0 },
  { id: 'c046', name: '月兔信使', type: '技能卡', subType: '主動', rarity: 'SR', description: "月兔神速，將獨家情報第一時間傳遞給你。", effect: "使用後 72 小時內，平台獨家合作任務（限量名額）在開放申請前 15 分鐘私信通知你。", icon: 'Mail', cardNumber: '#046/100', imagePath: './cards/card-c046.webp', quantity: 0 },
  { id: 'c047', name: '白金圍欄', type: '技能卡', subType: '被動', rarity: 'SR', description: "白金邊框環繞你的個人檔案，彰顯不凡的地位。", effect: "裝備後個人檔案頭像加上白金色邊框，並在列表中顯示「精英獵人」標籤，持續 14 天。", icon: 'Crown', cardNumber: '#047/100', imagePath: './cards/card-c047.webp', quantity: 0 },
  { id: 'c048', name: '雙倍成長藥水', type: '技能卡', subType: '主動', rarity: 'SR', description: "一瓶神奇藥水，讓你的等級成長速度翻倍。", effect: "使用後 48 小時內，所有任務獲得的經驗值 +30%，等級進度條以加速動效顯示。", icon: 'FlaskConical', cardNumber: '#048/100', imagePath: './cards/card-c048.webp', quantity: 0 },
  { id: 'c049', name: '任務雷達波', type: '技能卡', subType: '主動', rarity: 'SR', description: "發出全方位掃描波，方圓百里內的任務機會無所遁形。", effect: "使用後設定 3 個任務偏好標籤，7 天內符合任意標籤的新任務即時推送通知。", icon: 'Radar', cardNumber: '#049/100', imagePath: './cards/card-c049.webp', quantity: 0 },
  { id: 'c050', name: '信譽之盾', type: '技能卡', subType: '被動', rarity: 'SR', description: "以信譽為盾，任何質疑都無法動搖你的地位。", effect: "裝備後，若本月排名因評分下降超過 5 位，自動觸發排名保護，阻止進一步下滑 3 天。", icon: 'ShieldCheck', cardNumber: '#050/100', imagePath: './cards/card-c050.webp', quantity: 0 },
  { id: 'c051', name: '聊天解鎖石', type: '技能卡', subType: '主動', rarity: 'SR', description: "打破沉默的結界，與其他獵人直接交流。", effect: "使用後解鎖站內即時聊天功能，可與已合作過的獵人或發佈方直接發送訊息，有效期 30 天。", icon: 'MessageCircle', cardNumber: '#051/100', imagePath: './cards/card-c051.webp', quantity: 0 },
  { id: 'c052', name: '百戰不殆', type: '任務卡', subType: '成就', rarity: 'SR', description: "五十場勝利，鑄就了一名真正的戰場老將。", effect: "累積完成 50 個任務後解鎖，個人檔案顯示「百戰老將」銀色勳章及完成數量榮譽計數器。", icon: 'Sword', cardNumber: '#052/100', imagePath: './cards/card-c052.webp', quantity: 0 },
  { id: 'c053', name: '連勝加速器', type: '技能卡', subType: '被動', rarity: 'SR', description: "越戰越勇，勝利的動能讓你越走越快。", effect: "裝備後，連續獲得 5 個 4 星以上評價時，觸發「連勝模式」，下一個任務獲得的經驗值 +25%。", icon: 'Flame', cardNumber: '#053/100', imagePath: './cards/card-c053.webp', quantity: 0 },
  { id: 'c054', name: '情報交換所', type: '技能卡', subType: '主動', rarity: 'SR', description: "進入隱密的情報網絡，掌握市場最新動態。", effect: "使用後 7 天內可查看所在類別任務的市場分析報告（平均酬勞趨勢、熱門類型統計）。", icon: 'TrendingUp', cardNumber: '#054/100', imagePath: './cards/card-c054.webp', quantity: 0 },
  { id: 'c055', name: '神算師', type: '技能卡', subType: '主動', rarity: 'SR', description: "精準計算每一步，讓勝率在數字中提升。", effect: "使用後 48 小時內，任務詳情頁顯示「你的勝率預估」（基於你的技能標籤與歷史表現的匹配度）。", icon: 'Calculator', cardNumber: '#055/100', imagePath: './cards/card-c055.webp', quantity: 0 },
  { id: 'c056', name: '靈魂展示台', type: '技能卡', subType: '主動', rarity: 'SR', description: "打開你的靈魂，讓最好的作品在世界面前閃光。", effect: "使用後解鎖「作品集展示」功能，可在個人檔案上傳最多 6 件作品圖片或連結，持久有效。", icon: 'Image', cardNumber: '#056/100', imagePath: './cards/card-c056.webp', quantity: 0 },
  { id: 'c057', name: '任務合約印', type: '技能卡', subType: '被動', rarity: 'SR', description: "神聖的印章保護你在任務中的權益，確保公正對待。", effect: "裝備後，若任務在你提交後 24 小時內未獲評分，系統自動發送提醒給發佈方（最多觸發 3 次/月）。", icon: 'Stamp', cardNumber: '#057/100', imagePath: './cards/card-c057.webp', quantity: 0 },
  { id: 'c058', name: '傳聲鼓', type: '技能卡', subType: '主動', rarity: 'SR', description: "擂響這面鼓，讓你的名聲傳遍獵人圈。", effect: "使用後個人檔案在「推薦獵人」版塊展示 72 小時，對所有發佈方可見。", icon: 'Volume2', cardNumber: '#058/100', imagePath: './cards/card-c058.webp', quantity: 0 },
  { id: 'c059', name: '深海潛行艇', type: '技能卡', subType: '主動', rarity: 'SR', description: "潛入任務海洋的深處，發掘那些被遺忘的寶藏任務。", effect: "使用後可查看平台上發佈超過 48 小時但仍未有人申請的「冷門優質任務」列表（最多 10 個）。", icon: 'Anchor', cardNumber: '#059/100', imagePath: './cards/card-c059.webp', quantity: 0 },
  { id: 'c060', name: '雙重護衛', type: '技能卡', subType: '被動', rarity: 'SR', description: "雙倍保護，讓你的努力成果不會輕易消失。", effect: "裝備後，當月的失敗任務記錄（未通過審核）不公開顯示在個人檔案，持續 30 天。", icon: 'Shield', cardNumber: '#060/100', imagePath: './cards/card-c060.webp', quantity: 0 },
  { id: 'c061', name: '月桂之冠', type: '任務卡', subType: '成就', rarity: 'SR', description: "連續一個月的卓越表現，為你戴上榮耀之冠。", effect: "在某月份排名進入前 20% 後解鎖，個人檔案顯示「當月佳績」月份標誌及名次。", icon: 'Crown', cardNumber: '#061/100', imagePath: './cards/card-c061.webp', quantity: 0 },
  { id: 'c062', name: '守夜人勛章', type: '任務卡', subType: '成就', rarity: 'SR', description: "深夜也在守護任務，你是最敬業的夜間衛士。", effect: "在晚上 22:00 後完成 10 個任務後解鎖，個人檔案顯示「守夜人」特殊夜間主題徽章。", icon: 'Moon', cardNumber: '#062/100', imagePath: './cards/card-c062.webp', quantity: 0 },
  { id: 'c063', name: '超聲波雷達', type: '技能卡', subType: '主動', rarity: 'SR', description: "超越感官極限，捕捉那些常人無法察覺的任務信號。", effect: "使用後 5 天內，可設定多達 5 個關鍵字，任何任務標題包含這些詞彙時即時通知你。", icon: 'Waves', cardNumber: '#063/100', imagePath: './cards/card-c063.webp', quantity: 0 },
  { id: 'c064', name: '黃金履歷', type: '技能卡', subType: '主動', rarity: 'SR', description: "用黃金字跡書寫你的過往，讓每個雇主都對你印象深刻。", effect: "使用後個人檔案自動生成「職業報告書」，包含任務類型分布、平均評分走勢圖，可分享給任務發佈方。", icon: 'FileText', cardNumber: '#064/100', imagePath: './cards/card-c064.webp', quantity: 0 },
  { id: 'c065', name: '優先窗口', type: '技能卡', subType: '被動', rarity: 'SR', description: "踏入優先通道，讓你的申請總是站在隊伍最前面。", effect: "裝備後，申請任務時你的名字在發佈方的申請列表中始終排在前 3 位顯示，持續 7 天。", icon: 'ArrowUpCircle', cardNumber: '#065/100', imagePath: './cards/card-c065.webp', quantity: 0 },
  { id: 'c066', name: '神秘商人禮包', type: '特殊卡', subType: '成就', rarity: 'SR', description: "神秘商人出現，帶來你意想不到的特殊禮物。", effect: "使用後從以下隨機獲得一個效果：① 48 小時經驗加成 +25%；② 1 次差評隱藏；③ 72 小時提前通知。", icon: 'Package', cardNumber: '#066/100', imagePath: './cards/card-c066.webp', quantity: 0 },
  { id: 'c067', name: '師徒契約', type: '挑戰卡', subType: '成就', rarity: 'SR', description: "傳授知識與智慧，師徒二人共同成長，缔結不解之緣。", effect: "與一名等級低 5 級以上的獵人互相同意後，合作完成同一任務，雙方均獲得 +20% 經驗值加成（限 1 次/月）。", icon: 'HandshakeIcon', cardNumber: '#067/100', imagePath: './cards/card-c067.webp', quantity: 0 },
  { id: 'c068', name: '互評協議', type: '挑戰卡', subType: '成就', rarity: 'SR', description: "與同行交換真誠的評價，互相鼓勵共同進步。", effect: "與另一名完成過共同任務的獵人互相同意後，雙方互留公開推薦語，展示在各自個人檔案 30 天。", icon: 'Star', cardNumber: '#068/100', imagePath: './cards/card-c068.webp', quantity: 0 },
  { id: 'c069', name: '高手過招', type: '挑戰卡', subType: '成就', rarity: 'SR', description: "與頂尖獵人同台競技，在挑戰中磨礪真正的實力。", effect: "邀請另一名排名比你高的獵人接受挑戰，雙方同時申請同一任務，獲選者額外獲得 30 點經驗值；落選者獲得 10 點安慰經驗值。", icon: 'Swords', cardNumber: '#069/100', imagePath: './cards/card-c069.webp', quantity: 0 },
  { id: 'c070', name: '同類相吸', type: '技能卡', subType: '主動', rarity: 'SR', description: "物以類聚，讓平台幫你找到志同道合的獵人夥伴。", effect: "使用後平台根據你的技能標籤和歷史任務，推薦 3 名互補技能的獵人供你組隊邀請（需雙方同意）。", icon: 'UserPlus', cardNumber: '#070/100', imagePath: './cards/card-c070.webp', quantity: 0 },

  // ============================================================
  // SSR 級卡牌 (20 張)
  // ============================================================
  { id: 'c071', name: '龍脈傳送門', type: '技能卡', subType: '主動', rarity: 'SSR', description: "打開古老龍脈的傳送門，獲取只有少數人才能看見的頂尖任務情報。", effect: "使用後 7 天內，每天獲得 1 個平台獨家推送的精選高薪任務（酬勞高於同類任務平均 30% 以上），僅你可見。", icon: 'Landmark', cardNumber: '#071/100', imagePath: './cards/card-c071.webp', quantity: 0 },
  { id: 'c072', name: '黃金檔案皮', type: '技能卡', subType: '被動', rarity: 'SSR', description: "純金打造的個人檔案外觀，讓你的形象在所有人中脫穎而出。", effect: "裝備後個人檔案頁面啟用「黃金主題」外觀，頭像金框、背景金紋、名字金色字體，持續 30 天。", icon: 'Palette', cardNumber: '#072/100', imagePath: './cards/card-c072.webp', quantity: 0 },
  { id: 'c073', name: '公會創建令', type: '技能卡', subType: '主動', rarity: 'SSR', description: "揮舞這道命令，號召天下英雄，建立你的獵人公會。", effect: "使用後解鎖「公會系統」，可創建一個最多容納 10 名獵人的公會，享有公會聊天室和公會任務排行榜。", icon: 'Building2', cardNumber: '#073/100', imagePath: './cards/card-c073.webp', quantity: 0 },
  { id: 'c074', name: '時空錨點', type: '技能卡', subType: '主動', rarity: 'SSR', description: "在最黃金的位置拋下時空錨，讓你的名字永遠佔據有利位置。", effect: "使用後個人檔案在所在類別的「推薦獵人」區固定展示 7 天，每天至少曝光 500 次。", icon: 'Anchor', cardNumber: '#074/100', imagePath: './cards/card-c074.webp', quantity: 0 },
  { id: 'c075', name: '三重預警系統', type: '技能卡', subType: '被動', rarity: 'SSR', description: "三層情報網同時運作，任何重要任務都無法從你眼前溜走。", effect: "裝備後同時啟動 3 個任務偏好標籤的即時通知，並在每日早上 9:00 發送「今日精選任務」彙整報告，持續 30 天。", icon: 'BellRing', cardNumber: '#075/100', imagePath: './cards/card-c075.webp', quantity: 0 },
  { id: 'c076', name: '傳說稱號：鐵腕獵手', type: '技能卡', subType: '被動', rarity: 'SSR', description: "以鐵一般的意志鑄就的稱號，讓每個人都知道你不可撼動。", effect: "裝備後在個人名字旁顯示「🗡 鐵腕獵手」稱號，並在申請任務時申請欄位頂部特別標記，持續 30 天。", icon: 'Sword', cardNumber: '#076/100', imagePath: './cards/card-c076.webp', quantity: 0 },
  { id: 'c077', name: '量子分析儀', type: '技能卡', subType: '主動', rarity: 'SSR', description: "以量子運算的精準度，全面剖析你的職業表現。", effect: "使用後生成「獵人職業全分析報告」，包含：技能短板建議、最佳任務時段、成功率最高的任務類型及互動建議，可下載分享。", icon: 'Activity', cardNumber: '#077/100', imagePath: './cards/card-c077.webp', quantity: 0 },
  { id: 'c078', name: '元素附魔武器', type: '技能卡', subType: '主動', rarity: 'SSR', description: "四種元素力量附著其上，讓你的技能標籤擁有特殊光環。", effect: "使用後個人檔案的技能標籤獲得「閃光動效」外觀，並在搜尋任務時你的標籤匹配度顯示高亮效果，持續 21 天。", icon: 'Wand2', cardNumber: '#078/100', imagePath: './cards/card-c078.webp', quantity: 0 },
  { id: 'c079', name: '大師認定書', type: '任務卡', subType: '成就', rarity: 'SSR', description: "一份來自平台的正式認定，證明你在某個領域達到了大師級別。", effect: "在任意單一任務類別累積完成 30 個任務且平均評分 4.5 星以上後解鎖，個人檔案顯示「[類別] 認定大師」金色專業徽章。", icon: 'GraduationCap', cardNumber: '#079/100', imagePath: './cards/card-c079.webp', quantity: 0 },
  { id: 'c080', name: '鳳凰再生', type: '技能卡', subType: '主動', rarity: 'SSR', description: "浴火重生的鳳凰之力，讓你從低谷中強勢崛起。", effect: "使用後若你的當月排名下跌超過 15%，觸發「復興模式」：未來 14 天個人檔案曝光量提升 20%，幫助快速回升。", icon: 'Flame', cardNumber: '#080/100', imagePath: './cards/card-c080.webp', quantity: 0 },
  { id: 'c081', name: '全地形探索家', type: '任務卡', subType: '成就', rarity: 'SSR', description: "在所有地形、所有場合都能如魚得水，這才是真正的全能獵人。", effect: "在 10 種不同任務類別各完成至少 1 個任務後解鎖，個人檔案顯示「全地形探索家」動態徽章（帶有旋轉動效）。", icon: 'Map', cardNumber: '#081/100', imagePath: './cards/card-c081.webp', quantity: 0 },
  { id: 'c082', name: '星際通訊頻道', type: '技能卡', subType: '主動', rarity: 'SSR', description: "開啟超遠距離通訊，把你的能力宣傳到整個星球。", effect: "使用後在平台首頁「特色獵人」版塊展示個人檔案 3 天，觸及所有活躍任務發佈方。", icon: 'Broadcast', cardNumber: '#082/100', imagePath: './cards/card-c082.webp', quantity: 0 },
  { id: 'c083', name: '神龍寶珠', type: '技能卡', subType: '主動', rarity: 'SSR', description: "握有神龍寶珠，你的每一個願望都將更接近實現。", effect: "使用後自選一種效果：① 7 天獨家任務通知 ② 30 天個人檔案金框 ③ 3 次差評隱藏機會，三選一永久生效。", icon: 'Gem', cardNumber: '#083/100', imagePath: './cards/card-c083.webp', quantity: 0 },
  { id: 'c084', name: '完美傭兵', type: '任務卡', subType: '成就', rarity: 'SSR', description: "連續五次完美評分，你已超越普通獵人的境界。", effect: "連續獲得 5 個 5 星滿分評價後解鎖，個人檔案顯示「完美傭兵」彩虹色稱號及連續滿分計數器。", icon: 'Trophy', cardNumber: '#084/100', imagePath: './cards/card-c084.webp', quantity: 0 },
  { id: 'c085', name: '暗黑市場通行證', type: '技能卡', subType: '主動', rarity: 'SSR', description: "持有此通行證，進入平台隱藏的高端任務交易所。", effect: "使用後 14 天內可查看「VIP 任務池」，包含未對外公開的邀請制任務，每週更新 5 個名額。", icon: 'KeyRound', cardNumber: '#085/100', imagePath: './cards/card-c085.webp', quantity: 0 },
  { id: 'c086', name: '命運編織者', type: '特殊卡', subType: '成就', rarity: 'SSR', description: "掌握命運的絲線，將不同的機遇編織成屬於你的傳奇。", effect: "使用後連續 3 天，每天隨機觸發以下效果之一：額外抽卡、10 分鐘提前通知、個人檔案排名+3、任務推薦 1 個。", icon: 'Shuffle', cardNumber: '#086/100', imagePath: './cards/card-c086.webp', quantity: 0 },
  { id: 'c087', name: '鑽石鎧甲', type: '技能卡', subType: '被動', rarity: 'SSR', description: "鑽石鍛造的防護，任何負面影響都無法穿透。", effect: "裝備後，本月隱藏最多 2 次 3 星以下評價，並在排名下滑時自動觸發 7 天曝光補償，持續整個月份。", icon: 'Diamond', cardNumber: '#087/100', imagePath: './cards/card-c087.webp', quantity: 0 },
  { id: 'c088', name: '時間凍結術', type: '技能卡', subType: '主動', rarity: 'SSR', description: "短暫凍結時間，讓你在最關鍵的時刻從容應對。", effect: "使用後，你正在關注的 1 個任務進入「優先觀察」狀態，若申請名額即將額滿，提前 30 分鐘私信提醒你，有效期 7 天。", icon: 'Pause', cardNumber: '#088/100', imagePath: './cards/card-c088.webp', quantity: 0 },
  { id: 'c089', name: '百萬里程碑', type: '任務卡', subType: '成就', rarity: 'SSR', description: "百個任務，百個故事，你的足跡已踏遍整個任務大陸。", effect: "累積完成 100 個任務後解鎖，個人檔案顯示「百任之軀」閃光徽章，並獲得永久「百任老兵」稱號。", icon: 'Milestone', cardNumber: '#089/100', imagePath: './cards/card-c089.webp', quantity: 0 },
  { id: 'c090', name: '召喚公會聖旗', type: '技能卡', subType: '主動', rarity: 'SSR', description: "揮舞公會聖旗，凝聚所有成員的力量，共同面對最艱難的挑戰。", effect: "公會會長使用後，公會所有成員在接下來 48 小時內同時享有：任務通知提前 8 分鐘、個人檔案曝光+5%（需建立公會）。", icon: 'Flag', cardNumber: '#090/100', imagePath: './cards/card-c090.webp', quantity: 0 },

  // ============================================================
  // UR 級卡牌 (10 張)
  // ============================================================
  { id: 'c091', name: '傳說獵人認證', type: '特殊卡', subType: '成就', rarity: 'UR', description: "平台官方蓋章認定，你是這個時代最偉大的獵人。", effect: "使用後個人檔案獲得平台官方「傳說獵人 ★」認證標誌（永久顯示），在所有搜尋結果和任務申請列表中優先排序，且認證標誌無法被任何效果遮蓋。", icon: 'BadgeCheck', cardNumber: '#091/100', imagePath: './cards/card-c091.webp', quantity: 0 },
  { id: 'c092', name: '神界置頂令', type: '技能卡', subType: '主動', rarity: 'UR', description: "神明頒布的至高命令，讓你的名字在頂端閃耀整整一個月。", effect: "使用後個人檔案在所有類別的搜尋結果中置頂顯示 30 天，並在每位任務發佈方登入時出現在「今日推薦」第一位。", icon: 'Pin', cardNumber: '#092/100', imagePath: './cards/card-c092.webp', quantity: 0 },
  { id: 'c093', name: '永恆稱號：賞金之王', type: '技能卡', subType: '被動', rarity: 'UR', description: "跨越時間的界限，賞金之王的傳說將永遠流傳。", effect: "裝備後永久在名字旁顯示「👑 賞金之王」稱號（不受時間限制），並在個人檔案頂部展示王者特效動態背景。", icon: 'Crown', cardNumber: '#093/100', imagePath: './cards/card-c093.webp', quantity: 0 },
  { id: 'c094', name: '全能感知領域', type: '技能卡', subType: '被動', rarity: 'UR', description: "感知範圍覆蓋整個平台，沒有任何任務機會能逃過你的掌握。", effect: "裝備後永久啟用：① 所有類別新任務即時通知 ② VIP 任務池永久訪問 ③ 每日個人化精選任務早上 8:00 推送 ④ 任務申請人數實時顯示。", icon: 'Radar', cardNumber: '#094/100', imagePath: './cards/card-c094.webp', quantity: 0 },
  { id: 'c095', name: '創世公會典章', type: '技能卡', subType: '主動', rarity: 'UR', description: "開天闢地的典章，賦予你建立最強公會帝國的力量。", effect: "使用後解鎖「旗艦公會」功能：容納最多 50 名成員、公會專屬任務排行榜、公會徽章自訂、公會公告欄，並獲得「公會創始者」永久稱號。", icon: 'Building', cardNumber: '#095/100', imagePath: './cards/card-c095.webp', quantity: 0 },
  { id: 'c096', name: '時代見證者', type: '任務卡', subType: '成就', rarity: 'UR', description: "你親眼見證了一個時代的誕生，你的名字將永遠刻在平台的歷史中。", effect: "成為平台排名第一的獵人並維持 7 天後解鎖，個人檔案獲得「[年份] 時代冠軍」永久歷史記錄標章，並進入平台名人堂展示頁。", icon: 'Trophy', cardNumber: '#096/100', imagePath: './cards/card-c096.webp', quantity: 0 },
  { id: 'c097', name: '神域結界', type: '技能卡', subType: '被動', rarity: 'UR', description: "神域之力環繞，任何負面力量都無法撼動你建立的聲譽。", effect: "裝備後永久啟用全面聲譽保護：每月自動隱藏最低的 1 個評分、排名連續下滑超過 10 位時自動補償 14 天曝光加成、失敗記錄永不公開顯示。", icon: 'Shield', cardNumber: '#097/100', imagePath: './cards/card-c097.webp', quantity: 0 },
  { id: 'c098', name: '宇宙職業報告', type: '技能卡', subType: '主動', rarity: 'UR', description: "跨越宇宙的視角，以終極數據透視你的完整職業生涯。", effect: "使用後生成「終極獵人生涯報告」：包含所有歷史數據可視化圖表、與頂尖獵人的對標分析、個人化成長路徑建議、最佳潛力任務類型預測，可永久保存和分享。", icon: 'BarChart', cardNumber: '#098/100', imagePath: './cards/card-c098.webp', quantity: 0 },
  { id: 'c099', name: '混沌之源', type: '特殊卡', subType: '成就', rarity: 'UR', description: "宇宙混沌誕生之初的力量，每次使用都會帶來無法預測的奇蹟。", effect: "使用後觸發「混沌降臨」：隨機獲得 3 種效果的組合，效果池包含所有 SSR 卡牌效果，且持續時間加倍。每月限用 1 次，結果完全隨機。", icon: 'Shuffle', cardNumber: '#099/100', imagePath: './cards/card-c099.webp', quantity: 0 },
  { id: 'c100', name: '獵人神話·終焉之刃', type: '技能卡', subType: '主動', rarity: 'UR', description: "這不只是一張卡，這是整個獵人神話的具現——終焉之刃，斬開一切界限。", effect: "使用後啟動「神話模式」持續 30 天：① 個人檔案全平台置頂 ② 永久 VIP 任務池訪問 ③ 每日精選任務早送 30 分鐘 ④ 個人名字在全平台以動態金色粒子特效顯示 ⑤ 解鎖「神話獵人」限定稱號。此卡全平台限量流通 10 張。", icon: 'Zap', cardNumber: '#100/100', imagePath: './cards/card-c100.webp', quantity: 0 },

];

// ===== AI QUEST RECOMMENDATION SYSTEM =====
// Simulates AI/big-data matching: recommends quests based on player's
// strongest stats, quest history patterns, and ability-quest fit.

export interface RecommendedQuest extends Quest {
  matchScore: number; // 0-100
  matchReasons: string[];
}

// Map quest types to the stats they require
const questTypeToStats: Record<string, (keyof PlayerProfile['stats'])[]> = {
  '文案': ['INT'],
  '翻譯': ['INT'],
  '校對': ['INT'],
  '設計': ['INT', 'FOC'],
  '攝影': ['FOC'],
  '剪接': ['FOC'],
  '數據': ['LOG', 'INT'],
  '編程': ['LOG', 'INT'],
  '分析': ['INT', 'LOG'],
  '推廣': ['CHA'],
  '銷售': ['CHA'],
  '現場': ['STR'],
  '策略': ['INT', 'LOG', 'FOC'],
  '配送': ['STR'],
  '問卷': ['STR', 'CHA'],
  '模特': ['CHA'],
  '試鏡': ['CHA'],
};

export function getRecommendedQuests(
  allQuests: Quest[],
  stats: PlayerProfile['stats'],
  history: CompletedQuest[]
): RecommendedQuest[] {
  // Count how many of each type the player has completed
  const typeCounts: Record<string, number> = {};
  for (const q of history) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
  }

  // Find player's top 3 strongest stats
  const statEntries = Object.entries(stats) as [keyof PlayerProfile['stats'], number][];
  const sortedStats = [...statEntries].sort((a, b) => b[1] - a[1]);
  const topStats = sortedStats.slice(0, 3).map(s => s[0]);

  // Score each quest
  const scored: RecommendedQuest[] = allQuests
    .filter(q => q.status === 'available')
    .map(quest => {
      let score = 0;
      const reasons: string[] = [];
      const relevantStats = questTypeToStats[quest.type] || [];

      // Factor 1: Stat alignment (0-40 pts)
      // Does the quest match the player's strongest stats?
      const statMatchCount = relevantStats.filter(s => topStats.includes(s)).length;
      if (statMatchCount > 0) {
        const statBonus = Math.min(40, statMatchCount * 20);
        score += statBonus;
        const matchedLabels = relevantStats
          .filter(s => topStats.includes(s))
          .map(s => {
            const labels: Record<string, string> = { INT: '智力', FOC: '專注', STR: '體力', LOG: '邏輯', HP: '血量', CHA: '魅力' };
            return labels[s];
          });
        reasons.push(`匹配你嘅${matchedLabels.join('、')}優勢`);
      }

      // Factor 2: Experience pattern (0-30 pts)
      // Has the player done this type before? Familiarity = confidence
      const typeCount = typeCounts[quest.type] || 0;
      if (typeCount >= 5) {
        score += 30;
        reasons.push(`已完成${typeCount}個同類任務，經驗豐富`);
      } else if (typeCount >= 2) {
        score += 20;
        reasons.push(`有${typeCount}次同類經驗`);
      } else if (typeCount === 1) {
        score += 10;
        reasons.push('曾完成同類任務');
      }

      // Factor 3: Difficulty-ability match (0-20 pts)
      // Is the quest difficulty appropriate for the player's relevant stats?
      const avgRelevantStat = relevantStats.length > 0
        ? relevantStats.reduce((sum, s) => sum + stats[s], 0) / relevantStats.length
        : 0;
      const idealDifficulty = Math.ceil(avgRelevantStat / 20); // stat 0-20=1star, 20-40=2star...
      const diffGap = Math.abs(quest.difficulty - idealDifficulty);
      if (diffGap === 0) {
        score += 20;
        reasons.push('難度專為你設計');
      } else if (diffGap === 1) {
        score += 12;
        reasons.push(quest.difficulty > idealDifficulty ? '稍有挑戰，助你成長' : '得心應手');
      } else if (diffGap >= 3) {
        score -= 10; // Penalize huge mismatch
      }

      // Factor 4: Region familiarity (0-10 pts)
      const regionQuests = history.filter(h => h.region === quest.region).length;
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

  // Sort by match score descending
  return scored.sort((a, b) => b.matchScore - a.matchScore);
}
