import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { formatDateIndo, getTodayISO } from '../utils/dateUtils';

interface AttendanceInputProps {
  students: Student[];
  records: AttendanceRecord[];
  onSave: (records: AttendanceRecord[]) => void;
}

const AttendanceInput: React.FC<AttendanceInputProps> = ({ students, records, onSave }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [dailyRecords, setDailyRecords] = useState<Record<string, AttendanceStatus>>({});

  // Initialize records for selected date
  useEffect(() => {
    const recordsForDate = records.filter(r => r.date === selectedDate);
    const initialMap: Record<string, AttendanceStatus> = {};
    
    // Default to empty or existing records
    recordsForDate.forEach(r => {
      initialMap[r.studentId] = r.status;
    });

    setDailyRecords(initialMap);
  }, [selectedDate, records]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setDailyRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
    
    // Auto-save logic can be implemented here or via a manual save button.
    // For this app, we will trigger an update immediately to the parent.
    // In a real API scenario, we might debounce this.
    
    const existingRecordIndex = records.findIndex(r => r.date === selectedDate && r.studentId === studentId);
    let newRecords = [...records];
    
    const recordPayload: AttendanceRecord = {
      id: existingRecordIndex >= 0 ? records[existingRecordIndex].id : crypto.randomUUID(),
      date: selectedDate,
      studentId,
      status
    };

    if (existingRecordIndex >= 0) {
      newRecords[existingRecordIndex] = recordPayload;
    } else {
      newRecords.push(recordPayload);
    }
    
    onSave(newRecords);
  };

  const getStatusButtonClass = (status: AttendanceStatus, current: AttendanceStatus | undefined) => {
    const baseClass = "flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 border";
    const isSelected = status === current;

    if (!isSelected) {
      return `${baseClass} bg-white text-slate-600 border-slate-200 hover:bg-slate-50`;
    }

    switch (status) {
      case 'Hadir': return `${baseClass} bg-green-100 text-green-700 border-green-200 ring-1 ring-green-500`;
      case 'Sakit': return `${baseClass} bg-yellow-100 text-yellow-700 border-yellow-200 ring-1 ring-yellow-500`;
      case 'Izin': return `${baseClass} bg-blue-100 text-blue-700 border-blue-200 ring-1 ring-blue-500`;
      case 'Alpha': return `${baseClass} bg-red-100 text-red-700 border-red-200 ring-1 ring-red-500`;
      default: return baseClass;
    }
  };

  if (students.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">Silakan import data siswa terlebih dahulu pada menu Data Siswa.</p>
      </div>
    );
  }

  // Group by Class
  const classes = Array.from(new Set(students.map(s => s.className))).sort();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Absensi Harian
            </h2>
            <p className="text-slate-500 mt-1">{formatDateIndo(selectedDate)}</p>
          </div>
          <div className="flex items-center gap-3">
             <label className="text-sm font-medium text-slate-700">Pilih Tanggal:</label>
             <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             />
          </div>
        </div>
        
        {/* Stats for the day */}
        <div className="grid grid-cols-4 gap-2 mt-6">
           {['Hadir', 'Sakit', 'Izin', 'Alpha'].map(status => {
             const count = Object.values(dailyRecords).filter(s => s === status).length;
             const colors: any = { 
               'Hadir': 'bg-green-50 text-green-700 border-green-200',
               'Sakit': 'bg-yellow-50 text-yellow-700 border-yellow-200',
               'Izin': 'bg-blue-50 text-blue-700 border-blue-200',
               'Alpha': 'bg-red-50 text-red-700 border-red-200'
             };
             return (
               <div key={status} className={`p-3 rounded-lg border text-center ${colors[status]}`}>
                 <div className="text-xs font-semibold uppercase opacity-70">{status}</div>
                 <div className="text-xl font-bold">{count}</div>
               </div>
             )
           })}
        </div>
      </div>

      <div className="space-y-8">
        {classes.map(className => (
          <div key={className} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
               <h3 className="font-semibold text-slate-700">Kelas {className}</h3>
            </div>
            <div className="p-4 space-y-3">
              {students.filter(s => s.className === className).map(student => (
                <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-slate-50 transition-all gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 font-mono">{student.nis}</div>
                    <div className="font-medium text-slate-900">{student.name}</div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto md:min-w-[320px]">
                    {(['Hadir', 'Sakit', 'Izin', 'Alpha'] as AttendanceStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student.id, status)}
                        className={getStatusButtonClass(status, dailyRecords[student.id])}
                      >
                         <span className="md:hidden">{status[0]}</span>
                         <span className="hidden md:inline">{status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceInput;
