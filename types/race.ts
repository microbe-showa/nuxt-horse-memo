export interface Race {
  race_id: number
  race_date: string           // 'YYYY-MM-DD'
  race_name: string
  race_cource_id: number      // 開催地 ID（※仕様表記に合わせて cource のまま）
  race_type_id: number        // 1=芝, 2=ダ
  distance: number            // 4桁まで
  race_pace?: number | null
  comment?: string | null
}
