import { test, expect } from '@playwright/test'

test.describe('競走馬登録（APIモック）', () => {
  test('登録 → 出走登録(今日以降のレースを指定、テスト時に編集) → 一覧へ遷移', async ({ page }) => {
    // ====== 1) APIモック ======
    // トレセン一覧
    await page.route('**/api/training-centers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { training_center_id: 1, training_center_name: '栗東' },
          { training_center_id: 2, training_center_name: '美浦' },
        ]),
      })
    })

    // 直近レース一覧（出走登録用）
    await page.route('**/api/races-upcoming', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { race_id: 30, race_name: 'ターコイズステークス', race_date: '2025-12-20' },
          { race_id: 31, race_name: '朝日杯フューチュリティステークス', race_date: '2025-12-21' },
        ]),
      })
    })

    // 馬名重複チェック（存在しない想定）
    await page.route('**/api/check/horse-name**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: false }),
      })
    })

    // 馬登録（ID返す）
    let createdHorseId = 100
    await page.route('**/api/horses', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()

      const body = route.request().postDataJSON?.() ?? {}
      // 雰囲気で最低限チェック（必要なら増やしてOK）
      expect(body.name).toBeTruthy()

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {id: createdHorseId } }),
      })
    })

    // 出走登録 upsert
    let upsertCalled = false
    await page.route('**/api/horses/*/upsert-upcoming-entry**', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()

      const body = route.request().postDataJSON?.() ?? {}
      expect(body).toEqual({ race_id: 31 })
      upsertCalled = true
      console.log('upsert intercepted:', route.request().url())

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })

    // 遷移先の一覧ページがAPI叩くなら、ここもモックしておく（必要に応じて）
    await page.route('**/api/horses', async (route) => {
      if (route.request().method() === 'GET')  return route.fallback()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // ====== 2) 操作 ======
    await page.goto('/horse/new')
    await expect(page.getByRole('heading', { name: '競走馬登録' })).toBeVisible()

    // 馬名（必須）
    await page.getByLabel('馬名').fill('テストホース')

    // 性別
    await page.getByLabel('性別').selectOption('牡')

    // 出走登録（今日以降）→ race_id=31 を選択
    // ※ select の label が「出走登録（今日以降）」なのでそのまま getByLabel で取る
    await page.getByLabel('出走登録（今日以降）').selectOption({ value: '31' })

    // 送信前に「upsert が発生すること」を待ち受ける（確実にする）
    const waitUpsertReq = page.waitForRequest((req) => {
      return (
        req.method() === 'POST' &&
        req.url().includes('/api/horses/') &&
        req.url().includes('/upsert-upcoming-entry')
      )
    })

    // 「登録」ボタンは form 内の submit に限定（strict mode回避）
    // ※ UIによって form が無いなら、newページのルート要素に data-testid を付ける方が確実
    const submit = page.locator('form').getByRole('button', { name: '登録' })

    // disabled のままクリックしない
    await expect(submit).toBeEnabled()
    await submit.click()

    // ====== 3) 検証 ======
    // upsert API が実際に飛んだこと（ネットワークレベルで確定）
    await waitUpsertReq

    // 念のためフラグも
    expect(upsertCalled).toBe(true)

    // 一覧へ遷移（new.vue が this.$router.push('/')）
    await expect(page).toHaveURL(/\/$/)

    // 画面上の確認（一覧の見出しなど、実際の文言に合わせて調整）
    // await expect(page.getByRole('heading', { name: '競走馬一覧' })).toBeVisible()
  })
})