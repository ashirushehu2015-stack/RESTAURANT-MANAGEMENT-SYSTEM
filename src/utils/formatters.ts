export function formatNaira(amount: number, includeDecimals = false): string {
  if (isNaN(amount)) return '₦0';
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);
  return `₦${formatted}`;
}

export function formatDateFormatted(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatTimeFormatted(dateObj: Date = new Date()): string {
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

export function generateReceiptNo(existingCount: number = 0): string {
  const seq = 202600025 + existingCount;
  return `RCT-${seq}`;
}

export function generateInvoiceNo(existingCount: number = 0): string {
  const seq = 202600023 + existingCount;
  return `INV-${seq}`;
}

export function generateRegNo(existingCount: number = 0): string {
  const num = 2581 + existingCount;
  return String(num).padStart(5, '0');
}
