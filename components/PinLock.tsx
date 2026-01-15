
import React, { useState, useEffect } from 'react';
import { Delete, Lock } from 'lucide-react';

interface PinLockProps {
    onUnlock: (pin: string) => boolean;
    isSettingUp?: boolean;
    onCancelSetup?: () => void;
}

export const PinLock: React.FC<PinLockProps> = ({ onUnlock, isSettingUp = false, onCancelSetup }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [firstPin, setFirstPin] = useState('');

    useEffect(() => {
        if (input.length === 4) {
            handleComplete(input);
        }
    }, [input]);

    const handleComplete = (code: string) => {
        if (isSettingUp) {
            if (!confirming) {
                setFirstPin(code);
                setConfirming(true);
                setInput('');
            } else {
                if (code === firstPin) {
                    onUnlock(code);
                } else {
                    setError(true);
                    setTimeout(() => {
                        setInput('');
                        setConfirming(false);
                        setFirstPin('');
                        setError(false);
                    }, 500);
                }
            }
        } else {
            const success = onUnlock(code);
            if (!success) {
                setError(true);
                setTimeout(() => {
                    setInput('');
                    setError(false);
                }, 500);
            }
        }
    };

    const handleNum = (num: string) => {
        if (input.length < 4) setInput(prev => prev + num);
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white">
            <div className="mb-8 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl">
                    <Lock className="w-7 h-7 text-green-500" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                    {isSettingUp 
                        ? (confirming ? "Xác nhận mã khóa" : "Thiết lập Elite Pin") 
                        : "Nhập mã bảo mật"}
                </h2>
                {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 animate-pulse">Mã không chính xác</p>}
            </div>

            <div className="flex gap-4 mb-12">
                {[0, 1, 2, 3].map(i => (
                    <div 
                        key={i} 
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                            i < input.length 
                                ? (error ? 'bg-red-500 border-red-500' : 'bg-green-500 border-green-500') 
                                : 'border-slate-700'
                        }`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-[240px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button 
                        key={n} 
                        onClick={() => handleNum(n.toString())}
                        className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-xl font-black transition-all active:scale-90 shadow-lg border border-slate-700/50"
                    >
                        {n}
                    </button>
                ))}
                <div className="flex items-center justify-center">
                    {isSettingUp && onCancelSetup && (
                        <button onClick={onCancelSetup} className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hủy</button>
                    )}
                </div>
                <button 
                    onClick={() => handleNum('0')}
                    className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-xl font-black transition-all active:scale-90 shadow-lg border border-slate-700/50"
                >
                    0
                </button>
                <button 
                    onClick={handleDelete}
                    className="w-14 h-14 rounded-full flex items-center justify-center hover:bg-slate-800/50 transition-all active:scale-90"
                >
                    <Delete className="w-5 h-5 text-slate-400" />
                </button>
            </div>
        </div>
    );
};
