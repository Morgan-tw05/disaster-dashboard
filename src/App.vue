<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { fetchStations } from './api/stations'
import { REFRESH_MS } from './config'
import AppHeader from './components/AppHeader.vue'
import LayerPanel from './components/LayerPanel.vue'
import MapView from './components/MapView.vue'
import DetailPanel from './components/DetailPanel.vue'

const stations = ref([])
const notices = ref([])
const loading = ref(true)
const error = ref('')
const selectedId = ref(null)
const visibleLayers = reactive({ water: true, rain: true, cctv: true })

const visibleStations = computed(() => stations.value.filter((s) => visibleLayers[s.type]))
const selectedStation = computed(() => stations.value.find((s) => s.id === selectedId.value) ?? null)

const latestUpdate = computed(() => {
  const times = stations.value.map((s) => Date.parse(s.updateTime)).filter(Number.isFinite)
  return times.length ? new Date(Math.max(...times)).toISOString() : ''
})

// 有示範資料時，在標題旁提醒，避免有人把假資料當成真的
const sampleNote = computed(() => {
  const n = stations.value.filter((s) => s.sample).length
  if (!n) return ''
  return n === stations.value.length ? '示範資料，非即時資訊' : '部分為示範資料'
})

async function load() {
  try {
    const result = await fetchStations()
    stations.value = result.stations
    notices.value = result.notices
    error.value = ''
  } catch (e) {
    error.value = e.message || '無法取得測站資料，請稍後再試'
  } finally {
    loading.value = false
  }
}

function toggleLayer(key) {
  visibleLayers[key] = !visibleLayers[key]
}

// 圖層被關掉時，如果目前選取的測站屬於該圖層，就取消選取
watch(visibleLayers, () => {
  if (selectedStation.value && !visibleLayers[selectedStation.value.type]) {
    selectedId.value = null
  }
})

let timer = null
onMounted(() => {
  load()
  timer = setInterval(load, REFRESH_MS)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="app">
    <AppHeader :stations="stations" :latest-update="latestUpdate" :sample-note="sampleNote" />

    <main class="layout">
      <LayerPanel
        class="layout__side"
        :stations="stations"
        :layers="visibleLayers"
        :selected-id="selectedId"
        :notices="notices"
        @toggle="toggleLayer"
        @select="selectedId = $event"
      />

      <section class="layout__map" aria-label="地圖">
        <MapView :stations="visibleStations" :selected-id="selectedId" @select="selectedId = $event" />
        <div v-if="loading" class="map-note">正在載入測站資料…</div>
        <div v-else-if="error" class="map-note map-note--error">
          <p>{{ error }}</p>
          <button type="button" @click="load">重新載入</button>
        </div>
      </section>

      <DetailPanel class="layout__detail" :station="selectedStation" @close="selectedId = null" />
    </main>
  </div>
</template>
