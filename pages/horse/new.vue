<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2">
      <h1 class="h5 m-0 fw-bold">競走馬登録</h1>
      <nuxt-link to="/" class="btn btn-outline-secondary btn-sm text-nowrap px-3">一覧へ戻る</nuxt-link>
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
                <span v-if="nameError" class="ms-2 text-danger small">{{ nameError }}</span>
              </label>
              <input
                v-model.trim="form.name"
                @blur="onNameBlur"
                type="text"
                class="form-control"
                placeholder="例）レガレイラ"
                required
              />
            </div>

            <div class="col-md-3">
              <label class="form-label mb-1">性別</label>
              <select v-model="form.sex" class="form-select">
                <option value="">—</option>
                <option value="牡">牡</option>
                <option value="牝">牝</option>
                <option value="セ">セ</option>
              </select>
            </div>

            <div class="col-md-3">
              <label class="form-label mb-1">生年月日</label>
              <input v-model="form.birth_date" type="date" class="form-control" />
            </div>
          </div>

          <!-- 所属トレセン / 調教師 -->
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
              <input v-model.trim="form.trainer" type="text" class="form-control" placeholder="例）中内田充" />
            </div>
          </div>

          <!-- オーナー / 生産者 -->
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

          <!-- 血統 -->
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

          <!-- メモ -->
          <div class="mt-3">
            <label class="form-label mb-1">メモ</label>
            <textarea v-model="form.memo" rows="4" class="form-control" placeholder="自由記述（戦績・所感など）"></textarea>
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
      nameError: '',
      submitting: false,
      error: '',
    }
  },
  async mounted() {
    try {
      this.centers = await this.$axios.$get('/api/training-centers')
    } catch (e: any) {
      this.error = e?.message ?? '初期データの読み込みに失敗しました'
    }
  },
  methods: {
    async onNameBlur() {
      const name = (this.form.name || '').trim()
      if (!name) { this.nameError = ''; return }
      try {
        const r = await this.$axios.$get('/api/horses/check-name', { params: { name } })
        this.nameError = r?.exists ? '同名の馬が既に登録されています' : ''
      } catch (_e) {
        this.nameError = '重複チェックに失敗しました'
      }
    },
    async submit() {
      this.error = ''
      await this.onNameBlur()
      if (this.nameError) return

      try {
        this.submitting = true
        const body = { ...this.form }
        const r = await this.$axios.$post('/api/horses', body)
        if (r?.id) this.$router.push('/')
      } catch (e: any) {
        this.error = e?.response?.data?.error ?? e?.message ?? '登録に失敗しました'
      } finally {
        this.submitting = false
      }
    },
  },
})
</script>
