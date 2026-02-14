"use client"

import { useState } from "react"
import { Heart, MapPin, Route, X } from "lucide-react"
import type { SchoolWithDistance } from "@/hooks/useFilteredSchools"
import { ESTABLISHMENT_COLORS } from "@/lib/constants"

interface RouteStep {
  mode: string
  label: string
  minutes: number
}

interface RouteResult {
  totalMinutes: number
  steps: RouteStep[]
}

interface Props {
  school: SchoolWithDistance
  isSelected: boolean
  isFavorite: boolean
  onSelect: () => void
  onFavoriteToggle: () => void
  originLat?: number | null
  originLng?: number | null
}

function parseTransitResult(result: google.maps.DirectionsResult): RouteResult | null {
  const leg = result.routes[0]?.legs[0]
  if (!leg) return null

  const totalMinutes = Math.round(leg.duration!.value / 60)
  const steps: RouteStep[] = []

  for (const step of leg.steps) {
    const minutes = Math.round(step.duration!.value / 60)
    const travelMode = step.travel_mode as unknown as string
    if (travelMode === "WALKING" || travelMode === google.maps.TravelMode.WALKING) {
      steps.push({ mode: "walk", label: `徒歩${minutes}分`, minutes })
    } else if (travelMode === "TRANSIT" || travelMode === google.maps.TravelMode.TRANSIT) {
      const td = step.transit_details
      const lineName = td?.line?.short_name || td?.line?.name || "電車"
      steps.push({ mode: "transit", label: lineName, minutes })
    }
  }

  return { totalMinutes, steps }
}

// 翌朝8時のDateを返す
function getTomorrowMorning(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(8, 0, 0, 0)
  return d
}

export function SchoolCard({
  school,
  isSelected,
  isFavorite,
  onSelect,
  onFavoriteToggle,
  originLat,
  originLng,
}: Props) {
  const color = ESTABLISHMENT_COLORS[school.establishment] || "#6B7280"
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [showEmbed, setShowEmbed] = useState(false)
  const [routeLoading, setRouteLoading] = useState(false)

  const hasOrigin = originLat != null && originLng != null
  const hasSchoolCoords = school.latitude != null && school.longitude != null

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  const embedUrl =
    hasOrigin && hasSchoolCoords
      ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${originLat},${originLng}&destination=${school.latitude},${school.longitude}&mode=transit`
      : null

  const searchRoute = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasOrigin || !hasSchoolCoords) return

    setShowEmbed(true)
    setRouteLoading(true)

    // Directions APIでテキスト情報も取得を試みる
    if (window.google?.maps) {
      const service = new google.maps.DirectionsService()
      const origin = new google.maps.LatLng(originLat!, originLng!)
      const destination = new google.maps.LatLng(school.latitude!, school.longitude!)

      // 複数の出発時刻で試す（現在時刻 → 翌朝8時）
      const departureTimes = [new Date(), getTomorrowMorning()]

      for (const departureTime of departureTimes) {
        try {
          const result = await new Promise<google.maps.DirectionsResult>(
            (resolve, reject) => {
              service.route(
                {
                  origin,
                  destination,
                  travelMode: google.maps.TravelMode.TRANSIT,
                  transitOptions: { departureTime },
                },
                (res, status) => {
                  if (status === "OK" && res) resolve(res)
                  else reject(new Error(status))
                }
              )
            }
          )
          const parsed = parseTransitResult(result)
          if (parsed) {
            setRouteResult(parsed)
            break
          }
        } catch {
          // 次の出発時刻で再試行
        }
      }
    }

    setRouteLoading(false)
  }

  const closeRoute = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEmbed(false)
    setRouteResult(null)
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
          </div>

          {/* ルート検索 */}
          {hasOrigin && hasSchoolCoords && (
            <div className="mt-2">
              {!showEmbed && (
                <button
                  onClick={searchRoute}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                >
                  <Route size={12} />
                  ルート検索
                </button>
              )}

              {showEmbed && (
                <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                  {/* テキストサマリー */}
                  {routeLoading && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-400 border-t-transparent" />
                      計算中...
                    </div>
                  )}
                  {routeResult && (
                    <div className="bg-green-50 rounded p-2 text-[11px] mb-1">
                      <div className="font-bold text-green-800 text-sm">
                        約{routeResult.totalMinutes}分
                      </div>
                      {routeResult.steps.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1 text-gray-600">
                          {routeResult.steps.map((step, i) => (
                            <span key={i} className="flex items-center gap-0.5">
                              {i > 0 && <span className="text-gray-300 mx-0.5">→</span>}
                              <span
                                className={
                                  step.mode === "transit"
                                    ? "bg-blue-100 text-blue-700 px-1 rounded"
                                    : ""
                                }
                              >
                                {step.label}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 埋め込みGoogleマップ */}
                  {embedUrl && (
                    <div className="relative rounded overflow-hidden border">
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="250"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}

                  <button
                    onClick={closeRoute}
                    className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 hover:text-gray-700"
                  >
                    <X size={10} />
                    閉じる
                  </button>
                </div>
              )}
            </div>
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
