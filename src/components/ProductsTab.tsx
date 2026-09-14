import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Layers, 
  KeyRound, 
  FileText, 
  Upload, 
  Check, 
  AlertCircle,
  Tag,
  Sparkles,
  Globe
} from 'lucide-react';
import { Product, StockItem } from '../types';
import { 
  t, 
  getLocalizedProduct, 
  generateProductTranslations, 
  SUPPORTED_LANGUAGES 
} from '../utils/languages';
import { dialogAlert, dialogConfirm, showToast } from '../utils/dialog';

interface ProductsTabProps {
  products: Product[];
  stocks: StockItem[];
  onAddProduct: (prod: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddBulkStocks: (productId: string, accountsText: string) => Promise<number>;
  onDeleteStock: (id: string) => Promise<void>;
  refreshData: () => void;
  currentLang?: string;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  stocks,
  onAddProduct,
  onDeleteProduct,
  onAddBulkStocks,
  onDeleteStock,
  refreshData,
  currentLang = 'id'
}) => {
  // Add Product Form State
  const [showAddProd, setShowAddProd] = useState(false);
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState('OpenAI / ChatGPT');
  const [prodPriceUsd, setProdPriceUsd] = useState(15.0);
  const [prodPriceIdr, setProdPriceIdr] = useState(235000);
  const [prodDesc, setProdDesc] = useState('Akun ChatGPT Plus 1 Bulan Siap Pakai.');
  const [prodUrl, setProdUrl] = useState('');
  const [prodTranslations, setProdTranslations] = useState<Record<string, { title: string; description: string }> | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Stock Form State
  const [selectedProdForStock, setSelectedProdForStock] = useState(products[0]?.product_id || '');
  const [stockInputText, setStockInputText] = useState('');
  const [stockMessage, setStockMessage] = useState('');
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  // Filter stocks by product
  const [filterStockProd, setFilterStockProd] = useState<string>('ALL');

  const handleAutoTranslateProduct = () => {
    if (!prodTitle.trim()) {
      dialogAlert('Isi judul produk terlebih dahulu', 'Perhatian', 'warning');
      return;
    }
    setIsTranslating(true);
    try {
      const generated = generateProductTranslations(prodTitle, prodDesc);
      setProdTranslations(generated);
      showToast('Terjemahan produk otomatis berhasil dibuat');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle) return;

    // Ensure translations exist
    const translations = prodTranslations || generateProductTranslations(prodTitle, prodDesc);

    await onAddProduct({
      title: prodTitle,
      category: prodCategory,
      price_usd: Number(prodPriceUsd),
      price_idr: Number(prodPriceIdr),
      description: prodDesc,
      product_url: prodUrl,
      translations
    });
    setProdTitle('');
    setProdUrl('');
    setProdTranslations(null);
    setShowAddProd(false);
  };

  const handleBulkStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProd = selectedProdForStock || products[0]?.product_id;
    if (!targetProd || !stockInputText.trim()) return;

    setIsSubmittingStock(true);
    setStockMessage('');
    try {
      const addedCount = await onAddBulkStocks(targetProd, stockInputText);
      setStockMessage(`Berhasil menambahkan ${addedCount} akun ke sistem!`);
      setStockInputText('');
      refreshData();
    } catch (err: any) {
      setStockMessage('Gagal menambahkan stok: ' + err.message);
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const filteredStocks = stocks.filter((s) => {
    if (filterStockProd === 'ALL') return true;
    return s.product_id === filterStockProd;
  });

  return (
    <div className="p-6 space-y-8">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {t('products_title', currentLang)}
          </h2>
          <p className="text-xs text-slate-500">
            {t('products_subtitle', currentLang)}
          </p>
        </div>
        <button
          onClick={() => setShowAddProd(!showAddProd)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddProd ? t('btn_close_form', currentLang) : t('btn_add_product', currentLang)}</span>
        </button>
      </div>

      {/* Add Product Modal/Card */}
      {showAddProd && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">{t('btn_add_product', currentLang)}</h3>
            <button
              type="button"
              onClick={handleAutoTranslateProduct}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold shadow-2xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('btn_auto_translate', currentLang)}</span>
            </button>
          </div>

          {prodTranslations && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <span className="font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Terjemahan 15 Bahasa Siap Disimpan! (ID, EN, ZH, RU, ES, AR, JA, dll.)
              </span>
              <span className="text-[11px] font-mono text-emerald-600">15 Languages Synced</span>
            </div>
          )}

          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('label_product_title', currentLang)}</label>
              <input
                type="text"
                value={prodTitle}
                onChange={(e) => setProdTitle(e.target.value)}
                placeholder="ChatGPT Plus 1 Bulan Private"
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('label_product_category', currentLang)}</label>
              <input
                type="text"
                value={prodCategory}
                onChange={(e) => setProdCategory(e.target.value)}
                placeholder="OpenAI / ChatGPT, VPN, Dev Tools"
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('label_price_usd', currentLang)}</label>
              <input
                type="number"
                step="0.01"
                value={prodPriceUsd}
                onChange={(e) => setProdPriceUsd(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('label_price_idr', currentLang)}</label>
              <input
                type="number"
                value={prodPriceIdr}
                onChange={(e) => setProdPriceIdr(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('label_product_desc', currentLang)}</label>
              <textarea
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Produk Digital (Link Download/Akses)</label>
              <input
                type="url"
                value={prodUrl || ''}
                onChange={(e) => setProdUrl(e.target.value)}
                placeholder="https://example.com/download/... atau https://drive.google.com/..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddProd(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100"
              >
                {t('btn_close', currentLang)}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                {t('btn_save_product', currentLang)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Products Cards & Bulk Stock Importer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>{t('tab_products', currentLang)} ({products.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((prod) => {
              const localized = getLocalizedProduct(prod, currentLang);
              const displayTitle = localized.title || prod.title;
              const displayDesc = localized.description || prod.description;
              const isAvailable = (prod.available_stocks || 0) > 0;

              return (
                <div
                  key={prod.product_id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md uppercase">
                        {prod.category}
                      </span>
                      <button
                        onClick={async () => {
                          const confirmed = await dialogConfirm({
                            title: 'Konfirmasi Hapus Produk',
                            message: `Apakah Anda yakin ingin menghapus produk "${displayTitle}"? Semua stok terkait tidak akan dapat dijual.`,
                            confirmLabel: 'Ya, Hapus',
                            cancelLabel: 'Batal',
                            isDestructive: true
                          });
                          if (confirmed) onDeleteProduct(prod.product_id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title={t('btn_delete', currentLang)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{displayTitle}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{displayDesc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900">${prod.price_usd}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
                        (Rp {(prod.price_idr || 0).toLocaleString('id-ID')})
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isAvailable 
                        ? `${t('label_available_stock', currentLang)}: ${prod.available_stocks}` 
                        : t('label_out_of_stock', currentLang)
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bulk Stock Importer (Right 1 col) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t('btn_add_stock', currentLang)}</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Format:
            <br />
            <code className="text-indigo-600 font-mono text-[11px] bg-indigo-50 px-1 py-0.5 rounded">
              Email:Password:Cookie
            </code>
          </p>

          <form onSubmit={handleBulkStockSubmit} className="space-y-4 flex-1 flex flex-col">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('th_product', currentLang)}</label>
              <select
                value={selectedProdForStock || (products[0]?.product_id ?? '')}
                onChange={(e) => setSelectedProdForStock(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {getLocalizedProduct(p, currentLang).title} (${p.price_usd})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daftar Akun (Email:Password:Cookie)</label>
              <textarea
                value={stockInputText}
                onChange={(e) => setStockInputText(e.target.value)}
                rows={6}
                placeholder="user1@domain.com:Password123!:sess_cookie_9918&#10;user2@domain.com:Password456!:sess_cookie_8812"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {stockMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                  stockMessage.includes('Berhasil')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {stockMessage.includes('Berhasil') ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{stockMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingStock}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {isSubmittingStock ? t('btn_processing', currentLang) : t('btn_bulk_add', currentLang)}
            </button>
          </form>
        </div>
      </div>

      {/* Stocks Inventory Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Gudang Akun / Inventory ({stocks.length})</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">{t('th_product', currentLang)}:</span>
            <select
              value={filterStockProd}
              onChange={(e) => setFilterStockProd(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
            >
              <option value="ALL">Semua Produk</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {getLocalizedProduct(p, currentLang).title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Stock ID</th>
                <th className="py-2.5 px-3">{t('th_product', currentLang)}</th>
                <th className="py-2.5 px-3">Format Akun (Email:Password:Cookie)</th>
                <th className="py-2.5 px-3">{t('th_status', currentLang)}</th>
                <th className="py-2.5 px-3 text-right">{t('th_actions', currentLang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Belum ada stok akun untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const prod = products.find((p) => p.product_id === stock.product_id);
                  const isAvailable = stock.status === 'AVAILABLE';

                  return (
                    <tr key={stock.stock_id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{stock.stock_id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {prod ? getLocalizedProduct(prod, currentLang).title : stock.product_id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 max-w-[320px] truncate" title={stock.account_data}>
                        {stock.account_data}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {stock.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={async () => {
                            const confirmed = await dialogConfirm({
                              title: 'Konfirmasi Hapus Stok',
                              message: 'Apakah Anda yakin ingin menghapus 1 item akun/stok ini?',
                              confirmLabel: 'Ya, Hapus',
                              cancelLabel: 'Batal',
                              isDestructive: true
                            });
                            if (confirmed) onDeleteStock(stock.stock_id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title={t('btn_delete', currentLang)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
