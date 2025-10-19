export interface Horse {
  id: number
  name: string
  sex?: string | null
  birth_date?: string | null
  trainer?: string | null

  training_center_id?: number | null
  training_center_name?: string | null

  breeder?: string | null
  sire?: string | null
  bloodmare_sire?: string | null

  latest_race_id?: number | null
  latest_race_name?: string | null
  latest_race_date?: string | null
}

export interface TrainingCenter {
  training_center_id: number
  training_center_name: string
}
