<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2">
      <h1 class="h5 m-0 fw-bold d-flex align-items-center gap-2 flex-wrap">
        出走馬一覧
        <small v-if="race" class="text-muted">
          （{{ race.race_name }}｜{{ formatRaceDate(race.race_date) }}｜{{ courseName(race.race_cource_id) }}｜{{ typeName(race.race_type_id) }}｜{{ race.distance }}m）
        </small>
        <span v-if="!loading" class="fw-semibold ms-1">{{ horses.length }}頭</span>
      </h1>

      <div class="d-flex align-items-center ms-auto flex-nowrap">
        <button class="btn btn-success btn-sm text-nowrap px-3 me-2" @click="sendMail" :disabled="sendingMail">
          <span v-if="sendingMail" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          メール送付
        </button>
        <nuxt-link :to="`/races/${id}/edit`" class="btn btn-outline-secondary btn-sm text-nowrap px-3 me-2">
          レース編集
        </nuxt-link>
        <nuxt-link to="/races" class="btn btn-outline-secondary btn-sm text-nowrap px-3 me-2">
          レース一覧
        </nuxt-link>
        <nuxt-link to="/" class="btn btn-outline-primary btn-sm text-nowrap px-3">
          競走馬一覧
        </nuxt-link>
      </div>
    </div>

    <div v-if="loading" class="alert alert-secondary">読み込み中...</div>
    <div v-else-if="error" class="alert alert-danger">読み込みに失敗しました：{{ error }}</div>
    <div v-if="mailMsg" class="alert alert-success">{{ mailMsg }}</div>
    <div v-if="mailErr" class="alert alert-danger">{{ mailErr }}</div>
    <div v-if="saveErr" class="alert alert-danger">{{ saveErr }}</div>

    <div v-else class="card border-0 shadow">
      <div class="card-body p-0">
        <table class="table table-hover table-striped m-0 align-middle horse-table">
          <colgroup>
            <col style="width:54px;">
            <col style="width:66px;">
            <col style="width:66px;">
            <col style="width:220px;">
            <col style="width:110px;">
            <col style="width:90px;">
            <col style="width:380px;">
            <col style="width:140px;">
          </colgroup>
          <thead class="table-light">
            <tr>
              <th>色</th>
              <th>枠</th>
              <th>番</th>
              <th>馬名</th>
              <th>性 / 年</th>
              <th>評価</th>
              <th>レースコメント</th>
              <th class="text-end">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in horses" :key="h.id" class="row-click" @click="rowClick(h.id)">
              <td class="cell-tight-right">
                <select
                  class="form-select form-select-sm waku-color"
                  v-model="h.frame_colorModel"
                  @click.stop
                  @change="saveFrameColor(h)"
                  :style="colorStyle(h.frame_colorModel)"
                  :disabled="saving === keyOf(h, 'frameColor')"
                  :title="colorLabel(h.frame_colorModel)"
                  aria-label="枠色"
                >
                  <option value=""></option>
                  <option v-for="c in colorOptions" :key="c.value" :value="c.value" :style="colorStyle(c.value)" :title="c.label"></option>
                </select>
              </td>

              <td class="cell-tight-left cell-tight-right">
                <select
                  class="form-select form-select-sm waku-no"
                  v-model="h.frame_noModel"
                  @click.stop
                  @change="saveFrameNo(h)"
                  :disabled="saving === keyOf(h, 'frame')"
                  aria-label="枠番"
                >
                  <option value=""></option>
                  <option v-for="n in 8" :key="n" :value="String(n)">{{ n }}</option>
                </select>
              </td>

              <td class="cell-tight-left cell-tight-right">
                <select
                  class="form-select form-select-sm uma-no"
                  v-model="h.horse_noModel"
                  @click.stop
                  @change="saveHorseNo(h)"
                  :disabled="saving === keyOf(h, 'horse')"
                  aria-label="馬番"
                >
                  <option value=""></option>
                  <option v-for="n in 20" :key="n" :value="String(n)">{{ n }}</option>
                </select>
              </td>

              <td class="fw-semibold">
                <nuxt-link :to="`/horse/${h.id}/edit?from=entries&raceId=${id}`" class="text-decoration-none" @click.stop>
                  {{ h.name }}
                </nuxt-link>
              </td>

              <td class="cell-tight-right">
                {{ formatSexAge(h.sex, h.birth_date) }}
              </td>

              <td class="cell-tight-left">
                <select
                  class="form-select form-select-sm grade-select"
                  :style="gradeStyle(h.gradeModel)"
                  v-model="h.gradeModel"
                  @click.stop
                  @change="saveGrade(h)"
                  :disabled="saving === keyOf(h, 'grade')"
                  aria-label="評価"
                >
                  <option value="">—</option>
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </td>

              <td>
                <div class="analysis-wrap" @click.stop>
                  <input
                    type="text"
                    class="form-control form-control-sm comment-input fixed"
                    :class="{'comment-has-text': (h.analysis_commentModel || '').trim().length}"
                    :title="(h.analysis_commentModel || '').trim()"
                    v-model.trim="h.analysis_commentModel"
                    maxlength="100"
                    placeholder="レースコメント（100文字まで）"
                    @blur="saveComment(h)"
                    :disabled="saving === keyOf(h, 'analysis')"
                  />
                  <small v-if="(h.memo || '').trim().length" class="text-muted memo-excerpt" :title="(h.memo || '').trim()">
                    ｜ {{ memoExcerpt(h.memo) }}
                  </small>
                </div>
              </td>

              <td class="text-end">
                <nuxt-link :to="`/horse/${h.id}/edit?from=entries&raceId=${id}`" class="btn btn-sm btn-outline-primary" @click.stop>
                  編集
                </nuxt-link>
              </td>
            </tr>

            <tr v-if="horses.length === 0">
              <td colspan="8" class="text-center text-muted py-4">出走馬は登録されていません</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import Vue from 'vue'

type Race = {
  race_id: number
  race_date: string
  race_name: string
  race_cource_id: number
  race_type_id: number
  distance: number
  comment?: string | null
}
type HorseRow = {
  id: number
  name: string
  sex?: string|null
  birth_date?: string|null
  memo?: string|null
  grade?: 'S'|'A'|'B'|'C'|null
  analysis_comment?: string|null
  frame_no?: number|null
  horse_no?: number|null
  frame_color?: string|null

  gradeModel?: string
  analysis_commentModel?: string
  frame_noModel?: string
  horse_noModel?: string
  frame_colorModel?: string
}

export default Vue.extend({
  name: 'RaceEntriesPage',
  head: { title: '出走馬一覧' },
  data() {
    return {
      id: Number(this.$route.params.id),
      race: null as Race | null,
      horses: [] as HorseRow[],
      loading: true,
      error: '',
      sendingMail: false,
      mailMsg: '',
      mailErr: '',
      saveErr: '',
      saving: '' as string,
      courseMap: {
        1: '札幌', 2: '函館', 3: '福島', 4: '新潟', 5: '東京',
        6: '中山', 7: '中京', 8: '京都', 9: '阪神', 10: '小倉',
      } as Record<number, string>,
      typeMap: { 1: '芝', 2: 'ダート', 3: 'その他' } as Record<number, string>,
      colorOptions: [
        { value: 'white',  label: '白' },
        { value: 'black',  label: '黒' },
        { value: 'red',    label: '赤' },
        { value: 'blue',   label: '青' },
        { value: 'yellow', label: '黄' },
        { value: 'green',  label: '緑' },
        { value: 'orange', label: 'オレンジ' },
        { value: 'pink',   label: 'ピンク' },
      ],
    }
  },
  methods: {
    keyOf(h: HorseRow, field: 'grade'|'analysis'|'frame'|'horse'|'frameColor') {
      return `${field}-${h.id}`
    },
    rowClick(horseId: number) {
      this.$router.push(`/horse/${horseId}/edit?from=entries&raceId=${this.id}`)
    },
    courseName(id?: number | null) { return id ? (this.courseMap[id] ?? `#${id}`) : '—' },
    typeName(id?: number | null) { return id ? (this.typeMap[id] ?? `#${id}`) : '—' },
    formatRaceDate(s?: string | null) {
      if (!s) return '—'
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      return m ? `${m[1]}/${m[2]}/${m[3]}` : '—'
    },
    calcAge(dateStr?: string | null): number | null {
      if (!dateStr) return null
      const m = dateStr.match(/^(\d{4})-/)
      if (!m) return null
      const birthYear = Number(m[1])
      const currentYear = new Date().getFullYear()
      const age = currentYear - birthYear
      return age >= 0 ? age : null
    },
    formatSexAge(sex?: string | null, birth_date?: string | null): string {
      const age = this.calcAge(birth_date)
      if (sex && (age ?? null) !== null) return `${sex}${age}`
      if (sex) return sex
      if ((age ?? null) !== null) return `${age}歳`
      return '—'
    },
    memoExcerpt(m?: string | null): string {
      const full = (m || '').trim().replace(/\s+/g, ' ')
      if (!full) return ''
      const limit = 28
      return full.length > limit ? `${full.slice(0, limit)}…` : full
    },
    gradeStyle(v?: string) {
      switch ((v || '').toUpperCase()) {
        case 'S': return { backgroundColor: '#ff8c00', color: '#fff', borderColor: '#e57d00' }
        case 'A': return { backgroundColor: '#28a745', color: '#fff', borderColor: '#1f8a39' }
        case 'B': return { backgroundColor: '#0d6efd', color: '#fff', borderColor: '#0a58ca' }
        case 'C': return { backgroundColor: '#dc3545', color: '#fff', borderColor: '#bb2d3b' }
        default:  return { backgroundColor: '#f1f3f5', color: '#333', borderColor: '#d9dee3' }
      }
    },
    colorStyle(v?: string) {
      const map: Record<string, string> = {
        white:'#ffffff', black:'#000000', red:'#dc3545', blue:'#0d6efd',
        yellow:'#ffc107', green:'#198754', orange:'#fd7e14', pink:'#ff69b4'
      }
      const bg = v ? (map[v] || '#f1f3f5') : '#f1f3f5'
      const fg = v === 'white' || !v ? '#333' : '#fff'
      return { backgroundColor: bg, color: fg, borderColor: '#ced4da' }
    },
    colorLabel(v?: string) {
      const m: Record<string,string> = {
        white:'白', black:'黒', red:'赤', blue:'青', yellow:'黄', green:'緑', orange:'オレンジ', pink:'ピンク'
      }
      return v ? (m[v] ?? v) : ''
    },
    async sendMail() {
      this.mailMsg = ''; this.mailErr = ''
      try {
        this.sendingMail = true
        await this.$axios.$post(`/api/races/${this.id}/mail`)
        this.mailMsg = 'メールを送信しました。'
      } catch (e:any) {
        this.mailErr = e?.response?.data?.error ?? e?.message ?? 'メール送信に失敗しました。'
      } finally {
        this.sendingMail = false
      }
    },
    async saveGrade(h: HorseRow) {
      this.saveErr = ''
      const key = this.keyOf(h, 'grade')
      const prev = h.grade
      h.grade = (h.gradeModel || '') as any
      try {
        this.saving = key
        await this.$axios.$patch('/api/race-entries', {
          race_id: this.id, horse_id: h.id, grade: h.gradeModel || ''
        })
      } catch (e:any) {
        h.grade = prev; h.gradeModel = prev ?? ''
        this.saveErr = e?.response?.data?.error ?? e?.message ?? '保存に失敗しました（評価）'
      } finally {
        this.saving = ''
      }
    },
    async saveComment(h: HorseRow) {
      this.saveErr = ''
      const key = this.keyOf(h, 'analysis')
      const prev = h.analysis_comment
      const val = (h.analysis_commentModel || '').trim()
      if (val.length > 100) h.analysis_commentModel = val.slice(0, 100)
      try {
        this.saving = key
        await this.$axios.$patch('/api/race-entries', {
          race_id: this.id, horse_id: h.id, analysis_comment: h.analysis_commentModel || ''
        })
        h.analysis_comment = h.analysis_commentModel || null
      } catch (e:any) {
        h.analysis_commentModel = prev ?? ''
        this.saveErr = e?.response?.data?.error ?? e?.message ?? '保存に失敗しました（レースコメント）'
      } finally {
        this.saving = ''
      }
    },
    async saveFrameNo(h: HorseRow) {
      this.saveErr = ''
      const key = this.keyOf(h, 'frame')
      try {
        this.saving = key
        await this.$axios.$patch('/api/race-entries', {
          race_id: this.id, horse_id: h.id,
          frame_no: h.frame_noModel ? Number(h.frame_noModel) : null
        })
        h.frame_no = h.frame_noModel ? Number(h.frame_noModel) : null
        this.sortLocal()
      } catch (e:any) {
        this.saveErr = e?.response?.data?.error ?? e?.message ?? '保存に失敗しました（枠番）'
      } finally { this.saving = '' }
    },
    async saveHorseNo(h: HorseRow) {
      this.saveErr = ''
      const key = this.keyOf(h, 'horse')
      try {
        this.saving = key
        await this.$axios.$patch('/api/race-entries', {
          race_id: this.id, horse_id: h.id,
          horse_no: h.horse_noModel ? Number(h.horse_noModel) : null
        })
        h.horse_no = h.horse_noModel ? Number(h.horse_noModel) : null
        this.sortLocal()
      } catch (e:any) {
        this.saveErr = e?.response?.data?.error ?? e?.message ?? '保存に失敗しました（馬番）'
      } finally { this.saving = '' }
    },
    async saveFrameColor(h: HorseRow) {
      this.saveErr = ''
      const key = this.keyOf(h, 'frameColor')
      try {
        this.saving = key
        await this.$axios.$patch('/api/race-entries', {
          race_id: this.id, horse_id: h.id,
          frame_color: (h.frame_colorModel || '')
        })
        h.frame_color = h.frame_colorModel || null
      } catch (e:any) {
        this.saveErr = e?.response?.data?.error ?? e?.message ?? '保存に失敗しました（枠色）'
      } finally { this.saving = '' }
    },
    sortLocal() {
      this.horses.sort((a,b)=>{
        const af = a.frame_no ?? 999, bf = b.frame_no ?? 999
        if (af !== bf) return af - bf
        const ah = a.horse_no ?? 999, bh = b.horse_no ?? 999
        if (ah !== bh) return ah - bh
        return (a.name || '').localeCompare(b.name || '', 'ja')
      })
    },
  },
  async mounted() {
    try {
      const resp = await this.$axios.$get(`/api/races/${this.id}/entries`)
      this.race = resp.race
      this.horses = (resp.horses as HorseRow[]).map(h => ({
        ...h,
        gradeModel: h.grade ?? '',
        analysis_commentModel: h.analysis_comment ?? '',
        frame_noModel: (h.frame_no ?? '')?.toString(),
        horse_noModel: (h.horse_no ?? '')?.toString(),
        frame_colorModel: h.frame_color ?? '',
      }))
      this.sortLocal()
    } catch (e:any) {
      this.error = e?.response?.data?.error ?? e?.message ?? '読み込みに失敗しました'
    } finally {
      this.loading = false
      const elapsed = performance.now() - ((window as any).__navStart ?? performance.now())
      await (this as any).$logView({
        name: '出走馬一覧',
        elapsedMs: elapsed,
        path: this.$route.fullPath,
        extra: { raceId: this.id, horseCount: this.horses.length }
      })
    }
  },
})
</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
.table thead th { font-weight: 700; }
.card { border-radius: 1rem; }

.horse-table{
  --bs-table-bg: #fff;
  --bs-table-striped-bg: #eaf6ff;
  --bs-table-striped-color: inherit;
  --bs-table-hover-bg: #66fff2;
  --bs-table-hover-color: #000;
}
.horse-table.table-striped > tbody > tr:nth-of-type(odd) > * {
  background-color: var(--bs-table-striped-bg) !important;
}
.horse-table.table-hover tbody tr:hover > * {
  background-color: var(--bs-table-hover-bg) !important;
  color: var(--bs-table-hover-color) !important;
}
.row-click { cursor: pointer; }
.cell-tight-right { padding-right: .25rem !important; }
.cell-tight-left  { padding-left:  .25rem !important; }
.waku-no{ width: 56px; min-width: 56px; text-align-last: center; }
.uma-no{ width: 56px; min-width: 64px; text-align-last: center; }
.waku-color{
  width: 40px; min-width: 40px;
  padding-left: 0; padding-right: 0;
  text-align-last: center;
  color: transparent !important;
  text-shadow: none !important;
}
.waku-color option{ color: transparent; }
.grade-select{ width: 64px; min-width: 64px; text-align: center; border-width: 1px; padding-right: 1.25rem; }
.analysis-wrap { display:flex; align-items:center; gap:.25rem; }
.comment-input{ background-color: #fff6cc; color: #2a2200; border-color: #ffd86a; }
.comment-input.fixed{ width: 320px; min-width: 320px; max-width: 320px; flex: 0 0 auto; }
.comment-input:focus{ background-color: #fff1b3; border-color: #ffc107; box-shadow: 0 0 0 .15rem rgba(255,193,7,.25); }
.comment-input::placeholder{ color:#856404; opacity:.7; }
.comment-has-text{ background-color:#fff1b3; border-color:#ffc107; color:#1f1800; }
.memo-excerpt{ display:inline-block; max-width: 22rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: baseline; color:#2b6cb0; }
</style>
