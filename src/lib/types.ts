export type RecurrenceFreq = "daily" | "weekly" | "monthly";

export interface Card {
  id: string;
  title: string;
  details: string;
  assignedDate?: string; // YYYY-MM-DD, when work starts
  dueDate?: string; // YYYY-MM-DD, the deadline
  recurrence?: RecurrenceFreq; // repeats from dueDate (e.g. monthly on the same day)
}

export interface Column {
  id: string;
  name: string;
  cardIds: string[];
}

export interface Board {
  columns: Column[];
  cards: Record<string, Card>;
}
