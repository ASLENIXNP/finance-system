import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  NEPALI_MONTHS,
  NEPALI_DAYS,
  toBsDateString,
  formatNepaliDate,
  getDaysInNepaliMonth,
  getFirstDayOfNepaliMonth,
  getTodayBsDate,
  parseToNepaliDate
} from '../lib/nepaliDate';

interface NepaliDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const NepaliDatePicker: React.FC<NepaliDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select Nepali Date (BS)',
  required = false,
  disabled = false,
  className = '',
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize initial value to BS
  const normalizedValue = useMemo(() => {
    return value ? toBsDateString(value) : '';
  }, [value]);

  // Active view state for the calendar picker
  const [viewYear, setViewYear] = useState<number>(() => {
    const nd = parseToNepaliDate(value || new Date());
    return nd.getBS().year;
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    const nd = parseToNepaliDate(value || new Date());
    return nd.getBS().month; // 0 to 11
  });

  // Sync view when value changes from outside
  useEffect(() => {
    if (value) {
      const nd = parseToNepaliDate(value);
      const bs = nd.getBS();
      setViewYear(bs.year);
      setViewMonth(bs.month);
    }
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const todayBs = useMemo(() => getTodayBsDate(), []);
  const todayParts = useMemo(() => {
    const [y, m, d] = todayBs.split('-').map(Number);
    return { year: y, month: m - 1, day: d };
  }, [todayBs]);

  const selectedParts = useMemo(() => {
    if (!normalizedValue) return null;
    const [y, m, d] = normalizedValue.split('-').map(Number);
    return { year: y, month: m - 1, day: d };
  }, [normalizedValue]);

  // Number of days in the current view month
  const daysInMonth = useMemo(() => {
    return getDaysInNepaliMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  // First day of week index (0 = Sunday ... 6 = Saturday)
  const firstDayOfWeek = useMemo(() => {
    return getFirstDayOfNepaliMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  // Navigate months
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Select day
  const handleSelectDay = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const newBs = `${viewYear}-${mStr}-${dStr}`;
    onChange(newBs);
    setIsOpen(false);
  };

  // Select Today
  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(todayBs);
    setViewYear(todayParts.year);
    setViewMonth(todayParts.month);
    setIsOpen(false);
  };

  // Generate Year options (from 2070 to 2090 BS)
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 2070; y <= 2090; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Display text in the input
  const displayFormatted = useMemo(() => {
    if (!normalizedValue) return '';
    return formatNepaliDate(normalizedValue, 'full');
  }, [normalizedValue]);

  // Pure Devanagari BS date representation
  const devanagariEquivalent = useMemo(() => {
    if (!normalizedValue) return '';
    return formatNepaliDate(normalizedValue, 'devanagari');
  }, [normalizedValue]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>{label} {required && <span className="text-red-500">*</span>}</span>
          <span className="text-[10px] font-semibold text-accent uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
            वि.सं. (BS)
          </span>
        </label>
      )}

      {/* Main Trigger Input */}
      <div
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all cursor-pointer shadow-sm select-none ${
          disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent'
        } ${isOpen ? 'ring-2 ring-accent/20 border-accent' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon size={16} className={normalizedValue ? 'text-accent' : 'text-slate-400'} />
          {normalizedValue ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-slate-800">{displayFormatted} BS</span>
              <span className="font-mono text-xs text-slate-400">({normalizedValue})</span>
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        {devanagariEquivalent && (
          <span className="text-xs text-slate-600 font-medium hidden sm:inline-block ml-2 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
            {devanagariEquivalent}
          </span>
        )}
      </div>

      {/* Calendar Dropdown Modal / Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-76 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150 right-0 sm:left-0">
          {/* Calendar Header: Month & Year Selector + Prev/Next buttons */}
          <div className="flex items-center justify-between gap-1.5 mb-3 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-accent cursor-pointer"
              >
                {NEPALI_MONTHS.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.name} ({m.nepaliName})
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-accent cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y} BS
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {NEPALI_DAYS.map((d, i) => (
              <div key={d.name} className={`text-[10px] font-bold uppercase py-1 ${i === 6 ? 'text-red-500' : 'text-slate-400'}`}>
                <span>{d.englishShort}</span>
                <span className="block text-[9px] opacity-75 font-normal">{d.nepali}</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots before the first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8 w-8" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = selectedParts && 
                selectedParts.year === viewYear && 
                selectedParts.month === viewMonth && 
                selectedParts.day === day;

              const isToday = todayParts.year === viewYear && 
                todayParts.month === viewMonth && 
                todayParts.day === day;

              const dayOfWeek = (firstDayOfWeek + idx) % 7;
              const isSaturday = dayOfWeek === 6;

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-white shadow-sm font-bold scale-105'
                      : isToday
                      ? 'bg-accent/10 text-accent border border-accent/40 font-bold'
                      : isSaturday
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Controls: Today & Quick selection */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/10 rounded-md transition-colors cursor-pointer"
            >
              Today (आज): {todayBs}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
