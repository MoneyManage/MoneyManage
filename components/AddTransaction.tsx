
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, FileText, Utensils, Bus, ShoppingBag, Film, Heart, Banknote, Gift, TrendingUp, MoreHorizontal, CreditCard, Camera, Mic, Square, Settings2, History, Loader2, Sparkles, Check, ChevronRight, Maximize2, X as MultiplyIcon, Divide, Minus, Plus, Delete, Star, Circle, AlertTriangle, PieChart, Copy, Wallet, ArrowRightLeft, ArrowDown, WifiOff, Smartphone, Zap, Clock, Calculator, Percent, Layers, Info, Keyboard, PieChart as PieIcon, Landmark, AlertCircle, ChevronDown, Keyboard as KeyboardIcon, Snowflake, Flame, Trophy, Users, Lightbulb, AudioLines, RefreshCw, AlertOctagon, Split, AlertCircle as WarningIcon, Image as ImageIcon, TrendingDown } from 'lucide-react';
import { Transaction, TransactionType, CategoryItem, Budget, AllCategories } from '../types';
import { CategoryListView } from './CategoryListView';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleGenAI, Type } from "@google/genai";
import { CalendarPicker } from './CalendarPicker';
import { SalaryAllocation } from './SalaryAllocation';

interface AddTransactionProps {
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  categories: AllCategories;
  onAddCategory: (type: 'expense' | 'income' | 'debt', newCat: CategoryItem) => void;
  initialData?: Transaction | null;
  history?: Transaction[];
  budgets?: Budget[];
  onUpdateBudgets?: (budgets: Budget[]) => void;
}

type WalletType = 'atm' | 'cash' | 'e-wallet';

export const AddTransaction: React.FC<AddTransactionProps> = ({ onClose, onSave, categories, onAddCategory, initialData, history = [], budgets = [], onUpdateBudgets }) => {
  const { formatCurrency, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [displayValue, setDisplayValue] = useState(initialData ? initialData.amount.toString() : '0');
  
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [showAllocation, setShowAllocation] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);
  const [warningData, setWarningData] = useState<{ categoryName: string, limit: number, currentSpent: number, newTotal: number, isParent: boolean } | null>(null);

  // Voice & Vision State
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const toDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.categoryId || '');
  const [date, setDate] = useState<string>(initialData?.date || toDateStr(new Date()));
  const [note, setNote] = useState<string>(initialData?.note || '');
  const [withPerson, setWithPerson] = useState<string>(initialData?.withPerson || '');
  const [wallet, setWallet] = useState<WalletType>((initialData?.walletId as WalletType) || 'cash');
  const [destWallet, setDestWallet] = useState<WalletType>((initialData?.destinationWalletId as WalletType) || 'atm');

  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const calculateResult = useCallback((): number => {
    try {
        const sanitized = displayValue.replace(/[^-+*/.0-9]/g, '');
        if (!sanitized) return 0;
        return Number(new Function('return ' + sanitized)()) || 0;
    } catch (e) { return 0; }
  }, [displayValue]);

  const currentCategory = [...categories.expense, ...categories.income, ...categories.debt].find(c => c.id === selectedCategory);

  // Debt Intelligence
  const activeDebts = useMemo(() => {
    const debts: Record<string, number> = {};
    history.forEach(t => {
      if (t.type === 'debt' && t.withPerson) {
        const p = t.withPerson.trim();
        if (t.categoryId === 'debt') debts[p] = (debts[p] || 0) + t.amount;
        if (t.categoryId === 'repay') debts[p] = (debts[p] || 0) - t.amount;
      }
    });
    return Object.entries(debts)
      .map(([person, amount]) => ({ person, amount }))
      .filter(d => d.amount > 1000)
      .sort((a, b) => a.amount - b.amount);
  }, [history]);

  const snowballDebt = activeDebts.length > 0 ? activeDebts[0] : null;
  const avalancheDebt = activeDebts.length > 0 ? activeDebts[activeDebts.length - 1] : null;

  const isDebtRepaymentMode = selectedCategory === 'repay' || (type === 'debt' && selectedCategory === 'repay');

  const handleApplyDebtStrategy = (debt: { person: string, amount: number }) => {
    setWithPerson(debt.person);
    setNote(`Trả nợ cho ${debt.person}`);
    if (displayValue === '0') setDisplayValue(debt.amount.toString());
    setSelectedCategory('repay');
    setType('debt');
    setShowKeypad(true); // Ensure keypad is shown for verification
  };

  const checkBudgetExceeded = () => {
    if (type !== 'expense' || !selectedCategory) return null;
    const finalAmount = calculateResult();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const targetCat = categories.expense.find(c => c.id === selectedCategory);
    if (!targetCat) return null;

    const relatedBudgetIds = [selectedCategory];
    if (targetCat.parentId) relatedBudgetIds.push(targetCat.parentId);
    
    const applicableBudgets = budgets.filter(b => relatedBudgetIds.includes(b.categoryId));
    if (applicableBudgets.length === 0) return null;

    for (const budget of applicableBudgets) {
        const spentInMonth = history.filter(t => {
            const d = new Date(t.date);
            return t.type === 'expense' && 
                   (t.categoryId === budget.categoryId || categories.expense.find(c => c.id === t.categoryId)?.parentId === budget.categoryId) && 
                   d >= startOfMonth && d <= endOfMonth && 
                   t.id !== initialData?.id;
        }).reduce((sum, t) => sum + t.amount, 0);

        const newTotal = spentInMonth + finalAmount;
        if (newTotal > budget.limit) {
            const budgetCat = categories.expense.find(c => c.id === budget.categoryId);
            return { 
                categoryName: budgetCat?.name || 'Danh mục', 
                limit: budget.limit, 
                currentSpent: spentInMonth, 
                newTotal: newTotal,
                isParent: budget.categoryId !== selectedCategory
            };
        }
    }
    return null;
  };

  const handleSave = () => {
    const finalAmount = calculateResult();
    if (finalAmount <= 0) {
        alert("Vui lòng nhập số tiền hợp lệ");
        return;
    }
    if (!selectedCategory && type !== 'transfer') { setShowCategorySelector(true); return; }
    
    const budgetWarning = checkBudgetExceeded();
    if (budgetWarning) {
        setWarningData(budgetWarning);
        setShowBudgetWarning(true);
        return;
    }
    saveTransaction();
  };

  const saveTransaction = () => {
    const finalAmount = calculateResult();
    onSave({ 
        amount: finalAmount, 
        categoryId: type === 'transfer' ? 'transfer' : selectedCategory, 
        date, 
        note, 
        type, 
        withPerson: withPerson || undefined,
        walletId: wallet, 
        destinationWalletId: type === 'transfer' ? destWallet : undefined 
    });
    onClose();
  };

  const handleReceiptFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            await processReceiptImage(base64Data, file.type);
        };
        reader.readAsDataURL(file);
    } catch (error) { setIsAnalyzing(false); }
  };

  const processReceiptImage = async (base64Data: string, mimeType: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const allCats = [...categories.expense, ...categories.income, ...categories.debt];
        const systemInstruction = `Bạn là chuyên gia phân tích hóa đơn Elite. Hãy trích xuất dữ liệu từ hình ảnh vào JSON: { "amount": number, "categoryId": string, "note": string, "type": "expense", "date": "YYYY-MM-DD" }. Sử dụng danh sách hạng mục: ${JSON.stringify(allCats.map(c => ({id: c.id, name: c.name})))}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ inlineData: { data: base64Data, mimeType: mimeType } }] },
            config: { systemInstruction: systemInstruction, responseMimeType: "application/json" }
        });
        const result = JSON.parse(response.text || '{}');
        if (result.amount) setDisplayValue(result.amount.toString());
        if (result.categoryId) setSelectedCategory(result.categoryId);
        if (result.note) setNote(result.note);
        if (result.date) setDate(result.date);
        
        // CRITICAL FIX: After scanning, KEEP the keypad shown so user can edit and save.
        setShowKeypad(true); 
    } catch (error) { 
        alert("Không thể phân tích hóa đơn. Vui lòng thử lại hoặc nhập tay."); 
    } finally { 
        setIsAnalyzing(false); 
    }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.onresult = (event: any) => processVoiceInput(event.results[0][0].transcript);
      recognition.start();
      setIsListening(true);
      recognition.onend = () => setIsListening(false);
    }
  };

  const processVoiceInput = async (text: string) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Trích xuất thông tin giao dịch từ đoạn nói chuyện: "${text}". Trả về JSON: { "amount": number, "categoryId": string, "note": string, "type": "expense" }.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      if (result.amount) setDisplayValue(result.amount.toString());
      if (result.categoryId) setSelectedCategory(result.categoryId);
      // Keep keypad visible for review
      setShowKeypad(true); 
    } catch (error) { console.error(error); } finally { setIsAnalyzing(false); }
  };

  const handleNumPress = (val: string) => {
    setDisplayValue(prev => (prev === '0' && !['+', '-', '.', '*', '/'].includes(val)) ? val : prev + val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-full overflow-hidden font-sans">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleReceiptFileChange} />
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white shrink-0">
        <button onClick={onClose}><X className="w-6 h-6 text-gray-800" /></button>
        <div className="flex flex-col items-center">
            <span className="font-black text-lg uppercase tracking-tight leading-tight">Ghi chép Elite</span>
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">{type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : type === 'debt' ? 'Debt' : 'Transfer'} Mode</span>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-slate-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Camera className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white px-5 pt-1 space-y-4 no-scrollbar relative">
            {/* Amount Area */}
            <div onClick={() => setShowKeypad(true)} className="w-full border-b-[3px] border-indigo-500/10 pb-3 pt-1 cursor-pointer relative transition-all active:scale-[0.99]">
                <div className="font-bold tracking-tighter text-slate-300 text-lg mb-1">
                    {displayValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </div>
                <div className="font-black tracking-tighter text-gray-900 text-4xl flex items-center gap-x-3">
                    <span className="text-indigo-600/30 text-3xl">=</span>
                    {formatCurrency(calculateResult())}
                </div>
                <div className="absolute bottom-0 left-0 h-[3px] bg-indigo-600 transition-all duration-500" style={{ width: displayValue === '0' ? '0%' : '100%' }}></div>
                {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-2" />
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">Elite AI đang phân tích...</span>
                    </div>
                )}
            </div>

            {/* Smart Debt Strategies Section */}
            {isDebtRepaymentMode && activeDebts.length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Chiến lược trả nợ Elite</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {snowballDebt && (
                    <button 
                      onClick={() => handleApplyDebtStrategy(snowballDebt)}
                      className="bg-white p-3 rounded-2xl border border-sky-100 text-left active:scale-95 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Snowflake className="w-3 h-3 text-sky-500" />
                        <span className="text-[9px] font-black text-sky-500 uppercase tracking-tight">Tuyết lăn</span>
                      </div>
                      <div className="text-xs font-black text-gray-800 truncate">Cho {snowballDebt.person}</div>
                      <div className="text-[9px] font-bold text-gray-400">Nợ nhỏ nhất: {formatCurrency(snowballDebt.amount)}</div>
                    </button>
                  )}
                  {avalancheDebt && avalancheDebt.person !== snowballDebt?.person && (
                    <button 
                      onClick={() => handleApplyDebtStrategy(avalancheDebt)}
                      className="bg-white p-3 rounded-2xl border border-orange-100 text-left active:scale-95 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown className="w-3 h-3 text-orange-500" />
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-tight">Đại băng hà</span>
                      </div>
                      <div className="text-xs font-black text-gray-800 truncate">Cho {avalancheDebt.person}</div>
                      <div className="text-[9px] font-bold text-gray-400">Nợ lớn nhất: {formatCurrency(avalancheDebt.amount)}</div>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
                {/* Category Selector */}
                <div className="flex items-center space-x-4" onClick={() => setShowCategorySelector(true)}>
                    <div className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all active:scale-90 ${currentCategory ? currentCategory.color.split(' ')[0] : 'bg-slate-50 text-slate-200'}`}>
                        <Layers className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Hạng mục</span>
                        <span className={`text-xl font-black ${currentCategory ? 'text-gray-900' : 'text-slate-200'}`}>{currentCategory?.name || "Chọn hạng mục..."}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-200" />
                </div>

                {/* Description Input */}
                <div className="flex items-center space-x-4">
                    <div className="w-14 flex justify-center"><FileText className="w-6 h-6 text-slate-100" /></div>
                    <div className="flex-1">
                        <input 
                            className="w-full text-base font-bold text-gray-800 border-none outline-none p-0 bg-transparent placeholder-slate-200" 
                            placeholder="Thêm mô tả giao dịch..." 
                            value={note} 
                            onChange={(e) => setNote(e.target.value)} 
                        />
                    </div>
                </div>

                {/* Person Input (Only for Debt mode) */}
                {(type === 'debt' || isDebtRepaymentMode) && (
                   <div className="flex items-center space-x-4 animate-in slide-in-from-left duration-300">
                      <div className="w-14 flex justify-center"><Users className="w-6 h-6 text-slate-100" /></div>
                      <div className="flex-1">
                          <input 
                              className="w-full text-base font-bold text-gray-800 border-none outline-none p-0 bg-transparent placeholder-slate-200" 
                              placeholder="Ghi cho ai? (Ví dụ: Anh Nam)" 
                              value={withPerson} 
                              onChange={(e) => setWithPerson(e.target.value)} 
                          />
                      </div>
                  </div>
                )}

                {/* Date Display */}
                <div className="flex items-center space-x-4" onClick={() => setShowCalendarPicker(true)}>
                    <div className="w-14 flex justify-center"><Calendar className="w-6 h-6 text-slate-100" /></div>
                    <div className="flex-1">
                        <span className="text-base font-bold text-gray-800">{new Date(date).toLocaleDateString('vi-VN', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                    </div>
                </div>
            </div>
      </div>

      {/* FOOTER SECTION: Keys and Actions */}
      <div className={`bg-white p-2 shrink-0 border-t border-slate-50 transition-all duration-300 ${showKeypad ? 'translate-y-0 opacity-100' : 'translate-y-full h-[60px] opacity-100'}`}>
            {showKeypad && (
                <div className="flex gap-1.5 mb-2 animate-in fade-in slide-in-from-bottom-2">
                    {/* Micro Button */}
                    <button 
                        onClick={startVoice}
                        className={`w-12 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 shadow-md ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600'}`}
                    >
                        <Mic className="w-5 h-5" />
                    </button>

                    {/* Number & Ops Grid */}
                    <div className="flex-1 grid grid-cols-4 gap-1">
                        {[7,8,9,'DEL'].map(k => (
                            <button 
                                key={k} 
                                onClick={() => k === 'DEL' ? setDisplayValue(prev => prev.length <= 1 ? '0' : prev.slice(0, -1)) : handleNumPress(k.toString())} 
                                className={`py-1.5 rounded-lg font-black text-base transition-all active:scale-90 ${k === 'DEL' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-gray-800 hover:bg-slate-100'}`}
                            >
                                {k}
                            </button>
                        ))}
                        {[4,5,6,'/'].map(k => (<button key={k} onClick={() => handleNumPress(k.toString())} className="py-1.5 bg-slate-50 rounded-lg font-black text-base text-gray-800 transition-all active:scale-90">{k}</button>))}
                        {[1,2,3,'*'].map(k => (<button key={k} onClick={() => handleNumPress(k.toString())} className="py-1.5 bg-slate-50 rounded-lg font-black text-base text-gray-800 transition-all active:scale-90">{k}</button>))}
                        {[0,'000','.','+'].map(k => (<button key={k} onClick={() => handleNumPress(k.toString())} className="py-1.5 bg-slate-50 rounded-lg font-black text-base text-gray-800 transition-all active:scale-90">{k}</button>))}
                    </div>
                </div>
            )}

            {/* Action Buttons Row - ALWAYS visible if modal is open to allow saving scan result */}
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowKeypad(!showKeypad)} 
                    className="flex-[0.4] py-3.5 bg-slate-50 text-slate-400 font-black text-[8px] uppercase tracking-[0.2em] rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                    {showKeypad ? <ChevronDown className="w-3 h-3" /> : <KeyboardIcon className="w-3 h-3" />}
                    {showKeypad ? "Ẩn phím" : "Hiện phím"}
                </button>
                <button 
                    onClick={handleSave} 
                    className="flex-[0.6] py-3.5 bg-emerald-600 text-white font-black text-[8px] uppercase tracking-[0.2em] rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                    <Check className="w-3 h-3" />
                    Ghi chép Elite
                </button>
            </div>
            <div className="h-safe-area"></div>
      </div>

      {showCategorySelector && (
          <div className="fixed inset-0 z-[60] bg-white">
              <CategoryListView 
                onBack={() => setShowCategorySelector(false)} 
                categories={categories} 
                onAddCategory={onAddCategory} 
                onSelectCategory={(id) => { 
                    setSelectedCategory(id); 
                    const isIncome = categories.income.some(c => c.id === id);
                    if (isIncome) {
                        setType('income');
                        setShowAllocation(true); // Auto trigger allocation for income
                    } else if (categories.expense.some(c => c.id === id)) {
                        setType('expense');
                    } else if (categories.debt.some(c => c.id === id)) {
                        setType('debt');
                    }
                    setShowCategorySelector(false); 
                }} 
              />
          </div>
      )}

      {showAllocation && (
          <SalaryAllocation 
            onClose={() => setShowAllocation(false)}
            categories={categories}
            onApplyBudgets={(newBudgets) => onUpdateBudgets && onUpdateBudgets(newBudgets)}
            initialAmount={displayValue}
          />
      )}

      {showCalendarPicker && <CalendarPicker selectedDate={new Date(date)} onSelect={(d) => setDate(d.toISOString().split('T')[0])} onClose={() => setShowCalendarPicker(false)} />}
      
      {showBudgetWarning && warningData && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="bg-rose-600 p-8 flex flex-col items-center text-white">
                    <AlertOctagon className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Vượt hạn mức!</h3>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-center font-bold text-gray-600">Hạng mục <span className="text-slate-900 font-black">{warningData.categoryName}</span> sắp vượt hạn mức chi tiêu.</p>
                    <div className="space-y-3 pt-4">
                        <button onClick={() => { saveTransaction(); setShowBudgetWarning(false); }} className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl">Vẫn lưu giao dịch</button>
                        <button onClick={() => setShowBudgetWarning(false)} className="w-full py-5 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs rounded-2xl">Quay lại sửa</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
