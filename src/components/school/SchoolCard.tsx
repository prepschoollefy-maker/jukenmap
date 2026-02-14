"use client"

import { useState } from "react"
import { Heart, MapPin, Route, ExternalLink } from "lucide-react"
import type { SchoolWithDistance } from "@/hooks/useFilteredSchools"
import { ESTABLISHMENT_COLORS } from "@/lib/constants"

interface RouteResult {
  totalMinutes: number
  totalText: string
  mode: "transit" | "driving"
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
  result: google.maps.DirectionsResult,
  mode: "transit" | "driving"
): RouteResult | null {
  const leg = result.routes[0]?.legs[0]
  if (!leg) return null

  const totalMinutes = Math.round(leg.duration!.value / 60)
  const totalText = leg.duration!.text

  const steps: RouteResult["steps"] = []

  if (mode === "transit") {
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
  }

  return { totalMinutes, totalText, mode, steps }
}

function callDirections(
  service: google.maps.DirectionsService,
  origin: google.maps.LatLng,
  destination: google.maps.LatLng,
  travelMode: google.maps.TravelMode,
  departureTime?: Date
): Promise<google.maps.DirectionsResult> {
  return new Promise((resolve, reject) => {
    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      travelMode,
    }
    if (travelMode === google.maps.TravelMode.TRANSIT && departureTime) {
      request.transitOptions = { departureTime }
    }
    if (travelMode === google.maps.TravelMode.DRIVING) {
      request.drivingOptions = { departureTime: departureTime || new Date() }
    }
    service.route(request, (result, status) => {
      if (status === "OK" && result) resolve(result)
      else reject(new Error(status))
    })
  })
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

    const service = new google.maps.DirectionsService()
    const origin = new google.maps.LatLng(originLat!, originLng!)
    const destination = new google.maps.LatLng(school.latitude!, school.longitude!)

    try {
      // まず電車（公共交通機関）で検索
      const transitResult = await callDirections(
        service, origin, destination,
        google.maps.TravelMode.TRANSIT,
        new Date()  // 現在時刻で検索
      )
      const parsed = parseDirectionsResult(transitResult, "transit")
      if (parsed) {
        setRouteResult(parsed)
        setRouteLoading(false)
        return
      }
    } catch {
      // 電車ルートが見つからない場合、車で検索
    }

    try {
      const drivingResult = await callDirections(
        service, origin, destination,
        google.maps.TravelMode.DRIVING
      )
      const parsed = parseDirectionsResult(drivingResult, "driving")
      if (parsed) {
        setRouteResult(parsed)
      } else {
        setRouteError("ルートが見つかりませんでした")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー"
      if (msg === "REQUEST_DENIED") {
        setRouteError("Directions APIを有効にしてください")
      } else {
        setRouteError(`ルート検索に失敗 (${msg})`)
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
              {!routeResult && !routeLoading && !routeError && (
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
                <div>
                  <p className="text-[11px] text-red-500">{routeError}</p>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1 text-[11px] text-blue-600 hover:underline"
                    >
                      Google Mapで確認する
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}

              {routeResult && (
                <div className="bg-green-50 rounded p-2 text-[11px]">
                  <div className="font-bold text-green-800 text-sm">
                    {routeResult.mode === "transit" ? "🚃" : "🚗"} 約{routeResult.totalMinutes}分
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
                  {routeResult.mode === "driving" && (
                    <p className="text-gray-500 mt-1">※電車ルートなし、車での所要時間</p>
                  )}
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
