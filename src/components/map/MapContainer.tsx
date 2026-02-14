"use client"

import { useState, useCallback } from "react"
import { Map, MapControl, ControlPosition, useMap } from "@vis.gl/react-google-maps"
import { Layers, LocateFixed } from "lucide-react"
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
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ""
  const [mapTypeId, setMapTypeId] = useState<"roadmap" | "satellite">("roadmap")
  const [locating, setLocating] = useState(false)
  const map = useMap()

  const toggleMapType = useCallback(() => {
    setMapTypeId((prev) => (prev === "roadmap" ? "satellite" : "roadmap"))
  }, [])

  const goToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !map) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        map.setZoom(15)
        setLocating(false)
      },
      () => {
        setLocating(false)
      }
    )
  }, [map])

  return (
    <Map
      defaultCenter={MAP_DEFAULT_CENTER}
      defaultZoom={MAP_DEFAULT_ZOOM}
      mapId={mapId}
      mapTypeId={mapTypeId}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapTypeControl={false}
      className="w-full h-full"
    >
      <SchoolMarkers
        schools={schools}
        selectedId={selectedId}
        onSelect={onSelect}
        onFavoriteToggle={onFavoriteToggle}
        isFavorite={isFavorite}
      />

      <MapControl position={ControlPosition.RIGHT_BOTTOM}>
        <div className="flex flex-col gap-2 mr-2 mb-24">
          {/* 現在地ボタン */}
          <button
            onClick={goToCurrentLocation}
            disabled={locating}
            className="bg-white shadow-md rounded-lg p-2.5 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
            title="現在地"
          >
            <LocateFixed size={20} className={locating ? "animate-pulse text-blue-500" : "text-gray-700"} />
          </button>

          {/* 地図タイプ切替ボタン */}
          <button
            onClick={toggleMapType}
            className="bg-white shadow-md rounded-lg px-2.5 py-2 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 flex items-center gap-1.5"
            title={mapTypeId === "roadmap" ? "航空写真に切替" : "地図に切替"}
          >
            <Layers size={18} className="text-gray-700" />
            <span className="text-xs font-medium text-gray-700">
              {mapTypeId === "roadmap" ? "航空写真" : "地図"}
            </span>
          </button>
        </div>
      </MapControl>
    </Map>
  )
}
