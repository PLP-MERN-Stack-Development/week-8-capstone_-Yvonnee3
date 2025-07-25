import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure this is set correctly for your deployment
  
  server: {
    host: '0.0.0.0', // Allow all hosts (LAN, Live Share tunnel)
    strictPort: true, // Ensure port 5173 is used
  }
})
