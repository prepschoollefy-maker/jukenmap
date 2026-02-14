"use client"

import { useState } from "react"
import { Heart, MapPin, Route } from "lucide-react"
import type { SchoolWithDistance } from "@/hooks/useFilteredSchools"
import { ESTABLISHMENT_COLORS } from "@/lib/constants"
import { estimateCommuteMinutes } from "@/lib/geo"

interface Props {
  school: SchoolWithDistance
  isSelected: boolean
  isFavorite: boolean
  onSelect: () => void
  onFavoriteToggle: () => void
  originLat?: number | null
  originLng?: number | null
  originAddress?: string
  onRouteSearch?: (school: SchoolWithDistance) => void
}

export function SchoolCard({
  school,
  isSelected,
  isFavorite,
  onSelect,
  onFavoriteToggle,
  originLat,
  originLng,
  onRouteSearch,
}: Props) {
  const color = ESTABLISHMENT_COLORS[school.establishment] || "#6B7280"

  const hasOrigin = originLat != null && originLng != null
  const hasSchoolCoords = school.latitude != null && school.longitude != null

  const estimatedMinutes =
    school.distanceKm != null ? estimateCommuteMinutes(school.distanceKm) : null

  const handleRouteSearch = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRouteSearch?.(school)
  }

  return (
    <div
      onClick={onSelect}
      className={`p-3 border-b cursor-pointer transition-colors hover:bg-blue-50 ${
        isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{school.school_name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <span
              className="inline-block px-1.5 py-0.5 rounded text-[10px] text-white"
              style={{ backgroundColor: color }}
            >
              {school.establishment}
            </span>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">
              {school.school_type}
            </span>
            {school.yotsuya_deviation_value && (
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-medium">
                Y{school.yotsuya_deviation_value}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <MapPin size={10} />
              {school.area}
            </span>
            {school.distanceKm !== null && (
              <span className="text-blue-600">
                直線{school.distanceKm.toFixed(1)}km
              </span>
            )}
            {estimatedMinutes != null && (
              <span className="text-gray-400">
                (推定{estimatedMinutes}分)
              </span>
            )}
          </div>

          {/* ルート検索ボタン */}
          {hasOrigin && hasSchoolCoords && (
            <button
              onClick={handleRouteSearch}
              className="mt-1.5 flex items-center gap-1 px-2 py-1 text-[11px] text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
            >
              <Route size={12} />
              電車ルートを見る
            </button>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle()
          }}
          className="shrink-0 p-1 rounded hover:bg-gray-100"
        >
          <Heart
            size={16}
            className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-300"}
          />
        </button>
      </div>
    </div>
  )
}
