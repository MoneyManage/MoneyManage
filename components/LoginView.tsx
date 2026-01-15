
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Wallet, Chrome, MessageCircle } from 'lucide-react';

// Custom Zalo Icon SVG since it's not in Lucide
const ZaloIcon = () => (
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24Z" fill="#0068FF"/>
        <path d="M28.0003 16H20.0003C18.8957 16 18.0003 16.8954 18.0003 18V30C18.0003 31.1046 18.8957 32 20.0003 32H21.5003V35.5C21.5003 35.7761 21.7241 36 22.0003 36C22.1329 36 22.2599 35.9473 22.3538 35.8536L25.8538 32.3536C25.9476 32.2598 26.0003 32.1329 26.0003 32H28.0003C29.1049 32 30.0003 31.1046 30.0003 30V18C30.0003 16.8954 29.1049 16 28.0003 16Z" fill="white"/>
        <path d="M22.0003 26H26.0003" stroke="#0068FF" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export const LoginView: React.FC = () => {
    const { t, login } = useLanguage();

    const handleGoogleLogin = () => {
        // Simulation of Google Login
        // In a real app, this would use Firebase Auth or Google Identity Services
        setTimeout(() => {
            login({
                id: 'google_123',
                name: 'Nguyễn Văn A',
                email: 'nguyenvana@gmail.com',
                provider: 'google',
                avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c' // Placeholder
            });
        }, 800);
    };

    const handleZaloLogin = () => {
        // Simulation of Zalo Login
        setTimeout(() => {
            login({
                id: 'zalo_456',
                name: 'Trần Thị B',
                email: 'user_zalo@zalo.me',
                provider: 'zalo',
                avatar: 'https://cdn-icons-png.flaticon.com/512/3670/3670151.png'
            });
        }, 800);
    };

    const handleGuestLogin = () => {
        login({
            id: 'guest',
            name: 'Khách',
            email: '',
            provider: 'guest'
        });
    };

    return (
        <div className="h-[100dvh] flex flex-col items-center justify-center bg-white p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60"></div>

            <div className="w-full max-w-sm flex flex-col items-center z-10">
                {/* Logo */}
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center shadow-lg shadow-green-200 mb-6">
                    <Wallet className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('login.welcome')}</h1>
                <p className="text-gray-500 text-center mb-10 text-sm">
                    {t('login.subtitle')}
                </p>

                {/* Buttons */}
                <div className="w-full space-y-4">
                    {/* Google */}
                    <button 
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center space-x-3 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-700 font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                    >
                        <Chrome className="w-5 h-5 text-red-500" /> 
                        {/* Chrome icon is a decent proxy for Google if exact G logo not available in Lucide */}
                        <span>{t('login.google')}</span>
                    </button>

                    {/* Zalo */}
                    <button 
                        onClick={handleZaloLogin}
                        className="w-full flex items-center justify-center space-x-3 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200"
                    >
                        <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full">
                            <span className="text-blue-600 text-[10px] font-bold">Z</span>
                        </div>
                        <span>{t('login.zalo')}</span>
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400">hoặc</span>
                        </div>
                    </div>

                    {/* Guest */}
                    <button 
                        onClick={handleGuestLogin}
                        className="w-full py-3 text-gray-500 font-semibold text-sm hover:text-gray-800 transition-colors"
                    >
                        {t('login.guest')}
                    </button>
                </div>

                {/* Policy Footer */}
                <p className="mt-12 text-[10px] text-gray-400 text-center leading-relaxed">
                    {t('login.policy')}
                </p>
            </div>
        </div>
    );
};
