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
  'ヘンリーバローズ': 'ディープインパクト',
  'フィエールマン':'ディープインパクト',
  'アルアイン': 'ディープインパクト',
  'ゴールドシップ': 'ステイゴールド',
  'インディチャンプ': 'ステイゴールド',
  'スワーヴリチャード': 'ハーツクライ',
  'シュヴァルグラン': 'ハーツクライ',
  'ハーツクライ': 'サンデーサイレンス',
  'ディープインパクト': 'サンデーサイレンス',
  'ネオユニヴァース': 'サンデーサイレンス',
  'アドマイヤマーズ':'ダイワメジャー',
  'ドゥラメンテ': 'キングカメハメハ',
  'ルーラーシップ': 'キングカメハメハ',
  'ロードカナロア': 'キングカメハメハ',
  'リオンディーズ': 'キングカメハメハ',
  'レイデオロ': 'キングカメハメハ',
  'サートゥルナーリア': 'キングカメハメハ',
  'ダノンスマッシュ': 'ロードカナロア',
  'モーリス': 'スクリーンヒーロー',
  'スクリーンヒーロー': 'グラスワンダー',
  'エピファネイア': 'シンボリクリスエス',
  'イスラボニータ': 'フジキセキ',
  'バンドワゴン': 'ホワイトマズル',
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
  'デクラレーションオブウォー':'War Front',
  'アメリカンペイトリオット':'War Front',
  'フォーウィールドライブ':'American Pharoah',
  'アジアエクスプレス':'ヘニーヒューズ',
  'カリフォルニアクローム':'Lucky Pulpit',
  'Frosted':'Tapit',
  'ビーチパトロール':'Lemon Drop Kid',
  'Into Mischief':'Harlan\'s Holiday',
  'ミスチヴィアスアレックス':'Into Mischief',
  'Frankel':'Galireo',
  'キセキ':'ルーラーシップ',
  'ホークビル':'Kitten\'s Joy',
  'Gun Runner':'Candy Ride',
  'マジェスティックウォリアー':'A.P.Indy',
  'パレスマリス':'Curlin',
  'Maclean\'s Music':'Distorted Humor',
  'エスポワールシチー':'ゴールドアリュール',
  'カジノドライヴ':'Mineshaft',
  'タリスマニック':'Medaglia d\'Oro',
}

// ★ 父 → 父父 の自動入力を返す関数
export function getAutoGrandsire(sireName: string | null | undefined): string | null {
  if (!sireName) return null
  const key = sireName.trim()
  return sireToGrandsireMap[key] ?? null
}

// ★ 馬主 → 生産者 の対応表（必要に応じて増やせる）
// 必ずしもこの組み合わせではないが自動入力しておくと楽
export const ownerToBreederMap: Record<string, string> = {
  'シルクレーシング':'ノーザンファーム',
  'サンデーレーシング':'ノーザンファーム',
  'Ｇ１レーシング':'ノーザンファーム',
  'キャロットファーム':'ノーザンファーム',
  '吉田勝己':'ノーザンファーム',
  '吉田和美':'ノーザンファーム',
  '野田みづき':'ノーザンファーム',
  '近藤旬子':'ノーザンファーム',
  '社台レースホース':'社台ファーム',
}

// ★ 馬主 → 生産者 の自動入力を返す関数
export function getAutoBreeder(breederName: string | null | undefined): string | null {
  if (!breederName) return null
  const key = breederName.trim()
  return ownerToBreederMap[key] ?? null
}