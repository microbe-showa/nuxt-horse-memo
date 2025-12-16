// ★ 父 → 父父 の対応表（必要に応じて増やせる）
export const sireToGrandsireMap: Record<string, string> = {
  'キタサンブラック': 'ブラックタイド',
  'ブラックタイド': 'ディープインパクト',
  'キズナ': 'ディープインパクト',
  'サトノダイヤモンド': 'ディープインパクト',
  'リアルスティール': 'ディープインパクト',
  'リアルインパクト': 'ディープインパクト',
  'シルバーステート': 'ディープインパクト',
  'ダノンバラード': 'ディープインパクト',
  'コントレイル': 'ディープインパクト',
  'ミッキーアイル': 'ディープインパクト',
  'グレーターロンドン': 'ディープインパクト',
  'ゴールドシップ': 'ステイゴールド',
  'スワーヴリチャード': 'ハーツクライ',
  'ハーツクライ': 'サンデーサイレンス',
  'ドゥラメンテ': 'キングカメハメハ',
  'ルーラーシップ': 'キングカメハメハ',
  'ロードカナロア': 'キングカメハメハ',
  'リオンディーズ': 'キングカメハメハ',
  'アドマイヤマーズ':'ダイワメジャー',
  'レイデオロ': 'キングカメハメハ',
  'サートゥルナーリア': 'キングカメハメハ',
  'モーリス': 'スクリーンヒーロー',
  'スクリーンヒーロー': 'グラスワンダー',
  'エピファネイア': 'シンボリクリスエス',
  'イスラボニータ': 'フジキセキ',
  'モズアスコット':'Frankel',
  'ハービンジャー':'Dansili',
  'ファインニードル':'アドマイヤムーン',
  'ビッグアーサー':'サクラバクシンオー',
  'ミスターメロディ':'Scat Daddy',
  'ドレフォン':'Gio Ponti',
  'サトノクラウン':'Marju',
  'シスキン':'First Defence',
  'マクフィ':'Dubawi',
  'ベンバトル':'Dubawi',
  'アメリカンペイトリオット':'War Front',
  'アジアエクスプレス':'ヘニーヒューズ',
  'カリフォルニアクローム':'Lucky Pulpit',
  'Frosted':'Tapit',
}

// ★ 父 → 父父 の自動入力を返す関数
export function getAutoGrandsire(sireName: string | null | undefined): string | null {
  if (!sireName) return null
  const key = sireName.trim()
  return sireToGrandsireMap[key] ?? null
}

export const ownerToBreederMap: Record<string, string> = {
  'シルクレーシング':'ノーザンファーム',
  'サンデーレーシング':'ノーザンファーム',
  'Ｇ１レーシング':'ノーザンファーム',
  'キャロットファーム':'ノーザンファーム',
  '吉田勝己':'ノーザンファーム',
  '野田みづき':'ノーザンファーム',
  '近藤旬子':'ノーザンファーム',
}

// ★ 父 → 父父 の自動入力を返す関数
export function getAutoBreeder(breederName: string | null | undefined): string | null {
  if (!breederName) return null
  const key = breederName.trim()
  return ownerToBreederMap[key] ?? null
}