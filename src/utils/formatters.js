/**
 * Formatting utilities
 */

/**
 * Format a large number to a compact string (e.g. 1200000 → "1.2M")
 */
export function formatCompactNumber(num) {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format a number with commas (e.g. 24500 → "24,500")
 */
export function formatNumber(num) {
  return num.toLocaleString('en-IN');
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to ISO-style (YYYY-MM-DD)
 */
export function formatDateISO(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

/**
 * Format area in hectares
 */
export function formatArea(hectares) {
  return `${formatNumber(hectares)} ha`;
}

/**
 * Format carbon amount in tCO2e
 */
export function formatCarbon(tonnes) {
  return `${formatCompactNumber(tonnes)} tCO2e`;
}

/**
 * Truncate a blockchain hash for display
 */
export function truncateHash(hash, startLen = 6, endLen = 4) {
  if (!hash || hash.length <= startLen + endLen) return hash;
  return `${hash.slice(0, startLen)}...${hash.slice(-endLen)}`;
}

/**
 * Get relative time string (e.g. "2 hours ago")
 */
export function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateStr);
}
