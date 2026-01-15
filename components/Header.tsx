
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Grip, HelpCircle, ChevronDown, WifiOff, CloudCheck, CloudOff, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
        setIsOnline(true);
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2000); // Simulate sync on reconnect
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="bg-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-gray-50">
      <button className="p-1" title={t('common.back')}>
        <ArrowLeft className="w-6 h-6 text-gray-700" />
      </button>
      
      <div className="flex flex-col items-center">
          <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 shadow-inner"></div>
            <span className="font-black text-slate-800 text-[10px] uppercase tracking-wider">{t('common.total')}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
          
          <div className="mt-1">
              {isSyncing ? (
                  <div className="flex items-center text-[8px] text-indigo-500 font-black uppercase tracking-widest animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
                      <span>Đang đồng bộ...</span>
                  </div>
              ) : isOnline ? (
                  <div className="flex items-center text-[8px] text-emerald-600 font-black uppercase tracking-widest opacity-60">
                      <CloudCheck className="w-2.5 h-2.5 mr-1" />
                      <span>Sẵn sàng Offline</span>
                  </div>
              ) : (
                  <div className="flex items-center text-[8px] text-amber-500 font-black uppercase tracking-widest animate-pulse">
                      <WifiOff className="w-2.5 h-2.5 mr-1" />
                      <span>Chế độ ngoại tuyến</span>
                  </div>
              )}
          </div>
      </div>

      <div className="flex items-center space-x-1">
        <button className="p-2 text-slate-400 hover:text-slate-600">
            <Grip className="w-6 h-6" />
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-600">
            <HelpCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
