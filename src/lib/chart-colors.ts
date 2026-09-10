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

// Personal expense categories are free text (see PERSONAL_EXPENSE_CATEGORIES),
// so this is keyed by label rather than an enum — same fixed-slot approach.
export const PERSONAL_EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  อาหาร: "#2a78d6", // blue
  เดินทาง: "#eb6834", // orange
  ช้อปปิ้ง: "#1baf7a", // aqua
  บันเทิง: "#eda100", // yellow
  สุขภาพ: "#e87ba4", // magenta
  อื่นๆ: "#4a3aa7", // violet
};

// Default single sequential hue, for single-series magnitude (e.g. totals by month).
export const SEQUENTIAL_BLUE = "#2a78d6";

// Two-series income/expense pairing for the personal dashboard's trend chart.
export const INCOME_COLOR = "#1baf7a";
export const EXPENSE_COLOR = "#ff8a65";
