
import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2, X, Delete, BarChart3, TrendingDown, AlertTriangle, PieChart as PieIcon, ShieldCheck, LayoutGrid, Target, ArrowUpRight, Lightbulb, Edit2, AlertOctagon, ChevronRight } from 'lucide-react';
import { AllCategories, Transaction, Budget } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface BudgetViewProps {
    categories: AllCategories;
    transactions: Transaction[];
    budgets: Budget[];
    onAddBudget: (budget: Budget) => void;
    onDeleteBudget: (categoryId: string) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ categories, transactions, budgets, onAddBudget, onDeleteBudget }) => {
    const { formatCurrency } = useLanguage();
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCatId, setSelectedCatId] = useState('');
    const [amount, setAmount] = useState('0');

    const calculateAmount = useCallback((): number => {
        try {
            const sanitized = amount.replace(/[^-+*/.0-9]/g, '');
            if (!sanitized) return 0;
            return Number(new Function('return ' + sanitized)()) || 0;
        } catch (e) { return 0; }
    }, [amount]);

    const handleSaveBudget = () => {
        const finalVal = calculateAmount();
        if (!selectedCatId || finalVal <= 0) return;
        onAddBudget({ categoryId: selectedCatId, limit: finalVal });
        setIsAdding(false);
        setAmount('0');
    };

    const handleNumPress = (num: string) => {
        setAmount(prev => (prev === '0' && !['+', '-', '.', '*', '/'].includes(num)) ? num : prev + num);
    };

    const now = new Date();
    const budgetStatus = useMemo(() => {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const currentMonthExpenses = transactions.filter(t => {
            const d = new Date(t.date);
            return t.type === 'expense' && d >= start && d <= end;
        });
        return budgets.map(b => {
            const spent = currentMonthExpenses.filter(t => t.categoryId === b.categoryId).reduce((sum, t) => sum + t.amount, 0);
            const category = categories.expense.find(c => c.id === b.categoryId) || { name: '?', color: 'bg-gray-100', icon: 'Box' };
            const percent = (spent / b.limit) * 100;
            return { ...b, spent, percent, category, remaining: b.limit - spent };
        });
    }, [budgets, transactions, categories]);

    return (
        <div className="h-full overflow-y-auto pb-24 bg-slate-50 no-scrollbar">
            <div className="bg-white/90 backdrop-blur-xl px-5 py-4 sticky top-0 z-30 flex justify-between items-center border-b border-gray-100">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">Ngân sách</h1>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">Tháng {now.getMonth() + 1}</span>
                </div>
                <button onClick={() => { setIsAdding(true); setIsEditing(false); setAmount('0'); setSelectedCatId(''); }} className="w-10 h-10 bg-emerald-500 rounded-2xl text-white shadow-lg flex items-center justify-center"><Plus className="w-6 h-6"/></button>
            </div>

            <div className="p-5 space-y-4">
                {budgetStatus.map(item => (
                    <div key={item.categoryId} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-black text-gray-900">{item.category.name}</span>
                            <div className="flex gap-2">
                                <button onClick={() => { setAmount(item.limit.toString()); setSelectedCatId(item.categoryId); setIsAdding(true); setIsEditing(true); }} className="p-2 text-indigo-500"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => onDeleteBudget(item.categoryId)} className="p-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            <span>Chi tiêu: {formatCurrency(item.spent)}</span>
                            <span>Hạn mức: {formatCurrency(item.limit)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${item.percent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(item.percent, 100)}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-end justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-[3rem] p-6 animate-in slide-in-from-bottom duration-400 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">{isEditing ? 'Sửa' : 'Mới'}</h2>
                            <button onClick={() => setIsAdding(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                            <select className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-gray-700 outline-none" value={selectedCatId} onChange={e => setSelectedCatId(e.target.value)} disabled={isEditing}>
                                <option value="">-- Chọn danh mục --</option>
                                {categories.expense.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <div className="text-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-inner min-h-[100px] flex flex-col justify-center">
                                <div className="text-[11px] font-bold text-emerald-700/60 mb-1 break-words leading-tight">
                                    {amount}
                                </div>
                                <div className="text-2xl font-black text-emerald-900 tracking-tighter flex items-center justify-center gap-2 flex-wrap">
                                    <span className="text-emerald-500">=</span>
                                    {calculateAmount().toLocaleString('vi-VN')}
                                    <span className="text-xs opacity-40">đ</span>
                                </div>
                            </div>
                        </div>

                        {/* Optimized Compact Keyboard */}
                        <div className="grid grid-cols-4 gap-1 mb-4 p-1.5 bg-emerald-50/50 rounded-2xl">
                             {[7, 8, 9, '/'].map(n => <button key={n} onClick={() => handleNumPress(n.toString())} className="py-1 bg-white rounded-lg text-sm font-black text-gray-800 shadow-sm">{n}</button>)}
                             {[4, 5, 6, '*'].map(n => <button key={n} onClick={() => handleNumPress(n.toString())} className="py-1 bg-white rounded-lg text-sm font-black text-gray-800 shadow-sm">{n}</button>)}
                             {[1, 2, 3, '-'].map(n => <button key={n} onClick={() => handleNumPress(n.toString())} className="py-1 bg-white rounded-lg text-sm font-black text-gray-800 shadow-sm">{n}</button>)}
                             {[0, '.', '+'].map(n => <button key={n} onClick={() => handleNumPress(n.toString())} className="py-1 bg-white rounded-lg text-sm font-black text-gray-800 shadow-sm">{n}</button>)}
                             <button onClick={() => setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0')} className="col-span-4 py-1 bg-white rounded-lg text-rose-500 flex items-center justify-center"><Delete className="w-4 h-4"/></button>
                        </div>

                        <button onClick={handleSaveBudget} className="w-full py-4 bg-emerald-600 text-white font-black uppercase text-[9px] tracking-widest rounded-xl shadow-lg active:scale-95 transition-all">
                            Xác nhận Elite
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
