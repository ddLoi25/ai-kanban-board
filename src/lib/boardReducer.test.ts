import { boardReducer, type BoardAction } from "./boardReducer";
import type { Board } from "./types";

function makeBoard(): Board {
  return {
    columns: [
      { id: "a", name: "A", cardIds: ["c1", "c2", "c3"] },
      { id: "b", name: "B", cardIds: ["c4"] },
      { id: "c", name: "C", cardIds: [] },
    ],
    cards: {
      c1: { id: "c1", title: "One", details: "" },
      c2: { id: "c2", title: "Two", details: "" },
      c3: { id: "c3", title: "Three", details: "" },
      c4: { id: "c4", title: "Four", details: "" },
    },
  };
}

function order(board: Board, columnId: string) {
  return board.columns.find((col) => col.id === columnId)!.cardIds;
}

describe("boardReducer", () => {
  it("adds a card to the end of a column", () => {
    const next = boardReducer(makeBoard(), {
      type: "addCard",
      columnId: "b",
      id: "new",
      title: "Fresh",
    });
    expect(order(next, "b")).toEqual(["c4", "new"]);
    expect(next.cards.new).toEqual({ id: "new", title: "Fresh", details: "" });
  });

  it("deletes a card and removes it from its column", () => {
    const next = boardReducer(makeBoard(), { type: "deleteCard", cardId: "c2" });
    expect(order(next, "a")).toEqual(["c1", "c3"]);
    expect(next.cards.c2).toBeUndefined();
  });

  it("edits a card's title and details", () => {
    const next = boardReducer(makeBoard(), {
      type: "editCard",
      cardId: "c1",
      title: "Updated",
      details: "More",
    });
    expect(next.cards.c1).toEqual({
      id: "c1",
      title: "Updated",
      details: "More",
      assignedDate: undefined,
      dueDate: undefined,
    });
  });

  it("sets and clears assigned and due dates via editCard", () => {
    const scheduled = boardReducer(makeBoard(), {
      type: "editCard",
      cardId: "c1",
      title: "One",
      details: "",
      assignedDate: "2026-06-28",
      dueDate: "2026-07-01",
    });
    expect(scheduled.cards.c1.assignedDate).toBe("2026-06-28");
    expect(scheduled.cards.c1.dueDate).toBe("2026-07-01");

    const cleared = boardReducer(scheduled, {
      type: "editCard",
      cardId: "c1",
      title: "One",
      details: "",
    });
    expect(cleared.cards.c1.assignedDate).toBeUndefined();
    expect(cleared.cards.c1.dueDate).toBeUndefined();
  });

  it("stores a recurrence and clears it when the due date is removed", () => {
    const recurring = boardReducer(makeBoard(), {
      type: "editCard",
      cardId: "c1",
      title: "Pay rent",
      details: "",
      dueDate: "2026-07-10",
      recurrence: "monthly",
    });
    expect(recurring.cards.c1.recurrence).toBe("monthly");

    const cleared = boardReducer(recurring, {
      type: "editCard",
      cardId: "c1",
      title: "Pay rent",
      details: "",
      recurrence: "monthly",
    });
    expect(cleared.cards.c1.recurrence).toBeUndefined();
  });

  it("renames a column", () => {
    const next = boardReducer(makeBoard(), { type: "renameColumn", columnId: "a", name: "Alpha" });
    expect(next.columns[0].name).toBe("Alpha");
  });

  it("moves a card across columns at a given index", () => {
    const next = boardReducer(makeBoard(), {
      type: "moveCard",
      cardId: "c1",
      toColumnId: "b",
      toIndex: 0,
    });
    expect(order(next, "a")).toEqual(["c2", "c3"]);
    expect(order(next, "b")).toEqual(["c1", "c4"]);
  });

  it("moves a card into an empty column", () => {
    const next = boardReducer(makeBoard(), {
      type: "moveCard",
      cardId: "c4",
      toColumnId: "c",
      toIndex: 0,
    });
    expect(order(next, "b")).toEqual([]);
    expect(order(next, "c")).toEqual(["c4"]);
  });

  it("reorders within the same column (move down)", () => {
    const next = boardReducer(makeBoard(), {
      type: "moveCard",
      cardId: "c1",
      toColumnId: "a",
      toIndex: 2,
    });
    expect(order(next, "a")).toEqual(["c2", "c3", "c1"]);
  });

  it("reorders within the same column (move up)", () => {
    const next = boardReducer(makeBoard(), {
      type: "moveCard",
      cardId: "c3",
      toColumnId: "a",
      toIndex: 0,
    });
    expect(order(next, "a")).toEqual(["c3", "c1", "c2"]);
  });

  it("clamps an out-of-range target index", () => {
    const next = boardReducer(makeBoard(), {
      type: "moveCard",
      cardId: "c1",
      toColumnId: "b",
      toIndex: 99,
    });
    expect(order(next, "b")).toEqual(["c4", "c1"]);
  });

  it("does not mutate the input state", () => {
    const board = makeBoard();
    const snapshot = JSON.stringify(board);
    boardReducer(board, { type: "deleteCard", cardId: "c1" });
    expect(JSON.stringify(board)).toBe(snapshot);
  });

  it("returns state unchanged for an unknown action", () => {
    const board = makeBoard();
    expect(boardReducer(board, { type: "noop" } as unknown as BoardAction)).toBe(board);
  });

  it("ignores addCard with a blank title", () => {
    const board = makeBoard();
    const next = boardReducer(board, { type: "addCard", columnId: "a", id: "new", title: "   " });
    expect(next).toBe(board);
  });

  it("ignores editCard with a blank title", () => {
    const board = makeBoard();
    const next = boardReducer(board, { type: "editCard", cardId: "c1", title: "  ", details: "" });
    expect(next).toBe(board);
  });

  it("ignores renameColumn with a blank name", () => {
    const board = makeBoard();
    const next = boardReducer(board, { type: "renameColumn", columnId: "a", name: "   " });
    expect(next).toBe(board);
  });
});
