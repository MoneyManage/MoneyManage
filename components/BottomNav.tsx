
import React from 'react';
import { Home, Wallet, Plus, PieChart, User } from 'lucide-react';
import { TabId } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface BottomNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();
  const navItems: { id: TabId; label: string; icon: React.FC<any> }[] = [
    { id: 'overview', label: t('nav.overview'), icon: Home },
    { id: 'transactions', label: t('nav.transactions'), icon: Wallet },
    { id: 'add', label: t('nav.add'), icon: Plus }, // Special case
    { id: 'budget', label: t('nav.budget'), icon: PieChart },
    { id: 'account', label: t('nav.account'), icon: User },
  ];

  return (
    <div className="bg-white border-t border-gray-200 w-full pb-safe-area z-30 shrink-0 relative">
      <div className="flex justify-between items-end px-2 py-2">
        {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            if (item.id === 'add') {
                return (
                    <div key={item.id} className="relative -top-5 mx-2 flex flex-col items-center">
                        <button 
                            onClick={() => setActiveTab(item.id)}
                            className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg text-white transform transition-transform active:scale-95 mb-1"
                        >
                            <Plus className="w-8 h-8" />
                        </button>
                        <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">{item.label}</span>
                    </div>
                )
            }

            return (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center justify-center w-16 space-y-1 ${
                        isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}
                >
                    <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            );
        })}
      </div>
    </div>
  );
};
