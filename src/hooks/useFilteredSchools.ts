"use client"

import { useMemo } from "react"
import type { School, Establishment, SchoolType } from "@/types/school"

export interface Filters {
  establishments: Establishment[]
  schoolTypes: SchoolType[]
  deviationMin: number
  deviationMax: number
  areas: string[]
  keyword: string
}

export const DEFAULT_FILTERS: Filters = {
  establishments: [],
  schoolTypes: [],
  deviationMin: 30,
  deviationMax: 73,
  areas: [],
  keyword: "",
}

export function useFilteredSchools(schools: School[], filters: Filters) {
  return useMemo(() => {
    return schools.filter((s) => {
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

      return true
    })
  }, [schools, filters])
}
