
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Snowflake, TrendingDown, User, CheckCircle2, Wallet, ArrowRight, Clock } from 'lucide-react';
import { Transaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DebtRepaymentViewProps {
    onBack: () => void;
    transactions: Transaction[];
    onPayDebt: (personName: string, amount: number) => void;
}

interface DebtItem {
    person: string;
    borrowed: number;
    repaid: number;
    remaining: number;
    lastDate: string;
    firstDate: string;
}

type Strategy = 'snowball' | 'highest' | 'oldest';

export const DebtRepaymentView: React.FC<DebtRepaymentViewProps> = ({ onBack, transactions, onPayDebt }) => {
    const { formatCurrency } = useLanguage();
    const [strategy, setStrategy] = useState<Strategy>('snowball');

    // Process transactions to find outstanding debts
    const debtList = useMemo(() => {
        const debts: Record<string, DebtItem> = {};

        transactions.forEach(t => {
            // Only consider Debt type transactions
            if (t.type !== 'debt') return;
            if (!t.withPerson) return;
            
            const person = t.withPerson.trim();
            if (!debts[person]) {
                debts[person] = { 
                    person, 
                    borrowed: 0, 
                    repaid: 0, 
                    remaining: 0, 
                    lastDate: t.date,
                    firstDate: t.date
                };
            }

            // Update dates
            if (t.date > debts[person].lastDate) debts[person].lastDate = t.date;
            if (t.date < debts[person].firstDate) debts[person].firstDate = t.date;

            // Check Category ID for direction
            // 'debt' = I borrowed money (Liability +)
            // 'repay' = I paid back (Liability -)
            if (t.categoryId === 'debt') {
                debts[person].borrowed += t.amount;
            } else if (t.categoryId === 'repay') {
                debts[person].repaid += t.amount;
            }
        });

        // Calculate remaining and filter out fully paid debts (allow small margin for float errors)
        return Object.values(debts)
            .map(d => ({ ...d, remaining: d.borrowed - d.repaid }))
            .filter(d => d.remaining > 1000); // Filter out tiny amounts/paid off
    }, [transactions]);

    // Total Debt
    const totalDebt = debtList.reduce((sum, d) => sum + d.remaining, 0);

    // Sorted List based on Strategy
    const sortedDebts = useMemo(() => {
        const list = [...debtList];
        if (strategy === 'snowball') {
            // Ascending Order (Smallest First)
            return list.sort((a, b) => a.remaining - b.remaining);
        } else if (strategy === 'highest') {
            // Descending Order (Largest First)
            return list.sort((a, b) => b.remaining - a.remaining);
        } else {
            // Oldest First (Ascending Date)
            return list.sort((a, b) => a.firstDate.localeCompare(b.firstDate));
        }
    }, [debtList, strategy]);

    const topPriority = sortedDebts.length > 0 ? sortedDebts[0] : null;

    const getStrategyDescription = () => {
        if (!topPriority) return '';
        if (strategy === 'snowball') return `Theo phương pháp Tuyết lăn, hãy dứt điểm khoản nợ nhỏ này của ${topPriority.person} trước. Cảm giác "xóa sổ" được một chủ nợ sẽ giúp bạn có đà trả tiếp các khoản sau!`;
        if (strategy === 'highest') return `Khoản nợ của ${topPriority.person} đang chiếm tỷ trọng lớn nhất. Tập trung trả khoản này sẽ giúp bạn trút bỏ gánh nặng lớn.`;
        return `Khoản nợ của ${topPriority.person} đã tồn tại từ ${new Date(topPriority.firstDate).toLocaleDateString('vi-VN')}. Hãy ưu tiên trả nợ lâu ngày để giữ uy tín và mối quan hệ.`;
    };

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col pb-safe-area">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <button onClick={onBack}>
                        <ArrowLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Kế hoạch trả nợ</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* 1. Overview Card */}
                <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
                    <span className="text-rose-100 text-sm font-medium uppercase tracking-wider">Tổng nợ hiện tại</span>
                    <div className="text-4xl font-bold mt-1 mb-2">{formatCurrency(totalDebt)}</div>
                    <div className="flex items-center text-rose-100 text-xs">
                        <User className="w-4 h-4 mr-1" />
                        <span>{debtList.length} chủ nợ đang chờ thanh toán</span>
                    </div>
                </div>

                {debtList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <CheckCircle2 className="w-16 h-16 mb-4 text-green-500 opacity-80" />
                        <p className="text-gray-900 font-bold">Tuyệt vời!</p>
                        <p className="text-sm">Bạn không có khoản nợ nào cần trả.</p>
                    </div>
                ) : (
                    <>
                        {/* 2. Strategy Selector */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Chọn phương pháp</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => setStrategy('snowball')}
                                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${strategy === 'snowball' ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}
                                >
                                    <Snowflake className={`w-5 h-5 mb-1 ${strategy === 'snowball' ? 'text-sky-500' : 'text-gray-400'}`} />
                                    <span className="font-bold text-xs">Tuyết lăn</span>
                                </button>

                                <button 
                                    onClick={() => setStrategy('highest')}
                                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${strategy === 'highest' ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}
                                >
                                    <TrendingDown className={`w-5 h-5 mb-1 ${strategy === 'highest' ? 'text-orange-500' : 'text-gray-400'}`} />
                                    <span className="font-bold text-xs">Nợ lớn nhất</span>
                                </button>

                                <button 
                                    onClick={() => setStrategy('oldest')}
                                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${strategy === 'oldest' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}
                                >
                                    <Clock className={`w-5 h-5 mb-1 ${strategy === 'oldest' ? 'text-purple-500' : 'text-gray-400'}`} />
                                    <span className="font-bold text-xs">Lâu nhất</span>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 italic text-center">
                                {strategy === 'snowball' && "Trả khoản nhỏ trước để tạo động lực."}
                                {strategy === 'highest' && "Trả khoản lớn trước để giảm gánh nặng."}
                                {strategy === 'oldest' && "Trả khoản vay lâu nhất để giữ uy tín."}
                            </p>
                        </div>

                        {/* 3. AI Recommendation */}
                        {topPriority && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full 
                                    ${strategy === 'snowball' ? 'bg-sky-500' : (strategy === 'highest' ? 'bg-orange-500' : 'bg-purple-500')}`}></div>
                                <div className="flex justify-between items-start mb-2 pl-2">
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase">Ưu tiên thanh toán</span>
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            {topPriority.person}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white 
                                                ${strategy === 'snowball' ? 'bg-sky-500' : (strategy === 'highest' ? 'bg-orange-500' : 'bg-purple-500')}`}>
                                                #{strategy === 'snowball' ? 'Dễ nhất' : (strategy === 'highest' ? 'Gấp nhất' : 'Cũ nhất')}
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-red-600">{formatCurrency(topPriority.remaining)}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 pl-2 mb-3 leading-relaxed">
                                    {getStrategyDescription()}
                                </p>
                                <button 
                                    onClick={() => onPayDebt(topPriority.person, topPriority.remaining)}
                                    className={`w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform 
                                        ${strategy === 'snowball' ? 'bg-sky-500 hover:bg-sky-600' : (strategy === 'highest' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-500 hover:bg-purple-600')}`}
                                >
                                    <Wallet className="w-4 h-4" />
                                    Trả khoản này ngay
                                </button>
                            </div>
                        )}

                        {/* 4. Full List */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Danh sách nợ ({debtList.length})</h3>
                            <div className="space-y-3">
                                {sortedDebts.map((item, idx) => {
                                    const percentPaid = Math.min((item.repaid / item.borrowed) * 100, 100);
                                    return (
                                        <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                                        {item.person.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">{item.person}</h4>
                                                        <div className="text-xs text-gray-400">Gốc: {formatCurrency(item.borrowed)}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-red-500">{formatCurrency(item.remaining)}</div>
                                                    <div className="text-[10px] text-gray-400">
                                                        {new Date(item.firstDate).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="relative pt-1">
                                                <div className="flex mb-1 items-center justify-between text-[10px] text-gray-500">
                                                    <span>Đã trả {Math.round(percentPaid)}%</span>
                                                    <span>{formatCurrency(item.repaid)}</span>
                                                </div>
                                                <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-100">
                                                    <div style={{ width: `${percentPaid}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"></div>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                                                <button 
                                                    onClick={() => onPayDebt(item.person, item.remaining)}
                                                    className="text-xs font-bold text-green-600 flex items-center hover:bg-green-50 px-2 py-1 rounded"
                                                >
                                                    Trả nợ <ArrowRight className="w-3 h-3 ml-1"/>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
