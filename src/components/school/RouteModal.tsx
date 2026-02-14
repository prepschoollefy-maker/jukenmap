"use client"

import { useState, useEffect } from "react"
import { X, Clock, Footprints, ArrowRight, Train, Bus, MapIcon } from "lucide-react"
import type { SchoolWithDistance } from "@/hooks/useFilteredSchools"

interface TransitStep {
  mode: string
  duration: string
  durationValue: number
  distance: string
  instruction: string
  lineName?: string
  lineShortName?: string
  lineColor?: string
  vehicleType?: string
  departureStop?: string
  arrivalStop?: string
  departureTime?: string
  arrivalTime?: string
  numStops?: number
}

interface RouteOption {
  duration: string
  durationValue: number
  departureTime: string
  arrivalTime: string
  fare?: string
  steps: TransitStep[]
}

function parseRoutes(data: unknown): RouteOption[] {
  const d = data as { routes?: Array<{ legs?: Array<Record<string, unknown>> }> }
  if (!d.routes || d.routes.length === 0) return []

  return d.routes.flatMap((route) => {
    const leg = route.legs?.[0] as Record<string, unknown> | undefined
    if (!leg) return []

    const duration = leg.duration as { text: string; value: number } | undefined
    const depTime = leg.departure_time as { text: string } | undefined
    const arrTime = leg.arrival_time as { text: string } | undefined
    const fare = leg.fare as { text: string } | undefined
    const rawSteps = leg.steps as Array<Record<string, unknown>> | undefined

    const steps: TransitStep[] = (rawSteps || []).map((step) => {
      const stepDuration = step.duration as { text: string; value: number } | undefined
      const stepDistance = step.distance as { text: string } | undefined
      const htmlInstr = (step.html_instructions as string) || ""
      const base: TransitStep = {
        mode: (step.travel_mode as string) || "WALKING",
        duration: stepDuration?.text || "",
        durationValue: stepDuration?.value || 0,
        distance: stepDistance?.text || "",
        instruction: htmlInstr.replace(/<[^>]*>/g, ""),
      }

      const td = step.transit_details as Record<string, unknown> | undefined
      if (td) {
        const line = td.line as Record<string, unknown> | undefined
        const vehicle = line?.vehicle as Record<string, unknown> | undefined
        const depStop = td.departure_stop as { name?: string } | undefined
        const arrStop = td.arrival_stop as { name?: string } | undefined
        const depStepTime = td.departure_time as { text?: string } | undefined
        const arrStepTime = td.arrival_time as { text?: string } | undefined

        base.lineName = (line?.name as string) || undefined
        base.lineShortName = (line?.short_name as string) || undefined
        base.lineColor = (line?.color as string) || undefined
        base.vehicleType = (vehicle?.type as string) || undefined
        base.departureStop = depStop?.name
        base.arrivalStop = arrStop?.name
        base.departureTime = depStepTime?.text
        base.arrivalTime = arrStepTime?.text
        base.numStops = (td.num_stops as number) || undefined
      }

      return base
    })

    return [{
      duration: duration?.text || "",
      durationValue: duration?.value || 0,
      departureTime: depTime?.text || "",
      arrivalTime: arrTime?.text || "",
      fare: fare?.text,
      steps,
    }]
  })
}

function StepIcon({ mode, vehicleType }: { mode: string; vehicleType?: string }) {
  if (mode === "WALKING") return <Footprints size={14} className="text-gray-500" />
  if (vehicleType === "BUS") return <Bus size={14} className="text-white" />
  return <Train size={14} className="text-white" />
}

function RouteSteps({ steps }: { steps: TransitStep[] }) {
  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2">
          {step.mode === "TRANSIT" ? (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-white font-medium shrink-0 mt-0.5"
              style={{ backgroundColor: step.lineColor || "#6B7280" }}
            >
              <StepIcon mode={step.mode} vehicleType={step.vehicleType} />
              {step.lineShortName || step.lineName || "電車"}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-gray-600 bg-gray-100 shrink-0 mt-0.5">
              <StepIcon mode={step.mode} />
              徒歩
            </div>
          )}
          <div className="flex-1 min-w-0">
            {step.mode === "TRANSIT" ? (
              <div>
                <div className="text-xs">
                  <span className="font-medium">{step.departureStop}</span>
                  <ArrowRight size={10} className="inline mx-1 text-gray-400" />
                  <span className="font-medium">{step.arrivalStop}</span>
                </div>
                <div className="text-[11px] text-gray-500">
                  {step.departureTime && step.arrivalTime && (
                    <span>{step.departureTime} → {step.arrivalTime} · </span>
                  )}
                  {step.duration}
                  {step.numStops && <span> · {step.numStops}駅</span>}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-gray-500">
                {step.distance} · {step.duration}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

interface Props {
  school: SchoolWithDistance
  originLat: number
  originLng: number
  originAddress: string
  onClose: () => void
}

export function RouteModal({ school, originLat, originLng, originAddress, onClose }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const [routes, setRoutes] = useState<RouteOption[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [showEmbed, setShowEmbed] = useState(false)

  const origin = originAddress || `${originLat},${originLng}`

  useEffect(() => {
    let cancelled = false
    async function fetchRoutes() {
      try {
        const res = await fetch(
          `/api/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(school.address)}`
        )
        const data = await res.json()
        if (cancelled) return

        if (data.status === "OK") {
          const parsed = parseRoutes(data)
          if (parsed.length > 0) {
            setRoutes(parsed)
          } else {
            setError("ルートが見つかりませんでした")
            setShowEmbed(true)
          }
        } else {
          setError(data.status === "ZERO_RESULTS" ? "公共交通機関のルートが見つかりませんでした" : `API Error: ${data.status}`)
          setShowEmbed(true)
        }
      } catch {
        setError("ルート情報の取得に失敗しました")
        setShowEmbed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchRoutes()
    return () => { cancelled = true }
  }, [origin, school.address])

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

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                ルートを検索中...
              </div>
            </div>
          )}

          {!loading && routes && routes.length > 0 && (
            <div>
              {/* ルート選択タブ */}
              {routes.length > 1 && (
                <div className="flex border-b bg-gray-50 px-4 pt-2 gap-1 overflow-x-auto">
                  {routes.map((route, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedRoute(i)}
                      className={`px-3 py-2 text-xs font-medium rounded-t-lg border border-b-0 transition-colors shrink-0 ${
                        selectedRoute === i
                          ? "bg-white text-blue-600 border-gray-200"
                          : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {route.duration}
                      </div>
                      {route.fare && (
                        <div className="text-[10px] text-gray-400 mt-0.5">{route.fare}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 選択されたルートの詳細 */}
              {routes[selectedRoute] && (
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1 text-lg font-bold text-blue-600">
                      <Clock size={18} />
                      {routes[selectedRoute].duration}
                    </div>
                    {routes[selectedRoute].departureTime && routes[selectedRoute].arrivalTime && (
                      <div className="text-sm text-gray-600">
                        {routes[selectedRoute].departureTime} → {routes[selectedRoute].arrivalTime}
                      </div>
                    )}
                    {routes[selectedRoute].fare && (
                      <div className="text-sm text-gray-500">
                        {routes[selectedRoute].fare}
                      </div>
                    )}
                  </div>
                  <RouteSteps steps={routes[selectedRoute].steps} />

                  {/* 地図を見るボタン */}
                  <button
                    onClick={() => setShowEmbed(!showEmbed)}
                    className="mt-4 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <MapIcon size={12} />
                    {showEmbed ? "地図を閉じる" : "地図で見る"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* エラー時 or 地図表示 */}
          {!loading && error && !routes && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500 mb-3">{error}</p>
              <p className="text-xs text-gray-400 mb-2">Google Mapsの地図で経路を表示します</p>
            </div>
          )}

          {/* Embed表示 */}
          {!loading && showEmbed && (
            <div className="border-t">
              <iframe
                src={embedUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-4 py-2.5 border-t bg-gray-50 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-gray-400">
            {routes ? "Google Directions APIのルート情報" : "Google Mapsの経路情報を表示しています"}
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
