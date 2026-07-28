"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Card as CardType, Column as ColumnType } from "@/lib/types";
import type { BoardAction } from "@/lib/boardReducer";
import Card from "./Card";

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  accent: string;
  dispatch: Dispatch<BoardAction>;
}

export default function Column({ column, cards, accent, dispatch }: ColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);

  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(column.name);

  const [adding, setAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ type: "column", columnId: column.id }),
      canDrop: ({ source }) => source.data.type === "card",
      onDragEnter: () => setOver(true),
      onDragLeave: () => setOver(false),
      onDrop: () => setOver(false),
    });
  }, [column.id]);

  function commitName() {
    const next = name.trim();
    dispatch({ type: "renameColumn", columnId: column.id, name: next.length ? next : column.name });
    if (!next.length) setName(column.name);
    setRenaming(false);
  }

  function addCard() {
    const title = draftTitle.trim();
    if (title.length === 0) {
      setAdding(false);
      setDraftTitle("");
      return;
    }
    dispatch({
      type: "addCard",
      columnId: column.id,
      id: crypto.randomUUID(),
      title,
    });
    setDraftTitle("");
    setAdding(true);
  }

  return (
    <section
      className="flex h-full w-72 shrink-0 flex-col"
      style={{
        border: "3px solid var(--neo-border)",
        boxShadow: "6px 6px 0 var(--neo-shadow)",
        background: "var(--neo-surface)",
        transition: "background 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
      }}
    >
      <header
        className="flex shrink-0 items-center gap-2 px-3 py-2.5"
        style={{
          borderTop: `5px solid ${accent}`,
          borderBottom: "3px solid var(--neo-border)",
        }}
      >
        {renaming ? (
          <input
            autoFocus
            aria-label="Column name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setName(column.name);
                setRenaming(false);
              }
            }}
            className="w-full px-2 py-0.5 font-display text-sm uppercase tracking-wide outline-none"
            style={{
              background: "var(--neo-surface)",
              color: "var(--neo-text)",
              border: "2px solid var(--neo-border)",
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setName(column.name);
              setRenaming(true);
            }}
            className="font-display text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
            style={{ color: "var(--neo-text)" }}
          >
            {column.name}
          </button>
        )}
        <span
          className="ml-auto px-2 py-0.5 font-display text-xs font-normal"
          style={{ background: "var(--neo-text)", color: "var(--neo-bg)" }}
        >
          {cards.length}
        </span>
        <button
          type="button"
          aria-label="Column options"
          className="p-1 opacity-30 transition-opacity hover:opacity-70"
          style={{ color: "var(--neo-text)" }}
        >
          <MoreHorizontal size={15} aria-hidden />
        </button>
      </header>

      <div
        ref={listRef}
        data-testid={`column-${column.id}`}
        className={`scroll-slim glass-panel flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2 transition-all ${
          over ? "outline outline-2 outline-offset-[-2px] outline-yellow" : ""
        }`}
      >
        {cards.map((card) => (
          <Card key={card.id} card={card} columnId={column.id} accent={accent} dispatch={dispatch} />
        ))}

        {adding ? (
          <div
            style={{
              border: "2px solid var(--neo-border)",
              background: "var(--neo-surface)",
              padding: "8px",
            }}
          >
            <textarea
              autoFocus
              aria-label="New card title"
              value={draftTitle}
              rows={2}
              placeholder="Card title"
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCard();
                }
                if (e.key === "Escape") {
                  setAdding(false);
                  setDraftTitle("");
                }
              }}
              className="w-full resize-none px-2 py-1 text-sm outline-none"
              style={{
                background: "var(--neo-surface)",
                color: "var(--neo-text)",
                border: "2px solid var(--neo-border)",
              }}
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={addCard}
                className="px-3 py-1 font-display text-xs font-normal uppercase tracking-wide text-black transition-all active:translate-x-0.5 active:translate-y-0.5"
                style={{
                  background: "#F5DF00",
                  border: "2px solid var(--neo-border)",
                  boxShadow: "3px 3px 0 var(--neo-shadow)",
                }}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setDraftTitle("");
                }}
                className="px-2 py-1 text-xs opacity-50 transition-opacity hover:opacity-100"
                style={{ color: "var(--neo-text)" }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold opacity-40 transition-opacity hover:opacity-80"
            style={{
              color: "var(--neo-text)",
              border: "2px dashed var(--neo-dashed)",
            }}
          >
            <Plus size={14} aria-hidden />
            Add a card
          </button>
        )}
      </div>
    </section>
  );
}
