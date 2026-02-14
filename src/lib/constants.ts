// マップのデフォルト設定
export const MAP_DEFAULT_CENTER = { lat: 35.68, lng: 139.76 } // 東京駅付近
export const MAP_DEFAULT_ZOOM = 10

// 偏差値の範囲
export const DEVIATION_MIN = 30
export const DEVIATION_MAX = 73

// 設立区分の色
export const ESTABLISHMENT_COLORS: Record<string, string> = {
  '私立': '#3B82F6',     // 青
  '国立': '#EF4444',     // 赤
  '公立中高一貫': '#22C55E', // 緑
}

// エリア一覧
export const AREAS = [
  '東京23区',
  '東京23区外',
  '神奈川県',
  '埼玉県',
  '千葉県',
  '茨城県',
  '栃木県',
  '群馬県',
] as const

// 都道府県一覧
export const PREFECTURES = [
  '東京都',
  '神奈川県',
  '埼玉県',
  '千葉県',
  '茨城県',
  '栃木県',
  '群馬県',
] as const
