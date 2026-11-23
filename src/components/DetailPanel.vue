<script setup>
import { computed } from 'vue'
import { LAYERS, STATUS } from '../config'
import { formatTime } from '../utils'
import Sparkline from './Sparkline.vue'

const props = defineProps({
  station: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const layerLabel = computed(() => (props.station ? LAYERS[props.station.type]?.label ?? '' : ''))
const statusKey = computed(() => (props.station && props.station.status in STATUS ? props.station.status : 'offline'))
const hasTrend = computed(() => Array.isArray(props.station?.trend) && props.station.trend.length > 1)
</script>

<template>
  <aside class="panel">
    <div v-if="!station" class="placeholder">
      <h2>測站詳情</h2>
      <p>點選地圖上的測站標記，或從左側「需關注測站」選一個，這裡會顯示最新數值與趨勢。</p>
    </div>

    <article v-else>
      <header class="head">
        <div>
          <p class="head__sub">{{ layerLabel }}｜{{ station.county }}</p>
          <h2>{{ station.name }}</h2>
        </div>
        <button class="close" type="button" aria-label="關閉詳情" @click="emit('close')">×</button>
      </header>

      <p class="status">
        <span :class="['badge', `badge--${statusKey}`]">{{ STATUS[statusKey].label }}</span>
        <span v-if="station.sample" class="badge badge--sample">示範資料</span>
      </p>

      <template v-if="station.type !== 'cctv'">
        <p class="value">
          <strong>{{ station.value ?? '—' }}</strong>
          <span>{{ station.unit }}</span>
        </p>
        <Sparkline v-if="hasTrend" :values="station.trend" :color="`var(--st-${statusKey})`" />
        <p v-if="hasTrend" class="caption">最近 {{ station.trend.length }} 筆資料</p>
        <p v-if="statusKey === 'offline'" class="hint">這個測站的資料已過期或缺漏，數值僅供參考。</p>
        <p v-else-if="statusKey === 'unknown'" class="hint">這個測站沒有設定警戒水位，無法判斷狀態。</p>
      </template>

      <template v-else>
        <div class="cctv">
          <img v-if="station.imageUrl && statusKey !== 'offline'" :src="station.imageUrl" :alt="`${station.name} 即時影像`" />
          <p v-else-if="statusKey === 'offline'">這支攝影機目前離線，無法顯示影像。</p>
          <p v-else>影像來源尚未串接。</p>
        </div>
      </template>

      <dl class="meta">
        <dt>更新時間</dt>
        <dd>{{ formatTime(station.updateTime) }}</dd>
        <dt>測站代碼</dt>
        <dd>{{ station.id }}</dd>
        <dt>座標</dt>
        <dd>{{ station.lat }}, {{ station.lng }}</dd>
      </dl>
    </article>
  </aside>
</template>

<style scoped>
h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
}
.placeholder h2 {
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--muted);
}
.placeholder p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.head__sub {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 13px;
}
.close {
  flex: none;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--muted);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.close:hover {
  background: var(--hover);
}
.status {
  margin: 12px 0 0;
}
.badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
}
.badge--normal { background: #dff5e9; color: #0f6b3d; }
.badge--watch { background: #fff0c2; color: #6e5000; }
.badge--alert { background: #fde0df; color: #9c1f1c; }
.badge--offline { background: #e8ebef; color: #4b5563; }
.badge--unknown { background: #e0ebf7; color: #234a73; }
.badge--sample {
  margin-left: 8px;
  border: 1px solid #c9a227;
  background: #fff;
  color: #6e5000;
  font-weight: 400;
}
.hint {
  margin: 12px 0 0;
  padding: 8px 12px;
  border-left: 3px solid var(--line);
  background: var(--hover);
  color: var(--muted);
  font-size: 13px;
}
.value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 16px 0 8px;
}
.value strong {
  font-size: 44px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.value span {
  color: var(--muted);
}
.caption {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.cctv {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  margin-top: 16px;
  border-radius: 6px;
  background: #e8ecf0;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
  overflow: hidden;
}
.cctv img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cctv p {
  margin: 0;
  padding: 0 16px;
}
.meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  margin: 20px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 14px;
}
.meta dt {
  color: var(--muted);
}
.meta dd {
  margin: 0;
  word-break: break-all;
}
</style>
