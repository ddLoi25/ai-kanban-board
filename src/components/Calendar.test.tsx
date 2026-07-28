import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Calendar from "./Calendar";
import type { Board } from "@/lib/types";

const board: Board = {
  columns: [{ id: "col-1", name: "To Do", cardIds: ["c1", "c2", "c3", "c4", "c5"] }],
  cards: {
    c1: { id: "c1", title: "Dated task", details: "", dueDate: "2026-06-29" },
    c2: { id: "c2", title: "Ranged task", details: "", assignedDate: "2026-06-29", dueDate: "2026-07-01" },
    c3: { id: "c3", title: "Floating task", details: "" },
    c4: { id: "c4", title: "Cross week", details: "", assignedDate: "2026-06-25", dueDate: "2026-06-30" },
    c5: { id: "c5", title: "Later task", details: "", dueDate: "2026-07-15" },
  },
};

function setup() {
  render(<Calendar board={board} dispatch={jest.fn()} />);
  return userEvent.setup();
}

function barsWithText(text: string) {
  return screen
    .queryAllByTestId("calendar-bar")
    .filter((bar) => bar.textContent?.includes(text));
}

describe("Calendar", () => {
  it("opens on the month of the earliest dated task", () => {
    setup();
    expect(screen.getByRole("heading", { name: "June 2026" })).toBeInTheDocument();
  });

  it("renders a one-day bar for a task with only a due date", () => {
    setup();
    const bars = barsWithText("Dated task");
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute("data-span", "1");
  });

  it("spans a single bar from the assigned date through the due date", () => {
    setup();
    const bars = barsWithText("Ranged task");
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute("data-span", "3"); // Jun 29, 30, Jul 1
  });

  it("splits a task that crosses a week boundary into per-week segments", () => {
    setup();
    const bars = barsWithText("Cross week");
    expect(bars).toHaveLength(2); // Jun 25-27 and Jun 28-30
    const spans = bars.map((b) => b.getAttribute("data-span")).sort();
    expect(spans).toEqual(["3", "3"]);
  });

  it("lists undated tasks under Unscheduled", () => {
    setup();
    expect(screen.getByText("Unscheduled")).toBeInTheDocument();
    const chips = screen.getAllByTestId("unscheduled-chip");
    expect(chips).toHaveLength(1);
    expect(chips[0]).toHaveTextContent("Floating task");
  });

  it("navigates to the next month", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { name: "July 2026" })).toBeInTheDocument();
    expect(barsWithText("Later task")).toHaveLength(1);
  });
});
