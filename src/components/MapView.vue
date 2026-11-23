<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LAYERS, MAP_BOUNDS, STATUS, TILE } from '../config'

const props = defineProps({
  stations: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['select'])

const el = ref(null)

// Leaflet 物件不要放進 ref（避免被 Vue 轉成 Proxy），用一般變數保存
let map = null
let markerLayer = null
let resizeObserver = null
const markers = new Map()

function pinIcon(station, selected) {
  const status = station.status in STATUS ? station.status : 'offline'
  const glyph = LAYERS[station.type]?.glyph ?? '?'
  const cls = `pin pin--${status}${selected ? ' pin--selected' : ''}`
  return L.divIcon({
    className: 'pin-wrap',
    html: `<span class="${cls}">${glyph}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

function renderMarkers() {
  markerLayer.clearLayers()
  markers.clear()
  for (const s of props.stations) {
    const marker = L.marker([s.lat, s.lng], {
      icon: pinIcon(s, s.id === props.selectedId),
      title: s.name,
      riseOnHover: true,
    })
    marker.on('click', () => emit('select', s.id))
    marker.addTo(markerLayer)
    markers.set(s.id, marker)
  }
}

function refreshIcon(id, selected) {
  if (!id) return
  const marker = markers.get(id)
  const station = props.stations.find((s) => s.id === id)
  if (!marker || !station) return
  marker.setIcon(pinIcon(station, selected))
  marker.setZIndexOffset(selected ? 1000 : 0)
}

watch(() => props.stations, renderMarkers)

watch(
  () => props.selectedId,
  (id, oldId) => {
    refreshIcon(oldId, false)
    refreshIcon(id, true)
    const station = props.stations.find((s) => s.id === id)
    if (station) map.panTo([station.lat, station.lng])
  },
)

onMounted(() => {
  map = L.map(el.value)
  L.tileLayer(TILE.url, { attribution: TILE.attribution, maxZoom: 19 }).addTo(map)
  map.fitBounds(MAP_BOUNDS)
  markerLayer = L.layerGroup().addTo(map)
  renderMarkers()

  // 版面尺寸改變（例如手機轉向）時，通知 Leaflet 重新計算大小
  resizeObserver = new ResizeObserver(() => map.invalidateSize())
  resizeObserver.observe(el.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="el" class="map"></div>
</template>

<style scoped>
.map {
  position: absolute;
  inset: 0;
}
</style>
