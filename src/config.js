// 圖層類型：key 要和資料裡的 type 欄位一致
export const LAYERS = {
  water: { label: '水位站', glyph: '水' },
  rain: { label: '雨量站', glyph: '雨' },
  cctv: { label: 'CCTV', glyph: '影' },
}

// 測站狀態：order 越小越緊急
export const STATUS = {
  alert: { label: '警戒', order: 0 },
  watch: { label: '注意', order: 1 },
  normal: { label: '正常', order: 2 },
  unknown: { label: '未設警戒值', order: 3 },
  offline: { label: '離線', order: 4 },
}

// 地圖初始範圍（涵蓋台灣本島）
export const MAP_BOUNDS = [
  [21.8, 119.9],
  [25.4, 122.1],
]

// 底圖。若要改用國土測繪中心圖磚，替換 url 與 attribution 即可（見 README）
export const TILE = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 貢獻者',
}

// 自動重新取得資料的間隔（毫秒）
export const REFRESH_MS = 5 * 60 * 1000

// 水位站超過這個分鐘數沒更新就視為離線
// （水利署即時水位最快每 10 分鐘更新一次，且可能因傳輸中斷而停更）
export const STALE_MINUTES = 60
