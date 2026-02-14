"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useApiIsLoaded } from "@vis.gl/react-google-maps"
import type { School } from "@/types/school"

export interface TransitInfo {
  durationMinutes: number
  durationText: string
}

// 個別キャッシュ: "originLat,originLng→destLat,destLng" => TransitInfo
const transitCache = new Map<string, TransitInfo>()

function cacheKey(oLat: number, oLng: number, dLat: number, dLng: number) {
  return `${oLat.toFixed(4)},${oLng.toFixed(4)}→${dLat.toFixed(4)},${dLng.toFixed(4)}`
}

// 次の月曜 8:00 AM を返す（通学時間の現実的な見積もり用）
function getNextMondayMorning(): Date {
  const now = new Date()
  const d = new Date(now)
  d.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7))
  d.setHours(8, 0, 0, 0)
  return d
}

export function useTransitTimes(
  originLat: number | null,
  originLng: number | null,
  schools: School[]
) {
  const apiLoaded = useApiIsLoaded()
  const [transitTimes, setTransitTimes] = useState<Map<string, TransitInfo>>(new Map())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const abortRef = useRef(false)

  const calculate = useCallback(async () => {
    if (originLat === null || originLng === null || !apiLoaded) {
      setTransitTimes(new Map())
      setLoading(false)
      return
    }

    const validSchools = schools.filter((s) => s.latitude && s.longitude)
    if (validSchools.length === 0) return

    // キャッシュ済みの結果を先に適用
    const results = new Map<string, TransitInfo>()
    const uncached: School[] = []
    for (const s of validSchools) {
      const key = cacheKey(originLat, originLng, s.latitude!, s.longitude!)
      const cached = transitCache.get(key)
      if (cached) {
        results.set(s.study_id, cached)
      } else {
        uncached.push(s)
      }
    }
    setTransitTimes(new Map(results))

    if (uncached.length === 0) return

    setLoading(true)
    setProgress({ done: 0, total: uncached.length })
    abortRef.current = false

    const service = new google.maps.DistanceMatrixService()
    const origin = new google.maps.LatLng(originLat, originLng)
    const departureTime = getNextMondayMorning()
    const BATCH_SIZE = 25

    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
      if (abortRef.current) break

      const batch = uncached.slice(i, i + BATCH_SIZE)
      const destinations = batch.map(
        (s) => new google.maps.LatLng(s.latitude!, s.longitude!)
      )

      try {
        const response = await new Promise<google.maps.DistanceMatrixResponse>(
          (resolve, reject) => {
            service.getDistanceMatrix(
              {
                origins: [origin],
                destinations,
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

        response.rows[0].elements.forEach((el, idx) => {
          const school = batch[idx]
          if (el.status === "OK") {
            const info: TransitInfo = {
              durationMinutes: Math.round(el.duration.value / 60),
              durationText: el.duration.text,
            }
            results.set(school.study_id, info)
            transitCache.set(
              cacheKey(originLat, originLng, school.latitude!, school.longitude!),
              info
            )
          }
        })

        setTransitTimes(new Map(results))
        setProgress({ done: Math.min(i + BATCH_SIZE, uncached.length), total: uncached.length })
      } catch (e) {
        console.error("Distance Matrix API error:", e)
      }

      // レート制限対策
      if (i + BATCH_SIZE < uncached.length) {
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    setLoading(false)
  }, [originLat, originLng, schools, apiLoaded])

  useEffect(() => {
    calculate()
    return () => {
      abortRef.current = true
    }
  }, [calculate])

  return { transitTimes, loading, progress }
}
