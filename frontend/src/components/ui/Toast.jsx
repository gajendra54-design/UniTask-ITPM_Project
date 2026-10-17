import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const Toast = ({ message, type = "info", onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const closeTimer = useRef(null);
  const handleClose = useCallback(() => {
    setIsVisible(false);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer.current);
    };
  }, [duration, handleClose]);

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={18} />,
    error: <AlertCircle className="text-red-500" size={18} />,
    info: <Info className="text-indigo-500" size={18} />,
  };

  const backgrounds = {
    success: "bg-emerald-50 border-emerald-100",
    error: "bg-red-50 border-red-100",
    info: "bg-indigo-50 border-indigo-100",
  };

  return (
    <div
      className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-right-10 ${
        backgrounds[type]
      } ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="text-sm font-bold text-slate-700 tracking-tight">{message}</p>
      <button
        onClick={handleClose}
        className="ml-2 p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
