import { Link } from "react-router-dom";

export default function AppHeader() {
  return (
    <header className="flex h-[64px] items-center bg-white px-6 shadow-sm sm:px-[8.5%]">
      <Link to="/dashboard" className="text-[20px] font-bold" aria-label="Trieon Technosolution Habits Tracker home">
        <span className="bg-gradient-to-r from-[#5348C7] to-[#8B5CF6] bg-clip-text text-transparent">
          Trieon Technosolution
        </span>{" "}
        <span className="text-[#1C1C1C]">Habits Tracker</span>
      </Link>
    </header>
  );
}
