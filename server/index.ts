import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import cors from 'cors'
import nodemailer from 'nodemailer'
import { initAllLoggers } from './logger'

dotenv.config()

const app = express()

// 必要なら CORS（同一オリジンだけなら外してもよい）
app.use(cors())

// JSON 受け取り
app.use(bodyParser.json())

// --- DB 接続 ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
})

// ★ ロガー初期化（HTTP / SQL / VIEW）
initAllLoggers(app, pool)

// ---- 共通ユーティリティ --------------------------------------------------
const toYmd = (d?: Date | null) =>
  d ? `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}` : null

// ==== Horses ===============================================================
app.get('/api/horses', async (_req: Request, res: Response) => {
  try {
    const sql = `
      SELECT
        h.id, h.name, h.sex, TO_CHAR(h.birth_date, 'YYYY-MM-DD') AS birth_date,
        h.trainer, h.breeder, h.sire, h.dam, h.bloodmare_sire,
        h.training_center_id,
        tc.training_center_name,
        ur.upcoming_race_name,
        TO_CHAR(ur.upcoming_race_date, 'YYYY/MM/DD') AS upcoming_race_date
      FROM horse h
      LEFT JOIN m_training_center tc
             ON tc.training_center_id = h.training_center_id
      LEFT JOIN (
        SELECT e.horse_id,
               r.race_name       AS upcoming_race_name,
               r.race_date       AS upcoming_race_date,
               ROW_NUMBER() OVER (PARTITION BY e.horse_id ORDER BY r.race_date ASC) AS rn
          FROM t_race_entry e
          JOIN t_race r ON r.race_id = e.race_id
         WHERE r.race_date >= CURRENT_DATE
      ) ur ON ur.horse_id = h.id AND ur.rn = 1
      ORDER BY h.name ASC;
    `
    const r = await pool.query(sql)
    res.json(r.rows)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})


app.get('/api/check/horse-name', async (req: Request, res: Response) => {
  const name = (req.query.name || '').toString().trim()
  const excludeId = Number(req.query.excludeId || 0) || null
  if (!name) return res.json({ exists: false })
  try {
    const r = await pool.query(
      `SELECT 1 FROM horse WHERE name = $1 ${excludeId ? 'AND id <> $2' : ''} LIMIT 1`,
      excludeId ? [name, excludeId] : [name]
    )
    res.json({ exists: (r.rowCount || 0) > 0 })
  } catch (e: any) {
    res.json({ exists: false, error: 'server-error'})
  }
})

app.get('/api/horses/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const r = await pool.query(
      `SELECT id, name, sex, TO_CHAR(birth_date,'YYYY-MM-DD') birth_date, trainer, training_center_id,
              owner, breeder, sire, dam, bloodmare_sire, grandsire, memo
         FROM horse WHERE id=$1`, [id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'not found' })
    res.json(r.rows[0])
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/horses', async (req: Request, res: Response) => {
  try {
    const { name, sex, birth_date, trainer, training_center_id, owner, breeder, sire, dam, bloodmare_sire, grandsire, memo } = req.body || {}
    const r = await pool.query(
      `INSERT INTO horse
       (name, sex, birth_date, trainer, training_center_id, owner, breeder, sire, dam, bloodmare_sire, grandsire, memo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [name, sex, birth_date || null, trainer, training_center_id || null, owner, breeder, sire, dam, bloodmare_sire, grandsire, memo]
    )
    res.json({ id: r.rows[0].id })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/horses/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const { name, sex, birth_date, trainer, training_center_id, owner, breeder, sire, dam, bloodmare_sire, grandsire, memo } = req.body || {}
    await pool.query(
      `UPDATE horse
          SET name=$1, sex=$2, birth_date=$3, trainer=$4, training_center_id=$5,
              owner=$6, breeder=$7, sire=$8, dam=$9, bloodmare_sire=$10, grandsire=$11, memo=$12
        WHERE id=$13`,
      [name, sex, birth_date || null, trainer, training_center_id || null, owner, breeder, sire, dam, bloodmare_sire, grandsire, memo, id]
    )
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ==== Trainers =============================================================
app.get('/api/trainers', async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(
      `SELECT t.trainer_id, t.trainer_name, t.trainer_name_kana, t.training_center_id,
              c.training_center_name
         FROM m_trainer t
         LEFT JOIN m_training_center c ON c.training_center_id = t.training_center_id
        ORDER BY t.trainer_name_kana NULLS LAST, t.trainer_name ASC`
    )
    res.json(r.rows)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/check/trainer-name', async (req: Request, res: Response) => {
  const name = (req.query.name || '').toString().trim()
  const excludeId = Number(req.query.excludeId || 0) || null
  if (!name) return res.json({ exists: false })
  try {
    const r = await pool.query(
      `SELECT 1 FROM m_trainer WHERE trainer_name = $1 ${excludeId ? 'AND trainer_id <> $2' : ''} LIMIT 1`,
      excludeId ? [name, excludeId] : [name]
    )
    res.json({ exists: (r.rowCount || 0) > 0 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/trainers/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const r = await pool.query(
      `SELECT trainer_id, trainer_name, trainer_name_kana, training_center_id
         FROM m_trainer WHERE trainer_id=$1`,
      [id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'not found' })
    res.json(r.rows[0])
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/trainers', async (req: Request, res: Response) => {
  try {
    const { trainer_name, trainer_name_kana, training_center_id } = req.body || {}
    const r = await pool.query(
      `INSERT INTO m_trainer (trainer_name, trainer_name_kana, training_center_id)
       VALUES ($1,$2,$3) RETURNING trainer_id`,
      [trainer_name, trainer_name_kana || null, training_center_id || null]
    )
    res.json({ trainer_id: r.rows[0].trainer_id })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/trainers/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const { trainer_name, trainer_name_kana, training_center_id } = req.body || {}
    await pool.query(
      `UPDATE m_trainer SET trainer_name=$1, trainer_name_kana=$2, training_center_id=$3
        WHERE trainer_id=$4`,
      [trainer_name, trainer_name_kana || null, training_center_id || null, id]
    )
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ==== Races ================================================================
app.get('/api/races', async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(
      `SELECT race_id, race_name, race_date, race_cource_id, race_type_id, distance, race_pace, comment
         FROM t_race
        ORDER BY race_date DESC, race_id DESC`
    )
    res.json(r.rows.map(row => ({
      ...row,
      race_date: toYmd(row.race_date),
    })))
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/races/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const r = await pool.query(
      `SELECT race_id, race_name, race_date, race_cource_id, race_type_id, distance, race_pace, comment
         FROM t_race WHERE race_id=$1`, [id]
    )
    if (!r.rowCount) return res.status(404).json({ error: 'not found' })
    const row = r.rows[0]
    row.race_date = toYmd(row.race_date)
    res.json(row)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/races', async (req: Request, res: Response) => {
  try {
    const { race_name, race_date, race_cource_id, race_type_id, distance, race_pace, comment } = req.body || {}
    const r = await pool.query(
      `INSERT INTO t_race (race_name, race_date, race_cource_id, race_type_id, distance, race_pace, comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING race_id`,
      [race_name, race_date || null, race_cource_id, race_type_id, distance, race_pace, comment || null]
    )
    res.json({ race_id: r.rows[0].race_id })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/races/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const { race_name, race_date, race_cource_id, race_type_id, distance, race_pace, comment } = req.body || {}
    await pool.query(
      `UPDATE t_race SET race_name=$1, race_date=$2, race_cource_id=$3, race_type_id=$4, distance=$5, race_pace=$6, comment=$7
        WHERE race_id=$8`,
      [race_name, race_date || null, race_cource_id, race_type_id, distance, race_pace, comment || null, id]
    )
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/races/:id/entries', async (req: Request, res: Response) => {
  try {
    const raceId = Number(req.params.id)

    const rRace = await pool.query(
      `SELECT race_id, race_name, race_date, race_cource_id, race_type_id, distance, comment
         FROM t_race WHERE race_id=$1`, [raceId]
    )
    if (!rRace.rowCount) return res.status(404).json({ error: 'race not found' })
    const race = rRace.rows[0]
    race.race_date = toYmd(race.race_date)

    const rH = await pool.query(
      `SELECT h.id, h.name, h.sex, TO_CHAR(h.birth_date,'YYYY-MM-DD') AS birth_date, h.memo,
              e.grade, e.analysis_comment, e.frame_no, e.horse_no, e.frame_color
         FROM t_race_entry e
         JOIN horse h ON h.id = e.horse_id
        WHERE e.race_id = $1
        ORDER BY e.frame_no NULLS LAST, e.horse_no NULLS LAST, h.name ASC`,
      [raceId]
    )

    res.json({ race, horses: rH.rows })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/race-entries', async (req: Request, res: Response) => {
  try {
    const { race_id, horse_id } = req.body || {}
    await pool.query(
      `INSERT INTO t_race_entry (race_id, horse_id)
       VALUES ($1,$2)
       ON CONFLICT (race_id, horse_id) DO NOTHING`,
      [race_id, horse_id]
    )
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// 部分更新：送られてきた項目だけ UPDATE
app.patch('/api/race-entries', async (req: Request, res: Response) => {
  try {
    const { race_id, horse_id, grade, analysis_comment, frame_no, horse_no, frame_color } = req.body || {}
    if (!race_id || !horse_id) return res.status(400).json({ error: 'race_id & horse_id required' })

    // 動的に SET 句を組み立てる（来ていない項目は触らない）
    const sets: string[] = []
    const params: any[] = [race_id, horse_id]
    let i = 3

    if (Object.prototype.hasOwnProperty.call(req.body, 'grade')) {
      sets.push(`grade = $${i++}`)
      params.push(grade ?? null)
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'analysis_comment')) {
      sets.push(`analysis_comment = $${i++}`)
      params.push((analysis_comment ?? null))
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'frame_no')) {
      sets.push(`frame_no = $${i++}`)
      params.push(frame_no === null || frame_no === '' || frame_no === undefined ? null : Number(frame_no))
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'horse_no')) {
      sets.push(`horse_no = $${i++}`)
      params.push(horse_no === null || horse_no === '' || horse_no === undefined ? null : Number(horse_no))
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'frame_color')) {
      sets.push(`frame_color = $${i++}`)
      params.push(frame_color ?? null)
    }

    if (sets.length === 0) return res.json({ ok: true }) // 何も更新項目なし

    const sql = `UPDATE t_race_entry SET ${sets.join(', ')} WHERE race_id=$1 AND horse_id=$2`
    await pool.query(sql, params)
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})


app.post('/api/races/:id/mail', async (req: Request, res: Response) => {
  try {
    const raceId = Number(req.params.id)

    const rRace = await pool.query(
      `SELECT race_id, race_name, race_date, race_cource_id, race_type_id, distance, comment
         FROM t_race WHERE race_id=$1`, [raceId]
    )
    if (!rRace.rowCount) return res.status(404).json({ error: 'race not found' })
    const race = rRace.rows[0]

    const rH = await pool.query(
      `SELECT h.id, h.name, h.sex, TO_CHAR(h.birth_date,'YYYY-MM-DD') birth_date,
              h.memo, e.grade, e.analysis_comment
         FROM t_race_entry e
         JOIN horse h ON h.id = e.horse_id
        WHERE e.race_id = $1
        ORDER BY e.frame_no NULLS LAST, e.horse_no NULLS LAST, h.name ASC`,
      [raceId]
    )
    const horses = rH.rows

    const courseMap: Record<number, string> = { 1:'札幌',2:'函館',3:'福島',4:'新潟',5:'東京',6:'中山',7:'中京',8:'京都',9:'阪神',10:'小倉' }
    const typeMap: Record<number, string> = { 1:'芝', 2:'ダート', 3:'その他' }
    const sexAge = (sex?: string|null, birth?: string|null) => {
      const y = birth?.match(/^(\d{4})-/)?.[1]
      if (!y) return sex || '—'
      const age = new Date().getFullYear() - Number(y)
      return `${sex ?? ''}${age}`
    }
    const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] as string))

    const header = `${race.race_name}（${toYmd(race.race_date)}｜${courseMap[race.race_cource_id] ?? '#'}｜${typeMap[race.race_type_id] ?? '#'}｜${race.distance}m）`
    const textLines: string[] = []
    textLines.push(header, '', `【出走馬（${horses.length}頭）】`)
    horses.forEach((h: any, i: number) => {
      const ga = h.grade ? ` [${h.grade}]` : ''
      const rc = h.analysis_comment ? ` / レースコメント: ${String(h.analysis_comment).replace(/\s+/g,' ').slice(0,200)}` : ''
      const mm = h.memo ? ` / メモ: ${String(h.memo).replace(/\s+/g,' ').slice(0,200)}` : ''
      textLines.push(`${i+1}. ${h.name}${ga} / ${sexAge(h.sex, h.birth_date)}${rc}${mm}`)
    })
    const text = textLines.join('\n')

    const htmlRows = horses.map((h: any, i: number) => `
      <tr>
        <td style="padding:6px 4px;border-bottom:1px solid #f2f2f2;">${i+1}</td>
        <td style="padding:6px 4px;border-bottom:1px solid #f2f2f2;">${esc(h.name)}</td>
        <td style="padding:6px 4px;border-bottom:1px solid #f2f2f2;">${esc(sexAge(h.sex, h.birth_date))}</td>
        <td style="padding:6px 4px;border-bottom:1px solid #f2f2f2;">${esc(h.grade ?? '—')}</td>
        <td style="padding:6px 4px;border-bottom:1px solid #f2f2f2;">${esc((h.analysis_comment ?? '').trim())}</td>
        <td style="padding:6px 4px;border-bottom:1px solid #f2f2f2;">${esc((h.memo ?? '').trim())}</td>
      </tr>
    `).join('')

    const html = `
      <div>
        <h3>${esc(header)}</h3>
        <table style="border-collapse:collapse;min-width:640px;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="text-align:left;padding:6px 4px;border-bottom:1px solid #e9ecef;">#</th>
              <th style="text-align:left;padding:6px 4px;border-bottom:1px solid #e9ecef;">馬名</th>
              <th style="text-align:left;padding:6px 4px;border-bottom:1px solid #e9ecef;">性/年</th>
              <th style="text-align:left;padding:6px 4px;border-bottom:1px solid #e9ecef;">評価</th>
              <th style="text-align:left;padding:6px 4px;border-bottom:1px solid #e9ecef;">レースコメント</th>
              <th style="text-align:left;padding:6px 4px;border-bottom:1px solid #e9ecef;">メモ</th>
            </tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </div>`
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    })
    const mailTo = process.env.MAIL_TO || process.env.GMAIL_USER
    await transporter.sendMail({ from: process.env.GMAIL_USER, to: mailTo, subject: `[出走馬一覧] ${race.race_name}`, text, html })
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ==== Training Center ======================================================
app.get('/api/training-centers', async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(
      `SELECT training_center_id, training_center_name
         FROM m_training_center
        ORDER BY training_center_id ASC`
    )
    res.json(r.rows)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// 今日以降のレース（レース登録UI用）
app.get('/api/races-upcoming', async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(
      `SELECT race_id, race_name, race_date
         FROM t_race
        WHERE race_date >= CURRENT_DATE
        ORDER BY race_date ASC, race_id ASC`
    )
    res.json(r.rows.map(row => ({ ...row, race_date: toYmd(row.race_date) })))
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ★ 最後に「ハンドラ」を export（Nuxt の serverMiddleware 仕様）
export default app
