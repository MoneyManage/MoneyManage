
import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Sparkles, CreditCard, Banknote, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, ChevronDown, Package, X, ArrowRight, List, ShieldCheck, Landmark, PiggyBank, BarChart, Trophy, Triangle, Smartphone, Info, Lightbulb, Rocket, GraduationCap, Building2, Coins, Split, PieChart as PieIcon, Target } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { Transaction, Budget, AllCategories, SavingsGoal, Asset, CategoryItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { AIAssistant } from './AIAssistant';
import { SalaryAllocation } from './SalaryAllocation';

interface OverviewViewProps {
  transactions: Transaction[];
  categories: AllCategories;
  budgets?: Budget[];
  goals?: SavingsGoal[];
  assets?: Asset[];
  onAddTransaction: (tx: any) => void;
  onUpdateBudgets?: (budgets: Budget[]) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ transactions, categories, budgets = [], goals = [], assets = [], onAddTransaction, onUpdateBudgets }) => {
  const { formatCurrency: globalFormatCurrency, language, t } = useLanguage();
  const [showBalance, setShowBalance] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showAllocation, setShowAllocation] = useState(false);
  const [showPyramidDetail, setShowPyramidDetail] = useState(false);

  const now = new Date();
  const startOfMonth = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    d.setHours(0,0,0,0);
    return d;
  }, []);

  const currentMonthExpenses = useMemo(() => {
      return transactions.filter(t => {
          const d = new Date(t.date);
          return t.type === 'expense' && d >= startOfMonth;
      });
  }, [transactions, startOfMonth]);

  const totalExpense = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

  const expenseData = useMemo(() => {
    const dataMap: Record<string, { name: string, value: number, hexColor: string }> = {};
    
    currentMonthExpenses.forEach(tx => {
        const cat = categories.expense.find(c => c.id === tx.categoryId);
        if (!cat) return;
        
        const groupKey = cat.parentId || cat.id;
        const groupCat = categories.expense.find(c => c.id === groupKey) || cat;
        
        const getColor = (colorClass: string) => {
            if (colorClass.includes('orange')) return '#f97316';
            if (colorClass.includes('red')) return '#e11d48';
            if (colorClass.includes('blue')) return '#2563eb';
            if (colorClass.includes('green')) return '#10b981';
            if (colorClass.includes('yellow')) return '#f59e0b';
            if (colorClass.includes('purple')) return '#9333ea';
            if (colorClass.includes('sky')) return '#0ea5e9';
            if (colorClass.includes('teal')) return '#0d9488';
            return '#64748b';
        };

        if (!dataMap[groupKey]) {
            dataMap[groupKey] = {
                name: groupCat.name,
                value: 0,
                hexColor: getColor(groupCat.color)
            };
        }
        dataMap[groupKey].value += tx.amount;
    });

    return Object.values(dataMap).sort((a, b) => b.value - a.value);
  }, [currentMonthExpenses, categories]);

  const getWalletBalance = (walletId: string) => {
    return transactions.reduce((acc, t) => {
        if (t.walletId === walletId) {
            if (t.type === 'income') return acc + t.amount;
            if (t.type === 'expense' || t.type === 'transfer') return acc - t.amount;
        }
        if (t.type === 'transfer' && t.destinationWalletId === walletId) return acc + t.amount;
        return acc;
    }, 0);
  };

  const atmBal = getWalletBalance('atm');
  const cashBal = getWalletBalance('cash');
  const eWalletBal = getWalletBalance('e-wallet');

  const pyramidData = useMemo(() => {
    return [
        { 
            id: 5, 
            name: 'Tài sản mạo hiểm', 
            details: 'Crypto, Startup, Phái sinh, NFT',
            icon: Rocket, 
            color: 'bg-rose-600', 
            textColor: 'text-white',
            detailColor: 'text-rose-100',
            value: 0 
        },
        { 
            id: 4, 
            name: 'Tài sản tăng trưởng', 
            details: 'Cổ phiếu, Đất nền, Doanh nghiệp',
            icon: TrendingUp, 
            color: 'bg-amber-500', 
            textColor: 'text-white',
            detailColor: 'text-amber-50',
            value: 0 
        },
        { 
            id: 3, 
            name: 'Tài sản thu nhập', 
            details: 'Tiết kiệm, Trái phiếu, BĐS cho thuê',
            icon: Coins, 
            color: 'bg-emerald-600', 
            textColor: 'text-white',
            detailColor: 'text-emerald-50',
            value: 0 
        },
        { 
            id: 2, 
            name: 'Tài sản bảo vệ', 
            details: 'Vàng, Tiền mặt, Bảo hiểm, Dự phòng',
            icon: ShieldCheck, 
            color: 'bg-sky-500', 
            textColor: 'text-white',
            detailColor: 'text-sky-50',
            value: 0 
        },
        { 
            id: 1, 
            name: 'Tài sản vô hình', 
            details: 'Kiến thức, Sức khỏe, Quan hệ, Kỹ năng',
            icon: GraduationCap, 
            color: 'bg-slate-900', 
            textColor: 'text-white',
            detailColor: 'text-slate-300',
            value: 0 
        },
    ];
  }, []);

  const totalWealth = useMemo(() => {
      let val = 0;
      assets?.forEach(a => val += a.value);
      val += (atmBal + cashBal + eWalletBal);
      return val;
  }, [assets, atmBal, cashBal, eWalletBal]);

  const formatCurrency = (amount: number, hideable = true) => {
    if (hideable && !showBalance) return '***';
    return globalFormatCurrency(amount);
  };

  return (
    <div className="h-full overflow-y-auto pb-24 pt-2 bg-slate-50 no-scrollbar">
      {/* Quick Actions */}
      <div className="px-5 py-4 flex gap-2">
          <button onClick={() => setShowBalance(!showBalance)} className="flex-[0.8] flex items-center justify-center gap-2 py-4 bg-white rounded-2xl shadow-sm text-gray-500 font-black text-[9px] uppercase tracking-widest active:bg-gray-50">
              {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Số dư
          </button>
          <button onClick={() => setShowAllocation(true)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">
              <Split className="w-3.5 h-3.5" />
              Phân bổ lương
          </button>
          <button onClick={() => setShowAI(true)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl shadow-xl font-black text-[9px] uppercase tracking-[0.2em] active:scale-95 transition-all">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Elite AI
          </button>
      </div>

      {/* Wallet Summary - HORIZONTAL COMPACT GRID */}
      <div className="mx-4 mb-6 bg-white rounded-[2.5rem] p-5 shadow-sm border border-gray-100">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Tài khoản ví</h3>
          <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-white shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 mb-2">
                      <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">ATM</span>
                  <span className="font-black text-gray-900 text-[11px] tracking-tighter truncate w-full text-center">{formatCurrency(atmBal)}</span>
              </div>

              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-white shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-100 mb-2">
                      <Banknote className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Tiền mặt</span>
                  <span className="font-black text-gray-900 text-[11px] tracking-tighter truncate w-full text-center">{formatCurrency(cashBal)}</span>
              </div>

              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-white shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center text-white shadow-md shadow-violet-100 mb-2">
                      <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">E-Wallet</span>
                  <span className="font-black text-gray-900 text-[11px] tracking-tighter truncate w-full text-center">{formatCurrency(eWalletBal)}</span>
              </div>
          </div>
      </div>

      {/* Asset Pyramid Summary */}
      <div className="mx-4 mb-6">
          <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-100 overflow-hidden relative group">
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">Tháp tài sản Elite</h2>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">Cơ cấu tài chính bền vững</p>
                  </div>
                  <div className="text-right">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tổng tài sản</span>
                      <span className="text-lg font-black text-gray-900 tracking-tighter">{formatCurrency(totalWealth)}</span>
                  </div>
              </div>

              <div className="flex flex-col items-center space-y-2">
                  {pyramidData.map((layer, idx) => {
                      const baseWidth = 65 + (idx * 8); 
                      return (
                          <div 
                              key={layer.id}
                              className={`min-h-[72px] rounded-2xl flex flex-col justify-center px-6 ${layer.color} border border-white/20 shadow-lg relative overflow-hidden transition-all duration-500 active:scale-[0.98]`}
                              style={{ width: `${baseWidth}%` }}
                          >
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none"></div>
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                              
                              <div className="flex items-center justify-between mb-1 relative z-10">
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/20">
                                          <layer.icon className={`w-4 h-4 ${layer.textColor} shrink-0`} />
                                      </div>
                                      <span className={`text-[12px] font-black ${layer.textColor} uppercase whitespace-nowrap tracking-tight`}>{layer.name}</span>
                                  </div>
                              </div>
                              <div className={`text-[10px] font-black ${layer.detailColor} uppercase tracking-widest truncate relative z-10 pl-9`}>
                                  {layer.details}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

      {/* Savings Goals Summary */}
      {goals && goals.length > 0 && (
          <div className="mx-4 mb-6">
              <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-100 overflow-hidden relative">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">Mục tiêu tiết kiệm</h2>
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Tiến độ tích lũy</p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><Target className="w-5 h-5" /></div>
                  </div>
                  
                  <div className="space-y-6">
                      {goals.filter(g => g.status === 'active').slice(0, 2).map(goal => (
                          <div key={goal.id}>
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{goal.name}</span>
                                  <span className="text-[10px] font-black text-gray-400">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                              </div>
                              <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                  <div 
                                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                      style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                                  ></div>
                              </div>
                              <div className="flex justify-between mt-1.5">
                                  <span className="text-[9px] font-bold text-emerald-600">{formatCurrency(goal.currentAmount)}</span>
                                  <span className="text-[9px] font-bold text-gray-300">mục tiêu {formatCurrency(goal.targetAmount)}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Expense Analytics (Pie Chart) */}
      <div className="mx-4 mb-6">
          <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">Phân bổ chi tiêu</h2>
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em]">Tháng {now.getMonth() + 1}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center"><PieIcon className="w-5 h-5 text-slate-300" /></div>
              </div>

              {expenseData.length > 0 ? (
                <div className="flex flex-col items-center">
                    <div className="w-full h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenseData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {expenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.hexColor} className="outline-none" />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px' }}
                                    formatter={(value: number) => globalFormatCurrency(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tổng chi</span>
                            <span className="text-2xl font-black text-gray-900 tracking-tighter">{formatCurrency(totalExpense)}</span>
                        </div>
                    </div>

                    <div className="w-full mt-6 grid grid-cols-2 gap-4">
                        {expenseData.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-white flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.hexColor }}></div>
                                    <span className="text-[10px] font-black text-gray-600 truncate uppercase">{item.name}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-gray-900">{formatCurrency(item.value)}</span>
                                    <span className="text-[9px] font-bold text-gray-400">{Math.round((item.value / totalExpense) * 100)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-300 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <PieIcon className="w-12 h-12 mb-3 opacity-20 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Chưa có dữ liệu tháng này</p>
                </div>
              )}
          </div>
      </div>

      {showAI && (
          <AIAssistant 
            onClose={() => setShowAI(false)} 
            transactions={transactions} 
            categories={categories}
            budgets={budgets}
            goals={goals}
            assets={assets}
          />
      )}

      {showAllocation && (
          <SalaryAllocation 
            onClose={() => setShowAllocation(false)}
            categories={categories}
            onApplyBudgets={(newBudgets) => onUpdateBudgets && onUpdateBudgets(newBudgets)}
          />
      )}
    </div>
  );
};
