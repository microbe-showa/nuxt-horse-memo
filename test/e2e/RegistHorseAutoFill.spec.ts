import { test, expect, Page} from '@playwright/test'

test('競走馬登録画面が表示される', async ({ page }) => {
  await page.goto('/horse/new')
  await expect(page.getByRole('heading', { name: '競走馬登録' })).toBeVisible()
})

const getOwnerLabelAndBreederLabel = async (page: Page) => {
  await page.goto('/horse/new')
  const owner = page.getByLabel('馬主')
  const breeder = page.getByLabel('生産者')
  return {owner, breeder}
}

const testBreederValueAutoFillfromOwnerValue = async (
  page: Page,
  inputOwnerValue: string,
  expectedBreederValue: string
) => {
  const {owner, breeder} = await getOwnerLabelAndBreederLabel(page)
  await owner.fill(inputOwnerValue)
  await expect(breeder).toHaveValue(expectedBreederValue, {timeout: 10_000})
}

test('馬主入力で生産者が自動入力される（シルク→ノーザン）', async ({ page }) => {
  await testBreederValueAutoFillfromOwnerValue(page, 'シルクレーシング', 'ノーザンファーム')
})

test('馬主入力で生産者が自動入力される（サンデー→ノーザン）', async ({ page }) => {
  await testBreederValueAutoFillfromOwnerValue(page, 'サンデーレーシング', 'ノーザンファーム')
})

test('馬主入力で生産者が自動入力される（Ｇ１レーシング→ノーザン）', async ({ page }) => {
  await testBreederValueAutoFillfromOwnerValue(page, 'Ｇ１レーシング', 'ノーザンファーム')
})

test('馬主入力で生産者が自動入力される（キャロット→ノーザン）', async ({ page }) => {
  await testBreederValueAutoFillfromOwnerValue(page, 'キャロットファーム', 'ノーザンファーム')
})

test('馬主入力で生産者が自動入力される（吉田勝己→ノーザン）', async ({ page }) => {
  await testBreederValueAutoFillfromOwnerValue(page, '吉田勝己', 'ノーザンファーム')
})

test('馬主入力で生産者が自動入力される（吉田和美→ノーザン）', async ({ page }) => {
  await testBreederValueAutoFillfromOwnerValue(page, '吉田和美', 'ノーザンファーム')
})

test('馬主入力で生産者が自動入力される（野田みづき→ノーザン）', async ({ page }) => {
  await testBreederValueAutoFillfromOwnerValue(page, '野田みづき', 'ノーザンファーム')
})

test('馬主入力で生産者が自動入力される（近藤旬子→ノーザン）', async ({ page }) => {
  await testBreederValueAutoFillfromOwnerValue(page, '近藤旬子', 'ノーザンファーム')
})

test('馬主入力で生産者が自動入力される（社台→社台）', async ({ page }) => {
  await testBreederValueAutoFillfromOwnerValue(page, '社台レースホース', '社台ファーム')
})