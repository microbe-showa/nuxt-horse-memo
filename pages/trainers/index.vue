<template>
  <div class="container py-4">
    <!-- ヘッダー -->
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2">
      <h1 class="h4 m-0 fw-bold">調教師一覧</h1>

      <div class="d-flex align-items-center ms-auto flex-nowrap">
        <nuxt-link to="/trainers/new" class="btn btn-primary btn-sm text-nowrap px-3 me-2">
          登録
        </nuxt-link>
        <nuxt-link to="/" class="btn btn-outline-secondary btn-sm text-nowrap px-3 me-2">
          競走馬一覧
        </nuxt-link>
        <div class="input-group input-group-sm" style="width: 360px;">
          <span class="input-group-text">検索</span>
          <input
            v-model.trim="q"
            type="text"
            class="form-control"
            placeholder="調教師名（漢字/カナ）で絞り込み"
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
        <table class="table table-hover table-striped m-0 align-middle trainer-table">
          <colgroup>
            <col style="width: 240px;"> <!-- 調教師名（漢字） -->
            <col style="width: 240px;"> <!-- 調教師名（カナ） -->
            <col style="width: 160px;"> <!-- 所属トレセン -->
          </colgroup>
          <thead class="table-light">
            <tr>
              <th colspan="2">調教師名</th>  <!-- ★ カナ列を内包 -->
              <th>所属トレセン</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in filtered"
              :key="t.trainer_id"
              class="table-row-click"
              @click="goEdit(t.trainer_id)"
            >
              <td class="fw-semibold">
                <nuxt-link
                  :to="`/trainers/${t.trainer_id}/edit`"
                  class="text-decoration-none"
                  @click.stop
                >
                  {{ t.trainer_name }}
                </nuxt-link>
              </td>
              <td class="text-muted">{{ t.trainer_name_kana || '—' }}</td>
              <td>{{ t.training_center_name || '—' }}</td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="3" class="text-center text-muted py-4">該当する調教師が見つかりません</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import type { Trainer } from '~/types/trainer'

export default Vue.extend({
  name: 'TrainerListPage',
  head: { title: '調教師一覧' },
  data() {
    return {
      trainers: [] as Trainer[],
      loading: true,
      error: '',
      q: '',
    }
  },
  async mounted() {
    try {
      const rows: Trainer[] = await this.$axios.$get('/api/trainers')
      this.trainers = rows
    } catch (e: any) {
      this.error = e?.response?.data?.error ?? e?.message ?? 'API未実装です（/api/trainers）'
    } finally {
      this.loading = false
    }
  },
  computed: {
    filtered(): Trainer[] {
      if (!this.q) return this.trainers
      const q = this.q.toLowerCase()
      return this.trainers.filter(t =>
        (t.trainer_name || '').toLowerCase().includes(q) ||
        (t.trainer_name_kana || '').toLowerCase().includes(q) ||
        (t.training_center_name || '').toLowerCase().includes(q)
      )
    },
  },
  methods: {
    goEdit(id: number) {
      this.$router.push(`/trainers/${id}/edit`)
    },
  },
})
</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
.table thead th { font-weight: 700; }
.card { border-radius: 1rem; }

.trainer-table{
  --bs-table-bg: #fff;
  --bs-table-striped-bg: #eaf6ff;
  --bs-table-striped-color: inherit;
  --bs-table-hover-bg: #66fff2;
  --bs-table-hover-color: #000;
}
.trainer-table.table-striped > tbody > tr:nth-of-type(odd) > * {
  background-color: var(--bs-table-striped-bg) !important;
}
.trainer-table.table-hover tbody tr:hover > * {
  background-color: var(--bs-table-hover-bg) !important;
  color: var(--bs-table-hover-color) !important;
}

/* 行クリックのポインタ */
.table-row-click { cursor: pointer; }
</style>
