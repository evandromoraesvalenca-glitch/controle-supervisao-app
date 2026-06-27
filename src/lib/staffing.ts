export function normalizeStaffingCount(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

export function calculateStaffingTotal(lideres: unknown, aas: unknown, aa: unknown) {
  return normalizeStaffingCount(lideres) + normalizeStaffingCount(aas) + normalizeStaffingCount(aa);
}
