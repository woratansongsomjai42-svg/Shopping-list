import type {
  Database,
  ExpenseCategory,
  MemberRole,
  PersonalAssetType,
  PersonalTransactionType,
  ShoppingCategory,
  UrgencyLevel,
} from "./database.types";

export type {
  ExpenseCategory,
  MemberRole,
  PersonalAssetType,
  PersonalTransactionType,
  ShoppingCategory,
  UrgencyLevel,
} from "./database.types";

export type Household = Database["public"]["Tables"]["households"]["Row"];
export type HouseholdMember = Database["public"]["Tables"]["household_members"]["Row"];
export type ShoppingItem = Database["public"]["Tables"]["shopping_items"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseSplit = Database["public"]["Tables"]["expense_splits"]["Row"];

export type PersonalTransaction = Database["public"]["Tables"]["personal_transactions"]["Row"];
export type PersonalAsset = Database["public"]["Tables"]["personal_assets"]["Row"];

export type NewShoppingItem = Database["public"]["Tables"]["shopping_items"]["Insert"];
export type NewExpense = Database["public"]["Tables"]["expenses"]["Insert"];
export type NewExpenseSplit = Database["public"]["Tables"]["expense_splits"]["Insert"];
export type NewPersonalTransaction = Database["public"]["Tables"]["personal_transactions"]["Insert"];
export type NewPersonalAsset = Database["public"]["Tables"]["personal_assets"]["Insert"];

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

export const PERSONAL_TRANSACTION_TYPE_LABELS: Record<PersonalTransactionType, string> = {
  income: "รายรับ",
  expense: "รายจ่าย",
};

export const PERSONAL_INCOME_CATEGORIES = ["เงินเดือน", "รายได้เสริม", "ของขวัญ", "อื่นๆ"];
export const PERSONAL_EXPENSE_CATEGORIES = [
  "อาหาร",
  "เดินทาง",
  "ช้อปปิ้ง",
  "บันเทิง",
  "สุขภาพ",
  "อื่นๆ",
];

export const PERSONAL_ASSET_TYPE_LABELS: Record<PersonalAssetType, string> = {
  savings: "เงินฝาก/ออมทรัพย์",
  stock: "หุ้น",
  mutual_fund: "กองทุนรวม",
  crypto: "คริปโต",
  real_estate: "อสังหาริมทรัพย์",
  gold: "ทองคำ",
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
