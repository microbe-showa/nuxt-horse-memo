<template>
  <div class="container py-4">
    <h1 class="h5 mb-3">
      レースに登録
      <small v-if="horseName" class="text-muted">（{{ horseName }}）</small>
    </h1>

    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="loading" class="alert alert-secondary m-0">読み込み中...</div>

        <div v-else>
          <!-- フィルタ行 -->
          <div class="row g-2 align-items-end mb-3">
            <div class="col-md-6">
              <label class="form-label">検索（レース名 / 競馬場）</label>
              <div class="input-group">
                <span class="input-group-text">検索</span>
                <input
                  v-model.trim="q"
                  type="text"
                  class="form-control"
                  placeholder="例）日本 / 東京 など"
                />
              </div>
              <small class="text-muted">※ 文字を入れると即時絞り込み</small>
            </div>

            <div class="col-md-3">
              <div class="form-check mt-4">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="only-upcoming"
                  v-model="onlyUpcoming"
                />
                <label class="form-check-label" for="only-upcoming">
                  今日以降のみ表示
                </label>
              </div>
            </div>

            <div class="col-md-3 text-md-end">
              <div class="mt-4">
                <nuxt-link to="/races/new" class="btn btn-outline-secondary btn-sm">
                  レースを新規登録
                </nuxt-link>
              </div>
            </div>
          </div>

          <!-- 候補が無いときのガイダンス -->
          <div v-if="displayRaces.length === 0" class="alert alert-info">
            該当レースがありません。
            <span v-if="onlyUpcoming">「今日以降のみ表示」のチェックを外すか、検索条件を変更してください。</span>
            <span v-else>検索条件を変更するか、<nuxt-link to="/races/new" class="alert-link">レースを登録</nuxt-link>してください。</span>
          </div>

          <!-- 登録フォーム -->
          <form v-else @submit.prevent="submit">
            <div class="mb-3">
              <label class="form-label">レースを選択 <span class="text-danger">*</span></label>
              <select v-model.number="selectedRaceId" class="form-select" required>
                <option :value="undefined" disabled>選択してください</option>
                <option
                  v-for="r in displayRaces"
                  :key="r.race_id"
                  :value="r.race_id"
                >
                  {{ formatRaceDate(r.race_date) }}／{{ courseName(r.race_cource_id) }}／{{ r.race_name }}／{{ typeName(r.race_type_id) }}／{{ r.distance }}m
                </option>
              </select>
              <small class="text-muted">
                {{ onlyUpcoming ? '今日以降のレースを日付昇順で表示しています' : 'すべてのレースを新しい日付順で表示しています' }}
              </small>
            </div>

            <div class="d-flex gap-2 mt-3">
              <button type="submit" class="btn btn-primary" :disabled="submitting || !selectedRaceId">
                {{ submitting ? '登録中...' : '登録する' }}
              </button>
              <nuxt-link to="/" class="btn btn-outline-secondary">戻る</nuxt-link>
            </div>

            <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
            <div v-if="notice" class="alert alert-success mt-3">{{ notice }}</div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

type Race = {
  race_id: number
  race_date: string          // YYYY-MM-DD
  race_name: string
  race_cource_id: number     // 開催地ID
  race_type_id: number       // 1=芝,2=ダ,3=その他
  distance: number
}

export default Vue.extend({
  name: 'HorseRegisterRacePage',
  head(): any {
    const n = (this as any).horseName?.trim()
    return { title: n ? `レースに登録（${n}）` : 'レースに登録' }
  },
  data() {
    return {
      id: Number(this.$route.params.id),
      horseName: '',
      allRaces: [] as Race[],          // すべてのレース（/api/races）
      selectedRaceId: undefined as number | undefined,
      loading: true,
      submitting: false,
      error: '',
      notice: '',
      q: '',
      onlyUpcoming: true,              // 既定：今日以降のみ
      courseMap: {
        1: '札幌', 2: '函館', 3: '福島', 4: '新潟', 5: '東京',
        6: '中山', 7: '中京', 8: '京都', 9: '阪神', 10: '小倉',
      } as Record<number, string>,
      typeMap: { 1: '芝', 2: 'ダート', 3: 'その他' } as Record<number, string>,
    }
  },
  computed: {
    displayRaces(): Race[] {
      // ベース：全件
      let list = [...this.allRaces]

      // 今日以降フィルタ
      if (this.onlyUpcoming) {
        const today = new Date()
        const y = today.getFullYear()
        const m = String(today.getMonth() + 1).padStart(2, '0')
        const d = String(today.getDate()).padStart(2, '0')
        const todayStr = `${y}-${m}-${d}`
        list = list.filter(r => r.race_date >= todayStr)
        // 日付昇順に
        list.sort((a, b) => a.race_date.localeCompare(b.race_date) || a.race_id - b.race_id)
      } else {
        // 全件は新しい順
        list.sort((a, b) => b.race_date.localeCompare(a.race_date) || b.race_id - a.race_id)
      }

      // 検索フィルタ（レース名／競馬場）
      const q = this.q.trim().toLowerCase()
      if (q) {
        list = list.filter(r => {
          const nameHit = (r.race_name || '').toLowerCase().includes(q)
          const courseHit = (this.courseName(r.race_cource_id) || '').toLowerCase().includes(q)
          return nameHit || courseHit
        })
      }
      return list
    },
  },
  methods: {
    formatRaceDate(s?: string | null) {
      if (!s) return '—'
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      return m ? `${m[1]}/${m[2]}/${m[3]}` : '—'
    },
    courseName(id?: number | null) { return id ? (this.courseMap[id] ?? `#${id}`) : '—' },
    typeName(id?: number | null) { return id ? (this.typeMap[id] ?? `#${id}`) : '—' },
    async submit() {
      this.error = ''
      if (!this.selectedRaceId) return
      try {
        this.submitting = true
        await this.$axios.$post('/api/race-entries', {
          race_id: this.selectedRaceId,
          horse_id: this.id,
        })
        this.$router.push('/')
      } catch (e: any) {
        if (e?.response?.status === 409) {
          this.error = 'すでにこのレースに登録済みです'
        } else if (e?.response?.status === 404) {
          this.error = 'レースまたは馬が見つかりません'
        } else {
          this.error = e?.response?.data?.error ?? e?.message ?? '登録に失敗しました'
        }
      } finally {
        this.submitting = false
      }
    },
  },
  async mounted() {
    try {
      // 馬名
      const horse = await this.$axios.$get(`/api/horses/${this.id}`)
      this.horseName = horse?.name ?? ''

      // すべてのレースを読み込み（/api/races）
      const rows: Race[] = await this.$axios.$get('/api/races')
      this.allRaces = rows ?? []

      // 今日以降が0件なら、チェックを自動で外す（＝全件表示）
      if (this.displayRaces.length === 0 && this.onlyUpcoming) {
        this.onlyUpcoming = false
      }
    } catch (e: any) {
      this.error = e?.response?.data?.error ?? e?.message ?? '読み込みに失敗しました'
    } finally {
      this.loading = false
    }
  },
})
</script>

<style scoped>
.card { border-radius: 1rem; }
</style>
