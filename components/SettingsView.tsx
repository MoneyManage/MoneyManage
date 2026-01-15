
import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, ShieldAlert, DownloadCloud } from 'lucide-react';
import { useLanguage, CurrencyCode } from '../contexts/LanguageContext';
import { PinLock } from './PinLock';

interface SettingsViewProps {
  onBack: () => void;
  installPrompt: any;
  onInstall: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, installPrompt, onInstall }) => {
  const { language, setLanguage, currency, setCurrency, t, pin, setPin } = useLanguage();
  const [showPinSetup, setShowPinSetup] = useState(false);

  const currencies: { code: CurrencyCode; name: string; symbol: string }[] = [
      { code: 'VND', name: 'Vietnam Dong', symbol: '₫' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'KRW', name: 'Korean Won', symbol: '₩' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  ];

  const handleSetPin = (newPin: string) => {
      setPin(newPin);
      setShowPinSetup(false);
      alert('Đã thiết lập mã khóa thành công!');
      return true;
  };

  const handleRemovePin = () => {
      if (window.confirm('Bạn có chắc chắn muốn gỡ bỏ mã khóa bảo vệ?')) {
          setPin(null);
      }
  };

  if (showPinSetup) {
      return (
          <PinLock 
            isSettingUp={true} 
            onUnlock={handleSetPin} 
            onCancelSetup={() => setShowPinSetup(false)}
          />
      )
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white px-4 py-3 flex items-center space-x-4 sticky top-0 z-20 shadow-sm">
        <button onClick={onBack}>
            <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('settings.title')}</h1>
      </div>

      <div className="mt-6 px-4 pb-12 space-y-6">
          
          {/* Install App Section (Visible only if installable) */}
          {installPrompt && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl overflow-hidden shadow-lg p-1">
                  <button 
                      onClick={onInstall}
                      className="w-full flex items-center justify-between p-4 bg-transparent text-white"
                  >
                      <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                              <DownloadCloud className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                              <span className="font-bold text-lg block">Cài đặt ứng dụng</span>
                              <span className="text-xs text-green-100 opacity-90">Sử dụng offline, không cần mạng</span>
                          </div>
                      </div>
                      <div className="bg-white text-green-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          Cài ngay
                      </div>
                  </button>
              </div>
          )}

          {/* Security Section (PRO) */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-2">{t('settings.security')}</h2>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                {pin ? (
                    <button 
                        onClick={handleRemovePin}
                        className="w-full flex items-center justify-between p-4 active:bg-gray-50"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5 text-red-600" />
                            </div>
                            <span className="font-medium text-red-600">{t('settings.remove_pin')}</span>
                        </div>
                    </button>
                ) : (
                    <button 
                        onClick={() => setShowPinSetup(true)}
                        className="w-full flex items-center justify-between p-4 active:bg-gray-50"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="font-medium text-gray-900">{t('settings.set_pin')}</span>
                        </div>
                    </button>
                )}
            </div>
          </div>

          {/* Language Section */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-2">{t('account.language')}</h2>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <button 
                    onClick={() => setLanguage('vi')}
                    className="w-full flex items-center justify-between p-4 active:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🇻🇳</span>
                        <span className="font-medium text-gray-900">Tiếng Việt</span>
                    </div>
                    {language === 'vi' && <Check className="w-5 h-5 text-green-500" />}
                </button>

                <button 
                    onClick={() => setLanguage('en')}
                    className="w-full flex items-center justify-between p-4 active:bg-gray-50"
                >
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🇺🇸</span>
                        <span className="font-medium text-gray-900">English</span>
                    </div>
                    {language === 'en' && <Check className="w-5 h-5 text-green-500" />}
                </button>
            </div>
          </div>

          {/* Currency Section */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-2">{t('account.currency')}</h2>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                {currencies.map(curr => (
                    <button 
                        key={curr.code}
                        onClick={() => setCurrency(curr.code)}
                        className="w-full flex items-center justify-between p-4 active:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                        <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600">
                                {curr.symbol}
                            </span>
                            <div className="flex flex-col items-start">
                                <span className="font-medium text-gray-900">{curr.code}</span>
                                <span className="text-xs text-gray-400">{curr.name}</span>
                            </div>
                        </div>
                        {currency === curr.code && <Check className="w-5 h-5 text-green-500" />}
                    </button>
                ))}
            </div>
          </div>

      </div>
    </div>
  );
};
