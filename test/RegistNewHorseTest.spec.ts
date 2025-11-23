import { mount } from '@vue/test-utils'
import HorseNewPage from '@/pages/horse/new.vue'
import { resolve } from 'path'

// breeding-helper をモックして、自動入力の結果をテストしやすくする
jest.mock('@/plugins/breeding-helper', () => ({
  getAutoGrandsire: jest.fn((sire: string) => {
    if (sire === 'キズナ') return 'ディープインパクト'
    if (sire === 'エピファネイア') return 'シンボリクリスエス'
    return null
  }),
  getAutoBreeder: jest.fn((owner: string) => {
    if (owner === 'シルクレーシング') return 'ノーザンファーム'
    if (owner === '近藤旬子') return 'ノーザンファーム'
    return null
  }),
}))

// vm.form を触る時だけ any にキャストする小さいヘルパー
const createWrapper = () => {
  const wrapper = mount(HorseNewPage)
  const vm = wrapper.vm as any
  return { wrapper, vm }
}

describe('HorseNewPage 自動入力ロジック', () => {
  test('父入力 → 父父が自動入力される', async () => {
    const { wrapper, vm } = createWrapper()

    // 初期状態
    expect(vm.form.grandsire).toBe('')

    // 父を入力
    vm.form.sire = 'キズナ'
    await wrapper.vm.$nextTick()

    // 自動で父父が入る
    expect(vm.form.grandsire).toBe('ディープインパクト')
  })

  test('馬主入力 → 生産者が自動入力される', async () => {
    const { wrapper, vm } = createWrapper()

    expect(vm.form.breeder).toBe('')

    vm.form.owner = 'シルクレーシング'
    await wrapper.vm.$nextTick()

    expect(vm.form.breeder).toBe('ノーザンファーム')
  })

  test('ヘルパーが null を返した場合は既存の値を上書きしない', async () => {
    const { wrapper, vm } = createWrapper()

    // 既に手入力されていたケースを想定
    vm.form.grandsire = 'サンデーサイレンス'
    vm.form.breeder = '社台ファーム'

    // マッピングに存在しない父・馬主を入れる
    vm.form.sire = 'ロードカナロア'
    vm.form.owner = '個人馬主A'
    await wrapper.vm.$nextTick()

    // 既存値が維持されていることを確認
    expect(vm.form.grandsire).toBe('サンデーサイレンス')
    expect(vm.form.breeder).toBe('社台ファーム')
  })
})

// 共通：nuxt コンポーネントをマウントするヘルパー
// setImmediateはjsdomにて定義されていないためsetTimeoutを使用する
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const createWrapperWithAxios = (opts?: { nameExists?: boolean; postError?: boolean }) => {
  const $router = { push: jest.fn() }

  const $axios = {
    // GET は URL によって返り値を分ける
    $get: jest.fn((url: string) => {
      if (url === '/api/training-centers') {
        return Promise.resolve([]) // セレクト用
      }
      if (url === '/api/races-upcoming') {
        return Promise.resolve([]) // セレクト用
      }
      if (url === '/api/check/horse-name') {
        // 馬名重複チェック
        return Promise.resolve({ exists: opts?.nameExists ?? false })
      }
      return Promise.resolve({})
    }),
    // POST も URL で分岐
    $post: jest.fn((url: string, body: any) => {
      if (opts?.postError && url === '/api/horses') {
        return Promise.reject(new Error('server error'))
      }
      if (url === '/api/horses') {
        // 新規登録のレスポンス
        return Promise.resolve({ id: 10 })
      }
      if (url === '/api/horses/10/upsert-upcoming-entry') {
        return Promise.resolve({ ok: true })
      }
      return Promise.resolve({})
    }),
  }

  const wrapper = mount(HorseNewPage, {
    mocks: { $axios, $router },
  })
  const vm = wrapper.vm as any
  return { wrapper, vm, $axios, $router }
}

describe('新規登録処理', () => {
  test('出走登録あり → 馬登録＆出走登録＆画面遷移', async () => {
    const { wrapper, vm, $axios, $router } = createWrapperWithAxios()

    // mounted の非同期処理が終わるのを待つ
    await flushPromises()

    // 必須項目など軽くセット
    vm.form.name = 'テストホース'
    vm.form.sex = '牡'
    vm.selectedRaceId = 123

    await vm.submit()

    // 1. 競走馬登録 API
    expect($axios.$post).toHaveBeenCalledWith('/api/horses', vm.form)

    // 2. 出走登録 API（返却された id を使う）
    expect($axios.$post).toHaveBeenCalledWith(
      '/api/horses/10/upsert-upcoming-entry',
      { race_id: 123 }
    )

    // 3. 一覧へ遷移
    expect($router.push).toHaveBeenCalledWith('/')
  })

  test('出走登録なし → 馬登録のみ', async () => {
    const { vm, $axios, $router } = createWrapperWithAxios()

    await flushPromises()

    vm.form.name = 'テストホース2'
    vm.selectedRaceId = null

    await vm.submit()

    // /api/horses は呼ばれる
    expect($axios.$post).toHaveBeenCalledWith('/api/horses', vm.form)

    // upsert-upcoming-entry は呼ばれない
    const calls = ($axios.$post as jest.Mock).mock.calls
    const hasUpsert = calls.some(([url]) =>
      String(url).includes('/upsert-upcoming-entry')
    )
    expect(hasUpsert).toBe(false)

    expect($router.push).toHaveBeenCalledWith('/')
  })

  test('重複馬名の場合は submit しない', async () => {
    const { vm, $axios, $router } = createWrapperWithAxios({ nameExists: true })

    await flushPromises()

    vm.form.name = 'かぶりホース'

    await vm.submit()

    // /api/horses は一切呼ばれない
    expect($axios.$post).not.toHaveBeenCalled()

    // 画面遷移も発生しない
    expect($router.push).not.toHaveBeenCalled()

    // エラーメッセージがセットされていること（文言は実装に合わせて）
    expect(vm.nameError).toBeTruthy()
  })

  test('API エラー時は error にメッセージが入り submitting が false に戻る', async () => {
    const { vm, $axios } = createWrapperWithAxios({ postError: true })

    await flushPromises()

    vm.form.name = 'エラーホース'

    await vm.submit()

    expect($axios.$post).toHaveBeenCalledWith('/api/horses', vm.form)
    expect(vm.error).toBe('server error') // 実装のメッセージに合わせて調整
    expect(vm.submitting).toBe(false)
  })
})