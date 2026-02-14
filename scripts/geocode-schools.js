/**
 * 国土地理院APIで322校の住所→緯度経度を変換し、schools.jsonを生成
 * 使い方: node scripts/geocode-schools.js
 */
const fs = require('fs')
const path = require('path')

const CSV_PATH = path.join(__dirname, 'jukenmap_schools_final.csv')
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'schools.json')

// 国土地理院ジオコーディングAPI
const GSI_API = 'https://msearch.gsi.go.jp/address-search/AddressSearch'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function geocode(address) {
  const url = `${GSI_API}?q=${encodeURIComponent(address)}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data && data.length > 0) {
      // GeoJSON: [longitude, latitude]
      const [lng, lat] = data[0].geometry.coordinates
      return { lat, lng }
    }
  } catch (e) {
    console.error(`  Geocode error for "${address}":`, e.message)
  }
  return null
}

function parseCSV(content) {
  const lines = content.trim().split('\n')
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(',')
    rows.push({
      study_id: cols[0],
      mext_code: cols[1],
      school_name: cols[2],
      yotsuya_deviation_value: parseInt(cols[3]) || null,
      establishment: cols[4],
      school_type: cols[5],
      area: cols[6],
      prefecture: cols[7],
      address: cols[8],
      postal_code: cols[9],
      study_url: (cols[10] || '').replace(/\r/g, ''),
    })
  }
  return rows
}

async function main() {
  console.log('Reading CSV...')
  const csv = fs.readFileSync(CSV_PATH, 'utf-8')
  const schools = parseCSV(csv)
  console.log(`Found ${schools.length} schools`)

  // ジオコーディング結果を読み込む（再開用）
  const cachePath = path.join(__dirname, 'geocode_cache.json')
  let cache = {}
  if (fs.existsSync(cachePath)) {
    cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    console.log(`Loaded ${Object.keys(cache).length} cached results`)
  }

  let success = 0
  let failed = 0
  const results = []

  for (let i = 0; i < schools.length; i++) {
    const school = schools[i]
    const progress = `[${i + 1}/${schools.length}]`

    // キャッシュチェック
    if (cache[school.study_id]) {
      const cached = cache[school.study_id]
      results.push({
        ...school,
        latitude: cached.lat,
        longitude: cached.lng,
      })
      success++
      continue
    }

    // 国土地理院APIでジオコード
    const coords = await geocode(school.address)
    if (coords) {
      cache[school.study_id] = coords
      results.push({
        ...school,
        latitude: coords.lat,
        longitude: coords.lng,
      })
      success++
      console.log(`${progress} ✓ ${school.school_name} → ${coords.lat}, ${coords.lng}`)
    } else {
      // 住所を短くしてリトライ
      const shortAddr = school.address.replace(/[０-９].*$/, '').replace(/\d.*$/, '')
      const retry = await geocode(shortAddr)
      if (retry) {
        cache[school.study_id] = retry
        results.push({
          ...school,
          latitude: retry.lat,
          longitude: retry.lng,
        })
        success++
        console.log(`${progress} ✓ ${school.school_name} (retry) → ${retry.lat}, ${retry.lng}`)
      } else {
        results.push({
          ...school,
          latitude: null,
          longitude: null,
        })
        failed++
        console.log(`${progress} ✗ ${school.school_name} — FAILED`)
      }
      await sleep(300)
    }

    // キャッシュを定期保存
    if (i % 50 === 0) {
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8')
    }
    await sleep(200)
  }

  // 最終キャッシュ保存
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8')

  // schools.json出力
  // IDはフロントで不要なので、study_idをキーとして使う
  const output = results.map((s, idx) => ({
    id: s.study_id,
    study_id: s.study_id,
    mext_code: s.mext_code,
    school_name: s.school_name,
    yotsuya_deviation_value: s.yotsuya_deviation_value,
    establishment: s.establishment,
    school_type: s.school_type,
    area: s.area,
    prefecture: s.prefecture,
    address: s.address,
    postal_code: s.postal_code,
    latitude: s.latitude,
    longitude: s.longitude,
    nearest_station: null,
    school_url: null,
    study_url: s.study_url || null,
  }))

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')

  console.log('\n=== Summary ===')
  console.log(`Total: ${schools.length}`)
  console.log(`Success: ${success}`)
  console.log(`Failed: ${failed}`)
  console.log(`Output: ${OUTPUT_PATH}`)
}

main().catch(console.error)
