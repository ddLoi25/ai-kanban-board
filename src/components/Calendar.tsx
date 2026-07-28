"use client";

import { useState, type Dispatch } from "react";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import type { Board as BoardType, Card as CardType } from "@/lib/types";
import type { BoardAction } from "@/lib/boardReducer";
import { accentForColumn } from "@/lib/accents";
import { toISODate, parseISO, isOverdue, occurrencesInRange } from "@/lib/dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_MS = 86400000;

interface CalendarProps {
  board: BoardType;
  dispatch: Dispatch<BoardAction>;
}

interface CalEvent {
  card: CardType;
  startIdx: number;
  endIdx: number;
  recurring: boolean;
}

interface Segment {
  card: CardType;
  startCol: number;
  span: number;
  isStart: boolean;
  isEnd: boolean;
  recurring: boolean;
  overdue: boolean;
  lane: number;
}

export default function Calendar({ board }: CalendarProps) {
  const [monthDate, setMonthDate] = useState(() => {
    const dated = Object.values(board.cards)
      .map((c) => c.dueDate)
      .filter((d): d is string => Boolean(d))
      .sort();
    const base = dated.length ? parseISO(dated[0]) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const accentByCard = new Map<string, string>();
  board.columns.forEach((col, i) =>
    col.cardIds.forEach((id) => accentByCard.set(id, accentForColumn(i))),
  );

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const gridStart = new Date(year, month, 1 - new Date(year, month, 1).getDay());
  const days = Array.from(
    { length: 42 },
    (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
  );
  const rangeStart = toISODate(days[0]);
  const rangeEnd = toISODate(days[days.length - 1]);
  const todayISO = toISODate(new Date());

  const gridIndex = (iso: string) =>
    Math.round((parseISO(iso).getTime() - days[0].getTime()) / DAY_MS);

  const events: CalEvent[] = [];
  const unscheduled: CardType[] = [];
  for (const col of board.columns) {
    for (const id of col.cardIds) {
      const card = board.cards[id];
      if (!card.dueDate) {
        unscheduled.push(card);
      } else if (card.recurrence) {
        for (const iso of occurrencesInRange(card.dueDate, card.recurrence, rangeStart, rangeEnd)) {
          const i = gridIndex(iso);
          events.push({ card, startIdx: i, endIdx: i, recurring: true });
        }
      } else {
        const startISO =
          card.assignedDate && card.assignedDate <= card.dueDate ? card.assignedDate : card.dueDate;
        events.push({ card, startIdx: gridIndex(startISO), endIdx: gridIndex(card.dueDate), recurring: false });
      }
    }
  }

  function segmentsForWeek(week: number): Segment[] {
    const lo = week * 7;
    const hi = lo + 6;
    const sliced = events
      .filter((ev) => ev.endIdx >= lo && ev.startIdx <= hi)
      .map((ev) => {
        const s = Math.max(ev.startIdx, lo);
        const e = Math.min(ev.endIdx, hi);
        return {
          ev,
          startCol: s - lo,
          span: e - s + 1,
          isStart: ev.startIdx >= lo,
          isEnd: ev.endIdx <= hi,
        };
      })
      .sort((a, b) => a.startCol - b.startCol || b.span - a.span);

    const laneEnds: number[] = [];
    return sliced.map((s) => {
      let lane = laneEnds.findIndex((end) => s.startCol > end);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(s.startCol + s.span - 1);
      } else {
        laneEnds[lane] = s.startCol + s.span - 1;
      }
      return {
        card: s.ev.card,
        startCol: s.startCol,
        span: s.span,
        isStart: s.isStart,
        isEnd: s.isEnd,
        recurring: s.ev.recurring,
        overdue: !s.ev.recurring && s.isEnd && isOverdue(s.ev.card.dueDate),
        lane,
      };
    });
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-6 pt-6 md:px-10" data-testid="calendar">

      {/* Month nav */}
      <div className="mb-4 flex items-center gap-3">
        <h2
          className="font-display text-lg uppercase tracking-tight"
          style={{ color: "var(--neo-text)" }}
        >
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <NavButton label="Previous month" onClick={() => setMonthDate(new Date(year, month - 1, 1))}>
            <ChevronLeft size={15} />
          </NavButton>
          <NavButton label="Next month" onClick={() => setMonthDate(new Date(year, month + 1, 1))}>
            <ChevronRight size={15} />
          </NavButton>
        </div>
        <button
          type="button"
          onClick={() => {
            const t = new Date();
            setMonthDate(new Date(t.getFullYear(), t.getMonth(), 1));
          }}
          className="px-3 py-1 font-display text-xs uppercase tracking-wide transition-all active:translate-x-0.5 active:translate-y-0.5"
          style={{
            background: "var(--neo-surface)",
            color: "var(--neo-text)",
            border: "2px solid var(--neo-border)",
            boxShadow: "2px 2px 0 var(--neo-shadow)",
          }}
        >
          Today
        </button>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className="px-2 py-1.5 font-display text-xs uppercase tracking-widest"
            style={{
              color: "var(--neo-subtle)",
              borderBottom: "3px solid var(--neo-border)",
              borderLeft: i > 0 ? "1px solid var(--neo-dashed)" : undefined,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ border: "3px solid var(--neo-border)", boxShadow: "5px 5px 0 var(--neo-shadow)" }}
      >
        {[0, 1, 2, 3, 4, 5].map((week) => {
          const segments = segmentsForWeek(week);
          return (
            <div
              key={week}
              className="relative grid flex-1 grid-cols-7"
              style={{ borderTop: week > 0 ? "2px solid var(--neo-border)" : undefined }}
            >
              {days.slice(week * 7, week * 7 + 7).map((day, di) => {
                const iso = toISODate(day);
                const inMonth = day.getMonth() === month;
                const isToday = iso === todayISO;
                return (
                  <div
                    key={iso}
                    data-testid={`day-${iso}`}
                    className="p-1.5"
                    style={{
                      borderLeft: di > 0 ? "1px solid var(--neo-dashed)" : undefined,
                      background: inMonth ? "var(--neo-surface)" : "var(--neo-hover-bg)",
                    }}
                  >
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center text-xs font-semibold"
                      style={
                        isToday
                          ? { background: "#F5DF00", color: "#000" }
                          : inMonth
                            ? { color: "var(--neo-text)" }
                            : { color: "var(--neo-faint)" }
                      }
                    >
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}

              <div className="pointer-events-none absolute inset-x-0 bottom-1 top-8 grid auto-rows-[22px] grid-cols-7 content-start gap-y-0.5">
                {segments.map((seg) => (
                  <EventBar
                    key={`${seg.card.id}-${seg.startCol}`}
                    seg={seg}
                    accent={accentByCard.get(seg.card.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <div className="mt-4">
          <p
            className="mb-2 font-display text-xs uppercase tracking-widest"
            style={{ color: "var(--neo-subtle)" }}
          >
            Unscheduled
          </p>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((task) => (
              <span
                key={task.id}
                data-testid="unscheduled-chip"
                title={task.details || task.title}
                className="px-2 py-1 font-display text-xs uppercase tracking-wide"
                style={{
                  background: "var(--neo-surface)",
                  color: "var(--neo-text)",
                  border: "2px solid var(--neo-border)",
                }}
              >
                {task.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventBar({ seg, accent }: { seg: Segment; accent?: string }) {
  const color = seg.overdue ? "#FF2952" : seg.recurring ? "#00DADA" : (accent ?? "#F5DF00");
  // Determine text contrast: dark accents (purple, pink) need white text
  const textColor = color === "#6B21E8" || color === "#FF2952" ? "#fff" : "#000";
  return (
    <div
      data-testid="calendar-bar"
      data-span={seg.span}
      title={seg.card.details || seg.card.title}
      style={{
        gridColumn: `${seg.startCol + 1} / span ${seg.span}`,
        gridRow: seg.lane + 1,
        backgroundColor: color,
        borderTop: "1.5px solid var(--neo-border)",
        borderBottom: "1.5px solid var(--neo-border)",
        borderLeft: seg.isStart ? "1.5px solid var(--neo-border)" : undefined,
        borderRight: seg.isEnd ? "1.5px solid var(--neo-border)" : undefined,
        color: textColor,
      }}
      className={`pointer-events-auto flex h-[20px] items-center gap-1 overflow-hidden px-1.5 font-display text-[10px] uppercase tracking-wide ${
        seg.isStart ? "ml-1" : ""
      } ${seg.isEnd ? "mr-1" : ""}`}
    >
      {seg.isStart &&
        (seg.recurring ? (
          <Repeat size={9} className="shrink-0" aria-hidden />
        ) : (
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: textColor }} />
        ))}
      <span className="truncate">{seg.card.title}</span>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex items-center justify-center p-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5"
      style={{
        background: "var(--neo-surface)",
        color: "var(--neo-text)",
        border: "2px solid var(--neo-border)",
        boxShadow: "2px 2px 0 var(--neo-shadow)",
      }}
    >
      {children}
    </button>
  );
}
