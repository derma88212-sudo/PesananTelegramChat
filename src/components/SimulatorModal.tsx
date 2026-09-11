import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Check, 
  RefreshCw, 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  Globe, 
  AlertCircle,
  Copy,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Product, CryptoWallet, Order } from '../types';
import { 
  SUPPORTED_LANGUAGES, 
  getClientUI, 
  parseAccountCredentialClient,
  ParsedCredential,
  getTokenExplorerUrl,
  getQrCodeUrl
} from '../utils/languages';
import { dialogAlert } from '../utils/dialog';

interface SimulatorModalProps {
  onClose: () => void;
  products: Product[];
  wallets: CryptoWallet[];
  onOrderCreated: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  buttons?: Array<{ label: string; action: () => void }>;
  qrUrl?: string;
  tokenUrl?: string;
  isDelivered?: boolean;
  parsedCredential?: ParsedCredential;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  onClose,
  products,
  wallets,
  onOrderCreated
}) => {
  const [currentLang, setCurrentLang] = useState<string>('id');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Start bot in initial language
    initBot(currentLang);
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    setMessages((prev) => [
      ...prev,
      {
        id: 'msg_user_lang_' + Date.now(),
        sender: 'user',
        text: `🌐 Switch language to ${SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.name || langCode}`
      },
      {
        id: 'msg_lang_changed_' + Date.now(),
        sender: 'bot',
        text: getClientUI('lang_changed_msg', langCode),
        buttons: [
          { label: getClientUI('menu_catalog', langCode), action: () => showCatalog(langCode) },
          { label: getClientUI('menu_orders', langCode), action: () => showOrders(langCode) },
          { label: getClientUI('menu_payments', langCode), action: () => showPayments(langCode) },
          { label: getClientUI('menu_help', langCode), action: () => showTerms(langCode) }
        ]
      }
    ]);
  };

  const initBot = (lang = currentLang) => {
    const welcome = getClientUI('welcome_title', lang) || 'Selamat Datang di Store Akun ChatGPT & Digital Goods';
    setMessages([
      {
        id: 'msg_welcome_' + Date.now(),
        sender: 'bot',
        text: `🤖 <b>${welcome}</b>\n\n⚡ ${getClientUI('instant_delivery_desc', lang) || 'Pengiriman instan & otomatis 24/7 via Google Cloud Firestore & Gateway NOWPayments.'}`,
        buttons: [
          { label: getClientUI('menu_catalog', lang), action: () => showCatalog(lang) },
          { label: getClientUI('menu_orders', lang), action: () => showOrders(lang) },
          { label: getClientUI('menu_payments', lang), action: () => showPayments(lang) },
          { label: getClientUI('menu_help', lang), action: () => showTerms(lang) }
        ]
      }
    ]);
  };

  const showPayments = async (lang = currentLang) => {
    setIsTyping(true);
    try {
      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'payments', user_lang: lang })
      });
      const data = await res.json();
      const text = data.text || 'Panduan pembayaran digital store';

      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_user_payments_' + Date.now(),
          sender: 'user',
          text: getClientUI('menu_payments', lang)
        },
        {
          id: 'msg_payments_guide_' + Date.now(),
          sender: 'bot',
          text,
          buttons: [
            { label: getClientUI('menu_catalog', lang), action: () => showCatalog(lang) },
            { label: getClientUI('btn_back', lang), action: () => initBot(lang) }
          ]
        }
      ]);
    } catch (e: any) {
      dialogAlert('Error: ' + e.message, 'Kesalahan', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const showOrders = async (lang = currentLang) => {
    setIsTyping(true);
    try {
      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'orders', user_lang: lang, telegram_id: 'sim_tg_9988' })
      });
      const data = await res.json();
      const guide = data.text || 'Riwayat pesanan Anda:';
      const userOrders: Order[] = data.orders || [];

      const buttons: Array<{ label: string; action: () => void }> = [];
      if (activeOrderId) {
        buttons.push({
          label: `🔍 Cek Pesanan Aktif #${activeOrderId}`,
          action: () => checkOrderStatus(activeOrderId, lang)
        });
      }

      userOrders.slice(0, 3).forEach(o => {
        if (o.order_id !== activeOrderId) {
          buttons.push({
            label: `📦 #${o.order_id} - ${o.product_title} (${o.payment_status})`,
            action: () => checkOrderStatus(o.order_id, lang)
          });
        }
      });

      buttons.push({ label: getClientUI('menu_catalog', lang), action: () => showCatalog(lang) });
      buttons.push({ label: getClientUI('btn_back', lang), action: () => initBot(lang) });

      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_user_orders_' + Date.now(),
          sender: 'user',
          text: getClientUI('menu_orders', lang)
        },
        {
          id: 'msg_orders_info_' + Date.now(),
          sender: 'bot',
          text: guide,
          buttons
        }
      ]);
    } catch (e: any) {
      dialogAlert('Error: ' + e.message, 'Kesalahan', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const submitManualTxid = async (orderId: string, lang = currentLang) => {
    const txHash = prompt('Masukkan TXID / Transaction Hash dari dompet kripto Anda:');
    if (!txHash || !txHash.trim()) return;

    setIsTyping(true);
    try {
      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_txid', order_id: orderId, tx_hash: txHash.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: 'msg_user_tx_' + Date.now(),
            sender: 'user',
            text: `TXID: ${txHash.trim()}`
          },
          {
            id: 'msg_bot_tx_saved_' + Date.now(),
            sender: 'bot',
            text: `✅ <b>BUKTI TRANSAKSI DITERIMA!</b>\n\nTXID: <code>${txHash.trim()}</code> telah dicatat pada sistem.\nAdmin akan memeriksa saldo blockchain dan melakukan verifikasi. Begitu disetujui, akun langsung otomatis terkirim.`,
            buttons: [
              { label: getClientUI('btn_check_payment', lang), action: () => checkOrderStatus(orderId, lang) },
              { label: '⚡ [TEST] Simulasi Pembayaran Sukses', action: () => simulateInstantPay(orderId, lang) }
            ]
          }
        ]);
        onOrderCreated();
      }
    } catch (e: any) {
      dialogAlert('Error: ' + e.message, 'Kesalahan', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const showTerms = (lang = currentLang) => {
    setMessages((prev) => [
      ...prev,
      {
        id: 'msg_user_help_' + Date.now(),
        sender: 'user',
        text: getClientUI('menu_help', lang)
      },
      {
        id: 'msg_terms_' + Date.now(),
        sender: 'bot',
        text: `ℹ️ <b>${getClientUI('menu_help', lang)}</b>\n\n🛡️ <b>Garansi & Kebijakan:</b>\n1. Kredensial akun (Email, Password, Cookie) otomatis dikirim detik itu juga setelah verifikasi pembayaran sah.\n2. Garansi replace aktif 30 hari jika ada kendala login.\n3. Dilarang mengganti email akun untuk menjaga validitas garansi.\n\n${getClientUI('warranty_tip', lang)}`,
        buttons: [
          { label: getClientUI('menu_catalog', lang), action: () => showCatalog(lang) },
          { label: getClientUI('btn_back', lang), action: () => initBot(lang) }
        ]
      }
    ]);
  };

  const showCatalog = (lang = currentLang) => {
    const buttons = products.map((p) => {
      // Localized title if present
      const localizedTitle = (p.translations && p.translations[lang]?.title) || p.title;
      const stock = p.available_stocks ?? 0;
      const isOut = stock <= 0;

      return {
        label: `${localizedTitle} - $${p.price_usd} (${isOut ? '⚠️ HABIS' : `Stok: ${stock}`})`,
        action: () => selectProduct(p, lang)
      };
    });

    buttons.push({
      label: getClientUI('btn_back', lang),
      action: () => initBot(lang)
    });

    setMessages((prev) => [
      ...prev,
      {
        id: 'msg_user_catalog_' + Date.now(),
        sender: 'user',
        text: getClientUI('menu_catalog', lang)
      },
      {
        id: 'msg_catalog_' + Date.now(),
        sender: 'bot',
        text: `📋 <b>${getClientUI('menu_catalog', lang).toUpperCase()}</b>\n\n${getClientUI('catalog_select_prompt', lang)}`,
        buttons
      }
    ]);
  };

  const selectProduct = (p: Product, lang = currentLang) => {
    const localizedTitle = (p.translations && p.translations[lang]?.title) || p.title;
    const localizedDesc = (p.translations && p.translations[lang]?.description) || p.description;
    const stock = p.available_stocks ?? 0;
    const isOut = stock <= 0;

    if (isOut) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_user_sel_' + Date.now(),
          sender: 'user',
          text: `Pilih ${localizedTitle}`
        },
        {
          id: 'msg_stock_out_' + Date.now(),
          sender: 'bot',
          text: `⚠️ <b>${getClientUI('out_of_stock_alert', lang)}</b>\n\nProduk <b>${localizedTitle}</b> saat ini persediaannya 0. Silakan hubungi admin atau pilih produk lain yang tersedia.`,
          buttons: [
            { label: getClientUI('menu_catalog', lang), action: () => showCatalog(lang) },
            { label: getClientUI('btn_back', lang), action: () => initBot(lang) }
          ]
        }
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: 'msg_user_select_' + Date.now(),
        sender: 'user',
        text: `Saya pilih ${localizedTitle}`
      },
      {
        id: 'msg_prod_detail_' + Date.now(),
        sender: 'bot',
        text: `💎 <b>${localizedTitle}</b>\n\n💰 Harga: <b>$${p.price_usd} USD</b> (~Rp ${(p.price_idr || 0).toLocaleString('id-ID')})\n📦 Stok Siap Kirim: <b>${stock} akun</b>\n\n📝 <i>${localizedDesc}</i>\n\nPilih metode pembayaran kripto yang Anda inginkan:`,
        buttons: [
          {
            label: `⚡ ${getClientUI('btn_pay_auto', lang)} (NOWPayments Gateway)`,
            action: () => createOrder(p, 'crypto_auto', undefined, lang)
          },
          {
            label: `💎 ${getClientUI('btn_pay_manual', lang)} (Pilih Dompet Digital)`,
            action: () => showManualWallets(p, lang)
          },
          {
            label: getClientUI('btn_back', lang),
            action: () => showCatalog(lang)
          }
        ]
      }
    ]);
  };

  const [liveWallets, setLiveWallets] = useState<CryptoWallet[]>(wallets || []);

  useEffect(() => {
    if (wallets && wallets.length > 0) {
      setLiveWallets(wallets);
    } else {
      fetch('/api/crypto/wallets')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.wallets) {
            setLiveWallets(data.wallets);
          }
        })
        .catch(() => {});
    }
  }, [wallets]);

  const showManualWallets = (p: Product, lang = currentLang) => {
    const activeWallets = liveWallets && liveWallets.length > 0 ? liveWallets.filter((w) => w.is_active) : [];

    if (activeWallets.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_no_wallet_' + Date.now(),
          sender: 'bot',
          text: `⚠️ <b>DOMPET KRIPTO BELUM TERSEDIA</b>\n\nAdmin toko belum menambahkan dompet manual aktif di menu Pengaturan Dompet Kripto. Silakan gunakan metode pembayaran otomatis.`,
          buttons: [
            {
              label: getClientUI('btn_buy_auto', lang),
              action: () => createOrder(p, 'crypto_auto', undefined, lang)
            },
            {
              label: getClientUI('btn_back', lang),
              action: () => selectProduct(p, lang)
            }
          ]
        }
      ]);
      return;
    }

    const buttons = activeWallets.map((w) => ({
      label: `🪙 ${w.network} (${w.currency || 'USD'})`,
      action: () => createOrder(p, 'crypto_manual', w as any, lang)
    }));

    buttons.push({
      label: getClientUI('btn_back', lang),
      action: () => selectProduct(p, lang)
    });

    setMessages((prev) => [
      ...prev,
      {
        id: 'msg_sel_wallet_' + Date.now(),
        sender: 'bot',
        text: `💼 <b>${getClientUI('btn_pay_manual', lang).toUpperCase()}</b>\n\nPilih salah satu jaringan dompet kripto resmi di bawah untuk mendapatkan rincian alamat deposit, kode QR, dan tautan blockchain explorer:`,
        buttons
      }
    ]);
  };

  const createOrder = async (p: Product, method: 'crypto_auto' | 'crypto_manual', wallet?: CryptoWallet, lang = currentLang) => {
    setIsTyping(true);
    try {
      const walletId = (wallet as any)?.wallet_id || (wallet as any)?.id;
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'sim_tg_9988',
          username: 'tester_buyer',
          product_id: p.product_id,
          payment_method: method,
          wallet_id: walletId,
          currency: wallet?.currency || 'USDT',
          crypto_network: wallet?.network || (method === 'crypto_auto' ? 'TRC-20' : undefined),
          user_lang: lang
        })
      });

      const data = await res.json();
      if (data.success && data.order) {
        const order: Order = data.order;
        setActiveOrderId(order.order_id);
        setActiveOrder(order);
        onOrderCreated();

        const qr = data.qr_url || (order.crypto_address ? getQrCodeUrl(order.crypto_address, 220) : undefined);

        setMessages((prev) => [
          ...prev,
          {
            id: 'msg_user_pay_' + Date.now(),
            sender: 'user',
            text: `Bayar via ${method === 'crypto_auto' ? 'NOWPayments Otomatis' : `Dompet Digital (${order.crypto_network || order.currency})`}`
          },
          {
            id: 'msg_invoice_' + Date.now(),
            sender: 'bot',
            text: `🧾 <b>INVOICE PEMBAYARAN: #${order.order_id}</b>\n\n` +
                  `📦 <b>Produk:</b> ${order.product_title}\n` +
                  `💰 <b>Total Tagihan:</b> <code>${order.amount} ${order.currency || 'USD'}</code> (${order.crypto_network || 'USDT'})\n` +
                  `🌐 <b>Jaringan Blockchain:</b> ${order.crypto_network || 'USDT'}\n` +
                  `📬 <b>Alamat Deposit Tujuan:</b>\n<code>${order.crypto_address}</code>\n\n` +
                  (qr ? `🖼️ <b>Tautan Gambar QR Code:</b>\n<a href="${qr}" target="_blank" rel="noopener noreferrer">${qr}</a>\n\n` : '') +
                  `📋 <b>PANDUAN PEMBAYARAN:</b>\n` +
                  `1. Transfer nominal tepat ke alamat di atas (atau scan gambar QR code di bawah).\n` +
                  `2. Setelah transfer, klik tombol <b>"${getClientUI('btn_check_payment', lang)}"</b> di bawah atau kirim bukti TXID.\n` +
                  `3. Akun HANYA akan dikirim otomatis bila transaksi terverifikasi di blockchain / disetujui admin.`,
            qrUrl: qr,
            tokenUrl: qr,
            buttons: [
              ...(qr ? [{
                label: '🖼️ Buka Gambar QR Code',
                action: () => window.open(qr, '_blank')
              }] : []),
              ...(method === 'crypto_manual' ? [{
                label: '📝 Kirim Bukti Transfer / TXID',
                action: () => submitManualTxid(order.order_id, lang)
              }] : []),
              {
                label: getClientUI('btn_check_payment', lang),
                action: () => checkOrderStatus(order.order_id, lang)
              },
              {
                label: '⚡ Verifikasi Pembayaran Sukses',
                action: () => simulateInstantPay(order.order_id, lang)
              },
              {
                label: `❌ ${getClientUI('btn_cancel_order', lang) || 'Batalkan Pesanan'}`,
                action: () => cancelSimulatedOrder(order.order_id, lang)
              }
            ]
          }
        ]);
      } else {
        dialogAlert(data.message || 'Gagal membuat pesanan', 'Gagal Pesan', 'error');
      }
    } catch (err: any) {
      dialogAlert('Error checkout: ' + err.message, 'Kesalahan', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const cancelSimulatedOrder = async (orderId: string, lang = currentLang) => {
    setIsTyping(true);
    try {
      await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_order', order_id: orderId })
      });
      if (activeOrderId === orderId) setActiveOrderId(null);
      onOrderCreated();

      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_user_cancel_' + Date.now(),
          sender: 'user',
          text: `❌ ${getClientUI('btn_cancel_order', lang) || 'Batalkan Pesanan'}`
        },
        {
          id: 'msg_cancelled_' + Date.now(),
          sender: 'bot',
          text: `❌ <b>Pesanan #${orderId} telah dibatalkan & otomatis dihapus dari penyimpanan database agar tidak penuh.</b>`,
          buttons: [
            { label: getClientUI('menu_catalog', lang), action: () => showCatalog(lang) },
            { label: getClientUI('btn_back', lang), action: () => initBot(lang) }
          ]
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const checkOrderStatus = async (orderId: string, lang = currentLang) => {
    setIsTyping(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const o: Order = data.data;
        setActiveOrder(o);

        if (o.payment_status === 'PAID' || o.payment_status === 'VERIFIED_BY_ADMIN') {
          const parsed = o.account_delivered ? parseAccountCredentialClient(o.account_delivered) : undefined;

          setMessages((prev) => [
            ...prev,
            {
              id: 'msg_user_check_' + Date.now(),
              sender: 'user',
              text: getClientUI('btn_check_payment', lang)
            },
            {
              id: 'msg_paid_' + Date.now(),
              sender: 'bot',
              text: `${getClientUI('payment_success_header', lang)}\n\n` +
                    `📦 <b>Produk:</b> ${o.product_title}\n` +
                    `🆔 <b>Order ID:</b> <code>${o.order_id}</code>\n\n` +
                    `${getClientUI('credentials_label', lang)}\n` +
                    `<code>${o.account_delivered}</code>\n\n` +
                    `${getClientUI('warranty_tip', lang)}`,
              isDelivered: true,
              parsedCredential: parsed,
              buttons: [
                { label: '🧾 Lihat Bukti Pembayaran Berhasil', action: () => showReceipt(o, lang) },
                { label: getClientUI('menu_catalog', lang), action: () => showCatalog(lang) },
                { label: getClientUI('btn_back', lang), action: () => initBot(lang) }
              ]
            }
          ]);
        } else {
          // STRICT PAYMENT FAILURE / PENDING
          setMessages((prev) => [
            ...prev,
            {
              id: 'msg_user_check_' + Date.now(),
              sender: 'user',
              text: getClientUI('btn_check_payment', lang)
            },
            {
              id: 'msg_pending_' + Date.now(),
              sender: 'bot',
              text: `⏳ <b>STATUS: ${o.payment_status}</b>\n\n` +
                    `⚠️ <b>${getClientUI('payment_pending_notice', lang)}</b>\n\n` +
                    `Akun kredensial <b>TIDAK DIKIRIMKAN</b> sebelum pembayaran terkonfirmasi di blockchain NOWPayments atau disetujui manual oleh Admin di Web Admin Panel.`,
              buttons: [
                {
                  label: getClientUI('btn_check_payment', lang),
                  action: () => checkOrderStatus(orderId, lang)
                },
                {
                  label: '⚡ [TEST] Simulasi Pembayaran Sukses',
                  action: () => simulateInstantPay(orderId, lang)
                }
              ]
            }
          ]);
        }
      }
    } finally {
      setIsTyping(false);
    }
  };

  const simulateInstantPay = async (orderId: string, lang = currentLang) => {
    setIsTyping(true);
    try {
      await fetch(`/api/orders/${orderId}/approve`, { method: 'POST' });
      onOrderCreated();
      await checkOrderStatus(orderId, lang);
    } finally {
      setIsTyping(false);
    }
  };

  const showReceipt = (order: Order, lang = currentLang) => {
    const parsed = order.account_delivered ? parseAccountCredentialClient(order.account_delivered) : null;
    const isPaid = order.payment_status === 'PAID' || order.payment_status === 'VERIFIED_BY_ADMIN';
    const dateFormatted = new Date(order.updated_at || order.created_at || Date.now()).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    let credBlock = '';
    if (order.account_delivered) {
      if (parsed?.email && parsed?.password) {
        credBlock = `📧 <b>Email:</b> <code>${parsed.email}</code>\n` +
                    `🔑 <b>Password:</b> <code>${parsed.password}</code>\n` +
                    (parsed.cookie ? `🍪 <b>Cookie:</b> <code>${parsed.cookie}</code>\n` : '') +
                    (parsed.apiKey ? `🔑 <b>API Key:</b> <code>${parsed.apiKey}</code>\n` : '') +
                    (parsed.note ? `📝 <b>Catatan:</b> ${parsed.note}\n` : '');
      } else {
        credBlock = `<code>${order.account_delivered}</code>`;
      }
    } else {
      credBlock = '<i>Kredensial akun diproses oleh sistem</i>';
    }

    let displayTx = order.tx_hash || 'Telah Diverifikasi Resmi';
    if (displayTx.includes('[Bukti Gambar ID:') || displayTx.includes('[Photo:')) {
      displayTx = 'Foto Bukti Transfer (Gambar Asli Tersimpan)';
    }

    const receiptText = `🧾 <b>STRUK BUKTI PEMBAYARAN BERHASIL</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>Nomor Invoice:</b> <code>${order.order_id}</code>\n` +
      `📦 <b>Produk:</b> ${order.product_title}\n` +
      `💰 <b>Total Dibayar:</b> <code>${order.amount} ${order.currency || 'USD'}</code>\n` +
      `🌐 <b>Metode:</b> ${order.payment_method === 'crypto_auto' ? 'NOWPayments (Otomatis)' : `Transfer Dompet Kripto Manual (${order.crypto_network || 'Kripto'})`}\n` +
      `📬 <b>Alamat Dompet Tujuan:</b>\n<code>${order.crypto_address || '-'}</code>\n` +
      `📝 <b>Bukti Transfer:</b>\n<code>${displayTx}</code>\n` +
      `📅 <b>Waktu Transaksi:</b> ${dateFormatted} WIB\n` +
      `📊 <b>Status:</b> ${isPaid ? '✅ <b>LUNAS & TERVERIFIKASI</b>' : `⏳ <b>${order.payment_status}</b>`}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔑 <b>DATA KREDENSIAL AKUN TERKIRIM:</b>\n` +
      `${credBlock}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔒 <i>Struk ini adalah bukti resmi pembayaran berhasil. Garansi akun aktif sesuai ketentuan.</i>`;

    setMessages((prev) => [
      ...prev,
      {
        id: 'msg_receipt_' + Date.now(),
        sender: 'bot',
        text: receiptText,
        buttons: [
          { label: getClientUI('menu_catalog', lang), action: () => showCatalog(lang) },
          { label: getClientUI('btn_back', lang), action: () => initBot(lang) }
        ]
      }
    ]);
  };

  const checkStatusPrompt = (lang = currentLang) => {
    if (activeOrderId) {
      checkOrderStatus(activeOrderId, lang);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_user_status_' + Date.now(),
          sender: 'user',
          text: getClientUI('menu_orders', lang)
        },
        {
          id: 'msg_no_active_' + Date.now(),
          sender: 'bot',
          text: `ℹ️ <b>${getClientUI('menu_orders', lang)}</b>\n\nAnda belum memiliki riwayat pesanan di sesi simulator ini. Silakan buka katalog produk untuk melakukan pemesanan pertama!`,
          buttons: [
            { label: getClientUI('menu_catalog', lang), action: () => showCatalog(lang) }
          ]
        }
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[640px] max-h-[92vh]">
        
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm">Telegram Bot Simulator</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[11px] text-slate-400 block">
                Testing Flow Pelanggan • 10 Bahasa • Real Polling
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selector Bar (10 Languages) */}
        <div className="bg-slate-800 px-3 py-1.5 flex items-center gap-1 overflow-x-auto shrink-0 border-b border-slate-700/80">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mr-1 shrink-0">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Pilih Bahasa:</span>
          </span>
          {SUPPORTED_LANGUAGES.map((l) => {
            const isActive = currentLang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold shrink-0 transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-700/80'
                }`}
                title={l.name}
              >
                <span>{l.flag}</span>
                <span className="text-[10px]">{l.code.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Message History Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                }`}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                  className="space-y-1 font-sans"
                />

                {/* QR Code if present */}
                {msg.qrUrl && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center">
                    <img
                      src={msg.qrUrl}
                      alt="Deposit QR"
                      className="w-36 h-36 rounded-lg border border-slate-200"
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-1.5">
                      Pindai QR untuk Pembayaran Kripto
                    </span>
                  </div>
                )}

                {/* Token / Explorer Link if present */}
                {msg.tokenUrl && (
                  <div className="mt-2.5">
                    <a
                      href={msg.tokenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka URL Token / Blockchain Explorer</span>
                    </a>
                  </div>
                )}

                {/* Parsed Credential Card if delivered */}
                {msg.parsedCredential && msg.parsedCredential.email && (
                  <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-emerald-800 font-bold text-xs">
                      <span className="flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" />
                        Kredensial Siap Pakai
                      </span>
                      <button
                        onClick={() => handleCopy(msg.parsedCredential?.raw || '', 'cred_' + msg.id)}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                      >
                        {copiedKey === 'cred_' + msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === 'cred_' + msg.id ? 'Tersalin' : 'Salin Semua'}
                      </button>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-emerald-100 font-mono text-[11px] space-y-1 text-slate-700">
                      <div><span className="text-slate-400 font-sans">Email: </span><b>{msg.parsedCredential.email}</b></div>
                      <div><span className="text-slate-400 font-sans">Pass: </span><b>{msg.parsedCredential.password}</b></div>
                      {msg.parsedCredential.cookie && (
                        <div className="truncate"><span className="text-slate-400 font-sans">Cookie: </span>{msg.parsedCredential.cookie}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Inline Action Buttons */}
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5 w-full max-w-[85%]">
                  {msg.buttons.map((btn, bIdx) => (
                    <button
                      key={bIdx}
                      onClick={btn.action}
                      className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-slate-800 hover:text-blue-700 rounded-xl text-xs font-semibold shadow-2xs transition-all active:scale-[0.99] flex items-center justify-between"
                    >
                      <span className="truncate">{btn.label}</span>
                      <span className="text-slate-400 text-[11px]">›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white border border-slate-200 px-3 py-2 rounded-xl w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Bot sedang memproses...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer controls */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => initBot(currentLang)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset /start</span>
          </button>

          <span className="text-[11px] text-slate-400">
            Bahasa aktif: <b>{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.name}</b>
          </span>

          <button
            onClick={() => showCatalog(currentLang)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
          >
            <span>Buka Katalog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
