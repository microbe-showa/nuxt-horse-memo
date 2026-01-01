<template>
  <div class="container py-4">
    <!-- ヘッダー行 -->
    <div
      class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2"
    >
      <div class="d-flex align-items-center flex-wrap gap-2">
        <h1 class="h4 m-0 fw-bold">
          競走馬一覧
          <small class="text-muted ms-2">
            {{ filteredCount }}頭 / 全{{ totalCount }}頭
          </small>
        </h1>

        <!-- 引退馬フィルタ -->
        <div class="form-check form-check-inline ms-2 mb-0 text-nowrap">
          <input
            id="showRetired"
            class="form-check-input"
            type="checkbox"
            v-model="showRetired"
          />
          <label class="form-check-label" for="showRetired">引退馬も表示</label>
        </div>

        <!-- フィルタ状態のヒント -->
        <span class="badge bg-light text-dark border" v-if="!showRetired">
          現役のみ
        </span>
        <span class="badge bg-light text-dark border" v-else>
          現役＋引退
        </span>
        <span class="badge bg-light text-dark border" v-if="q">
          馬名: "{{ q }}"
        </span>
      </div>

      <div class="d-flex align-items-center ms-auto flex-nowrap">
        <nuxt-link to="/horse/new" class="btn btn-primary btn-sm text-nowrap px-3 me-2">登録</nuxt-link>
        <nuxt-link to="/trainers" class="btn btn-outline-secondary btn-sm text-nowrap px-3 me-2">調教師</nuxt-link>
        <nuxt-link to="/races" class="btn btn-outline-secondary btn-sm text-nowrap px-3 me-3">レース一覧</nuxt-link>

        <!-- 馬名検索 -->
        <div class="input-group input-group-sm" style="width: 420px;">
          <span class="input-group-text">馬名検索</span>
          <input
            v-model.trim="q"
            type="text"
            class="form-control"
            placeholder="例：イクイノックス"
            aria-label="馬名検索"
          />
          <button
            class="btn btn-outline-secondary"
            type="button"
            @click="q = ''"
            :disabled="!q"
            title="クリア"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- 状態 -->
    <div v-if="loading" class="alert alert-secondary">読み込み中...</div>
    <div v-else-if="error" class="alert alert-danger">読み込みに失敗しました：{{ error }}</div>

    <!-- テーブル -->
    <div v-else class="card border-0 shadow">
      <div class="card-body p-0">
        <table class="table table-hover table-striped m-0 align-middle horse-table">
          <colgroup>
            <col style="width:220px;">
            <col style="width:90px;">
            <col style="width:300px;">
            <col style="width:160px;">
            <col style="width:120px;">
            <col>
            <col style="width:160px;">
            <col style="width:110px;">
          </colgroup>
          <thead class="table-light">
            <tr>
              <th>馬名</th>
              <th>性 / 年</th>
              <th>父 / 母父</th>
              <th>調教師</th>
              <th>所属トレセン</th>
              <th>生産者</th>
              <th>レース予定</th>
              <th class="text-end">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(h, idx) in filtered"
              :key="(h && h.id) ? h.id : `row-${idx}`"
              class="table-row-click"
              @click="goEditSafe(h)"
              :class="{ 'is-retired': isRetired(h) }"
            >
              <td class="fw-semibold">
                <nuxt-link
                  v-if="h && h.id"
                  :to="`/horse/${h.id}/edit`"
                  class="text-decoration-none"
                  @click.stop
                >
                  {{ h.name }}
                </nuxt-link>
                <span v-else>—</span>

                <!-- 引退バッジ -->
                <span v-if="isRetired(h)" class="badge bg-secondary ms-2">引退</span>
              </td>
              <td>{{ formatSexAge(h && h.sex, h && h.birth_date) }}</td>
              <td class="text-truncate" style="max-width: 260px;">
                {{ formatParents(h && h.sire, h && h.bloodmare_sire) }}
              </td>
              <td>{{ (h && h.trainer) || '—' }}</td>
              <td>{{ (h && h.training_center_name) || '—' }}</td>
              <td class="text-truncate" style="max-width: 220px;">
                {{ (h && h.breeder) || '—' }}
              </td>

              <td>
                <span v-if="h && h.upcoming_race_name" class="badge bg-info text-dark">
                  {{ h.upcoming_race_name }}（{{ h.upcoming_race_date }}）
                </span>

                <!-- 引退馬にはレース登録ボタンを出さない -->
                <span v-else-if="isRetired(h)" class="text-muted">—</span>

                <button
                  v-else
                  type="button"
                  class="btn btn-outline-success btn-sm"
                  @click.stop.prevent="openRaceModal(h)"
                >
                  レースに登録
                </button>
              </td>

              <td class="text-end">
                <nuxt-link
                  v-if="h && h.id"
                  :to="`/horse/${h.id}/edit`"
                  class="btn btn-sm btn-outline-primary"
                  @click.stop
                >
                  編集
                </nuxt-link>
              </td>
            </tr>

            <tr v-if="filtered.length === 0">
              <td colspan="8" class="text-center text-muted py-4">
                該当する馬が見つかりません
                <div class="small mt-1">
                  <span v-if="q">馬名検索をクリアしてみてください。</span>
                  <span v-else>「引退馬も表示」をオンにすると増える可能性があります。</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- レース登録モーダル -->
    <div class="modal fade" tabindex="-1" ref="raceModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">レースに登録 — {{ targetHorseName }}</h5>
            <button type="button" class="btn-close" @click="hideModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="modalLoading" class="text-muted">読み込み中...</div>
            <div v-else>
              <div class="mb-2">
                <label class="form-label mb-1">今日以降のレース</label>
                <select v-model="selectedRaceId" class="form-select">
                  <option :value="null">選択してください</option>
                  <option v-for="r in upcomingRaces" :key="r.race_id" :value="r.race_id">
                    {{ r.race_date }} {{ r.race_name }}
                  </option>
                  <!-- 一覧側のみ：最後に「引退」を追加 -->
                  <option :value="RETIRE_VALUE">引退</option>
                </select>

                <div class="form-text" v-if="selectedRaceId === RETIRE_VALUE">
                  「引退」を選ぶと、この馬は一覧で非表示（引退馬も表示ON時のみ表示）になります。
                </div>
              </div>
              <div v-if="modalError" class="alert alert-danger py-2">{{ modalError }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="hideModal">閉じる</button>
            <button type="button" class="btn btn-primary" :disabled="!selectedRaceId || posting" @click="registerRace">
              <span v-if="posting" class="spinner-border spinner-border-sm me-1"></span>
              登録
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import Vue from 'vue'

type HorseRow = {
  id: number
  name: string
  sex?: string | null
  birth_date?: string | null
  trainer?: string | null
  training_center_name?: string | null
  breeder?: string | null
  sire?: string | null
  bloodmare_sire?: string | null
  upcoming_race_name?: string | null
  upcoming_race_date?: string | null
  // 追加仕様：登録抹消フラグ
  del_flg?: number | boolean | null
}

type RaceRow = { race_id: number; race_name: string; race_date: string }

export default Vue.extend({
  name: 'HorseListPage',
  head: { title: '競走馬一覧' },
  data() {
    return {
      horses: [] as HorseRow[],
      loading: true,
      error: '',
      q: '',
      showRetired: false,

      targetHorse: null as HorseRow | null,
      upcomingRaces: [] as RaceRow[],
      selectedRaceId: null as number | null,
      modalLoading: false,
      modalError: '',
      posting: false,

      RETIRE_VALUE: -1 as const,
    }
  },
  watch: {
    showRetired() {
      this.fetchHorses()
    }
  },
  async mounted() {
    await this.fetchHorses()
  },
  computed: {
    totalCount(): number {
      const list = Array.isArray(this.horses) ? this.horses.filter(Boolean) : []
      return list.length
    },
    filteredCount(): number {
      return this.filtered.length
    },
    filtered(): HorseRow[] {
      // 不正値を丸ごと防御
      const list = Array.isArray(this.horses) ? this.horses.filter(Boolean) : []

      // 引退馬フィルタ（デフォルトは現役のみ）
      const byRetire = this.showRetired ? list : list.filter(h => !this.isRetired(h))

      // 馬名検索
      if (!this.q) return byRetire
      const qLower = this.q.toLowerCase()
      return byRetire.filter(h => (h?.name || '').toLowerCase().includes(qLower))
    },
    targetHorseName(): string {
      return this.targetHorse ? (this.targetHorse.name || '') : ''
    },
  },
  methods: {
    isRetired(h: HorseRow | null | undefined): boolean {
      if (!h) return false
      // del_flg: 1/true を引退扱い
      return h.del_flg === 1 || h.del_flg === true
    },
    async fetchHorses() {
      this.loading = true
      this.error = ''
      try {
        const rows = await this.$axios.$get('/api/horses',{
          params: {
            showRetired: this.showRetired ? 1 : 0
          }
        })
        this.horses = Array.isArray(rows) ? (rows.filter(Boolean) as HorseRow[]) : []
      } catch (e: any) {
        this.error = e?.response?.data?.error ?? e?.message ?? 'unknown error'
        this.horses = []
      } finally {
        this.loading = false
      }
    },
    goEditSafe(h: HorseRow | null | undefined) {
      if (!h || !h.id) return
      this.$router.push(`/horse/${h.id}/edit`)
    },

    // 競走馬の年齢：今年 - 生年
    calcAge(dateStr?: string | null): number | null {
      if (!dateStr) return null
      const m = String(dateStr).match(/^(\d{4})-/)
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
    formatParents(sire?: string | null, bmsire?: string | null): string {
      const a = (sire || '').trim()
      const b = (bmsire || '').trim()
      if (a && b) return `${a} / ${b}`
      if (a) return a
      if (b) return b
      return '—'
    },

    // ===== レース登録モーダル =====
    async openRaceModal(h: HorseRow | null | undefined) {
      if (!h || !h.id) return
      if (this.isRetired(h)) return

      this.targetHorse = h
      this.selectedRaceId = null
      this.modalError = ''
      this.modalLoading = true
      this.showModal()
      try {
        const races: RaceRow[] = await this.$axios.$get('/api/races-upcoming')
        this.upcomingRaces = Array.isArray(races) ? races : []
        if (this.upcomingRaces.length === 0) this.modalError = '登録できるレースがありません'
      } catch (e: any) {
        this.modalError = e?.response?.data?.error ?? e?.message ?? '取得に失敗しました'
      } finally {
        this.modalLoading = false
      }
    },
    async registerRace() {
      if (!this.targetHorse || !this.targetHorse.id || !this.selectedRaceId) return
      this.posting = true
      this.modalError = ''
      try {
        // 「引退」を選んだ場合は del_flg を立てるAPIを叩く（例）
        if (this.selectedRaceId === this.RETIRE_VALUE) {
          await this.$axios.$post(`/api/horses/${this.targetHorse.id}/retire`, { del_flg: 1 })
          const idx = this.horses.findIndex(x => x && x.id === this.targetHorse!.id)
          if (idx >= 0) {
            this.$set(this.horses, idx, {
              ...this.horses[idx],
              del_flg: 1,
              upcoming_race_name: null,
              upcoming_race_date: null,
            } as HorseRow)
          }
          this.hideModal()
          return
        }

        // 通常：出走登録
        await this.$axios.$post('/api/race-entries', {
          race_id: this.selectedRaceId,
          horse_id: this.targetHorse.id,
        })
        const race = this.upcomingRaces.find(r => r.race_id === this.selectedRaceId)
        if (race) {
          const idx = this.horses.findIndex(x => x && x.id === this.targetHorse!.id)
          if (idx >= 0) {
            this.$set(this.horses, idx, {
              ...this.horses[idx],
              upcoming_race_name: race.race_name,
              upcoming_race_date: race.race_date,
            } as HorseRow)
          }
        }
        this.hideModal()
      } catch (e: any) {
        this.modalError = e?.response?.data?.error ?? e?.message ?? '登録に失敗しました'
      } finally {
        this.posting = false
      }
    },

    // 簡易モーダル制御
    showModal() {
      const el = this.$refs.raceModal as HTMLElement
      if (!el) return
      el.classList.add('show')
      el.style.display = 'block'
      document.body.classList.add('modal-open')
      const backdrop = document.createElement('div')
      backdrop.className = 'modal-backdrop fade show'
      backdrop.setAttribute('data-backdrop', 'race')
      document.body.appendChild(backdrop)
    },
    hideModal() {
      const el = this.$refs.raceModal as HTMLElement
      if (!el) return
      el.classList.remove('show')
      el.style.display = 'none'
      document.body.classList.remove('modal-open')
      const backdrop = document.querySelector('div.modal-backdrop[data-backdrop="race"]')
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop)
    },
  },
})
</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
.table thead th { font-weight: 700; }
.card { border-radius: 1rem; }

/* テーブル配色（明るい水色×白、ホバーは蛍光シアン寄り） */
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

/* 馬名と性/年の間を詰める */
.horse-table th:nth-child(1), .horse-table td:nth-child(1) { padding-right:.25rem; }
.horse-table th:nth-child(2), .horse-table td:nth-child(2) { padding-left:.25rem; }

/* 行クリックのポインタ */
.table-row-click { cursor: pointer; }

/* 引退馬は少しグレーに */
.is-retired {
  opacity: 0.75;
}
</style>