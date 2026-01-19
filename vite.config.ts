import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Ищем ключ во всех возможных переменных
      'process.env.API_KEY': JSON.stringify(
        env.API_KEY || 
        env.VITE_API_KEY || 
        env.OPENAI_API_KEY || 
        env.VITE_OPENAI_API_KEY
      ),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_KEY': JSON.stringify(env.VITE_SUPABASE_KEY),
      'process.env.UNSPLASH_ACCESS_KEY': JSON.stringify(env.UNSPLASH_ACCESS_KEY || env.VITE_UNSPLASH_ACCESS_KEY),
    },
    server: {
      port: 3000
    }
  }
})