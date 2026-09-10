import type { SettlementBalance } from "@/types/models";

interface UnsettledSplit {
  user_id: string;
  share_amount: number;
  paid_by: string;
}

/** Net balance per user: positive = owed money, negative = owes money. */
export function computeNetBalances(splits: UnsettledSplit[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const split of splits) {
    if (split.user_id === split.paid_by) continue;
    balances[split.user_id] = (balances[split.user_id] ?? 0) - split.share_amount;
    balances[split.paid_by] = (balances[split.paid_by] ?? 0) + split.share_amount;
  }
  return balances;
}

/** Greedy min-cash-flow: largest debtor pays largest creditor until both clear. */
export function simplifyDebts(netBalances: Record<string, number>): SettlementBalance[] {
  const creditors = Object.entries(netBalances)
    .filter(([, amount]) => amount > 0.01)
    .map(([userId, amount]) => ({ userId, amount }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = Object.entries(netBalances)
    .filter(([, amount]) => amount < -0.01)
    .map(([userId, amount]) => ({ userId, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const result: SettlementBalance[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;

    result.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amount });

    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }
  return result;
}
