"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { AdvancedMarker, Pin, useMap, InfoWindow } from "@vis.gl/react-google-maps"
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

// 設立区分ごとのピン色（背景、枠、テキスト）
const PIN_STYLES: Record<string, { bg: string; border: string; glyph: string }> = {
  "私立":       { bg: "#3B82F6", border: "#1D4ED8", glyph: "#DBEAFE" },
  "国立":       { bg: "#EF4444", border: "#B91C1C", glyph: "#FEE2E2" },
  "公立中高一貫": { bg: "#22C55E", border: "#15803D", glyph: "#DCFCE7" },
}

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
    listener()
    return () => google.maps.event.clearListeners(map, "idle")
  }, [map])

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
          const size = Math.min(36 + count * 0.8, 56)
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
                className="flex items-center justify-center rounded-full bg-slate-600 text-white font-bold shadow-lg border-3 border-white cursor-pointer hover:scale-110 transition-transform"
                style={{ width: size, height: size, fontSize: size * 0.38 }}
                title={`${count}校がこのエリアにあります`}
              >
                {count}
              </div>
            </AdvancedMarker>
          )
        }

        // 個別マーカー: Google標準のピン形状
        const school = (props as { school: School }).school
        const pinStyle = PIN_STYLES[school.establishment] || PIN_STYLES["私立"]
        const isSelected = school.study_id === selectedId

        return (
          <AdvancedMarker
            key={school.study_id}
            position={{ lat, lng }}
            onClick={() => handleMarkerClick(school.study_id)}
            zIndex={isSelected ? 100 : 1}
            title={school.school_name}
          >
            <Pin
              background={isSelected ? "#FBBF24" : pinStyle.bg}
              borderColor={isSelected ? "#D97706" : pinStyle.border}
              glyphColor={isSelected ? "#78350F" : pinStyle.glyph}
              scale={isSelected ? 1.4 : 1.0}
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
          pixelOffset={[0, -36]}
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
