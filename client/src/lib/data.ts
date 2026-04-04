// Quest Hunter — Sample Data

export type Rarity = 'H' | 'G' | 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';
export type CardType = '任務卡' | '技能卡' | '成就卡';
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
    DEX: number;
    STR: number;
    LOG: number;
    LNG: number;
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
  rarity: Rarity;
  region: Region | '通用';
  description: string;
  icon: string; // lucide icon name
  cardNumber: string;
  requirements?: string;
  reward?: string;
  effect?: string;
  isOwned: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  region: Region;
  difficulty: number; // 1-5 stars
  rarity: Rarity;
  reward: number; // HK$
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
  H: '#808080',
  G: '#cccccc',
  F: '#4ade80',
  E: '#60a5fa',
  D: '#3b82f6',
  C: '#a855f7',
  B: '#f97316',
  A: '#ef4444',
  S: '#ffd700',
  SS: '#ff69b4',
};

export const rarityLabels: Record<Rarity, string> = {
  H: '灰',
  G: '白',
  F: '綠',
  E: '藍',
  D: '深藍',
  C: '紫',
  B: '橙',
  A: '紅',
  S: '金',
  SS: '彩虹',
};

export const rarityCssClass: Record<Rarity, string> = {
  H: 'rarity-h',
  G: 'rarity-g',
  F: 'rarity-f',
  E: 'rarity-e',
  D: 'rarity-d',
  C: 'rarity-c',
  B: 'rarity-b',
  A: 'rarity-a',
  S: 'rarity-s',
  SS: 'rarity-ss',
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

// Player profile
export const playerProfile: PlayerProfile = {
  hunterName: '墨影',
  title: '急稿王者',
  className: '文字獵人',
  classEn: 'Inkblade',
  level: 3,
  levelTitle: '正式獵人',
  xp: 680,
  xpMax: 1000,
  currency: 6350,
  stats: { INT: 35, DEX: 20, STR: 15, LOG: 25, LNG: 30, CHA: 18 },
  completedQuests: 42,
  totalEarnings: 6350,
  avgRating: 4.6,
  activeDays: 12,
  ownedCards: 23,
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
  { id: 'dq3', title: '30分鐘內完成一個 H 級任務', reward: '+100 積分', completed: false },
];

// Recent activity
export const recentActivity: ActivityItem[] = [
  { id: 'a1', text: '完成了「社媒文案撰寫」任務', time: '2小時前', type: 'quest' },
  { id: 'a2', text: '獲得了 F級「SEO入門卡」', time: '2小時前', type: 'card' },
  { id: 'a3', text: '連續活躍天數達到 12 天', time: '今天', type: 'achievement' },
  { id: 'a4', text: '完成了「產品描述翻譯」任務', time: '昨天', type: 'quest' },
  { id: 'a5', text: '獲得了 E級「偵查卡」', time: '昨天', type: 'card' },
];

// Sample quests (15+)
export const quests: Quest[] = [
  {
    id: 'q1', title: '社交媒體文案（3篇）', description: '為本地餐廳撰寫三篇 Instagram 宣傳文案，需配合品牌語調，每篇100-150字。',
    region: '文字之森', difficulty: 1, rarity: 'H', reward: 150, timeLimit: '24小時', requirements: '無', type: '文案', status: 'available',
  },
  {
    id: 'q2', title: 'SEO文章撰寫（1500字）', description: '撰寫一篇關於「香港數碼營銷趨勢」的SEO優化文章，需包含關鍵詞植入及內部連結建議。',
    region: '文字之森', difficulty: 2, rarity: 'E', reward: 250, timeLimit: '48小時', requirements: 'INT 25+, LNG 15+', type: '文案', status: 'available',
  },
  {
    id: 'q3', title: '中英商業文件翻譯', description: '翻譯一份2000字的商業企劃書，要求專業用語精準，保持原文語氣。',
    region: '文字之森', difficulty: 3, rarity: 'D', reward: 400, timeLimit: '72小時', requirements: 'INT 30+, LNG 30+', type: '翻譯', status: 'available',
  },
  {
    id: 'q4', title: '品牌Logo設計', description: '為新創咖啡品牌設計Logo，需提供3個方案及延伸應用展示。要求現代簡約風格。',
    region: '視覺神殿', difficulty: 3, rarity: 'C', reward: 800, timeLimit: '72小時', requirements: 'DEX 40+', type: '設計', status: 'available',
  },
  {
    id: 'q5', title: '產品攝影（10件）', description: '為電商平台拍攝10件服飾產品照片，白底去背，多角度拍攝。',
    region: '視覺神殿', difficulty: 2, rarity: 'E', reward: 600, timeLimit: '48小時', requirements: 'DEX 25+', type: '攝影', status: 'available',
  },
  {
    id: 'q6', title: 'Excel數據整理（500行）', description: '整理及清洗500行客戶數據，包括去重、格式統一、缺失值填補。',
    region: '數字迷城', difficulty: 2, rarity: 'F', reward: 200, timeLimit: '48小時', requirements: 'LOG 15+', type: '數據', status: 'available',
  },
  {
    id: 'q7', title: 'Python自動化腳本', description: '開發一個Python腳本，自動從指定網站收集產品價格資訊並整理成CSV。',
    region: '數字迷城', difficulty: 4, rarity: 'B', reward: 1500, timeLimit: '7天', requirements: 'LOG 50+, INT 40+', type: '編程', status: 'available',
  },
  {
    id: 'q8', title: '市場調查報告', description: '針對香港飲品市場進行桌面研究，提交3000字市調報告含數據圖表。',
    region: '數字迷城', difficulty: 3, rarity: 'D', reward: 500, timeLimit: '5天', requirements: 'LOG 30+, INT 25+', type: '分析', status: 'available',
  },
  {
    id: 'q9', title: '社媒推廣文案+排期', description: '為健身品牌制定一週社媒推廣計劃，包含7篇文案及最佳發布時間建議。',
    region: '商旅驛站', difficulty: 2, rarity: 'F', reward: 350, timeLimit: '48小時', requirements: 'CHA 15+', type: '推廣', status: 'available',
  },
  {
    id: 'q10', title: '電話銷售（50通）', description: '根據提供的客戶名單進行電話推銷，介紹新產品並記錄客戶反饋。',
    region: '商旅驛站', difficulty: 2, rarity: 'G', reward: 300, timeLimit: '3天', requirements: 'CHA 20+', type: '銷售', status: 'available',
  },
  {
    id: 'q11', title: '神秘顧客探訪', description: '到指定連鎖餐廳進行神秘顧客探訪，填寫評估表格並拍攝紀錄照片。',
    region: '現場戰場', difficulty: 1, rarity: 'H', reward: 150, timeLimit: '24小時', requirements: '無', type: '現場', status: 'available',
  },
  {
    id: 'q12', title: '活動現場攝影', description: '為企業年度晚宴進行現場攝影，需4小時駐場，交付200+精修照片。',
    region: '現場戰場', difficulty: 3, rarity: 'D', reward: 600, timeLimit: '48小時', requirements: 'DEX 30+, STR 20+', type: '現場', status: 'available',
  },
  {
    id: 'q13', title: '年度品牌視覺策略', description: '為大型企業制定年度品牌視覺策略，包括品牌指南、模板系統、視覺語言定義。',
    region: '傳說聖域', difficulty: 5, rarity: 'SS', reward: 15000, timeLimit: '30天', requirements: 'Lv.6+, DEX 80+, INT 60+', type: '策略', status: 'available',
  },
  {
    id: 'q14', title: 'UI介面設計（App）', description: '為健康管理App設計5個核心頁面的UI界面，需提供高保真原型。',
    region: '視覺神殿', difficulty: 4, rarity: 'A', reward: 2500, timeLimit: '7天', requirements: 'DEX 55+, INT 35+', type: '設計', status: 'available',
  },
  {
    id: 'q15', title: '企業內部系統開發', description: '開發一個員工考勤管理系統，包含打卡、請假、報表功能。React+Node.js。',
    region: '數字迷城', difficulty: 5, rarity: 'S', reward: 8000, timeLimit: '14天', requirements: 'LOG 70+, INT 50+, Lv.5+', type: '編程', status: 'available',
  },
  {
    id: 'q16', title: '問卷調查執行', description: '在指定商場進行100份消費者問卷調查，需完成數據輸入及基本統計。',
    region: '現場戰場', difficulty: 2, rarity: 'G', reward: 250, timeLimit: '3天', requirements: 'STR 10+, CHA 10+', type: '現場', status: 'available',
  },
];

// Sample cards (25+)
export const cards: GameCard[] = [
  // Task cards (任務卡)
  { id: 'c1', name: '社媒文案達人', type: '任務卡', rarity: 'H', region: '文字之森', description: '完成社交媒體文案任務後獲得。初級文案獵人的起步之證。', icon: 'FileText', cardNumber: '#001/100', requirements: '完成社媒文案任務', reward: 'HK$150', isOwned: true },
  { id: 'c2', name: 'SEO文章撰寫', type: '任務卡', rarity: 'E', region: '文字之森', description: '完成SEO優化文章任務後獲得。證明你掌握了搜尋引擎的秘密語言。', icon: 'Search', cardNumber: '#008/100', requirements: 'INT 25+, LNG 15+', reward: 'HK$250', isOwned: true },
  { id: 'c3', name: '品牌Logo大師', type: '任務卡', rarity: 'C', region: '視覺神殿', description: '完成品牌Logo設計任務後獲得。視覺創造者的榮耀徽記。', icon: 'Gem', cardNumber: '#022/100', requirements: 'DEX 40+', reward: 'HK$800', isOwned: true },
  { id: 'c4', name: '數據清洗師', type: '任務卡', rarity: 'F', region: '數字迷城', description: '完成數據整理任務後獲得。混沌數據中的秩序守護者。', icon: 'Database', cardNumber: '#031/100', requirements: 'LOG 15+', reward: 'HK$200', isOwned: true },
  { id: 'c5', name: '神秘探訪者', type: '任務卡', rarity: 'H', region: '現場戰場', description: '完成神秘顧客探訪任務後獲得。隱匿於人群中的觀察者。', icon: 'Eye', cardNumber: '#051/100', requirements: '無', reward: 'HK$150', isOwned: true },
  { id: 'c6', name: '翻譯術士', type: '任務卡', rarity: 'D', region: '文字之森', description: '完成商業翻譯任務後獲得。跨越語言之牆的使者。', icon: 'Languages', cardNumber: '#012/100', requirements: 'INT 30+, LNG 30+', reward: 'HK$400', isOwned: true },
  { id: 'c7', name: '產品攝影師', type: '任務卡', rarity: 'E', region: '視覺神殿', description: '完成產品攝影任務後獲得。用光影捕捉物品靈魂的藝術家。', icon: 'Camera', cardNumber: '#025/100', requirements: 'DEX 25+', reward: 'HK$600', isOwned: true },
  { id: 'c8', name: 'Python術士', type: '任務卡', rarity: 'B', region: '數字迷城', description: '完成Python自動化任務後獲得。用代碼操縱世界運行規律的魔法師。', icon: 'Terminal', cardNumber: '#035/100', requirements: 'LOG 50+, INT 40+', reward: 'HK$1,500', isOwned: false },
  { id: 'c9', name: '推廣策劃師', type: '任務卡', rarity: 'F', region: '商旅驛站', description: '完成社媒推廣計劃後獲得。商業戰場上的策略指揮官。', icon: 'Megaphone', cardNumber: '#041/100', requirements: 'CHA 15+', reward: 'HK$350', isOwned: true },
  { id: 'c10', name: '傳說策略師', type: '任務卡', rarity: 'SS', region: '傳說聖域', description: '完成年度品牌視覺策略任務後獲得。踏入傳說之域的至高證明，全平台僅存5張。', icon: 'Sparkles', cardNumber: '#099/100', requirements: 'Lv.6+, DEX 80+', reward: 'HK$15,000', isOwned: false },
  { id: 'c11', name: 'UI界面設計師', type: '任務卡', rarity: 'A', region: '視覺神殿', description: '完成高難度UI設計任務後獲得。數碼世界的建築大師。', icon: 'Layout', cardNumber: '#028/100', requirements: 'DEX 55+, INT 35+', reward: 'HK$2,500', isOwned: false },
  { id: 'c12', name: '系統架構師', type: '任務卡', rarity: 'S', region: '數字迷城', description: '完成企業系統開發任務後獲得。構建數碼帝國的傳奇工程師。', icon: 'Server', cardNumber: '#038/100', requirements: 'LOG 70+, INT 50+', reward: 'HK$8,000', isOwned: false },

  // Skill cards (技能卡) — Active
  { id: 'c13', name: '加速卡', type: '技能卡', rarity: 'F', region: '通用', description: '使用後任務審批時間從12小時縮短至1小時。讓等待不再是瓶頸。', icon: 'Zap', cardNumber: '#061/100', effect: '審批時間縮短至1小時', isOwned: true },
  { id: 'c14', name: '偵查卡', type: '技能卡', rarity: 'D', region: '通用', description: '使用後可提前48小時查看未公開的高薪任務。先知者的預見之力。', icon: 'Search', cardNumber: '#062/100', effect: '提前48小時看到隱藏任務', isOwned: true },
  { id: 'c15', name: '護盾卡', type: '技能卡', rarity: 'C', region: '通用', description: '使用後免除一次差評的評分影響。保護你的獵人聲譽。', icon: 'Shield', cardNumber: '#063/100', effect: '免除一次差評影響', isOwned: true },
  { id: 'c16', name: '搶單卡', type: '技能卡', rarity: 'B', region: '通用', description: '使用後對指定任務獲得優先接單權，成功率+80%。搶先一步的競爭利器。', icon: 'Sword', cardNumber: '#064/100', effect: '優先接單，成功率+80%', isOwned: false },
  { id: 'c17', name: '加薪卡', type: '技能卡', rarity: 'B', region: '通用', description: '使用後要求報酬提高15%，客戶可接受或拒絕。你的實力值得更多回報。', icon: 'Coins', cardNumber: '#065/100', effect: '任務報酬+15%', isOwned: false },
  { id: 'c18', name: '精準卡', type: '技能卡', rarity: 'A', region: '通用', description: '系統推薦「最高命中率」任務，接單成功率+95%。百發百中的獵人直覺。', icon: 'Target', cardNumber: '#066/100', effect: '最優任務推薦+95%成功率', isOwned: false },
  { id: 'c19', name: '傳送卡', type: '技能卡', rarity: 'S', region: '通用', description: '將個人資料傳送至指定企業客戶，邀請直接合作。穿越商業次元的傳說道具。', icon: 'Send', cardNumber: '#067/100', effect: '直接聯繫企業客戶', isOwned: false },

  // Skill cards (技能卡) — Passive
  { id: 'c20', name: '經驗加成卡', type: '技能卡', rarity: 'G', region: '通用', description: '裝備後所有任務積分+20%。穩定成長的基石。', icon: 'TrendingUp', cardNumber: '#071/100', effect: '任務積分+20%', isOwned: true },
  { id: 'c21', name: '品質加持卡', type: '技能卡', rarity: 'E', region: '通用', description: '裝備後客戶給出4星以上評分機率+10%。品質就是最好的名片。', icon: 'Star', cardNumber: '#072/100', effect: '高評分機率+10%', isOwned: true },
  { id: 'c22', name: '夜貓卡', type: '技能卡', rarity: 'D', region: '通用', description: '裝備後晚上10時至凌晨2時接受的任務報酬+8%。夜間獵人的專屬加成。', icon: 'Moon', cardNumber: '#073/100', effect: '夜間報酬+8%', isOwned: true },

  // Achievement cards (成就卡)
  { id: 'c23', name: '百戰勇士', type: '成就卡', rarity: 'C', region: '通用', description: '完成100個任務的榮耀證明。百戰歸來仍是少年。', icon: 'Medal', cardNumber: '#081/100', effect: '接單上限+20%', isOwned: false },
  { id: 'c24', name: '五星獵人', type: '成就卡', rarity: 'B', region: '通用', description: '連續10個任務獲得5星評價。完美主義者的極致追求。', icon: 'Star', cardNumber: '#082/100', effect: '系統推薦優先度+30%', isOwned: false },
  { id: 'c25', name: '七日連勝', type: '成就卡', rarity: 'E', region: '通用', description: '連續7日每天完成至少一個任務。堅持就是最大的力量。', icon: 'Flame', cardNumber: '#084/100', effect: '第8日報酬+10%', isOwned: true },
  { id: 'c26', name: '熬夜戰士', type: '成就卡', rarity: 'D', region: '通用', description: '深夜完成50個任務。夜幕下的無名英雄。', icon: 'Moon', cardNumber: '#083/100', effect: '夜間任務通知優先推送', isOwned: false },
  { id: 'c27', name: '傳奇完成者', type: '成就卡', rarity: 'SS', region: '傳說聖域', description: '完成一個SS級任務的絕世榮耀。永久獲得「傳說獵人」稱號。', icon: 'Trophy', cardNumber: '#088/100', effect: '永久「傳說獵人」稱號', isOwned: false },
];
