import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";
import Modal from "./Modal";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CalendarModal({ isOpen, onClose, habit, onCompletionChanged }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyDate, setBusyDate] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const from = formatDate(firstDay);
  const to = formatDate(new Date(year, month, daysInMonth));

  useEffect(() => {
    if (!isOpen || !habit) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return undefined;
      setLoading(true);
      setError("");
      return api.get(`/habits/${habit.id}/completions`, { params: { from, to } })
        .then((response) => {
          if (active) setCompletions(response.data.map((completion) => completion.date));
        })
        .catch((fetchError) => {
          if (active) setError(fetchError.response?.data?.error?.message || "Could not load completion history.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });

    return () => { active = false; };
  }, [from, habit, isOpen, to]);

  const toggleCompletion = async (date) => {
    if (busyDate) return;
    setBusyDate(date);
    setError("");
    try {
      if (completions.includes(date)) {
        await api.delete(`/habits/${habit.id}/completions/${date}`);
        setCompletions((previous) => previous.filter((item) => item !== date));
      } else {
        await api.put(`/habits/${habit.id}/completions/${date}`);
        setCompletions((previous) => [...previous, date]);
      }
      onCompletionChanged?.();
    } catch (toggleError) {
      setError(toggleError.response?.data?.error?.message || "Could not update this completion.");
    } finally {
      setBusyDate("");
    }
  };

  const moveMonth = (amount) => setCurrentDate(new Date(year, month + amount, 1));
  const monthLabel = currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = formatDate(new Date());

  if (!habit) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${habit.name} history`}>
      <div className="p-2">
        <div className="mb-5 flex items-center justify-between">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="rounded-lg p-2 hover:bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-semibold text-gray-800">{monthLabel}</h3>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="rounded-lg p-2 hover:bg-gray-100">
            <ChevronRight size={20} />
          </button>
        </div>

        {error && <p role="alert" className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p className="py-10 text-center text-gray-500">Loading calendar...</p>
        ) : (
          <>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay.getDay() }, (_, index) => <span key={`empty-${index}`} />)}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const date = formatDate(new Date(year, month, day));
                const completed = completions.includes(date);
                const outsideHabitDates = date < habit.startDate || (habit.endDate && date > habit.endDate);
                const cannotComplete = habit.status !== "ACTIVE" || outsideHabitDates;
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={Boolean(busyDate) || (cannotComplete && !completed)}
                    onClick={() => toggleCompletion(date)}
                    aria-label={`${date}${completed ? ", completed" : ""}`}
                    className={`h-10 rounded-lg text-sm transition-colors disabled:opacity-60 ${
                      completed ? "bg-[#5348C7] text-white" : cannotComplete ? "text-gray-300" : "text-gray-700 hover:bg-gray-100"
                    } ${today === date && !completed ? "border-2 border-[#5348C7]" : ""}`}
                  >
                    {completed ? <Check size={16} className="mx-auto" /> : day}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <p className="mt-4 text-center text-xs text-gray-500">Select a date to mark it complete or undo it.</p>
      </div>
    </Modal>
  );
}
