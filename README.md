# 多功能防災情資一覽面板（前端雛型）

水資源實作專題的前端雛型，負責：地圖畫面、圖層切換、測站詳情面板。
技術：Vue 3 + Vite + Leaflet。目前使用**示範用假資料**，畫面上會標示「示範資料，非即時資訊」。

## 快速開始

需要 Node.js 18 以上。

```bash
npm install
npm run dev      # 開發模式，瀏覽器開啟終端機顯示的網址
npm run build    # 建置到 dist/
```

## 目前功能

- 台灣地圖，水位站（水）、雨量站（雨）、CCTV（影）三種標記
- 標記顏色代表狀態：正常、注意、警戒、離線；警戒標記會有呼吸光圈
- 左側可開關圖層，並列出需關注（警戒、注意）的測站
- 點標記或清單項目，右側顯示數值、趨勢圖、更新時間；CCTV 顯示影像區塊
- 頂部顯示各狀態的測站數量與資料更新時間
- 手機版：地圖在上，詳情與圖層往下排

## 專案結構

```
src/
  App.vue                 狀態管理（測站、圖層開關、選取的測站）
  config.js               圖層、狀態、地圖範圍、底圖設定
  api/stations.js         取得測站資料（依 VITE_DATA_MODE 切換示範資料或後端）
  api/adapters.js         把 PG2 的 /water-level 轉成前端格式、依警戒水位判斷狀態
  data/stations.sample.json   示範資料
  data/station-meta.json      水位站的名稱、座標、警戒水位（待補）
  components/
    AppHeader.vue         標題、狀態統計、更新時間
    LayerPanel.vue        圖層開關、圖例、需關注測站清單
    MapView.vue           Leaflet 地圖與標記
    DetailPanel.vue       測站詳情
    Sparkline.vue         簡易趨勢折線圖（純 SVG，沒有額外套件）
  style.css               全域樣式與標記樣式
```

## 資料格式（與 PG2、SA 約定）

`fetchStations()` 回傳測站陣列，每筆欄位如下：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string | 測站代碼，不可重複 |
| `type` | `water` \| `rain` \| `cctv` | 測站類型 |
| `name` | string | 顯示名稱 |
| `county` | string | 縣市 |
| `lat`, `lng` | number | 緯度、經度 |
| `value` | number \| null | 目前數值（CCTV 為 null） |
| `unit` | string | 單位，例如 `m`、`mm/hr` |
| `status` | `normal` \| `watch` \| `alert` \| `unknown` \| `offline` | 狀態。`unknown` 表示沒有警戒值、無法判斷；`offline` 表示資料過期或缺漏 |
| `updateTime` | string | ISO 8601 時間，例如 `2026-11-23T14:10:00+08:00` |
| `trend` | number[]（選填） | 近期數值，由舊到新，用於趨勢圖 |
| `imageUrl` | string \| null（選填） | CCTV 影像網址 |

欄位如果要調整，請和 PG2 一起改，並同步更新 `stations.sample.json` 與這份文件。

## 接上後端 API

用 `.env`（由 `.env.example` 複製）的 `VITE_DATA_MODE` 切換資料來源，改完要重開 `npm run dev`：

| 模式 | 說明 |
|---|---|
| `sample` | 全部是示範資料（預設） |
| `water-level` | 水位用 PG2 目前的 `GET /water-level`，雨量與 CCTV 仍是示範資料 |
| `stations` | 用 PG2 之後提供的 `GET /stations`（已合併好，格式同上表），建議最後走這條 |

同時填 `VITE_API_BASE_URL`（FastAPI 預設 `http://localhost:8000`）。

### `water-level` 模式的限制

PG2 目前的 `/water-level` 只有 `station_id`、`datetime`、`water_level`，沒有名稱和座標，所以：

- 需要在 `src/data/station-meta.json` 補每個測站的基本資料，沒有座標的測站不會顯示在地圖上，左側「資料提醒」會告訴你有幾筆被略過
- 狀態由前端依警戒水位判斷，規則在 `src/api/adapters.js` 的 `judgeStatus`：三級警戒 → 注意，二級或一級警戒 → 警戒，都沒設定 → 未設警戒值（待 SA 確認對應是否正確）
- 超過 `STALE_MINUTES`（`src/config.js`，預設 60 分鐘）沒更新，或沒有數值，標示為離線
- 時間字串沒有時區，前端視為台灣時間
- 即時水位來源是未經檢核的原始資料，可能停更或異常，請不要當成正式警報

### 測站基本資料（station-meta.json）

```json
{
  "測站代碼": {
    "name": "測站名稱",
    "county": "縣市",
    "lat": 24.0,
    "lng": 121.0,
    "alertLevels": { "l1": 10, "l2": 8, "l3": 6 }
  }
}
```

`alertLevels` 單位是公尺，沒有的等級可以省略。資料可從水利署「河川水位測站站況」資料集取得（含站名與一到三級警戒水位；座標欄位格式請先確認，可能需要由 TM2 轉成經緯度）。
測站很多時手動維護不實際，比較好的做法是請 PG2 在後端合併後提供 `/stations`。

### 後端要開 CORS

瀏覽器會擋住不同網址之間的請求，PG2 的 FastAPI 需要加上：

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["GET"])
```

也可以改在 `vite.config.js` 設定 `server.proxy`，由開發伺服器轉發。

## 更換底圖

預設使用 OpenStreetMap。若想換成國土測繪中心（NLSC）的電子地圖圖磚，修改 `src/config.js` 的 `TILE`。
圖磚網址格式與使用條款請到 NLSC 官方網站確認後再替換，並更新 `attribution`。

## 上傳到 GitHub

```bash
git init
git add .
git commit -m "feat: 防災情資面板前端雛型"
git branch -M main
git remote add origin https://github.com/<帳號>/<repo 名稱>.git
git push -u origin main
```

如果組內已經有共用 repo，建議先 clone 下來，把檔案複製進去，開一個分支（例如 `pg1/frontend-prototype`）推上去，再發 Pull Request 給 PM 或組員確認。

## 發布到 GitHub Pages（選用）

專案內已附 `.github/workflows/deploy.yml`。到 repo 的 Settings > Pages，把 Source 設為 GitHub Actions，之後 push 到 `main` 就會自動建置並發布。

## 之後可以做的事

- 縣市篩選、狀態篩選
- 水位、雨量的歷史曲線圖（可改用 Chart.js 或 ECharts）
- CCTV 影像串流（等 SA 確認資料來源）
- 警戒值門檻線與說明
- 底圖切換、圖層透明度
