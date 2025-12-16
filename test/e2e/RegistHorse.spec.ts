import { test, expect } from '@playwright/test'

test('競走馬登録画面が表示される', async ({ page }) => {
  await page.goto('/horse/new') // ルーティングに合わせて調整
  await expect(page.getByRole('heading', { name: '競走馬登録' })).toBeVisible()
})

test('馬主入力で生産者が自動入力される（シルク→ノーザン）', async ({ page }) => {
  await page.goto('/horse/new')

  // 馬主
  const owner = page.getByLabel('馬主')
  const breeder = page.getByLabel('生産者')

  await owner.fill('シルクレーシング')

  // 生産者が自動で入る
  await expect(breeder).toHaveValue('ノーザンファーム', {timeout: 10_000})
})