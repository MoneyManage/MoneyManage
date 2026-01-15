
import React, { useState, useCallback } from 'react';
import { ArrowLeft, Plus, Target, X, Check, Plane, Home, Smartphone, Car, Gift, Heart, Star, Circle, MoreHorizontal, Trophy, TrendingUp, Bell, AlertCircle, Clock, Calendar, Edit2, Delete, ChevronRight, Coins, Flag, Layout, Keyboard, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';
import { SavingsGoal } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CalendarPicker } from './CalendarPicker';

interface SavingsGoalsViewProps {
    onBack: () => void;
    goals: SavingsGoal[];
    onAdd: (goal: SavingsGoal) => void;
    onUpdate: (goal: SavingsGoal) => void;
    onDelete: (id: string) => void;
}

const GOAL_ICONS = [
    { id: 'Target', icon: Target },
    { id: 'Plane', icon: Plane },
    { id: 'Home', icon: Home },
    { id: 'Smartphone', icon: Smartphone },
    { id: 'Car', icon: Car },
    { id: 'Gift', icon: Gift },
    { id: 'Trophy', icon: Trophy },
    { id: 'Coins', icon: Coins }
];

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({ onBack, goals, onAdd, onUpdate, onDelete }) => {
    const { formatCurrency } = useLanguage();
    const [viewMode, setViewMode] = useState<'list' | 'add' | 'deposit'>('list');
    const [activeGoal, setActiveGoal] = useState<SavingsGoal | null>(null);
    const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
    const [amount, setAmount] = useState('0'); 
    const [targetAmount, setTargetAmount] = useState('0'); 
    const [name, setName] = useState('');
    const [deadline, setDeadline] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Target');
    const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
    const [activeField, setActiveField] = useState<'amount' | 'target'>('amount');
    const [showKeypad, setShowKeypad] = useState(false);

    const calculateResult = useCallback((val: string): number => {
        try {
            const sanitized = val.replace(/[^-+*/.0-9]/g, '');
            if (!sanitized) return 0;
            return Number(new Function('return ' + sanitized)()) || 0;
        } catch (e) { return 0; }
    }, []);

    const handleSaveNewGoal = () => {
        const target = calculateResult(targetAmount);
        const initial = calculateResult(amount);
        if (!name.trim() || target <= 0) return;

        const newGoal: SavingsGoal = {
            id: Date.now().toString(),
            name: name,
            targetAmount: target,
            currentAmount: initial,
            color: 'bg-emerald-500',
            icon: selectedIcon,
            deadline: deadline || undefined,
            status: initial >= target ? 'completed' : 'active'
        };

        onAdd(newGoal);
        setViewMode('list');
        resetFields();
    };

    const handleDeposit = () => {
        if(!activeGoal) return;
        const depAmt = calculateResult(amount);
        if (depAmt <= 0) return;
        onUpdate({ 
            ...activeGoal, 
            currentAmount: activeGoal.currentAmount + depAmt, 
            status: (activeGoal.currentAmount + depAmt) >= activeGoal.targetAmount ? 'completed' : 'active' 
        });
        setViewMode('list'); 
        resetFields();
    };

    const confirmDelete = () => {
        if (goalToDelete) {
            onDelete(goalToDelete.id);
            setGoalToDelete(null);
        }
    };

    const resetFields = () => {
        setAmount('0');
        setTargetAmount('0');
        setName('');
        setDeadline('');
        setSelectedIcon('Target');
        setActiveGoal(null);
        setShowKeypad(false);
    };

    const handleNumPress = (num: string) => {
        const setter = activeField === 'amount' ? setAmount : setTargetAmount;
        setter(prev => (prev === '0' && !['+', '-', '.', '*', '/'].includes(num)) ? num : prev + num);
    };

    const renderKeypad = () => (
        <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 transform ${showKeypad ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${activeField === 'target' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Đang nhập {activeField === 'target' ? 'Số tiền cần có' : 'Số vốn hiện có'}
                    </span>
                </div>
                <button 
                    onClick={() => setShowKeypad(false)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                    <Check className="w-3.5 h-3.5" />
                    Xong
                </button>
            </div>
            <div className="p-2 grid grid-cols-4 gap-1.5 bg-white">
                {[7, 8, 9, '/'].map(n => <button key={n} onClick={() => handleNumPress(n.toString())} className="py-4 bg-slate-50 rounded-2xl text-lg font-black text-slate-800 active:bg-slate-200 transition-colors">{n}</button>)}
                {[4, 5, 6, '*'].map(n => <button key={n} onClick={() => handleNumPress(n.toString())} className="py-4 bg-slate-50 rounded-2xl text-lg font-black text-slate-800 active:bg-slate-200 transition-colors">{n}</button>)}
                {[1, 2, 3, '-'].map(n => <button key={n} onClick={() => handleNumPress(n.toString())} className="py-4 bg-slate-50 rounded-2xl text-lg font-black text-slate-800 active:bg-slate-200 transition-colors">{n}</button>)}
                {[0, '.', '+'].map(n => <button key={n} onClick={() => handleNumPress(n.toString())} className="py-4 bg-slate-50 rounded-2xl text-lg font-black text-slate-800 active:bg-slate-200 transition-colors">{n}</button>)}
                <button 
                    onClick={() => {
                        const setter = activeField === 'amount' ? setAmount : setTargetAmount;
                        setter(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
                    }} 
                    className="col-span-4 py-3 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:bg-rose-100 transition-colors"
                >
                    Xóa số
                </button>
            </div>
            <div className="h-safe-area bg-white"></div>
        </div>
    );

    if (viewMode === 'deposit') {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col h-full animate-in slide-in-from-bottom duration-300">
                <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-50">
                    <button onClick={() => setViewMode('list')} className="p-2"><X className="w-6 h-6 text-gray-800" /></button>
                    <div className="text-center">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Nạp tiết kiệm</h2>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{activeGoal?.name}</span>
                    </div>
                    <div className="w-10"></div>
                </div>
                
                <div className="flex-1 p-6 space-y-6 flex flex-col">
                    <div 
                        onClick={() => { setActiveField('amount'); setShowKeypad(true); }}
                        className={`w-full p-8 rounded-[2.5rem] text-center min-h-[160px] flex flex-col justify-center border-2 transition-all cursor-pointer ${showKeypad ? 'bg-emerald-50 border-emerald-200 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}
                    >
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 block">Số tiền nạp Elite</span>
                        <div className="text-xs font-bold text-slate-300 mb-1 break-words leading-tight">{amount}</div>
                        <div className="text-5xl font-black text-emerald-600 flex items-center justify-center gap-2 flex-wrap tracking-tighter">
                            <span className="text-emerald-300">=</span>
                            {calculateResult(amount).toLocaleString('vi-VN')}
                            <span className="text-sm">đ</span>
                        </div>
                    </div>

                    <div className="flex-1"></div>

                    <button 
                        onClick={handleDeposit} 
                        disabled={calculateResult(amount) <= 0} 
                        className="w-full py-6 bg-emerald-600 rounded-[2rem] font-black text-white text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 disabled:opacity-20 active:scale-[0.98] transition-all mb-4"
                    >
                        Xác nhận tích lũy
                    </button>
                </div>
                {renderKeypad()}
            </div>
        )
    }

    if (viewMode === 'add') {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col h-full animate-in slide-in-from-bottom duration-300">
                <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20">
                    <button onClick={() => setViewMode('list')} className="p-2"><X className="w-6 h-6 text-gray-800" /></button>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Mục tiêu mới</h2>
                    <button onClick={handleSaveNewGoal} className="px-4 py-2 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-90 transition-all">Lưu</button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-32">
                    <div className="bg-white">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">1. Tên mục tiêu</label>
                        <input 
                            className="w-full text-2xl font-black text-slate-900 border-b-2 border-slate-100 focus:border-emerald-500 outline-none pb-3 transition-all placeholder:text-slate-200 bg-transparent"
                            placeholder="Mua iPhone, Đổi xe..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div 
                            onClick={() => { setActiveField('target'); setShowKeypad(true); }}
                            className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${activeField === 'target' && showKeypad ? 'bg-indigo-50 border-indigo-200 shadow-inner scale-[1.02]' : 'bg-white border-slate-100 shadow-sm'}`}
                        >
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cần tích lũy</label>
                            <div className="text-xl font-black text-slate-900 truncate">{calculateResult(targetAmount).toLocaleString('vi-VN')}đ</div>
                            <div className="mt-2 text-[8px] font-bold text-indigo-400 uppercase">Chạm để nhập</div>
                        </div>
                        <div 
                            onClick={() => { setActiveField('amount'); setShowKeypad(true); }}
                            className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${activeField === 'amount' && showKeypad ? 'bg-emerald-50 border-emerald-200 shadow-inner scale-[1.02]' : 'bg-white border-slate-100 shadow-sm'}`}
                        >
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Vốn hiện có</label>
                            <div className="text-xl font-black text-slate-900 truncate">{calculateResult(amount).toLocaleString('vi-VN')}đ</div>
                            <div className="mt-2 text-[8px] font-bold text-emerald-400 uppercase">Chạm để nhập</div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">2. Biểu tượng</label>
                        <div className="grid grid-cols-4 gap-4">
                            {GOAL_ICONS.map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => setSelectedIcon(item.id)}
                                    className={`w-full aspect-square rounded-2xl flex items-center justify-center border-2 transition-all ${selectedIcon === item.id ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl scale-110' : 'bg-white border-slate-50 text-slate-300 hover:border-slate-200'}`}
                                >
                                    <item.icon className="w-6 h-6" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div onClick={() => { setShowDeadlinePicker(true); setShowKeypad(false); }}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">3. Hạn chót (Tùy chọn)</label>
                        <div className="p-5 bg-slate-50 rounded-[1.5rem] flex items-center justify-between text-slate-600 font-black text-xs border border-slate-100 active:bg-slate-100 transition-colors">
                            <span className="uppercase tracking-widest">{deadline ? new Date(deadline).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Chưa thiết lập ngày"}</span>
                            <Calendar className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </div>

                {showKeypad && renderKeypad()}

                {showDeadlinePicker && (
                    <CalendarPicker 
                        selectedDate={deadline ? new Date(deadline) : new Date()}
                        onSelect={(d) => setDeadline(d.toISOString().split('T')[0])}
                        onClose={() => setShowDeadlinePicker(false)}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-safe-area flex flex-col">
             <div className="bg-white px-4 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-gray-50">
                <div className="flex items-center space-x-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-2xl transition-colors"><ArrowLeft className="w-6 h-6 text-slate-800" /></button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">Mục tiêu tích lũy</h1>
                        <p className="text-[9px] font-black text-green-500 uppercase tracking-[0.2em]">Elite Savings</p>
                    </div>
                </div>
                <button 
                    onClick={() => { setViewMode('add'); resetFields(); }} 
                    className="w-11 h-11 bg-emerald-600 rounded-2xl text-white shadow-xl flex items-center justify-center active:scale-90 transition-all"
                >
                    <Plus className="w-7 h-7" />
                </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto no-scrollbar pb-24">
                {goals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6">
                            <Target className="w-12 h-12 opacity-20" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Chưa có kế hoạch nào</p>
                        <button 
                            onClick={() => { setViewMode('add'); resetFields(); }}
                            className="mt-8 px-10 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 active:scale-95 transition-all"
                        >
                            Thiết lập Elite Goal
                        </button>
                    </div>
                ) : (
                    goals.map(goal => {
                        const Icon = GOAL_ICONS.find(i => i.id === goal.icon)?.icon || Target;
                        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        const isCompleted = progress >= 100;

                        return (
                            <div key={goal.id} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-50 relative overflow-hidden group">
                                {isCompleted && (
                                    <div className="absolute top-4 right-4 bg-amber-500 text-white p-1.5 rounded-full shadow-lg z-10 animate-bounce">
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-start mb-7">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-active:scale-105 ${isCompleted ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none mb-1.5">{goal.name}</h3>
                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md ${isCompleted ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {isCompleted ? 'Hoàn tất' : 'Tích lũy'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <button 
                                            onClick={() => { setActiveGoal(goal); setAmount('0'); setViewMode('deposit'); setShowKeypad(true); }} 
                                            disabled={isCompleted}
                                            className={`py-3.5 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all ${isCompleted ? 'bg-slate-50 text-slate-300' : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}
                                        >
                                            Nạp +
                                        </button>
                                        <button 
                                            onClick={() => setGoalToDelete(goal)} 
                                            className="mt-4 text-[8px] font-black text-rose-500/40 uppercase tracking-widest hover:text-rose-500 transition-colors active:scale-95"
                                        >
                                            Gỡ bỏ
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-5 flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Đã có</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(goal.currentAmount)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mục tiêu</span>
                                        <span className="text-sm font-black text-slate-500">{formatCurrency(goal.targetAmount)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5 shadow-inner">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 relative shadow-sm ${isCompleted ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`} 
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">Tiến độ Elite</span>
                                        <span className={isCompleted ? 'text-amber-500' : 'text-emerald-500'}>{Math.round(progress)}%</span>
                                    </div>
                                </div>

                                {goal.deadline && !isCompleted && (
                                    <div className="mt-7 pt-4 border-t border-dashed border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Thời gian còn lại</span>
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} ngày</span>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {goalToDelete && (
                <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <div className="bg-rose-600 p-8 flex flex-col items-center text-white">
                            <AlertTriangle className="w-12 h-12 mb-4" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Xóa mục tiêu?</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <p className="text-center font-bold text-gray-600">
                                Bạn có chắc chắn muốn xóa kế hoạch <span className="text-slate-900 font-black">"{goalToDelete.name}"</span> không? Dữ liệu tích lũy sẽ không thể khôi phục.
                            </p>
                            <div className="space-y-3 pt-4">
                                <button 
                                    onClick={confirmDelete} 
                                    className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl active:scale-95 transition-transform"
                                >
                                    Xác nhận gỡ bỏ
                                </button>
                                <button 
                                    onClick={() => setGoalToDelete(null)} 
                                    className="w-full py-5 bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl active:bg-slate-100 transition-colors"
                                >
                                    Quay lại
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
