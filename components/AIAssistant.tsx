
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Bot, User, Sparkles, Loader2, TrendingUp, AlertCircle, WifiOff, History, BrainCircuit, Info, Target, Zap, ShieldCheck, Landmark, PiggyBank, BarChart3, Receipt, Database, CloudSync } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, Budget, AllCategories, SavingsGoal, Asset } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { db, STORES } from '../utils/db';

interface AIAssistantProps {
    onClose: () => void;
    transactions: Transaction[];
    categories: AllCategories;
    budgets: Budget[];
    goals?: SavingsGoal[];
    assets?: Asset[];
}

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: Date;
    isFromCache?: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, transactions, categories, budgets, goals = [], assets = [] }) => {
    const { formatCurrency, language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load history and cache from DB on mount
    useEffect(() => {
        const loadCache = async () => {
            const cached = await db.getAll<Message>(STORES.AI_CACHE);
            if (cached.length > 0) {
                setMessages(cached.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
            } else {
                setMessages([{
                    id: 'init',
                    role: 'ai',
                    text: 'Xin chào! Tôi là Elite Advisor. Toàn bộ kiến thức tài chính của tôi đã sẵn sàng ngay cả khi bạn không có mạng. Tôi có thể tư vấn về Net Worth, phân bổ tài sản hoặc lộ trình trả nợ cho bạn.',
                    timestamp: new Date()
                }]);
            }
        };
        loadCache();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Financial Health Intelligence (Runs Locally)
    const localInsights = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const totalAssets = assets.reduce((s, a) => s + a.value, 0);
        
        // Debt calculation
        const debts: Record<string, number> = {};
        transactions.forEach(t => {
            if (t.type === 'debt' && t.withPerson) {
                if (t.categoryId === 'debt') debts[t.withPerson] = (debts[t.withPerson] || 0) + t.amount;
                if (t.categoryId === 'repay') debts[t.withPerson] = (debts[t.withPerson] || 0) - t.amount;
            }
        });
        const totalDebt = Object.values(debts).reduce((s, v) => s + (v > 0 ? v : 0), 0);
        
        const savingsRate = income > 0 ? ((income - expense) / income * 100) : 0;
        const netWorth = totalAssets - totalDebt;

        return { income, expense, totalAssets, totalDebt, netWorth, savingsRate };
    }, [transactions, assets]);

    const handleSend = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || isLoading) return;
        
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        
        // Save user message to cache
        await db.put(STORES.AI_CACHE, userMsg);

        if (!navigator.onLine) {
            setIsLoading(true);
            setTimeout(() => {
                const offlineResponse = `📡 **PHÂN TÍCH ELITE (NGOẠI TUYẾN)**:
                
Hiện tại không có kết nối mạng, tôi đang sử dụng dữ liệu cục bộ để tư vấn:
                
- **Giá trị ròng**: ${formatCurrency(localInsights.netWorth)}
- **Tình trạng nợ**: Bạn đang có ${formatCurrency(localInsights.totalDebt)} tiền nợ.
- **Tỷ lệ tiết kiệm**: ${localInsights.savingsRate.toFixed(1)}% (Mục tiêu Elite là >20%).
                
*Lời khuyên tạm thời*: Dựa trên dữ liệu, hãy ưu tiên kiểm soát các khoản chi lớn. Khi có mạng, tôi sẽ cung cấp chiến lược Gemini AI chuyên sâu hơn.`;
                
                const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: offlineResponse, timestamp: new Date(), isFromCache: true };
                setMessages(prev => [...prev, aiMsg]);
                db.put(STORES.AI_CACHE, aiMsg);
                setIsLoading(false);
            }, 800);
            return;
        }

        setIsLoading(true);
        try {
            // Strictly use process.env.API_KEY directly for initialization.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // Person and context moved to systemInstruction per guidelines.
            const systemInstruction = `Bạn là Elite Financial Advisor. Hãy trả lời câu hỏi dựa trên các chỉ số tài chính của người dùng: NetWorth=${localInsights.netWorth}, Debt=${localInsights.totalDebt}, SavingsRate=${localInsights.savingsRate}%.`;
            
            const response = await ai.models.generateContent({
                // Use 'gemini-3-pro-preview' for complex financial reasoning tasks.
                model: 'gemini-3-pro-preview',
                contents: textToSend,
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            const aiMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'ai', 
                // The response.text property directly returns the string output. Do not use text().
                text: response.text || "Đã xảy ra lỗi phân tích.", 
                timestamp: new Date() 
            };
            
            setMessages(prev => [...prev, aiMsg]);
            // Save AI response to cache
            await db.put(STORES.AI_CACHE, aiMsg);
        } catch (error) {
            console.error("Gemini API error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                text: "⚠️ Trí tuệ Cloud tạm thời gián đoạn. Đang sử dụng chế độ dự phòng...",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = async () => {
        if (window.confirm("Xóa toàn bộ lịch sử tư vấn AI?")) {
            const transaction = (db as any).db.transaction([STORES.AI_CACHE], 'readwrite');
            transaction.objectStore(STORES.AI_CACHE).clear();
            setMessages([]);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 pb-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
                <div className="flex justify-between items-center text-white relative z-10">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                            <BrainCircuit className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="font-black text-lg">Elite Smart Advisor</h2>
                            <div className="flex items-center gap-1.5">
                                {navigator.onLine ? (
                                    <span className="flex items-center text-[9px] text-green-400 font-black uppercase tracking-widest"><CloudSync className="w-2.5 h-2.5 mr-1"/> Cloud Active</span>
                                ) : (
                                    <span className="flex items-center text-[9px] text-amber-400 font-black uppercase tracking-widest"><Database className="w-2.5 h-2.5 mr-1"/> Local Engine</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={clearHistory} className="p-2 hover:bg-white/10 rounded-full transition-all"><History className="w-5 h-5 opacity-40 hover:opacity-100" /></button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>

            <div className="flex-1 -mt-6 bg-slate-50 rounded-t-[2rem] overflow-hidden flex flex-col relative z-10 border-t border-white/20">
                <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-slate-800 text-white'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-600" /> : <Zap className="w-4 h-4" />}
                                </div>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                }`}>
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                    {msg.isFromCache && <div className="text-[8px] mt-2 opacity-40 uppercase font-black">Lưu cục bộ</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phân tích...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-gray-100 pb-safe-area">
                    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-gray-200">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Hỏi về nợ, tài sản, ngân sách..."
                            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm font-bold text-gray-700"
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className={`p-3 rounded-xl transition-all ${input.trim() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-200 text-gray-400'}`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
