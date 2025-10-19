<template>
  <div class="container py-4">
    <!-- ヘッダー行 -->
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2">
      <h1 class="h4 m-0 fw-bold">
        競走馬一覧
        <small v-if="!loading && !error" class="text-muted">（{{ horses.length }}頭）</small>
      </h1>

      <!-- 右側：1行固定＆高さ一致 -->
      <div class="d-flex align-items-center ms-auto flex-nowrap">
        <nuxt-link to="/horse/new" class="btn btn-primary btn-sm text-nowrap px-3 me-2">
          登録
        </nuxt-link>

        <nuxt-link to="/trainers" class="btn btn-outline-secondary btn-sm text-nowrap px-3 me-2">
          調教師
        </nuxt-link>

        <nuxt-link to="/races" class="btn btn-outline-secondary btn-sm text-nowrap px-3 me-3">
          レース一覧
        </nuxt-link>

        <div class="input-group input-group-sm" style="width: 360px;">
          <span class="input-group-text">検索</span>
          <input
            v-model.trim="q"
            type="text"
            class="form-control"
            placeholder="馬名で絞り込み"
            aria-label="検索"
          />
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
            <col style="width:220px;">  <!-- 馬名 -->
            <col style="width:90px;">   <!-- 性 / 年 -->
            <col style="width:300px;">  <!-- 父 / 母父 -->
            <col style="width:160px;">  <!-- 調教師 -->
            <col style="width:120px;">  <!-- 所属トレセン -->
            <col>                       <!-- 生産者 -->
            <col style="width:240px;">  <!-- レース/登録ボタン -->
          </colgroup>
          <thead class="table-light">
            <tr>
              <th>馬名</th>
              <th>性 / 年</th>
              <th>父 / 母父</th>
              <th>調教師</th>
              <th>所属トレセン</th>
              <th>生産者</th>
              <th class="text-end pe-3">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="h in filtered"
              :key="h.id"
              class="table-row-click"
              @click="goEdit(h.id)"
            >
              <td class="fw-semibold">
                <nuxt-link :to="`/horse/${h.id}/edit`" class="text-decoration-none" @click.stop>
                  {{ h.name }}
                </nuxt-link>
              </td>
              <td>{{ formatSexAge(h.sex, h.birth_date) }}</td>
              <td class="text-truncate" style="max-width: 260px;">
                {{ formatParents(h.sire, h.bloodmare_sire) }}
              </td>
              <td>{{ h.trainer || '—' }}</td>
              <td>{{ h.training_center_name || '—' }}</td>
              <td class="text-truncate" style="max-width: 220px;">
                {{ h.breeder || '—' }}
              </td>
              <td class="text-end cell-nowrap pe-3">
                <!-- 今日以降の登録があればバッジで表示（レース名 + 日付） -->
                <template v-if="h.upcoming_race_name">
                  <span class="badge rounded-pill bg-info-subtle text-info-emphasis me-2 d-inline-block race-badge"
                        :title="`${h.upcoming_race_name}（${h.upcoming_race_date}）`">
                    {{ h.upcoming_race_name }}（{{ h.upcoming_race_date }}）
                  </span>
                </template>
                <!-- ない場合は「レースに登録」ボタン -->
                <template v-else>
                  <button class="btn btn-sm btn-outline-success me-2" @click.stop="openRegisterRace(h)">
                    レースに登録
                  </button>
                </template>
                <nuxt-link
                  :to="`/horse/${h.id}/edit`"
                  class="btn btn-sm btn-outline-primary"
                  @click.stop
                >
                  編集
                </nuxt-link>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="7" class="text-center text-muted py-3">該当する馬が見つかりません</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- レース登録モーダル（既存のものがあればそれを使用） -->
    <div class="modal fade" id="raceRegisterModal" tabindex="-1" role="dialog" aria-hidden="true"></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import type { Horse } from '~/types/horse'

type HorseRow = Horse & {
  training_center_name?: string | null
  upcoming_race_name?: string | null
  upcoming_race_date?: string | null
}

export default Vue.extend({
  name: 'HorseListPage',
  head: { title: '競走馬一覧' },
  data() {
    return {
      horses: [] as HorseRow[],
      loading: true,
      error: '',
      q: '',
    }
  },
  async mounted() {
    try {
      const rows: HorseRow[] = await this.$axios.$get('/api/horses')
      this.horses = rows
    } catch (e: any) {
      this.error = e?.response?.data?.error ?? e?.message ?? 'unknown error'
    } finally {
      this.loading = false
    }
  },
  computed: {
    filtered(): HorseRow[] {
      if (!this.q) return this.horses
      const qLower = this.q.toLowerCase()
      return this.horses.filter(h => (h.name ?? '').toLowerCase().includes(qLower))
    },
  },
  methods: {
    goEdit(id: number) {
      this.$router.push(`/horse/${id}/edit`)
    },
    openRegisterRace(h: HorseRow) {
      this.$router.push(`/horse/${h.id}/edit?registerRace=1`) // 既存の登録UIに遷移する等、運用に合わせて
    },
    // 競走馬の年齢：今年 - 生年
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
    formatParents(sire?: string | null, bmsire?: string | null): string {
      const a = (sire || '').trim()
      const b = (bmsire || '').trim()
      if (a && b) return `${a} / ${b}`
      if (a) return a
      if (b) return b
      return '—'
    },
  },
})
</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
.table thead th { font-weight: 700; }
.card { border-radius: 1rem; }

/* 明るい水色×白、ホバーは蛍光シアン寄り（既存の配色） */
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

/* 行を1行に収めるための詰め設定 */
.horse-table td, .horse-table th {
  padding-top: .45rem;
  padding-bottom: .45rem;
  line-height: 1.25;
}
.cell-nowrap { white-space: nowrap; }             /* 操作セルの折り返しを禁止 */
.race-badge { white-space: nowrap; vertical-align: middle; } /* レース名バッジも1行で省略 */
.horse-table th:nth-child(1), .horse-table td:nth-child(1) { padding-right:.25rem; }
.horse-table th:nth-child(2), .horse-table td:nth-child(2) { padding-left:.25rem; }
.table-row-click { cursor: pointer; }
</style>
