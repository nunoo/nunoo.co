export function formatDate(dateString: string) {
  // Handle ISO timestamps from Supabase (e.g., "2024-01-15T10:30:00.000Z")
  // or simple date strings (e.g., "2024-01-15")
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
