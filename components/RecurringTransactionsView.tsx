import React, { useState } from 'react';
import { ArrowLeft, Plus, Calendar, Repeat, Trash2, Clock, X, Check, Box } from 'lucide-react';
import { RecurringTransaction, RecurrenceFrequency, TransactionType, AllCategories } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CalendarPicker } from './CalendarPicker';

interface RecurringTransactionsViewProps {
    onBack: () => void;
    recurringTransactions: RecurringTransaction[];
    categories: AllCategories;
    onAdd: (item: RecurringTransaction) => void;
    onDelete: (id: string) => void;
}

export const RecurringTransactionsView: React.FC<RecurringTransactionsViewProps> = ({ 
    onBack, 
    recurringTransactions, 
    categories, 
    onAdd, 
    onDelete 
}) => {
    const { formatCurrency } = useLanguage();
    const [isAdding, setIsAdding] = useState(false);
    
    // Form State
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>('expense');
    const [selectedCatId, setSelectedCatId] = useState('');
    const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);

    const currentCategoryList = type === 'expense' ? categories.expense : (type === 'income' ? categories.income : categories.debt);

    const handleSave = () => {
        if (!amount || Number(amount) <= 0 || !selectedCatId) return;

        const newRecur: RecurringTransaction = {
            id: Date.now().toString(),
            amount: Number(amount),
            categoryId: selectedCatId,
            type,
            frequency,
            startDate,
            nextDueDate: startDate, // Initially same as start
            walletId: 'cash', // Changed default to 'cash'
            note,
        };

        onAdd(newRecur);
        
        // Reset
        setIsAdding(false);
        setAmount('');
        setSelectedCatId('');
        setNote('');
    };

    const getFrequencyLabel = (f: RecurrenceFrequency) => {
        switch(f) {
            case 'daily': return 'Hàng ngày';
            case 'weekly': return 'Hàng tuần';
            case 'monthly': return 'Hàng tháng';
            case 'yearly': return 'Hàng năm';
        }
    };

    if (isAdding) {
        return (
            <div className="bg-white min-h-screen flex flex-col z-50 absolute inset-0">
                <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-gray-100">
                     <button onClick={() => setIsAdding(false)}>
                         <X className="w-6 h-6 text-gray-800" />
                     </button>
                     <h1 className="text-xl font-bold text-gray-900">Thêm định kỳ</h1>
                     <button onClick={handleSave} className="text-green-600 font-bold">Lưu</button>
                </div>
                
                <div className="p-4 space-y-6">
                    {/* Amount */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Số tiền</label>
                        <input 
                            type="number" 
                            className="w-full text-3xl font-bold text-green-500 border-b border-gray-200 py-2 outline-none"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Type Selector */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => { setType('expense'); setSelectedCatId(''); }} 
                            className={`flex-1 py-2 text-sm font-bold rounded-md ${type === 'expense' ? 'bg-white shadow-sm text-red-500' : 'text-gray-500'}`}
                        >
                            Chi phí
                        </button>
                        <button 
                            onClick={() => { setType('income'); setSelectedCatId(''); }} 
                            className={`flex-1 py-2 text-sm font-bold rounded-md ${type === 'income' ? 'bg-white shadow-sm text-green-500' : 'text-gray-500'}`}
                        >
                            Thu nhập
                        </button>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Danh mục</label>
                        <select 
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                            value={selectedCatId}
                            onChange={(e) => setSelectedCatId(e.target.value)}
                        >
                            <option value="">Chọn danh mục</option>
                            {currentCategoryList.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Chu kỳ lặp lại</label>
                        <select 
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                        >
                            <option value="daily">Hàng ngày</option>
                            <option value="weekly">Hàng tuần</option>
                            <option value="monthly">Hàng tháng</option>
                            <option value="yearly">Hàng năm</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Ngày bắt đầu</label>
                        <button 
                            onClick={() => setShowCalendar(true)}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-left text-gray-800 flex items-center justify-between"
                        >
                            <span>{new Date(startDate).toLocaleDateString('vi-VN')}</span>
                            <Calendar className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Ghi chú</label>
                        <input 
                            type="text"
                            placeholder="Nhập ghi chú..."
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>
                
                {showCalendar && (
                    <CalendarPicker 
                        selectedDate={new Date(startDate)}
                        onSelect={(d) => setStartDate(d.toISOString().split('T')[0])}
                        onClose={() => setShowCalendar(false)}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-safe-area flex flex-col">
            <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack}>
                        <ArrowLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Giao dịch định kỳ</h1>
                </div>
                <button onClick={() => setIsAdding(true)}>
                    <Plus className="w-6 h-6 text-gray-800" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {recurringTransactions.length === 0 && (
                    <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
                        <Repeat className="w-16 h-16 mb-4 opacity-20" />
                        <p>Chưa có giao dịch định kỳ nào</p>
                    </div>
                )}

                {recurringTransactions.map(item => {
                    const list = item.type === 'expense' ? categories.expense : (item.type === 'income' ? categories.income : categories.debt);
                    const cat = list.find(c => c.id === item.categoryId) || { name: '?', color: 'bg-gray-200', icon: 'Box' };
                    
                    return (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cat.color.split(' ')[0]}`}>
                                     {/* Simplified icon rendering without re-importing map for brevity, usually you pass IconMap prop or import it */}
                                     <Box className={`w-6 h-6 ${cat.color.split(' ')[1]}`} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{cat.name}</h3>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        <span>{getFrequencyLabel(item.frequency)}</span>
                                        <span>•</span>
                                        <span>Tiếp: {new Date(item.nextDueDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    {item.note && <p className="text-xs text-gray-400 mt-1 italic">{item.note}</p>}
                                </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <span className={`font-bold ${item.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                                    {formatCurrency(item.amount)}
                                </span>
                                <button onClick={() => onDelete(item.id)} className="p-2 bg-gray-50 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};