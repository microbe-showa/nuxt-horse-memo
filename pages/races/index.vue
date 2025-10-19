<template>
  <div class="container py-4">
    <!-- ヘッダー -->
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2">
      <h1 class="h4 m-0 fw-bold">レース一覧</h1>

      <div class="d-flex align-items-center ms-auto flex-nowrap">
        <!-- レース登録へ -->
        <nuxt-link to="/races/new" class="btn btn-primary btn-sm text-nowrap px-3 me-2">
          登録
        </nuxt-link>

        <!-- 競走馬一覧へ戻る -->
        <nuxt-link to="/" class="btn btn-outline-secondary btn-sm text-nowrap px-3 me-2">
          競走馬一覧
        </nuxt-link>

        <!-- 検索 -->
        <div class="input-group input-group-sm" style="width: 360px;">
          <span class="input-group-text">検索</span>
          <input
            v-model.trim="q"
            type="text"
            class="form-control"
            placeholder="レース名/開催地で絞り込み"
            aria-label="検索"
          />
        </div>
      </div>
    </div>

    <!-- 状態 -->
    <div v-if="loading" class="alert alert-secondary">読み込み中...</div>
    <div v-else-if="error" class="alert alert-danger">読み込みに失敗しました：{{ error }}</div>

    <!-- 一覧 -->
    <div v-else class="card border-0 shadow">
      <div class="card-body p-0">
        <table class="table table-hover table-striped m-0 align-middle race-table">
          <colgroup>
            <col style="width: 120px;"> <!-- 日付 -->
            <col style="width: 240px;"> <!-- レース名 -->
            <col style="width: 120px;"> <!-- 開催地 -->
            <col style="width: 80px;">  <!-- 芝/ダ -->
            <col style="width: 80px;">  <!-- 距離 -->
            <col>                       <!-- コメント -->
            <col style="width: 140px;"> <!-- 出走馬 -->
          </colgroup>
          <thead class="table-light">
            <tr>
              <th>日付</th>
              <th>レース名</th>
              <th>開催地</th>
              <th>芝/ダ</th>
              <th>距離</th>
              <th>コメント</th>
              <th class="text-end">出走馬</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in filtered"
              :key="r.race_id"
              class="table-row-click"
              @click="goEdit(r.race_id)"
            >
              <td>{{ formatRaceDate(r.race_date) }}</td>
              <td class="fw-semibold text-truncate" style="max-width: 240px;">
                <nuxt-link :to="`/races/${r.race_id}/edit`" class="text-decoration-none" @click.stop>
                  {{ r.race_name }}
                </nuxt-link>
              </td>
              <td>{{ courseName(r.race_cource_id) }}</td>
              <td>{{ typeName(r.race_type_id) }}</td>
              <td>{{ r.distance }}m</td>
              <td class="text-truncate" style="max-width: 420px;">{{ r.comment || '—' }}</td>
              <td class="text-end">
                <nuxt-link
                  :to="`/races/${r.race_id}/entries`"
                  class="btn btn-sm btn-outline-success"
                  @click.stop
                >
                  出走馬を見る
                </nuxt-link>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="7" class="text-center text-muted py-4">該当するレースが見つかりません</td>
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
  race_pace?: number | null
  comment?: string | null
}

export default Vue.extend({
  name: 'RaceListPage',
  head: { title: 'レース一覧' },
  data() {
    return {
      races: [] as Race[],
      loading: true,
      error: '',
      q: '',
      courseMap: {
        1: '札幌', 2: '函館', 3: '福島', 4: '新潟', 5: '東京',
        6: '中山', 7: '中京', 8: '京都', 9: '阪神', 10: '小倉',
      } as Record<number, string>,
      typeMap: { 1: '芝', 2: 'ダート', 3: 'その他' } as Record<number, string>,
    }
  },
  async mounted() {
    try {
      this.races = await this.$axios.$get('/api/races')
    } catch (e: any) {
      this.error = e?.response?.data?.error ?? e?.message ?? 'API未実装です（/api/races）'
    } finally {
      this.loading = false
    }
  },
  computed: {
    filtered(): Race[] {
      if (!this.q) return this.races
      const q = this.q.toLowerCase()
      return this.races.filter(r =>
        (r.race_name || '').toLowerCase().includes(q) ||
        (this.courseName(r.race_cource_id) || '').toLowerCase().includes(q)
      )
    },
  },
  methods: {
    goEdit(id: number) {
      this.$router.push(`/races/${id}/edit`)
    },
    formatRaceDate(s?: string | null) {
      if (!s) return '—'
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      return m ? `${m[1]}/${m[2]}/${m[3]}` : '—'
    },
    courseName(id?: number | null) { return id ? (this.courseMap[id] ?? `#${id}`) : '—' },
    typeName(id?: number | null) { return id ? (this.typeMap[id] ?? `#${id}`) : '—' },
  },
})
</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
.table thead th { font-weight: 700; }
.card { border-radius: 1rem; }

.race-table{
  --bs-table-bg: #fff;
  --bs-table-striped-bg: #eaf6ff;
  --bs-table-striped-color: inherit;
  --bs-table-hover-bg: #66fff2;
  --bs-table-hover-color: #000;
}
.race-table.table-striped > tbody > tr:nth-of-type(odd) > * {
  background-color: var(--bs-table-striped-bg) !important;
}
.race-table.table-hover tbody tr:hover > * {
  background-color: var(--bs-table-hover-bg) !important;
  color: var(--bs-table-hover-color) !important;
}

/* 行クリックのポインタ表示 */
.table-row-click { cursor: pointer; }
</style>
