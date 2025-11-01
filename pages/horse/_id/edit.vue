<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap bg-white rounded-3 shadow-sm px-3 py-2">
      <h1 class="h5 m-0 fw-bold">{{ form.name || '競走馬編集' }}</h1>
      <nuxt-link :to="backTo" class="btn btn-outline-secondary btn-sm text-nowrap px-3">戻る</nuxt-link>
    </div>

    <div class="card border-0 shadow">
      <div class="card-body">
        <form @submit.prevent="submit">
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

          <!-- 出走予定（あれば表示） -->
          <div v-if="form.upcoming_race_id" class="row g-2 align-items-center mt-2">
            <label class="col-sm-2 col-form-label">出走予定</label>
            <div class="col-sm-7">
              <div class="form-control-plaintext">
                {{ formatYmdSlash(form.upcoming_race_date) }}　{{ form.upcoming_race_name }}
              </div>
            </div>
            <div class="col-sm-3 text-sm-end">
              <button class="btn btn-outline-danger btn-sm" type="button" @click="cancelEntry">
                出走取消
              </button>
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
              <label class="form-label mb-1">出走登録（今日以降）</label>
              <select v-model="selectedRaceId" class="form-select">
                <option :value="null">— 登録しない —</option>
                <option v-for="r in upcomingRaces" :key="r.race_id" :value="r.race_id">
                  {{ r.race_date }} ｜ {{ r.race_name }}
                </option>
              </select>
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
type UpcomingRace = { race_id: number; race_name: string; race_date: string }

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
      upcomingRaces: [] as UpcomingRace[],
      selectedRaceId: null as number | null,
      selectedRaceIdInitial: null as number | null,
      nameError: '',
      submitting: false,
      error: '',
    }
  },
  computed: {
    // クエリに from=entries & raceId が来ていれば出走馬一覧へ戻す
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
      const [horse, centers, races, entry] = await Promise.all([
        this.$axios.$get(`/api/horses/${this.id}`),
        this.$axios.$get('/api/training-centers'),
        this.$axios.$get('/api/races-upcoming'),
        this.$axios.$get(`/api/horses/${this.id}/upcoming-entry`),
      ])
      this.form = { ...horse, id: this.id }
      this.centers = centers
      this.upcomingRaces = races
      this.selectedRaceId = entry?.race_id ?? null
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
        const registeredHorseInDb = await this.$axios.$get('/api/check/horse-name', {
          params: { name, excludeId: this.id },
        })
        this.nameError = registeredHorseInDb?.exists ? '同名の馬が既に登録されています' : ''
      } catch (_e) {
        // 通信失敗は「注意」扱いにして、送信自体は止めないほうが作業性が良いなら空にする
        this.nameError = ''
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

      // 2) 出走登録：レース選択が「変わった」時だけ呼ぶ（同じなら何もしない）
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
