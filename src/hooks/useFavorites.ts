"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "jukenmap_favorites"

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setFavorites(new Set(JSON.parse(stored)))
      }
    } catch {
      // ignore
    }
    setLoaded(true)
  }, [])

  const toggle = useCallback((studyId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(studyId)) {
        next.delete(studyId)
      } else {
        next.add(studyId)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (studyId: string) => favorites.has(studyId),
    [favorites]
  )

  return { favorites, toggle, isFavorite, loaded, count: favorites.size }
}
