"use client"
import { useEffect, useRef, useState } from "react"
import { TeamLogo } from "./team-logo"
import { ScoringExplainer } from "./scoring-explainer"
import type { Team } from "@/lib/teams"
import { useLogoMap } from "@/lib/logo-context"
import type { DriveResult } from "@/lib/demo"

interface ScoreSummary {
  referrals: number
  upsell_pct: number
  vpp: number
  composite_score: number
}

interface GameData {
  week: number
  week_label: string
  team_a: Team
  team_b: Team
  score_a: ScoreSummary
  score_b: ScoreSummary
  drive: DriveResult
  ball_positions: number[]
  ball_on: string
  glow_color: string | null
  div_color: { primary: string; light: string }
  logo_a: { primary: string; accent: string; icon: string } | null
  logo_b: { primary: string; accent: string; icon: string } | null
}

// Field geometry (SVG coordinate space, viewBox="0 0 800 200")
const W = 800, H = 200
const EZ = 80          // end zone width each side
const FL = EZ          // field left edge
const FR = W - EZ      // field right edge
const FW = FR - FL     // field play width
const BY = H / 2       // ball y-center

// Precomputed field constants
const STRIPES   = [10, 20, 30, 40, 50, 60, 70, 80, 90]
const STRIPE_XS = STRIPES.map(y => FL + (y / 100) * FW)
const YARD_NUMS = [10, 20, 30, 40, 50, 40, 30, 20, 10]
const GP_CXA = FL - 10
const GP_CXB = FR + 10
const GP_HW   = 13
const GP_BASE_Y = Math.round(H * 0.74)
const GP_BAR_Y  = Math.round(H * 0.46)
const GP_TOP_Y  = Math.round(H * 0.07)
const MID_X = FL + FW / 2

function FootballField({ teamA, teamB, glowColor, ballPositions, animationKey }: {
  teamA: Team
  teamB: Team
  glowColor: string | null
  ballPositions: number[]
  animationKey: string
}) {
  // Animated position in field-pct (0–100), starting at midfield
  const [animPct, setAnimPct]         = useState(50)
  const [glowVisible, setGlowVisible] = useState(false)
  const [fdTarget, setFdTarget]       = useState<number | null>(null) // first-down line pct
  const [fdFlash, setFdFlash]         = useState(false)               // "FIRST DOWN!" visible
  const [tdFlash, setTdFlash]         = useState<"A" | "B" | null>(null) // "TOUCHDOWN!" visible
  const [fgFlashTeam, setFgFlashTeam] = useState<"A" | "B" | null>(null) // "FIELD GOAL!" visible
  const logoMap = useLogoMap()
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const fdTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const tdTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const fgTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const svgRef       = useRef<SVGSVGElement>(null)
  const hasPlayed    = useRef(false)
  const prevPctRef   = useRef(50)
  const dirRef       = useRef(1)   // +1 toward team B's endzone, -1 toward team A's
  const fdTargetRef  = useRef(60)  // mirrors fdTarget but readable inside setInterval

  // Kick off the step-through animation
  const startAnimation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (fdTimerRef.current)  clearTimeout(fdTimerRef.current)

    setAnimPct(50)
    setGlowVisible(false)
    setFdFlash(false)
    setTdFlash(null)
    setFgFlashTeam(null)
    if (tdTimerRef.current) clearTimeout(tdTimerRef.current)
    if (fgTimerRef.current) clearTimeout(fgTimerRef.current)
    prevPctRef.current = 50

    // Determine which direction the ball will predominantly travel
    const finalPos = ballPositions[ballPositions.length - 1] ?? 50
    const dir = finalPos >= 50 ? 1 : -1
    dirRef.current = dir

    // First first-down marker: 10 yards from midfield in that direction
    const initialTarget = Math.min(90, Math.max(10, 50 + dir * 10))
    fdTargetRef.current = initialTarget
    setFdTarget(initialTarget)

    let step = 0
    intervalRef.current = setInterval(() => {
      step++
      if (step < ballPositions.length) {
        const newPct  = ballPositions[step]
        const prevPct = prevPctRef.current
        const target  = fdTargetRef.current
        const d       = dirRef.current

        // Did the ball cross the first-down marker this step?
        const crossed = d > 0
          ? prevPct < target && newPct >= target
          : prevPct > target && newPct <= target

        if (crossed) {
          setFdFlash(true)
          if (fdTimerRef.current) clearTimeout(fdTimerRef.current)
          fdTimerRef.current = setTimeout(() => setFdFlash(false), 1600)

          // Move marker another 10 yards
          const newTarget = Math.min(90, Math.max(10, newPct + d * 10))
          fdTargetRef.current = newTarget
          setFdTarget(newTarget)
        }

        // Touchdown detection: ball crosses into end zone
        if (newPct >= 90 && prevPct < 90) {
          setTdFlash("A")
          if (tdTimerRef.current) clearTimeout(tdTimerRef.current)
          tdTimerRef.current = setTimeout(() => setTdFlash(null), 2800)
        } else if (newPct <= 10 && prevPct > 10) {
          setTdFlash("B")
          if (tdTimerRef.current) clearTimeout(tdTimerRef.current)
          tdTimerRef.current = setTimeout(() => setTdFlash(null), 2800)
        }

        // Field goal detection: ball enters FG range (75–89 or 11–25)
        if (newPct >= 75 && newPct < 90 && prevPct < 75) {
          setFgFlashTeam("A")
          if (fgTimerRef.current) clearTimeout(fgTimerRef.current)
          fgTimerRef.current = setTimeout(() => setFgFlashTeam(null), 2000)
        } else if (newPct > 10 && newPct <= 25 && prevPct > 25) {
          setFgFlashTeam("B")
          if (fgTimerRef.current) clearTimeout(fgTimerRef.current)
          fgTimerRef.current = setTimeout(() => setFgFlashTeam(null), 2000)
        }

        prevPctRef.current = newPct
        setAnimPct(newPct)
      } else {
        clearInterval(intervalRef.current!)
        setGlowVisible(true)
      }
    }, 450)
  }

  useEffect(() => {
    // Reset "has played" whenever the animation key changes (new week/division)
    hasPlayed.current = false
    setAnimPct(50)
    setGlowVisible(false)
    setFdTarget(null)
    setFdFlash(false)
    setTdFlash(null)
    setFgFlashTeam(null)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (fdTimerRef.current)  clearTimeout(fdTimerRef.current)
    if (tdTimerRef.current)  clearTimeout(tdTimerRef.current)
    if (fgTimerRef.current)  clearTimeout(fgTimerRef.current)

    if (!svgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true
          startAnimation()
          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(svgRef.current)
    return () => {
      observer.disconnect()
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (fdTimerRef.current)  clearTimeout(fdTimerRef.current)
    }
  }, [animationKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const ballPct  = Math.max(3, Math.min(97, animPct))
  const ballX    = FL + (ballPct / 100) * FW
  // translateX offset from midfield (the ball group is positioned at midfield in SVG coords,
  // then shifted by transform so CSS can transition it)
  const offsetX  = ballX - MID_X
  const arrowDx  = ballPct > 51 ? 1 : ballPct < 49 ? -1 : 0
  const tip      = MID_X + arrowDx * 14  // arrow in the untranslated group coord space

  const abbrA = (teamA.mascot.split(" ").at(-1) ?? "A").slice(0, 8).toUpperCase()
  const abbrB = (teamB.mascot.split(" ").at(-1) ?? "B").slice(0, 8).toUpperCase()

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-md"
      style={{ display: "block", margin: "8px 0" }}
      aria-label="Football field"
    >
      {/* ── Static field ── */}
      <rect width={W} height={H} fill="#111827" />

      {/* End zones */}
      <rect x={0}  y={0} width={EZ}       height={H} fill="#1a3a1a" />
      <rect x={FR} y={0} width={W - FR}   height={H} fill="#1a3a1a" />

      {/* End zone team labels */}
      <text x={EZ / 2} y={H / 2} fill="white" fontSize={9} fontWeight="700"
        textAnchor="middle" dominantBaseline="middle" opacity={0.85}
        transform={`rotate(-90,${EZ / 2},${H / 2})`}>{abbrA}</text>
      <text x={FR + (W - FR) / 2} y={H / 2} fill="white" fontSize={9} fontWeight="700"
        textAnchor="middle" dominantBaseline="middle" opacity={0.85}
        transform={`rotate(90,${FR + (W - FR) / 2},${H / 2})`}>{abbrB}</text>

      {/* Playing field */}
      <rect x={FL} y={0} width={FW} height={H} fill="#14532d" />

      {/* Alternating stripes */}
      {STRIPES.map((y, i) => {
        if (i % 2 === 0) return null
        const x = FL + (y / 100) * FW
        return <rect key={y} x={x - FW / 10} y={0} width={FW / 10} height={H} fill="#166534" opacity={0.5} />
      })}

      {/* Yard lines */}
      {STRIPE_XS.map((x, i) => (
        <line key={i} x1={x} y1={0} x2={x} y2={H}
          stroke="rgba(255,255,255,0.35)" strokeWidth={STRIPES[i] === 50 ? 2.5 : 1.5} />
      ))}

      {/* Hash marks */}
      {STRIPE_XS.map((x, i) => (
        <g key={`hash-${i}`}>
          <line x1={x - 8} y1={H * 0.32} x2={x + 8} y2={H * 0.32} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
          <line x1={x - 8} y1={H * 0.68} x2={x + 8} y2={H * 0.68} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
        </g>
      ))}

      {/* Yard numbers */}
      {STRIPE_XS.map((x, i) => (
        <text key={`num-${i}`} x={x} y={H - 8} fill="rgba(255,255,255,0.85)"
          fontSize={15} fontWeight="700" textAnchor="middle" dominantBaseline="auto"
          fontFamily="Arial,sans-serif">{YARD_NUMS[i]}</text>
      ))}

      {/* Goal posts – team A */}
      <line x1={GP_CXA} y1={GP_BAR_Y} x2={GP_CXA} y2={GP_BASE_Y} stroke="#FFD700" strokeWidth={3} strokeLinecap="round" />
      <line x1={GP_CXA - GP_HW} y1={GP_BAR_Y} x2={GP_CXA + GP_HW} y2={GP_BAR_Y} stroke="#FFD700" strokeWidth={3} strokeLinecap="round" />
      <line x1={GP_CXA - GP_HW} y1={GP_BAR_Y} x2={GP_CXA - GP_HW} y2={GP_TOP_Y} stroke="#FFD700" strokeWidth={3} strokeLinecap="round" />
      <line x1={GP_CXA + GP_HW} y1={GP_BAR_Y} x2={GP_CXA + GP_HW} y2={GP_TOP_Y} stroke="#FFD700" strokeWidth={3} strokeLinecap="round" />

      {/* Goal posts – team B */}
      <line x1={GP_CXB} y1={GP_BAR_Y} x2={GP_CXB} y2={GP_BASE_Y} stroke="#FFD700" strokeWidth={3} strokeLinecap="round" />
      <line x1={GP_CXB - GP_HW} y1={GP_BAR_Y} x2={GP_CXB + GP_HW} y2={GP_BAR_Y} stroke="#FFD700" strokeWidth={3} strokeLinecap="round" />
      <line x1={GP_CXB - GP_HW} y1={GP_BAR_Y} x2={GP_CXB - GP_HW} y2={GP_TOP_Y} stroke="#FFD700" strokeWidth={3} strokeLinecap="round" />
      <line x1={GP_CXB + GP_HW} y1={GP_BAR_Y} x2={GP_CXB + GP_HW} y2={GP_TOP_Y} stroke="#FFD700" strokeWidth={3} strokeLinecap="round" />

      {/* Drive trail: static dashed line from midfield to current ball */}
      <line x1={MID_X} y1={BY} x2={ballX} y2={BY}
        stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="5,4" />
      <circle cx={MID_X} cy={BY} r={4} fill="white" opacity={0.2} />

      {/* ── Field Goal flash ── */}
      {fgFlashTeam && (() => {
        const scoringTeam = fgFlashTeam === "A" ? teamA : teamB
        const fgColor     = logoMap[scoringTeam.employee_id]?.primary ?? "#22c55e"
        const fgAccent    = logoMap[scoringTeam.employee_id]?.accent  ?? "#ffffff"
        const teamShort   = (scoringTeam.mascot.split(" ").at(-1) ?? scoringTeam.mascot).toUpperCase()
        const fgX         = fgFlashTeam === "A" ? FR + (W - FR) / 2 : EZ / 2
        return (
          <g>
            {/* Uprights flash */}
            <line x1={fgX} y1={GP_TOP_Y} x2={fgX} y2={GP_BASE_Y}
              stroke={fgAccent} strokeWidth={4} strokeLinecap="round"
              style={{ opacity: 0, animation: "fgUpright 2s ease forwards" }} />
            {/* FIELD GOAL! text */}
            <text
              x={fgX} y={BY - 28}
              fill={fgAccent} fontSize={18} fontWeight="900"
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="Arial Black, Arial, sans-serif"
              stroke={fgColor} strokeWidth={4} paintOrder="stroke"
              style={{ animation: "fgText 2s ease forwards" }}
            >FIELD GOAL!</text>
            <text
              x={fgX} y={BY + 28}
              fill={fgAccent} fontSize={12} fontWeight="800"
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="Arial Black, Arial, sans-serif"
              stroke="#111827" strokeWidth={3} paintOrder="stroke"
              style={{ animation: "fgText 2s ease 0.1s forwards" }}
            >{teamShort} +3</text>
          </g>
        )
      })()}

      {/* ── Touchdown flash ── */}
      {tdFlash && (() => {
        const scoringTeam   = tdFlash === "A" ? teamA : teamB
        const tdColor       = logoMap[scoringTeam.employee_id]?.primary ?? "#22c55e"
        const tdAccent      = logoMap[scoringTeam.employee_id]?.accent  ?? "#ffffff"
        const teamShort     = (scoringTeam.mascot.split(" ").at(-1) ?? scoringTeam.mascot).toUpperCase()
        // Flash at the end zone the scoring team drove into
        const tdX = tdFlash === "A" ? FR + (W - FR) / 2 : EZ / 2

        return (
          <g>
            {/* Field flash overlay */}
            <rect x={FL} y={0} width={FW} height={H} fill={tdColor}
              style={{ opacity: 0, animation: "tdFieldFlash 2.8s ease forwards" }} />

            {/* Starburst rays */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
              const rad  = (angle * Math.PI) / 180
              const len  = 50 + (i % 3) * 12
              const x2   = tdX + Math.cos(rad) * len
              const y2   = BY  + Math.sin(rad) * len
              return (
                <line key={i}
                  x1={tdX} y1={BY} x2={x2} y2={y2}
                  stroke={tdAccent} strokeWidth={2.5} strokeLinecap="round"
                  style={{ opacity: 0, animation: `tdBurst 2.8s ease ${i * 0.03}s forwards` }}
                />
              )
            })}

            {/* "TOUCHDOWN!" label */}
            <text
              x={tdX} y={BY - 38}
              fill={tdAccent} fontSize={22} fontWeight="900"
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="Arial Black, Arial, sans-serif"
              stroke={tdColor} strokeWidth={5} paintOrder="stroke"
              style={{ animation: "tdText 2.8s ease forwards" }}
            >TOUCHDOWN!</text>

            {/* Team name */}
            <text
              x={tdX} y={BY + 36}
              fill={tdAccent} fontSize={13} fontWeight="800"
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="Arial Black, Arial, sans-serif"
              stroke="#111827" strokeWidth={3} paintOrder="stroke"
              style={{ animation: "tdText 2.8s ease 0.1s forwards" }}
            >{teamShort}</text>
          </g>
        )
      })()}

      {/* ── First-down line ── */}      {fdTarget !== null && (() => {
        const fdX = FL + (Math.max(3, Math.min(97, fdTarget)) / 100) * FW
        return (
          <g>
            {/* Solid yellow line across the full field height */}
            <line x1={fdX} y1={0} x2={fdX} y2={H}
              stroke="#FFD700" strokeWidth={2.5} strokeOpacity={0.85} />
            {/* Small downward-pointing triangle marker at the top */}
            <polygon
              points={`${fdX - 7},0 ${fdX + 7},0 ${fdX},12`}
              fill="#FFD700" opacity={0.9}
            />
            {/* "FIRST DOWN!" flash — appears when ball crosses the marker */}
            {fdFlash && (
              <text
                x={fdX} y={BY - 26}
                fill="#FFD700"
                fontSize={20} fontWeight="900"
                textAnchor="middle" dominantBaseline="middle"
                fontFamily="Arial Black, Arial, sans-serif"
                stroke="#111827" strokeWidth={4} paintOrder="stroke"
                style={{ animation: "fdFlash 1.6s ease forwards" }}
              >
                FIRST DOWN!
              </text>
            )}
          </g>
        )
      })()}

      {/* ── Animated ball group ──
          Everything in here is centred at MID_X in SVG space,
          then shifted by offsetX via CSS transform for smooth hardware-accelerated motion. */}
      <g style={{
        transform: `translateX(${offsetX}px)`,
        transition: "transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Winner glow — fades in once animation completes */}
        {glowColor && glowVisible && <>
          <circle cx={MID_X} cy={BY} r={28} fill={glowColor}
            style={{ opacity: 0, animation: "fadeIn 0.5s ease forwards" }} />
          <circle cx={MID_X} cy={BY} r={17} fill={glowColor}
            style={{ opacity: 0, animation: "fadeIn 0.5s ease 0.1s forwards" }} />
        </>}

        {/* Ball */}
        <circle cx={MID_X} cy={BY} r={10} fill="white" stroke="#111827" strokeWidth={2.5} />
        <ellipse cx={MID_X} cy={BY} rx={5.5} ry={4.5} fill="#c46e00" />

        {/* Direction arrow */}
        {arrowDx !== 0 && (
          <polygon
            points={`${MID_X + arrowDx * 14},${BY} ${MID_X + arrowDx * 8},${BY - 4} ${MID_X + arrowDx * 8},${BY + 4}`}
            fill="#111827" opacity={0.9}
          />
        )}
      </g>

      {/* Keyframes */}
      <defs>
        <style>{`
          @keyframes fadeIn  { from { opacity: 0 } to { opacity: 0.28 } }
          @keyframes fdFlash {
            0%   { opacity: 0; transform: scale(0.7) }
            15%  { opacity: 1; transform: scale(1.15) }
            30%  { transform: scale(1) }
            65%  { opacity: 1 }
            100% { opacity: 0; transform: scale(0.95) }
          }
          @keyframes fgText {
            0%   { opacity: 0; transform: scale(0.5) }
            12%  { opacity: 1; transform: scale(1.2) }
            25%  { transform: scale(1.0) }
            70%  { opacity: 1 }
            100% { opacity: 0; transform: scale(0.9) }
          }
          @keyframes fgUpright {
            0%   { opacity: 0 }
            10%  { opacity: 1 }
            60%  { opacity: 0.7 }
            100% { opacity: 0 }
          }
          @keyframes tdText {
            0%   { opacity: 0; transform: scale(0.3) }
            10%  { opacity: 1; transform: scale(1.35) }
            20%  { transform: scale(1.0) }
            65%  { opacity: 1 }
            100% { opacity: 0; transform: scale(0.85) }
          }
          @keyframes tdBurst {
            0%   { opacity: 0 }
            12%  { opacity: 0.9 }
            50%  { opacity: 0.4 }
            100% { opacity: 0 }
          }
          @keyframes tdFieldFlash {
            0%   { opacity: 0 }
            8%   { opacity: 0.18 }
            30%  { opacity: 0.1 }
            100% { opacity: 0 }
          }
        `}</style>
      </defs>
    </svg>
  )
}

export function MatchupCard({ game, animationKey, onTeamClick }: { game: GameData; animationKey: string; onTeamClick?: (id: string) => void }) {
  const { team_a, team_b, score_a, score_b, drive, ball_on, glow_color, div_color } = game

  const winner = drive.score_a > drive.score_b ? "A" : drive.score_b > drive.score_a ? "B" : "T"
  const scoreColorA = winner === "A" ? "#22c55e" : winner === "B" ? "#ef4444" : "#f9fafb"
  const scoreColorB = winner === "B" ? "#22c55e" : winner === "A" ? "#ef4444" : "#f9fafb"
  const moveIcon = drive.last_net > 3 ? " ▶" : drive.last_net < -3 ? " ◀" : ""

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-950 p-4 mb-4 font-sans">
      {/* Header row */}
      <div className="grid grid-cols-3 text-center mb-3 pb-3 border-b border-gray-800">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-gray-500">Down</div>
          <div className="text-lg font-bold text-gray-100">{game.week_label}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-gray-500">Ball On</div>
          <div className="text-sm font-bold text-gray-100 truncate">{ball_on}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-gray-500">Drive</div>
          <div className="text-lg font-bold text-gray-100">{drive.days_played}d{moveIcon}</div>
        </div>
      </div>

      {/* Score row — responsive */}
      <div className="flex justify-between items-start mb-2 gap-1">
        <div className="flex-1 min-w-0">
          <button onClick={() => onTeamClick?.(team_a.employee_id)} className="text-left w-full hover:opacity-80 transition-opacity">
            <div className="text-xs sm:text-sm font-bold truncate" style={{ color: div_color.light }}>{team_a.mascot}</div>
          </button>
          <div className="my-1"><TeamLogo employeeId={team_a.employee_id} size={32} /></div>
          <div className="text-[10px] text-gray-500 truncate">{team_a.district}</div>
          <div className="text-[10px] text-gray-400 italic truncate">{team_a.manager_name}</div>
          <div className="text-3xl sm:text-4xl font-black leading-none mt-1" style={{ color: scoreColorA }}>
            {drive.score_a}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{score_a.composite_score} pts</div>
        </div>

        <div className="text-xs text-gray-600 font-semibold px-1 pt-8">VS</div>

        <div className="flex-1 min-w-0 text-right">
          <button onClick={() => onTeamClick?.(team_b.employee_id)} className="text-right w-full hover:opacity-80 transition-opacity">
            <div className="text-xs sm:text-sm font-bold truncate" style={{ color: div_color.light }}>{team_b.mascot}</div>
          </button>
          <div className="my-1 flex justify-end"><TeamLogo employeeId={team_b.employee_id} size={32} /></div>
          <div className="text-[10px] text-gray-500 truncate text-right">{team_b.district}</div>
          <div className="text-[10px] text-gray-400 italic truncate text-right">{team_b.manager_name}</div>
          <div className="text-3xl sm:text-4xl font-black leading-none mt-1" style={{ color: scoreColorB }}>
            {drive.score_b}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{score_b.composite_score} pts</div>
        </div>
      </div>

      {/* Football field */}
      <FootballField
        teamA={team_a}
        teamB={team_b}
        glowColor={glow_color}
        ballPositions={game.ball_positions ?? [50]}
        animationKey={animationKey}
      />

      {/* Stat boxes */}
      <div className="flex items-center justify-between mt-3 mb-1.5">
        <div className="text-[9px] uppercase tracking-widest text-gray-600">Performance</div>
        <ScoringExplainer />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "REFERRALS YDS", sub: "40% weight", a: score_a.referrals,  b: score_b.referrals,  pct: false },
          { label: "UPSELL YDS", sub: "40% weight", a: score_a.upsell_pct, b: score_b.upsell_pct, pct: false },
          { label: "VPP YDS",    sub: "20% weight", a: score_a.vpp,        b: score_b.vpp,        pct: false },
        ].map(({ label, sub, a, b, pct }) => (
          <div key={label} className="rounded-lg bg-gray-900 border border-gray-800 px-2 py-2 text-center">
            <div className="text-[9px] uppercase tracking-widest text-gray-500">{label}</div>
            <div className="text-sm font-bold text-gray-100">
              {pct ? `${a}% – ${b}%` : `${a} – ${b}`}
            </div>
            <div className="text-[9px] text-gray-600">{sub}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-2 flex justify-between items-center text-[10px] text-gray-500">
        <span>
          {team_a.mascot.split(" ").at(-1)}{" "}
          {drive.td_a > 0 && `${drive.td_a}TD`}
          {drive.td_a > 0 && drive.fg_a > 0 && " "}
          {drive.fg_a > 0 && `${drive.fg_a}FG`}
          {drive.td_a === 0 && drive.fg_a === 0 && "—"}
          {" – "}
          {team_b.mascot.split(" ").at(-1)}{" "}
          {drive.td_b > 0 && `${drive.td_b}TD`}
          {drive.td_b > 0 && drive.fg_b > 0 && " "}
          {drive.fg_b > 0 && `${drive.fg_b}FG`}
          {drive.td_b === 0 && drive.fg_b === 0 && "—"}
          &nbsp;·&nbsp; Day {drive.days_played}/4
          &nbsp;·&nbsp; Perf: {score_a.composite_score} – {score_b.composite_score}
        </span>
        <span className="bg-yellow-500 text-black text-[9px] font-bold px-2 py-0.5 rounded">LIVE</span>
      </div>
    </div>
  )
}
