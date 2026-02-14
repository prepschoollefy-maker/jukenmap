"use client"

import { useState } from "react"
import { Heart, MapPin, Route, X, ExternalLink } from "lucide-react"
import type { SchoolWithDistance } from "@/hooks/useFilteredSchools"
import { ESTABLISHMENT_COLORS } from "@/lib/constants"

interface RouteStep {
  mode: "walk" | "transit" | "bus"
  label: string
  minutes: number
  detail?: string
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
  originAddress?: string
}

function parseTransitResult(result: google.maps.DirectionsResult): RouteResult | null {
  const leg = result.routes[0]?.legs[0]
  if (!leg || !leg.duration) return null

  const totalMinutes = Math.round(leg.duration.value / 60)
  const steps: RouteStep[] = []

  for (const step of leg.steps) {
    if (!step.duration) continue
    const minutes = Math.round(step.duration.value / 60)
    if (minutes === 0) continue

    const tm = String(step.travel_mode)
    if (tm === "WALKING") {
      steps.push({ mode: "walk", label: `徒歩${minutes}分`, minutes })
    } else if (tm === "TRANSIT" && step.transit_details) {
      const td = step.transit_details
      const lineName = td.line?.short_name || td.line?.name || "電車"
      const vehicleType = td.line?.vehicle?.type
      const mode = vehicleType === "BUS" ? "bus" as const : "transit" as const
      const numStops = td.num_stops ? `${td.num_stops}駅` : ""
      const departure = td.departure_stop?.name || ""
      const arrival = td.arrival_stop?.name || ""
      const detail = [departure, arrival].filter(Boolean).join(" → ")

      steps.push({
        mode,
        label: `${lineName}${numStops ? ` (${numStops})` : ""}`,
        minutes,
        detail: detail || undefined,
      })
    }
  }

  return { totalMinutes, steps }
}

export function SchoolCard({
  school,
  isSelected,
  isFavorite,
  onSelect,
  onFavoriteToggle,
  originLat,
  originLng,
  originAddress,
}: Props) {
  const color = ESTABLISHMENT_COLORS[school.establishment] || "#6B7280"
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState("")
  const [showRoute, setShowRoute] = useState(false)

  const hasOrigin = originLat != null && originLng != null
  const hasSchoolCoords = school.latitude != null && school.longitude != null

  const googleMapsUrl =
    hasOrigin && hasSchoolCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${school.latitude},${school.longitude}&travelmode=transit`
      : null

  const searchRoute = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasOrigin || !hasSchoolCoords || !window.google?.maps) return

    setShowRoute(true)
    setRouteLoading(true)
    setRouteError("")
    setRouteResult(null)

    const service = new google.maps.DirectionsService()

    // 住所文字列を使用（Googleが自前でジオコーディングしてルーティング）
    const originStr = originAddress || `${originLat},${originLng}`
    const destStr = school.address

    const tomorrow8am = new Date()
    tomorrow8am.setDate(tomorrow8am.getDate() + 1)
    tomorrow8am.setHours(8, 0, 0, 0)

    const attempts: google.maps.DirectionsRequest[] = [
      // 1. 住所文字列 + 翌朝8時出発
      {
        origin: originStr,
        destination: destStr,
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: { departureTime: tomorrow8am },
      },
      // 2. 住所文字列 + 現在時刻
      {
        origin: originStr,
        destination: destStr,
        travelMode: google.maps.TravelMode.TRANSIT,
      },
      // 3. 座標 + 翌朝8時（フォールバック）
      {
        origin: new google.maps.LatLng(originLat!, originLng!),
        destination: new google.maps.LatLng(school.latitude!, school.longitude!),
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: { departureTime: tomorrow8am },
      },
    ]

    const errors: string[] = []
    const labels = ["住所+翌朝", "住所+現在", "座標+翌朝"]

    for (let i = 0; i < attempts.length; i++) {
      try {
        const result = await new Promise<google.maps.DirectionsResult>(
          (resolve, reject) => {
            service.route(attempts[i], (res, status) => {
              if (status === "OK" && res) resolve(res)
              else reject(new Error(status))
            })
          }
        )
        const parsed = parseTransitResult(result)
        if (parsed && parsed.steps.length > 0) {
          setRouteResult(parsed)
          setRouteLoading(false)
          return
        }
        errors.push(`${labels[i]}: OK but no steps`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown"
        errors.push(`${labels[i]}: ${msg}`)
      }
    }

    setRouteError(`電車ルートを取得できませんでした (${errors.join(" / ")})`)
    setRouteLoading(false)
  }

  const closeRoute = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowRoute(false)
    setRouteResult(null)
    setRouteError("")
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
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              {!showRoute && (
                <button
                  onClick={searchRoute}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                >
                  <Route size={12} />
                  ルート検索
                </button>
              )}

              {showRoute && (
                <div className="mt-1">
                  {routeLoading && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-400 border-t-transparent" />
                      ルート検索中...
                    </div>
                  )}

                  {routeResult && (
                    <div className="bg-gray-50 rounded-lg p-2.5 text-[11px] space-y-1.5">
                      <div className="font-bold text-base text-gray-800">
                        約{routeResult.totalMinutes}分
                      </div>

                      <div className="space-y-1">
                        {routeResult.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            {/* アイコン列 */}
                            <div className="shrink-0 w-4 text-center pt-0.5">
                              {step.mode === "walk" && <span className="text-gray-400">🚶</span>}
                              {step.mode === "transit" && <span>🚃</span>}
                              {step.mode === "bus" && <span>🚌</span>}
                            </div>
                            {/* 内容 */}
                            <div className="flex-1 min-w-0">
                              <div className={
                                step.mode === "transit" || step.mode === "bus"
                                  ? "font-medium text-gray-800"
                                  : "text-gray-500"
                              }>
                                {step.label}
                                <span className="text-gray-400 ml-1">{step.minutes}分</span>
                              </div>
                              {step.detail && (
                                <div className="text-[10px] text-gray-400 truncate">
                                  {step.detail}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Google Mapで詳細
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  )}

                  {routeError && (
                    <div className="text-[11px] space-y-1">
                      <p className="text-gray-500">{routeError}</p>
                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Google Mapで経路を確認
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  )}

                  {!routeLoading && (
                    <button
                      onClick={closeRoute}
                      className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 hover:text-gray-600"
                    >
                      <X size={10} />
                      閉じる
                    </button>
                  )}
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
