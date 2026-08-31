"use client"
import { useQuery } from "@tanstack/react-query"
import { TeamLogo } from "./team-logo"
import { Trophy, Zap, Users, ShieldCheck } from "lucide-react"

interface AwardLeader {
  mascot: string
  manager: string
  yards: number
  team_id: string
}

interface AwardsData {
  week: number
  heisman: AwardLeader
  referrals_leader: AwardLeader
  upsell_leader: AwardLeader
  vpp_leader: AwardLeader
}

function AwardCard({ icon, title, sub, leader }: {
  icon: React.ReactNode
  title: string
  sub: string
  leader: AwardLeader
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-950 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-yellow-400">{icon}</div>
        <div>
          <div className="text-sm font-bold text-gray-100">{title}</div>
          <div className="text-[10px] text-gray-500">{sub}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <TeamLogo employeeId={leader.team_id} size={44} />
        <div>
          <div className="text-base font-bold text-gray-100">{leader.mascot}</div>
          <div className="text-xs text-gray-400 italic">{leader.manager}</div>
          <div className="text-lg font-black text-yellow-400 leading-none mt-1">{leader.yards}</div>
        </div>
      </div>
    </div>
  )
}

export function AwardsPanel({ week }: { week: number }) {
  const { data, isLoading } = useQuery<AwardsData>({
    queryKey: ["awards", week],
    queryFn: () => fetch(`/api/awards?week=${week}`).then(r => r.json()),
  })

  if (isLoading || !data) return (
    <div className="text-gray-500 text-sm py-8 text-center">Loading awards…</div>
  )

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <AwardCard
        icon={<Trophy size={20} />}
        title="Top Performer"
        sub="Composite Score Leader"
        leader={data.heisman}
      />
      <AwardCard
        icon={<Users size={20} />}
        title="Referrals Leader"
        sub="Referrals / 100 (40%)"
        leader={data.referrals_leader}
      />
      <AwardCard
        icon={<Zap size={20} />}
        title="Upsell Leader"
        sub="Upsell / Install % (40%)"
        leader={data.upsell_leader}
      />
      <AwardCard
        icon={<ShieldCheck size={20} />}
        title="VPP Leader"
        sub="Protection Plan (20%)"
        leader={data.vpp_leader}
      />
    </div>
  )
}
