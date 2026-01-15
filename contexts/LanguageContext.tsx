
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';

type Language = 'vi' | 'en';
export type CurrencyCode = 'VND' | 'USD' | 'EUR' | 'JPY' | 'KRW' | 'CNY';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  pin: string | null;
  setPin: (pin: string | null) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  t: (key: string) => string;
  formatDate: (date: Date | string) => string;
  formatCurrency: (amount: number) => string;
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Nav
    'nav.overview': 'Tổng quan',
    'nav.transactions': 'Sổ giao dịch',
    'nav.add': 'Thêm giao dịch',
    'nav.budget': 'Ngân sách',
    'nav.account': 'Tài khoản',
    
    // Time
    'time.day': 'Ngày',
    'time.week': 'Tuần',
    'time.month': 'Tháng',
    'time.year': 'Năm',
    'time.today': 'Hôm nay',
    'time.custom': 'Tùy chỉnh',
    'time.from': 'Từ ngày',
    'time.to': 'Đến ngày',

    // Transaction Types
    'type.income': 'Khoản thu',
    'type.expense': 'Khoản chi',
    'type.debt': 'Vay/Nợ',
    'type.transfer': 'Chuyển khoản',
    'type.all': 'Tất cả',
    'type.loan': 'Cho vay',
    'type.collect': 'Thu nợ',
    'type.repay': 'Trả nợ',

    // General
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'common.edit': 'Sửa',
    'common.add': 'Thêm',
    'common.total': 'Tổng cộng',
    'common.balance': 'Số dư',
    'common.search': 'Tìm kiếm',
    'common.note': 'Ghi chú',
    'common.apply': 'Áp dụng',
    'common.reset': 'Đặt lại',
    'common.back': 'Quay lại',
    'common.confirm_delete': 'Bạn có chắc chắn muốn xóa?',
    'common.select_category': 'Chọn danh mục',
    
    // Login
    'login.welcome': 'Chào mừng đến với MoneyManager',
    'login.subtitle': 'Quản lý tài chính cá nhân hiệu quả',
    'login.google': 'Tiếp tục với Google',
    'login.zalo': 'Tiếp tục với Zalo',
    'login.guest': 'Dùng thử không cần tài khoản',
    'login.policy': 'Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi.',

    // Tooltips
    'tooltip.show_balance': 'Hiện số dư',
    'tooltip.hide_balance': 'Ẩn số dư',
    'tooltip.ai_advisor': 'Trợ lý AI (Phân tích chi tiêu)',
    'tooltip.view_list': 'Xem danh sách',
    'tooltip.view_calendar': 'Xem lịch',
    'tooltip.filter': 'Bộ lọc & Tìm kiếm nâng cao',
    'tooltip.export_csv': 'Xuất file CSV',
    'tooltip.export_excel': 'Xuất file Excel',
    'tooltip.voice_input': 'Nhập bằng giọng nói',
    'tooltip.scan_receipt': 'Quét hóa đơn',
    'tooltip.calc_settings': 'Cài đặt bàn phím',
    'tooltip.sort': 'Sắp xếp danh mục',
    'tooltip.help': 'Trợ giúp',
    'tooltip.menu': 'Menu mở rộng',
    'tooltip.previous': 'Trước',
    'tooltip.next': 'Sau',
    'tooltip.split_money': 'Tư vấn phân bổ tiền',

    // Account & Settings
    'account.settings': 'Cài đặt',
    'account.language': 'Ngôn ngữ',
    'account.currency': 'Tiền tệ',
    'account.support': 'Hỗ trợ',
    'account.export': 'Xuất ra Excel',
    'account.export_pdf': 'Báo cáo PDF (Pro)',
    'account.backup': 'Sao lưu dữ liệu',
    'account.restore': 'Khôi phục dữ liệu',
    'account.recurring': 'Giao dịch định kỳ',
    'account.goals': 'Mục tiêu tiết kiệm',
    'account.assets': 'Tài sản & Net Worth (Elite)',
    'account.categories': 'Quản lý danh mục',
    'account.wallets': 'Ví của tôi',
    'account.appearance': 'Giao diện',
    'account.logout': 'Đăng xuất',
    'settings.title': 'Cài đặt',
    'settings.select_lang': 'Chọn ngôn ngữ',
    'settings.select_curr': 'Chọn đơn vị tiền tệ',
    'settings.security': 'Bảo mật & Mã khóa',
    'settings.set_pin': 'Thiết lập mã khóa',
    'settings.remove_pin': 'Xóa mã khóa',

    // Overview
    'overview.total_balance': 'Tổng số dư',
    'overview.structure': 'Cơ cấu chi tiêu',
    'overview.trend': 'Xu hướng chi tiêu',
    'overview.top': 'Top chi tiêu',
    'overview.wallet_cash': 'Tiền mặt',
    'overview.wallet_atm': 'ATM',
    'overview.in': 'Vào',
    'overview.out': 'Ra',
    'overview.remaining': 'Còn lại',

    // Filter
    'filter.title': 'Bộ lọc tìm kiếm',
    'filter.category': 'Danh mục',
    'filter.all_categories': 'Tất cả danh mục',

    // Assets
    'asset.title': 'Tài sản',
    'asset.net_worth': 'Giá trị ròng',
    'asset.add': 'Thêm tài sản',
    'asset.type': 'Loại tài sản',
    'asset.gold': 'Vàng',
    'asset.real_estate': 'Bất động sản',
    'asset.stock': 'Chứng khoán',
    'asset.crypto': 'Tiền điện tử',
    'asset.saving': 'Sổ tiết kiệm',
    'asset.cash': 'Tiền mặt khác',
    'asset.other': 'Khác',

    // Category Placeholders
    'cat.other': 'Khác',
  },
  en: {
    // Nav
    'nav.overview': 'Overview',
    'nav.transactions': 'Transactions',
    'nav.add': 'Add Transaction',
    'nav.budget': 'Budget',
    'nav.account': 'Account',
    
    // Time
    'time.day': 'Day',
    'time.week': 'Week',
    'time.month': 'Month',
    'time.year': 'Year',
    'time.today': 'Today',
    'time.custom': 'Custom',
    'time.from': 'From',
    'time.to': 'To',

    // Transaction Types
    'type.income': 'Income',
    'type.expense': 'Expense',
    'type.debt': 'Debt/Loan',
    'type.transfer': 'Transfer',
    'type.all': 'All',
    'type.loan': 'Lending',
    'type.collect': 'Debt Collection',
    'type.repay': 'Repayment',

    // General
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.total': 'Total',
    'common.balance': 'Balance',
    'common.search': 'Search',
    'common.note': 'Note',
    'common.apply': 'Apply',
    'common.reset': 'Reset',
    'common.back': 'Back',
    'common.confirm_delete': 'Are you sure you want to delete?',
    'common.select_category': 'Select Category',

    // Login
    'login.welcome': 'Welcome to MoneyManager',
    'login.subtitle': 'Manage your personal finances effectively',
    'login.google': 'Continue with Google',
    'login.zalo': 'Continue with Zalo',
    'login.guest': 'Continue as Guest',
    'login.policy': 'By registering, you agree to our Terms of Service and Privacy Policy.',

    // Tooltips
    'tooltip.show_balance': 'Show balance',
    'tooltip.hide_balance': 'Hide balance',
    'tooltip.ai_advisor': 'AI Advisor',
    'tooltip.view_list': 'List view',
    'tooltip.view_calendar': 'Calendar view',
    'tooltip.filter': 'Filter & Advanced Search',
    'tooltip.export_csv': 'Export CSV',
    'tooltip.export_excel': 'Export Excel',
    'tooltip.voice_input': 'Voice input',
    'tooltip.scan_receipt': 'Scan receipt',
    'tooltip.calc_settings': 'Calculator settings',
    'tooltip.sort': 'Sort categories',
    'tooltip.help': 'Help',
    'tooltip.menu': 'Menu',
    'tooltip.previous': 'Previous',
    'tooltip.next': 'Next',
    'tooltip.split_money': 'Income Allocation Advice',
    
    // Account & Settings
    'account.settings': 'Settings',
    'account.language': 'Language',
    'account.currency': 'Currency',
    'account.support': 'Support',
    'account.export': 'Export to Excel',
    'account.export_pdf': 'PDF Report (Pro)',
    'account.backup': 'Backup Data',
    'account.restore': 'Restore Data',
    'account.recurring': 'Recurring Transactions',
    'account.goals': 'Savings Goals',
    'account.assets': 'Assets & Net Worth (Elite)',
    'account.categories': 'Manage Categories',
    'account.wallets': 'My Wallets',
    'account.appearance': 'Appearance',
    'account.logout': 'Logout',
    'settings.title': 'Settings',
    'settings.select_lang': 'Select Language',
    'settings.select_curr': 'Select Currency',
    'settings.security': 'Security & Passcode',
    'settings.set_pin': 'Set Passcode',
    'settings.remove_pin': 'Remove Passcode',

    // Overview
    'overview.total_balance': 'Total Balance',
    'overview.structure': 'Expense Structure',
    'overview.trend': 'Expense Trend',
    'overview.top': 'Top Spending',
    'overview.wallet_cash': 'Cash',
    'overview.wallet_atm': 'ATM',
    'overview.in': 'In',
    'overview.out': 'Out',
    'overview.remaining': 'Left',

    // Filter
    'filter.title': 'Search Filters',
    'filter.category': 'Category',
    'filter.all_categories': 'All Categories',

    // Assets
    'asset.title': 'Assets',
    'asset.net_worth': 'Net Worth',
    'asset.add': 'Add Asset',
    'asset.type': 'Asset Type',
    'asset.gold': 'Gold',
    'asset.real_estate': 'Real Estate',
    'asset.stock': 'Stock',
    'asset.crypto': 'Crypto',
    'asset.saving': 'Savings Account',
    'asset.cash': 'Other Cash',
    'asset.other': 'Other',

    // Category Placeholders
    'cat.other': 'Other',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('vi');
  const [currency, setCurrency] = useState<CurrencyCode>('VND');
  const [pin, setPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('money_manager_lang') as Language;
    if (savedLang) setLanguage(savedLang);

    const savedCurr = localStorage.getItem('money_manager_currency') as CurrencyCode;
    if (savedCurr) setCurrency(savedCurr);

    const savedUser = localStorage.getItem('money_manager_user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
        const savedPin = localStorage.getItem('money_manager_pin');
        if (savedPin) {
            setPin(savedPin);
            setIsLocked(true);
        }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('money_manager_lang', lang);
  };

  const handleSetCurrency = (curr: CurrencyCode) => {
    setCurrency(curr);
    localStorage.setItem('money_manager_currency', curr);
  };

  const handleSetPin = (newPin: string | null) => {
      setPin(newPin);
      if (newPin) {
          localStorage.setItem('money_manager_pin', newPin);
      } else {
          localStorage.removeItem('money_manager_pin');
          setIsLocked(false);
      }
  };

  const handleLogin = (newUser: UserProfile) => {
      setUser(newUser);
      localStorage.setItem('money_manager_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('money_manager_user');
      setIsLocked(false);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const formatDate = (date: Date | string) => {
      const d = new Date(date);
      if (language === 'vi') {
          return d.toLocaleDateString('vi-VN');
      }
      return d.toLocaleDateString('en-US');
  };

  const formatCurrency = (amount: number) => {
      const maxDigits = (currency === 'VND' || currency === 'JPY' || currency === 'KRW') ? 0 : 2;
      
      const formattedValue = amount.toLocaleString('en-US', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: maxDigits 
      });
      
      const symbol = currency === 'VND' ? 'đ' : currency;
      return `${formattedValue} ${symbol}`;
  };

  return (
    <LanguageContext.Provider value={{ 
        language, 
        setLanguage: handleSetLanguage, 
        currency,
        setCurrency: handleSetCurrency,
        pin,
        setPin: handleSetPin,
        isLocked,
        setIsLocked,
        user,
        login: handleLogin,
        logout: handleLogout,
        t, 
        formatDate,
        formatCurrency
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
