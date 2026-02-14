"use client"

import { ArrowLeft, Heart, MapPin } from "lucide-react"
import { useSchools } from "@/hooks/useSchools"
import { useFavorites } from "@/hooks/useFavorites"
import { SchoolCard } from "@/components/school/SchoolCard"

export default function FavoritesPage() {
  const { schools, loading } = useSchools()
  const { favorites, toggle, isFavorite } = useFavorites()

  const favoriteSchools = schools
    .filter((s) => favorites.has(s.study_id))
    .map((s) => ({ ...s, distanceKm: null as number | null }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <a href="/" className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} />
        </a>
        <h1 className="font-bold text-lg flex items-center gap-2">
          <Heart size={18} className="text-red-500" />
          お気に入り
        </h1>
      </header>

      <main className="max-w-2xl mx-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : favoriteSchools.length === 0 ? (
          <div className="p-8 text-center">
            <Heart size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">お気に入りがありません</p>
            <p className="text-sm text-gray-400">
              マップで学校のハートボタンを押すと追加できます
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-blue-500 text-white rounded-full text-sm"
            >
              <MapPin size={14} />
              マップに戻る
            </a>
          </div>
        ) : (
          <div className="bg-white">
            <div className="p-3 text-sm text-gray-500 border-b">
              {favoriteSchools.length}校
            </div>
            {favoriteSchools.map((s) => (
              <SchoolCard
                key={s.study_id}
                school={s}
                isSelected={false}
                isFavorite={isFavorite(s.study_id)}
                onSelect={() => {}}
                onFavoriteToggle={() => toggle(s.study_id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
