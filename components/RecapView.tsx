import React, { useMemo, useState } from 'react';
import { CalendarRange, Download, FileSpreadsheet, CalendarDays, Filter } from 'lucide-react';
import { Student, AttendanceRecord, MonthlyStats } from '../types';
import { getMonthName } from '../utils/dateUtils';
import { exportMonthlyRecap, exportSemesterRecap } from '../services/excelService';

interface RecapViewProps {
  students: Student[];
  records: AttendanceRecord[];
}

type RecapMode = 'monthly' | 'semester';

const RecapView: React.FC<RecapViewProps> = ({ students, records }) => {
  const today = new Date();
  const [mode, setMode] = useState<RecapMode>('monthly');
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedSemester, setSelectedSemester] = useState<number>(today.getMonth() < 6 ? 1 : 2);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const classes = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [students]);

  const allStats: MonthlyStats[] = useMemo(() => {
    return students.map(student => {
      const studentRecords = records.filter(r => {
        const d = new Date(r.date);
        const recordYear = d.getFullYear();
        const recordMonth = d.getMonth();

        if (recordYear !== selectedYear) return false;
        if (r.studentId !== student.id) return false;

        if (mode === 'monthly') {
          return recordMonth === selectedMonth;
        } else {
          if (selectedSemester === 1) {
            return recordMonth >= 0 && recordMonth <= 5;
          } else {
            return recordMonth >= 6 && recordMonth <= 11;
          }
        }
      });

      const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
      studentRecords.forEach(r => {
        if (counts[r.status] !== undefined) counts[r.status]++;
      });

      return {
        studentId: student.id,
        hadir: counts.Hadir,
        sakit: counts.Sakit,
        izin: counts.Izin,
        alpha: counts.Alpha,
        total: studentRecords.length
      };
    });
  }, [students, records, mode, selectedMonth, selectedSemester, selectedYear]);

  // Filter stats for current display based on selected class
  const filteredStats = useMemo(() => {
    if (selectedClass === 'all') return allStats;
    return allStats.filter(stat => {
      const student = students.find(s => s.id === stat.studentId);
      return student?.className === selectedClass;
    });
  }, [allStats, selectedClass, students]);

  const handleExport = () => {
    if (mode === 'monthly') {
      exportMonthlyRecap(selectedMonth, selectedYear, allStats, students);
    } else {
      exportSemesterRecap(selectedSemester, selectedYear, allStats, students);
    }
  };

  if (students.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
         <p className="text-slate-500">Belum ada data siswa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-indigo-600" />
            Rekap Absensi
          </h2>
          <p className="text-slate-500 mt-1">
             Laporan kehadiran (Dipisahkan per sheet saat export).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto">
          {/* Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg flex shrink-0">
             <button
                onClick={() => setMode('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
             >
               Bulanan
             </button>
             <button
                onClick={() => setMode('semester')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'semester' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
             >
               Semester
             </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Class Filter */}
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-50 border border-indigo-200 text-indigo-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 min-w-[120px] font-medium"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>

            {mode === 'monthly' ? (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[140px]"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{getMonthName(i)}</option>
                ))}
              </select>
            ) : (
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[140px]"
              >
                <option value={1}>Semester 1 (Jan - Jun)</option>
                <option value={2}>Semester 2 (Jul - Des)</option>
              </select>
            )}

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[100px]"
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const year = today.getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>
              })}
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-md shadow-green-200 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Class Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
         <button
            onClick={() => setSelectedClass('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              selectedClass === 'all' 
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
         >
           SEMUA SISWA
         </button>
         {classes.map(c => (
           <button
              key={c}
              onClick={() => setSelectedClass(c)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                selectedClass === c 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
           >
             KELAS {c}
           </button>
         ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700 text-sm uppercase">
                {selectedClass === 'all' ? 'Gabungan Seluruh Kelas' : `Daftar Kelas ${selectedClass}`}
              </span>
           </div>
           <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded">
              {filteredStats.length} Siswa
           </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 w-12 text-center">No</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Nama Siswa</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Kelas</th>
                <th className="px-4 py-4 font-semibold text-green-600 text-center">Hadir</th>
                <th className="px-4 py-4 font-semibold text-yellow-600 text-center">Sakit</th>
                <th className="px-4 py-4 font-semibold text-blue-600 text-center">Izin</th>
                <th className="px-4 py-4 font-semibold text-red-600 text-center">Alpha</th>
                <th className="px-4 py-4 font-semibold text-slate-700 text-center">% Hadir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500 italic">
                    Tidak ada data untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredStats.map((stat, idx) => {
                  const student = students.find(s => s.id === stat.studentId);
                  const attendancePercentage = stat.total > 0 
                    ? Math.round((stat.hadir / stat.total) * 100) 
                    : 0;
                  
                  return (
                    <tr key={stat.studentId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-slate-400 text-center">{idx + 1}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-900">{student?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{student?.nis}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-bold">
                          {student?.className}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-700 bg-green-50/30">{stat.hadir}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{stat.sakit}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{stat.izin}</td>
                      <td className="px-4 py-3 text-center text-red-600 font-bold bg-red-50/30">{stat.alpha}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-bold ${attendancePercentage < 75 ? 'text-red-600' : 'text-slate-700'}`}>
                            {attendancePercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecapView;