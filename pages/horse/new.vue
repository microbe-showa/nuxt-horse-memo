<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2">
      <h1 class="h5 m-0 fw-bold">競走馬登録</h1>
      <nuxt-link to="/" class="btn btn-outline-secondary btn-sm text-nowrap px-3">戻る</nuxt-link>
    </div>

    <div class="card border-0 shadow">
      <div class="card-body">
        <!-- フォーム -->
        <form @submit.prevent="submit">
          <!-- 馬名 / 性別 / 生年月日 -->
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label mb-1">
                馬名 <span class="text-danger">*</span>
                <!-- 既存名エラーだけボタン無効化。通信失敗は警告表示だけでブロックしない -->
                <span v-if="nameError" class="ms-2 text-danger small">{{ nameError }}</span>
                <span v-else-if="nameWarn" class="ms-2 text-warning small">{{ nameWarn }}</span>
              </label>
              <input
                v-model.trim="form.name"
                @blur="onNameBlur"
                type="text"
                class="form-control"
                required
              />
            </div>

            <div class="col-md-2">
              <label class="form-label mb-1">性別</label>
              <select v-model="form.sex" class="form-select">
                <option value="">—</option>
                <option value="牡">牡</option>
                <option value="牝">牝</option>
                <option value="セ">セ</option>
              </select>
            </div>

            <div class="col-md-2">
              <label class="form-label mb-1">生年月日</label>
              <input v-model="form.birth_date" type="date" class="form-control" />
            </div>

            <div class="col-md-2">
              <label class="form-label mb-1">年齢</label>
              <input :value="formatAge(form.birth_date)" type="text" class="form-control" disabled>
            </div>
          </div>

          <div class="row g-3 mt-2">
            <div class="col-md-3">
              <label class="form-label mb-1">所属トレセン</label>
              <select v-model="form.training_center_id" class="form-select">
                <option :value="null">—</option>
                <option v-for="c in centers" :key="c.training_center_id" :value="c.training_center_id">
                  {{ c.training_center_name }}
                </option>
              </select>
            </div>

            <div class="col-md-5">
              <label class="form-label mb-1">調教師</label>
              <input v-model.trim="form.trainer" type="text" class="form-control" />
            </div>
          </div>

          <div class="row g-3 mt-2">
            <div class="col-md-4">
              <label class="form-label mb-1">馬主</label>
              <input v-model.trim="form.owner" type="text" class="form-control" />
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1">生産者</label>
              <input v-model.trim="form.breeder" type="text" class="form-control" />
            </div>
          </div>

          <div class="row g-3 mt-2">
            <div class="col-md-4">
              <label class="form-label mb-1">父</label>
              <input v-model.trim="form.sire" type="text" class="form-control" />
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1">母</label>
              <input v-model.trim="form.dam" type="text" class="form-control" />
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1">母父</label>
              <input v-model.trim="form.bloodmare_sire" type="text" class="form-control" />
            </div>
          </div>

          <div class="row g-3 mt-2">
            <div class="col-md-4">
              <label class="form-label mb-1">父父</label>
              <input v-model.trim="form.grandsire" type="text" class="form-control" />
            </div>
          </div>

          <div class="mt-3">
            <label class="form-label mb-1">メモ</label>
            <textarea v-model="form.memo" rows="6" class="form-control"></textarea>
          </div>

          <div class="mt-4 d-flex gap-2">
            <button class="btn btn-primary" type="submit" :disabled="submitting || !!nameError">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              登録
            </button>
            <nuxt-link to="/" class="btn btn-outline-secondary">戻る</nuxt-link>
          </div>
        </form>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

type Form = {
  name: string
  sex?: string | null
  birth_date?: string | null
  trainer?: string | null
  training_center_id?: number | null
  owner?: string | null
  breeder?: string | null
  sire?: string | null
  dam?: string | null
  bloodmare_sire?: string | null
  grandsire?: string | null
  memo: string
}
type Center = { training_center_id: number; training_center_name: string }

export default Vue.extend({
  name: 'HorseNewPage',
  head: { title: '競走馬登録' },
  data() {
    return {
      form: {
        name: '',
        sex: '',
        birth_date: '',
        trainer: '',
        training_center_id: null,
        owner: '',
        breeder: '',
        sire: '',
        dam: '',
        bloodmare_sire: '',
        grandsire: '',
        memo: '',
      } as Form,
      centers: [] as Center[],
      nameError: '', // 重複時の赤エラー（→ボタン無効）
      nameWarn: '', // 通信失敗時の黄色警告（→ボタンは無効化しない）
      submitting: false,
      error: '',
    }
  },
  async mounted() {
    try {
      this.centers = await this.$axios.$get('/api/training-centers')
    } catch (e: any) {
      this.error = e?.response?.data?.error ?? e?.message ?? '初期化に失敗しました'
    }
  },
  methods: {
    formatAge(dateStr?: string | null) {
      if (!dateStr) return '—'
      const m = dateStr.match(/^(\d{4})-/)
      if (!m) return '—'
      const birthYear = Number(m[1])
      const currentYear = new Date().getFullYear()
      const age = currentYear - birthYear
      return age >= 0 ? `${age}歳` : '—'
    },
    async onNameBlur() {
      this.nameError = ''
      this.nameWarn = ''
      const name = (this.form.name || '').trim()
      if (!name) return
      try {
        // ★ ここを /api/check/horse-name に統一
        const r = await this.$axios.$get('/api/check/horse-name', { params: { name } })
        this.nameError = r?.exists ? '同名の馬が既に登録されています' : ''
      } catch {
        // 通信失敗はブロックせず警告のみ
        this.nameWarn = '重複チェックに失敗しました（通信）'
      }
    },
    async submit() {
      this.error = ''
      await this.onNameBlur()
      if (this.nameError) return

      try {
        this.submitting = true
        const body = { ...this.form }
        await this.$axios.$post('/api/horses', body)
        this.$router.push('/')
      } catch (e: any) {
        this.error = e?.response?.data?.error ?? e?.message ?? '登録に失敗しました'
      } finally {
        this.submitting = false
      }
    },
  },
})
</script>