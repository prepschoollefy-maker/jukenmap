import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.searchParams.get("origin")
  const destination = req.nextUrl.searchParams.get("destination")

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json")
  url.searchParams.set("origin", origin)
  url.searchParams.set("destination", destination)
  url.searchParams.set("mode", "transit")
  url.searchParams.set("alternatives", "true")
  url.searchParams.set("language", "ja")
  url.searchParams.set("region", "jp")
  url.searchParams.set("key", apiKey)

  // 翌朝8時を出発時刻に
  const tomorrow8am = new Date()
  tomorrow8am.setDate(tomorrow8am.getDate() + 1)
  tomorrow8am.setHours(8, 0, 0, 0)
  url.searchParams.set("departure_time", String(Math.floor(tomorrow8am.getTime() / 1000)))

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Referer: "https://jukenmap.vercel.app/",
      },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch directions", detail: String(err) }, { status: 500 })
  }
}
