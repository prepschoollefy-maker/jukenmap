"use client"

import { useState } from "react"
import { Heart, MapPin, Route, ExternalLink } from "lucide-react"
import type { SchoolWithDistance } from "@/hooks/useFilteredSchools"
import { ESTABLISHMENT_COLORS } from "@/lib/constants"

interface RouteResult {
  totalMinutes: number
  totalText: string
  steps: { mode: string; label: string; minutes: number }[]
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

function parseDirectionsResult(
  result: google.maps.DirectionsResult
): RouteResult | null {
  const leg = result.routes[0]?.legs[0]
  if (!leg) return null

  const totalMinutes = Math.round(leg.duration!.value / 60)
  const totalText = leg.duration!.text

  const steps: RouteResult["steps"] = []
  for (const step of leg.steps) {
    const minutes = Math.round(step.duration!.value / 60)
    if (step.travel_mode === "WALKING") {
      steps.push({ mode: "walk", label: `徒歩${minutes}分`, minutes })
    } else if (step.travel_mode === "TRANSIT") {
      const td = step.transit_details
      const lineName = td?.line?.short_name || td?.line?.name || "電車"
      steps.push({ mode: "transit", label: lineName, minutes })
    }
  }

  return { totalMinutes, totalText, steps }
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
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState("")

  const hasOrigin = originLat != null && originLng != null
  const hasSchoolCoords = school.latitude != null && school.longitude != null

  const searchRoute = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasOrigin || !hasSchoolCoords || !window.google?.maps) return

    setRouteLoading(true)
    setRouteError("")

    try {
      const service = new google.maps.DirectionsService()
      // 次の月曜 8:00 を出発時刻に設定
      const now = new Date()
      const dayOfWeek = now.getDay()
      const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek
      const nextMonday = new Date(now)
      nextMonday.setDate(now.getDate() + daysUntilMonday)
      nextMonday.setHours(8, 0, 0, 0)

      const response = await new Promise<google.maps.DirectionsResult>(
        (resolve, reject) => {
          service.route(
            {
              origin: new google.maps.LatLng(originLat!, originLng!),
              destination: new google.maps.LatLng(school.latitude!, school.longitude!),
              travelMode: google.maps.TravelMode.TRANSIT,
              transitOptions: { departureTime: nextMonday },
            },
            (result, status) => {
              if (status === "OK" && result) {
                resolve(result)
              } else {
                reject(new Error(status))
              }
            }
          )
        }
      )

      const parsed = parseDirectionsResult(response)
      if (parsed) {
        setRouteResult(parsed)
      } else {
        setRouteError("ルートが見つかりませんでした")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー"
      if (msg === "REQUEST_DENIED") {
        setRouteError("Directions APIが無効です。Google Cloud Consoleで有効にしてください")
      } else if (msg === "ZERO_RESULTS") {
        setRouteError("公共交通機関のルートが見つかりませんでした")
      } else {
        setRouteError(`ルート検索に失敗しました (${msg})`)
      }
    } finally {
      setRouteLoading(false)
    }
  }

  const googleMapsUrl =
    hasOrigin && hasSchoolCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${school.latitude},${school.longitude}&travelmode=transit`
      : null

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

          {/* ルート検索ボタン・結果 */}
          {hasOrigin && hasSchoolCoords && (
            <div className="mt-2">
              {!routeResult && !routeLoading && (
                <button
                  onClick={searchRoute}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                >
                  <Route size={12} />
                  ルート検索
                </button>
              )}

              {routeLoading && (
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-400 border-t-transparent" />
                  検索中...
                </div>
              )}

              {routeError && (
                <p className="text-[11px] text-red-500">{routeError}</p>
              )}

              {routeResult && (
                <div className="bg-green-50 rounded p-2 text-[11px]">
                  <div className="font-bold text-green-800 text-sm">
                    約{routeResult.totalMinutes}分
                  </div>
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
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1 text-blue-600 hover:underline"
                    >
                      Google Mapで詳細を見る
                      <ExternalLink size={10} />
                    </a>
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
