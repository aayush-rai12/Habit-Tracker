import { useState } from "react";
import Modal from "./Modal";
import api from "../api/axios";

const getToday = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const getInitialForm = (habit) => ({
  name: habit?.name || "",
  description: habit?.description || "",
  startDate: habit?.startDate || getToday(),
  endDate: habit?.endDate || "",
  goal: habit?.goal || 1,
  frequency: habit?.frequency || "DAILY",
  color: habit?.color || "#3B82F6",
  labels: habit?.labelIds || [],
});

export default function NewHabitModal({ isOpen, onClose, onHabitCreated, habit = null, labels = [] }) {
  const [formData, setFormData] = useState(() => getInitialForm(habit));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const habitColors = [
    "#8B5CF6", "#3B82F6", "#22C55E", "#F97316", "#EC4899", 
    "#EF4444", "#14B8A6", "#EAB308", "#6366F1", "#F43F5E", "#A3E635"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = { ...formData, name: formData.name.trim() };
      if (habit) await api.patch(`/habits/${habit.id}`, payload);
      else await api.post("/habits", payload);
      await onHabitCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to create habit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={habit ? "Edit Habit" : "New Habit"}>
      <form onSubmit={handleSubmit} className="space-y-4 font-['Poppins']">
        {error && (
          <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Name</label>
          <input
            type="text"
            required
            placeholder="Enter name of your habit"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[15px] focus:outline-none focus:border-[#5348C7]"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-800 mb-1">Start Date</label>
            <input
              type="date"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[15px] text-gray-600 focus:outline-none focus:border-[#5348C7]"
              value={formData.startDate}
              max={formData.endDate || undefined}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-800 mb-1">End Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[15px] text-gray-600 focus:outline-none focus:border-[#5348C7]"
              value={formData.endDate}
              min={formData.startDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Description</label>
          <input
            type="text"
            placeholder="Enter description (optional)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[15px] focus:outline-none focus:border-[#5348C7]"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-800 mb-1">Goal</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[15px] bg-white focus:outline-none focus:border-[#5348C7]"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: Number(e.target.value) })}
            >
              <option value={1}>1 time</option>
              <option value={2}>2 times</option>
              <option value={3}>3 times</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-800 mb-1">Repeat</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[15px] bg-white focus:outline-none focus:border-[#5348C7]"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Colour</label>
          <div className="flex flex-wrap gap-2">
            {habitColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-9 h-9 rounded-full transition-all ${
                  formData.color === color ? "ring-2 ring-offset-2 ring-gray-800 scale-110" : "hover:scale-110"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">Labels</label>
          {labels.length === 0 ? (
            <p className="text-sm text-gray-500">Create labels first to assign them to this habit.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {labels.map((label) => (
                <label key={label.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.labels.includes(label.id)}
                    onChange={(event) => {
                      const selected = event.target.checked
                        ? [...formData.labels, label.id]
                        : formData.labels.filter((id) => id !== label.id);
                      setFormData({ ...formData, labels: selected });
                    }}
                  />
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />
                  {label.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#5348C7] text-white text-sm font-semibold px-8 py-2.5 rounded-lg hover:bg-[#4239a8] transition disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Done"}
          </button>
        </div>
      </form>
    </Modal>
  );
}