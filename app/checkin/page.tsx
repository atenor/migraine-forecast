"use client";
import { useState } from "react";
import CheckinForm from "@/components/CheckinForm";

export default function CheckinPage() {
  const [migraineMode, setMigraineMode] = useState(false);

  if (migraineMode) {
    return (
      <div>
        <div className="mb-7">
          <button onClick={() => setMigraineMode(false)}
            className="text-[13px] text-white/35 hover:text-white/60 transition-colors mb-4 flex items-center gap-1.5">
            ← Back to check-in
          </button>
          <h1 className="calm-title">Log this migraine</h1>
          <p className="calm-subtitle mt-2">
            Quick — just where, how bad, and what you tried. Takes 20 seconds.
          </p>
        </div>
        <CheckinForm migraineMode={true} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="calm-title">A gentle check-in</h1>
        <p className="calm-subtitle mt-2">
          A minute or less. Log it whenever feels right — morning, midday, or evening.
          Each one teaches your forecast how to take better care of you.
        </p>
      </div>

      {/* Migraine fast path */}
      <button
        onClick={() => setMigraineMode(true)}
        className="w-full mb-6 flex items-center gap-4 px-5 py-4 rounded-2xl border border-calm-rose/30
                   bg-calm-rose/[0.07] hover:bg-calm-rose/[0.12] transition-all duration-200 text-left">
        <span className="text-2xl shrink-0">⚡</span>
        <div>
          <p className="text-[15px] font-semibold text-calm-rose">I have a migraine right now</p>
          <p className="text-[13px] text-white/45 mt-0.5">Log it fast — location, severity, what you&apos;ve tried</p>
        </div>
        <svg className="ml-auto text-calm-rose/50 shrink-0" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      <CheckinForm />
    </div>
  );
}
