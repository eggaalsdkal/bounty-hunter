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

const dbPath = process.env.DATABASE_PATH || "data.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Auto-create tables if they don't exist
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

export const db = drizzle(sqlite);

export interface IStorage {
  // Users
  getUser(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  getUserByVisitorId(visitorId: string): User | undefined;
  createUser(user: InsertUser): User;
  updateUser(id: number, data: Partial<Pick<User, 'level' | 'xp' | 'currency' | 'displayName'>>): User | undefined;
  updateVisitorId(userId: number, visitorId: string): void;
  clearVisitorId(userId: number): void;

  // User Stats
  getUserStats(userId: number): UserStats | undefined;
  createUserStats(data: InsertUserStats): UserStats;
  updateUserStats(userId: number, data: Partial<Pick<UserStats, 'INT' | 'FOC' | 'STR' | 'LOG' | 'HP' | 'CHA'>>): UserStats | undefined;

  // User Cards
  getUserCards(userId: number): UserCard[];
  getUserCard(userId: number, cardId: string): UserCard | undefined;
  upsertUserCard(userId: number, cardId: string, quantityDelta: number): UserCard;

  // Quest History
  getQuestHistory(userId: number): QuestHistory[];
  addQuestHistory(data: InsertQuestHistory): QuestHistory;

  // Daily Draws
  getDailyDraw(userId: number, date: string): DailyDraw | undefined;
  addDailyDraw(data: InsertDailyDraw): DailyDraw;

  // Accepted Quests
  getAcceptedQuests(userId: number): AcceptedQuest[];
  getAcceptedQuest(userId: number, questId: string): AcceptedQuest | undefined;
  acceptQuest(data: InsertAcceptedQuest): AcceptedQuest;
  updateAcceptedQuestStatus(userId: number, questId: string, status: string): AcceptedQuest | undefined;
}

export class DatabaseStorage implements IStorage {
  // === Users ===
  getUser(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  getUserByVisitorId(visitorId: string): User | undefined {
    if (!visitorId) return undefined;
    return db.select().from(users).where(eq(users.visitorId, visitorId)).get();
  }

  updateVisitorId(userId: number, visitorId: string): void {
    db.update(users).set({ visitorId }).where(eq(users.id, userId)).run();
  }

  clearVisitorId(userId: number): void {
    db.update(users).set({ visitorId: '' }).where(eq(users.id, userId)).run();
  }

  createUser(insertUser: InsertUser): User {
    return db.insert(users).values({
      ...insertUser,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  updateUser(id: number, data: Partial<Pick<User, 'level' | 'xp' | 'currency' | 'displayName'>>): User | undefined {
    return db.update(users).set(data).where(eq(users.id, id)).returning().get();
  }

  // === User Stats ===
  getUserStats(userId: number): UserStats | undefined {
    return db.select().from(userStats).where(eq(userStats.userId, userId)).get();
  }

  createUserStats(data: InsertUserStats): UserStats {
    return db.insert(userStats).values(data).returning().get();
  }

  updateUserStats(userId: number, data: Partial<Pick<UserStats, 'INT' | 'FOC' | 'STR' | 'LOG' | 'HP' | 'CHA'>>): UserStats | undefined {
    return db.update(userStats).set(data).where(eq(userStats.userId, userId)).returning().get();
  }

  // === User Cards ===
  getUserCards(userId: number): UserCard[] {
    return db.select().from(userCards).where(eq(userCards.userId, userId)).all();
  }

  getUserCard(userId: number, cardId: string): UserCard | undefined {
    return db.select().from(userCards).where(
      and(eq(userCards.userId, userId), eq(userCards.cardId, cardId))
    ).get();
  }

  upsertUserCard(userId: number, cardId: string, quantityDelta: number): UserCard {
    const existing = this.getUserCard(userId, cardId);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + quantityDelta);
      return db.update(userCards)
        .set({ quantity: newQty })
        .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)))
        .returning().get()!;
    } else {
      return db.insert(userCards).values({
        userId,
        cardId,
        quantity: Math.max(0, quantityDelta),
      }).returning().get();
    }
  }

  // === Quest History ===
  getQuestHistory(userId: number): QuestHistory[] {
    return db.select().from(questHistory).where(eq(questHistory.userId, userId)).all();
  }

  addQuestHistory(data: InsertQuestHistory): QuestHistory {
    return db.insert(questHistory).values(data).returning().get();
  }

  // === Daily Draws ===
  getDailyDraw(userId: number, date: string): DailyDraw | undefined {
    return db.select().from(dailyDraws).where(
      and(eq(dailyDraws.userId, userId), eq(dailyDraws.drawnAt, date))
    ).get();
  }

  addDailyDraw(data: InsertDailyDraw): DailyDraw {
    return db.insert(dailyDraws).values(data).returning().get();
  }

  // === Accepted Quests ===
  getAcceptedQuests(userId: number): AcceptedQuest[] {
    return db.select().from(acceptedQuests).where(eq(acceptedQuests.userId, userId)).all();
  }

  getAcceptedQuest(userId: number, questId: string): AcceptedQuest | undefined {
    return db.select().from(acceptedQuests).where(
      and(eq(acceptedQuests.userId, userId), eq(acceptedQuests.questId, questId))
    ).get();
  }

  acceptQuest(data: InsertAcceptedQuest): AcceptedQuest {
    return db.insert(acceptedQuests).values(data).returning().get();
  }

  updateAcceptedQuestStatus(userId: number, questId: string, status: string): AcceptedQuest | undefined {
    return db.update(acceptedQuests)
      .set({ status })
      .where(and(eq(acceptedQuests.userId, userId), eq(acceptedQuests.questId, questId)))
      .returning().get();
  }
}

export const storage = new DatabaseStorage();
