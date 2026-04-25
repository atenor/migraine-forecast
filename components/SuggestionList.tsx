import type { Suggestion } from "@/lib/suggestions";
import Icon from "./Icon";

function iconName(category: string) {
  if (category === "preventive") return "shield"  as const;
  if (category === "lifestyle")  return "leaf"    as const;
  if (category === "relief")     return "capsule" as const;
  return "spark" as const;
}

export default function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  if (!suggestions.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {suggestions.slice(0, 8).map(s => (
        <div key={s.id} className="glass p-5 flex gap-4 items-start">
          <div className="w-11 h-11 rounded-2xl bg-calm-sage/10 border border-calm-sage/25 text-calm-sage
                          flex items-center justify-center shrink-0">
            <Icon name={iconName(s.category)} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-semibold text-white/90 text-[15px]">{s.title}</span>
              {s.evidence === "strong"   && <span className="badge-strong">Strong evidence</span>}
              {s.evidence === "moderate" && <span className="badge-moderate">Moderate evidence</span>}
              {s.evidence === "anecdotal"&& <span className="badge-anecdotal">Anecdotal</span>}
              {s.fromHistory && (
                <span className="inline-flex items-center gap-1 text-[12px] bg-calm-lavender/10 text-calm-lavender border border-calm-lavender/25 rounded-full px-2.5 py-0.5">
                  <Icon name="check" size={11} /> Worked for you
                </span>
              )}
            </div>
            <p className="text-[14px] sm:text-[15px] text-white/55 leading-relaxed">{s.detail}</p>
            {s.historyNote && (
              <p className="text-[13px] text-calm-lavender mt-2 italic">{s.historyNote}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
