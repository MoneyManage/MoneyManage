
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, TrendingUp, DollarSign, Home, BarChart3, Bitcoin, Landmark, Gem, Layers } from 'lucide-react';
import { Asset, Transaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AssetsViewProps {
    onBack: () => void;
    assets: Asset[];
    transactions: Transaction[]; // Needed to calculate debt liabilities
    onAddAsset: (asset: Asset) => void;
    onUpdateAsset: (asset: Asset) => void;
    onDeleteAsset: (id: string) => void;
}

const ASSET_ICONS = {
    gold: Gem,
    real_estate: Home,
    stock: TrendingUp,
    crypto: Bitcoin,
    saving: Landmark,
    cash: DollarSign,
    other: Layers
};

const ASSET_COLORS = {
    gold: 'bg-yellow-100 text-yellow-600',
    real_estate: 'bg-blue-100 text-blue-600',
    stock: 'bg-green-100 text-green-600',
    crypto: 'bg-purple-100 text-purple-600',
    saving: 'bg-teal-100 text-teal-600',
    cash: 'bg-emerald-100 text-emerald-600',
    other: 'bg-gray-100 text-gray-600'
};

export const AssetsView: React.FC<AssetsViewProps> = ({ onBack, assets, transactions, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
    const { t, formatCurrency } = useLanguage();
    const [isAdding, setIsAdding] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState<Asset['type']>('saving');
    const [note, setNote] = useState('');

    // --- Calculations ---
    const totalAssets = useMemo(() => assets.reduce((sum, a) => sum + a.value, 0), [assets]);
    
    // Calculate Liabilities from Debt Transactions (Borrowed - Repaid)
    const totalLiabilities = useMemo(() => {
        let borrowed = 0;
        let repaid = 0;
        transactions.forEach(t => {
            if (t.type === 'debt') {
                if (t.categoryId === 'debt') borrowed += t.amount;
                if (t.categoryId === 'repay') repaid += t.amount;
            }
        });
        return Math.max(0, borrowed - repaid);
    }, [transactions]);

    const netWorth = totalAssets - totalLiabilities;

    const handleSave = () => {
        if (!name || !value) return;

        const assetData: Asset = {
            id: editingAsset ? editingAsset.id : Date.now().toString(),
            name,
            value: Number(value),
            type,
            note,
            updatedAt: new Date().toISOString()
        };

        if (editingAsset) {
            onUpdateAsset(assetData);
        } else {
            onAddAsset(assetData);
        }

        resetForm();
    };

    const handleEdit = (asset: Asset) => {
        setEditingAsset(asset);
        setName(asset.name);
        setValue(asset.value.toString());
        setType(asset.type);
        setNote(asset.note || '');
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingAsset(null);
        setName('');
        setValue('');
        setType('saving');
        setNote('');
    };

    if (isAdding) {
        return (
            <div className="bg-white min-h-screen z-50 fixed inset-0 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <button onClick={resetForm} className="text-gray-500">Hủy</button>
                    <h1 className="font-bold text-lg text-gray-900">{editingAsset ? 'Sửa tài sản' : 'Thêm tài sản'}</h1>
                    <button onClick={handleSave} className="text-blue-600 font-bold">Lưu</button>
                </div>
                
                <div className="p-4 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Tên tài sản</label>
                        <input className="w-full text-xl border-b border-gray-200 py-2 outline-none font-medium text-gray-900" placeholder="Ví dụ: Vàng SJC, VinFast Stock" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Giá trị hiện tại</label>
                        <input type="number" className="w-full text-2xl font-bold text-blue-600 border-b border-gray-200 py-2 outline-none" placeholder="0" value={value} onChange={e => setValue(e.target.value)} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Loại tài sản</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(ASSET_ICONS) as Array<Asset['type']>).map(key => {
                                const Icon = ASSET_ICONS[key];
                                return (
                                    <button 
                                        key={key} 
                                        onClick={() => setType(key)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${type === key ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-500 bg-white'}`}
                                    >
                                        <Icon className="w-6 h-6 mb-1" />
                                        <span className="text-[10px] uppercase font-bold">{t(`asset.${key}`)}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Ghi chú</label>
                        <textarea className="w-full border rounded-xl p-3 mt-2 h-24 text-sm bg-gray-50 outline-none focus:bg-white focus:border-blue-500 transition-colors text-gray-900" placeholder="Ghi chú thêm..." value={note} onChange={e => setNote(e.target.value)}></textarea>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-safe-area flex flex-col text-gray-900">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between sticky top-0 z-20 bg-white shadow-sm">
                <div className="flex items-center space-x-3">
                    <button onClick={onBack} className="p-1 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 tracking-wide">Net Worth</h1>
                </div>
                <button onClick={() => setIsAdding(true)} className="p-2 bg-yellow-400 rounded-full text-white shadow-md active:scale-95 transition-transform">
                    <Plus className="w-5 h-5 font-bold" />
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Net Worth Card (Light Theme) */}
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
                    
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{t('asset.net_worth')}</span>
                    <div className="text-4xl font-bold text-gray-900 mt-2 mb-6">{formatCurrency(netWorth)}</div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Tổng tài sản</span>
                            <span className="text-green-600 font-bold text-lg">{formatCurrency(totalAssets)}</span>
                        </div>
                        <div className="flex-1 bg-red-50 rounded-xl p-3 border border-red-100">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Nợ phải trả</span>
                            <span className="text-red-600 font-bold text-lg">{formatCurrency(totalLiabilities)}</span>
                        </div>
                    </div>
                </div>

                {/* Assets List */}
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1">{t('asset.title')}</h3>
                    <div className="space-y-3">
                        {assets.map(asset => {
                            const Icon = ASSET_ICONS[asset.type] || Layers;
                            return (
                                <div key={asset.id} className="bg-white rounded-xl p-4 flex items-center justify-between border border-gray-200 shadow-sm group">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ASSET_COLORS[asset.type]}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{asset.name}</h4>
                                            <p className="text-xs text-gray-500">{t(`asset.${asset.type}`)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900">{formatCurrency(asset.value)}</div>
                                        <div className="flex items-center justify-end space-x-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(asset)}><Edit2 className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
                                            <button onClick={() => onDeleteAsset(asset.id)}><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        
                        {assets.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Chưa có tài sản nào được ghi nhận.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
