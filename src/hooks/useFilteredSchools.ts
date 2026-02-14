"use client"

import { useMemo } from "react"
import type { School, Establishment, SchoolType } from "@/types/school"
import { haversineDistance } from "@/lib/geo"

export interface Filters {
  establishments: Establishment[]
  schoolTypes: SchoolType[]
  deviationMin: number
  deviationMax: number
  areas: string[]
  keyword: string
  originLat: number | null
  originLng: number | null
  maxDistanceKm: number
}

export const DEFAULT_FILTERS: Filters = {
  establishments: [],
  schoolTypes: [],
  deviationMin: 30,
  deviationMax: 73,
  areas: [],
  keyword: "",
  originLat: null,
  originLng: null,
  maxDistanceKm: 30,
}

export interface SchoolWithDistance extends School {
  distanceKm: number | null
}

export function useFilteredSchools(schools: School[], filters: Filters): SchoolWithDistance[] {
  return useMemo(() => {
    const hasOrigin = filters.originLat !== null && filters.originLng !== null

    return schools
      .map((s) => {
        const distanceKm =
          hasOrigin && s.latitude && s.longitude
            ? haversineDistance(filters.originLat!, filters.originLng!, s.latitude, s.longitude)
            : null
        return { ...s, distanceKm }
      })
      .filter((s) => {
        // 設置区分フィルタ
        if (
          filters.establishments.length > 0 &&
          !filters.establishments.includes(s.establishment)
        )
          return false

        // 校種フィルタ
        if (
          filters.schoolTypes.length > 0 &&
          !filters.schoolTypes.includes(s.school_type)
        )
          return false

        // 偏差値フィルタ
        if (s.yotsuya_deviation_value !== null) {
          if (
            s.yotsuya_deviation_value < filters.deviationMin ||
            s.yotsuya_deviation_value > filters.deviationMax
          )
            return false
        }

        // エリアフィルタ
        if (filters.areas.length > 0 && !filters.areas.includes(s.area))
          return false

        // キーワード検索
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          if (
            !s.school_name.toLowerCase().includes(kw) &&
            !s.address.toLowerCase().includes(kw) &&
            !(s.nearest_station || "").toLowerCase().includes(kw)
          )
            return false
        }

        // 距離フィルタ
        if (hasOrigin && s.distanceKm !== null) {
          if (s.distanceKm > filters.maxDistanceKm) return false
        }

        return true
      })
      .sort((a, b) => {
        // 出発地が設定されていれば近い順にソート
        if (hasOrigin) {
          return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
        }
        return 0
      })
  }, [schools, filters])
}
