"use client"

import { X } from "lucide-react"
import type { SchoolWithDistance } from "@/hooks/useFilteredSchools"

interface Props {
  school: SchoolWithDistance
  originLat: number
  originLng: number
  originAddress: string
  onClose: () => void
}

export function RouteModal({ school, originLat, originLng, originAddress, onClose }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const origin = originAddress || `${originLat},${originLng}`

  const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(school.address)}&mode=transit&language=ja`
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(school.address)}&travelmode=transit`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base truncate">{school.school_name}</h2>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {originAddress} → {school.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Google Maps Embed */}
        <div className="flex-1 min-h-0">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: 450 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* フッター */}
        <div className="px-4 py-2.5 border-t bg-gray-50 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-gray-400">
            Google Mapsの経路情報を表示しています
          </p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline shrink-0"
          >
            Google Mapで開く ↗
          </a>
        </div>
      </div>
    </div>
  )
}
