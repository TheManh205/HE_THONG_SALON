import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle = ({ className = '', size = 'md', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-label="Đổi giao diện sáng tối"
      className={`relative inline-flex items-center gap-2 rounded-full border transition-all duration-300 focus:outline-none active:scale-95 ${
        isDark
          ? 'bg-slate-800/90 border-slate-700 text-amber-400 hover:bg-slate-700 hover:border-amber-400/60 hover:shadow-glow-gold'
          : 'bg-white border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400 shadow-sm'
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <div className="relative w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 transition-all duration-300 transform ${
            isDark ? 'rotate-90 scale-0 opacity-0 absolute' : 'rotate-0 scale-100 opacity-100 text-amber-500'
          }`}
        />
        <Moon
          className={`w-4 h-4 transition-all duration-300 transform ${
            isDark ? 'rotate-0 scale-100 opacity-100 text-amber-400' : '-rotate-90 scale-0 opacity-0 absolute'
          }`}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-bold uppercase tracking-wider pr-1">
          {isDark ? 'Tối' : 'Sáng'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
