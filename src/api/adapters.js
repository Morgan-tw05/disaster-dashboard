import { STALE_MINUTES } from '../config'

// 水利署的時間字串沒有時區（例如 2026-11-20T15:50:00），視為台灣時間
export function parseTaiwanTime(text) {
  if (!text) return null
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(text)
  const d = new Date(hasZone ? text : `${text}+08:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

// 依警戒水位判斷狀態。
// 目前的對應規則（待 SA 確認）：三級警戒 → 注意；二級、一級警戒 → 警戒；
// 三級都沒設定的測站回傳 unknown（無法判斷，不能說它正常）。
export function judgeStatus(level, alertLevels) {
  const { l1, l2, l3 } = alertLevels ?? {}
  const alertAt = [l1, l2].filter(isNum)
  if (alertAt.length && level >= Math.min(...alertAt)) return 'alert'
  if (isNum(l3) && level >= l3) return 'watch'
  if ([l1, l2, l3].some(isNum)) return 'normal'
  return 'unknown'
}

// 把 PG2 目前 /water-level 的資料（station_id、datetime、water_level）
// 轉成前端使用的測站格式。名稱、座標、警戒水位來自 station-meta.json。
export function adaptWaterLevel(rows, meta, now = Date.now()) {
  const stations = []
  let skipped = 0 // 沒有座標，無法放到地圖上
  let offline = 0 // 資料過期或缺漏
  let unknown = 0 // 沒有警戒水位

  for (const row of rows) {
    const m = meta[row.station_id]
    if (!m || !isNum(m.lat) || !isNum(m.lng)) {
      skipped++
      continue
    }

    const level = Number.parseFloat(row.water_level)
    const hasLevel = Number.isFinite(level)
    const time = parseTaiwanTime(row.datetime)
    const stale = !time || now - time.getTime() > STALE_MINUTES * 60 * 1000

    let status
    if (!hasLevel || stale) {
      status = 'offline'
      offline++
    } else {
      status = judgeStatus(level, m.alertLevels)
      if (status === 'unknown') unknown++
    }

    stations.push({
      id: row.station_id,
      type: 'water',
      name: m.name || row.station_id,
      county: m.county || '',
      lat: m.lat,
      lng: m.lng,
      value: hasLevel ? level : null,
      unit: 'm',
      status,
      updateTime: time ? time.toISOString() : '',
    })
  }

  return { stations, skipped, offline, unknown }
}
