export const formatDateIndo = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

export const getMonthName = (monthIndex: number): string => {
  const date = new Date(2024, monthIndex, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
};

export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};
