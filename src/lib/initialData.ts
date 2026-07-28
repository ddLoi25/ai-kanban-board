import type { Board } from "./types";

export const initialBoard: Board = {
  columns: [
    { id: "col-todo", name: "To Do", cardIds: ["c1", "c2", "c3", "c10"] },
    { id: "col-progress", name: "In Progress", cardIds: ["c4", "c5"] },
    { id: "col-review", name: "Review", cardIds: ["c6"] },
    { id: "col-blocked", name: "Blocked", cardIds: ["c7"] },
    { id: "col-done", name: "Done", cardIds: ["c8", "c9"] },
  ],
  cards: {
    c1: {
      id: "c1",
      title: "Define MVP scope",
      details: "Lock the single-board feature set and write acceptance criteria.",
      assignedDate: "2026-06-27",
      dueDate: "2026-06-29",
    },
    c2: {
      id: "c2",
      title: "Wireframe the board",
      details: "Five-column layout with quick add and inline editing.",
      assignedDate: "2026-06-30",
      dueDate: "2026-07-02",
    },
    c3: {
      id: "c3",
      title: "Pick a color system",
      details: "Map the brand palette to navy, blue, purple, and yellow accents.",
    },
    c4: {
      id: "c4",
      title: "Build column components",
      details: "Glass panels with renameable titles and live card counts.",
      assignedDate: "2026-06-28",
      dueDate: "2026-06-30",
    },
    c5: {
      id: "c5",
      title: "Wire drag and drop",
      details: "Move cards within and across columns with a clear drop indicator.",
      assignedDate: "2026-07-03",
      dueDate: "2026-07-06",
    },
    c6: {
      id: "c6",
      title: "Polish hover states",
      details: "Reveal delete and drag affordances without cluttering the card.",
      dueDate: "2026-06-27",
    },
    c7: {
      id: "c7",
      title: "Resolve font licensing",
      details: "Confirm the display typeface is cleared for production use.",
    },
    c8: {
      id: "c8",
      title: "Set up the project",
      details: "Next.js, Tailwind, and the testing toolchain are in place.",
      dueDate: "2026-06-23",
    },
    c9: {
      id: "c9",
      title: "Agree on the palette",
      details: "Stakeholders signed off on the dark, elegant direction.",
      dueDate: "2026-06-24",
    },
    c10: {
      id: "c10",
      title: "Pay house mortgage",
      details: "Monthly installment due on the 10th.",
      dueDate: "2026-07-10",
      recurrence: "monthly",
    },
  },
};
