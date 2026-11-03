import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[574px] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 font-['Poppins']">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[85vh]">
          {children}
        </div>

      </div>
    </div>
  );
}