"use client"

import { createContext, useContext, type ReactNode } from "react"
import { TEAM_LOGOS, type TeamLogo } from "./teams"

const LogoMapContext = createContext<Record<string, TeamLogo> | null>(null)

export function LogoMapProvider({
  logoMap,
  children,
}: {
  logoMap: Record<string, TeamLogo> | null
  children: ReactNode
}) {
  return <LogoMapContext.Provider value={logoMap}>{children}</LogoMapContext.Provider>
}

/**
 * Returns the active employee_id -> TeamLogo map. Falls back to the static TEAM_LOGOS
 * import when no provider is mounted (default/public behavior, unchanged).
 */
export function useLogoMap(): Record<string, TeamLogo> {
  const ctx = useContext(LogoMapContext)
  return ctx ?? TEAM_LOGOS
}
