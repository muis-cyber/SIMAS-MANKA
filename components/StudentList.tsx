import React, { useRef, useState } from 'react';
import { Upload, Download, Users, Trash2, Info } from 'lucide-react';
import { Student } from '../types';
import { generateTemplate, parseStudentFile } from '../services/excelService';

interface StudentListProps {
  students: Student[];
  onImport: (students: Student[]) => void;
  onClear: () => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onImport, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const parsedStudents = await parseStudentFile(file);
      if (parsedStudents.length === 0) {
        setError("Format file tidak sesuai atau kosong. Pastikan menggunakan template.");
      } else {
        onImport(parsedStudents);
      }
    } catch (err) {
      setError("Gagal membaca file excel.");
      console.error(err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Data Siswa
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Kelola data siswa (Mendukung banyak kelas sekaligus).</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button 
            onClick={generateTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4" /> Download Template
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
              className="hidden"
              ref={fileInputRef}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-md shadow-blue-200"
              disabled={loading}
            >
              <Upload className="w-4 h-4" /> {loading ? 'Mengimpor...' : 'Import Excel'}
            </button>
          </div>
          
          {students.length > 0 && (
             <button 
              onClick={() => {
                if(window.confirm('Apakah Anda yakin ingin menghapus semua data siswa? Data absensi juga akan hilang.')) {
                  onClear();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
            >
              <Trash2 className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Tips Import Multi-Kelas:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Anda bisa memasukkan banyak kelas dalam satu tabel dengan mengisi kolom <b>Kelas</b>.</li>
            <li>Aplikasi juga akan membaca data dari <b>seluruh sheet</b> yang ada di dalam file Excel Anda.</li>
            <li>NIS yang sama akan dianggap sebagai siswa yang sama.</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Belum ada data siswa</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              Silakan download template, isi data siswa, dan import kembali ke aplikasi ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">NIS</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Nama Siswa</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Kelas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-slate-600">{student.nis}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{student.name}</td>
                    <td className="px-6 py-3 text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {student.className}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {students.length > 0 && (
         <div className="text-center text-sm text-slate-500">
           Total: {students.length} Siswa dari {new Set(students.map(s => s.className)).size} Kelas
         </div>
      )}
    </div>
  );
};

export default StudentList;