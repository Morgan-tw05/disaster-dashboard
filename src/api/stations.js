import sample from '../data/stations.sample.json'
import stationMeta from '../data/station-meta.json'
import { adaptWaterLevel } from './adapters'
import { STALE_MINUTES } from '../config'

// 資料來源模式，在 .env 設定 VITE_DATA_MODE：
//   sample      全部使用示範資料（預設）
//   water-level 水位用 PG2 目前的 GET /water-level（需 station-meta.json 補座標），雨量與 CCTV 仍是示範資料
//   stations    使用 PG2 之後提供的 GET /stations（已合併好、格式與示範資料相同）
const MODE = import.meta.env.VITE_DATA_MODE || 'sample'
const BASE = import.meta.env.VITE_API_BASE_URL || ''

const markSample = (list) => list.map((s) => ({ ...s, sample: true }))

async function getJson(path) {
  let res
  try {
    res = await fetch(`${BASE}${path}`)
  } catch {
    throw new Error('連不到後端 API。請確認後端已啟動，並已開啟 CORS。')
  }
  if (!res.ok) throw new Error(`後端回應錯誤（HTTP ${res.status}）`)
  return res.json()
}

// 回傳 { stations: 測站陣列, notices: 要提醒使用者的訊息 }
export async function fetchStations() {
  if (MODE === 'stations') {
    return { stations: await getJson('/stations'), notices: [] }
  }

  if (MODE === 'water-level') {
    const rows = await getJson('/water-level')
    const { stations, skipped, offline, unknown } = adaptWaterLevel(rows, stationMeta)
    const notices = []
    if (skipped) {
      notices.push(`${skipped} 筆水位資料缺少測站座標，沒有顯示在地圖上。請補齊 src/data/station-meta.json，或改由後端提供 /stations。`)
    }
    if (offline) {
      notices.push(`${offline} 個水位站超過 ${STALE_MINUTES} 分鐘沒更新或沒有數值，已標示為離線。`)
    }
    if (unknown) {
      notices.push(`${unknown} 個水位站沒有警戒水位，狀態標示為「未設警戒值」。`)
    }
    notices.push('雨量站與 CCTV 目前仍是示範資料。')
    const demo = markSample(sample.filter((s) => s.type !== 'water'))
    return { stations: [...stations, ...demo], notices }
  }

  return { stations: markSample(sample), notices: [] }
}
