<script setup>
import { computed } from 'vue'
import { LAYERS, STATUS } from '../config'

const props = defineProps({
  stations: { type: Array, default: () => [] },
  layers: { type: Object, required: true },
  selectedId: { type: String, default: null },
  notices: { type: Array, default: () => [] },
})
const emit = defineEmits(['toggle', 'select'])

const countByType = computed(() => {
  const c = Object.fromEntries(Object.keys(LAYERS).map((k) => [k, 0]))
  for (const s of props.stations) {
    if (s.type in c) c[s.type]++
  }
  return c
})

// 需關注 = 警戒或注意，且所屬圖層目前是開啟的；警戒排在前面
const attentionList = computed(() =>
  props.stations
    .filter((s) => (s.status === 'alert' || s.status === 'watch') && props.layers[s.type])
    .sort((a, b) => STATUS[a.status].order - STATUS[b.status].order),
)
</script>

<template>
  <aside class="panel">
    <section>
      <h2>圖層</h2>
      <label v-for="(meta, key) in LAYERS" :key="key" class="layer">
        <input type="checkbox" :checked="layers[key]" @change="emit('toggle', key)" />
        <span class="layer__glyph">{{ meta.glyph }}</span>
        <span class="layer__name">{{ meta.label }}</span>
        <span class="layer__count">{{ countByType[key] }}</span>
      </label>
    </section>

    <section>
      <h2>圖例</h2>
      <ul class="legend">
        <li v-for="(meta, key) in STATUS" :key="key">
          <span :class="['dot', `dot--${key}`]"></span>{{ meta.label }}
        </li>
      </ul>
    </section>

    <section>
      <h2>需關注測站（{{ attentionList.length }}）</h2>
      <p v-if="!attentionList.length" class="empty">目前沒有警戒或注意中的測站。</p>
      <ul v-else class="attention">
        <li v-for="s in attentionList" :key="s.id">
          <button type="button" :class="{ 'is-active': s.id === selectedId }" @click="emit('select', s.id)">
            <span :class="['dot', `dot--${s.status}`]"></span>
            <span class="attention__name">{{ s.name }}</span>
            <span class="attention__value">{{ s.value }} {{ s.unit }}</span>
          </button>
        </li>
      </ul>
    </section>

    <section v-if="notices.length">
      <h2>資料提醒</h2>
      <ul class="notices">
        <li v-for="(text, i) in notices" :key="i">{{ text }}</li>
      </ul>
    </section>
  </aside>
</template>

<style scoped>
section + section {
  margin-top: 24px;
}
h2 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
}
.layer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 6px;
  cursor: pointer;
}
.layer:hover {
  background: var(--hover);
}
.layer input {
  width: 16px;
  height: 16px;
  accent-color: var(--navy);
}
.layer__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--navy);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.layer__name {
  flex: 1;
}
.layer__count {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}
.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.attention {
  margin: 0;
  padding: 0;
  list-style: none;
}
.attention button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.attention button:hover {
  background: var(--hover);
}
.attention button.is-active {
  border-color: var(--navy);
  background: var(--hover);
}
.attention__name {
  flex: 1;
  min-width: 0;
}
.attention__value {
  color: var(--muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.empty {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
.notices {
  margin: 0;
  padding: 0 0 0 18px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}
.notices li + li {
  margin-top: 6px;
}
</style>
