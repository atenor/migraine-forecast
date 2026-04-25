export interface Suggestion { id: string; category: "preventive"|"relief"|"lifestyle"|"medical"; title: string; detail: string; evidence: "strong"|"moderate"|"anecdotal"; fromHistory?: boolean; historyNote?: string; }
export interface HistoricalPattern { reliefMethod: string; avgSeverityReduction: number; useCount: number; }
const PREV: Suggestion[] = [
  {id:"hydrate",category:"preventive",title:"Increase hydration now",detail:"Drink 16–24 oz of water in the next hour. Dehydration amplifies pressure-change sensitivity.",evidence:"strong"},
  {id:"magnesium",category:"medical",title:"Consider magnesium supplementation",detail:"400–500mg magnesium glycinate has strong evidence for migraine prevention. Take with food.",evidence:"strong"},
  {id:"sleep-protect",category:"lifestyle",title:"Protect tonight's sleep",detail:"Aim for 8h. Poor sleep on a high-pressure-change day significantly increases migraine probability.",evidence:"strong"},
  {id:"screen",category:"lifestyle",title:"Reduce screen brightness & time",detail:"Lower screen brightness and take breaks. Visual stress compounds barometric pressure sensitivity.",evidence:"moderate"},
  {id:"caffeine",category:"lifestyle",title:"Moderate caffeine carefully",detail:"One moderate dose can help, but avoid excess or withdrawal — both trigger migraines.",evidence:"strong"},
  {id:"stress",category:"lifestyle",title:"Stress reduction techniques",detail:"Even 10 minutes of deep breathing or progressive muscle relaxation can lower cortisol.",evidence:"moderate"},
  {id:"preemptive-nsaid",category:"medical",title:"Consider preemptive NSAID",detail:"If your doctor approves, taking ibuprofen or naproxen at first warning signs is significantly more effective than waiting.",evidence:"strong"},
  {id:"neck-stretch",category:"lifestyle",title:"Neck & shoulder stretches",detail:"Tension in the suboccipital muscles often co-occurs with barometric migraines.",evidence:"moderate"},
];
const RELIEF: Suggestion[] = [
  {id:"dark-room",category:"relief",title:"Dark, quiet room",detail:"Photophobia and phonophobia affect 80%+ of migraineurs. A dark, quiet space is the most universally effective non-pharmacological relief.",evidence:"strong"},
  {id:"cold-compress",category:"relief",title:"Cold compress on forehead or neck",detail:"Apply for 15–20 minutes. Cold causes vasoconstriction which can reduce throbbing pain.",evidence:"strong"},
  {id:"triptan",category:"medical",title:"Take your prescribed triptan early",detail:"Triptans work best in the first 30 minutes of onset — don't wait for the pain to peak.",evidence:"strong"},
  {id:"ginger",category:"relief",title:"Ginger for nausea",detail:"250mg ginger extract or ginger tea has clinical evidence for migraine nausea relief.",evidence:"moderate"},
  {id:"peppermint-oil",category:"relief",title:"Peppermint oil on temples",detail:"Topical 10% peppermint oil is comparable to acetaminophen for mild-moderate migraine pain in studies.",evidence:"moderate"},
  {id:"caffeine-combo",category:"relief",title:"Caffeine + NSAID combination",detail:"Caffeine enhances absorption of pain relievers by ~40%. Works best taken early.",evidence:"strong"},
  {id:"acupressure",category:"relief",title:"Acupressure at LI-4 point",detail:"Firm pressure between thumb and index finger for 5 minutes has shown modest pain reduction.",evidence:"moderate"},
];
export function getSuggestions(riskScore: number, hasMigraineNow: boolean, historicalPatterns: HistoricalPattern[], stressLevel: number, sleepHours: number): Suggestion[] {
  const suggestions: Suggestion[] = hasMigraineNow ? [...RELIEF] : riskScore >= 40 ? [...PREV] : [PREV.find(s=>s.id==="hydrate")!, PREV.find(s=>s.id==="magnesium")!, PREV.find(s=>s.id==="sleep-protect")!];
  if (stressLevel >= 4) { const s = PREV.find(x=>x.id==="stress")!; if (!suggestions.find(x=>x.id==="stress")) suggestions.unshift(s); }
  if (sleepHours < 6) { const s = PREV.find(x=>x.id==="sleep-protect")!; if (!suggestions.find(x=>x.id==="sleep-protect")) suggestions.unshift(s); }
  const hist: Suggestion[] = historicalPatterns.filter(p=>p.avgSeverityReduction>0&&p.useCount>=2).sort((a,b)=>b.avgSeverityReduction-a.avgSeverityReduction).slice(0,3).map(p => {
    const base = [...PREV,...RELIEF].find(s=>s.title.toLowerCase().includes(p.reliefMethod.toLowerCase())) || {id:`history-${p.reliefMethod}`,category:"relief" as const,title:p.reliefMethod,detail:"",evidence:"anecdotal" as const};
    return {...base,fromHistory:true,historyNote:`Worked for you ${p.useCount} times — avg rating ${p.avgSeverityReduction.toFixed(1)}/5`};
  });
  return [...hist,...suggestions.filter(s=>!hist.find(h=>h.id===s.id))];
}
export const RELIEF_METHOD_OPTIONS = ["Nothing helped","Dark room rest","Cold compress","Triptan medication","Ibuprofen / Naproxen","Acetaminophen","Excedrin Migraine","Caffeine","Hydration","Peppermint oil","Ginger tea","Sleep","Acupressure","Magnesium","Ice pack on neck","Heating pad","Stretching","Meditation / Breathing"];
