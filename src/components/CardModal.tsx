"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Trash2, CalendarDays, CalendarClock, AlertTriangle, Repeat } from "lucide-react";
import type { Card as CardType, RecurrenceFreq } from "@/lib/types";
import type { BoardAction } from "@/lib/boardReducer";
import { formatBadge, isOverdue, describeRecurrence, nextOccurrence } from "@/lib/dates";

interface CardModalProps {
  card: CardType;
  accent?: string;
  dispatch: Dispatch<BoardAction>;
  onClose: () => void;
}

export default function CardModal({ card, accent, dispatch, onClose }: CardModalProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [details, setDetails] = useState(card.details);
  const [assigned, setAssigned] = useState(card.assignedDate ?? "");
  const [due, setDue] = useState(card.dueDate ?? "");
  const [repeat, setRepeat] = useState<RecurrenceFreq | undefined>(card.recurrence);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        editing ? cancelEdit() : onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onClose]);

  useEffect(() => {
    if (editing) firstInputRef.current?.focus();
  }, [editing]);

  function startEditing() {
    setTitle(card.title);
    setDetails(card.details);
    setAssigned(card.assignedDate ?? "");
    setDue(card.dueDate ?? "");
    setRepeat(card.recurrence);
    setEditing(true);
  }

  function commit() {
    const next = title.trim();
    if (!next) { cancelEdit(); return; }
    dispatch({
      type: "editCard",
      cardId: card.id,
      title: next,
      details: details.trim(),
      assignedDate: assigned || undefined,
      dueDate: due || undefined,
      recurrence: due ? repeat : undefined,
    });
    setEditing(false);
    onClose();
  }

  function cancelEdit() {
    setTitle(card.title);
    setDetails(card.details);
    setAssigned(card.assignedDate ?? "");
    setDue(card.dueDate ?? "");
    setRepeat(card.recurrence);
    setEditing(false);
  }

  function deleteCard() {
    dispatch({ type: "deleteCard", cardId: card.id });
    onClose();
  }

  const accentStyle = accent ? { borderTop: `5px solid ${accent}` } : {};

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "backdropFadeIn 80ms ease forwards" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={() => editing ? cancelEdit() : onClose()}
        aria-hidden
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        className="relative w-full max-w-[480px]"
        style={{
          background: "var(--neo-surface)",
          border: "3px solid var(--neo-border)",
          boxShadow: "8px 8px 0 var(--neo-shadow)",
          animation: "cardZoomIn 160ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
          ...accentStyle,
        }}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 flex items-center justify-center p-1.5 opacity-40 transition-opacity hover:opacity-100"
          style={{ color: "var(--neo-text)" }}
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {editing ? (
            /* ── EDIT MODE ────────────────────────────── */
            <div className="flex flex-col gap-3">
              <input
                ref={firstInputRef}
                aria-label="Card title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commit(); }
                  if (e.key === "Escape") cancelEdit();
                }}
                className="w-full px-3 py-2 font-display text-base uppercase tracking-tight outline-none"
                style={{
                  background: "var(--neo-surface)",
                  color: "var(--neo-text)",
                  border: "2px solid var(--neo-border)",
                }}
              />

              <textarea
                aria-label="Card details"
                value={details}
                rows={4}
                onChange={(e) => setDetails(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                className="w-full resize-none px-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--neo-surface)",
                  color: "var(--neo-muted)",
                  border: "2px solid var(--neo-border)",
                }}
              />

              <div className="flex flex-col gap-2">
                {(["assigned", "due"] as const).map((field) => (
                  <label key={field} className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--neo-subtle)" }}>
                    <span className="flex items-center gap-1.5">
                      {field === "assigned" ? <CalendarDays size={14} /> : <CalendarClock size={14} />}
                      {field === "assigned" ? "Assigned" : "Due"}
                    </span>
                    <input
                      type="date"
                      value={field === "assigned" ? assigned : due}
                      min={field === "due" ? (assigned || undefined) : undefined}
                      onChange={(e) => field === "assigned" ? setAssigned(e.target.value) : setDue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); commit(); }
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="px-2 py-1 text-xs outline-none"
                      style={{
                        background: "var(--neo-surface)",
                        color: "var(--neo-text)",
                        border: "2px solid var(--neo-border)",
                      }}
                    />
                  </label>
                ))}

                <label className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--neo-subtle)" }}>
                  <span className="flex items-center gap-1.5">
                    <Repeat size={14} />
                    Repeat
                  </span>
                  <select
                    value={repeat ?? ""}
                    disabled={!due}
                    onChange={(e) => setRepeat((e.target.value as RecurrenceFreq) || undefined)}
                    className="px-2 py-1 text-xs outline-none disabled:opacity-40"
                    style={{
                      background: "var(--neo-surface)",
                      color: "var(--neo-text)",
                      border: "2px solid var(--neo-border)",
                    }}
                  >
                    <option value="">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={commit}
                  className="px-4 py-1.5 font-display text-xs uppercase tracking-wide text-black transition-all active:translate-x-0.5 active:translate-y-0.5"
                  style={{ background: "#F5DF00", border: "2px solid var(--neo-border)", boxShadow: "3px 3px 0 var(--neo-shadow)" }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs opacity-50 transition-opacity hover:opacity-100"
                  style={{ color: "var(--neo-text)" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteCard}
                  className="ml-auto px-3 py-1.5 text-xs text-pink transition-colors hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            /* ── VIEW MODE ────────────────────────────── */
            <>
              <h2
                className="font-display text-xl uppercase leading-tight tracking-tight"
                style={{ color: "var(--neo-text)" }}
              >
                {card.title}
              </h2>

              {card.details && (
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--neo-muted)" }}>
                  {card.details}
                </p>
              )}

              <ModalDateBadge
                assignedDate={card.assignedDate}
                dueDate={card.dueDate}
                recurrence={card.recurrence}
              />

              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex items-center gap-1.5 px-4 py-1.5 font-display text-xs uppercase tracking-wide text-black transition-all active:translate-x-0.5 active:translate-y-0.5"
                  style={{ background: "#F5DF00", border: "2px solid var(--neo-border)", boxShadow: "3px 3px 0 var(--neo-shadow)" }}
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={deleteCard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    color: "#FF2952",
                    border: "2px solid var(--neo-border)",
                    boxShadow: "3px 3px 0 var(--neo-shadow)",
                    background: "var(--neo-surface)",
                  }}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function ModalDateBadge({
  assignedDate,
  dueDate,
  recurrence,
}: {
  assignedDate?: string;
  dueDate?: string;
  recurrence?: RecurrenceFreq;
}) {
  if (!assignedDate && !dueDate) return null;

  const overdue = isOverdue(dueDate);

  if (recurrence && dueDate) {
    return (
      <div className="mt-4 flex flex-col gap-1">
        <span
          className="inline-flex w-fit items-center gap-2 px-3 py-1 font-display text-xs uppercase tracking-wide text-black"
          style={{ border: "1.5px solid var(--neo-border)", background: "#F5DF00" }}
        >
          <Repeat size={11} />
          {describeRecurrence(recurrence, dueDate)}
          <span className="opacity-50">· Next {formatBadge(nextOccurrence(dueDate, recurrence))}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <span
        className="inline-flex w-fit items-center gap-2 px-3 py-1 font-display text-xs uppercase tracking-wide"
        style={{
          border: "1.5px solid var(--neo-border)",
          background: overdue ? "#FF2952" : "#F5DF00",
          color: overdue ? "#fff" : "#000",
        }}
      >
        {overdue ? <AlertTriangle size={11} /> : <CalendarDays size={11} />}
        {assignedDate && dueDate
          ? `${formatBadge(assignedDate)} – ${formatBadge(dueDate)}`
          : dueDate
            ? `Due ${formatBadge(dueDate)}`
            : `Start ${formatBadge(assignedDate!)}`}
        {overdue && <span className="font-semibold">Overdue</span>}
      </span>
    </div>
  );
}
