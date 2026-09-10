import type { ExpenseCategory } from "@/types/models";

// Fixed categorical order (never cycled) from the validated default palette —
// each category keeps its color regardless of which categories are present.
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  electricity: "#2a78d6", // blue
  water: "#eb6834", // orange
  internet: "#1baf7a", // aqua
  groceries: "#eda100", // yellow
  household_goods: "#e87ba4", // magenta
  rent: "#008300", // green
  other: "#4a3aa7", // violet
};

// Default single sequential hue, for single-series magnitude (e.g. totals by month).
export const SEQUENTIAL_BLUE = "#2a78d6";
