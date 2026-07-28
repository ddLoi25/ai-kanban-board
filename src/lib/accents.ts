export const COLUMN_ACCENTS = ["#00DADA", "#F5DF00", "#FF6200", "#6B21E8", "#FF2952"];

export function accentForColumn(index: number): string {
  return COLUMN_ACCENTS[index % COLUMN_ACCENTS.length];
}
