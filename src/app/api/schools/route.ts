import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { School } from '@/types/school'

export const revalidate = 600 // 10分キャッシュ

const GSI_API = 'https://msearch.gsi.go.jp/address-search/AddressSearch'

function loadFallbackSchools(): School[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'schools.json')
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function buildGeocodeCache(schools: School[]): Map<string, { lat: number; lng: number }> {
  const cache = new Map<string, { lat: number; lng: number }>()
  for (const s of schools) {
    if (s.latitude != null && s.longitude != null) {
      cache.set(s.address, { lat: s.latitude, lng: s.longitude })
    }
  }
  return cache
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${GSI_API}?q=${encodeURIComponent(address)}`,
      { cache: 'no-store' }
    )
    const data = await res.json()
    if (data?.length > 0) {
      const [lng, lat] = data[0].geometry.coordinates
      return { lat, lng }
    }
  } catch { /* ignore */ }

  // 住所を短くしてリトライ
  const shortAddr = address.replace(/[０-９].*$/, '').replace(/\d.*$/, '')
  if (shortAddr !== address) {
    try {
      const res = await fetch(
        `${GSI_API}?q=${encodeURIComponent(shortAddr)}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      if (data?.length > 0) {
        const [lng, lat] = data[0].geometry.coordinates
        return { lat, lng }
      }
    } catch { /* ignore */ }
  }

  return null
}

function parseCSV(csv: string): Omit<School, 'latitude' | 'longitude' | 'nearest_station' | 'school_url'>[] {
  // BOM除去
  const clean = csv.replace(/^\uFEFF/, '')
  const lines = clean.trim().split('\n')
  const rows: Omit<School, 'latitude' | 'longitude' | 'nearest_station' | 'school_url'>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(',')
    if (cols.length < 3) continue

    rows.push({
      id: cols[0],
      study_id: cols[0],
      mext_code: cols[1] || null,
      school_name: cols[2],
      yotsuya_deviation_value: parseInt(cols[3]) || null,
      establishment: cols[4] as School['establishment'],
      school_type: cols[5] as School['school_type'],
      area: cols[6],
      prefecture: cols[7],
      address: cols[8],
      postal_code: cols[9] || null,
      study_url: (cols[10] || '').replace(/\r/g, '') || null,
    })
  }

  return rows
}

export async function GET() {
  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL
  const fallbackSchools = loadFallbackSchools()

  if (!sheetUrl) {
    return NextResponse.json(fallbackSchools)
  }

  try {
    const res = await fetch(sheetUrl, { next: { revalidate: 600 } })
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)

    const csv = await res.text()
    const rows = parseCSV(csv)

    // schools.json から住所→座標のキャッシュを構築
    const geocodeCache = buildGeocodeCache(fallbackSchools)

    const schools: School[] = []
    for (const row of rows) {
      const cached = geocodeCache.get(row.address)
      if (cached) {
        schools.push({ ...row, latitude: cached.lat, longitude: cached.lng, nearest_station: null, school_url: null })
      } else {
        const coords = await geocode(row.address)
        schools.push({ ...row, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null, nearest_station: null, school_url: null })
      }
    }

    return NextResponse.json(schools)
  } catch {
    // Google Sheet取得失敗時はフォールバック
    return NextResponse.json(fallbackSchools)
  }
}
