<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2">
      <h1 class="h5 m-0 fw-bold">競走馬登録</h1>
      <nuxt-link to="/" class="btn btn-outline-secondary btn-sm text-nowrap px-3">競走馬一覧</nuxt-link>
    </div>

    <div class="card border-0 shadow">
      <div class="card-body">
        <!-- フォーム -->
        <form id="horseForm" ref="horseForm" @submit.prevent="submit">
          <!-- 馬名 / 性別 / 生年月日 -->
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label mb-1" for="horse-name">
                馬名 <span class="text-danger">*</span>
                <span v-if="nameError" class="ms-2 text-danger small">{{ nameError }}</span>
                <span v-else-if="nameWarn" class="ms-2 text-warning small">{{ nameWarn }}</span>
              </label>
              <input
                id="horse-name"
                ref="nameInput"
                v-model.trim="form.name"
                @blur="onNameBlur"
                type="text"
                class="form-control"
                required
              />
            </div>

            <div class="col-md-2">
              <label class="form-label mb-1" for="horse-sex">性別</label>
              <select id="horse-sex" v-model="form.sex" class="form-select">
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

            <div class="col-md-4">
              <label class="form-label mb-1" for="horse-upcoming-race">出走登録（今日以降）</label>
              <select id="horse-upcoming-race" v-model="selectedRaceId" class="form-select">
                <option :value="null">— 登録しない —</option>
                <option v-for="r in upcomingRaces" :key="r.race_id" :value="r.race_id">
                  {{ r.race_date }} ｜ {{ r.race_name }}
                </option>
              </select>
            </div>
          </div>

          <div class="row g-3 mt-2">
            <div class="col-md-4">
              <label class="form-label mb-1" for="owner">馬主</label>
              <input id="owner" v-model.trim="form.owner" type="text" class="form-control" />
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1" for="breeder">生産者</label>
              <input id="breeder" v-model.trim="form.breeder" type="text" class="form-control" />
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

          <div class="mt-4 d-flex gap-2 flex-wrap">
            <button
              class="btn btn-primary"
              type="submit"
              :disabled="submitting || !!nameError"
              @click="submitAndContinue"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              さらに登録する
            </button>
            <button
              class="btn btn-outline-primary"
              type="submit"
              :disabled="submitting || !!nameError"
              @click="submitAndGoList"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              登録後、競走馬一覧画面に遷移する
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
    <div v-if="nameWarn" class="alert alert-warning mt-3">{{ nameWarn }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { getAutoGrandsire, getAutoBreeder } from '~/plugins/regist-horse-helper'

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
type UpcomingRace = { race_id: number; race_name: string; race_date: string }

const createEmptyForm = (): Form => ({
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
})

export default Vue.extend({
  name: 'HorseNewPage',
  head: { title: '競走馬登録' },
  data() {
    return {
      form: createEmptyForm(),
      centers: [] as Center[],
      upcomingRaces: [] as UpcomingRace[],
      selectedRaceId: null as number | null,

      nameError: '馬名を入力してください',
      nameWarn: '', // 通信失敗時の黄色警告（→ボタンは無効化しない）
      submitting: false,
      error: '',
    }
  },
  async mounted() {
    try {
      const [centers, races] = await Promise.all([
        this.$axios.$get('/api/training-centers'),
        this.$axios.$get('/api/races-upcoming'),
      ])
      this.centers = centers
      this.upcomingRaces = races
      this.$nextTick(() => {
        const el = (this.$refs.nameInput as HTMLInputElement | undefined)
        el?.focus?.()
      })
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

    // 馬名チェック
    async onNameBlur() {
      const name = (this.form.name || '').trim()
      this.nameWarn = ''
      if (!name) {
        this.nameError = '馬名を入力してください'
        return
      }
      try {
        const r = await this.$axios.$get('/api/check/horse-name', {
          params: { name, excludeId: 0 },
        })
        this.nameError = r?.exists ? '同名の馬が既に登録されています' : ''
      } catch {
        // 通信失敗はブロックせず警告のみ
        this.nameError = ''
        this.nameWarn = '重複チェックに失敗しました（通信状況を確認してください）'
      }
    },

    async validateBeforeSubmit(): Promise<boolean> {
      this.error = ''
      await this.onNameBlur()
      if (this.nameError) return false
      return true
    },

    // 登録の共通処理：馬登録→（必要なら）出走登録
    async createHorseWithOptionalEntry(): Promise<number> {
      // 1) 競走馬を登録
      const res = await this.$axios.$post('/api/horses', this.form)
      const id = Number(res?.id)
      if (!id) throw new Error('登録に失敗しました（idが返りませんでした）')

      // 2) 出走登録（選択されていれば）
      if (this.selectedRaceId) {
        await this.$axios.$post(`/api/horses/${id}/upsert-upcoming-entry`, {
          race_id: this.selectedRaceId,
        })
      }

      return id
    },

    resetForNext() {
      this.form = createEmptyForm()
      this.selectedRaceId = null
      this.nameError = '馬名を入力してください'
      this.nameWarn = ''
      this.error = ''
      this.$nextTick(() => {
        const el = (this.$refs.nameInput as HTMLInputElement | undefined)
        el?.focus?.()
      })
    },

    // 既存挙動：登録→一覧へ
    async submitAndGoList() {
      const ok = await this.validateBeforeSubmit()
      if (!ok) return

      try {
        this.submitting = true
        await this.createHorseWithOptionalEntry()
        this.$router.push('/')
      } catch (e: any) {
        this.error = e?.response?.data?.error ?? e?.message ?? '登録に失敗しました'
      } finally {
        this.submitting = false
      }
    },

    // 新規：登録→画面に残って連続登録
    async submitAndContinue() {
      const ok = await this.validateBeforeSubmit()
      if (!ok) return

      try {
        this.submitting = true
        await this.createHorseWithOptionalEntry()
        this.resetForNext()
      } catch (e: any) {
        this.error = e?.response?.data?.error ?? e?.message ?? '登録に失敗しました'
      } finally {
        this.submitting = false
      }
    },
    async submit() {
      await this.submitAndGoList()
    },
  },

  watch: {
    // 父の入力を監視して父父を自動入力
    'form.sire'(newSire: string) {
      const grandsire = getAutoGrandsire(newSire)
      if (grandsire) {
        this.form.grandsire = grandsire
      }
    },
    // 馬主の入力を監視して生産者を自動入力
    'form.owner'(newOwner: string) {
      const breeder = getAutoBreeder(newOwner)
      if (breeder) {
        this.form.breeder = breeder
      }
    },
  },
})
</script>
