import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, Wallet, ChevronRight, Eye, Plus, X, Check,
  Car, Wrench, Fuel, ParkingCircle, CarTaxiFront, Plane, Home, PawPrint, Baby, Hammer, Gamepad2, 
  Ghost, Clapperboard, GraduationCap, BookOpen, Footprints, Shirt, Gem, Box, SprayCan, Receipt, 
  HeartHandshake, Utensils, ChefHat, Soup, BarChart3, FileText, Tv, Zap, Phone, Droplets, Wifi, Flame, 
  Building, BriefcaseMedical, Stethoscope, Pill, Briefcase, ShoppingBasket, HandCoins, Gift, 
  Banknote, Church, Dumbbell, Smartphone, CreditCard, TrendingUp, MoreHorizontal, Star, Heart, Circle,
  ArrowUpFromLine, Edit2, Trash2, CopyPlus, CornerDownRight, ArrowUpDown, ChevronUp, ChevronDown, PlusCircle
} from 'lucide-react';
import { CategoryItem, AllCategories } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

// Map icon strings to React Components
const IconMap: Record<string, React.FC<any>> = {
  Car, Wrench, Fuel, ParkingCircle, CarTaxiFront, Plane, Home, PawPrint, Baby, Hammer, Gamepad2, 
  Ghost, Clapperboard, GraduationCap, BookOpen, Footprints, Shirt, Gem, Box, SprayCan, Receipt, 
  HeartHandshake, Utensils, ChefHat, Soup, BarChart3, FileText, Tv, Zap, Phone, Droplets, Wifi, Flame, 
  Building, BriefcaseMedical, Stethoscope, Pill, Briefcase, ShoppingBasket, HandCoins, Gift, 
  Banknote, Church, Dumbbell, Smartphone, CreditCard, TrendingUp, MoreHorizontal, Star, Heart, Circle
};

// Selection options
const AVAILABLE_ICONS = ['Box', 'Star', 'Heart', 'Circle', 'Wallet', 'CreditCard', 'Banknote', 'ShoppingBasket', 'Home', 'Car', 'Utensils', 'ShoppingBag', 'PlusCircle', 'Gift', 'Smartphone'];
const AVAILABLE_COLORS = [
    'bg-red-100 text-red-600', 'bg-orange-100 text-orange-600', 'bg-yellow-100 text-yellow-600',
    'bg-green-100 text-green-600', 'bg-teal-100 text-teal-600', 'bg-blue-100 text-blue-600',
    'bg-indigo-100 text-indigo-600', 'bg-purple-100 text-purple-600', 'bg-slate-700 text-white'
];

interface CategoryListViewProps {
  onBack: () => void;
  categories: AllCategories;
  onAddCategory: (type: 'expense' | 'income' | 'debt', newCat: CategoryItem) => void;
  onUpdateCategory?: (category: CategoryItem) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onSelectCategory?: (categoryId: string) => void;
  onMoveCategory?: (type: 'expense' | 'income' | 'debt', id: string, direction: 'up' | 'down') => void;
  initialTab?: 'expense' | 'income' | 'debt';
}

export const CategoryListView: React.FC<CategoryListViewProps> = ({ 
  onBack, 
  categories, 
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSelectCategory,
  onMoveCategory,
  initialTab
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'debt'>('expense');
  const [isReordering, setIsReordering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedCategoryForAction, setSelectedCategoryForAction] = useState<CategoryItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  useEffect(() => {
    if (initialTab) {
        setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'expense' | 'income' | 'debt'>('expense'); 
  const [newParentId, setNewParentId] = useState('');
  const [newIcon, setNewIcon] = useState('Heart');
  const [newColor, setNewColor] = useState('bg-slate-700 text-white');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const currentList = categories[activeTab];

  useEffect(() => {
      const parents = currentList.filter(c => !c.parentId);
      if (parents.length > 0 && !selectedParentId) {
          setSelectedParentId(parents[0].id);
      } else if (parents.length > 0 && !parents.find(p => p.id === selectedParentId)) {
          setSelectedParentId(parents[0].id);
      }
  }, [activeTab, currentList, selectedParentId]);

  // Filtering Logic
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return currentList;
    const term = searchTerm.toLowerCase();
    return currentList.filter(c => c.name.toLowerCase().includes(term));
  }, [currentList, searchTerm]);

  const handleSaveCategory = () => {
      if (!newName.trim()) return;
      const newCat: CategoryItem = {
          id: Date.now().toString(),
          name: newName,
          icon: newIcon,
          color: newColor,
          parentId: newParentId || undefined
      };
      onAddCategory(newType, newCat);
      setNewName('');
      setNewParentId('');
      setNewIcon('Heart');
      setViewMode('list');
      setActiveTab(newType);
  };

  const handleOpenCreate = () => {
      setNewType(activeTab); 
      setNewIcon('Heart');
      setNewColor('bg-slate-700 text-white');
      setNewParentId('');
      setViewMode('create');
  };

  const handleItemClick = (category: CategoryItem) => {
      if (editingId) return; 
      if (isReordering) return;
      if (onSelectCategory) {
          onSelectCategory(category.id);
      } else {
          setSelectedCategoryForAction(category);
      }
  };

  const handleAddSubCategory = (parent?: CategoryItem) => {
      const p = parent || selectedCategoryForAction;
      if (!p) return;
      setNewParentId(p.id);
      setNewType(activeTab);
      setNewColor(p.color);
      setNewIcon('Box'); 
      setNewName('');
      setSelectedCategoryForAction(null);
      setViewMode('create');
  };

  const handleStartEdit = (cat: CategoryItem) => {
      setEditingId(cat.id);
      setEditName(cat.name);
      setEditColor(cat.color);
  };

  const handleSaveEdit = () => {
      if (!editingId || !editName.trim() || !onUpdateCategory) return;
      const allCats = [...categories.expense, ...categories.income, ...categories.debt];
      const original = allCats.find(c => c.id === editingId);
      if (!original) return;
      const updated: CategoryItem = {
          ...original,
          name: editName,
          color: editColor
      };
      onUpdateCategory(updated);
      setEditingId(null);
      setSelectedCategoryForAction(null); 
  };

  const handleDeleteClick = () => {
      if (selectedCategoryForAction && onDeleteCategory) {
          if (window.confirm("Xóa danh mục này? Các mục con cũng sẽ bị ảnh hưởng.")) {
              onDeleteCategory(selectedCategoryForAction.id);
              setSelectedCategoryForAction(null);
          }
      }
  };

  const renderSearchResults = () => {
    return (
      <div className="flex-1 overflow-y-auto bg-white p-4 space-y-2 pb-20">
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Kết quả tìm kiếm ({filteredList.length})</p>
        {filteredList.map((cat) => {
          const Icon = IconMap[cat.icon] || Box;
          const parent = cat.parentId ? currentList.find(p => p.id === cat.parentId) : null;
          return (
            <div 
              key={cat.id} 
              onClick={() => handleItemClick(cat)}
              className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl active:bg-gray-50 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color.split(' ')[0]}`}>
                  <Icon className={`w-5 h-5 ${cat.color.split(' ')[1]}`} />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block">{cat.name}</span>
                  {parent && <span className="text-[10px] text-gray-400 uppercase font-medium">Trong: {parent.name}</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          );
        })}
        {filteredList.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-10" />
            <p>Không tìm thấy danh mục nào phù hợp.</p>
          </div>
        )}
      </div>
    );
  };

  const renderSplitView = (list: CategoryItem[]) => {
    const parents = list.filter(c => !c.parentId); 
    const activeParent = parents.find(p => p.id === selectedParentId) || parents[0];
    const children = activeParent ? list.filter(c => c.parentId === activeParent.id) : [];

    return (
        <div className="flex h-full bg-white overflow-hidden">
            {/* Left Sidebar: Parent Groups */}
            <div className="w-[100px] bg-slate-50 h-full overflow-y-auto no-scrollbar border-r border-gray-100 pb-20">
                {parents.map((parent, index) => {
                    const Icon = IconMap[parent.icon] || Box;
                    const isActive = parent.id === activeParent?.id;
                    return (
                        <div 
                            key={parent.id} 
                            onClick={() => !isReordering && setSelectedParentId(parent.id)}
                            className={`flex flex-col items-center justify-center py-4 px-1 cursor-pointer transition-all relative ${isActive ? 'bg-white' : 'hover:bg-gray-100'} ${isReordering ? 'border-b border-gray-100' : ''}`}
                        >
                            {isActive && !isReordering && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-r-md"></div>}
                            {isReordering && onMoveCategory && (
                                <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center">
                                    <div className="flex flex-col space-y-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onMoveCategory(activeTab, parent.id, 'up'); }}
                                            className={`p-0.5 rounded-full bg-gray-200 hover:bg-green-100 border border-gray-300 ${index === 0 ? 'opacity-20 cursor-default' : 'active:scale-90'}`}
                                            disabled={index === 0}
                                        >
                                            <ChevronUp className="w-3 h-3 text-gray-700"/>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onMoveCategory(activeTab, parent.id, 'down'); }}
                                            className={`p-0.5 rounded-full bg-gray-200 hover:bg-green-100 border border-gray-300 ${index === parents.length - 1 ? 'opacity-20 cursor-default' : 'active:scale-90'}`}
                                            disabled={index === parents.length - 1}
                                        >
                                            <ChevronDown className="w-3 h-3 text-gray-700"/>
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-transform ${isActive ? 'scale-110 shadow-sm' : 'opacity-70'} ${parent.color.split(' ')[0]}`}>
                                <Icon className={`w-5 h-5 ${parent.color.split(' ')[1]}`} />
                            </div>
                            <span className={`text-[11px] text-center px-0.5 leading-tight break-words w-full ${isActive ? 'font-bold text-gray-900' : 'text-gray-500 font-medium'}`}>
                                {parent.name}
                            </span>
                        </div>
                    )
                })}
                <button 
                    onClick={handleOpenCreate}
                    className="w-full flex flex-col items-center py-6 text-gray-400 border-t border-gray-100 mt-2 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                >
                    <Plus className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-[10px] font-bold uppercase">Nhóm mới</span>
                </button>
                <div className="h-24"></div>
            </div>

            {/* Right Panel: Child Categories */}
            <div className="flex-1 h-full overflow-y-auto bg-white p-3 pb-24 no-scrollbar">
                {activeParent ? (
                    <>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-lg">{activeParent.name}</h3>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-full uppercase">Nhóm Cha</span>
                            </div>
                            {!onSelectCategory && !isReordering && (
                                <button onClick={(e) => { e.stopPropagation(); handleItemClick(activeParent); }} className="text-gray-400 p-1">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {/* Option to select the parent itself as 'General' category */}
                            <div 
                                onClick={() => handleItemClick(activeParent)}
                                className={`col-span-2 bg-green-50 border border-green-100 rounded-xl p-3 flex items-center space-x-3 cursor-pointer active:scale-95 transition-transform shadow-sm ${isReordering ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-white border border-green-100`}>
                                    {React.createElement(IconMap[activeParent.icon] || Box, { className: `w-5 h-5 text-green-600` })}
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-gray-900 block leading-tight">Chung</span>
                                    <span className="text-[10px] text-gray-500 font-medium">Chọn mặc định {activeParent.name}</span>
                                </div>
                                <div className="ml-auto">
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                            </div>

                            {/* List of children */}
                            {children.map((child, idx) => {
                                const ChildIcon = IconMap[child.icon] || Box;
                                return (
                                    <div 
                                        key={child.id}
                                        onClick={() => handleItemClick(child)}
                                        className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95 h-28 relative group"
                                    >
                                        {!onSelectCategory && !isReordering && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleItemClick(child); }}
                                                className="absolute top-1 right-1 p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        )}
                                        {isReordering && onMoveCategory && (
                                            <div className="absolute top-1 right-1 flex space-x-1 z-10">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onMoveCategory(activeTab, child.id, 'up'); }}
                                                    className={`w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 ${idx === 0 ? 'opacity-30' : 'hover:bg-green-100'}`}
                                                    disabled={idx === 0}
                                                >
                                                    <ChevronUp className="w-3 h-3 text-gray-600"/>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onMoveCategory(activeTab, child.id, 'down'); }}
                                                    className={`w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 ${idx === children.length - 1 ? 'opacity-30' : 'hover:bg-green-100'}`}
                                                    disabled={idx === children.length - 1}
                                                >
                                                    <ChevronDown className="w-3 h-3 text-gray-600"/>
                                                </button>
                                            </div>
                                        )}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${child.color.split(' ')[0]}`}>
                                            <ChildIcon className={`w-5 h-5 ${child.color.split(' ')[1]}`} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-800 line-clamp-2 px-1 leading-tight">{child.name}</span>
                                    </div>
                                )
                            })}

                            {/* "Add Sub-category" Card */}
                            {!isReordering && (
                                <button 
                                    onClick={() => handleAddSubCategory(activeParent)}
                                    className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-all active:scale-95 h-28"
                                >
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-gray-200 mb-2">
                                        <Plus className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">Thêm mục con</span>
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <Box className="w-12 h-12 opacity-10 mb-4" />
                        <p className="text-sm">Hãy chọn hoặc tạo một nhóm cha ở bên trái</p>
                    </div>
                )}
            </div>
        </div>
    );
  };

  if (viewMode === 'create') {
      return (
        <div className="fixed inset-0 z-[70] bg-white flex flex-col h-full animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button onClick={() => setViewMode('list')}><X className="w-6 h-6 text-gray-800" /></button>
                <h2 className="font-bold text-lg">Thiết lập danh mục</h2>
                <button onClick={handleSaveCategory} className="text-green-600 font-bold">Lưu</button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto no-scrollbar">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">1. Loại giao dịch</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg mt-1">
                        {(['expense', 'income', 'debt'] as const).map(tType => (
                            <button key={tType} onClick={() => setNewType(tType)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${newType === tType ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
                                {t(`type.${tType}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">2. Tên danh mục</label>
                    <input autoFocus className="w-full text-xl border-b border-gray-200 py-2 outline-none font-medium placeholder-gray-300 text-gray-900" placeholder="Ví dụ: Ăn vặt, Tiền điện..." value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase block mb-1">3. Phân nhóm</label>
                    <select 
                        className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 mt-1 outline-none font-medium text-gray-700 focus:bg-white focus:border-green-500 transition-all" 
                        value={newParentId} 
                        onChange={e => {
                            setNewParentId(e.target.value);
                            // Inherit color from parent if possible
                            const p = categories[newType].find(c => c.id === e.target.value);
                            if (p) setNewColor(p.color);
                        }}
                    >
                        <option value="">+ Tạo làm NHÓM CHA mới</option>
                        {categories[newType].filter(c => !c.parentId).map(c => (
                            <option key={c.id} value={c.id}>Vào nhóm: {c.name}</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-2 px-1 italic">
                        {newParentId ? "Danh mục mới sẽ là mục con trong nhóm bạn chọn." : "Danh mục mới sẽ xuất hiện ở thanh bên trái như một nhóm chính."}
                    </p>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase block mb-3">4. Biểu tượng & Màu sắc</label>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setShowIconPicker(true)} className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md ${newColor}`}>
                            {React.createElement(IconMap[newIcon] || Heart, { className: "w-8 h-8" })}
                        </button>
                        <div className="flex-1 grid grid-cols-5 gap-2">
                            {AVAILABLE_COLORS.map(c => (
                                <button key={c} onClick={() => setNewColor(c)} className={`w-8 h-8 rounded-full border-2 ${c.split(' ')[0]} ${newColor === c ? 'border-gray-900 scale-110' : 'border-transparent opacity-60'}`}></button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {showIconPicker && (
                <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Chọn biểu tượng</h3><button onClick={() => setShowIconPicker(false)}><X className="w-5 h-5"/></button></div>
                        <div className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                            {AVAILABLE_ICONS.map(i => {
                                const Icon = IconMap[i] || Heart;
                                return (
                                    <button key={i} onClick={() => { setNewIcon(i); setShowIconPicker(false); }} className={`p-4 rounded-xl border transition-all ${newIcon === i ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-100 text-gray-400'}`}>
                                        <Icon className="w-6 h-6" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="p-1"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
            <h1 className="text-xl font-bold text-gray-900">Danh mục</h1>
          </div>
          <div className="flex items-center space-x-2">
            {!onSelectCategory && (
                <button 
                  onClick={() => setIsReordering(!isReordering)}
                  className={`p-2 rounded-full transition-colors ${isReordering ? 'bg-green-100 text-green-700' : 'text-gray-400'}`}
                >
                    <ArrowUpDown className="w-5 h-5" />
                </button>
            )}
            <button onClick={handleOpenCreate} className="p-2 bg-green-500 rounded-full text-white shadow-md active:scale-95 transition-transform"><Plus className="w-5 h-5 font-bold" /></button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-3">
            <div className="flex items-center space-x-2 bg-gray-50 rounded-xl border border-gray-100 px-3 py-2 shadow-inner focus-within:ring-2 focus-within:ring-green-100 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm danh mục nhanh..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')}><X className="w-4 h-4 text-gray-400" /></button>
                )}
            </div>
        </div>

        <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
          {(['expense', 'income', 'debt'] as const).map(tType => (
              <button key={tType} onClick={() => { setActiveTab(tType); setSearchTerm(''); }} className={`flex-1 min-w-[100px] py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tType ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}>
                  {t(`type.${tType}`)}
              </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {searchTerm.trim() ? renderSearchResults() : renderSplitView(currentList)}
      </div>

      {selectedCategoryForAction && (
          <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedCategoryForAction.color.split(' ')[0]}`}>
                                {React.createElement(IconMap[selectedCategoryForAction.icon] || Box, { className: `w-6 h-6 ${selectedCategoryForAction.color.split(' ')[1]}` })}
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-900 text-lg">{selectedCategoryForAction.name}</h3>
                              <span className="text-xs text-gray-400 uppercase font-bold">{t(`type.${activeTab}`)}</span>
                          </div>
                      </div>
                      <button onClick={() => setSelectedCategoryForAction(null)} className="p-1 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500"/></button>
                  </div>

                  {editingId === selectedCategoryForAction.id ? (
                      <div className="space-y-4 mb-6">
                          <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Sửa tên</label>
                              <input className="w-full border-b-2 border-green-500 py-2 outline-none text-lg font-bold text-gray-900" value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Sửa màu</label>
                              <div className="flex flex-wrap gap-2">
                                  {AVAILABLE_COLORS.map(c => (
                                      <button key={c} onClick={() => setEditColor(c)} className={`w-8 h-8 rounded-full border-2 ${c.split(' ')[0]} ${editColor === c ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent'}`}></button>
                                  ))}
                              </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600">Hủy</button>
                             <button onClick={handleSaveEdit} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-100">Cập nhật</button>
                          </div>
                      </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => handleStartEdit(selectedCategoryForAction)} className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 active:scale-95 transition-all">
                            <Edit2 className="w-6 h-6 mb-2" />
                            <span className="text-[10px] font-bold uppercase">Sửa</span>
                        </button>
                        {!selectedCategoryForAction.parentId && (
                            <button onClick={() => handleAddSubCategory(selectedCategoryForAction)} className="flex flex-col items-center justify-center p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 hover:bg-green-100 active:scale-95 transition-all">
                                <PlusCircle className="w-6 h-6 mb-2" />
                                <span className="text-[10px] font-bold uppercase">+Mục con</span>
                            </button>
                        )}
                        <button onClick={handleDeleteClick} className="flex flex-col items-center justify-center p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 hover:bg-red-100 active:scale-95 transition-all">
                            <Trash2 className="w-6 h-6 mb-2" />
                            <span className="text-[10px] font-bold uppercase">Xóa</span>
                        </button>
                    </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};