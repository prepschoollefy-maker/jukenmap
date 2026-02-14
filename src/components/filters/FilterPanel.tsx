"use client"

import { X, SlidersHorizontal } from "lucide-react"
import type { Establishment, SchoolType } from "@/types/school"
import type { Filters } from "@/hooks/useFilteredSchools"
import { DEVIATION_MIN, DEVIATION_MAX, AREAS } from "@/lib/constants"

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  resultCount: number
  totalCount: number
  isOpen: boolean
  onToggle: () => void
}

const ESTABLISHMENTS: Establishment[] = ["私立", "国立", "公立中高一貫"]
const SCHOOL_TYPES: SchoolType[] = ["男子校", "女子校", "共学校"]

export function FilterPanel({
  filters,
  onChange,
  resultCount,
  totalCount,
  isOpen,
  onToggle,
}: Props) {
  const toggleEstablishment = (e: Establishment) => {
    const next = filters.establishments.includes(e)
      ? filters.establishments.filter((x) => x !== e)
      : [...filters.establishments, e]
    onChange({ ...filters, establishments: next })
  }

  const toggleSchoolType = (t: SchoolType) => {
    const next = filters.schoolTypes.includes(t)
      ? filters.schoolTypes.filter((x) => x !== t)
      : [...filters.schoolTypes, t]
    onChange({ ...filters, schoolTypes: next })
  }

  const toggleArea = (a: string) => {
    const next = filters.areas.includes(a)
      ? filters.areas.filter((x) => x !== a)
      : [...filters.areas, a]
    onChange({ ...filters, areas: next })
  }

  const hasActiveFilters =
    filters.establishments.length > 0 ||
    filters.schoolTypes.length > 0 ||
    filters.areas.length > 0 ||
    filters.deviationMin > DEVIATION_MIN ||
    filters.deviationMax < DEVIATION_MAX ||
    filters.keyword !== ""

  const resetFilters = () => {
    onChange({
      establishments: [],
      schoolTypes: [],
      deviationMin: DEVIATION_MIN,
      deviationMax: DEVIATION_MAX,
      areas: [],
      keyword: "",
    })
  }

  return (
    <>
      {/* モバイル: フィルタボタン */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white shadow-lg rounded-full px-4 py-3 border text-sm font-medium"
      >
        <SlidersHorizontal size={16} />
        フィルタ
        {hasActiveFilters && (
          <span className="bg-blue-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* フィルタパネル */}
      <div
        className={`
          fixed inset-0 z-40 lg:static lg:z-auto
          ${isOpen ? "block" : "hidden lg:block"}
        `}
      >
        {/* モバイルオーバーレイ */}
        <div
          className="absolute inset-0 bg-black/30 lg:hidden"
          onClick={onToggle}
        />

        {/* パネル本体 */}
        <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto bg-white rounded-t-2xl p-4 pb-8 lg:static lg:max-h-none lg:rounded-none lg:p-4 lg:border-r lg:h-full lg:overflow-y-auto">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base">
              フィルタ{" "}
              <span className="text-sm font-normal text-gray-500">
                {resultCount} / {totalCount}校
              </span>
            </h2>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:underline"
                >
                  リセット
                </button>
              )}
              <button onClick={onToggle} className="lg:hidden p-1">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* キーワード検索 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="学校名・住所で検索..."
              value={filters.keyword}
              onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* 設置区分 */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              設置区分
            </h3>
            <div className="flex flex-wrap gap-2">
              {ESTABLISHMENTS.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleEstablishment(e)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filters.establishments.includes(e)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* 校種 */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              校種
            </h3>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleSchoolType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filters.schoolTypes.includes(t)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 偏差値 */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              偏差値 {filters.deviationMin} 〜 {filters.deviationMax}
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={DEVIATION_MIN}
                max={DEVIATION_MAX}
                value={filters.deviationMin}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    deviationMin: Math.min(
                      Number(e.target.value),
                      filters.deviationMax
                    ),
                  })
                }
                className="flex-1 accent-blue-500"
              />
              <input
                type="range"
                min={DEVIATION_MIN}
                max={DEVIATION_MAX}
                value={filters.deviationMax}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    deviationMax: Math.max(
                      Number(e.target.value),
                      filters.deviationMin
                    ),
                  })
                }
                className="flex-1 accent-blue-500"
              />
            </div>
          </div>

          {/* エリア */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              エリア
            </h3>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleArea(a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filters.areas.includes(a)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
