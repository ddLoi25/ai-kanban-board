"use client";

import { useEffect, useReducer, useState } from "react";
import { LayoutGrid, CalendarDays, SlidersHorizontal, Moon, Sun } from "lucide-react";
import { boardReducer } from "@/lib/boardReducer";
import { initialBoard } from "@/lib/initialData";
import Board from "./Board";
import Calendar from "./Calendar";

type View = "board" | "calendar";

const LIGHT_VARS = {
  "--neo-bg":       "#F7F5C8",
  "--neo-surface":  "#FFFFFF",
  "--neo-border":   "#000000",
  "--neo-shadow":   "#000000",
  "--neo-text":     "#000000",
  "--neo-muted":    "rgba(0,0,0,0.55)",
  "--neo-subtle":   "rgba(0,0,0,0.50)",
  "--neo-faint":    "rgba(0,0,0,0.25)",
  "--neo-faint2":   "rgba(0,0,0,0.15)",
  "--neo-hover-bg": "rgba(0,0,0,0.05)",
  "--neo-dashed":   "rgba(0,0,0,0.25)",
  "--neo-rule":     "rgba(0,0,0,0.08)",
  "--neo-margin":   "rgba(210,40,40,0.18)",
};

const DARK_VARS = {
  "--neo-bg":       "#141414",
  "--neo-surface":  "#1E1E1E",
  "--neo-border":   "#F5F0CC",
  "--neo-shadow":   "#F5F0CC",
  "--neo-text":     "#FFFFFF",
  "--neo-muted":    "rgba(255,255,255,0.65)",
  "--neo-subtle":   "rgba(255,255,255,0.50)",
  "--neo-faint":    "rgba(255,255,255,0.30)",
  "--neo-faint2":   "rgba(255,255,255,0.20)",
  "--neo-hover-bg": "rgba(255,255,255,0.06)",
  "--neo-dashed":   "rgba(255,255,255,0.20)",
  "--neo-rule":     "rgba(245,240,204,0.07)",
  "--neo-margin":   "rgba(255,80,80,0.10)",
};

export default function Workspace() {
  const [board, dispatch] = useReducer(boardReducer, initialBoard);
  const [view, setView] = useState<View>("board");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("kanflow-dark") === "true") setDark(true);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("kanflow-dark", String(next));
  }

  const tokens = dark ? DARK_VARS : LIGHT_VARS;

  return (
    <div
      className={`flex h-screen flex-col${dark ? " dark" : ""}`}
      style={{
        ...(tokens as React.CSSProperties),
        backgroundColor: "var(--neo-bg)",
        backgroundImage: [
          "repeating-linear-gradient(transparent 0px, transparent 27px, var(--neo-rule) 27px, var(--neo-rule) 28px)",
          "linear-gradient(90deg, transparent 59px, var(--neo-margin) 59px, var(--neo-margin) 61px, transparent 61px)",
        ].join(", "),
        color: "var(--neo-text)",
        transition: "background-color 200ms ease, color 200ms ease",
      }}
    >
      <header
        className="flex shrink-0 items-center gap-3 px-6 py-3 md:px-8"
        style={{
          background: "var(--neo-surface)",
          borderBottom: "3px solid var(--neo-border)",
          transition: "background 200ms ease",
        }}
      >
        <h1 className="font-display text-[14px] uppercase tracking-tight">
          <span className="bg-black px-2 py-0.5 text-yellow">KAN</span>
          <span
            className="px-2 py-0.5"
            style={{
              borderTop: "3px solid var(--neo-border)",
              borderBottom: "3px solid var(--neo-border)",
              borderRight: "3px solid var(--neo-border)",
              color: "var(--neo-text)",
            }}
          >
            FLOW
          </span>
        </h1>

        <div
          className="mx-1 h-5 w-px shrink-0"
          style={{ background: "var(--neo-border)", opacity: 0.2 }}
          aria-hidden
        />

        <span
          className="font-display text-[12px] uppercase tracking-wide"
          style={{ color: "var(--neo-subtle)" }}
        >
          My Board
        </span>

        <span className="flex-1" />

        <nav className="glass flex gap-0.5 p-1" aria-label="View switcher">
          <Tab active={view === "board"} onClick={() => setView("board")} icon={<LayoutGrid size={13} />}>
            Board
          </Tab>
          <Tab
            active={view === "calendar"}
            onClick={() => setView("calendar")}
            icon={<CalendarDays size={13} />}
          >
            Calendar
          </Tab>
        </nav>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all active:translate-x-0.5 active:translate-y-0.5"
          style={{
            background: "var(--neo-surface)",
            color: "var(--neo-subtle)",
            border: "2px solid var(--neo-border)",
            boxShadow: "3px 3px 0 var(--neo-shadow)",
          }}
        >
          <SlidersHorizontal size={12} aria-hidden />
          Filter
        </button>

        <button
          type="button"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleDark}
          className="flex items-center justify-center p-2 transition-all active:translate-x-0.5 active:translate-y-0.5"
          style={{
            background: "var(--neo-surface)",
            color: "var(--neo-text)",
            border: "2px solid var(--neo-border)",
            boxShadow: "3px 3px 0 var(--neo-shadow)",
          }}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </header>

      {view === "board" ? (
        <Board board={board} dispatch={dispatch} />
      ) : (
        <Calendar board={board} dispatch={dispatch} />
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? "bg-yellow text-black" : ""
      }`}
      style={active ? undefined : { color: "var(--neo-subtle)" }}
    >
      {icon}
      {children}
    </button>
  );
}
