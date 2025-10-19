<template>
  <div class="container py-4">
    <h1 class="h5 mb-3">レース登録</h1>

    <div class="card shadow-sm">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="row g-3">
            <!-- レース名 -->
            <div class="col-md-6">
              <label class="form-label">レース名 <span class="text-danger">*</span></label>
              <input
                v-model.trim="form.race_name"
                type="text"
                class="form-control"
                required
                maxlength="20"
                placeholder="例）日本ダービー"
              />
              <small class="text-muted">最大20文字</small>
            </div>

            <!-- 開催日 -->
            <div class="col-md-3">
              <label class="form-label">開催日 <span class="text-danger">*</span></label>
              <input
                v-model="form.race_date"
                type="date"
                class="form-control"
                required
              />
            </div>

            <!-- 競馬場 -->
            <div class="col-md-3">
              <label class="form-label">競馬場 <span class="text-danger">*</span></label>
              <select v-model.number="form.race_cource_id" class="form-select" required>
                <option :value="undefined" disabled>選択してください</option>
                <option v-for="c in courseOptions" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>

            <!-- レース種別 -->
            <div class="col-md-3">
              <label class="form-label">レース種別 <span class="text-danger">*</span></label>
              <select v-model.number="form.race_type_id" class="form-select" required>
                <option :value="undefined" disabled>選択してください</option>
                <option v-for="t in typeOptions" :key="t.id" :value="t.id">
                  {{ t.name }}
                </option>
              </select>
            </div>

            <!-- 距離 -->
            <div class="col-md-3">
              <label class="form-label">距離（m）<span class="text-danger">*</span></label>
              <input
                v-model.number="form.distance"
                type="number"
                class="form-control"
                required
                min="1"
                max="9999"
                placeholder="例）2400"
              />
            </div>

            <!-- ペース -->
            <div class="col-md-3">
              <label class="form-label">ペース</label>
              <select v-model.number="form.race_pace" class="form-select">
                <option :value="undefined" disabled>選択してください</option>
                <option v-for="p in paceOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <small class="text-muted">任意（未選択可）</small>
            </div>

            <!-- コメント -->
            <div class="col-12">
              <label class="form-label">コメント</label>
              <textarea
                v-model.trim="form.comment"
                class="form-control"
                rows="3"
                maxlength="200"
                placeholder="メモ（最大200文字）"
              ></textarea>
            </div>
          </div>

          <div class="d-flex gap-2 mt-4">
            <button type="submit" class="btn btn-primary" :disabled="submitting || !isValid">
              {{ submitting ? '登録中...' : '登録する' }}
            </button>
            <nuxt-link to="/races" class="btn btn-outline-secondary">戻る</nuxt-link>
          </div>

          <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
          <div v-if="notice" class="alert alert-success mt-3">{{ notice }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

type RaceForm = {
  race_name: string
  race_date?: string
  race_cource_id?: number
  race_type_id?: number
  distance?: number
  race_pace?: number
  comment?: string
}

export default Vue.extend({
  name: 'RaceNewPage',
  head: { title: 'レース登録' },
  data() {
    return {
      form: {
        race_name: '',
        race_date: '',
        race_cource_id: undefined,
        race_type_id: undefined,
        distance: undefined,
        race_pace: undefined,
        comment: '',
      } as RaceForm,
      submitting: false,
      error: '',
      notice: '',
      // ※ IDは一覧ページの courseMap と合わせています
      courseOptions: [
        { id: 5, name: '東京' }, { id: 6, name: '中山' }, { id: 8, name: '京都' }, { id: 9, name: '阪神' },
        { id: 1, name: '札幌' }, { id: 2, name: '函館' }, { id: 3, name: '福島' }, { id: 4, name: '新潟' },
        { id: 7, name: '中京' }, { id: 10, name: '小倉' },
      ],
      typeOptions: [
        { id: 1, name: '芝' },
        { id: 2, name: 'ダート' },
        { id: 3, name: 'その他' },
      ],
      paceOptions: [
        { id: 1, name: 'ハイ' },
        { id: 2, name: 'ミドル' },
        { id: 3, name: 'スロー' },
      ],
    }
  },
  computed: {
    isValid(): boolean {
      const f = this.form
      return Boolean(
        f.race_name &&
        f.race_date &&
        Number.isFinite(f.race_cource_id as any) &&
        Number.isFinite(f.race_type_id as any) &&
        Number.isFinite(f.distance as any) &&
        (f!.distance! >= 1 && f!.distance! <= 9999)
      )
    },
  },
  methods: {
    async submit() {
      this.error = ''
      if (!this.isValid) return
      try {
        this.submitting = true
        await this.$axios.$post('/api/races', this.form)
        this.$router.push('/races')
      } catch (e: any) {
        this.error = e?.response?.data?.error ?? e?.message ?? '登録に失敗しました'
      } finally {
        this.submitting = false
      }
    },
  },
})
</script>

<style scoped>
.card { border-radius: 1rem; }
</style>
