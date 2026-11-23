<script setup>
import { computed } from 'vue'

const props = defineProps({
  values: { type: Array, required: true },
  color: { type: String, default: 'currentColor' },
})

const W = 260
const H = 72
const PAD = 8

const points = computed(() => {
  const v = props.values
  if (v.length < 2) return []
  const min = Math.min(...v)
  const max = Math.max(...v)
  const span = max - min || 1
  return v.map((val, i) => [
    PAD + (i / (v.length - 1)) * (W - PAD * 2),
    H - PAD - ((val - min) / span) * (H - PAD * 2),
  ])
})

const polyline = computed(() => points.value.map((p) => p.join(',')).join(' '))
const last = computed(() => points.value[points.value.length - 1])
</script>

<template>
  <svg v-if="points.length" class="spark" :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="近期數值趨勢">
    <polyline
      :points="polyline"
      fill="none"
      stroke-width="2.5"
      stroke-linejoin="round"
      stroke-linecap="round"
      :style="{ stroke: color }"
    />
    <circle :cx="last[0]" :cy="last[1]" r="4" :style="{ fill: color }" />
  </svg>
</template>

<style scoped>
.spark {
  display: block;
  width: 100%;
  height: auto;
}
</style>
