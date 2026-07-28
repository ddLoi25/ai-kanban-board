import type { Board, RecurrenceFreq } from "./types";

export type BoardAction =
  | { type: "addCard"; columnId: string; id: string; title: string; details?: string }
  | { type: "deleteCard"; cardId: string }
  | {
      type: "editCard";
      cardId: string;
      title: string;
      details: string;
      assignedDate?: string;
      dueDate?: string;
      recurrence?: RecurrenceFreq;
    }
  | { type: "renameColumn"; columnId: string; name: string }
  | { type: "moveCard"; cardId: string; toColumnId: string; toIndex: number };

export function boardReducer(state: Board, action: BoardAction): Board {
  switch (action.type) {
    case "addCard": {
      const title = action.title.trim();
      if (!title) return state;
      const card = { id: action.id, title, details: action.details?.trim() ?? "" };
      return {
        cards: { ...state.cards, [card.id]: card },
        columns: state.columns.map((col) =>
          col.id === action.columnId ? { ...col, cardIds: [...col.cardIds, card.id] } : col,
        ),
      };
    }

    case "deleteCard": {
      const cards = { ...state.cards };
      delete cards[action.cardId];
      return {
        cards,
        columns: state.columns.map((col) => ({
          ...col,
          cardIds: col.cardIds.filter((id) => id !== action.cardId),
        })),
      };
    }

    case "editCard": {
      const existing = state.cards[action.cardId];
      if (!existing) return state;
      const title = action.title.trim();
      if (!title) return state;
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.cardId]: {
            ...existing,
            title,
            details: action.details.trim(),
            assignedDate: action.assignedDate,
            dueDate: action.dueDate,
            recurrence: action.dueDate ? action.recurrence : undefined,
          },
        },
      };
    }

    case "renameColumn": {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.columnId ? { ...col, name } : col,
        ),
      };
    }

    case "moveCard": {
      const from = state.columns.find((col) => col.cardIds.includes(action.cardId));
      const to = state.columns.find((col) => col.id === action.toColumnId);
      if (!from || !to) return state;

      const fromIds = from.cardIds.filter((id) => id !== action.cardId);
      const sameColumn = from.id === to.id;
      const baseIds = sameColumn ? fromIds : to.cardIds;
      const index = Math.max(0, Math.min(action.toIndex, baseIds.length));
      const toIds = [...baseIds.slice(0, index), action.cardId, ...baseIds.slice(index)];

      return {
        ...state,
        columns: state.columns.map((col) => {
          if (col.id === to.id) return { ...col, cardIds: toIds };
          if (col.id === from.id) return { ...col, cardIds: fromIds };
          return col;
        }),
      };
    }

    default:
      return state;
  }
}
