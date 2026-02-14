"use client"

import { Heart, ExternalLink, MapPin } from "lucide-react"
import type { School } from "@/types/school"
import { ESTABLISHMENT_COLORS } from "@/lib/constants"

interface Props {
  school: School
  isFavorite: boolean
  onFavoriteToggle: () => void
}

export function SchoolInfoWindow({ school, isFavorite, onFavoriteToggle }: Props) {
  const color = ESTABLISHMENT_COLORS[school.establishment] || "#6B7280"

  return (
    <div className="min-w-[240px] max-w-[300px] p-1">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-sm leading-tight">{school.school_name}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle()
          }}
          className="shrink-0 p-1 rounded hover:bg-gray-100"
          aria-label={isFavorite ? "お気に入り解除" : "お気に入り追加"}
        >
          <Heart
            size={18}
            className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}
          />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mt-1.5">
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[11px] text-white font-medium"
          style={{ backgroundColor: color }}
        >
          {school.establishment}
        </span>
        <span className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-gray-100 text-gray-700">
          {school.school_type}
        </span>
        {school.yotsuya_deviation_value && (
          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-amber-100 text-amber-800 font-medium">
            偏差値 {school.yotsuya_deviation_value}
          </span>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-600 space-y-0.5">
        <div className="flex items-start gap-1">
          <MapPin size={12} className="mt-0.5 shrink-0" />
          <span>{school.address}</span>
        </div>
        {school.nearest_station && (
          <div className="ml-4">最寄り: {school.nearest_station}</div>
        )}
      </div>

      <div className="flex gap-2 mt-2 text-xs">
        {school.study_url && (
          <a
            href={school.study_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
          >
            スタディ <ExternalLink size={10} />
          </a>
        )}
        {school.school_url && (
          <a
            href={school.school_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
          >
            学校HP <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  )
}
