export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾', dir: 'ltr' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺', dir: 'ltr' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸', dir: 'ltr' },
  { code: 'it', name: 'Italiano (Italian)', flag: '🇮🇹', dir: 'ltr' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪', dir: 'ltr' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷', dir: 'ltr' },
  { code: 'pt', name: 'Português (Portuguese)', flag: '🇧🇷', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳', dir: 'ltr' },
  { code: 'uz', name: "O'zbekcha (Uzbek)", flag: '🇺🇿', dir: 'ltr' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe (Turkish)', flag: '🇹🇷', dir: 'ltr' }
];

export const UI_STRINGS: Record<string, Record<string, string>> = {
  // Navigation Tabs
  tab_orders: {
    id: 'Pesanan & Verifikasi',
    en: 'Orders & Verification',
    ms: 'Pesanan & Pengesahan',
    zh: '订单与审核',
    ru: 'Заказы и верификация',
    es: 'Pedidos y Verificación',
    it: 'Ordini e Verifica',
    de: 'Bestellungen & Verifizierung',
    fr: 'Commandes & Vérification',
    pt: 'Pedidos e Verificação',
    hi: 'ऑर्डर और सत्यापन',
    uz: 'Buyurtmalar va tasdiqlash',
    ar: 'الطلبات والتحقق',
    ja: '注文と検証',
    tr: 'Siparişler ve Doğrulama'
  },
  tab_products: {
    id: 'Produk & Stok',
    en: 'Products & Stock',
    ms: 'Produk & Stok',
    zh: '商品与库存',
    ru: 'Товары и склад',
    es: 'Productos y Stock',
    it: 'Prodotti e Magazzino',
    de: 'Produkte & Lager',
    fr: 'Produits & Stock',
    pt: 'Produtos e Estoque',
    hi: 'उत्पाद और स्टॉक',
    uz: 'Mahsulotlar va zaxira',
    ar: 'المنتجات والمخزون',
    ja: '製品と在庫',
    tr: 'Ürünler ve Stok'
  },
  tab_wallets: {
    id: 'Dompet Kripto',
    en: 'Crypto Wallets',
    ms: 'Dompet Kripto',
    zh: '加密钱包',
    ru: 'Крипто-кошельки',
    es: 'Billeteras Cripto',
    it: 'Portafogli Crypto',
    de: 'Krypto-Wallets',
    fr: 'Portefeuilles Crypto',
    pt: 'Carteiras Cripto',
    hi: 'क्रिप्टो वॉलेट्स',
    uz: 'Kripto hamyonlar',
    ar: 'محافظ العملات الرقمية',
    ja: '暗号資産ウォレット',
    tr: 'Kripto Cüzdanları'
  },
  tab_bots: {
    id: 'Multi-Bot Telegram',
    en: 'Telegram Multi-Bot',
    ms: 'Pelbagai Bot Telegram',
    zh: 'Telegram 多机器人',
    ru: 'Telegram Мульти-боты',
    es: 'Multi-Bot de Telegram',
    it: 'Multi-Bot Telegram',
    de: 'Telegram Multi-Bot',
    fr: 'Multi-Bot Telegram',
    pt: 'Multi-Bot do Telegram',
    hi: 'टेलीग्राम मल्टी-बॉट',
    uz: 'Telegram ko\'p botlar',
    ar: 'روبوتات تيليجرام المتعددة',
    ja: 'Telegramマルチボット',
    tr: 'Telegram Çoklu Bot'
  },
  tab_database: {
    id: 'Database & Cloud Migrasi',
    en: 'Database & Cloud Migration',
    ms: 'Pangkalan Data & Migrasi Awan',
    zh: '数据库与云迁移',
    ru: 'База данных и облачная миграция',
    es: 'Base de Datos y Migración Cloud',
    it: 'Database e Migrazione Cloud',
    de: 'Datenbank & Cloud-Migration',
    fr: 'Base de Données & Migration Cloud',
    pt: 'Banco de Dados e Migração em Nuvem',
    hi: 'डेटाबेस और क्लाउड माइग्रेशन',
    uz: 'Ma\'lumotlar bazasi va bulutli migratsiya',
    ar: 'قاعدة البيانات والترحيل السحابي',
    ja: 'データベースとクラウド移行',
    tr: 'Veritabanı ve Bulut Taşıma'
  },
  tab_settings: {
    id: 'Pengaturan Toko',
    en: 'Store Settings',
    ms: 'Tetapan Kedai',
    zh: '商店设置',
    ru: 'Настройки магазина',
    es: 'Configuración de Tienda',
    it: 'Impostazioni Negozio',
    de: 'Shop-Einstellungen',
    fr: 'Paramètres de la Boutique',
    pt: 'Configurações da Loja',
    hi: 'दुकान सेटिंग्स',
    uz: 'Do\'kon sozlamalari',
    ar: 'إعدادات المتجر',
    ja: '店舗設定',
    tr: 'Mağaza Ayarları'
  },
  tab_admins: {
    id: 'Kelola Admin',
    en: 'Manage Admins',
    ms: 'Urus Pentadbir',
    zh: '管理员管理',
    ru: 'Управление админами',
    es: 'Gestionar Administradores',
    it: 'Gestisci Admin',
    de: 'Administratoren verwalten',
    fr: 'Gérer les Administrateurs',
    pt: 'Gerenciar Administradores',
    hi: 'एडमिन प्रबंधित करें',
    uz: 'Adminlarni boshqarish',
    ar: 'إدارة المسؤولين',
    ja: '管理者管理',
    tr: 'Yöneticileri Yönet'
  },
  btn_simulator: {
    id: '🎮 Uji Bot',
    en: '🎮 Test Bot',
    ms: '🎮 Uji Bot',
    zh: '🎮 测试机器人',
    ru: '🎮 Тест бота',
    es: '🎮 Probar Bot',
    it: '🎮 Testa Bot',
    de: '🎮 Bot testen',
    fr: '🎮 Tester le Bot',
    pt: '🎮 Testar Bot',
    hi: '🎮 बॉट परीक्षण',
    uz: '🎮 Botni sinash',
    ar: '🎮 تجربة الروبوت',
    ja: '🎮 ボットテスト',
    tr: '🎮 Botu Test Et'
  },
  btn_logout: {
    id: 'Keluar',
    en: 'Logout',
    ms: 'Log Keluar',
    zh: '退出登录',
    ru: 'Выйти',
    es: 'Cerrar Sesión',
    it: 'Esci',
    de: 'Abmelden',
    fr: 'Déconnexion',
    pt: 'Sair',
    hi: 'लॉगआउट',
    uz: 'Chiqish',
    ar: 'تسجيل الخروج',
    ja: 'ログアウト',
    tr: 'Çıkış Yap'
  },

  // Orders Actions & Buttons
  orders_title: {
    id: 'Manajemen Pesanan & Verifikasi Ketat',
    en: 'Strict Order Management & Verification',
    ms: 'Pengurusan Pesanan & Pengesahan Ketat',
    zh: '严格订单管理与核验',
    ru: 'Управление заказами и строгая проверка',
    es: 'Gestión de Pedidos y Verificación Estricta',
    it: 'Gestione Ordini e Verifica Rigorosa',
    de: 'Strenge Auftragsverwaltung & Prüfung',
    fr: 'Gestion Rigoureuse des Commandes',
    pt: 'Gerenciamento Rigoroso de Pedidos',
    hi: 'सख्त ऑर्डर प्रबंधन और सत्यापन',
    uz: 'Qat\'iy buyurtma boshqaruvi va tekshiruvi',
    ar: 'إدارة الطلبات والتحقق الصارم',
    ja: '厳格な注文管理と検証',
    tr: 'Sıkı Sipariş Yönetimi ve Doğrulama'
  },
  orders_subtitle: {
    id: 'Sistem pengiriman anti-bypass: Akun hanya terkirim saat pembayaran terverifikasi sah di blockchain atau disetujui admin.',
    en: 'Anti-bypass delivery system: Credentials only dispatched once payment is strictly verified on blockchain or approved by admin.',
    ms: 'Sistem penghantaran anti-bypass: Akaun hanya dihantar setelah pembayaran sah disahkan pada blockchain atau diluluskan oleh pentadbir.',
    zh: '防旁路自动发货系统：仅在区块链有效确认或管理员手动批准后才发送账号凭证。',
    ru: 'Система защищенной выдачи: аккаунты отправляются ТОЛЬКО после подтверждения в блокчейне или одобрения администратором.',
    es: 'Sistema de entrega anti-bypass: Las credenciales solo se entregan tras verificación válida en blockchain o aprobación del admin.',
    it: 'Sistema anti-bypass: Credenziali inviate SOLO dopo conferma valida su blockchain o approvazione admin.',
    de: 'Anti-Bypass-Liefersystem: Kontozugangsdaten werden erst nach Blockchain-Verifizierung oder Admin-Freigabe versendet.',
    fr: 'Système anti-contournement: Les identifiants sont envoyés uniquement après validation blockchain ou approbation administrateur.',
    pt: 'Sistema anti-fraude: Credenciais enviadas apenas após confirmação estrita na blockchain ou aprovação do admin.',
    hi: 'एंटी-बाईपास डिलीवरी सिस्टम: ब्लॉकचेन सत्यापन या व्यवस्थापक अनुमोदन के बाद ही खाता भेजा जाता है।',
    uz: 'Anti-bypass yetkazib berish: Hisob ma\'lumotlari faqat blokcheynda tasdiqlangan yoki admin ma\'qullaganidan so\'ng yuboriladi.',
    ar: 'نظام التسليم الآمن: لا يتم إرسال بيانات الحساب إلا بعد التحقق من البلوكشين أو موافقة المسؤول.',
    ja: 'アンチバイパス配信システム: ブロックチェーンで検証または管理者承認後にのみアカウント情報が送信されます。',
    tr: 'Anti-bypass teslimat sistemi: Hesap bilgileri yalnızca blokzincirde doğrulandıktan veya yönetici onayladıktan sonra gönderilir.'
  },
  btn_approve: {
    id: 'Setujui & Kirim',
    en: 'Approve & Send',
    ms: 'Luluskan & Hantar',
    zh: '审核通过并发送',
    ru: 'Одобрить и отправить',
    es: 'Aprobar y Enviar',
    it: 'Approva e Invia',
    de: 'Genehmigen & Senden',
    fr: 'Approuver & Envoyer',
    pt: 'Aprovar e Enviar',
    hi: 'स्वीकृत करें और भेजें',
    uz: 'Tasdiqlash va yuborish',
    ar: 'الموافقة والإرسال',
    ja: '承認して送信',
    tr: 'Onayla ve Gönder'
  },
  btn_cancel: {
    id: 'Batalkan Pesanan',
    en: 'Cancel Order',
    ms: 'Batalkan Pesanan',
    zh: '取消订单',
    ru: 'Отменить заказ',
    es: 'Cancelar Pedido',
    it: 'Annulla Ordine',
    de: 'Bestellung stornieren',
    fr: 'Annuler la commande',
    pt: 'Cancelar Pedido',
    hi: 'ऑर्डर रद्द करें',
    uz: 'Buyurtmani bekor qilish',
    ar: 'إلغاء الطلب',
    ja: '注文をキャンセル',
    tr: 'Siparişi İptal Et'
  },
  btn_reset: {
    id: 'Reset Pesanan',
    en: 'Reset Order',
    ms: 'Tetapkan Semula Pesanan',
    zh: '重置订单',
    ru: 'Сбросить заказ',
    es: 'Restablecer Pedido',
    it: 'Reimposta Ordine',
    de: 'Bestellung zurücksetzen',
    fr: 'Réinitialiser la commande',
    pt: 'Redefinir Pedido',
    hi: 'ऑर्डर रीसेट करें',
    uz: 'Buyurtmani qayta tiklash',
    ar: 'إعادة تعيين الطلب',
    ja: '注文をリセット',
    tr: 'Siparişi Sıfırla'
  },
  btn_delete: {
    id: 'Hapus Permanen',
    en: 'Delete Permanently',
    ms: 'Padam Kekal',
    zh: '永久删除',
    ru: 'Удалить навсегда',
    es: 'Eliminar Permanentemente',
    it: 'Elimina Definitivamente',
    de: 'Endgültig löschen',
    fr: 'Supprimer définitivement',
    pt: 'Excluir Definitivamente',
    hi: 'स्थायी रूप से हटाएं',
    uz: 'Butunlay o\'chirish',
    ar: 'حذف نهائي',
    ja: '完全に削除',
    tr: 'Kalıcı Olarak Sil'
  },
  btn_receipt: {
    id: 'Struk',
    en: 'Receipt',
    ms: 'Resit',
    zh: '收据',
    ru: 'Чек',
    es: 'Recibo',
    it: 'Ricevuta',
    de: 'Beleg',
    fr: 'Reçu',
    pt: 'Comprovante',
    hi: 'रसीद',
    uz: 'Kvitansiya',
    ar: 'إيصال',
    ja: 'レシート',
    tr: 'Makbuz'
  },
  btn_detail: {
    id: 'Detail',
    en: 'Details',
    ms: 'Butiran',
    zh: '详情',
    ru: 'Детали',
    es: 'Detalles',
    it: 'Dettagli',
    de: 'Details',
    fr: 'Détails',
    pt: 'Detalhes',
    hi: 'विवरण',
    uz: 'Tafsilotlar',
    ar: 'التفاصيل',
    ja: '詳細',
    tr: 'Ayrıntılar'
  },
  btn_backup_orders: {
    id: 'Backup Pesanan',
    en: 'Backup Orders',
    ms: 'Sandaran Pesanan',
    zh: '备份订单',
    ru: 'Резервная копия',
    es: 'Copia de Seguridad',
    it: 'Backup Ordini',
    de: 'Bestell-Backup',
    fr: 'Sauvegarder',
    pt: 'Fazer Backup',
    hi: 'ऑर्डर बैकअप',
    uz: 'Zaxira nusxa',
    ar: 'نسخ احتياطي',
    ja: '注文バックアップ',
    tr: 'Siparişleri Yedekle'
  },
  btn_export_csv: {
    id: 'Ekspor CSV',
    en: 'Export CSV',
    ms: 'Eksport CSV',
    zh: '导出 CSV',
    ru: 'Экспорт в CSV',
    es: 'Exportar CSV',
    it: 'Esporta CSV',
    de: 'CSV exportieren',
    fr: 'Exporter CSV',
    pt: 'Exportar CSV',
    hi: 'CSV निर्यात',
    uz: 'CSV yuklab olish',
    ar: 'تصدير CSV',
    ja: 'CSVエクスポート',
    tr: 'CSV Dışa Aktar'
  },
  btn_export_json: {
    id: 'Ekspor JSON',
    en: 'Export JSON',
    ms: 'Eksport JSON',
    zh: '导出 JSON',
    ru: 'Экспорт в JSON',
    es: 'Exportar JSON',
    it: 'Esporta JSON',
    de: 'JSON exportieren',
    fr: 'Exporter JSON',
    pt: 'Exportar JSON',
    hi: 'JSON निर्यात',
    uz: 'JSON yuklab olish',
    ar: 'تصدير JSON',
    ja: 'JSONエクスポート',
    tr: 'JSON Dışa Aktar'
  },
  btn_reset_completed: {
    id: 'Reset Pesanan Selesai',
    en: 'Reset Completed Orders',
    ms: 'Tetapkan Semula Pesanan Selesai',
    zh: '重置已完成订单',
    ru: 'Сбросить завершенные заказы',
    es: 'Restablecer Pedidos Completados',
    it: 'Reimposta Ordini Completati',
    de: 'Abgeschlossene zurücksetzen',
    fr: 'Réinitialiser terminées',
    pt: 'Redefinir Concluídos',
    hi: 'पूर्ण ऑर्डर रीसेट करें',
    uz: 'Tugallanganlarni tiklash',
    ar: 'إعادة تعيين الطلبات المكتملة',
    ja: '完了注文をリセット',
    tr: 'Tamamlananları Sıfırla'
  },
  btn_purge_cancelled: {
    id: 'Bersihkan Pesanan Batal',
    en: 'Purge Cancelled Orders',
    ms: 'Bersihkan Pesanan Batal',
    zh: '清理已取消订单',
    ru: 'Очистить отмененные заказы',
    es: 'Limpiar Pedidos Cancelados',
    it: 'Pulisci Ordini Annullati',
    de: 'Stornierte löschen',
    fr: 'Purger les annulées',
    pt: 'Limpar Cancelados',
    hi: 'रद्द ऑर्डर हटाएं',
    uz: 'Bekor qilinganlarni o\'chirish',
    ar: 'مسح الطلبات الملغاة',
    ja: 'キャンセル注文を整理',
    tr: 'İptal Edilenleri Temizle'
  },
  search_orders_placeholder: {
    id: 'Cari Order ID, @username, produk, atau wallet...',
    en: 'Search Order ID, @username, product, or wallet...',
    ms: 'Cari Order ID, @username, produk, atau dompet...',
    zh: '搜索订单号、@用户名、商品或钱包地址...',
    ru: 'Поиск по ID заказа, @юзернейму, товару или кошельку...',
    es: 'Buscar ID de pedido, @usuario, producto o billetera...',
    it: 'Cerca ID ordine, @username, prodotto o portafoglio...',
    de: 'Bestell-ID, @Benutzername, Produkt oder Wallet suchen...',
    fr: 'Rechercher ID commande, @nom_utilisateur, produit ou wallet...',
    pt: 'Buscar ID do pedido, @usuário, produto ou carteira...',
    hi: 'ऑर्डर आईडी, @यूज़रनेम, उत्पाद या वॉलेट खोजें...',
    uz: 'Buyurtma ID, @foydalanuvchi, mahsulot yoki hamyon qidirish...',
    ar: 'البحث عن رقم الطلب، اسم المستخدم، المنتج، أو المحفظة...',
    ja: '注文ID、@ユーザー名、製品、またはウォレットを検索...',
    tr: 'Sipariş ID, @kullanıcı adı, ürün veya cüzdan ara...'
  },
  filter_all: {
    id: 'Semua',
    en: 'All',
    ms: 'Semua',
    zh: '全部',
    ru: 'Все',
    es: 'Todos',
    it: 'Tutti',
    de: 'Alle',
    fr: 'Tous',
    pt: 'Todos',
    hi: 'सभी',
    uz: 'Barchasi',
    ar: 'الكل',
    ja: 'すべて',
    tr: 'Tümü'
  },
  filter_pending: {
    id: 'Menunggu Verifikasi',
    en: 'Pending Verification',
    ms: 'Menunggu Pengesahan',
    zh: '待审核',
    ru: 'Ожидает проверки',
    es: 'Pendiente',
    it: 'In Attesa',
    de: 'Ausstehend',
    fr: 'En Attente',
    pt: 'Pendente',
    hi: 'प्रतीक्षारत',
    uz: 'Kutilmoqda',
    ar: 'قيد الانتظار',
    ja: '確認待ち',
    tr: 'Bekliyor'
  },
  filter_paid: {
    id: 'Lunas / Terkirim',
    en: 'Paid / Delivered',
    ms: 'Selesai / Dihantar',
    zh: '已付款 / 已发货',
    ru: 'Оплачено / Отправлено',
    es: 'Pagado / Entregado',
    it: 'Pagato / Consegnato',
    de: 'Bezahlt / Geliefert',
    fr: 'Payé / Livré',
    pt: 'Pago / Entregue',
    hi: 'भुगतान पूर्ण / भेजा गया',
    uz: 'To\'langan / Yetkazilgan',
    ar: 'مدفوع / تم التسليم',
    ja: '支払済 / 送信済',
    tr: 'Ödendi / Teslim Edildi'
  },
  filter_cancelled: {
    id: 'Dibatalkan',
    en: 'Cancelled',
    ms: 'Dibatalkan',
    zh: '已取消',
    ru: 'Отменено',
    es: 'Cancelado',
    it: 'Annullato',
    de: 'Storniert',
    fr: 'Annulé',
    pt: 'Cancelado',
    hi: 'रद्द किया गया',
    uz: 'Bekor qilingan',
    ar: 'ملغي',
    ja: 'キャンセル',
    tr: 'İptal Edildi'
  },
  th_order_time: {
    id: 'Order ID & Waktu',
    en: 'Order ID & Time',
    ms: 'ID Pesanan & Masa',
    zh: '订单号与时间',
    ru: 'ID заказа и время',
    es: 'ID de Pedido y Hora',
    it: 'ID Ordine e Data',
    de: 'Bestell-ID & Zeit',
    fr: 'ID Commande & Date',
    pt: 'ID do Pedido e Hora',
    hi: 'ऑर्डर आईडी और समय',
    uz: 'Buyurtma ID va vaqt',
    ar: 'رقم الطلب والوقت',
    ja: '注文IDと日時',
    tr: 'Sipariş ID ve Zaman'
  },
  th_buyer: {
    id: 'Pembeli (Telegram)',
    en: 'Buyer (Telegram)',
    ms: 'Pembeli (Telegram)',
    zh: '买家 (Telegram)',
    ru: 'Покупатель (Telegram)',
    es: 'Comprador (Telegram)',
    it: 'Acquirente (Telegram)',
    de: 'Käufer (Telegram)',
    fr: 'Acheteur (Telegram)',
    pt: 'Comprador (Telegram)',
    hi: 'खरीदार (टेलीग्राम)',
    uz: 'Xaridor (Telegram)',
    ar: 'المشتري (تيليجرام)',
    ja: '購入者 (Telegram)',
    tr: 'Alıcı (Telegram)'
  },
  th_product: {
    id: 'Produk',
    en: 'Product',
    ms: 'Produk',
    zh: '商品',
    ru: 'Товар',
    es: 'Producto',
    it: 'Prodotto',
    de: 'Produkt',
    fr: 'Produit',
    pt: 'Produto',
    hi: 'उत्पाद',
    uz: 'Mahsulot',
    ar: 'المنتج',
    ja: '製品',
    tr: 'Ürün'
  },
  th_amount: {
    id: 'Nominal',
    en: 'Amount',
    ms: 'Jumlah',
    zh: '金额',
    ru: 'Сумма',
    es: 'Monto',
    it: 'Importo',
    de: 'Betrag',
    fr: 'Montant',
    pt: 'Valor',
    hi: 'राशि',
    uz: 'Summa',
    ar: 'المبلغ',
    ja: '金額',
    tr: 'Tutar'
  },
  th_status: {
    id: 'Status & Keamanan',
    en: 'Status & Security',
    ms: 'Status & Keselamatan',
    zh: '状态与安全',
    ru: 'Статус и безопасность',
    es: 'Estado y Seguridad',
    it: 'Stato e Sicurezza',
    de: 'Status & Sicherheit',
    fr: 'Statut & Sécurité',
    pt: 'Status e Segurança',
    hi: 'स्थिति और सुरक्षा',
    uz: 'Holat va xavfsizlik',
    ar: 'الحالة والأمان',
    ja: 'ステータスとセキュリティ',
    tr: 'Durum ve Güvenlik'
  },
  th_credentials: {
    id: 'Kredensial Akun',
    en: 'Account Credentials',
    ms: 'Kredensial Akaun',
    zh: '账号凭证',
    ru: 'Данные аккаунта',
    es: 'Credenciales de Cuenta',
    it: 'Credenziali Account',
    de: 'Konto-Zugangsdaten',
    fr: 'Identifiants Compte',
    pt: 'Credenciais da Conta',
    hi: 'खाता क्रेडेंशियल',
    uz: 'Hisob ma\'lumotlari',
    ar: 'بيانات الحساب',
    ja: 'アカウント認証情報',
    tr: 'Hesap Bilgileri'
  },
  th_actions: {
    id: 'Aksi Admin',
    en: 'Admin Actions',
    ms: 'Tindakan Pentadbir',
    zh: '管理员操作',
    ru: 'Действия админа',
    es: 'Acciones de Admin',
    it: 'Azioni Admin',
    de: 'Admin-Aktionen',
    fr: 'Actions Admin',
    pt: 'Ações do Admin',
    hi: 'व्यवस्थापक कार्रवाई',
    uz: 'Admin amallari',
    ar: 'إجراءات المسؤول',
    ja: '管理者アクション',
    tr: 'Yönetici İşlemleri'
  },

  // Products Tab Actions & Labels
  products_title: {
    id: 'Katalog Produk & Stok Akun',
    en: 'Product Catalog & Account Stock',
    ms: 'Katalog Produk & Stok Akaun',
    zh: '商品目录与账号库存',
    ru: 'Каталог товаров и склад аккаунтов',
    es: 'Catálogo de Productos y Stock de Cuentas',
    it: 'Catalogo Prodotti e Stock Account',
    de: 'Produktkatalog & Kontobestand',
    fr: 'Catalogue de Produits & Stock de Comptes',
    pt: 'Catálogo de Produtos e Estoque de Contas',
    hi: 'उत्पाद सूची और खाता स्टॉक',
    uz: 'Mahsulotlar katalogi va hisoblar zaxirasi',
    ar: 'كتالوج المنتجات ومخزون الحسابات',
    ja: '製品カタログとアカウント在庫',
    tr: 'Ürün Kataloğu ve Hesap Stoğu'
  },
  products_subtitle: {
    id: 'Kelola harga USD/IDR, persediaan kredensial, dan auto-terjemahan 15 bahasa.',
    en: 'Manage USD/IDR prices, credential inventories, and 15-language auto-translation.',
    ms: 'Urus harga USD/IDR, inventori kredensial, dan terjemahan automatik 15 bahasa.',
    zh: '管理美元/印尼盾标价、库存凭证及15国语言自动多语种适配。',
    ru: 'Управление ценами в USD/IDR, запасами аккаунтов и авто-перевод на 15 языков.',
    es: 'Administre precios en USD/IDR, inventario de credenciales y traducción automática a 15 idiomas.',
    it: 'Gestisci prezzi USD/IDR, scorte di credenziali e traduzione automatica in 15 lingue.',
    de: 'Verwalten Sie USD/IDR-Preise, Kontobestände und automatische Übersetzung in 15 Sprachen.',
    fr: 'Gérez les prix USD/IDR, les stocks d\'identifiants et la traduction automatique en 15 langues.',
    pt: 'Gerencie preços em USD/IDR, inventário de credenciais e tradução automática para 15 idiomas.',
    hi: 'USD/IDR कीमतें, क्रेडेंशियल स्टॉक और 15 भाषाओं में ऑटो-अनुवाद प्रबंधित करें।',
    uz: 'USD/IDR narxlarini, hisob zaxirasini va 15 tilda avto-tarjimani boshqaring.',
    ar: 'إدارة الأسعار بالدولار والروبية ومخزون الحسابات والترجمة التلقائية إلى 15 لغة.',
    ja: 'USD/IDR価格、認証情報在庫、15言語自動翻訳を管理します。',
    tr: 'USD/IDR fiyatlarını, kimlik stoğunu ve 15 dilde otomatik çeviriyi yönetin.'
  },
  btn_add_product: {
    id: 'Tambah Produk Baru',
    en: 'Add New Product',
    ms: 'Tambah Produk Baru',
    zh: '添加新商品',
    ru: 'Добавить новый товар',
    es: 'Añadir Nuevo Producto',
    it: 'Aggiungi Nuovo Prodotto',
    de: 'Neues Produkt hinzufügen',
    fr: 'Ajouter Nouveau Produit',
    pt: 'Adicionar Novo Produto',
    hi: 'नया उत्पाद जोड़ें',
    uz: 'Yangi mahsulot qo\'shish',
    ar: 'إضافة منتج جديد',
    ja: '新規製品を追加',
    tr: 'Yeni Ürün Ekle'
  },
  btn_close_form: {
    id: 'Tutup Form',
    en: 'Close Form',
    ms: 'Tutup Borang',
    zh: '关闭表单',
    ru: 'Закрыть форму',
    es: 'Cerrar Formulario',
    it: 'Chiudi Modulo',
    de: 'Formular schließen',
    fr: 'Fermer le formulaire',
    pt: 'Fechar Formulário',
    hi: 'फॉर्म बंद करें',
    uz: 'Formani yopish',
    ar: 'إغلاق النموذج',
    ja: 'フォームを閉じる',
    tr: 'Formu Kapat'
  },
  btn_save_product: {
    id: 'Simpan Produk',
    en: 'Save Product',
    ms: 'Simpan Produk',
    zh: '保存商品',
    ru: 'Сохранить товар',
    es: 'Guardar Producto',
    it: 'Salva Prodotto',
    de: 'Produkt speichern',
    fr: 'Enregistrer le Produit',
    pt: 'Salvar Produto',
    hi: 'उत्पाद सहेजें',
    uz: 'Mahsulotni saqlash',
    ar: 'حفظ المنتج',
    ja: '製品を保存',
    tr: 'Ürünü Kaydet'
  },
  btn_auto_translate: {
    id: '✨ Auto-Translate (15 Bahasa)',
    en: '✨ Auto-Translate (15 Languages)',
    ms: '✨ Terjemah Automatik (15 Bahasa)',
    zh: '✨ 自动翻译（15国语言）',
    ru: '✨ Авто-перевод (15 языков)',
    es: '✨ Auto-Traducir (15 Idiomas)',
    it: '✨ Traduzione Automatica (15 Lingue)',
    de: '✨ Auto-Übersetzen (15 Sprachen)',
    fr: '✨ Traduction Auto (15 Langues)',
    pt: '✨ Auto-Traduzir (15 Idiomas)',
    hi: '✨ ऑटो-अनुवाद (15 भाषाएं)',
    uz: '✨ Avto-tarjima (15 til)',
    ar: '✨ ترجمة تلقائية (15 لغة)',
    ja: '✨ 自動翻訳 (15言語)',
    tr: '✨ Otomatik Çeviri (15 Dil)'
  },
  btn_add_stock: {
    id: 'Tambah Stok Akun',
    en: 'Add Account Stock',
    ms: 'Tambah Stok Akaun',
    zh: '补充账号库存',
    ru: 'Пополнить склад',
    es: 'Agregar Stock de Cuentas',
    it: 'Aggiungi Stock Account',
    de: 'Bestand auffüllen',
    fr: 'Ajouter Stock Comptes',
    pt: 'Adicionar Estoque de Contas',
    hi: 'खाता स्टॉक जोड़ें',
    uz: 'Hisob zaxirasini to\'ldirish',
    ar: 'إضافة مخزون الحسابات',
    ja: 'アカウント在庫を追加',
    tr: 'Hesap Stoğu Ekle'
  },
  btn_bulk_add: {
    id: 'Simpan Stok Massal',
    en: 'Save Bulk Stock',
    ms: 'Simpan Stok Pukal',
    zh: '批量保存库存',
    ru: 'Сохранить пачку аккаунтов',
    es: 'Guardar Stock Masivo',
    it: 'Salva Stock Multiplo',
    de: 'Massenbestand speichern',
    fr: 'Enregistrer Stock de Masse',
    pt: 'Salvar Estoque em Lote',
    hi: 'थोक स्टॉक सहेजें',
    uz: 'Ommaviy zaxirani saqlash',
    ar: 'حفظ المخزون بالجملة',
    ja: '一括在庫を保存',
    tr: 'Toplu Stoğu Kaydet'
  },
  label_product_title: {
    id: 'Judul Produk',
    en: 'Product Title',
    ms: 'Tajuk Produk',
    zh: '商品标题',
    ru: 'Название товара',
    es: 'Título del Producto',
    it: 'Titolo Prodotto',
    de: 'Produkttitel',
    fr: 'Titre du Produit',
    pt: 'Título do Produto',
    hi: 'उत्पाद शीर्षक',
    uz: 'Mahsulot nomi',
    ar: 'عنوان المنتج',
    ja: '製品名',
    tr: 'Ürün Başlığı'
  },
  label_product_category: {
    id: 'Kategori Produk',
    en: 'Product Category',
    ms: 'Kategori Produk',
    zh: '商品分类',
    ru: 'Категория товара',
    es: 'Categoría de Producto',
    it: 'Categoria Prodotto',
    de: 'Produktkategorie',
    fr: 'Catégorie de Produit',
    pt: 'Categoria do Produto',
    hi: 'उत्पाद श्रेणी',
    uz: 'Mahsulot toifasi',
    ar: 'فئة المنتج',
    ja: '製品カテゴリ',
    tr: 'Ürün Kategorisi'
  },
  label_price_usd: {
    id: 'Harga USD ($)',
    en: 'Price USD ($)',
    ms: 'Harga USD ($)',
    zh: '美元价格 ($)',
    ru: 'Цена в USD ($)',
    es: 'Precio USD ($)',
    it: 'Prezzo USD ($)',
    de: 'Preis USD ($)',
    fr: 'Prix USD ($)',
    pt: 'Preço USD ($)',
    hi: 'कीमत USD ($)',
    uz: 'Narxi USD ($)',
    ar: 'السعر بالدولار ($)',
    ja: '価格 USD ($)',
    tr: 'Fiyat USD ($)'
  },
  label_price_idr: {
    id: 'Harga IDR (Rp)',
    en: 'Price IDR (Rp)',
    ms: 'Harga IDR (Rp)',
    zh: '印尼盾价格 (Rp)',
    ru: 'Цена в IDR (Rp)',
    es: 'Precio IDR (Rp)',
    it: 'Prezzo IDR (Rp)',
    de: 'Preis IDR (Rp)',
    fr: 'Prix IDR (Rp)',
    pt: 'Preço IDR (Rp)',
    hi: 'कीमत IDR (Rp)',
    uz: 'Narxi IDR (Rp)',
    ar: 'السعر بالروبية (Rp)',
    ja: '価格 IDR (Rp)',
    tr: 'Fiyat IDR (Rp)'
  },
  label_product_desc: {
    id: 'Deskripsi Produk',
    en: 'Product Description',
    ms: 'Penerangan Produk',
    zh: '商品说明',
    ru: 'Описание товара',
    es: 'Descripción del Producto',
    it: 'Descrizione Prodotto',
    de: 'Produktbeschreibung',
    fr: 'Description du Produit',
    pt: 'Descrição do Produto',
    hi: 'उत्पाद विवरण',
    uz: 'Mahsulot tavsifi',
    ar: 'وصف المنتج',
    ja: '製品説明',
    tr: 'Ürün Açıklaması'
  },
  label_available_stock: {
    id: 'Stok Tersedia',
    en: 'Available Stock',
    ms: 'Stok Tersedia',
    zh: '当前库存',
    ru: 'В наличии',
    es: 'Stock Disponible',
    it: 'Disponibilità',
    de: 'Verfügbarer Bestand',
    fr: 'Stock Disponible',
    pt: 'Estoque Disponível',
    hi: 'उपलब्ध स्टॉक',
    uz: 'Mavjud zaxira',
    ar: 'المخزون المتوفر',
    ja: '利用可能な在庫',
    tr: 'Mevcut Stok'
  },
  label_out_of_stock: {
    id: '⚠️ HABIS',
    en: '⚠️ OUT OF STOCK',
    ms: '⚠️ HABIS',
    zh: '⚠️ 缺货',
    ru: '⚠️ НЕТ В НАЛИЧИИ',
    es: '⚠️ AGOTADO',
    it: '⚠️ ESAURITO',
    de: '⚠️ AUSVERKAUFT',
    fr: '⚠️ ÉPUISÉ',
    pt: '⚠️ ESGOTADO',
    hi: '⚠️ स्टॉक समाप्त',
    uz: '⚠️ QOLMADI',
    ar: '⚠️ نفد المخزون',
    ja: '⚠️ 在庫切れ',
    tr: '⚠️ TÜKENDİ'
  },

  // Common Buttons & Utilities
  btn_copy: {
    id: 'Salin',
    en: 'Copy',
    ms: 'Salin',
    zh: '复制',
    ru: 'Копировать',
    es: 'Copiar',
    it: 'Copia',
    de: 'Kopieren',
    fr: 'Copier',
    pt: 'Copiar',
    hi: 'कॉपी करें',
    uz: 'Nusxalash',
    ar: 'نسخ',
    ja: 'コピー',
    tr: 'Kopyala'
  },
  btn_copied: {
    id: 'Tersalin!',
    en: 'Copied!',
    ms: 'Disalin!',
    zh: '已复制！',
    ru: 'Скопировано!',
    es: '¡Copiado!',
    it: 'Copiato!',
    de: 'Kopiert!',
    fr: 'Copié !',
    pt: 'Copiado!',
    hi: 'कॉपी हो गया!',
    uz: 'Nusxalandi!',
    ar: 'تم النسخ!',
    ja: 'コピー完了！',
    tr: 'Kopyalandı!'
  },
  btn_close: {
    id: 'Tutup',
    en: 'Close',
    ms: 'Tutup',
    zh: '关闭',
    ru: 'Закрыть',
    es: 'Cerrar',
    it: 'Chiudi',
    de: 'Schließen',
    fr: 'Fermer',
    pt: 'Fechar',
    hi: 'बंद करें',
    uz: 'Yopish',
    ar: 'إغلاق',
    ja: '閉じる',
    tr: 'Kapat'
  },
  btn_refresh: {
    id: 'Muat Ulang',
    en: 'Refresh',
    ms: 'Muat Semula',
    zh: '刷新数据',
    ru: 'Обновить',
    es: 'Actualizar',
    it: 'Aggiorna',
    de: 'Aktualisieren',
    fr: 'Actualiser',
    pt: 'Atualizar',
    hi: 'रिफ्रेश करें',
    uz: 'Yangilash',
    ar: 'تحديث',
    ja: '更新',
    tr: 'Yenile'
  },
  btn_processing: {
    id: 'Memproses...',
    en: 'Processing...',
    ms: 'Memproses...',
    zh: '正在处理...',
    ru: 'Обработка...',
    es: 'Procesando...',
    it: 'Elaborazione...',
    de: 'Verarbeitung...',
    fr: 'Traitement en cours...',
    pt: 'Processando...',
    hi: 'प्रक्रिया जारी है...',
    uz: 'Bajarilmoqda...',
    ar: 'جار المعالجة...',
    ja: '処理中...',
    tr: 'İşleniyor...'
  }
};

/**
 * Universal Translation Helper: Retrieves translation for a given key and language code.
 * Falls back cleanly if key or language is not specified.
 */
export function t(key: string, lang = 'id'): string {
  const item = UI_STRINGS[key];
  if (!item) return key;
  return item[lang] || item['en'] || item['id'] || key;
}

export function getClientUI(key: string, lang = 'id'): string {
  return t(key, lang);
}

// --- Runtime Auto-Translate for web admin ---
// Caches AI-translated strings per language so a missing dictionary entry is
// still shown in the user's language instead of a raw key.
const autoCache: Record<string, string> = {};

export function tt(key: string, lang = 'id'): string {
  const existing = UI_STRINGS[key];
  if (existing) return existing[lang] || existing['en'] || existing['id'] || key;

  const cacheKey = `${lang}::${key}`;
  if (autoCache[cacheKey]) return autoCache[cacheKey];

  // Kick off a background translation; return the base text meanwhile.
  if (lang !== 'id') {
    fetch('/api/translate/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: key, type: 'ui' })
    })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.success && d.translations && d.translations[lang]) {
          autoCache[cacheKey] = d.translations[lang];
        }
      })
      .catch(() => {});
  }
  return key;
}

/**
 * Dictionary for common digital products translation across all 15 languages
 */
export const COMMON_PRODUCT_TRANSLATIONS: Record<string, Record<string, string>> = {
  'ChatGPT Plus 1 Month (Private)': {
    id: 'Akun ChatGPT Plus 1 Bulan (Private)',
    en: 'ChatGPT Plus 1 Month (Private Account)',
    ms: 'Akaun ChatGPT Plus 1 Bulan (Private)',
    zh: 'ChatGPT Plus 1个月独享账号',
    ru: 'Аккаунт ChatGPT Plus на 1 месяц (Личный)',
    es: 'Cuenta ChatGPT Plus 1 Mes (Privada)',
    it: 'Account ChatGPT Plus 1 Mese (Privato)',
    de: 'ChatGPT Plus 1 Monat (Privates Konto)',
    fr: 'Compte ChatGPT Plus 1 Mois (Privé)',
    pt: 'Conta ChatGPT Plus 1 Mês (Privada)',
    hi: 'चैटजीपीटी प्लस 1 महीने का खाता (प्राइवेट)',
    uz: 'ChatGPT Plus 1 oylik hisob (Xususiy)',
    ar: 'حساب شات جي بي تي بلس لمدة شهر (خاص)',
    ja: 'ChatGPT Plus 1ヶ月 (専用アカウント)',
    tr: 'ChatGPT Plus 1 Aylık (Özel Hesap)'
  },
  'ChatGPT Plus 1 Month (Shared Max 2 User)': {
    id: 'Akun ChatGPT Plus 1 Bulan (Shared Max 2 User)',
    en: 'ChatGPT Plus 1 Month (Shared Max 2 Users)',
    ms: 'Akaun ChatGPT Plus 1 Bulan (Shared Max 2 Pengguna)',
    zh: 'ChatGPT Plus 1个月共享账号（最多2人）',
    ru: 'Аккаунт ChatGPT Plus на 1 месяц (Общий, до 2 пользователей)',
    es: 'Cuenta ChatGPT Plus 1 Mes (Compartida Máx. 2 Usuarios)',
    it: 'Account ChatGPT Plus 1 Mese (Condiviso Max 2 Utenti)',
    de: 'ChatGPT Plus 1 Monat (Geteilt, max. 2 Benutzer)',
    fr: 'Compte ChatGPT Plus 1 Mois (Partagé Max 2 Utilisateurs)',
    pt: 'Conta ChatGPT Plus 1 Mês (Compartilhada Máx. 2 Usuários)',
    hi: 'चैटजीपीटी प्लस 1 महीने का खाता (साझा अधिकतम 2 उपयोगकर्ता)',
    uz: 'ChatGPT Plus 1 oylik hisob (Birgalikda foydalanish 2 kishi)',
    ar: 'حساب شات جي بي تي بلس لمدة شهر (مشترك لمستخدمين اثنين كحد أقصى)',
    ja: 'ChatGPT Plus 1ヶ月 (最大2名共有アカウント)',
    tr: 'ChatGPT Plus 1 Aylık (Maksimum 2 Kişilik Ortak Hesap)'
  },
  'Claude Pro 1 Month': {
    id: 'Akun Claude Pro 1 Bulan',
    en: 'Claude Pro 1 Month Account',
    ms: 'Akaun Claude Pro 1 Bulan',
    zh: 'Claude Pro 1个月账号',
    ru: 'Аккаунт Claude Pro на 1 месяц',
    es: 'Cuenta Claude Pro 1 Mes',
    it: 'Account Claude Pro 1 Mese',
    de: 'Claude Pro 1 Monat Konto',
    fr: 'Compte Claude Pro 1 Mois',
    pt: 'Conta Claude Pro 1 Mês',
    hi: 'क्लॉड प्रो 1 महीने का खाता',
    uz: 'Claude Pro 1 oylik hisob',
    ar: 'حساب كلود برو لمدة شهر',
    ja: 'Claude Pro 1ヶ月アカウント',
    tr: 'Claude Pro 1 Aylık Hesap'
  }
};

export const COMMON_DESC_TRANSLATIONS: Record<string, string> = {
  id: 'Akun digital siap pakai dengan garansi replace penuh 30 hari. Dilengkapi Email, Password, dan Cookie sesi resmi.',
  en: 'Ready-to-use digital account with a full 30-day replacement warranty. Includes Email, Password, and official Session Cookie.',
  ms: 'Akaun digital sedia guna dengan jaminan penggantian penuh 30 hari. Termasuk Emel, Kata Laluan, dan Kuki sesi rasmi.',
  zh: '即开即用数字化账号，享30天全额质保换新。包含官方邮箱、密码及有效Session Cookie。',
  ru: 'Готовый цифровой аккаунт с гарантией замены на 30 дней. Включает почту, пароль и рабочий Session Cookie.',
  es: 'Cuenta digital lista para usar con garantía de reemplazo de 30 días. Incluye correo, contraseña y Cookie de sesión.',
  it: 'Account digitale pronto all\'uso con garanzia di sostituzione completa di 30 giorni. Include Email, Password e Cookie.',
  de: 'Sofort einsatzbereites digitales Konto mit 30 Tagen Ersatzgarantie. Enthält E-Mail, Passwort und Session-Cookie.',
  fr: 'Compte numérique prêt à l\'emploi avec garantie de remplacement de 30 jours. Comprend Email, Mot de passe et Cookie.',
  pt: 'Conta digital pronta para uso com garantia total de 30 dias. Inclui e-mail, senha e cookie de sessão oficial.',
  hi: 'उपयोग के लिए तैयार डिजिटल खाता, 30 दिनों की पूर्ण प्रतिस्थापन वारंटी के साथ। इसमें ईमेल, पासवर्ड और सत्र कुकी शामिल हैं।',
  uz: '30 kunlik to\'liq kafolatli raqamli hisob. Elektron pochta, parol va sessiya cookie ma\'lumotlarini o\'z ichiga oladi.',
  ar: 'حساب رقمي جاهز للاستخدام مع ضمان استبدال كامل لمدة 30 يومًا. يتضمن البريد وكلمة المرور وكوكيز الجلسة.',
  ja: '30日間の完全交換保証付きの即時利用可能なデジタルアカウント。メール、パスワード、セッションCookieが含まれます。',
  tr: '30 günlük birebir değişim garantili, hemen kullanıma hazır dijital hesap. E-posta, şifre ve oturum çerezi içerir.'
};

/**
 * Localizes a product dynamically for the active language.
 * Checks manual translations first, then common dictionaries, then smart heuristic replacement.
 */
export function getLocalizedProduct(product: any, lang = 'id'): any {
  if (!product) return product;

  // 1. Check explicit custom translation stored in the product object
  if (product.translations && product.translations[lang]) {
    return {
      ...product,
      title: product.translations[lang].title || product.title,
      description: product.translations[lang].description || product.description
    };
  }

  // 2. Fallback to dictionary
  let title = product.title || '';
  let description = product.description || '';

  if (lang !== 'id') {
    // Check dictionary
    if (COMMON_PRODUCT_TRANSLATIONS[title] && COMMON_PRODUCT_TRANSLATIONS[title][lang]) {
      title = COMMON_PRODUCT_TRANSLATIONS[title][lang];
    } else {
      // Intelligent keyword replacement
      title = title
        .replace(/Akun /gi, lang === 'en' ? 'Account ' : lang === 'es' ? 'Cuenta ' : lang === 'fr' ? 'Compte ' : lang === 'de' ? 'Konto ' : lang === 'pt' ? 'Conta ' : lang === 'ja' ? 'アカウント ' : lang === 'tr' ? 'Hesap ' : 'Account ')
        .replace(/1 Bulan/gi, lang === 'en' ? '1 Month' : lang === 'es' ? '1 Mes' : lang === 'fr' ? '1 Mois' : lang === 'de' ? '1 Monat' : lang === 'pt' ? '1 Mês' : lang === 'ja' ? '1ヶ月' : lang === 'tr' ? '1 Aylık' : '1 Month');
    }

    if (!description || description.includes('Akun') || description.includes('garansi') || description.includes('Siap Pakai')) {
      if (COMMON_DESC_TRANSLATIONS[lang]) {
        description = COMMON_DESC_TRANSLATIONS[lang];
      }
    }
  }

  return {
    ...product,
    title,
    description
  };
}

/**
 * Auto-generates translation dictionary for a product across all 15 languages
 */
export function generateProductTranslations(baseTitle: string, baseDesc: string): Record<string, { title: string; description: string }> {
  const result: Record<string, { title: string; description: string }> = {};

  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang.code === 'id') {
      result['id'] = { title: baseTitle, description: baseDesc };
      continue;
    }

    // Check common translations
    let tTitle = baseTitle;
    if (COMMON_PRODUCT_TRANSLATIONS[baseTitle] && COMMON_PRODUCT_TRANSLATIONS[baseTitle][lang.code]) {
      tTitle = COMMON_PRODUCT_TRANSLATIONS[baseTitle][lang.code];
    } else {
      tTitle = baseTitle
        .replace(/Akun /gi, lang.code === 'en' ? 'Account ' : lang.code === 'es' ? 'Cuenta ' : lang.code === 'fr' ? 'Compte ' : lang.code === 'de' ? 'Konto ' : lang.code === 'pt' ? 'Conta ' : lang.code === 'ja' ? 'アカウント ' : lang.code === 'tr' ? 'Hesap ' : 'Account ')
        .replace(/1 Bulan/gi, lang.code === 'en' ? '1 Month' : lang.code === 'es' ? '1 Mes' : lang.code === 'fr' ? '1 Mois' : lang.code === 'de' ? '1 Monat' : lang.code === 'pt' ? '1 Mês' : lang.code === 'ja' ? '1ヶ月' : lang.code === 'tr' ? '1 Aylık' : '1 Month');
    }

    const tDesc = COMMON_DESC_TRANSLATIONS[lang.code] || baseDesc;
    result[lang.code] = { title: tTitle, description: tDesc };
  }

  return result;
}

export interface ParsedCredential {
  raw: string;
  email?: string;
  password?: string;
  cookie?: string;
  apiKey?: string;
  note?: string;
}

export function parseAccountCredentialClient(accountData: string = ''): ParsedCredential {
  if (!accountData) return { raw: '' };
  const parts = accountData.split(':');
  if (parts.length >= 3) {
    return {
      raw: accountData,
      email: parts[0]?.trim(),
      password: parts[1]?.trim(),
      cookie: parts[2]?.trim(),
      apiKey: parts[3]?.trim() || undefined,
      note: parts.slice(4).join(':').trim() || undefined
    };
  }
  return { raw: accountData };
}

export function getTokenExplorerUrl(network = '', address = ''): string {
  const net = (network || '').toLowerCase();
  const cleanAddr = (address || '').trim();
  if (!cleanAddr) return '';

  if (net.includes('trc') || net.includes('tron') || cleanAddr.startsWith('T')) {
    return `https://tronscan.org/#/address/${cleanAddr}`;
  }
  if (net.includes('bep') || net.includes('bsc') || net.includes('binance')) {
    return `https://bscscan.com/address/${cleanAddr}`;
  }
  if (net.includes('erc') || net.includes('eth') || net.includes('ethereum')) {
    return `https://etherscan.io/address/${cleanAddr}`;
  }
  if (net.includes('sol') || net.includes('solana')) {
    return `https://solscan.io/account/${cleanAddr}`;
  }
  if (net.includes('btc') || net.includes('bitcoin')) {
    return `https://mempool.space/address/${cleanAddr}`;
  }
  if (net.includes('ton')) {
    return `https://tonscan.org/address/${cleanAddr}`;
  }
  return `https://blockchair.com/search?q=${encodeURIComponent(cleanAddr)}`;
}

export function getQrCodeUrl(address = '', size = 250): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(address)}`;
}
