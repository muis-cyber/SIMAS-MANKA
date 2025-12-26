export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  className: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO String YYYY-MM-DD
  status: AttendanceStatus;
}

export interface MonthlyStats {
  studentId: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
}