"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { AdvancedMarker, useMap, InfoWindow } from "@vis.gl/react-google-maps"
import Supercluster from "supercluster"
import type { School } from "@/types/school"
import { ESTABLISHMENT_COLORS } from "@/lib/constants"
import { SchoolInfoWindow } from "./SchoolInfoWindow"

interface Props {
  schools: School[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onFavoriteToggle: (id: string) => void
  isFavorite: (id: string) => boolean
}

type SchoolPoint = Supercluster.PointFeature<{ school: School }>

export function SchoolMarkers({
  schools,
  selectedId,
  onSelect,
  onFavoriteToggle,
  isFavorite,
}: Props) {
  const map = useMap()
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null)
  const [zoom, setZoom] = useState(10)

  // マップのboundsとzoomを追跡
  useEffect(() => {
    if (!map) return
    const listener = () => {
      const b = map.getBounds()
      const z = map.getZoom()
      if (b && z !== undefined) {
        setBounds([
          b.getSouthWest().lng(),
          b.getSouthWest().lat(),
          b.getNorthEast().lng(),
          b.getNorthEast().lat(),
        ])
        setZoom(Math.floor(z))
      }
    }
    map.addListener("idle", listener)
    // 初回
    listener()
    return () => google.maps.event.clearListeners(map, "idle")
  }, [map])

  // Superclusterインスタンス
  const cluster = useMemo(() => {
    const sc = new Supercluster<{ school: School }>({
      radius: 60,
      maxZoom: 16,
    })
    const points: SchoolPoint[] = schools
      .filter((s) => s.latitude && s.longitude)
      .map((s) => ({
        type: "Feature",
        properties: { school: s },
        geometry: {
          type: "Point",
          coordinates: [s.longitude!, s.latitude!],
        },
      }))
    sc.load(points)
    return sc
  }, [schools])

  // クラスターを取得
  const clusters = useMemo(() => {
    if (!bounds) return []
    return cluster.getClusters(bounds, zoom)
  }, [cluster, bounds, zoom])

  const selectedSchool = useMemo(
    () => schools.find((s) => s.study_id === selectedId) || null,
    [schools, selectedId]
  )

  const handleMarkerClick = useCallback(
    (id: string) => {
      onSelect(id === selectedId ? null : id)
    },
    [onSelect, selectedId]
  )

  return (
    <>
      {clusters.map((c) => {
        const [lng, lat] = c.geometry.coordinates
        const props = c.properties as Record<string, unknown>
        const isCluster = props.cluster === true

        if (isCluster) {
          const count = props.point_count as number
          const size = Math.min(24 + count * 0.5, 48)
          return (
            <AdvancedMarker
              key={`cluster-${c.id}`}
              position={{ lat, lng }}
              onClick={() => {
                if (map) {
                  const expansionZoom = cluster.getClusterExpansionZoom(c.id as number)
                  map.setZoom(expansionZoom)
                  map.panTo({ lat, lng })
                }
              }}
            >
              <div
                className="flex items-center justify-center rounded-full bg-blue-500 text-white font-bold shadow-lg border-2 border-white cursor-pointer"
                style={{ width: size, height: size, fontSize: size * 0.35 }}
              >
                {count}
              </div>
            </AdvancedMarker>
          )
        }

        // 個別マーカー
        const school = (props as { school: School }).school
        const color = ESTABLISHMENT_COLORS[school.establishment] || "#6B7280"
        const isSelected = school.study_id === selectedId

        return (
          <AdvancedMarker
            key={school.study_id}
            position={{ lat, lng }}
            onClick={() => handleMarkerClick(school.study_id)}
            zIndex={isSelected ? 100 : 1}
          >
            <div
              className="rounded-full shadow-md border-2 cursor-pointer transition-transform"
              style={{
                backgroundColor: color,
                borderColor: isSelected ? "#FBBF24" : "white",
                width: isSelected ? 28 : 18,
                height: isSelected ? 28 : 18,
                transform: isSelected ? "scale(1.3)" : "scale(1)",
              }}
            />
          </AdvancedMarker>
        )
      })}

      {selectedSchool && selectedSchool.latitude && selectedSchool.longitude && (
        <InfoWindow
          position={{
            lat: selectedSchool.latitude,
            lng: selectedSchool.longitude,
          }}
          onCloseClick={() => onSelect(null)}
          pixelOffset={[0, -20]}
        >
          <SchoolInfoWindow
            school={selectedSchool}
            isFavorite={isFavorite(selectedSchool.study_id)}
            onFavoriteToggle={() => onFavoriteToggle(selectedSchool.study_id)}
          />
        </InfoWindow>
      )}
    </>
  )
}
