
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    const days = [];
    // Padding
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= lastDay; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const handlePrevMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
      return d1.getDate() === d2.getDate() && 
             d1.getMonth() === d2.getMonth() && 
             d1.getFullYear() === d2.getFullYear();
  };

  const isToday = (d: Date) => isSameDay(d, new Date());

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm p-4 animate-in zoom-in-95 duration-200 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Chọn ngày</h3>
                <button onClick={onClose} className="p-1 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500"/></button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-xl">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-white rounded-lg transition-colors"><ChevronLeft className="w-6 h-6 text-gray-600"/></button>
                <span className="font-bold text-gray-800">Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}</span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-white rounded-lg transition-colors"><ChevronRight className="w-6 h-6 text-gray-600"/></button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((date, idx) => {
                    if (!date) return <div key={idx} className="h-10"></div>;
                    
                    const selected = isSameDay(date, selectedDate);
                    const today = isToday(date);

                    return (
                        <button 
                            key={idx}
                            onClick={() => { onSelect(date); onClose(); }}
                            className={`h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all
                                ${selected ? 'bg-green-500 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}
                                ${today && !selected ? 'border border-green-500 text-green-600' : ''}
                            `}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
            
            <button 
                onClick={() => { onSelect(new Date()); onClose(); }}
                className="w-full mt-4 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 text-sm hover:bg-gray-200"
            >
                Hôm nay
            </button>
        </div>
    </div>
  );
};
