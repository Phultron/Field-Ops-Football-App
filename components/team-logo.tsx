"use client"
import { ICON_PATHS } from "@/lib/teams"
import { useLogoMap } from "@/lib/logo-context"

interface Props {
  employeeId: string
  size?: number
  className?: string
}

export function TeamLogo({ employeeId, size = 40, className }: Props) {
  const logoMap = useLogoMap()
  const cfg = logoMap[employeeId] ?? { primary: "#374151", accent: "#9CA3AF", icon: "bolt" as const }
  const iconD = ICON_PATHS[cfg.icon] ?? ICON_PATHS.bolt

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <path
        d="M20,2 L38,9 L38,29 Q20,40 20,40 Q2,29 2,29 L2,9 Z"
        fill={cfg.primary}
        stroke={cfg.accent}
        strokeWidth={1.5}
      />
      <path d={iconD} fill={cfg.accent} />
    </svg>
  )
}
