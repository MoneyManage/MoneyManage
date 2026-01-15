
export type TransactionType = 'income' | 'expense' | 'debt' | 'transfer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'zalo' | 'guest';
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string;
  parentId?: string; // Support for sub-categories
}

export interface AllCategories {
  expense: CategoryItem[];
  income: CategoryItem[];
  debt: CategoryItem[];
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  note?: string;
  date: string; // ISO string
  type: TransactionType;
  walletId?: string; // 'atm', 'cash'
  destinationWalletId?: string; // For transfer: target wallet
  withPerson?: string;
  event?: string;
  hasReminder?: boolean;
  image?: string; // placeholder for image path
  excludeFromReport?: boolean;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  amount: number;
  categoryId: string;
  note?: string;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  startDate: string; // ISO Date string
  nextDueDate: string; // ISO Date string
  walletId: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  icon: string;
  deadline?: string;
  status: 'active' | 'completed';
  reminderFrequency?: 'none' | 'weekly' | 'monthly'; // New: Frequency
  nextReminderDate?: string; // New: Next due date for deposit
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  type: 'gold' | 'real_estate' | 'stock' | 'crypto' | 'saving' | 'cash' | 'other';
  note?: string;
  updatedAt: string;
}

export interface Budget {
    categoryId: string;
    limit: number;
}

export type TabId = 'overview' | 'transactions' | 'add' | 'budget' | 'account';

// Expanded Categories based on screenshots
export const EXPENSE_CATEGORIES: CategoryItem[] = [
  // A - Ăn uống
  { id: 'food', name: 'Ăn uống', icon: 'Utensils', color: 'bg-orange-100 text-orange-600' },
  { id: 'spices', name: 'Dầu ăn, Gia vị', icon: 'ChefHat', color: 'bg-yellow-200 text-red-600', parentId: 'food' },
  { id: 'restaurant', name: 'Nhà hàng', icon: 'Soup', color: 'bg-red-800 text-yellow-200', parentId: 'food' },

  // C - Các chi phí khác, Chăm sóc, Chi phí, Cưới hỏi
  { id: 'other_expense', name: 'Các chi phí khác', icon: 'Box', color: 'bg-slate-700 text-yellow-400' },
  
  { id: 'personal_care', name: 'Chăm sóc cá nhân', icon: 'SprayCan', color: 'bg-sky-500 text-white' },
  
  { id: 'fees', name: 'Chi phí', icon: 'Receipt', color: 'bg-yellow-100 text-red-500' },
  
  { id: 'wedding', name: 'Cưới hỏi', icon: 'HeartHandshake', color: 'bg-slate-700 text-white' },

  // D - Di chuyển, Du lịch
  { id: 'transport', name: 'Di chuyển', icon: 'Car', color: 'bg-orange-100 text-orange-600' },
  { id: 'vehicle_maintenance', name: 'Bảo dưỡng xe', icon: 'Wrench', color: 'bg-slate-600 text-slate-100', parentId: 'transport' },
  { id: 'fuel', name: 'Xăng dầu', icon: 'Fuel', color: 'bg-red-100 text-red-600', parentId: 'transport' },
  { id: 'parking', name: 'Gửi xe', icon: 'ParkingCircle', color: 'bg-yellow-100 text-yellow-600', parentId: 'transport' },
  { id: 'taxi', name: 'Taxi', icon: 'CarTaxiFront', color: 'bg-slate-500 text-white', parentId: 'transport' },

  { id: 'travel', name: 'Du lịch', icon: 'Plane', color: 'bg-slate-700 text-white' },

  // Đ - Đầu tư
  { id: 'investment_exp', name: 'Đầu tư', icon: 'BarChart3', color: 'bg-yellow-200 text-blue-600' },

  // G - Gia đình, Giải trí, Giáo dục, Giày dép
  { id: 'family', name: 'Gia đình', icon: 'Home', color: 'bg-teal-600 text-white' },
  { id: 'children', name: 'Con cái', icon: 'Baby', color: 'bg-slate-700 text-white', parentId: 'family' },
  { id: 'family_service', name: 'Dịch vụ gia đình', icon: 'Home', color: 'bg-red-500 text-white', parentId: 'family' },
  { id: 'home_repair', name: 'Sửa chữa nhà cửa', icon: 'Hammer', color: 'bg-teal-500 text-white', parentId: 'family' },
  { id: 'pets', name: 'Vật nuôi', icon: 'PawPrint', color: 'bg-orange-200 text-orange-700', parentId: 'family' },

  { id: 'entertainment', name: 'Giải trí', icon: 'Gamepad2', color: 'bg-sky-400 text-white' },
  { id: 'movies', name: 'Phim ảnh', icon: 'Clapperboard', color: 'bg-slate-700 text-white', parentId: 'entertainment' },
  { id: 'games', name: 'Trò chơi', icon: 'Ghost', color: 'bg-teal-400 text-white', parentId: 'entertainment' },

  { id: 'education', name: 'Giáo dục', icon: 'GraduationCap', color: 'bg-teal-700 text-white' },
  { id: 'books', name: 'Sách', icon: 'BookOpen', color: 'bg-blue-800 text-white', parentId: 'education' },

  { id: 'shoes', name: 'Giày dép', icon: 'Footprints', color: 'bg-green-600 text-yellow-300' },

  // H - Hoá đơn
  { id: 'bills', name: 'Hoá đơn & Tiện ích', icon: 'FileText', color: 'bg-slate-700 text-white' },
  { id: 'electric_bill', name: 'Hoá đơn điện', icon: 'Zap', color: 'bg-yellow-100 text-yellow-600', parentId: 'bills' },
  { id: 'phone_bill', name: 'Hoá đơn điện thoại', icon: 'Phone', color: 'bg-red-100 text-slate-700', parentId: 'bills' },
  { id: 'gas_bill', name: 'Hoá đơn gas', icon: 'Flame', color: 'bg-blue-800 text-red-500', parentId: 'bills' },
  { id: 'internet_bill', name: 'Hoá đơn internet', icon: 'Wifi', color: 'bg-teal-100 text-teal-600', parentId: 'bills' },
  { id: 'water_bill', name: 'Hoá đơn nước', icon: 'Droplets', color: 'bg-sky-100 text-sky-500', parentId: 'bills' },
  { id: 'tv_bill', name: 'Hoá đơn TV', icon: 'Tv', color: 'bg-teal-600 text-slate-800', parentId: 'bills' },
  { id: 'rent', name: 'Thuê nhà', icon: 'Building', color: 'bg-slate-800 text-white', parentId: 'bills' },

  // K - Kinh doanh
  { id: 'business', name: 'Kinh doanh', icon: 'Briefcase', color: 'bg-slate-700 text-orange-400' },

  // M - Mua sắm
  { id: 'shopping', name: 'Mua sắm', icon: 'ShoppingBasket', color: 'bg-slate-700 text-teal-400' },

  // P - Phụ kiện
  { id: 'accessories', name: 'Phụ kiện', icon: 'Gem', color: 'bg-yellow-400 text-red-600' },

  // Q - Quà tặng, Quần áo
  { id: 'gifts', name: 'Quà tặng & Quyên góp', icon: 'Gift', color: 'bg-teal-100 text-red-500' },
  { id: 'clothes', name: 'Quần áo', icon: 'Shirt', color: 'bg-yellow-400 text-blue-800' },

  // R - Rút tiền
  { id: 'withdraw', name: 'Rút tiền', icon: 'Banknote', color: 'bg-red-400 text-green-800' },

  // S - Sức khỏe
  { id: 'health', name: 'Sức khỏe', icon: 'BriefcaseMedical', color: 'bg-slate-700 text-white' },
  { id: 'medical', name: 'Khám chữa bệnh', icon: 'Stethoscope', color: 'bg-teal-500 text-white', parentId: 'health' },
  { id: 'pharmacy', name: 'Thuốc', icon: 'Pill', color: 'bg-sky-500 text-red-500', parentId: 'health' },

  // T - Tang lễ, Thể thao, Thiết bị, Từ thiện
  { id: 'funeral', name: 'Tang lễ', icon: 'Church', color: 'bg-slate-600 text-orange-200' },
  
  { id: 'sport', name: 'Thể thao', icon: 'Dumbbell', color: 'bg-teal-500 text-white' },
  
  { id: 'electronics', name: 'Thiết bị điện tử', icon: 'Smartphone', color: 'bg-orange-400 text-white' },

  { id: 'charity', name: 'Từ thiện', icon: 'HandCoins', color: 'bg-slate-700 text-teal-400' },
];

export const INCOME_CATEGORIES: CategoryItem[] = [
  { id: 'salary', name: 'Lương', icon: 'Banknote', color: 'bg-green-100 text-green-600' },
  { id: 'bonus', name: 'Thưởng', icon: 'Gift', color: 'bg-teal-100 text-teal-600' },
  { id: 'investment', name: 'Đầu tư', icon: 'TrendingUp', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'other_income', name: 'Khác', icon: 'MoreHorizontal', color: 'bg-gray-100 text-gray-600' },
];

export const DEBT_CATEGORIES: CategoryItem[] = [
  { id: 'loan', name: 'Cho vay', icon: 'CreditCard', color: 'bg-blue-100 text-blue-600' },
  { id: 'debt', name: 'Đi vay', icon: 'Banknote', color: 'bg-red-100 text-red-600' },
  { id: 'collect', name: 'Thu nợ', icon: 'TrendingUp', color: 'bg-green-100 text-green-600' },
  { id: 'repay', name: 'Trả nợ', icon: 'Gift', color: 'bg-orange-100 text-orange-600' },
];