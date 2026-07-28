import { test, expect, type Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("loads the board with dummy data", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "To Do List" })).toBeVisible();
  await expect(page.getByRole("button", { name: "To Do" })).toBeVisible();
  await expect(page.getByText("Define MVP scope")).toBeVisible();
  await expect(page.getByTestId("card")).toHaveCount(9);
});

test("adds a new card to a column", async ({ page }) => {
  const todo = page.getByTestId("column-col-todo");
  await todo.getByRole("button", { name: /add a card/i }).click();
  await page.getByLabel("New card title").fill("Write release notes");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(todo.getByText("Write release notes")).toBeVisible();
});

test("inline-edits a card title", async ({ page }) => {
  await page.getByText("Pick a color system").click();
  const title = page.getByLabel("Card title");
  await title.fill("Finalize color tokens");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Finalize color tokens")).toBeVisible();
  await expect(page.getByText("Pick a color system")).toHaveCount(0);
});

test("deletes a card", async ({ page }) => {
  const card = page.getByTestId("card").filter({ hasText: "Resolve font licensing" });
  await card.hover();
  await card.getByRole("button", { name: "Delete card" }).click();
  await expect(page.getByText("Resolve font licensing")).toHaveCount(0);
  await expect(page.getByTestId("card")).toHaveCount(8);
});

test("renames a column", async ({ page }) => {
  await page.getByRole("button", { name: "Blocked" }).click();
  const input = page.getByLabel("Column name");
  await input.fill("On Hold");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "On Hold" })).toBeVisible();
});

async function dragCardToColumn(card: Locator, column: Locator) {
  const page = card.page();
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await card.dispatchEvent("dragstart", { dataTransfer });
  await column.dispatchEvent("dragenter", { dataTransfer });
  await column.dispatchEvent("dragover", { dataTransfer });
  await column.dispatchEvent("drop", { dataTransfer });
  await card.dispatchEvent("dragend", { dataTransfer });
}

test("drags a card to another column", async ({ page }) => {
  const card = page.getByTestId("card").filter({ hasText: "Define MVP scope" });
  const review = page.getByTestId("column-col-review");

  await dragCardToColumn(card, review);

  await expect(review.getByText("Define MVP scope")).toBeVisible();
  await expect(page.getByTestId("column-col-todo").getByText("Define MVP scope")).toHaveCount(0);
});

test("switches to the calendar view and reflects a dated task", async ({ page }) => {
  await page.getByRole("button", { name: "Calendar" }).click();
  await expect(page.getByRole("heading", { name: /June 2026/ })).toBeVisible();
  const day = page.getByTestId("day-2026-06-29");
  await expect(day.getByText("Define MVP scope")).toBeVisible();
});

test("setting a due date on the board shows it on the calendar", async ({ page }) => {
  await page.getByText("Pick a color system").click();
  await page.getByLabel("Due date").fill("2026-06-29");
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("button", { name: "Calendar" }).click();
  const day = page.getByTestId("day-2026-06-29");
  await expect(day.getByText("Pick a color system")).toBeVisible();
});
