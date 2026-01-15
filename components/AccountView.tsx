
import React, { useRef, useMemo } from 'react';
import { 
  HelpCircle, ChevronRight, FileSpreadsheet, FileText, 
  Wallet, Box, Calendar, Repeat, Receipt, Users, Wrench, 
  Plane, ShoppingCart, Compass, Settings, Info, User,
  Download, UploadCloud, Target, ShieldCheck, FileInput, LogOut, Landmark
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, TransactionType, AllCategories, SavingsGoal, Budget, Asset, RecurringTransaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../utils/db';

interface AccountViewProps {
  transactions: Transaction[];
  onRestore: (data: any) => void;
  onImport: (data: Transaction[]) => void;
  onNavigate: (view: string) => void;
  categories: AllCategories;
  goals?: SavingsGoal[];
}

export const AccountView: React.FC<AccountViewProps> = ({ transactions, onRestore, onImport, onNavigate, categories, goals = [] }) => {
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { t, formatCurrency, user, logout, language, currency } = useLanguage();

  const totalSaved = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  }, [goals]);
  
  const MenuItem = ({ icon: Icon, label, onClick, isDanger = false, isElite = false }: { icon: any, label: string; onClick?: () => void; isDanger?: boolean; isElite?: boolean }) => (
    <div className={`flex items-center justify-between py-4 px-5 active:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${isElite ? 'bg-indigo-50/30' : 'bg-white'}`} onClick={onClick}>
      <div className="flex items-center space-x-4">
         <Icon className={`w-6 h-6 stroke-[1.5px] ${isDanger ? 'text-red-500' : (isElite ? 'text-indigo-600' : 'text-gray-700')}`} />
         <span className={`font-medium text-[15px] ${isDanger ? 'text-red-500' : (isElite ? 'text-indigo-900 font-bold' : 'text-gray-900')}`}>{label}</span>
      </div>
      {!isDanger && <ChevronRight className={`w-5 h-5 ${isElite ? 'text-indigo-400' : 'text-gray-300'}`} />}
    </div>
  );

  const removeAccents = (str: string): string => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^\x20-\x7E]/g, ''); 
  };

  const pdfFormatCurrency = (amount: number): string => {
    const isNegative = amount < 0;
    const absVal = Math.abs(amount);
    const formatted = absVal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const suffix = currency === 'VND' ? ' d' : ` ${currency}`;
    return (isNegative ? '-' : '') + formatted + suffix;
  };

  const getCategoryName = (id: string, type: string) => {
    let list = categories.expense;
    if (type === 'income') list = categories.income;
    if (type === 'debt') list = categories.debt;
    const item = list.find(c => c.id === id);
    return item ? item.name : t('cat.other');
  };

  const findCategoryIdByName = (name: string): string => {
      const allCats = [...categories.expense, ...categories.income, ...categories.debt];
      const found = allCats.find(c => c.name.toLowerCase() === name.toLowerCase().trim());
      if (found) return found.id;
      return 'other_expense'; 
  };

  const getWalletName = (id?: string) => {
      if (id === 'atm') return 'ATM';
      if (id === 'cash') return 'Tiền mặt';
      if (id === 'e-wallet') return 'Ví điện tử';
      return '-';
  };

  const handleExportPDF = () => {
      if (transactions.length === 0) {
          alert("Chưa có dữ liệu giao dịch để xuất báo cáo!");
          return;
      }
      const doc = new jsPDF();
      const now = new Date();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(22, 163, 74);
      doc.text("MONEY MANAGER ELITE", 14, 25);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(removeAccents("He thong Bao cao Tai chinh Chuyen nghiep"), 14, 32);
      doc.setDrawColor(22, 163, 74);
      doc.setLineWidth(0.5);
      doc.line(14, 35, 196, 35);
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text(`${removeAccents("Nguoi dung")}: ${removeAccents(user?.name || 'Khach')}`, 14, 45);
      doc.text(`${removeAccents("Ngay bao cao")}: ${now.toLocaleDateString('vi-VN')}`, 14, 51);
      const income = transactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
      const balance = income - expense;
      autoTable(doc, {
          startY: 65,
          head: [[removeAccents('Phan loai'), removeAccents('So tien')]],
          body: [[removeAccents('Tong Thu Nhap'), pdfFormatCurrency(income)], [removeAccents('Tong Chi Tieu'), pdfFormatCurrency(expense)], [removeAccents('So Du Hien Tai'), pdfFormatCurrency(balance)]],
          theme: 'grid',
          headStyles: { fillColor: [22, 163, 74], font: "helvetica", fontStyle: 'bold', halign: 'center' },
          styles: { font: "helvetica", fontSize: 11, cellPadding: 4, charSpace: 0 },
          columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
      });
      const tableData = transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50).map(t => [
          new Date(t.date).toLocaleDateString('vi-VN'),
          t.type === 'income' ? 'THU' : (t.type === 'expense' ? 'CHI' : 'NO'),
          removeAccents(getCategoryName(t.categoryId, t.type)),
          pdfFormatCurrency(t.amount),
          removeAccents(getWalletName(t.walletId))
      ]);
      autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 15,
          head: [[removeAccents('Ngay'), removeAccents('Loai'), removeAccents('Danh muc'), removeAccents('So tien'), removeAccents('Vi')]],
          body: tableData,
          theme: 'striped',
          styles: { font: "helvetica", fontSize: 8, charSpace: 0 },
          headStyles: { fillColor: [51, 65, 85], fontStyle: 'bold', halign: 'center' }
      });
      doc.save(`Bao_cao_Elite_${now.toISOString().slice(0,10)}.pdf`);
  };

  const handleExportExcel = () => {
    try {
        if (transactions.length === 0) { alert("Chưa có dữ liệu!"); return; }
        const data = transactions.map(t => ({
          'Ngày': new Date(t.date).toLocaleDateString('vi-VN'),
          'Loại': t.type === 'income' ? 'Thu' : (t.type === 'expense' ? 'Chi' : 'Nợ'),
          'Số tiền': t.amount,
          'Danh mục': getCategoryName(t.categoryId, t.type),
          'Ghi chú': t.note || '',
          'Ví': getWalletName(t.walletId),
          'Ví đích': t.destinationWalletId ? getWalletName(t.destinationWalletId) : ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, `MoneyManager_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (error) { alert("Lỗi xuất Excel."); }
  };

  const handleBackup = async () => {
    // Thu thập tất cả dữ liệu từ IndexedDB để tạo bản sao lưu toàn diện
    try {
        const recurring = await db.getAll<RecurringTransaction>('recurring');
        const budgets = await db.getAll<Budget>('budgets');
        const assets = await db.getAll<Asset>('assets');
        
        const fullBackup = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            transactions,
            categories,
            goals,
            recurring,
            budgets,
            assets
        };

        const dataStr = JSON.stringify(fullBackup, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MoneyManager_Elite_Backup_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
    } catch (error) {
        alert("Lỗi khi tạo bản sao lưu.");
    }
  };

  const handleRestoreClick = () => { 
      if (window.confirm("CẢNH BÁO: Hành động này sẽ thay thế TOÀN BỘ dữ liệu hiện tại bằng dữ liệu từ file sao lưu. Bạn có chắc chắn muốn tiếp tục?")) {
          restoreInputRef.current?.click(); 
      }
  };

  const onRestoreFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; 
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try { 
            const content = e.target?.result as string;
            const parsed = JSON.parse(content);
            
            // Kiểm tra cấu trúc cơ bản để đảm bảo file hợp lệ
            if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) {
                onRestore(parsed); 
            } else {
                alert('Định dạng file sao lưu không hợp lệ.');
            }
        } catch (error) { 
            alert('Không thể đọc file sao lưu. Vui lòng kiểm tra lại file của bạn.'); 
        }
        if (restoreInputRef.current) restoreInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => importInputRef.current?.click();
  const onImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const workbook = XLSX.read(e.target?.result, { type: 'binary' });
              const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
              const parsed: Transaction[] = json.map((row: any) => ({
                  id: (Date.now() + Math.random()).toString(),
                  date: new Date().toISOString().split('T')[0],
                  amount: Number(row['Số tiền'] || row['Amount'] || 0),
                  type: (row['Loại']?.toString().toLowerCase().includes('thu') ? 'income' : 'expense') as TransactionType,
                  categoryId: findCategoryIdByName(row['Danh mục'] || ''),
                  walletId: row['Ví']?.toString().toLowerCase().includes('điện tử') ? 'e-wallet' : (row['Ví']?.toString().toLowerCase().includes('atm') ? 'atm' : 'cash')
              }));
              onImport(parsed);
          } catch (error) { alert('Lỗi nhập file.'); }
          if (importInputRef.current) importInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-slate-50 h-full overflow-y-auto pb-24">
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.account')}</h1>
        <button className="flex items-center space-x-1 text-gray-800"><HelpCircle className="w-5 h-5" /></button>
      </div>
      
      {/* Profile Header */}
      <div className="bg-white flex flex-col items-center pt-6 pb-8 mb-2 shadow-sm relative overflow-hidden">
         <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-3 shadow-lg border-2 border-white overflow-hidden relative z-10">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <span className="text-4xl text-white font-bold">{user?.name?.charAt(0) || 'U'}</span>}
         </div>
         <h2 className="text-xl font-black text-gray-900 z-10 uppercase tracking-tight">{user?.name || 'Khách'}</h2>
         <p className="text-gray-400 font-bold text-[10px] z-10 uppercase tracking-widest">{user?.email || 'Elite Member'}</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="px-4 mb-4 grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Đã tích lũy</span>
              <span className="text-base font-black text-emerald-600">{formatCurrency(totalSaved)}</span>
          </div>
          <div className="bg-white p-4 rounded-3xl border grid items-center border-gray-100 shadow-sm">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Mục tiêu</span>
              <span className="text-base font-black text-gray-900">{goals.length} đang chạy</span>
          </div>
      </div>

      <div className="space-y-3">
         <div className="bg-white">
            <MenuItem icon={Landmark} label={t('account.assets')} onClick={() => onNavigate('assets')} isElite={true} />
            <MenuItem icon={Target} label={t('account.goals')} onClick={() => onNavigate('goals')} isElite={true} />
         </div>
         
         <div className="bg-white">
            <MenuItem icon={FileSpreadsheet} label={t('account.export')} onClick={handleExportExcel} />
            <MenuItem icon={FileText} label={t('account.export_pdf')} onClick={handleExportPDF} />
         </div>

         <input type="file" ref={restoreInputRef} className="hidden" accept=".json" onChange={onRestoreFileChange}/>
         <input type="file" ref={importInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={onImportFileChange}/>
         
         <div className="bg-white">
             <MenuItem icon={Box} label={t('account.categories')} onClick={() => onNavigate('categories')} />
             <MenuItem icon={Repeat} label={t('account.recurring')} onClick={() => onNavigate('recurring')} />
         </div>
         
         <div className="bg-white">
             <MenuItem icon={FileInput} label="Nhập từ Excel/CSV" onClick={handleImportClick} />
             <MenuItem icon={Download} label={t('account.backup')} onClick={handleBackup}/>
             <MenuItem icon={UploadCloud} label={t('account.restore')} onClick={handleRestoreClick}/>
         </div>
         
         <div className="bg-white">
            <MenuItem icon={Settings} label={t('account.settings')} onClick={() => onNavigate('settings')} />
            <MenuItem icon={LogOut} label={t('account.logout')} onClick={() => logout()} isDanger={true} />
         </div>
      </div>
    </div>
  );
};
