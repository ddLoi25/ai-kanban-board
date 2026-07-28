"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { createPortal } from "react-dom";
import { Trash2, GripVertical, CalendarDays, AlertTriangle, Repeat } from "lucide-react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Card as CardType, RecurrenceFreq } from "@/lib/types";
import type { BoardAction } from "@/lib/boardReducer";
import { formatBadge, isOverdue, describeRecurrence, nextOccurrence } from "@/lib/dates";
import CardModal from "./CardModal";

interface CardProps {
  card: CardType;
  columnId: string;
  accent?: string;
  dispatch: Dispatch<BoardAction>;
}

export default function Card({ card, columnId, accent, dispatch }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [edge, setEdge] = useState<Edge | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => !modalOpen,
        getInitialData: () => ({ type: "card", cardId: card.id, columnId }),
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data.type === "card" && source.data.cardId !== card.id,
        getData: ({ input }) =>
          attachClosestEdge(
            { type: "card", cardId: card.id, columnId },
            { element, input, allowedEdges: ["top", "bottom"] },
          ),
        onDrag: ({ self }) => setEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setEdge(null),
        onDrop: () => setEdge(null),
      }),
    );
  }, [card.id, columnId, modalOpen]);

  const cardStyle: React.CSSProperties = {
    ...(accent ? { borderLeft: `4px solid ${accent}` } : {}),
  };

  return (
    <div className="relative">
      {edge === "top" && <DropLine />}

      <div
        ref={ref}
        data-testid="card"
        style={cardStyle}
        className={`group glass-card p-3 ${dragging ? "opacity-40" : "opacity-100"}`}
      >
        <div className="flex items-start gap-2">
          <span
            className="mt-0.5 cursor-grab opacity-25 transition-opacity group-hover:opacity-60"
            style={{ color: "var(--neo-text)" }}
          >
            <GripVertical size={16} aria-hidden />
          </span>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex-1 cursor-pointer text-left"
          >
            <h3
              className="font-display text-sm leading-snug"
              style={{ color: "var(--neo-text)" }}
            >
              {card.title}
            </h3>
            {card.details && (
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--neo-muted)" }}>
                {card.details}
              </p>
            )}
            <DateBadge
              assignedDate={card.assignedDate}
              dueDate={card.dueDate}
              recurrence={card.recurrence}
            />
          </button>

          <button
            type="button"
            aria-label="Delete card"
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: "deleteCard", cardId: card.id });
            }}
            className="p-1 text-pink opacity-0 transition-all hover:opacity-80 focus:opacity-100 group-hover:opacity-40"
            style={{ background: "transparent" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--neo-hover-bg)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      </div>

      {edge === "bottom" && <DropLine />}

      {modalOpen &&
        createPortal(
          <CardModal
            card={card}
            accent={accent}
            dispatch={dispatch}
            onClose={() => setModalOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
}

function DropLine() {
  return <div className="pointer-events-none my-0.5 h-[3px] bg-yellow" />;
}

function DateBadge({
  assignedDate,
  dueDate,
  recurrence,
}: {
  assignedDate?: string;
  dueDate?: string;
  recurrence?: RecurrenceFreq;
}) {
  if (!assignedDate && !dueDate) return null;

  if (recurrence && dueDate) {
    return (
      <span
        className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 font-display text-[10px] uppercase tracking-wide text-black"
        style={{ border: "1.5px solid var(--neo-border)", background: "#F5DF00" }}
      >
        <Repeat size={10} aria-hidden />
        {describeRecurrence(recurrence, dueDate)}
        <span className="opacity-50">· Next {formatBadge(nextOccurrence(dueDate, recurrence))}</span>
      </span>
    );
  }

  const overdue = isOverdue(dueDate);

  return (
    <span
      className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 font-display text-[10px] uppercase tracking-wide"
      style={{
        border: "1.5px solid var(--neo-border)",
        background: overdue ? "#FF2952" : "#F5DF00",
        color: overdue ? "#fff" : "#000",
      }}
    >
      {overdue ? <AlertTriangle size={10} aria-hidden /> : <CalendarDays size={10} aria-hidden />}
      {assignedDate && dueDate
        ? `${formatBadge(assignedDate)} – ${formatBadge(dueDate)}`
        : dueDate
          ? `Due ${formatBadge(dueDate)}`
          : `Start ${formatBadge(assignedDate!)}`}
      {overdue && <span className="font-semibold">Overdue</span>}
    </span>
  );
}
