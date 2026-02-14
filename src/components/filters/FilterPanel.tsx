"use client"

import { useState } from "react"
import { X, SlidersHorizontal, Navigation } from "lucide-react"
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
  transitLoading?: boolean
  transitProgress?: { done: number; total: number }
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
  transitLoading,
  transitProgress,
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

  const [addressInput, setAddressInput] = useState("")
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState("")
  const [originLabel, setOriginLabel] = useState("")

  const hasOrigin = filters.originLat !== null && filters.originLng !== null

  const geocodeAddress = async () => {
    if (!addressInput.trim()) return
    setGeocoding(true)
    setGeocodeError("")
    try {
      const res = await fetch(
        `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(addressInput.trim())}`
      )
      const data = await res.json()
      if (data.length > 0) {
        const [lng, lat] = data[0].geometry.coordinates
        setOriginLabel(addressInput.trim())
        onChange({ ...filters, originLat: lat, originLng: lng })
      } else {
        setGeocodeError("住所が見つかりませんでした")
      }
    } catch {
      setGeocodeError("住所の検索に失敗しました")
    } finally {
      setGeocoding(false)
    }
  }

  const clearOrigin = () => {
    setAddressInput("")
    setOriginLabel("")
    setGeocodeError("")
    onChange({ ...filters, originLat: null, originLng: null, maxDistanceKm: 30 })
  }

  const hasActiveFilters =
    filters.establishments.length > 0 ||
    filters.schoolTypes.length > 0 ||
    filters.areas.length > 0 ||
    filters.deviationMin > DEVIATION_MIN ||
    filters.deviationMax < DEVIATION_MAX ||
    filters.keyword !== "" ||
    hasOrigin

  const resetFilters = () => {
    setAddressInput("")
    setOriginLabel("")
    setGeocodeError("")
    onChange({
      establishments: [],
      schoolTypes: [],
      deviationMin: DEVIATION_MIN,
      deviationMax: DEVIATION_MAX,
      areas: [],
      keyword: "",
      originLat: null,
      originLng: null,
      maxDistanceKm: 30,
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

          {/* 通学距離 */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              <Navigation size={12} className="inline mr-1" />
              自宅からの距離
            </h3>
            {hasOrigin ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-700 truncate flex-1">
                    {originLabel}
                  </span>
                  <button
                    onClick={clearOrigin}
                    className="text-xs text-red-500 hover:underline ml-2 shrink-0"
                  >
                    解除
                  </button>
                </div>
                <h3 className="text-xs text-gray-500 mb-1">
                  {filters.maxDistanceKm}km以内
                </h3>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={filters.maxDistanceKm}
                  onChange={(e) =>
                    onChange({ ...filters, maxDistanceKm: Number(e.target.value) })
                  }
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>1km</span>
                  <span>50km</span>
                </div>
                {transitLoading && transitProgress && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-500 border-t-transparent" />
                    電車時間を計算中... ({transitProgress.done}/{transitProgress.total})
                  </div>
                )}
                {!transitLoading && hasOrigin && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    各学校カードに電車での所要時間が表示されます
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="自宅の住所・駅名を入力..."
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") geocodeAddress()
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    onClick={geocodeAddress}
                    disabled={geocoding || !addressInput.trim()}
                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 shrink-0"
                  >
                    {geocoding ? "..." : "検索"}
                  </button>
                </div>
                {geocodeError && (
                  <p className="text-xs text-red-500 mt-1">{geocodeError}</p>
                )}
              </div>
            )}
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
