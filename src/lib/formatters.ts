/**
 * Formats a number as Swiss currency (CHF) with thousand separators
 * @param amount - The amount to format
 * @param minimumFractionDigits - Minimum number of fraction digits (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, minimumFractionDigits: number = 2): string {
  return `CHF ${amount.toLocaleString('de-CH', { 
    minimumFractionDigits, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Formats a number with thousand separators (Swiss locale)
 * @param amount - The amount to format
 * @param minimumFractionDigits - Minimum number of fraction digits (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(amount: number, minimumFractionDigits: number = 0): string {
  return amount.toLocaleString('de-CH', { 
    minimumFractionDigits, 
    maximumFractionDigits: 2 
  });
}

/**
 * Formats a percentage with one decimal place
 * @param percentage - The percentage to format
 * @returns Formatted percentage string
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}