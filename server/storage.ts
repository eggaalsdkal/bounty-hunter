import {
  type User, type InsertUser, users,
  type UserStats, type InsertUserStats, userStats,
  type UserCard, type InsertUserCard, userCards,
  type QuestHistory, type InsertQuestHistory, questHistory,
  type DailyDraw, type InsertDailyDraw, dailyDraws,
  type AcceptedQuest, type InsertAcceptedQuest, acceptedQuests,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";
import { Pool } from "pg";

// ─── PostgreSQL setup ──────────────────────────────────────────────────────
const usePostgres = !!process.env.DATABASE_URL;

let pgPool: Pool | null = null;
if (usePostgres) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
    max: 5,
    idleTimeoutMillis: 30000,
  });
}

// ─── SQLite setup (dev fallback) ───────────────────────────────────────────
let db: ReturnType<typeof drizzle> | null = null;

if (!usePostgres) {
  const dbPath = process.env.DATABASE_PATH || "data.db";
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  // Auto-create tables for SQLite
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      currency INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT '',
      visitor_id TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      int_stat INTEGER NOT NULL DEFAULT 0,
      foc_stat INTEGER NOT NULL DEFAULT 0,
      str_stat INTEGER NOT NULL DEFAULT 0,
      log_stat INTEGER NOT NULL DEFAULT 0,
      hp_stat INTEGER NOT NULL DEFAULT 0,
      cha_stat INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS user_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS quest_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quest_id TEXT NOT NULL,
      type TEXT NOT NULL,
      hours_spent INTEGER NOT NULL DEFAULT 0,
      rating INTEGER NOT NULL DEFAULT 5,
      reward INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS daily_draws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_id TEXT NOT NULL,
      drawn_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accepted_quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quest_id TEXT NOT NULL,
      accepted_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    );
  `);

  db = drizzle(sqlite);
}

// ─── PostgreSQL table initialisation ──────────────────────────────────────
async function initPostgresTables(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        xp INTEGER NOT NULL DEFAULT 0,
        currency INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT '',
        visitor_id TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS user_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        int_stat INTEGER NOT NULL DEFAULT 0,
        foc_stat INTEGER NOT NULL DEFAULT 0,
        str_stat INTEGER NOT NULL DEFAULT 0,
        log_stat INTEGER NOT NULL DEFAULT 0,
        hp_stat INTEGER NOT NULL DEFAULT 0,
        cha_stat INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS user_cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        card_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS quest_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        quest_id TEXT NOT NULL,
        type TEXT NOT NULL,
        hours_spent INTEGER NOT NULL DEFAULT 0,
        rating INTEGER NOT NULL DEFAULT 5,
        reward INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS daily_draws (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        card_id TEXT NOT NULL,
        drawn_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS accepted_quests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        quest_id TEXT NOT NULL,
        accepted_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
      );
    `);
  } finally {
    client.release();
  }
}

// ─── Row mappers ───────────────────────────────────────────────────────────
function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    displayName: row.display_name,
    level: row.level,
    xp: row.xp,
    currency: row.currency,
    createdAt: row.created_at,
    visitorId: row.visitor_id,
  };
}

function mapUserStats(row: any): UserStats {
  return {
    id: row.id,
    userId: row.user_id,
    INT: row.int_stat,
    FOC: row.foc_stat,
    STR: row.str_stat,
    LOG: row.log_stat,
    HP: row.hp_stat,
    CHA: row.cha_stat,
  };
}

function mapUserCard(row: any): UserCard {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    quantity: row.quantity,
  };
}

function mapQuestHistory(row: any): QuestHistory {
  return {
    id: row.id,
    userId: row.user_id,
    questId: row.quest_id,
    type: row.type,
    hoursSpent: row.hours_spent,
    rating: row.rating,
    reward: row.reward,
    completedAt: row.completed_at,
  };
}

function mapDailyDraw(row: any): DailyDraw {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    drawnAt: row.drawn_at,
  };
}

function mapAcceptedQuest(row: any): AcceptedQuest {
  return {
    id: row.id,
    userId: row.user_id,
    questId: row.quest_id,
    acceptedAt: row.accepted_at,
    status: row.status,
  };
}

// ─── Interface ─────────────────────────────────────────────────────────────
export interface IStorage {
  // Init
  initPostgres(): Promise<void>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVisitorId(visitorId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<Pick<User, 'level' | 'xp' | 'currency' | 'displayName'>>): Promise<User | undefined>;
  updateVisitorId(userId: number, visitorId: string): Promise<void>;
  clearVisitorId(userId: number): Promise<void>;

  // User Stats
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(data: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, data: Partial<Pick<UserStats, 'INT' | 'FOC' | 'STR' | 'LOG' | 'HP' | 'CHA'>>): Promise<UserStats | undefined>;

  // User Cards
  getUserCards(userId: number): Promise<UserCard[]>;
  getUserCard(userId: number, cardId: string): Promise<UserCard | undefined>;
  upsertUserCard(userId: number, cardId: string, quantityDelta: number): Promise<UserCard>;

  // Quest History
  getQuestHistory(userId: number): Promise<QuestHistory[]>;
  addQuestHistory(data: InsertQuestHistory): Promise<QuestHistory>;

  // Daily Draws
  getDailyDraw(userId: number, date: string): Promise<DailyDraw | undefined>;
  addDailyDraw(data: InsertDailyDraw): Promise<DailyDraw>;

  // Accepted Quests
  getAcceptedQuests(userId: number): Promise<AcceptedQuest[]>;
  getAcceptedQuest(userId: number, questId: string): Promise<AcceptedQuest | undefined>;
  acceptQuest(data: InsertAcceptedQuest): Promise<AcceptedQuest>;
  updateAcceptedQuestStatus(userId: number, questId: string, status: string): Promise<AcceptedQuest | undefined>;
}

// ─── Implementation ────────────────────────────────────────────────────────
export class DatabaseStorage implements IStorage {

  async initPostgres(): Promise<void> {
    if (pgPool) {
      await initPostgresTables(pgPool);
    }
  }

  // === Users ===

  async getUser(id: number): Promise<User | undefined> {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] ? mapUser(result.rows[0]) : undefined;
    }
    return db!.select().from(users).where(eq(users.id, id)).get() as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] ? mapUser(result.rows[0]) : undefined;
    }
    return db!.select().from(users).where(eq(users.email, email)).get() as User | undefined;
  }

  async getUserByVisitorId(visitorId: string): Promise<User | undefined> {
    if (!visitorId) return undefined;
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM users WHERE visitor_id = $1', [visitorId]);
      return result.rows[0] ? mapUser(result.rows[0]) : undefined;
    }
    return db!.select().from(users).where(eq(users.visitorId, visitorId)).get() as User | undefined;
  }

  async updateVisitorId(userId: number, visitorId: string): Promise<void> {
    if (pgPool) {
      await pgPool.query('UPDATE users SET visitor_id = $1 WHERE id = $2', [visitorId, userId]);
      return;
    }
    db!.update(users).set({ visitorId }).where(eq(users.id, userId)).run();
  }

  async clearVisitorId(userId: number): Promise<void> {
    if (pgPool) {
      await pgPool.query("UPDATE users SET visitor_id = '' WHERE id = $1", [userId]);
      return;
    }
    db!.update(users).set({ visitorId: '' }).where(eq(users.id, userId)).run();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const createdAt = new Date().toISOString();
    if (pgPool) {
      const result = await pgPool.query(
        `INSERT INTO users (email, password, display_name, level, xp, currency, created_at, visitor_id)
         VALUES ($1, $2, $3, 1, 0, 0, $4, '')
         RETURNING *`,
        [insertUser.email, insertUser.password, insertUser.displayName, createdAt]
      );
      return mapUser(result.rows[0]);
    }
    return db!.insert(users).values({
      ...insertUser,
      createdAt,
    }).returning().get() as User;
  }

  async updateUser(id: number, data: Partial<Pick<User, 'level' | 'xp' | 'currency' | 'displayName'>>): Promise<User | undefined> {
    if (pgPool) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (data.level !== undefined) { setClauses.push(`level = $${idx++}`); values.push(data.level); }
      if (data.xp !== undefined) { setClauses.push(`xp = $${idx++}`); values.push(data.xp); }
      if (data.currency !== undefined) { setClauses.push(`currency = $${idx++}`); values.push(data.currency); }
      if (data.displayName !== undefined) { setClauses.push(`display_name = $${idx++}`); values.push(data.displayName); }
      if (setClauses.length === 0) return this.getUser(id);
      values.push(id);
      const result = await pgPool.query(
        `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return result.rows[0] ? mapUser(result.rows[0]) : undefined;
    }
    return db!.update(users).set(data).where(eq(users.id, id)).returning().get() as User | undefined;
  }

  // === User Stats ===

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
      return result.rows[0] ? mapUserStats(result.rows[0]) : undefined;
    }
    return db!.select().from(userStats).where(eq(userStats.userId, userId)).get() as UserStats | undefined;
  }

  async createUserStats(data: InsertUserStats): Promise<UserStats> {
    if (pgPool) {
      const result = await pgPool.query(
        `INSERT INTO user_stats (user_id, int_stat, foc_stat, str_stat, log_stat, hp_stat, cha_stat)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [data.userId, data.INT ?? 0, data.FOC ?? 0, data.STR ?? 0, data.LOG ?? 0, data.HP ?? 0, data.CHA ?? 0]
      );
      return mapUserStats(result.rows[0]);
    }
    return db!.insert(userStats).values(data).returning().get() as UserStats;
  }

  async updateUserStats(userId: number, data: Partial<Pick<UserStats, 'INT' | 'FOC' | 'STR' | 'LOG' | 'HP' | 'CHA'>>): Promise<UserStats | undefined> {
    if (pgPool) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (data.INT !== undefined) { setClauses.push(`int_stat = $${idx++}`); values.push(data.INT); }
      if (data.FOC !== undefined) { setClauses.push(`foc_stat = $${idx++}`); values.push(data.FOC); }
      if (data.STR !== undefined) { setClauses.push(`str_stat = $${idx++}`); values.push(data.STR); }
      if (data.LOG !== undefined) { setClauses.push(`log_stat = $${idx++}`); values.push(data.LOG); }
      if (data.HP !== undefined) { setClauses.push(`hp_stat = $${idx++}`); values.push(data.HP); }
      if (data.CHA !== undefined) { setClauses.push(`cha_stat = $${idx++}`); values.push(data.CHA); }
      if (setClauses.length === 0) return this.getUserStats(userId);
      values.push(userId);
      const result = await pgPool.query(
        `UPDATE user_stats SET ${setClauses.join(', ')} WHERE user_id = $${idx} RETURNING *`,
        values
      );
      return result.rows[0] ? mapUserStats(result.rows[0]) : undefined;
    }
    return db!.update(userStats).set(data).where(eq(userStats.userId, userId)).returning().get() as UserStats | undefined;
  }

  // === User Cards ===

  async getUserCards(userId: number): Promise<UserCard[]> {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM user_cards WHERE user_id = $1', [userId]);
      return result.rows.map(mapUserCard);
    }
    return db!.select().from(userCards).where(eq(userCards.userId, userId)).all() as UserCard[];
  }

  async getUserCard(userId: number, cardId: string): Promise<UserCard | undefined> {
    if (pgPool) {
      const result = await pgPool.query(
        'SELECT * FROM user_cards WHERE user_id = $1 AND card_id = $2',
        [userId, cardId]
      );
      return result.rows[0] ? mapUserCard(result.rows[0]) : undefined;
    }
    return db!.select().from(userCards).where(
      and(eq(userCards.userId, userId), eq(userCards.cardId, cardId))
    ).get() as UserCard | undefined;
  }

  async upsertUserCard(userId: number, cardId: string, quantityDelta: number): Promise<UserCard> {
    if (pgPool) {
      const existing = await this.getUserCard(userId, cardId);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + quantityDelta);
        const result = await pgPool.query(
          'UPDATE user_cards SET quantity = $1 WHERE user_id = $2 AND card_id = $3 RETURNING *',
          [newQty, userId, cardId]
        );
        return mapUserCard(result.rows[0]);
      } else {
        const result = await pgPool.query(
          'INSERT INTO user_cards (user_id, card_id, quantity) VALUES ($1, $2, $3) RETURNING *',
          [userId, cardId, Math.max(0, quantityDelta)]
        );
        return mapUserCard(result.rows[0]);
      }
    }
    const existing = db!.select().from(userCards).where(
      and(eq(userCards.userId, userId), eq(userCards.cardId, cardId))
    ).get() as UserCard | undefined;
    if (existing) {
      const newQty = Math.max(0, existing.quantity + quantityDelta);
      return db!.update(userCards)
        .set({ quantity: newQty })
        .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)))
        .returning().get() as UserCard;
    } else {
      return db!.insert(userCards).values({
        userId,
        cardId,
        quantity: Math.max(0, quantityDelta),
      }).returning().get() as UserCard;
    }
  }

  // === Quest History ===

  async getQuestHistory(userId: number): Promise<QuestHistory[]> {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM quest_history WHERE user_id = $1', [userId]);
      return result.rows.map(mapQuestHistory);
    }
    return db!.select().from(questHistory).where(eq(questHistory.userId, userId)).all() as QuestHistory[];
  }

  async addQuestHistory(data: InsertQuestHistory): Promise<QuestHistory> {
    if (pgPool) {
      const result = await pgPool.query(
        `INSERT INTO quest_history (user_id, quest_id, type, hours_spent, rating, reward, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [data.userId, data.questId, data.type, data.hoursSpent ?? 0, data.rating ?? 5, data.reward ?? 0, data.completedAt]
      );
      return mapQuestHistory(result.rows[0]);
    }
    return db!.insert(questHistory).values(data).returning().get() as QuestHistory;
  }

  // === Daily Draws ===

  async getDailyDraw(userId: number, date: string): Promise<DailyDraw | undefined> {
    if (pgPool) {
      const result = await pgPool.query(
        'SELECT * FROM daily_draws WHERE user_id = $1 AND drawn_at = $2',
        [userId, date]
      );
      return result.rows[0] ? mapDailyDraw(result.rows[0]) : undefined;
    }
    return db!.select().from(dailyDraws).where(
      and(eq(dailyDraws.userId, userId), eq(dailyDraws.drawnAt, date))
    ).get() as DailyDraw | undefined;
  }

  async addDailyDraw(data: InsertDailyDraw): Promise<DailyDraw> {
    if (pgPool) {
      const result = await pgPool.query(
        'INSERT INTO daily_draws (user_id, card_id, drawn_at) VALUES ($1, $2, $3) RETURNING *',
        [data.userId, data.cardId, data.drawnAt]
      );
      return mapDailyDraw(result.rows[0]);
    }
    return db!.insert(dailyDraws).values(data).returning().get() as DailyDraw;
  }

  // === Accepted Quests ===

  async getAcceptedQuests(userId: number): Promise<AcceptedQuest[]> {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM accepted_quests WHERE user_id = $1', [userId]);
      return result.rows.map(mapAcceptedQuest);
    }
    return db!.select().from(acceptedQuests).where(eq(acceptedQuests.userId, userId)).all() as AcceptedQuest[];
  }

  async getAcceptedQuest(userId: number, questId: string): Promise<AcceptedQuest | undefined> {
    if (pgPool) {
      const result = await pgPool.query(
        'SELECT * FROM accepted_quests WHERE user_id = $1 AND quest_id = $2',
        [userId, questId]
      );
      return result.rows[0] ? mapAcceptedQuest(result.rows[0]) : undefined;
    }
    return db!.select().from(acceptedQuests).where(
      and(eq(acceptedQuests.userId, userId), eq(acceptedQuests.questId, questId))
    ).get() as AcceptedQuest | undefined;
  }

  async acceptQuest(data: InsertAcceptedQuest): Promise<AcceptedQuest> {
    if (pgPool) {
      const result = await pgPool.query(
        `INSERT INTO accepted_quests (user_id, quest_id, accepted_at, status)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.userId, data.questId, data.acceptedAt, data.status ?? 'active']
      );
      return mapAcceptedQuest(result.rows[0]);
    }
    return db!.insert(acceptedQuests).values(data).returning().get() as AcceptedQuest;
  }

  async updateAcceptedQuestStatus(userId: number, questId: string, status: string): Promise<AcceptedQuest | undefined> {
    if (pgPool) {
      const result = await pgPool.query(
        'UPDATE accepted_quests SET status = $1 WHERE user_id = $2 AND quest_id = $3 RETURNING *',
        [status, userId, questId]
      );
      return result.rows[0] ? mapAcceptedQuest(result.rows[0]) : undefined;
    }
    return db!.update(acceptedQuests)
      .set({ status })
      .where(and(eq(acceptedQuests.userId, userId), eq(acceptedQuests.questId, questId)))
      .returning().get() as AcceptedQuest | undefined;
  }
}

export const storage = new DatabaseStorage();
