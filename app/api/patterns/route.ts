export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma, hasDB } from "@/lib/db";
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function pearson(xs: number[], ys: number[]) {
  const n = xs.length; if (n < 5) return 0;
  const mx = xs.reduce((a,b)=>a+b,0)/n, my = ys.reduce((a,b)=>a+b,0)/n;
  const num = xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const den = Math.sqrt(xs.reduce((s,x)=>s+(x-mx)**2,0)*ys.reduce((s,y)=>s+(y-my)**2,0));
  return den===0?0:num/den;
}
export async function GET() {
  if (!hasDB) return NextResponse.json({ empty: true });
  let logs: Awaited<ReturnType<typeof prisma.dailyLog.findMany>> = [];
  try { logs = await prisma.dailyLog.findMany({ orderBy: { date: "asc" } }); } catch { /* no db */ }
  if (!logs.length) return NextResponse.json({ empty: true });
  const mf = logs.map(l => l.hasMigraine?1:0);
  const triggerCorrelations = [
    {factor:"Poor Sleep Quality",values:logs.map(l=>6-l.sleepQuality)},
    {factor:"Low Sleep Hours",values:logs.map(l=>Math.max(0,8-l.sleepHours))},
    {factor:"High Stress",values:logs.map(l=>l.stressLevel)},
    {factor:"Low Hydration",values:logs.map(l=>6-l.hydration)},
    {factor:"High Caffeine",values:logs.map(l=>l.caffeine)},
    
    {factor:"Menstrual",values:logs.map(l=>l.menstrual?1:0)},
    {factor:"No Exercise",values:logs.map(l=>l.exercise?0:1)},
    {factor:"Low Pressure",values:logs.map(l=>l.pressureAtLog>0?1030-l.pressureAtLog:0)},
  ].map(({factor,values})=>({factor,correlation:parseFloat(pearson(values,mf).toFixed(3))})).sort((a,b)=>Math.abs(b.correlation)-Math.abs(a.correlation));
  const db = Array(7).fill(0).map((_,i)=>({day:DAYS[i],count:0,total:0}));
  logs.forEach(l=>{ if(!l.hasMigraine) return; const d=new Date(l.date+"T12:00:00").getDay(); db[d].count++; db[d].total+=l.migraineSeverity; });
  const migrainesByDayOfWeek = db.map(b=>({day:b.day,count:b.count,avgSeverity:b.count>0?parseFloat((b.total/b.count).toFixed(1)):0}));
  const mm: Record<string,{count:number;total:number;days:number}> = {};
  logs.forEach(l=>{ const m=l.date.slice(0,7); if(!mm[m]) mm[m]={count:0,total:0,days:0}; mm[m].days++; if(l.hasMigraine){mm[m].count++;mm[m].total+=l.migraineSeverity;} });
  const monthlyTrend = Object.entries(mm).sort(([a],[b])=>a.localeCompare(b)).map(([month,d])=>({month,count:d.count,avgSeverity:d.count>0?parseFloat((d.total/d.count).toFixed(1)):0,frequency:parseFloat(((d.count/d.days)*100).toFixed(1))}));
  const rm: Record<string,{count:number;ratingTotal:number}> = {};
  logs.filter(l=>l.hasMigraine).forEach(l=>{ let ms: string[]=[]; try{ms=JSON.parse(l.reliefMethods);}catch{/**/} ms.forEach(m=>{ if(!rm[m]) rm[m]={count:0,ratingTotal:0}; rm[m].count++; rm[m].ratingTotal+=l.reliefRating; }); });
  const reliefPatterns = Object.entries(rm).map(([method,d])=>({method,useCount:d.count,avgRating:parseFloat((d.ratingTotal/d.count).toFixed(1))})).sort((a,b)=>b.avgRating-a.avgRating);
  const ml = logs.filter(l=>l.hasMigraine);
  return NextResponse.json({ totalLogs:logs.length, totalMigraines:ml.length, averageSeverity:ml.length>0?parseFloat((ml.reduce((s,l)=>s+l.migraineSeverity,0)/ml.length).toFixed(1)):0, averageDuration:ml.length>0?parseFloat((ml.reduce((s,l)=>s+l.migraineDuration,0)/ml.length).toFixed(1)):0, triggerCorrelations, migrainesByDayOfWeek, monthlyTrend, reliefPatterns });
}
