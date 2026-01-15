
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TransactionsView } from './components/TransactionsView';
import { OverviewView } from './components/OverviewView';
import { AddTransaction } from './components/AddTransaction';
import { BudgetView } from './components/BudgetView';
import { AccountView } from './components/AccountView';
import { RecurringTransactionsView } from './components/RecurringTransactionsView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { AssetsView } from './components/AssetsView';
import { DebtRepaymentView } from './components/DebtRepaymentView';
import { CategoryListView } from './components/CategoryListView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { PinLock } from './components/PinLock';
import { useLanguage } from './contexts/LanguageContext';
import { 
  Transaction, 
  RecurringTransaction, 
  SavingsGoal, 
  Budget, 
  Asset, 
  CategoryItem, 
  AllCategories,
  TabId,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  DEBT_CATEGORIES
} from './types';
import { db } from './utils/db';

const App: React.FC = () => {
  const { user, pin, isLocked, setIsLocked } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [currentView, setCurrentView] = useState<string>('main');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  const [categories, setCategories] = useState<AllCategories>({
      expense: EXPENSE_CATEGORIES,
      income: INCOME_CATEGORIES,
      debt: DEBT_CATEGORIES
  });

  const [isDbReady, setIsDbReady] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
        try {
            await db.init();
            
            const txs = await db.getAll<Transaction>('transactions');
            setTransactions(txs || []);

            const savedCats = await db.getMeta<AllCategories>('categories');
            if (savedCats) setCategories(savedCats);

            const rec = await db.getAll<RecurringTransaction>('recurring');
            setRecurringTransactions(rec || []);

            const goals = await db.getAll<SavingsGoal>('goals');
            setSavingsGoals(goals || []);

            const buds = await db.getAll<Budget>('budgets');
            setBudgets(buds || []);

            const assts = await db.getAll<Asset>('assets');
            setAssets(assts || []);

            setIsDbReady(true);
        } catch (e) {
            console.error("Lỗi khởi tạo database:", e);
            setIsDbReady(true);
        }
    };
    init();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => { if (isDbReady) db.saveAll('transactions', transactions); }, [transactions, isDbReady]);
  useEffect(() => { if (isDbReady) db.saveMeta('categories', categories); }, [categories, isDbReady]);
  useEffect(() => { if (isDbReady) db.saveAll('recurring', recurringTransactions); }, [recurringTransactions, isDbReady]);
  useEffect(() => { if (isDbReady) db.saveAll('goals', savingsGoals); }, [savingsGoals, isDbReady]);
  useEffect(() => { if (isDbReady) db.saveAll('budgets', budgets); }, [budgets, isDbReady]);
  useEffect(() => { if (isDbReady) db.saveAll('assets', assets); }, [assets, isDbReady]);

  const handleSaveTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...newTxData, id: t.id } : t));
        setEditingTransaction(null);
    } else {
        const tx: Transaction = { ...newTxData, id: Date.now().toString() };
        setTransactions(prev => [tx, ...prev]);
    }
    setShowAddModal(false);
  };

  const handleUpdateBudgets = (newBudgets: Budget[]) => {
      setBudgets(prev => {
          const updated = [...prev];
          newBudgets.forEach(nb => {
              const idx = updated.findIndex(b => b.categoryId === nb.categoryId);
              if (idx > -1) updated[idx] = nb;
              else updated.push(nb);
          });
          return updated;
      });
  };

  const handleDeleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const handleEditTransaction = (tx: Transaction) => { setEditingTransaction(tx); setShowAddModal(true); };

  const handleAddCategory = (type: 'expense' | 'income' | 'debt', newCat: CategoryItem) => {
      setCategories(prev => ({ ...prev, [type]: [...prev[type], newCat] }));
  };
  
  const handleUpdateCategory = (updatedCat: CategoryItem) => {
      setCategories(prev => {
          const newCats = { ...prev };
          if (newCats.expense.some(c => c.id === updatedCat.id)) newCats.expense = newCats.expense.map(c => c.id === updatedCat.id ? updatedCat : c);
          else if (newCats.income.some(c => c.id === updatedCat.id)) newCats.income = newCats.income.map(c => c.id === updatedCat.id ? updatedCat : c);
          else if (newCats.debt.some(c => c.id === updatedCat.id)) newCats.debt = newCats.debt.map(c => c.id === updatedCat.id ? updatedCat : c);
          return newCats;
      });
  };

  const handleDeleteCategory = (id: string) => {
      setCategories(prev => ({
          expense: prev.expense.filter(c => c.id !== id),
          income: prev.income.filter(c => c.id !== id),
          debt: prev.debt.filter(c => c.id !== id)
      }));
  };

  const handleRestoreData = (fullData: any) => {
      if (fullData.transactions) setTransactions(fullData.transactions);
      if (fullData.categories) setCategories(fullData.categories);
      if (fullData.recurring) setRecurringTransactions(fullData.recurring);
      if (fullData.goals) setSavingsGoals(fullData.goals);
      if (fullData.budgets) setBudgets(fullData.budgets);
      if (fullData.assets) setAssets(fullData.assets);
      
      // Nếu dữ liệu khôi phục là mảng cũ (chỉ có giao dịch)
      if (Array.isArray(fullData)) {
          setTransactions(fullData);
      }
      
      alert("Khôi phục dữ liệu Elite thành công!");
  };

  if (!user) return <LoginView />;
  if (isLocked && pin) return <PinLock onUnlock={(code) => { if (code === pin) { setIsLocked(false); return true; } return false; }} />;

  if (activeTab === 'account') {
      if (currentView === 'assets') return <AssetsView onBack={() => setCurrentView('main')} assets={assets} transactions={transactions} onAddAsset={a => setAssets(p => [...p, a])} onUpdateAsset={a => setAssets(p => p.map(x => x.id === a.id ? a : x))} onDeleteAsset={id => setAssets(p => p.filter(x => x.id !== id))} />;
      if (currentView === 'goals') return <SavingsGoalsView onBack={() => setCurrentView('main')} goals={savingsGoals} onAdd={g => setSavingsGoals(p => [...p, g])} onUpdate={g => setSavingsGoals(p => p.map(x => x.id === g.id ? g : x))} onDelete={id => setSavingsGoals(p => p.filter(x => x.id !== id))} />;
      if (currentView === 'recurring') return <RecurringTransactionsView onBack={() => setCurrentView('main')} recurringTransactions={recurringTransactions} categories={categories} onAdd={r => setRecurringTransactions(p => [...p, r])} onDelete={id => setRecurringTransactions(p => p.filter(x => x.id !== id))} />;
      if (currentView === 'debts') return <DebtRepaymentView onBack={() => setCurrentView('main')} transactions={transactions} onPayDebt={(person, amount) => { setTransactions(prev => [{ id: Date.now().toString(), amount, categoryId: 'repay', type: 'debt', date: new Date().toISOString().split('T')[0], note: `Trả nợ cho ${person}`, withPerson: person, walletId: 'cash' }, ...prev]); }} />;
      if (currentView === 'categories') return <CategoryListView onBack={() => setCurrentView('main')} categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} />;
      if (currentView === 'settings') return <SettingsView onBack={() => setCurrentView('main')} installPrompt={deferredPrompt} onInstall={() => deferredPrompt?.prompt()} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-gray-900">
      <Header />
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'overview' && <OverviewView transactions={transactions} categories={categories} budgets={budgets} goals={savingsGoals} assets={assets} onAddTransaction={handleSaveTransaction} onUpdateBudgets={handleUpdateBudgets} />}
        {activeTab === 'transactions' && <TransactionsView transactions={transactions} categories={categories} onDelete={handleDeleteTransaction} onEdit={handleEditTransaction} />}
        {activeTab === 'budget' && <BudgetView transactions={transactions} categories={categories} budgets={budgets} onAddBudget={(b) => setBudgets(prev => [...prev.filter(x => x.categoryId !== b.categoryId), b])} onDeleteBudget={(id) => setBudgets(prev => prev.filter(b => b.categoryId !== id))} />}
        {activeTab === 'account' && currentView === 'main' && <AccountView transactions={transactions} categories={categories} onRestore={handleRestoreData} onImport={d => setTransactions(prev => [...d, ...prev])} onNavigate={setCurrentView} goals={savingsGoals} />}
      </div>
      <BottomNav activeTab={activeTab === 'add' ? 'overview' : activeTab} setActiveTab={(tab) => { if (tab === 'add') setShowAddModal(true); else { setActiveTab(tab); setCurrentView('main'); } }} />
      {showAddModal && <AddTransaction onClose={() => { setShowAddModal(false); setEditingTransaction(null); }} onSave={handleSaveTransaction} categories={categories} onAddCategory={handleAddCategory} initialData={editingTransaction} history={transactions} budgets={budgets} onUpdateBudgets={handleUpdateBudgets} />}
    </div>
  );
};

export default App;
