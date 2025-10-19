import fs from 'fs'
import path from 'path'
import type { Application, Request, Response } from 'express'
import type { Pool } from 'pg'

const LOG_DIR = path.join(process.cwd(), 'logs')

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
}

function nowStamp() {
  const d = new Date()
  const p = (n: number, l = 2) => String(n).padStart(l, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function append(file: string, line: string) {
  ensureLogDir()
  fs.appendFile(path.join(LOG_DIR, file), line + '\n', (err) => {
    if (err) console.error('[LOG][WRITE][ERROR]', err)
  })
}

/** HTTP リクエスト全体の処理時間を http.log へ */
export function initHttpLogger(app: Application) {
  app.use((req: Request, res: Response, next) => {
    const t0 = process.hrtime.bigint()
    res.on('finish', () => {
      const t1 = process.hrtime.bigint()
      const ms = Number(t1 - t0) / 1e6
      append('http.log', `[${nowStamp()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${ms.toFixed(1)} ms`)
    })
    next()
  })
}

/** Pool.query をパッチして SQL と実行時間を sql.log へ */
export function initSqlLogger(pool: Pool) {
  const originalQuery = pool.query.bind(pool) as any
  pool.query = async (...args: any[]) => {
    const text: string =
      typeof args[0] === 'string' ? args[0] :
      (args[0]?.text ? String(args[0].text) : '')
    const params =
      Array.isArray(args[1]) ? args[1] :
      (args[0]?.values ? args[0].values : undefined)

    const sql = (text || '').replace(/\s+/g, ' ').trim()
    const t0 = process.hrtime.bigint()
    try {
      const result = await originalQuery(...args)
      const t1 = process.hrtime.bigint()
      const ms = Number(t1 - t0) / 1e6
      append('sql.log', `[${nowStamp()}] ${ms.toFixed(1)} ms | ${sql}${params ? ` | params=${JSON.stringify(params)}` : ''}`)
      return result
    } catch (e: any) {
      const t1 = process.hrtime.bigint()
      const ms = Number(t1 - t0) / 1e6
      append('sql.log', `[${nowStamp()}][ERROR] ${ms.toFixed(1)} ms | ${sql}${params ? ` | params=${JSON.stringify(params)}` : ''} | err=${e?.message ?? e}`)
      throw e
    }
  }
}

/** 画面描画完了ログ用のエンドポイント（view.log へ） */
export function initViewLogEndpoint(app: Application) {
  app.post('/api/logs/view', (req: Request, res: Response) => {
    try {
      const { path, name, elapsedMs, extra } = req.body || {}
      append('view.log',
        `[${nowStamp()}] VIEW ${name ?? ''} ${path ?? ''} in ${Number(elapsedMs).toFixed(1)} ms${extra ? ` | extra=${JSON.stringify(extra)}` : ''}`
      )
      res.json({ ok: true })
    } catch (e: any) {
      append('view.log', `[${nowStamp()}][ERROR] ${e?.message ?? e}`)
      res.status(500).json({ error: e?.message ?? 'log error' })
    }
  })
}

/** まとめ初期化 */
export function initAllLoggers(app: Application, pool: Pool) {
  ensureLogDir()
  initHttpLogger(app)
  initSqlLogger(pool)
  initViewLogEndpoint(app)
}
