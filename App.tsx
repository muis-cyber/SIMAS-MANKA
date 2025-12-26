import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, Users, CheckSquare, BarChart3, Menu, X, LogIn, LogOut, Cloud, RefreshCw, AlertCircle, UserCircle } from 'lucide-react';
import StudentList from './components/StudentList';
import AttendanceInput from './components/AttendanceInput';
import RecapView from './components/RecapView';
import { Student, AttendanceRecord, User } from './types';

// NOTE: Ganti dengan Google Client ID Anda yang asli dari Google Cloud Console.
// Tanpa Client ID yang valid, tombol Google mungkin tidak akan muncul.
const GOOGLE_CLIENT_ID = "538780419768-ns9j54sqeun21v44tktefv7ari7c2tb6.apps.googleusercontent.com";

type View = 'dashboard' | 'students' | 'attendance' | 'recap';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('attendance');
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleCredentialResponse = useCallback((response: any) => {
    const userData = parseJwt(response.credential);
    if (userData) {
      const newUser: User = {
        id: userData.sub,
        name: userData.name,
        email: userData.email,
        picture: userData.picture
      };
      setUser(newUser);
      localStorage.setItem('simas_user', JSON.stringify(newUser));
      
      const userKey = `simas_data_${newUser.id}`;
      const savedData = localStorage.getItem(userKey);
      if (savedData) {
        const { students: s, records: r } = JSON.parse(savedData);
        setStudents(s || []);
        setRecords(r || []);
      }
    }
  }, []);

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: 'guest_local_user',
      name: 'Pengguna Offline',
      email: 'offline@local',
      picture: 'https://ui-avatars.com/api/?name=Pengguna+Offline&background=0D8ABC&color=fff'
    };
    
    setUser(guestUser);
    localStorage.setItem('simas_user', JSON.stringify(guestUser));

    // Load guest data
    const userKey = `simas_data_${guestUser.id}`;
    const savedData = localStorage.getItem(userKey);
    if (savedData) {
      const { students: s, records: r } = JSON.parse(savedData);
      setStudents(s || []);
      setRecords(r || []);
    } else {
      // Initialize empty for new guest
      setStudents([]);
      setRecords([]);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('simas_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      const userKey = `simas_data_${parsedUser.id}`;
      const savedData = localStorage.getItem(userKey);
      if (savedData) {
        const { students: s, records: r } = JSON.parse(savedData);
        setStudents(s || []);
        setRecords(r || []);
      }
    }

    const initGsi = () => {
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.id) {
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            use_fedcm_for_prompt: false, 
            itp_support: true
          });

          if (!storedUser && googleBtnContainerRef.current) {
            google.accounts.id.renderButton(
              googleBtnContainerRef.current,
              { 
                theme: "outline", 
                size: "large", 
                width: "280", 
                shape: "pill",
                text: "signin_with",
                logo_alignment: "left"
              }
            );
          }
        } catch (err) {
          console.error("GSI Initialization error:", err);
        }
      }
    };

    const interval = setInterval(() => {
      const google = (window as any).google;
      if (google && google.accounts) {
        initGsi();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [handleCredentialResponse, user]);

  useEffect(() => {
    if (user) {
      const userKey = `simas_data_${user.id}`;
      const data = { students, records };
      localStorage.setItem(userKey, JSON.stringify(data));

      setIsSyncing(true);
      const syncTimer = setTimeout(() => setIsSyncing(false), 800);
      return () => clearTimeout(syncTimer);
    }
  }, [students, records, user]);

  const handleLogout = () => {
    setUser(null);
    setStudents([]);
    setRecords([]);
    localStorage.removeItem('simas_user');
    const google = (window as any).google;
    if (google) {
      google.accounts.id.disableAutoSelect();
    }
  };

  const handleClearData = () => {
    if (user) {
      setStudents([]);
      setRecords([]);
      localStorage.removeItem(`simas_data_${user.id}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
            <CheckSquare className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">SIMAS Man Karo</h1>
          <p className="text-slate-500 mt-3 mb-8">
            Sistem Informasi Manajemen Absensi Siswa.<br/>
            Silakan login untuk memulai.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center min-h-[50px]">
               <div ref={googleBtnContainerRef}></div>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-medium">Atau masuk dengan</span>
              </div>
            </div>

            <button 
              onClick={handleGuestLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-full hover:bg-slate-900 transition-all font-medium shadow-lg shadow-slate-200 hover:shadow-xl transform active:scale-95"
            >
              <UserCircle className="w-5 h-5" />
              Masuk sebagai Tamu (Offline)
            </button>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-left mt-6">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-bold">Informasi:</p>
                <p>Mode Tamu menyimpan data hanya di browser ini. Gunakan Google Login jika ingin sinkronisasi antar perangkat.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-slate-400 text-xs">
            Abdul Muis Natari &copy; 2025 SIMAS Man Karo
          </div>
        </div>
      </div>
    );
  }

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
        currentView === view
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 z-30 transform transition-transform duration-200 ease-in-out flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">SIMAS</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1 flex-1">
          <NavItem view="attendance" icon={CheckSquare} label="Absensi Harian" />
          <NavItem view="recap" icon={BarChart3} label="Rekap Bulanan" />
          <NavItem view="students" icon={Users} label="Data Siswa" />
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate leading-none mb-1">{user.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                {isSyncing ? (
                  <><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing...</>
                ) : (
                  <><Cloud className="w-2.5 h-2.5" /> Terkoneksi ({user.id === 'guest_local_user' ? 'Lokal' : 'Cloud'})</>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>

          <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
            Versi 1.0.0
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">SIMAS</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {currentView === 'attendance' && (
              <AttendanceInput 
                students={students} 
                records={records}
                onSave={setRecords}
              />
            )}
            
            {currentView === 'recap' && (
              <RecapView 
                students={students}
                records={records}
              />
            )}
            
            {currentView === 'students' && (
              <StudentList 
                students={students}
                onImport={(newStudents) => {
                  const existingNis = new Set(students.map(s => s.nis));
                  const uniqueNew = newStudents.filter(s => !existingNis.has(s.nis));
                  setStudents([...students, ...uniqueNew]);
                }}
                onClear={handleClearData}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;