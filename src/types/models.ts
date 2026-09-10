import type {
  Database,
  ExpenseCategory,
  MemberRole,
  ShoppingCategory,
  UrgencyLevel,
} from "./database.types";

export type {
  ExpenseCategory,
  MemberRole,
  ShoppingCategory,
  UrgencyLevel,
} from "./database.types";

export type Household = Database["public"]["Tables"]["households"]["Row"];
export type HouseholdMember = Database["public"]["Tables"]["household_members"]["Row"];
export type ShoppingItem = Database["public"]["Tables"]["shopping_items"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseSplit = Database["public"]["Tables"]["expense_splits"]["Row"];

export type NewShoppingItem = Database["public"]["Tables"]["shopping_items"]["Insert"];
export type NewExpense = Database["public"]["Tables"]["expenses"]["Insert"];
export type NewExpenseSplit = Database["public"]["Tables"]["expense_splits"]["Insert"];

/** Balance owed between two members after netting all expense splits. */
export interface SettlementBalance {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export const SHOPPING_CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  fresh_food: "ของสด",
  kitchen_supplies: "ของใช้ในครัว",
  cleaning_supplies: "อุปกรณ์ทำความสะอาด",
  personal_care: "ของใช้ส่วนตัว",
  household_goods: "ของใช้ในบ้าน",
  other: "อื่นๆ",
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: "เจ้าของบ้าน",
  member: "สมาชิก",
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  urgent: "ด่วน",
  normal: "ปกติ",
  backup: "สำรอง",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  electricity: "ค่าไฟ",
  water: "ค่าน้ำ",
  internet: "ค่าเน็ต",
  groceries: "อาหาร",
  household_goods: "ของใช้ในบ้าน",
  rent: "ค่าเช่า",
  other: "อื่นๆ",
};

/** Best-effort mapping used when pre-filling the convert-to-expense form. */
export const SHOPPING_TO_EXPENSE_CATEGORY: Record<ShoppingCategory, ExpenseCategory> = {
  fresh_food: "groceries",
  kitchen_supplies: "household_goods",
  cleaning_supplies: "household_goods",
  personal_care: "household_goods",
  household_goods: "household_goods",
  other: "other",
};
