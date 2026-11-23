<script setup>
import { computed } from 'vue'
import { STATUS } from '../config'
import { formatTime } from '../utils'

const props = defineProps({
  stations: { type: Array, default: () => [] },
  latestUpdate: { type: String, default: '' },
  sampleNote: { type: String, default: '' },
})

const counts = computed(() => {
  const c = { alert: 0, watch: 0, normal: 0, unknown: 0, offline: 0 }
  for (const s of props.stations) {
    if (s.status in c) c[s.status]++
  }
  return c
})

// 警戒、注意、正常永遠顯示；未設警戒值、離線只在有測站時顯示
const chips = computed(() =>
  Object.entries(counts.value).filter(([key, n]) => n > 0 || ['alert', 'watch', 'normal'].includes(key)),
)
</script>

<template>
  <header class="header">
    <div class="header__title">
      <h1>多功能防災情資一覽面板</h1>
      <span v-if="sampleNote" class="tag-sample">{{ sampleNote }}</span>
    </div>

    <ul class="header__summary" aria-label="測站狀態統計">
      <li v-for="[key, n] in chips" :key="key" class="chip">
        <span :class="['dot', `dot--${key}`]"></span>
        {{ STATUS[key].label }}
        <strong>{{ n }}</strong>
      </li>
    </ul>

    <p class="header__time">資料更新時間：{{ latestUpdate ? formatTime(latestUpdate) : '—' }}</p>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 24px;
  padding: 10px 20px;
  background: var(--navy);
  color: #fff;
}
.header__title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
h1 {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.tag-sample {
  padding: 2px 10px;
  border: 1px solid var(--st-watch);
  border-radius: 4px;
  color: var(--st-watch);
  font-size: 12px;
}
.header__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
}
.chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
}
.chip strong {
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}
.header__time {
  margin: 0;
  color: #b8c7d6;
  font-size: 13px;
}
@media (max-width: 960px) {
  .header__summary {
    margin-left: 0;
  }
}
</style>
