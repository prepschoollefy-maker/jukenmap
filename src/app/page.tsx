"use client"

import { useState, useRef, useEffect } from "react"
import { APIProvider } from "@vis.gl/react-google-maps"
import { MapPin, Heart, Search } from "lucide-react"
import { MapContainer } from "@/components/map/MapContainer"
import { FilterPanel } from "@/components/filters/FilterPanel"
import { SchoolCard } from "@/components/school/SchoolCard"
import { useSchools } from "@/hooks/useSchools"
import { useFilteredSchools, DEFAULT_FILTERS } from "@/hooks/useFilteredSchools"
import type { Filters } from "@/hooks/useFilteredSchools"
import { useFavorites } from "@/hooks/useFavorites"

function HomeContent() {
  const { schools, loading } = useSchools()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const filteredSchools = useFilteredSchools(schools, filters)
  const { toggle, isFavorite, count: favCount } = useFavorites()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [showList, setShowList] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // 選択された学校をリストでスクロール
  useEffect(() => {
    if (selectedId && listRef.current) {
      const el = listRef.current.querySelector(`[data-id="${selectedId}"]`)
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [selectedId])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500 flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
          学校データを読み込み中...
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-blue-500" />
          <h1 className="font-bold text-lg">JukenMap</h1>
          <span className="text-xs text-gray-400 hidden sm:block">
            首都圏 中学受験 学校検索マップ
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/favorites"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500"
          >
            <Heart size={16} />
            <span className="hidden sm:inline">お気に入り</span>
            {favCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {favCount}
              </span>
            )}
          </a>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* PC: サイドバー（フィルタ + リスト） */}
        <div className="hidden lg:flex lg:flex-col lg:w-[360px] lg:shrink-0 border-r">
          <div className="overflow-y-auto">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              resultCount={filteredSchools.length}
              totalCount={schools.length}
              isOpen={true}
              onToggle={() => {}}
            />
          </div>
          <div className="border-t flex-1 overflow-y-auto" ref={listRef}>
            <div className="p-2 bg-gray-50 text-xs text-gray-500 sticky top-0 border-b">
              {filteredSchools.length}校表示中
            </div>
            {filteredSchools.map((s) => (
              <div key={s.study_id} data-id={s.study_id}>
                <SchoolCard
                  school={s}
                  isSelected={s.study_id === selectedId}
                  isFavorite={isFavorite(s.study_id)}
                  onSelect={() =>
                    setSelectedId(s.study_id === selectedId ? null : s.study_id)
                  }
                  onFavoriteToggle={() => toggle(s.study_id)}
                  originLat={filters.originLat}
                  originLng={filters.originLng}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 地図 */}
        <div className="flex-1 relative">
          <MapContainer
            schools={filteredSchools}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onFavoriteToggle={toggle}
            isFavorite={isFavorite}
          />

          {/* モバイル: リスト表示トグル */}
          <button
            onClick={() => setShowList(!showList)}
            className="lg:hidden absolute top-3 left-3 z-10 bg-white shadow rounded-full px-3 py-2 text-xs font-medium flex items-center gap-1"
          >
            <Search size={14} />
            {filteredSchools.length}校
          </button>

          {/* モバイル: スクロールリスト */}
          {showList && (
            <div className="lg:hidden absolute bottom-0 left-0 right-0 z-30 max-h-[40vh] bg-white rounded-t-2xl shadow-lg overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {filteredSchools.length}校表示中
                </span>
                <button
                  onClick={() => setShowList(false)}
                  className="text-xs text-gray-400"
                >
                  閉じる
                </button>
              </div>
              {filteredSchools.map((s) => (
                <div key={s.study_id} data-id={s.study_id}>
                  <SchoolCard
                    school={s}
                    isSelected={s.study_id === selectedId}
                    isFavorite={isFavorite(s.study_id)}
                    onSelect={() => {
                      setSelectedId(
                        s.study_id === selectedId ? null : s.study_id
                      )
                      setShowList(false)
                    }}
                    onFavoriteToggle={() => toggle(s.study_id)}
                    originLat={filters.originLat}
                    originLng={filters.originLng}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* モバイル: フィルタパネル */}
      <div className="lg:hidden">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={filteredSchools.length}
          totalCount={schools.length}
          isOpen={filterOpen}
          onToggle={() => setFilterOpen(!filterOpen)}
        />
      </div>
    </div>
  )
}

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  if (!apiKey) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        <p>Google Maps APIキーが設定されていません。.env.localを確認してください。</p>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <HomeContent />
    </APIProvider>
  )
}
