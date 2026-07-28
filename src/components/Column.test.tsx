import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Column from "./Column";
import type { Card as CardType, Column as ColumnType } from "@/lib/types";

const column: ColumnType = { id: "col-1", name: "To Do", cardIds: ["c1"] };
const cards: CardType[] = [{ id: "c1", title: "First card", details: "Some details" }];

function setup() {
  const dispatch = jest.fn();
  render(<Column column={column} cards={cards} accent="#209dd7" dispatch={dispatch} />);
  return { dispatch, user: userEvent.setup() };
}

describe("Column", () => {
  it("renders the column name, card, and live count", () => {
    setup();
    expect(screen.getByRole("button", { name: "To Do" })).toBeInTheDocument();
    expect(screen.getByText("First card")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renames the column on Enter", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByRole("button", { name: "To Do" }));
    const input = screen.getByLabelText("Column name");
    await user.clear(input);
    await user.type(input, "Backlog{Enter}");
    expect(dispatch).toHaveBeenCalledWith({
      type: "renameColumn",
      columnId: "col-1",
      name: "Backlog",
    });
  });

  it("adds a card through the inline composer", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByRole("button", { name: /add a card/i }));
    await user.type(screen.getByLabelText("New card title"), "New task{Enter}");
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "addCard", columnId: "col-1", title: "New task" }),
    );
  });

  it("does not add a blank card", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByRole("button", { name: /add a card/i }));
    await user.type(screen.getByLabelText("New card title"), "   {Enter}");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("inline-edits a card and saves", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByText("First card"));
    const title = screen.getByLabelText("Card title");
    await user.clear(title);
    await user.type(title, "Edited title{Enter}");
    expect(dispatch).toHaveBeenCalledWith({
      type: "editCard",
      cardId: "c1",
      title: "Edited title",
      details: "Some details",
      assignedDate: undefined,
      dueDate: undefined,
    });
  });

  it("saves assigned and due dates from the card editor", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByText("First card"));
    fireEvent.change(screen.getByLabelText("Assigned date"), { target: { value: "2026-06-28" } });
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-07-01" } });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(dispatch).toHaveBeenCalledWith({
      type: "editCard",
      cardId: "c1",
      title: "First card",
      details: "Some details",
      assignedDate: "2026-06-28",
      dueDate: "2026-07-01",
    });
  });

  it("cancels an inline edit on Escape without dispatching", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByText("First card"));
    await user.type(screen.getByLabelText("Card title"), " changed{Escape}");
    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.getByText("First card")).toBeInTheDocument();
  });

  it("deletes a card", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByRole("button", { name: "Delete card" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "deleteCard", cardId: "c1" });
  });
});
