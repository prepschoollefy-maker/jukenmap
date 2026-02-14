"use client"

import { Heart, MapPin } from "lucide-react"
import type { School } from "@/types/school"
import { ESTABLISHMENT_COLORS } from "@/lib/constants"

interface Props {
  school: School
  isSelected: boolean
  isFavorite: boolean
  onSelect: () => void
  onFavoriteToggle: () => void
}

export function SchoolCard({
  school,
  isSelected,
  isFavorite,
  onSelect,
  onFavoriteToggle,
}: Props) {
  const color = ESTABLISHMENT_COLORS[school.establishment] || "#6B7280"

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
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
            <MapPin size={10} />
            <span className="truncate">{school.area}</span>
          </div>
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
