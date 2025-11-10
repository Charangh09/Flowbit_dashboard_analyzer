export const SACHKONTO_LABELS: Record<string, string> = {
  '3400': 'Sales Revenue',
  '4400': 'Professional Services',
  '4910': 'Repairs & Maintenance',
  '4920': 'Equipment & Supplies',
  '4925': 'Software & Licenses',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}