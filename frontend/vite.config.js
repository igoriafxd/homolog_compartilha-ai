import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Adiciona esta linha para usar o novo JSX transform
      jsxRuntime: 'automatic'
    })
  ],
})
