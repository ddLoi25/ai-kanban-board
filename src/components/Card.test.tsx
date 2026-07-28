import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Card from "./Card";
import type { Card as CardType } from "@/lib/types";

function makeCard(overrides: Partial<CardType> = {}): CardType {
  return { id: "c1", title: "Test card", details: "Some details", ...overrides };
}

function setup(card: CardType = makeCard()) {
  const dispatch = jest.fn();
  render(<Card card={card} columnId="col-1" dispatch={dispatch} />);
  return { dispatch, user: userEvent.setup() };
}

describe("Card", () => {
  it("renders title and details", () => {
    setup();
    expect(screen.getByText("Test card")).toBeInTheDocument();
    expect(screen.getByText("Some details")).toBeInTheDocument();
  });

  it("shows the overdue badge for a past due date", () => {
    setup(makeCard({ dueDate: "2020-01-01" }));
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("shows the recurrence badge when recurrence is set", () => {
    setup(makeCard({ dueDate: "2026-07-10", recurrence: "monthly" }));
    expect(screen.getByText(/monthly on the/i)).toBeInTheDocument();
  });

  it("opens edit mode on click", async () => {
    const { user } = setup();
    await user.click(screen.getByText("Test card"));
    expect(screen.getByLabelText("Card title")).toBeInTheDocument();
  });

  it("saves on Save button click", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByText("Test card"));
    const input = screen.getByLabelText("Card title");
    await user.clear(input);
    await user.type(input, "Updated");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "editCard", cardId: "c1", title: "Updated" }),
    );
  });

  it("saves on Enter in the title field", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByText("Test card"));
    const input = screen.getByLabelText("Card title");
    await user.clear(input);
    await user.type(input, "Entered{Enter}");
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "editCard", title: "Entered" }),
    );
  });

  it("cancels edit on Escape without dispatching", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByText("Test card"));
    await user.type(screen.getByLabelText("Card title"), " changed{Escape}");
    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.getByText("Test card")).toBeInTheDocument();
  });

  it("reverts to view when title is cleared and Save is clicked", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByText("Test card"));
    await user.clear(screen.getByLabelText("Card title"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.getByText("Test card")).toBeInTheDocument();
  });

  it("dispatches deleteCard when delete button is clicked", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByRole("button", { name: "Delete card" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "deleteCard", cardId: "c1" });
  });

  it("repeat select is disabled when no due date", async () => {
    const { user } = setup();
    await user.click(screen.getByText("Test card"));
    expect(screen.getByLabelText("Repeat")).toBeDisabled();
  });

  it("repeat select is enabled when due date is set", async () => {
    const { user } = setup();
    await user.click(screen.getByText("Test card"));
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-07-10" } });
    expect(screen.getByLabelText("Repeat")).not.toBeDisabled();
  });

  it("saves recurrence when due date and repeat are set", async () => {
    const { dispatch, user } = setup();
    await user.click(screen.getByText("Test card"));
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-07-10" } });
    fireEvent.change(screen.getByLabelText("Repeat"), { target: { value: "weekly" } });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: "2026-07-10", recurrence: "weekly" }),
    );
  });

  it("clears recurrence when due date is removed", async () => {
    const { dispatch, user } = setup(makeCard({ dueDate: "2026-07-10", recurrence: "monthly" }));
    await user.click(screen.getByText("Test card"));
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: undefined, recurrence: undefined }),
    );
  });
});
