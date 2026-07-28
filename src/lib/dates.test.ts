import { occurrencesInRange, nextOccurrence, describeRecurrence } from "./dates";

describe("recurrence helpers", () => {
  it("projects monthly occurrences on the anchor day-of-month", () => {
    expect(occurrencesInRange("2026-07-10", "monthly", "2026-07-01", "2026-09-30")).toEqual([
      "2026-07-10",
      "2026-08-10",
      "2026-09-10",
    ]);
  });

  it("clamps a monthly day-of-month to short months", () => {
    expect(occurrencesInRange("2026-01-31", "monthly", "2026-02-01", "2026-03-31")).toEqual([
      "2026-02-28",
      "2026-03-31",
    ]);
  });

  it("only returns occurrences on or after the anchor date", () => {
    expect(occurrencesInRange("2026-07-10", "monthly", "2026-01-01", "2026-07-31")).toEqual([
      "2026-07-10",
    ]);
  });

  it("projects weekly and daily occurrences", () => {
    expect(occurrencesInRange("2026-07-01", "weekly", "2026-07-01", "2026-07-22")).toEqual([
      "2026-07-01",
      "2026-07-08",
      "2026-07-15",
      "2026-07-22",
    ]);
    expect(occurrencesInRange("2026-07-01", "daily", "2026-07-01", "2026-07-03")).toEqual([
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
    ]);
  });

  it("finds the next occurrence on or after a reference date", () => {
    expect(nextOccurrence("2026-07-10", "monthly", "2026-07-10")).toBe("2026-07-10");
    expect(nextOccurrence("2026-07-10", "monthly", "2026-07-11")).toBe("2026-08-10");
    expect(nextOccurrence("2026-07-10", "monthly", "2026-09-25")).toBe("2026-10-10");
  });

  it("describes a cadence in words", () => {
    expect(describeRecurrence("monthly", "2026-07-10")).toBe("Monthly on the 10th");
    expect(describeRecurrence("monthly", "2026-07-21")).toBe("Monthly on the 21st");
    expect(describeRecurrence("weekly", "2026-07-01")).toBe("Weekly on Wed");
    expect(describeRecurrence("daily", "2026-07-01")).toBe("Daily");
  });
});
