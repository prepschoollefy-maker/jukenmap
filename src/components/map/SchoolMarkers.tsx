"use client"

import { useCallback, useMemo } from "react"
import { AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps"
import type { School } from "@/types/school"
import { SchoolInfoWindow } from "./SchoolInfoWindow"

interface Props {
  schools: School[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onFavoriteToggle: (id: string) => void
  isFavorite: (id: string) => boolean
}

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
  const validSchools = useMemo(
    () => schools.filter((s) => s.latitude && s.longitude),
    [schools]
  )

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
      {validSchools.map((school) => {
        const pinStyle = PIN_STYLES[school.establishment] || PIN_STYLES["私立"]
        const isSelected = school.study_id === selectedId

        return (
          <AdvancedMarker
            key={school.study_id}
            position={{ lat: school.latitude!, lng: school.longitude! }}
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
