"use client"

import { APIProvider, Map } from "@vis.gl/react-google-maps"
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants"
import { SchoolMarkers } from "./SchoolMarkers"
import type { School } from "@/types/school"

interface MapContainerProps {
  schools: School[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onFavoriteToggle: (id: string) => void
  isFavorite: (id: string) => boolean
}

export function MapContainer({
  schools,
  selectedId,
  onSelect,
  onFavoriteToggle,
  isFavorite,
}: MapContainerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ""

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 text-gray-500">
        <p>Google Maps APIキーが設定されていません。.env.localを確認してください。</p>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={MAP_DEFAULT_CENTER}
        defaultZoom={MAP_DEFAULT_ZOOM}
        mapId={mapId}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="w-full h-full"
      >
        <SchoolMarkers
          schools={schools}
          selectedId={selectedId}
          onSelect={onSelect}
          onFavoriteToggle={onFavoriteToggle}
          isFavorite={isFavorite}
        />
      </Map>
    </APIProvider>
  )
}
