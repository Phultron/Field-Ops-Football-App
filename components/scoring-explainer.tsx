"use client"
import { useState } from "react"
import { Info, X } from "lucide-react"

const METRICS = [
  {
    stat: "Referrals",
    icon: "🤝",
    label: "Referrals / 100",
    weight: "40%",
    desc: "Number of qualified customer referrals generated during the week, normalized to a 0–100 scale. Each referral that results in a new customer earns maximum points.",
  },
  {
    stat: "Upsell %",
    icon: "📈",
    label: "Upsell / Install %",
    weight: "40%",
    desc: "Percentage of installation appointments where the technician successfully upsells an additional product or service. Higher attach rates earn more points.",
  },
  {
    stat: "VPP",
    icon: "🛡️",
    label: "Protection Plan",
    weight: "20%",
    desc: "Protection plan attachment rate — the percentage of customers who add a protection plan. Rewards technicians who present and sell the protection offering.",
  },
]

export function ScoringExplainer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-gray-600 hover:text-gray-400 transition-colors"
        aria-label="How scoring works"
        title="How scoring works"
      >
        <Info size={13} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-200"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">How Scoring Works</h3>
            <p className="text-xs text-gray-500 mb-5">
              Each day of the week, your team earns a composite score based on three
              metrics: Referrals (40%), Upsell/Install % (40%), and VPP (20%).
              Daily composite performance determines ball movement on the field.
            </p>

            <div className="space-y-4">
              {METRICS.map(m => (
                <div key={m.stat} className="flex gap-3">
                  <span className="text-2xl leading-none mt-0.5">{m.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-gray-100">
                      {m.label}
                      <span className="ml-2 text-[10px] font-normal text-yellow-600 uppercase tracking-wider">{m.weight}</span>
                      <span className="ml-2 text-[10px] font-normal text-gray-500 uppercase tracking-wider">{m.stat}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-800 text-[11px] text-gray-600">
              Ball advances toward the opponent's endzone each day you outscore them.
              Reach the endzone for a Touchdown (7 pts). First down marker resets every 10 yards gained.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
