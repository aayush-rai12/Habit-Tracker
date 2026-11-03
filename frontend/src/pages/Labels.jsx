import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AppHeader from "../components/AppHeader";
import { Home, Tag, Archive, Trash2, LogOut, Search, Pencil, X } from "lucide-react";

export default function Labels() {
  const [labels, setLabels] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchLabels = async () => {
    try {
      const res = await api.get("/labels");
      setLabels(res.data);
      setError("");
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.response?.data?.error?.message || "Could not load labels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
    else Promise.resolve().then(fetchLabels);
  }, [navigate]);

  const handleSaveLabel = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (editingLabel) {
        await api.patch(`/labels/${editingLabel.id}`, { name: newLabel.trim(), color: editingLabel.color });
      } else {
        await api.post("/labels", { name: newLabel.trim(), color: "#3B82F6" });
      }
      setNewLabel("");
      setEditingLabel(null);
      setShowModal(false);
      await fetchLabels();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.response?.data?.error?.message || "Could not save label.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLabel = async (label) => {
    if (!window.confirm(`Delete "${label.name}"? It will also be removed from linked habits.`)) return;
    setError("");
    try {
      await api.delete(`/labels/${label.id}`);
      await fetchLabels();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.response?.data?.error?.message || "Could not delete label.");
    }
  };

  const openCreateModal = () => {
    setEditingLabel(null);
    setNewLabel("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (label) => {
    setEditingLabel(label);
    setNewLabel(label.name);
    setError("");
    setShowModal(true);
  };

  const visibleLabels = labels.filter((label) => label.name.toLowerCase().includes(search.toLowerCase()));
  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const navigation = [
    { name: "Home", path: "/dashboard", icon: <Home size={20} /> },
    { name: "Labels", path: "/labels", icon: <Tag size={20} /> },
    { name: "Archive", path: "/archive", icon: <Archive size={20} /> },
    { name: "Trash", path: "/trash", icon: <Trash2 size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-['Poppins']">
      <AppHeader />

      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="hidden w-[240px] shrink-0 flex-col bg-[#F7F7F7] px-6 py-8 md:flex">
          <nav className="space-y-2">
            {navigation.map(item => (
              <Link key={item.name} to={item.path}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] ${item.path === "/labels" ? "bg-white font-semibold text-[#5348C7] shadow-sm" : "text-gray-600 hover:bg-white hover:text-[#5348C7]"}`}>
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
          {/* Search Bar */}
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md mb-8 bg-white">
            <Search size={18} className="text-gray-400 mr-2" />
            <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search labels..." className="w-full text-sm outline-none" />
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-[20px] font-bold uppercase tracking-wider text-gray-800">Labels</h1>
            <button onClick={openCreateModal} className="text-[#5348C7] font-semibold text-sm hover:underline">+ Create Label</button>
          </div>

          {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="space-y-4 max-w-2xl">
            {loading ? (
              <p className="text-sm text-gray-500">Loading labels...</p>
            ) : visibleLabels.length === 0 ? (
              <p className="text-gray-500 text-sm">{search ? "No matching labels." : "No labels yet."}</p>
            ) : (
              visibleLabels.map(label => (
                <div key={label.id} className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="flex items-center gap-2 text-[14px] font-medium text-gray-700">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />
                    {label.name}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEditModal(label)} aria-label={`Edit ${label.name}`} className="text-gray-400 hover:text-[#5348C7]"><Pencil size={16} /></button>
                    <button type="button" onClick={() => handleDeleteLabel(label)} aria-label={`Delete ${label.name}`} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editingLabel ? "Edit Label" : "Create Label"}</h2>
            <form onSubmit={handleSaveLabel}>
              {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
              <input autoFocus required maxLength={60} type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label Name" className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-[#5348C7] rounded disabled:opacity-50">{saving ? "Saving..." : editingLabel ? "Save" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}