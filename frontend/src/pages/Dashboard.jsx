import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../api/axios";
import NewHabitModal from "../components/NewHabitModal";
import CalendarModal from "../components/CalendarModal";
import AppHeader from "../components/AppHeader";
import {
  Home,
  Tag,
  Archive,
  Trash2,
  LogOut,
  Target,
  Check,
  CalendarDays,
  Pencil,
  Hand,
} from "lucide-react";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [labels, setLabels] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [completionsMap, setCompletionsMap] = useState({});
  const [editingHabit, setEditingHabit] = useState(null);
  const [calendarHabit, setCalendarHabit] = useState(null);
  const [periodDays, setPeriodDays] = useState(7);
  const [pageError, setPageError] = useState("");

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setPageError("");
    const to = formatDate(new Date());
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - periodDays + 1);
    const from = formatDate(fromDate);
    try {
      const [habitsRes, statsRes, labelsRes] = await Promise.all([
        api.get("/habits"),
        api.get("/dashboard/stats", { params: { from, to } }),
        api.get("/labels"),
      ]);
      const habitsData = Array.isArray(habitsRes.data) ? habitsRes.data : [];
      setHabits(habitsData);
      setStats(statsRes.data);
      setLabels(labelsRes.data);

      const completionsData = {};
      await Promise.all(
        habitsData.map(async (habit) => {
          const res = await api.get(`/habits/${habit.id}/completions`, {
            params: { from, to },
          });
          completionsData[habit.id] = res.data.map((c) => c.date);
        }),
      );
      setCompletionsMap(completionsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setPageError(
        error.response?.data?.error?.message ||
          "Could not load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleToggleCompletion = async (habitId, dateStr) => {
    try {
      const isCompleted = completionsMap[habitId]?.includes(dateStr);
      if (isCompleted) {
        await api.delete(`/habits/${habitId}/completions/${dateStr}`);
        setCompletionsMap((prev) => ({
          ...prev,
          [habitId]: prev[habitId].filter((d) => d !== dateStr),
        }));
      } else {
        await api.put(`/habits/${habitId}/completions/${dateStr}`);
        setCompletionsMap((prev) => ({
          ...prev,
          [habitId]: [...(prev[habitId] || []), dateStr],
        }));
      }
      await fetchData();
    } catch (error) {
      console.error(error);
      setPageError(
        error.response?.data?.error?.message || "Could not update completion.",
      );
    }
  };

  const handleHabitStatus = async (habitId, action) => {
    setPageError("");
    try {
      if (action === "archive") await api.post(`/habits/${habitId}/archive`);
      else await api.delete(`/habits/${habitId}`);
      await fetchData();
    } catch (error) {
      console.error(error);
      setPageError(
        error.response?.data?.error?.message || "Could not update this habit.",
      );
    }
  };

  const activeHabits = habits.filter((h) => h.status === "ACTIVE");

  const statCards = [
    { title: "Completed", value: stats?.totalCompletions ?? 0 },
    { title: "In progress", value: stats?.activeHabits ?? 0 },
    { title: "Completion rate", value: `${stats?.completionRate ?? 0}%` },
    { title: "Expected", value: stats?.expectedCompletions ?? 0 },
  ];

  const habitColors = [
    "bg-[#DCEBFF]",
    "bg-[#FFE2E2]",
    "bg-[#FFF3C7]",
    "bg-[#D1FAE8]",
  ];

  const navigation = [
    { name: "Home", path: "/dashboard", icon: <Home size={20} /> },
    { name: "Labels", path: "/labels", icon: <Tag size={20} /> },
    { name: "Archive", path: "/archive", icon: <Archive size={20} /> },
    { name: "Trash", path: "/trash", icon: <Trash2 size={20} /> },
  ];

  const getPeriodDays = () => {
    const days = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: formatDate(d),
        dayLetter: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        dayNum: d.getDate(),
      });
    }
    return days;
  };
  const periodDates = getPeriodDays();

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-['Poppins']">
      <AppHeader />

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="hidden w-[240px] shrink-0 flex-col bg-[#F7F7F7] px-6 py-8 md:flex">
          <nav className="space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] ${isActive ? "bg-white font-semibold text-[#5348C7] shadow-sm" : "text-gray-600 hover:bg-white hover:text-[#5348C7]"}`
                }
              >
                {item.icon} {item.name}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm mt-8">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#5348C7] text-white font-bold">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-semibold">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500"
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-8 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="flex items-center gap-2 text-[24px] font-bold">
              {localStorage.getItem("token") && user.firstName
                ? `${greeting}, ${user.firstName}`
                : "Welcome"}
              <Hand size={22} className="text-[#EAB308]" aria-hidden="true" />
            </h1>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Period
              <select
                value={periodDays}
                onChange={(event) => setPeriodDays(Number(event.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </label>
          </div>

          {pageError && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {pageError}
            </p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.title}
                className="bg-white rounded-xl p-5 shadow-sm"
              >
                <p className="text-[14px] font-semibold text-gray-600">
                  {stat.title}
                </p>
                <p className="text-[32px] font-bold text-gray-800 mt-2">
                  {loading ? "..." : stat.value}
                </p>
                <p className="text-[12px] text-gray-400 mt-1">
                  {stat.title === "Completed" ||
                  stat.title === "Completion rate"
                    ? `${stats?.period?.days || periodDays}-day period`
                    : "Current period"}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-10 mb-4">
            <h2 className="text-[22px] font-bold flex items-center gap-2">
              My Habits <Target size={22} className="text-[#5348C7]" />
            </h2>
            <button
              onClick={() => setShowHabitModal(true)}
              className="flex items-center gap-2 bg-transparent text-[#5348C7] font-semibold px-4 py-2 hover:underline"
            >
              + Create Habit
            </button>
          </div>

          <h3 className="text-[11px] font-bold uppercase text-gray-500 mb-3">
            Active
          </h3>
          {loading ? (
            <p>Loading...</p>
          ) : activeHabits.length === 0 ? (
            <div className="border border-dashed rounded-xl py-10 text-center bg-white">
              <p className="text-gray-500">No active habits yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activeHabits.map((habit, i) => (
                <div
                  key={habit.id}
                  className={`rounded-xl p-4 shadow-sm flex flex-col justify-between ${habitColors[i % 4]}`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-[14px] font-bold text-gray-800">
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCalendarHabit(habit)}
                          aria-label={`View ${habit.name} history`}
                          className="rounded-full bg-white p-1.5 text-[#5348C7] shadow-sm hover:bg-gray-100"
                        >
                          <CalendarDays size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHabit(habit);
                            setShowHabitModal(true);
                          }}
                          aria-label={`Edit ${habit.name}`}
                          className="rounded-full bg-white p-1.5 text-gray-600 shadow-sm hover:bg-gray-100"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHabitStatus(habit.id, "archive")}
                          aria-label={`Archive ${habit.name}`}
                          className="rounded-full bg-white p-1.5 text-gray-600 shadow-sm hover:bg-gray-100"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHabitStatus(habit.id, "trash")}
                          aria-label={`Move ${habit.name} to trash`}
                          className="rounded-full bg-white p-1.5 text-red-500 shadow-sm hover:bg-gray-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {(habit.labels || []).map((label, i) => (
                        <span
                          key={i}
                          className="rounded bg-white/80 px-1 py-0.5 text-[9px] font-medium text-gray-700"
                        >
                       <span className="font-bold">Labels:</span> {label}
                        </span>
                      ))}
                      <span
                      key={i}
                      className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] font-medium text-gray-700"
                    >
                      {habit.description}
                    </span>
                    </div>
                  </div>
                  <div>
                    
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-semibold text-gray-600 mb-1">
                      Last {periodDays} Days
                    </p>
                    <div className="grid grid-cols-7 gap-1">
                      {periodDates.map((day) => {
                        const isCompleted = completionsMap[habit.id]?.includes(
                          day.dateStr,
                        );
                        const outsideHabitDates =
                          day.dateStr < habit.startDate ||
                          (habit.endDate && day.dateStr > habit.endDate);
                        return (
                          <button
                            key={day.dateStr}
                            onClick={() =>
                              handleToggleCompletion(habit.id, day.dateStr)
                            }
                            aria-label={`${habit.name}, ${day.dateStr}${isCompleted ? ", completed" : ""}`}
                            disabled={outsideHabitDates && !isCompleted}
                            className={`flex flex-col items-center justify-center w-7 h-9 rounded-md transition-colors ${isCompleted ? "bg-[#5348C7] text-white" : "bg-white/60 text-gray-600 hover:bg-white"}`}
                          >
                            <span className="text-[8px] font-medium">
                              {day.dayLetter}
                            </span>
                            <span className="text-[10px] font-bold">
                              {isCompleted ? <Check size={10} /> : day.dayNum}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      {showHabitModal && (
        <NewHabitModal
          key={editingHabit?.id || "new-habit"}
          isOpen
          habit={editingHabit}
          labels={labels}
          onClose={() => {
            setShowHabitModal(false);
            setEditingHabit(null);
          }}
          onHabitCreated={fetchData}
        />
      )}
      <CalendarModal
        isOpen={Boolean(calendarHabit)}
        habit={calendarHabit}
        onClose={() => setCalendarHabit(null)}
        onCompletionChanged={fetchData}
      />
    </div>
  );
}
