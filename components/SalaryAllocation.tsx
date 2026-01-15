
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Check, PieChart, Info, ChevronRight, Layers, Target, Heart, GraduationCap, Zap, Wallet, Delete, Edit3, AlertCircle } from 'lucide-react';
import { AllCategories, Budget } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SalaryAllocationProps {
    onClose: () => void;
    categories: AllCategories;
    onApplyBudgets: (newBudgets: Budget[]) => void;
    initialAmount?: string;
}

type RuleId = '6jars' | '503020' | '7030' | 'custom';

interface Bucket {
    name: string;
    percent: number;
    icon: any;
    color: string;
    defaultCat: string;
}

interface AllocationRule {
    id: RuleId;
    name: string;
    description: string;
    buckets: Bucket[];
}

export const SalaryAllocation: React.FC<SalaryAllocationProps> = ({ onClose, categories, onApplyBudgets, initialAmount = '0' }) => {
    const { formatCurrency } = useLanguage();
    const [amount, setAmount] = useState(initialAmount);
    const [selectedRuleId, setSelectedRuleId] = useState<RuleId>('503020');
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [customBuckets, setCustomBuckets] = useState<Bucket[]>([]);

    const rules: AllocationRule[] = [
        {
            id: '503020',
            name: '50-30-20',
            description: 'Nhu cầu (50%), Mong muốn (30%), Tiết kiệm (20%).',
            buckets: [
                { name: 'Nhu cầu thiết yếu', percent: 50, icon: Zap, color: 'bg-emerald-500', defaultCat: 'bills' },
                { name: 'Sở thích cá nhân', percent: 30, icon: Heart, color: 'bg-rose-500', defaultCat: 'shopping' },
                { name: 'Tiết kiệm & Trả nợ', percent: 20, icon: Target, color: 'bg-indigo-500', defaultCat: 'investment_exp' },
            ]
        },
        {
            id: '6jars',
            name: '6 Chiếc lọ',
            description: 'Tự do tài chính với 6 quỹ riêng biệt.',
            buckets: [
                { name: 'Thiết yếu', percent: 55, icon: Zap, color: 'bg-emerald-500', defaultCat: 'food' },
                { name: 'Giáo dục', percent: 10, icon: GraduationCap, color: 'bg-indigo-500', defaultCat: 'education' },
                { name: 'Tiết kiệm dài hạn', percent: 10, icon: Target, color: 'bg-blue-500', defaultCat: 'investment_exp' },
                { name: 'Hưởng thụ', percent: 10, icon: Heart, color: 'bg-rose-500', defaultCat: 'entertainment' },
                { name: 'Tự do tài chính', percent: 10, icon: Wallet, color: 'bg-amber-500', defaultCat: 'investment_exp' },
                { name: 'Từ thiện', percent: 5, icon: Heart, color: 'bg-teal-500', defaultCat: 'gifts' },
            ]
        },
        {
            id: '7030',
            name: '70-30',
            description: 'Sống (70%) và Tích lũy (30%).',
            buckets: [
                { name: 'Chi phí sinh hoạt', percent: 70, icon: Zap, color: 'bg-emerald-500', defaultCat: 'food' },
                { name: 'Tích lũy & Đầu tư', percent: 30, icon: Target, color: 'bg-indigo-500', defaultCat: 'investment_exp' },
            ]
        },
        {
            id: 'custom',
            name: 'Tùy chỉnh',
            description: 'Tự thiết lập tỉ lệ phần trăm của riêng bạn.',
            buckets: customBuckets.length > 0 ? customBuckets : [
                { name: 'Quỹ 1', percent: 40, icon: Layers, color: 'bg-slate-700', defaultCat: 'food' },
                { name: 'Quỹ 2', percent: 30, icon: Layers, color: 'bg-slate-600', defaultCat: 'shopping' },
                { name: 'Quỹ 3', percent: 30, icon: Layers, color: 'bg-slate-500', defaultCat: 'investment_exp' },
            ]
        }
    ];

    useEffect(() => {
        if (initialAmount !== '0') setAmount(initialAmount);
        // Khởi tạo custom buckets dựa trên rule 50/30/20 nếu chưa có
        if (customBuckets.length === 0) {
            setCustomBuckets(rules[0].buckets.map(b => ({...b, icon: Edit3})));
        }
    }, [initialAmount]);

    const currentRule = rules.find(r => r.id === selectedRuleId)!;

    const totalPercent = useMemo(() => {
        return currentRule.buckets.reduce((sum, b) => sum + b.percent, 0);
    }, [currentRule]);

    const calculateAmount = useCallback((): number => {
        try {
            const sanitized = amount.replace(/[^-+*/.0-9]/g, '');
            if (!sanitized) return 0;
            return Number(new Function('return ' + sanitized)()) || 0;
        } catch (e) { return 0; }
    }, [amount]);

    const handleApply = () => {
        if (totalPercent !== 100) {
            alert("Tổng tỉ lệ phải bằng 100% để thực hiện phân bổ.");
            return;
        }
        const total = calculateAmount();
        if (total <= 0) return;
        const newBudgets: Budget[] = currentRule.buckets.map(bucket => {
            const catId = mappings[bucket.name] || bucket.defaultCat;
            return { categoryId: catId, limit: (total * bucket.percent) / 100 };
        });
        onApplyBudgets(newBudgets);
        onClose();
    };

    const handleUpdateCustomPercent = (index: number, value: string) => {
        const num = parseInt(value) || 0;
        setCustomBuckets(prev => {
            const next = [...prev];
            next[index] = { ...next[index], percent: num };
            return next;
        });
    };

    const handleNumPress = (num: string) => {
        setAmount(prev => (prev === '0' && !['+', '-', '.', '*', '/'].includes(num)) ? num : prev + num);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col h-full overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-20">
                <button onClick={onClose}><X className="w-6 h-6 text-gray-800" /></button>
                <div className="flex flex-col items-center">
                    <span className="font-black text-lg uppercase tracking-tight">Phân bổ Elite</span>
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Financial Strategy</span>
                </div>
                <button onClick={onClose} className="text-xs font-black text-gray-400 uppercase tracking-widest">Bỏ qua</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-slate-50">
                {/* Amount Display */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 text-center flex flex-col justify-center min-h-[120px]">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Số tiền phân bổ</label>
                    <div className="text-4xl font-black text-indigo-600 tracking-tighter flex items-center justify-center gap-2 flex-wrap">
                        {calculateAmount().toLocaleString('en-US')}
                        <span className="text-sm opacity-40">đ</span>
                    </div>
                </div>

                {/* Rule Selector */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chọn phương án</label>
                        {totalPercent !== 100 && (
                            <span className="text-[10px] font-black text-rose-500 uppercase flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" /> Tổng: {totalPercent}%
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                        {rules.map(rule => (
                            <button 
                                key={rule.id} 
                                onClick={() => setSelectedRuleId(rule.id)} 
                                className={`shrink-0 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${selectedRuleId === rule.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-400'}`}
                            >
                                {rule.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bucket List */}
                <div className="space-y-3 pb-40">
                    {currentRule.buckets.map((bucket, idx) => {
                        const bucketVal = (calculateAmount() * bucket.percent) / 100;
                        const isCustom = selectedRuleId === 'custom';
                        
                        return (
                            <div key={bucket.name} className={`bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all ${isCustom ? 'ring-2 ring-indigo-50' : ''}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl ${bucket.color} flex items-center justify-center text-white`}>
                                            <bucket.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            {isCustom ? (
                                                <input 
                                                    className="font-black text-gray-900 text-sm leading-none bg-transparent border-b border-gray-100 outline-none focus:border-indigo-400 w-24"
                                                    value={bucket.name}
                                                    onChange={(e) => {
                                                        const newName = e.target.value;
                                                        setCustomBuckets(prev => {
                                                            const n = [...prev];
                                                            n[idx] = {...n[idx], name: newName};
                                                            return n;
                                                        });
                                                    }}
                                                />
                                            ) : (
                                                <h4 className="font-black text-gray-900 text-sm leading-none mb-1">{bucket.name}</h4>
                                            )}
                                            
                                            <div className="flex items-center gap-1 mt-1">
                                                {isCustom ? (
                                                    <div className="flex items-center bg-slate-100 rounded-md px-1.5 py-0.5">
                                                        <input 
                                                            type="number"
                                                            className="w-8 bg-transparent text-[10px] font-black text-indigo-600 outline-none text-center"
                                                            value={bucket.percent}
                                                            onChange={(e) => handleUpdateCustomPercent(idx, e.target.value)}
                                                        />
                                                        <span className="text-[8px] font-black text-gray-400">%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{bucket.percent}%</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-base font-black text-gray-900 tracking-tighter">{bucketVal.toLocaleString('en-US')}đ</span>
                                    </div>
                                </div>
                                <select 
                                    className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none border border-transparent focus:border-indigo-100 appearance-none" 
                                    value={mappings[bucket.name] || bucket.defaultCat} 
                                    onChange={(e) => setMappings(prev => ({ ...prev, [bucket.name]: e.target.value }))}
                                >
                                    {categories.expense.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-white border-t border-gray-100 p-4 shrink-0 space-y-2">
                <div className="flex gap-2">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all"
                    >
                        Không phân bổ
                    </button>
                    <button 
                        onClick={handleApply} 
                        disabled={totalPercent !== 100}
                        className={`flex-[2] py-4 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 ${totalPercent === 100 ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                    >
                        Thiết lập ngân sách {totalPercent === 100 ? '' : `(${totalPercent}%)`}
                    </button>
                </div>
                <div className="h-safe-area"></div>
            </div>
        </div>
    );
};
