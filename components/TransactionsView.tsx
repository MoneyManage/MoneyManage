import React, { useState, useMemo, useEffect } from 'react';
import { HelpCircle, Utensils, Bus, ShoppingBag, Film, Heart, Banknote, Gift, TrendingUp, MoreHorizontal, FileText, Star, Circle, Trash2, Edit2, ChevronLeft, ChevronRight, Calendar, Filter, X, Check, ArrowRight, List, LayoutGrid, Download, FileSpreadsheet, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { Transaction, CategoryItem, AllCategories } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import * as XLSX from 'xlsx';
import { CalendarPicker } from './CalendarPicker';
import { CategoryListView } from './CategoryListView';

// Icon mapping 
const IconMap: Record<string, React.FC<any>> = {
  Utensils, Bus, ShoppingBag, Film, Heart, FileText,
  Banknote, Gift, TrendingUp, MoreHorizontal, Star, Circle
};

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: AllCategories;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
}

type TimeRange = 'day' | 'week' | 'month' | 'year';
type FilterDateMode = 'default' | 'custom';
type ViewMode = 'list' | 'calendar';

export const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, categories, onDelete, onEdit }) => {
  const { t, language, formatCurrency } = useLanguage();
  
  // Navigation State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [anchorDate, setAnchorDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // For Calendar selection
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Filter State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  // Filter Values
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'debt' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState<CategoryItem | null>(null);
  const [filterDateMode, setFilterDateMode] = useState<FilterDateMode>('default');
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  // Calendar Picker state for filter
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isFilterActive = useMemo(() => {
        return filterType !== 'all' || filterCategory !== null || filterDateMode !== 'default';
  }, [filterType, filterCategory, filterDateMode]);

  // Sync Calendar mode with Month range
  useEffect(() => {
    if (viewMode === 'calendar') {
        setTimeRange('month');
        // Reset selected date to match anchor month if we switch view?
        // Let's keep the selected date if it falls within the anchor month, otherwise default to first of month
        const startOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
        const endOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
        if (selectedDate < startOfMonth || selectedDate > endOfMonth) {
            setSelectedDate(new Date()); // Or startOfMonth
        }
    }
  }, [viewMode, anchorDate]);

  // --- Date Logic Helpers ---

  const getRange = (range: TimeRange, anchor: Date) => {
      const start = new Date(anchor);
      const end = new Date(anchor);
      let label = '';

      if (range === 'day') {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          label = `${anchor.getDate()}/${anchor.getMonth() + 1}/${anchor.getFullYear()}`;
          if (anchor.toDateString() === new Date().toDateString()) label = t('time.today');
      } 
      else if (range === 'week') {
          const day = start.getDay();
          const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
          start.setDate(diff);
          start.setHours(0,0,0,0);
          
          end.setDate(start.getDate() + 6);
          end.setHours(23,59,59,999);
          
          label = `${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1}`;
      } 
      else if (range === 'month') {
          start.setDate(1);
          start.setHours(0,0,0,0);
          end.setMonth(start.getMonth() + 1);
          end.setDate(0);
          end.setHours(23,59,59,999);
          label = language === 'vi' ? `Tháng ${start.getMonth() + 1}/${start.getFullYear()}` : `${start.getMonth() + 1}/${start.getFullYear()}`;
      } 
      else if (range === 'year') {
          start.setMonth(0, 1);
          start.setHours(0,0,0,0);
          end.setMonth(11, 31);
          end.setHours(23,59,59,999);
          label = `${start.getFullYear()}`;
      }

      return { start, end, label };
  };

  const { start, end, label } = useMemo(() => getRange(timeRange, anchorDate), [timeRange, anchorDate, language]);

  const handleNavigate = (direction: 'prev' | 'next') => {
      const newDate = new Date(anchorDate);
      const val = direction === 'next' ? 1 : -1;

      if (timeRange === 'day') newDate.setDate(newDate.getDate() + val);
      if (timeRange === 'week') newDate.setDate(newDate.getDate() + (val * 7));
      if (timeRange === 'month') newDate.setMonth(newDate.getMonth() + val);
      if (timeRange === 'year') newDate.setFullYear(newDate.getFullYear() + val);

      setAnchorDate(newDate);
  };

  const handleSetToday = () => {
      const today = new Date();
      setAnchorDate(today);
      setSelectedDate(today);
  };

  // --- Filtering Logic ---

  const getRelevantCategoryIds = (selectedCat: CategoryItem | null) => {
      if (!selectedCat) return null;
      
      const ids = [selectedCat.id];
      const allLists = [...categories.expense, ...categories.income, ...categories.debt];
      
      if (!selectedCat.parentId) {
          const children = allLists.filter(c => c.parentId === selectedCat.id);
          children.forEach(c => ids.push(c.id));
      }
      return ids;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Date Filter
      let dateMatch = false;
      const tDate = new Date(t.date);
      
      if (filterDateMode === 'custom') {
          const s = new Date(customStart); s.setHours(0,0,0,0);
          const e = new Date(customEnd); e.setHours(23,59,59,999);
          dateMatch = tDate >= s && tDate <= e;
      } else {
          dateMatch = tDate >= start && tDate <= end;
      }

      if (!dateMatch) return false;

      // 2. Type Filter
      if (filterType !== 'all' && t.type !== filterType) return false;

      // 3. Category Filter (Hierarchy Aware) - Skip for transfer
      if (filterCategory && t.type !== 'transfer') {
          const validIds = getRelevantCategoryIds(filterCategory);
          if (validIds && !validIds.includes(t.categoryId)) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, start, end, filterDateMode, customStart, customEnd, filterType, filterCategory, categories]);

  const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netIncome = income - expense;

  const transactionsByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
        groups[t.date] = groups[t.date] || [];
        groups[t.date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const getCategoryInfo = (id: string, type: string) => {
    if (type === 'transfer') {
        return { name: 'Chuyển khoản', icon: 'ArrowRightLeft', color: 'bg-blue-100 text-blue-600' };
    }
    const list = type === 'income' ? categories.income : (type === 'debt' ? categories.debt : categories.expense);
    return list.find(c => c.id === id) || { name: t('cat.other'), icon: 'MoreHorizontal', color: 'bg-gray-100 text-gray-500' };
  };

  const toggleExpand = (id: string) => {
      setExpandedTxId(prev => prev === id ? null : id);
  };

  // --- Confirm Delete ---
  const confirmDelete = () => {
      if (deleteId) {
          onDelete(deleteId);
          setDeleteId(null);
      }
  };

  // --- Export CSV Logic ---
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Category', 'Note', 'Wallet', 'To Wallet'];
    const csvRows = [headers.join(',')];

    filteredTransactions.forEach(t => {
        const cat = getCategoryInfo(t.categoryId, t.type);
        const row = [
            t.date,
            t.type,
            t.amount,
            `"${cat.name.replace(/"/g, '""')}"`, // Escape double quotes
            `"${(t.note || '').replace(/"/g, '""')}"`,
            t.walletId === 'cash' ? 'Cash' : 'ATM',
            t.destinationWalletId ? (t.destinationWalletId === 'cash' ? 'Cash' : 'ATM') : ''
        ];
        csvRows.push(row.join(','));
    });

    // Add BOM for Excel UTF-8 compatibility
    const csvString = '\uFEFF' + csvRows.join('\n'); 
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Export Excel Logic ---
  const handleExportExcel = () => {
    try {
        if (filteredTransactions.length === 0) {
            alert(language === 'vi' ? "Không có giao dịch nào để xuất." : "No transactions to export.");
            return;
        }

        const data = filteredTransactions.map(t => {
            const cat = getCategoryInfo(t.categoryId, t.type);
            return {
                Date: t.date,
                Type: t.type,
                Amount: t.amount,
                Category: cat.name,
                Note: t.note || '',
                Wallet: t.walletId === 'cash' ? 'Cash' : 'ATM',
                ToWallet: t.destinationWalletId ? (t.destinationWalletId === 'cash' ? 'Cash' : 'ATM') : ''
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        
        // Auto-width for columns
        const wscols = [
            {wch: 12}, // Date
            {wch: 10}, // Type
            {wch: 15}, // Amount
            {wch: 25}, // Category
            {wch: 30}, // Note
            {wch: 10}, // Wallet
            {wch: 10}, // To Wallet
        ];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        
        XLSX.writeFile(wb, `transactions_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (error) {
        console.error("Export Excel Error:", error);
        alert("Error exporting Excel file.");
    }
  };

  // --- Calendar Logic ---
  const calendarCells = useMemo(() => {
      if (viewMode !== 'calendar') return [];
      const year = anchorDate.getFullYear();
      const month = anchorDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      const offset = firstDay.getDay(); // 0 is Sunday
      
      const cells = [];
      // Empty cells for offset
      for(let i=0; i<offset; i++) cells.push(null);
      
      // Days
      for(let i=1; i<=daysInMonth; i++) {
          const date = new Date(year, month, i);
          const dateStr = date.toISOString().split('T')[0];
          
          const txs = transactionsByDate[dateStr] || [];
          const inc = txs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
          const exp = txs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
          
          cells.push({ date, day: i, dateStr, income: inc, expense: exp });
      }
      return cells;
  }, [anchorDate, viewMode, transactionsByDate]);

  const weekDays = language === 'vi' 
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // --- Render Single Transaction Item ---
  const renderTransactionItem = (tx: Transaction, isLast: boolean) => {
      const cat = getCategoryInfo(tx.categoryId, tx.type);
      const Icon = tx.type === 'transfer' ? ArrowRightLeft : (IconMap[cat.icon] || MoreHorizontal);
      const isExpanded = expandedTxId === tx.id;

      return (
          <div key={tx.id} onClick={() => toggleExpand(tx.id)} className={`transition-all duration-200 cursor-pointer ${!isLast ? 'border-b border-gray-50' : ''}`}>
              <div className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color.split(' ')[0]}`}>
                          <Icon className={`w-5 h-5 ${cat.color.split(' ')[1]}`} />
                      </div>
                      <div>
                          {tx.type === 'transfer' ? (
                              <div className="flex items-center space-x-1">
                                  <span className="text-sm font-medium text-gray-900">{tx.walletId === 'atm' ? 'ATM' : 'Tiền mặt'}</span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900">{tx.destinationWalletId === 'atm' ? 'ATM' : 'Tiền mặt'}</span>
                              </div>
                          ) : (
                              <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                          )}
                          {tx.note && <p className="text-xs text-gray-400 truncate max-w-[150px]">{tx.note}</p>}
                      </div>
                  </div>
                  <span className={`text-sm font-medium ${
                      tx.type === 'income' ? 'text-sky-500' 
                      : tx.type === 'expense' ? 'text-red-500' 
                      : 'text-gray-600' // transfer color
                  }`}>
                      {tx.type === 'income' ? '+' : (tx.type === 'transfer' ? '' : '-')}{formatCurrency(tx.amount)}
                  </span>
              </div>
              
              {/* Quick Actions Panel */}
              <div className={`bg-gray-50 flex items-center justify-end px-4 space-x-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'h-12 opacity-100 border-t border-gray-100' : 'h-0 opacity-0'}`}>
                  <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(tx); }}
                      title={t('common.edit')}
                      className="flex items-center space-x-1 text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-100"
                  >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{t('common.edit')}</span>
                  </button>
                  <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteId(tx.id); }} 
                      title={t('common.delete')}
                      className="flex items-center space-x-1 text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-red-50"
                  >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('common.delete')}</span>
                  </button>
              </div>
          </div>
      );
  };

  // Helper to render transactions list (used for both main list and calendar daily detail)
  const renderTransactionList = (listByDate: Record<string, Transaction[]>) => {
      const dates = Object.keys(listByDate).sort((a,b) => b.localeCompare(a));
      
      if (dates.length === 0) {
          return (
            <div className="text-center py-10 text-gray-400">
                <p>No transactions found.</p>
            </div>
          );
      }

      return dates.map(date => {
        const dayTransactions = listByDate[date];
        const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const d = new Date(date);

        return (
            <div key={date}>
                <div className="flex justify-between items-end px-2 mb-2">
                    <div className="flex items-end space-x-2">
                        <span className="text-3xl font-bold text-gray-400">{d.getDate()}</span>
                        <div className="text-xs text-gray-400 mb-1">
                            <span className="uppercase block">{language === 'vi' ? `Thứ ${d.getDay() + 1}` : d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span>{d.getMonth() + 1}.{d.getFullYear()}</span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium mb-1">
                        {dayIncome > 0 && <span className="text-sky-500 mr-2">+{formatCurrency(dayIncome)}</span>}
                        {dayExpense > 0 && <span className="text-gray-500">-{formatCurrency(dayExpense)}</span>}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {dayTransactions.map((tx, idx) => renderTransactionItem(tx, idx === dayTransactions.length - 1))}
                </div>
            </div>
        )
      });
  };

  const renderCategoryPicker = () => {
        return (
             <div className="fixed inset-0 z-[60] bg-white">
                 <CategoryListView
                     onBack={() => setShowCategoryPicker(false)}
                     categories={categories}
                     onAddCategory={() => {}} // Read-only in filter
                     onSelectCategory={(id) => {
                         const cat = [...categories.expense, ...categories.income, ...categories.debt].find(c => c.id === id);
                         setFilterCategory(cat || null);
                         setShowCategoryPicker(false);
                     }}
                     initialTab={filterType === 'all' || filterType === 'transfer' ? 'expense' : filterType}
                 />
             </div>
        )
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      {/* Fixed Header Area for Filters */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
          {/* ... Header Content (unchanged) ... */}
          
          {/* 1. View Mode Tabs (Only visible in default mode & list view) */}
          {filterDateMode === 'default' && viewMode === 'list' && (
            <div className="flex border-b border-gray-100">
                {(['day', 'week', 'month', 'year'] as TimeRange[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setTimeRange(mode)}
                        className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${timeRange === mode ? 'text-gray-900 border-b-2 border-gray-900 -mb-[1px]' : 'text-gray-400'}`}
                    >
                        {t(`time.${mode}`)}
                    </button>
                ))}
            </div>
          )}
          
          {/* Custom Date Range Display */}
          {filterDateMode === 'custom' && (
             <div className="flex items-center justify-center py-3 border-b border-gray-100 bg-green-50">
                 <Calendar className="w-4 h-4 text-green-600 mr-2"/>
                 <span className="text-green-700 font-bold text-sm">
                    {new Date(customStart).toLocaleDateString()} - {new Date(customEnd).toLocaleDateString()}
                 </span>
             </div>
          )}

          {/* 2. Navigation & Filter Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              {filterDateMode === 'default' ? (
                  <>
                    <button onClick={() => handleNavigate('prev')} className="p-1 rounded-full hover:bg-gray-200" title={t('tooltip.previous')}>
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    
                    <div className="flex flex-col items-center cursor-pointer" onClick={handleSetToday}>
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-bold text-gray-800 text-sm">{label}</span>
                        </div>
                        {anchorDate.toDateString() !== new Date().toDateString() && (
                            <span className="text-[10px] text-blue-500 font-medium">{t('time.today')}</span>
                        )}
                    </div>

                    <button onClick={() => handleNavigate('next')} className="p-1 rounded-full hover:bg-gray-200" title={t('tooltip.next')}>
                        <ChevronRight className="w-6 h-6 text-gray-600" />
                    </button>
                  </>
              ) : (
                  <div className="flex-1 text-center text-xs text-gray-500 italic">
                      {t('time.custom')}
                  </div>
              )}

              <div className="flex items-center space-x-1">
                  {/* View Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-0.5 mr-2">
                       <button onClick={() => setViewMode('list')} title={t('tooltip.view_list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>
                           <List className="w-4 h-4" />
                       </button>
                       <button onClick={() => setViewMode('calendar')} title={t('tooltip.view_calendar')} className={`p-1.5 rounded-md ${viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>
                           <LayoutGrid className="w-4 h-4" />
                       </button>
                  </div>

                  {/* Filter Button */}
                  <button 
                    onClick={() => setShowFilterModal(true)}
                    title={t('tooltip.filter')}
                    className={`p-2 rounded-lg relative ${isFilterActive ? 'bg-green-100 text-green-700' : 'bg-white text-gray-500 border border-gray-200'}`}
                  >
                      <Filter className="w-5 h-5" />
                      {isFilterActive && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>}
                  </button>
                  
                  {/* Export Buttons */}
                  <button 
                    onClick={handleExportCSV}
                    title={t('tooltip.export_csv')}
                    className="p-2 rounded-lg bg-white text-gray-500 border border-gray-200 ml-1 hover:bg-gray-50"
                  >
                      <Download className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={handleExportExcel}
                    title={t('tooltip.export_excel')}
                    className="p-2 rounded-lg bg-white text-green-600 border border-gray-200 ml-1 hover:bg-green-50"
                  >
                      <FileSpreadsheet className="w-5 h-5" />
                  </button>
              </div>
          </div>

          {/* 3. Summary for Selected Period (Visible in List or Calendar) */}
          <div className="flex justify-between items-center px-6 py-3 text-sm">
             <div className="flex flex-col items-center">
                 <span className="text-gray-400 text-xs font-medium mb-0.5">{t('overview.in')}</span>
                 <span className="text-sky-500 font-bold">{formatCurrency(income)}</span>
             </div>
             <div className="flex flex-col items-center">
                 <span className="text-gray-400 text-xs font-medium mb-0.5">{t('overview.out')}</span>
                 <span className="text-red-500 font-bold">{formatCurrency(expense)}</span>
             </div>
             <div className="flex flex-col items-center relative">
                 <span className="text-gray-400 text-xs font-medium mb-0.5">{t('overview.remaining')}</span>
                 <span className="text-gray-900 font-bold">{formatCurrency(netIncome)}</span>
                 <div className="w-[1px] h-6 bg-gray-200 absolute -left-4 top-1"></div>
             </div>
          </div>

          {/* Type Filter Tabs - UPDATED: Increased vertical padding and text-sm */}
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                    { id: 'all', label: t('type.all') }, 
                    { id: 'expense', label: t('type.expense') }, 
                    { id: 'income', label: t('type.income') }, 
                    { id: 'debt', label: t('type.debt') },
                    { id: 'transfer', label: t('type.transfer') }
                ].map(type => (
                    <button
                        key={type.id}
                        onClick={() => {
                             setFilterType(type.id as any);
                             setFilterCategory(null); // Clear category when switching type to avoid empty lists
                        }}
                        className={`flex-1 px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border text-center ${
                            filterType === type.id 
                                ? type.id === 'income' ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-100'
                                : type.id === 'expense' ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-100'
                                : type.id === 'debt' ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100'
                                : type.id === 'transfer' ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-100'
                                : 'bg-gray-800 text-white border-gray-800 shadow-md'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {type.label}
                    </button>
                ))}
          </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-50 p-4 space-y-4 min-h-[50vh]">
        
        {/* Active Filter Chips */}
        {isFilterActive && (
            <div className="flex flex-wrap gap-2">
                {filterDateMode === 'custom' && (
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 flex items-center">
                        {t('time.custom')} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setFilterDateMode('default')} />
                    </span>
                )}
                {/* Removed Filter Type Chip since we have Tabs now */}
                {filterCategory && (
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 flex items-center">
                        {filterCategory.name} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setFilterCategory(null)} />
                    </span>
                )}
                <button 
                    onClick={() => { setFilterType('all'); setFilterCategory(null); setFilterDateMode('default'); }}
                    className="px-3 py-1 text-xs font-bold text-red-500"
                >
                    {t('common.delete')}
                </button>
            </div>
        )}

        {/* --- VIEW CONTENT --- */}
        
        {viewMode === 'list' ? (
             renderTransactionList(transactionsByDate)
        ) : (
             <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                 {/* Calendar Grid */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
                     {/* Weekday Headers */}
                     <div className="grid grid-cols-7 mb-2">
                         {weekDays.map((d, i) => (
                             <div key={i} className={`text-center text-[10px] font-bold uppercase ${i===0||i===6 ? 'text-red-400' : 'text-gray-400'}`}>
                                 {d}
                             </div>
                         ))}
                     </div>
                     {/* Days */}
                     <div className="grid grid-cols-7 gap-1">
                         {calendarCells.map((cell, idx) => {
                             if (!cell) return <div key={idx} className="h-14"></div>;
                             
                             const isSelected = selectedDate.toDateString() === cell.date.toDateString();
                             const isToday = new Date().toDateString() === cell.date.toDateString();
                             
                             return (
                                 <div 
                                    key={idx} 
                                    onClick={() => setSelectedDate(cell.date)}
                                    className={`h-14 flex flex-col items-center justify-start pt-1.5 rounded-xl cursor-pointer border transition-all ${isSelected ? 'border-green-500 bg-green-50 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                                 >
                                     <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700'}`}>
                                         {cell.day}
                                     </span>
                                     <div className="flex gap-1">
                                         {cell.income > 0 && <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>}
                                         {cell.expense > 0 && <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>}
                                     </div>
                                 </div>
                             )
                         })}
                     </div>
                 </div>

                 {/* Transactions for Selected Date */}
                 <div className="mt-2">
                     <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="text-sm font-bold text-gray-700 uppercase">
                            {selectedDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        {/* Summary for the day */}
                        {(calendarCells.find(c => c && c.date.getTime() === selectedDate.getTime())?.income || 0) > 0 || 
                         (calendarCells.find(c => c && c.date.getTime() === selectedDate.getTime())?.expense || 0) > 0 ? (
                             <div className="flex space-x-2 text-xs font-medium">
                                 <span className="text-sky-500">+{formatCurrency(calendarCells.find(c => c && c.date.getTime() === selectedDate.getTime())?.income || 0)}</span>
                                 <span className="text-red-500">-{formatCurrency(calendarCells.find(c => c && c.date.getTime() === selectedDate.getTime())?.expense || 0)}</span>
                             </div>
                         ) : null}
                     </div>
                     {renderTransactionList({
                         [selectedDate.toISOString().split('T')[0]]: transactionsByDate[selectedDate.toISOString().split('T')[0]] || []
                     })}
                 </div>
             </div>
        )}

      </div>

      {/* Filter Modal */}
      {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilterModal(false)}></div>
              <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 relative z-10 animate-in slide-in-from-bottom duration-300">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900">{t('filter.title')}</h2>
                      <button onClick={() => setShowFilterModal(false)} className="bg-gray-100 p-1.5 rounded-full"><X className="w-5 h-5 text-gray-500"/></button>
                  </div>

                  <div className="space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar pb-20">
                      
                      {/* 1. Date Range Section */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">{t('time.today')}?</label>
                          <div className="flex bg-gray-100 p-1 rounded-xl mb-3">
                              <button 
                                  onClick={() => setFilterDateMode('default')}
                                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${filterDateMode === 'default' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                              >
                                  Default View
                              </button>
                              <button 
                                  onClick={() => setFilterDateMode('custom')}
                                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${filterDateMode === 'custom' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                              >
                                  {t('time.custom')}
                              </button>
                          </div>
                          
                          {filterDateMode === 'custom' && (
                              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                  <div className="flex-1">
                                      <span className="text-[10px] text-gray-400 uppercase font-bold">{t('time.from')}</span>
                                      <button 
                                        onClick={() => setShowStartCalendar(true)}
                                        className="w-full text-left font-bold text-gray-800 mt-1"
                                      >
                                        {new Date(customStart).toLocaleDateString('vi-VN')}
                                      </button>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-gray-300" />
                                  <div className="flex-1 text-right">
                                      <span className="text-[10px] text-gray-400 uppercase font-bold">{t('time.to')}</span>
                                      <button 
                                        onClick={() => setShowEndCalendar(true)}
                                        className="w-full text-right font-bold text-gray-800 mt-1"
                                      >
                                        {new Date(customEnd).toLocaleDateString('vi-VN')}
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* 2. Type Section */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Type</label>
                          <div className="flex flex-wrap gap-2">
                              {[
                                { id: 'all', label: t('type.all') }, 
                                { id: 'expense', label: t('type.expense') }, 
                                { id: 'income', label: t('type.income') }, 
                                { id: 'debt', label: t('type.debt') },
                                { id: 'transfer', label: t('type.transfer') }
                              ].map(type => (
                                  <button
                                      key={type.id}
                                      onClick={() => { setFilterType(type.id as any); setFilterCategory(null); }}
                                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${filterType === type.id ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 text-gray-600'}`}
                                  >
                                      {type.label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* 3. Category Section */}
                      {filterType !== 'transfer' && (
                          <div>
                              <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">{t('filter.category')}</label>
                              <button 
                                    onClick={() => setShowCategoryPicker(true)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 active:bg-gray-100"
                              >
                                    <div className="flex items-center space-x-3">
                                        {filterCategory ? (
                                            <>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${filterCategory.color.split(' ')[0]}`}>
                                                    {React.createElement(IconMap[filterCategory.icon] || MoreHorizontal, { className: `w-4 h-4 ${filterCategory.color.split(' ')[1]}` })}
                                                </div>
                                                <span className="font-bold text-gray-900">{filterCategory.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <Filter className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <span className="font-medium text-gray-500">{t('filter.all_categories')}</span>
                                            </>
                                        )}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                              </button>
                          </div>
                      )}

                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-3">
                      <button 
                          onClick={() => {
                              setFilterType('all');
                              setFilterCategory(null);
                              setFilterDateMode('default');
                              setShowFilterModal(false);
                          }}
                          className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600"
                      >
                          {t('common.reset')}
                      </button>
                      <button 
                          onClick={() => setShowFilterModal(false)}
                          className="flex-[2] py-3 bg-green-500 rounded-xl font-bold text-white shadow-lg shadow-green-200"
                      >
                          {t('common.apply')} ({filteredTransactions.length})
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trash2 className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Xóa giao dịch?</h3>
                      <p className="text-sm text-gray-500 mt-2">Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.</p>
                  </div>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setDeleteId(null)}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                          {t('common.cancel')}
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                      >
                          {t('common.delete')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Category Picker Overlay */}
      {showCategoryPicker && renderCategoryPicker()}

      {/* Filter Start Date Calendar */}
      {showStartCalendar && (
          <CalendarPicker 
              selectedDate={new Date(customStart)}
              onSelect={(d) => setCustomStart(d.toISOString().split('T')[0])}
              onClose={() => setShowStartCalendar(false)}
          />
      )}

      {/* Filter End Date Calendar */}
      {showEndCalendar && (
          <CalendarPicker 
              selectedDate={new Date(customEnd)}
              onSelect={(d) => setCustomEnd(d.toISOString().split('T')[0])}
              onClose={() => setShowEndCalendar(false)}
          />
      )}
    </div>
  );
};