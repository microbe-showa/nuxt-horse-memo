<template>
  <div class="container py-4">
    <h1 class="h5 mb-2">
      調教師 編集
      <small v-if="form.trainer_name" class="text-muted ms-2">（{{ form.trainer_name }}）</small>
    </h1>

    <div class="card shadow-sm">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="row g-3">
            <div class="col-md-4">
              <div v-if="isNameDup || dupCheckError" class="text-danger mb-1">
                {{ isNameDup ? 'この調教師名はすでに登録されています' : '重複確認に失敗しました。時間をおいて再度お試しください' }}
              </div>
              <label class="form-label">調教師名 <span class="text-danger">*</span></label>
              <input
                v-model.trim="form.trainer_name"
                @blur="checkDupTrainerName"
                type="text"
                class="form-control"
                required
                maxlength="10"
              />
            </div>

            <div class="col-md-4">
              <label class="form-label">調教師名（カナ）</label>
              <input
                v-model.trim="form.trainer_name_kana"
                type="text"
                class="form-control"
                maxlength="30"
              />
              <small class="text-muted">※ 並び順に使用（全角カナ推奨）</small>
            </div>

            <div class="col-md-4">
              <label class="form-label">所属トレセン <span class="text-danger">*</span></label>
              <select v-model.number="form.training_center_id" class="form-select" required>
                <option :value="undefined" disabled>選択してください</option>
                <option v-for="tc in trainingCenters" :key="tc.training_center_id" :value="tc.training_center_id">
                  {{ tc.training_center_name }}
                </option>
              </select>
            </div>
          </div>

          <div class="d-flex gap-2 mt-4">
            <button type="submit" class="btn btn-primary"
              :disabled="submitting || isNameDup || dupCheckError || !form.trainer_name || form.training_center_id === undefined">
              {{ submitting ? '更新中...' : '更新する' }}
            </button>
            <nuxt-link to="/trainers" class="btn btn-outline-secondary">戻る</nuxt-link>
          </div>

          <div v-if="loading" class="alert alert-secondary mt-3">読み込み中...</div>
          <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
          <div v-if="notice" class="alert alert-success mt-3">{{ notice }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import type { TrainingCenter } from '~/types/horse'

type TrainerForm = {
  trainer_name: string
  trainer_name_kana?: string
  training_center_id?: number
}

export default Vue.extend({
  name: 'TrainerEditPage',
  head(): any {
    const n = (this as any).form?.trainer_name?.trim()
    return { title: n && n.length ? n : '…' }
  },
  data() {
    return {
      id: Number(this.$route.params.id),
      trainingCenters: [] as TrainingCenter[],
      form: { trainer_name: '', trainer_name_kana: '', training_center_id: undefined } as TrainerForm,
      loading: true,
      submitting: false,
      error: '',
      notice: '',
      isNameDup: false,
      dupCheckError: false,
    }
  },
  async mounted() {
    try {
      const [centers, row] = await Promise.all([
        this.$axios.$get('/api/training-centers'),
        this.$axios.$get(`/api/trainers/${this.id}`),
      ])
      this.trainingCenters = centers
      this.form = {
        trainer_name: row.trainer_name || '',
        trainer_name_kana: row.trainer_name_kana || '',
        training_center_id: row.training_center_id,
      }
    } catch (e: any) {
      this.error = e?.response?.data?.error ?? e?.message ?? '読み込みに失敗しました'
    } finally {
      this.loading = false
    }
  },
  watch: {
    'form.trainer_name'() {
      this.isNameDup = false
      this.dupCheckError = false
    },
  },
  methods: {
    async checkDupTrainerName() {
      const name = (this.form.trainer_name || '').trim()
      this.isNameDup = false
      this.dupCheckError = false
      if (!name) return
      try {
        const r = await this.$axios.$get('/api/trainers/exists', {
          params: { name, exclude_id: this.id },
        }) as { exists: boolean }
        this.isNameDup = !!r.exists
      } catch (e) {
        console.error('[checkDupTrainerName] failed:', e)
        this.dupCheckError = true
      }
    },
    async submit() {
      this.error = ''
      if (!this.form.trainer_name || this.form.training_center_id === undefined || this.isNameDup || this.dupCheckError) return
      try {
        this.submitting = true
        await this.$axios.$put(`/api/trainers/${this.id}`, this.form)
        this.$router.push('/trainers')
      } catch (e: any) {
        if (e?.response?.status === 409) {
          this.isNameDup = true
          return (this.error = 'この調教師名はすでに登録されています')
        }
        this.error = e?.response?.data?.error ?? e?.message ?? '更新に失敗しました'
      } finally {
        this.submitting = false
      }
    },
  },
})
</script>
