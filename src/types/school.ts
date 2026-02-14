export type Establishment = '私立' | '国立' | '公立中高一貫'
export type SchoolType = '男子校' | '女子校' | '共学校'

export interface School {
  id: string
  study_id: string
  mext_code: string | null
  school_name: string
  yotsuya_deviation_value: number | null
  establishment: Establishment
  school_type: SchoolType
  area: string
  prefecture: string
  address: string
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  nearest_station: string | null
  school_url: string | null
  study_url: string | null
}
