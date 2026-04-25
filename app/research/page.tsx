import ResearchView from "@/components/ResearchView";
export const metadata = { title: "Research — Migraine Forecast" };
export const dynamic = "force-dynamic";

export default function ResearchPage() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="calm-title">The science behind your forecast</h1>
        <p className="calm-subtitle mt-2">
          Every trigger we score and every suggestion we offer is anchored to peer-reviewed research.
          This page shows the studies, what they found, and how strongly we trust each one.
        </p>
      </div>
      <ResearchView />
    </div>
  );
}
