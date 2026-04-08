import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  currency: integer("currency").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
  visitorId: text("visitor_id").default(""),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  displayName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User stats (能力值)
export const userStats = sqliteTable("user_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  INT: integer("int_stat").notNull().default(0),
  FOC: integer("foc_stat").notNull().default(0),
  STR: integer("str_stat").notNull().default(0),
  LOG: integer("log_stat").notNull().default(0),
  HP: integer("hp_stat").notNull().default(0),
  CHA: integer("cha_stat").notNull().default(0),
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({ id: true });
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

// Card inventory (用戶卡牌庫存)
export const userCards = sqliteTable("user_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  cardId: text("card_id").notNull(), // e.g. 'c001'
  quantity: integer("quantity").notNull().default(0),
});

export const insertUserCardSchema = createInsertSchema(userCards).omit({ id: true });
export type InsertUserCard = z.infer<typeof insertUserCardSchema>;
export type UserCard = typeof userCards.$inferSelect;

// Quest history (任務完成記錄)
export const questHistory = sqliteTable("quest_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  questId: text("quest_id").notNull(),
  type: text("type").notNull(),
  hoursSpent: integer("hours_spent").notNull().default(0),
  rating: integer("rating").notNull().default(5),
  reward: integer("reward").notNull().default(0),
  completedAt: text("completed_at").notNull(),
});

export const insertQuestHistorySchema = createInsertSchema(questHistory).omit({ id: true });
export type InsertQuestHistory = z.infer<typeof insertQuestHistorySchema>;
export type QuestHistory = typeof questHistory.$inferSelect;

// Daily draw log (每日抽卡記錄)
export const dailyDraws = sqliteTable("daily_draws", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  cardId: text("card_id").notNull(),
  drawnAt: text("drawn_at").notNull(), // date string YYYY-MM-DD
});

export const insertDailyDrawSchema = createInsertSchema(dailyDraws).omit({ id: true });
export type InsertDailyDraw = z.infer<typeof insertDailyDrawSchema>;
export type DailyDraw = typeof dailyDraws.$inferSelect;

// Quest acceptances (已接任務)
export const acceptedQuests = sqliteTable("accepted_quests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  questId: text("quest_id").notNull(),
  acceptedAt: text("accepted_at").notNull(),
  status: text("status").notNull().default("active"), // 'active' | 'completed' | 'expired'
});

export const insertAcceptedQuestSchema = createInsertSchema(acceptedQuests).omit({ id: true });
export type InsertAcceptedQuest = z.infer<typeof insertAcceptedQuestSchema>;
export type AcceptedQuest = typeof acceptedQuests.$inferSelect;
