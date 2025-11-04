<template>
  <div class="container py-4">
    <!-- ヘッダー：タイトル / 更新 / 戻る -->
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2">
      <h1 class="h5 m-0 fw-bold">{{ form.name || '競走馬編集' }}</h1>
      <div class="d-flex align-items-center gap-2">
        <!-- ★ ここが新規（下の更新ボタンと同じロジック） -->
        <button
          class="btn btn-primary btn-sm text-nowrap px-3"
          :disabled="submitting || !!nameError"
          @click="submit"
          type="button"
        >
          <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
          更新
        </button>
        <nuxt-link :to="backTo" class="btn btn-outline-secondary btn-sm text-nowrap px-3">戻る</nuxt-link>
      </div>
    </div>

    <div class="card border-0 shadow">
      <div class="card-body">
        <form @submit.prevent="submit">
          <!-- 1. メモ（最上段へ移動） -->
          <div class="mb-3">
            <label class="form-label mb-1">メモ</label>
            <textarea
              v-model="form.memo"
              rows="6"
              class="form-control"
              placeholder="自由記述（戦績・所感など）"
            ></textarea>
          </div>

          <!-- 2. 基本情報（馬名・性別・生年月日・年齢） -->
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

          <!-- 3. 所属・調教師 -->
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

          <!-- 4. 馬主・生産者 -->
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

          <!-- 5. 血統 -->
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

          <!-- 6. フォールバックのボタン行（Enter対応やモバイル用） -->
          <div class="mt-4 d-flex gap-2">
            <button class="btn btn-primary" type="submit" :disabled="submitting || !!nameError">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              更新
            </button>
            <nuxt-link :to="backTo" class="btn btn-outline-secondary">戻る</nuxt-link>
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
  id: number
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
  name: 'HorseEditPage',
  head() {
    const t = (this as any).form?.name
    return { title: t ? `${t}` : '競走馬編集' }
  },
  data() {
    return {
      id: Number(this.$route.params.id),
      form: {
        id: 0,
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
      // （必要に応じて）出走登録の現在値を保持している場合はここに selectedRaceId* を持たせる
      selectedRaceId: null as number | null,
      selectedRaceIdInitial: null as number | null,
    }
  },
  computed: {
    backTo(): string {
      const q = this.$route.query || {}
      if (q.from === 'entries' && q.raceId) {
        return `/races/${q.raceId}/entries`
      }
      return '/'
    },
  },
  async mounted() {
    try {
      const [horse, centers] = await Promise.all([
        this.$axios.$get(`/api/horses/${this.id}`),
        this.$axios.$get('/api/training-centers'),
      ])
      this.form = { ...horse, id: this.id }
      this.centers = centers
      // 出走登録情報を持っている場合はここで初期化してください
      // this.selectedRaceId = horse.upcoming_race_id ?? null
      this.selectedRaceIdInitial = this.selectedRaceId
    } catch (e: any) {
      this.error = e?.response?.data?.error ?? e?.message ?? '読み込みに失敗しました'
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
      const name = (this.form.name || '').trim()
      if (!name) { this.nameError = ''; return }
      try {
        const r = await this.$axios.$get('/api/check/horse-name', {
          params: { name, excludeId: this.id },
        })
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
        // 1) 馬の更新
        await this.$axios.$put(`/api/horses/${this.id}`, { ...this.form })

        // 2) 出走登録の差し替え（必要な場合のみ）
        if (this.selectedRaceId !== this.selectedRaceIdInitial) {
          await this.$axios.$post(`/api/horses/${this.id}/upsert-upcoming-entry`, {
            race_id: this.selectedRaceId ?? null,
          })
        }

        this.$router.push(this.backTo)
      } catch (e: any) {
        this.error = e?.response?.data?.error ?? e?.message ?? '更新に失敗しました'
      } finally {
        this.submitting = false
      }
    },
  },
})
</script>
