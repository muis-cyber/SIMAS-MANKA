import * as XLSX from 'xlsx';
import { Student, AttendanceRecord, MonthlyStats } from '../types';

// Helper to generate a template with multiple class examples
export const generateTemplate = () => {
  const data = [
    { NIS: '12345', Nama: 'Budi Santoso', Kelas: '10A' },
    { NIS: '12346', Nama: 'Siti Aminah', Kelas: '10A' },
    { NIS: '12347', Nama: 'Andi Wijaya', Kelas: '10B' },
    { NIS: '12348', Nama: 'Rina Putri', Kelas: '10B' },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daftar Siswa");
  XLSX.writeFile(wb, "template_siswa_multi_kelas.xlsx");
};

// Helper to parse uploaded file
export const parseStudentFile = async (file: File): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        let allStudents: Student[] = [];

        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);

          const sheetStudents: Student[] = json.map((row: any) => ({
            id: crypto.randomUUID(),
            nis: String(row['NIS'] || row['nis'] || ''),
            name: String(row['Nama'] || row['nama'] || row['Nama Siswa'] || ''),
            className: String(row['Kelas'] || row['kelas'] || '')
          })).filter(s => s.name && s.nis);
          
          allStudents = [...allStudents, ...sheetStudents];
        });

        resolve(allStudents);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

// Internal helper to group stats by class and export to multiple sheets
const exportToExcelWithSheets = (
  filename: string,
  stats: MonthlyStats[],
  students: Student[],
  periodLabel: string
) => {
  const wb = XLSX.utils.book_new();
  
  // Get unique classes
  const classes = Array.from(new Set(students.map(s => s.className))).sort();

  classes.forEach(className => {
    const classStats = stats.filter(stat => {
      const student = students.find(s => s.id === stat.studentId);
      return student?.className === className;
    });

    if (classStats.length > 0) {
      const data = classStats.map((stat, idx) => {
        const student = students.find(s => s.id === stat.studentId);
        return {
          'No': idx + 1,
          'NIS': student?.nis || '-',
          'Nama Siswa': student?.name || 'Unknown',
          'Kelas': student?.className || '-',
          'Hadir': stat.hadir,
          'Sakit': stat.sakit,
          'Izin': stat.izin,
          'Alpha': stat.alpha,
          'Total Kehadiran (%)': ((stat.hadir / (stat.total || 1)) * 100).toFixed(1) + '%'
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      // Sheet names can't be longer than 31 chars and can't have special chars
      const safeSheetName = `Kelas ${className}`.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    }
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportMonthlyRecap = (
  month: number, 
  year: number, 
  stats: MonthlyStats[], 
  students: Student[]
) => {
  const monthName = new Date(year, month).toLocaleString('id-ID', { month: 'long' });
  const filename = `Rekap_Absensi_${monthName}_${year}`;
  exportToExcelWithSheets(filename, stats, students, monthName);
};

export const exportSemesterRecap = (
  semester: number,
  year: number,
  stats: MonthlyStats[],
  students: Student[]
) => {
  const filename = `Rekap_Absensi_Semester_${semester}_${year}`;
  exportToExcelWithSheets(filename, stats, students, `Semester ${semester}`);
};