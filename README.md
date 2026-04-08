# Quest Hunter — 賞金獵人任務平台

RPG 風格的自由職業任務管理平台，以遊戲化機制激勵用戶完成各類任務。

## 功能概覽

- **任務大陸 (Dashboard)** — 六大區域、每日任務、AI 推薦
- **任務看板 (Quest Board)** — 接受/完成任務，AI 智能匹配
- **卡牌圖鑑 (Card Collection)** — 100 張卡牌、每日抽卡系統、組合效果
- **獵人檔案 (Profile)** — 能力雷達圖、成長來源分析

## 技術棧

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: SQLite (better-sqlite3) + Drizzle ORM
- **Build**: Vite + esbuild

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器（前後端同時）
npm run dev
```

開發服務器預設在 `http://localhost:5000`。

## Demo 模式

所有頁面內建靜態 fallback 數據。即使後端 API 不可用，前端仍能完整顯示所有內容。

## Railway 部署

### 方法一：自動部署

1. 在 Railway 新建項目，連接 GitHub repo
2. Railway 會自動讀取 `railway.toml` 配置
3. 設定環境變量（可選）：
   - `DATABASE_PATH` — SQLite 路徑（預設 `data.db`）
   - `SESSION_SECRET` — Session 密鑰
4. 部署會自動執行 `npm run build` 並啟動

### 方法二：手動部署

```bash
# 構建
npm run build

# 啟動（生產環境）
NODE_ENV=production PORT=8080 node dist/index.cjs
```

### 環境變量

| 變量 | 說明 | 預設值 |
|------|------|--------|
| `PORT` | 服務端口 | `5000` |
| `NODE_ENV` | 環境 | `development` |
| `DATABASE_PATH` | SQLite 文件路徑 | `data.db` |
| `SESSION_SECRET` | Session 密鑰 | — |
| `VITE_API_URL` | 前端 API 地址（分離部署時使用） | — |

### 健康檢查

```
GET /api/health → { "status": "ok" }
```

## 項目結構

```
quest-hunter/
├── client/              # React 前端
│   └── src/
│       ├── pages/       # 頁面組件
│       ├── components/  # UI 組件
│       └── lib/         # 工具函數 + 靜態數據
├── server/              # Express 後端
│   ├── index.ts         # 入口
│   ├── routes.ts        # API 路由
│   └── storage.ts       # 數據存儲層
├── shared/              # 前後端共用類型
├── railway.toml         # Railway 部署配置
├── Procfile             # Heroku 兼容啟動命令
└── .env.example         # 環境變量範本
```
