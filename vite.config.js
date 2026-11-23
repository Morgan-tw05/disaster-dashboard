import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 設為 './'，部署到 GitHub Pages（網址帶有 repo 名稱）時資源路徑才不會跑掉
export default defineConfig({
  plugins: [vue()],
  base: './',
})
