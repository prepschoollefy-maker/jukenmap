"use client"

import { useState, useEffect } from "react"
import type { School } from "@/types/school"

let cachedSchools: School[] | null = null

export function useSchools() {
  const [schools, setSchools] = useState<School[]>(cachedSchools || [])
  const [loading, setLoading] = useState(!cachedSchools)

  useEffect(() => {
    if (cachedSchools) return
    fetch("/data/schools.json")
      .then((res) => res.json())
      .then((data: School[]) => {
        cachedSchools = data
        setSchools(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { schools, loading }
}
