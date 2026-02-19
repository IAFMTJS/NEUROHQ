"use client";

import { useState, useEffect } from "react";
import { HQPageHeader } from "@/components/hq";
import "./creative-button-cards.css";

type ModalTheme = "powercore" | "datasplit" | null;

export default function DesignPage() {
  const [modal, setModal] = useState<ModalTheme>(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  return (
    <div className="container page">
      <HQPageHeader
        title="Design"
        subtitle="Power core · Data split — buttons, panels, cards, modals"
        backHref="/dashboard"
      />

      <section className="design-creative space-y-8">
        {/* ----- BUTTONS ----- */}
        <h2 className="text-lg font-semibold text-[var(--text-main)] border-b border-[var(--border-soft)] pb-2">
          Buttons
        </h2>

        <div className="space-y-6">
          <div>
            <p className="text-xs text-[var(--text-soft)] mb-3">Power core — sizes</p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-powercore btn-powercore-sm">Sm</button>
              <button type="button" className="btn-powercore btn-powercore-md">Md</button>
              <button type="button" className="btn-powercore btn-powercore-lg">Lg</button>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-soft)] mb-3">Power core — outline</p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-powercore btn-powercore-outline btn-powercore-sm">Sm</button>
              <button type="button" className="btn-powercore btn-powercore-outline">Md</button>
              <button type="button" className="btn-powercore btn-powercore-outline btn-powercore-lg">Lg</button>
            </div>
          </div>

          <div>
            <p className="text-xs text-[var(--text-soft)] mb-3">Data split — sizes</p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-datasplit btn-datasplit-sm">Sm</button>
              <button type="button" className="btn-datasplit btn-datasplit-md">Md</button>
              <button type="button" className="btn-datasplit btn-datasplit-lg">Lg</button>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-soft)] mb-3">Data split — outline</p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-datasplit btn-datasplit-outline btn-datasplit-sm">Sm</button>
              <button type="button" className="btn-datasplit btn-datasplit-outline">Md</button>
              <button type="button" className="btn-datasplit btn-datasplit-outline btn-datasplit-lg">Lg</button>
            </div>
          </div>
        </div>

        {/* ----- PANELS ----- */}
        <h2 className="text-lg font-semibold text-[var(--text-main)] border-b border-[var(--border-soft)] pb-2 mt-10">
          Panels
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-[var(--text-soft)] mb-2">Power core</p>
            <div className="panel-powercore">
              <h3 className="panel-title">Power core panel</h3>
              <p className="panel-meta">HUD corners, reactor feel, dark fill.</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-soft)] mb-2">Data split</p>
            <div className="panel-datasplit">
              <h3 className="panel-title">Data split panel</h3>
              <p className="panel-meta">Cyan / blue diagonal, data stream.</p>
            </div>
          </div>
        </div>

        {/* ----- CARDS ----- */}
        <h2 className="text-lg font-semibold text-[var(--text-main)] border-b border-[var(--border-soft)] pb-2 mt-10">
          Cards
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--text-soft)] mb-2">Power core</p>
            <div className="card-powercore">
              <h3 className="card-title">Power core card</h3>
              <p className="card-meta">Corner brackets, dark.</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-soft)] mb-2">Data split</p>
            <div className="card-datasplit">
              <h3 className="card-title">Data split card</h3>
              <p className="card-meta">Cyan / blue dual-tone.</p>
            </div>
          </div>
        </div>

        {/* ----- MODALS ----- */}
        <h2 className="text-lg font-semibold text-[var(--text-main)] border-b border-[var(--border-soft)] pb-2 mt-10">
          Modals
        </h2>
        <p className="text-sm text-[var(--text-soft)] mb-3">Open a modal in each theme.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-powercore" onClick={() => setModal("powercore")}>
            Open Power core modal
          </button>
          <button type="button" className="btn-datasplit" onClick={() => setModal("datasplit")}>
            Open Data split modal
          </button>
        </div>
      </section>

      {/* Modal overlays */}
      {modal === "powercore" && (
        <div
          className="design-creative modal-overlay"
          onClick={() => setModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-powercore-title"
        >
          <div className="modal-powercore" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" id="modal-powercore-title">Power core modal</div>
            <div className="modal-body">
              HUD corners, reactor feel. Good for critical actions or status readouts.
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-powercore btn-powercore-outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn-powercore" onClick={() => setModal(null)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      {modal === "datasplit" && (
        <div
          className="design-creative modal-overlay"
          onClick={() => setModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-datasplit-title"
        >
          <div className="modal-datasplit" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" id="modal-datasplit-title">Data split modal</div>
            <div className="modal-body">
              Cyan / blue diagonal, data-stream vibe. Use for choices or dual options.
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-datasplit btn-datasplit-outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn-datasplit" onClick={() => setModal(null)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
