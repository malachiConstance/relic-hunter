import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function savePathsPlugin() {
  return {
    name: 'save-sacred-paths',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/save-paths', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { content } = JSON.parse(body)
            const filePath = path.resolve(__dirname, 'src/data/sacredPaths.ts')
            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(e) }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), savePathsPlugin()],
})
