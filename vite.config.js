import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const LEGAL_KEYS = ['VITE_LEGAL_NAME', 'VITE_LEGAL_ADDRESS', 'VITE_LEGAL_EMAIL']

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // Ein öffentlicher Betrieb mit Accounts braucht Impressum und Datenschutzerklärung mit echten Angaben.
  // Ohne Firebase (lokaler Modus) ist das nicht nötig.
  if (command === 'build' && env.VITE_FIREBASE_API_KEY) {
    const missing = LEGAL_KEYS.filter((key) => !env[key]?.trim())
    if (missing.length) {
      throw new Error(`Angaben für Impressum und Datenschutzerklärung fehlen in .env.local: ${missing.join(', ')}`)
    }
  }

  return { plugins: [react()] }
})
