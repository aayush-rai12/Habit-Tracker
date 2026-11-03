import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import CalendarModal from "../components/CalendarModal";
import AppHeader from "../components/AppHeader";
import { Home, Tag, Archive as ArchiveIcon, Trash2, LogOut, RotateCcw, CalendarDays } from "lucide-react";

export default function Archive() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarHabit, setCalendarHabit] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchArchived = async () => {
    try {
      const res = await api.get("/habits?status=ARCHIVED");
      setHabits(res.data);
      setError("");
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.response?.data?.error?.message || "Could not load archived habits.");
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
    else void Promise.resolve().then(fetchArchived);
  }, [navigate]);

  const handleUnarchive = async (id) => {
    try {
      await api.post(`/habits/${id}/unarchive`);
      await fetchArchived();
    } catch (restoreError) {
      console.error(restoreError);
      setError(restoreError.response?.data?.error?.message || "Could not restore this habit.");
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const navigation = [
    { name: "Home", path: "/dashboard", icon: <Home size={20} /> },
    { name: "Labels", path: "/labels", icon: <Tag size={20} /> },
    { name: "Archive", path: "/archive", icon: <ArchiveIcon size={20} /> },
    { name: "Trash", path: "/trash", icon: <Trash2 size={20} /> },
  ];

  const habitColors = ["bg-[#DCEBFF]", "bg-[#FFE2E2]", "bg-[#FFF3C7]", "bg-[#D1FAE8]"];

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-['Poppins']">
      <AppHeader />

      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="hidden w-[240px] shrink-0 flex-col bg-[#F7F7F7] px-6 py-8 md:flex">
          <nav className="space-y-2">
            {navigation.map(item => (
              <Link key={item.name} to={item.path}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] ${item.path === "/archive" ? "bg-white font-semibold text-[#5348C7] shadow-sm" : "text-gray-600 hover:bg-white hover:text-[#5348C7]"}`}>
                {item.icon} {item.name}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm mt-8">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#5348C7] text-white font-bold">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <p className="truncate text-[13px] font-semibold flex-1">{user.firstName}</p>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500"><LogOut size={18} /></button>
          </div>
        </aside>

        <main className="flex-1 px-6 py-8 sm:px-8 lg:px-10">
          <h1 className="text-[24px] font-bold mb-6">Archive</h1>
          {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          
          {loading ? <p>Loading...</p> : habits.length === 0 ? (
            <div className="border border-dashed rounded-xl py-10 text-center bg-white">
              <p className="text-gray-500">No archived habits.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {habits.map((habit, i) => (
                <div key={habit.id} className={`rounded-xl p-4 shadow-sm flex flex-col justify-between ${habitColors[i % 4]}`}>
                  <div className="flex justify-between items-start">
                    <h3 className="text-[15px] font-bold text-gray-800">{habit.name}</h3>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setCalendarHabit(habit)} className="bg-white rounded p-1 text-[#5348C7] shadow-sm hover:bg-gray-100" title="View completion history">
                        <CalendarDays size={14} />
                      </button>
                      <button type="button" onClick={() => handleUnarchive(habit.id)} className="bg-white rounded p-1 text-[#5348C7] shadow-sm hover:bg-gray-100" title="Restore">
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-600 mt-3">{habit.description || "No description"}</p>
                  <p className="text-[10px] font-semibold text-gray-500 mt-3">{habit.goal || 1} times {habit.frequency.toLowerCase()}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <CalendarModal
        isOpen={Boolean(calendarHabit)}
        habit={calendarHabit}
        onClose={() => setCalendarHabit(null)}
      />
    </div>
  );
}