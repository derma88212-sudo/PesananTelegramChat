/**
 * Multi-Language Dictionary & Localization Matrix
 * Supported Languages:
 * - id: Bahasa Indonesia
 * - ms: Bahasa Melayu
 * - zh: 中文 (Chinese Simplified)
 * - ru: Русский (Russian)
 * - it: Italiano (Italian)
 * - es: Español (Spanish)
 * - hi: हिन्दी (Hindi)
 * - uz: O'zbek tili (Uzbek)
 * - ar: العربية (Arabic)
 * - en: English
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾', dir: 'ltr' },
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', dir: 'ltr' }
];

export const UI_TRANSLATIONS = {
  // Menu Buttons
  menu_catalog: {
    id: '🛍️ Katalog Produk',
    ms: '🛍️ Katalog Produk',
    zh: '🛍️ 产品目录',
    ru: '🛍️ Каталог товаров',
    it: '🛍️ Catalogo Prodotti',
    es: '🛍️ Catálogo de Productos',
    hi: '🛍️ उत्पाद सूची',
    uz: '🛍️ Mahsulotlar katalogi',
    ar: '🛍️ كتالوج المنتجات',
    en: '🛍️ Product Catalog'
  },
  menu_orders: {
    id: '📦 Pesanan Saya',
    ms: '📦 Pesanan Saya',
    zh: '📦 我的订单',
    ru: '📦 Мои заказы',
    it: '📦 I Miei Ordini',
    es: '📦 Mis Pedidos',
    hi: '📦 मेरे ऑर्डर',
    uz: '📦 Mening buyurtmalarim',
    ar: '📦 طلباتي',
    en: '📦 My Orders'
  },
  menu_payments: {
    id: '💳 Cara Bayar & Kripto',
    ms: '💳 Cara Bayaran & Kripto',
    zh: '💳 付款方式与加密货币',
    ru: '💳 Способы оплаты (Крипто)',
    it: '💳 Metodi di Pagamento Crypto',
    es: '💳 Métodos de Pago Cripto',
    hi: '💳 भुगतान के तरीके (क्रिप्टो)',
    uz: "💳 To'lov usullari (Kripto)",
    ar: '💳 طرق الدفع والعملات المشفرة',
    en: '💳 Payment Methods & Crypto'
  },
  menu_help: {
    id: 'ℹ️ Syarat & Garansi',
    ms: 'ℹ️ Terma & Jaminan',
    zh: 'ℹ️ 条款与质保',
    ru: 'ℹ️ Условия и гарантия',
    it: 'ℹ️ Termini e Garanzia',
    es: 'ℹ️ Términos y Garantía',
    hi: 'ℹ️ नियम एवं वारंटी',
    uz: 'ℹ️ Shartlar va kafolat',
    ar: 'ℹ️ الشروط والضمان',
    en: 'ℹ️ Terms & Warranty'
  },
  menu_language: {
    id: '🌐 Ganti Bahasa',
    ms: '🌐 Tukar Bahasa',
    zh: '🌐 切换语言',
    ru: '🌐 Сменить язык',
    it: '🌐 Cambia Lingua',
    es: '🌐 Cambiar Idioma',
    hi: '🌐 भाषा बदलें',
    uz: '🌐 Tilni almashtirish',
    ar: '🌐 تغيير اللغة',
    en: '🌐 Change Language'
  },
  btn_back: {
    id: '🔙 Kembali ke Menu Utama',
    ms: '🔙 Kembali ke Menu Utama',
    zh: '🔙 返回主菜单',
    ru: '🔙 Главное меню',
    it: '🔙 Torna al Menu',
    es: '🔙 Volver al Menú Principal',
    hi: '🔙 मुख्य मेनू पर वापस जाएं',
    uz: '🔙 Asosiy menyuga qaytish',
    ar: '🔙 العودة إلى القائمة الرئيسية',
    en: '🔙 Back to Main Menu'
  },
  btn_back_catalog: {
    id: '🔙 Kembali ke Katalog',
    ms: '🔙 Kembali ke Katalog',
    zh: '🔙 返回产品目录',
    ru: '🔙 Назад в каталог',
    it: '🔙 Torna al Catalogo',
    es: '🔙 Volver al Catálogo',
    hi: '🔙 कैटलॉग पर वापस जाएं',
    uz: '🔙 Katalogga qaytish',
    ar: '🔙 العودة إلى الكتالوج',
    en: '🔙 Back to Catalog'
  },
  btn_buy_auto: {
    id: '⚡ Bayar Otomatis Kripto',
    ms: '⚡ Bayar Automatik Kripto',
    zh: '⚡ 自动加密支付',
    ru: '⚡ Авто-крипто оплата',
    it: '⚡ Pagamento Auto Cripto',
    es: '⚡ Pago Automático Cripto',
    hi: '⚡ ऑटोमैटिक क्रिप्टो भुगतान',
    uz: '⚡ Avto Kripto to‘lov',
    ar: '⚡ دفع تلقائي بالعملات المشفرة',
    en: '⚡ Auto Crypto Payment'
  },
  btn_buy_manual: {
    id: '💳 Bayar Manual',
    ms: '💳 Bayar Manual',
    zh: '💳 手动支付',
    ru: '💳 Ручная оплата',
    it: '💳 Pagamento Manuale',
    es: '💳 Pago Manual',
    hi: '💳 मैन्युअल भुगतान',
    uz: '💳 Qo‘lda to‘lov',
    ar: '💳 دفع يدوي',
    en: '💳 Manual Payment'
  },
  btn_check_payment: {
    id: '🔄 Cek / Konfirmasi Pembayaran',
    ms: '🔄 Semak / Sahkan Pembayaran',
    zh: '🔄 检查/确认付款',
    ru: '🔄 Проверить оплату',
    it: '🔄 Verifica Pagamento',
    es: '🔄 Verificar Pago',
    hi: '🔄 भुगतान की पुष्टि करें',
    uz: "🔄 To'lovni tekshirish",
    ar: '🔄 التحقق من الدفع',
    en: '🔄 Check / Confirm Payment'
  },
  btn_cancel_order: {
    id: '❌ Batalkan Pesanan',
    ms: '❌ Batal Pesanan',
    zh: '❌ 取消订单',
    ru: '❌ Отменить заказ',
    it: '❌ Annulla Ordine',
    es: '❌ Cancelar Pedido',
    hi: '❌ ऑर्डर रद्द करें',
    uz: '❌ Buyurtmani bekor qilish',
    ar: '❌ إلغاء الطلب',
    en: '❌ Cancel Order'
  },
  catalog_select_prompt: {
    id: 'Pilih produk di bawah untuk melihat rincian harga, ketersediaan stok, dan metode pembayaran:',
    ms: 'Pilih produk di bawah untuk melihat butiran harga, ketersediaan stok, dan kaedah pembayaran:',
    zh: '请在下方选择产品以查看价格详情、库存情况及付款方式：',
    ru: 'Выберите товар ниже, чтобы просмотреть сведения о цене, наличии на складе и способах оплаты:',
    it: 'Seleziona un prodotto qui sotto per visualizzare dettagli su prezzo, disponibilità e metodi di pagamento:',
    es: 'Seleccione un producto a continuación para ver detalles de precio, disponibilidad de stock y métodos de pago:',
    hi: 'कीमत का विवरण, स्टॉक की उपलब्धता और भुगतान के तरीके देखने के लिए नीचे दिए गए उत्पाद का चयन करें:',
    uz: "Narx tafsilotlari, mavjud zaxira va to'lov usullarini ko'rish uchun quyidagi mahsulotni tanlang:",
    ar: 'اختر منتجًا أدناه لعرض تفاصيل السعر وتوفر المخزون وطرق الدفع:',
    en: 'Select a product below to view price details, stock availability, and payment methods:'
  },
  stock_badge: {
    id: 'Stok',
    ms: 'Stok',
    zh: '库存',
    ru: 'В наличии',
    it: 'Disponibilità',
    es: 'Stock',
    hi: 'स्टॉक',
    uz: 'Mavjud',
    ar: 'المخزون',
    en: 'Stock'
  },
  out_of_stock: {
    id: '⚠️ HABIS',
    ms: '⚠️ HABIS',
    zh: '⚠️ 缺货',
    ru: '⚠️ НЕТ В НАЛИЧИИ',
    it: '⚠️ ESAURITO',
    es: '⚠️ AGOTADO',
    hi: '⚠️ स्टॉक समाप्त',
    uz: '⚠️ QOLMADI',
    ar: '⚠️ نفد المخزون',
    en: '⚠️ OUT OF STOCK'
  },
  out_of_stock_alert: {
    id: '❌ Maaf, stok akun untuk produk ini sedang habis. Silakan pilih produk lain atau tunggu admin mengisi stok baru.',
    ms: '❌ Maaf, stok akaun untuk produk ini telah habis. Sila pilih produk lain atau tunggu penambahan stok baru.',
    zh: '❌ 抱歉，该产品账号目前已售罄。请选择其他商品或等待管理员补货。',
    ru: '❌ Извините, товар закончился. Пожалуйста, выберите другой продукт или дождитесь пополнения запасов.',
    it: '❌ Spiacenti, le scorte per questo prodotto sono esaurite. Scegli un altro articolo o attendi il rifornimento.',
    es: '❌ Lo sentimos, este producto está agotado. Por favor elija otro producto o espere a que se reponga stock.',
    hi: '❌ क्षमा करें, इस उत्पाद का स्टॉक समाप्त हो गया है। कृपया कोई अन्य उत्पाद चुनें या स्टॉक आने की प्रतीक्षा करें।',
    uz: "❌ Kechirasiz, ushbu mahsulot zaxirasi tugadi. Iltimos, boshqa mahsulotni tanlang yoki admin to'ldirishini kuting.",
    ar: '❌ عذرًا، نفد مخزون هذا المنتج حاليًا. يرجى اختيار منتج آخر أو انتظار تحديث المخزون.',
    en: '❌ Sorry, this product is currently out of stock. Please select another item or wait for restock.'
  },
  payment_pending_notice: {
    id: '⏳ Pembayaran belum terdeteksi atau belum lunas di blockchain. Mohon selesaikan transfer Anda sesuai nominal yang tertera. Akun HANYA akan dikirim setelah pembayaran sah terverifikasi.',
    ms: '⏳ Pembayaran belum dikesan atau belum selesai di blockchain. Sila selesaikan pemindahan anda. Akaun HANYA akan dihantar selepas bayaran sah disahkan.',
    zh: '⏳ 区块链上尚未检测到付款或款项未到账。请按指定金额完成转账。账号仅在付款核实成功后才会发送。',
    ru: '⏳ Оплата еще не обнаружена или не подтверждена в блокчейне. Пожалуйста, завершите перевод. Данные аккаунта будут отправлены ТОЛЬКО после подтверждения оплаты.',
    it: '⏳ Pagamento non ancora rilevato o confermato sulla blockchain. Completa il trasferimento. Le credenziali verranno inviate SOLO dopo la verifica.',
    es: '⏳ El pago aún no ha sido detectado o confirmado en la blockchain. Complete la transferencia. La cuenta SOLO se enviará tras la verificación.',
    hi: '⏳ ब्लॉकचेन पर भुगतान अभी तक डिटेक्ट या कन्फर्म नहीं हुआ है। कृपया ट्रांसफर पूरा करें। खाता केवल भुगतान सत्यापन के बाद ही भेजा जाएगा।',
    uz: "⏳ To'lov blokcheynda hali aniqlanmadi yoki tasdiqlanmadi. Iltimos, o'tkazmani yakunlang. Hisob MA'LUMOTLARI FAQAT to'lov tasdiqlangandan so'ng yuboriladi.",
    ar: '⏳ لم يتم اكتشاف الدفع أو تأكيده على البلوكشين بعد. يرجى إتمام التحويل بالمبلغ المحدد. لن يتم إرسال الحساب إلا بعد التحقق من الدفع.',
    en: '⏳ Payment is not yet detected or confirmed on the blockchain. Please complete your transfer. Account credentials will ONLY be delivered once payment is strictly verified.'
  },
  payment_success_header: {
    id: '🎉 PEMBAYARAN SAH DITERIMA & AKUN TERKIRIM!',
    ms: '🎉 PEMBAYARAN SAH DITERIMA & AKAUN DIHANTAR!',
    zh: '🎉 付款验证成功，账号已自动发放！',
    ru: '🎉 ОПЛАТА УСПЕШНО ПОДТВЕРЖДЕНА! ДАННЫЕ АККАУНТА:',
    it: '🎉 PAGAMENTO RICEVUTO! ECCO IL TUO ACCOUNT:',
    es: '🎉 ¡PAGO CONFIRMADO! AQUÍ ESTÁ TU CUENTA:',
    hi: '🎉 भुगतान सफल! आपका खाता विवरण:',
    uz: "🎉 TO'LOV TASDIQLANDI VA HISOB YUBORILDI!",
    ar: '🎉 تم تأكيد الدفع بنجاح وإرسال بيانات الحساب!',
    en: '🎉 PAYMENT CONFIRMED & ACCOUNT DELIVERED!'
  },
  credentials_label: {
    id: '🔐 KREDENSIAL AKUN ANDA (Email:Password:Cookie):',
    ms: '🔐 KREDENSIAL AKAUN ANDA (Email:Password:Cookie):',
    zh: '🔐 您的账号凭据 (邮箱:密码:Cookie):',
    ru: '🔐 ДАННЫЕ ВАШЕГО АККАУНТА (Email:Пароль:Cookie):',
    it: '🔐 LE TUE CREDENZIALI (Email:Password:Cookie):',
    es: '🔐 TUS CREDENCIALES (Email:Contraseña:Cookie):',
    hi: '🔐 आपके खाते का विवरण (Email:Password:Cookie):',
    uz: '🔐 HISOBINGIZ MA\'LUMOTLARI (Email:Parol:Cookie):',
    ar: '🔐 بيانات حسابك (البريد:كلمة المرور:الكوكيز):',
    en: '🔐 YOUR ACCOUNT CREDENTIALS (Email:Password:Cookie):'
  },
  warranty_tip: {
    id: '🛡️ Garansi aktif 30 hari. Simpan data ini baik-baik. Jangan gunakan di IP mencurigakan.',
    ms: '🛡️ Jaminan aktif 30 hari. Simpan data ini dengan selamat.',
    zh: '🛡️ 质保期 30 天。请妥善保存此凭证。',
    ru: '🛡️ Гарантия действует 30 дней. Сохраните эти данные в надежном месте.',
    it: '🛡️ Garanzia attiva per 30 giorni. Conserva queste informazioni.',
    es: '🛡️ Garantía activa de 30 días. Guarde estos datos en un lugar seguro.',
    hi: '🛡️ 30 दिनों की वारंटी सक्रिय है। कृपया यह विवरण सुरक्षित रखें।',
    uz: '🛡️ 30 kunlik kafolat faol. Ushbu ma\'lumotlarni xavfsiz saqlang.',
    ar: '🛡️ الضمان سارٍ لمدة 30 يومًا. احتفظ بهذه البيانات بأمان.',
    en: '🛡️ 30-day replacement warranty active. Please store credentials safely.'
  },
  lang_changed_msg: {
    id: '✅ Bahasa berhasil diubah ke Bahasa Indonesia 🇮🇩',
    ms: '✅ Bahasa berjaya ditukar ke Bahasa Melayu 🇲🇾',
    zh: '✅ 语言已成功切换为 中文 🇨🇳',
    ru: '✅ Язык успешно изменен на Русский 🇷🇺',
    it: '✅ Lingua modificata in Italiano 🇮🇹',
    es: '✅ Idioma cambiado a Español 🇪🇸',
    hi: '✅ भाषा सफलतापूर्वक हिन्दी में बदल दी गई है 🇮🇳',
    uz: "✅ Til O'zbekchaga muvaffaqiyatli almashtirildi 🇺🇿",
    ar: '✅ تم تغيير اللغة بنجاح إلى العربية 🇸🇦',
    en: '✅ Language successfully changed to English 🇬🇧',
    de: '✅ Sprache erfolgreich auf Deutsch geändert 🇩🇪',
    fr: '✅ Langue changée en Français avec succès 🇫🇷',
    pt: '✅ Idioma alterado para Português com sucesso 🇧🇷',
    ja: '✅ 言語を日本語に変更しました 🇯🇵',
    tr: '✅ Dil başarıyla Türkçe olarak değiştirildi 🇹🇷'
  },
  choose_language_prompt: {
    id: '🌐 <b>PILIH BAHASA / CHOOSE YOUR LANGUAGE</b>\n\nSilakan pilih bahasa yang ingin Anda gunakan. Seluruh menu, produk, invoice, petunjuk pembayaran, dan kredensial akun akan otomatis diterjemahkan:',
    ms: '🌐 <b>PILIH BAHASA / CHOOSE YOUR LANGUAGE</b>\n\nSila pilih bahasa anda. Semua menu, produk, invois, panduan bayaran dan kredensial akan diterjemahkan secara automatik:',
    en: '🌐 <b>CHOOSE YOUR LANGUAGE</b>\n\nPlease select your preferred language. All menus, products, invoices, payment instructions, and account credentials will be automatically translated:',
    zh: '🌐 <b>请选择您的语言 / CHOOSE LANGUAGE</b>\n\n请选择您的首选语言。所有菜单、商品、账单、支付指引及账号凭据都将自动显示为该语言：',
    ru: '🌐 <b>ВЫБЕРИТЕ ВАШ ЯЗЫК</b>\n\nПожалуйста, выберите язык. Все меню, товары, счета, инструкции по оплате и данные аккаунтов будут автоматически переведены:',
    es: '🌐 <b>ELIJA SU IDIOMA</b>\n\nSeleccione su idioma preferido. Todos los menús, productos, facturas, instrucciones de pago y credenciales se traducirán automáticamente:',
    it: '🌐 <b>SCEGLI LA TUA LINGUA</b>\n\nSeleziona la tua lingua preferita. Tutti i menu, prodotti, fatture, istruzioni di pagamento e credenziali saranno tradotti automaticamente:',
    de: '🌐 <b>WÄHLEN SIE IHRE SPRACHE</b>\n\nBitte wählen Sie Ihre bevorzugte Sprache. Alle Menüs, Produkte, Rechnungen, Zahlungsanweisungen und Zugangsdaten werden automatisch übersetzt:',
    fr: '🌐 <b>CHOISISSEZ VOTRE LANGUE</b>\n\nVeuillez choisir votre langue. Tous les menus, produits, factures, instructions de paiement et identifiants seront automatiquement traduits :',
    pt: '🌐 <b>ESCOLHA SEU IDIOMA</b>\n\nSelecione seu idioma preferido. Todos os menus, produtos, faturas, instruções de pagamento e credenciais serão traduzidos automaticamente:',
    hi: '🌐 <b>अपनी भाषा चुनें</b>\n\nकृपया अपनी पसंदीदा भाषा चुनें। सभी मेनू, उत्पाद, चालान, भुगतान निर्देश और खाता क्रेडेंशियल स्वचालित रूप से अनुवादित होंगे:',
    uz: '🌐 <b>TILNI TANLANG</b>\n\nIltimos, o\'zingizga qulay tilni tanlang. Barcha menyular, mahsulotlar, hisob-fakturalar, to\'lov yo\'riqnomalari va hisob ma\'lumotlari avtomatik tarjima qilinadi:',
    ar: '🌐 <b>اختر لغتك المفضلة</b>\n\nيرجى اختيار لغتك المفضلة. سيتم ترجمة جميع القوائم والمنتجات والفواتير وتعليمات الدفع وبيانات الحساب تلقائيًا:',
    ja: '🌐 <b>言語を選択してください</b>\n\nご希望の言語を選択してください。すべてのメニュー、商品、請求書、支払い手順、アカウント情報が自動翻訳されます：',
    tr: '🌐 <b>DİLİNİZİ SEÇİN</b>\n\nLütfen tercih ettiğiniz dili seçin. Tüm menüler, ürünler, faturalar, ödeme talimatları ve hesap bilgileri otomatik olarak çevrilecektir:'
  },
  empty_catalog: {
    id: '⚠️ <i>Saat ini belum ada produk yang tersedia di katalog.</i>',
    ms: '⚠️ <i>Tiada produk tersedia dalam katalog pada masa ini.</i>',
    en: '⚠️ <i>There are currently no products available in the catalog.</i>',
    zh: '⚠️ <i>目前产品目录中暂无可用商品。</i>',
    ru: '⚠️ <i>В настоящее время в каталоге нет доступных товаров.</i>',
    es: '⚠️ <i>Actualmente no hay productos disponibles en el catálogo.</i>',
    it: '⚠️ <i>Al momento non ci sono prodotti disponibili nel catalogo.</i>',
    de: '⚠️ <i>Derzeit sind keine Produkte im Katalog verfügbar.</i>',
    fr: '⚠️ <i>Aucun produit n\'est actuellement disponible dans le catalogue.</i>',
    pt: '⚠️ <i>No momento não há produtos disponíveis no catálogo.</i>',
    hi: '⚠️ <i>वर्तमान में कैटलॉग में कोई उत्पाद उपलब्ध नहीं है।</i>',
    uz: '⚠️ <i>Hozirda katalogda mahsulotlar mavjud emas.</i>',
    ar: '⚠️ <i>لا توجد منتجات متاحة في الكتالوج حاليًا.</i>',
    ja: '⚠️ <i>現在カタログに利用可能な商品はありません。</i>',
    tr: '⚠️ <i>Şu anda katalogda ürün bulunmamaktadır.</i>'
  },
  product_not_found: {
    id: '❌ Produk tidak ditemukan atau sudah tidak tersedia.',
    ms: '❌ Produk tidak ditemui atau tidak lagi tersedia.',
    en: '❌ Product not found or no longer available.',
    zh: '❌ 商品未找到或已不再提供。',
    ru: '❌ Товар не найден или больше недоступен.',
    es: '❌ Producto no encontrado o ya no disponible.',
    it: '❌ Prodotto non trovato o non più disponibile.',
    de: '❌ Produkt nicht gefunden oder nicht mehr verfügbar.',
    fr: '❌ Produit introuvable ou indisponible.',
    pt: '❌ Produto não encontrado ou não está mais disponível.',
    hi: '❌ उत्पाद नहीं मिला या अब उपलब्ध नहीं है।',
    uz: '❌ Mahsulot topilmadi yoki endi mavjud emas.',
    ar: '❌ المنتج غير موجود أو لم يعد متاحًا.',
    ja: '❌ 商品が見つからないか、現在利用できません。',
    tr: '❌ Ürün bulunamadı veya artık mevcut değil.'
  },
  lbl_category: {
    id: 'Kategori',
    ms: 'Kategori',
    en: 'Category',
    zh: '类别',
    ru: 'Категория',
    es: 'Categoría',
    it: 'Categoria',
    de: 'Kategorie',
    fr: 'Catégorie',
    pt: 'Categoria',
    hi: 'श्रेणी',
    uz: 'Toifa',
    ar: 'الفئة',
    ja: 'カテゴリー',
    tr: 'Kategori'
  },
  lbl_price_usd: {
    id: 'Harga USD',
    ms: 'Harga USD',
    en: 'Price USD',
    zh: '价格 (USD)',
    ru: 'Цена (USD)',
    es: 'Precio USD',
    it: 'Prezzo USD',
    de: 'Preis USD',
    fr: 'Prix USD',
    pt: 'Preço USD',
    hi: 'मूल्य USD',
    uz: 'Narx USD',
    ar: 'السعر بالدولار',
    ja: '価格 USD',
    tr: 'Fiyat USD'
  },
  lbl_price_idr: {
    id: 'Harga IDR',
    ms: 'Harga IDR',
    en: 'Price IDR',
    zh: '印尼盾参考价',
    ru: 'Цена (IDR)',
    es: 'Precio IDR',
    it: 'Prezzo IDR',
    de: 'Preis IDR',
    fr: 'Prix IDR',
    pt: 'Preço IDR',
    hi: 'मूल्य IDR',
    uz: 'Narx IDR',
    ar: 'السعر بالروبية',
    ja: '価格 IDR',
    tr: 'Fiyat IDR'
  },
  units_in_stock: {
    id: 'unit siap kirim',
    ms: 'unit sedia dihantar',
    en: 'units ready to ship',
    zh: '件现货即发',
    ru: 'шт. готово к выдаче',
    es: 'unidades listas para entrega',
    it: 'unità pronte per l\'invio',
    de: 'Einheiten versandbereit',
    fr: 'unités prêtes à être livrées',
    pt: 'unidades prontas para entrega',
    hi: 'यूनिट डिलीवरी के लिए तैयार',
    uz: 'birlik yetkazib berishga tayyor',
    ar: 'وحدة جاهزة للتسليم',
    ja: '個 即納可能',
    tr: 'adet teslimata hazır'
  },
  lbl_description: {
    id: 'Deskripsi',
    ms: 'Penerangan',
    en: 'Description',
    zh: '商品说明',
    ru: 'Описание',
    es: 'Descripción',
    it: 'Descrizione',
    de: 'Beschreibung',
    fr: 'Description',
    pt: 'Descrição',
    hi: 'विवरण',
    uz: 'Tavsif',
    ar: 'الوصف',
    ja: '説明',
    tr: 'Açıklama'
  },
  auto_delivery_notice: {
    id: '⚡ <i>Kredensial akun (Email:Password:Cookie) akan dikirimkan otomatis HANYA setelah pembayaran Anda sah terverifikasi.</i>',
    ms: '⚡ <i>Kredensial akaun (Email:Password:Cookie) akan dihantar secara automatik HANYA selepas bayaran anda sah disahkan.</i>',
    en: '⚡ <i>Account credentials (Email:Password:Cookie) will be delivered automatically ONLY after verified payment.</i>',
    zh: '⚡ <i>账号凭据（邮箱:密码:Cookie）仅在您的付款通过链上或人工核实后自动发送。</i>',
    ru: '⚡ <i>Данные аккаунта (Email:Пароль:Cookie) будут отправлены автоматически ТОЛЬКО после подтверждения оплаты.</i>',
    es: '⚡ <i>Las credenciales de la cuenta (Email:Contraseña:Cookie) se entregarán automáticamente SOLO tras verificar el pago.</i>',
    it: '⚡ <i>Le credenziali dell\'account (Email:Password:Cookie) saranno inviate automaticamente SOLO dopo la verifica del pagamento.</i>',
    de: '⚡ <i>Die Zugangsdaten (E-Mail:Passwort:Cookie) werden NUR nach erfolgreicher Zahlungsprüfung automatisch versendet.</i>',
    fr: '⚡ <i>Les identifiants du compte (Email:Mot de passe:Cookie) seront livrés automatiquement UNIQUEMENT après paiement vérifié.</i>',
    pt: '⚡ <i>As credenciais da conta (Email:Senha:Cookie) serão enviadas automaticamente APENAS após a confirmação do pagamento.</i>',
    hi: '⚡ <i>सत्यापित भुगतान के बाद ही खाता क्रेडेंशियल (Email:Password:Cookie) स्वचालित रूप से वितरित किए जाएंगे।</i>',
    uz: '⚡ <i>Hisob ma\'lumotlari (Email:Parol:Cookie) FAQAT to\'lov tasdiqlangandan so\'ng avtomatik yuboriladi.</i>',
    ar: '⚡ <i>سيتم تسليم بيانات الحساب (البريد:كلمة المرور:الكوكيز) تلقائيًا فقط بعد تأكيد الدفع بشكل صحيح.</i>',
    ja: '⚡ <i>アカウント情報（メール:パスワード:Cookie）は、支払いが確認された後にのみ自動配信されます。</i>',
    tr: '⚡ <i>Hesap bilgileri (E-posta:Şifre:Çerez) YALNIZCA ödeme doğrulandıktan sonra otomatik olarak teslim edilecektir.</i>'
  },
  connecting_gateway: {
    id: 'Menghubungkan ke gateway pembayaran kripto...',
    ms: 'Menyambung ke pintu masuk pembayaran kripto...',
    en: 'Connecting to crypto payment gateway...',
    zh: '正在连接加密货币支付网关...',
    ru: 'Подключение к криптовалютному шлюзу...',
    es: 'Conectando con la pasarela de pago cripto...',
    it: 'Connessione al gateway di pagamento crypto...',
    de: 'Verbindung zum Krypto-Zahlungsgateway wird hergestellt...',
    fr: 'Connexion à la passerelle de paiement crypto...',
    pt: 'Conectando ao gateway de pagamento cripto...',
    hi: 'क्रिप्टो पेमेंट गेटवे से कनेक्ट हो रहा है...',
    uz: 'Kripto to\'lov shlyuziga ulanmoqda...',
    ar: 'جارٍ الاتصال ببوابة الدفع بالعملات المشفرة...',
    ja: '暗号資産決済ゲートウェイに接続中...',
    tr: 'Kripto ödeme ağ geçidine bağlanılıyor...'
  },
  invoice_title: {
    id: 'INVOICE PEMBAYARAN',
    ms: 'INVOIS BAYARAN',
    en: 'PAYMENT INVOICE',
    zh: '支付账单',
    ru: 'СЧЕТ НА ОПЛАТУ',
    es: 'FACTURA DE PAGO',
    it: 'FATTURA DI PAGAMENTO',
    de: 'ZAHLUNGSRECHNUNG',
    fr: 'FACTURE DE PAIEMENT',
    pt: 'FATURA DE PAGAMENTO',
    hi: 'भुगतान चालान',
    uz: 'TO\'LOV HISOB-FAKTURASI',
    ar: 'فاتورة الدفع',
    ja: 'お支払い請求書',
    tr: 'ÖDEME FATURASI'
  },
  manual_invoice_title: {
    id: 'INVOICE PEMBAYARAN MANUAL',
    ms: 'INVOIS BAYARAN MANUAL',
    en: 'MANUAL PAYMENT INVOICE',
    zh: '人工转账账单',
    ru: 'СЧЕТ НА РУЧНУЮ ОПЛАТУ',
    es: 'FACTURA DE TRANSFERENCIA MANUAL',
    it: 'FATTURA TRASFERIMENTO MANUALE',
    de: 'RECHNUNG MANUELLE ÜBERWEISUNG',
    fr: 'FACTURE DE PAIEMENT MANUEL',
    pt: 'FATURA DE TRANSFERÊNCIA MANUAL',
    hi: 'मैन्युअल भुगतान चालान',
    uz: 'QO\'LDA TO\'LOV HISOBI',
    ar: 'فاتورة التحويل اليدوي',
    ja: '手動送金請求書',
    tr: 'MANUEL ÖDEME FATURASI'
  },
  lbl_product: {
    id: 'Produk',
    ms: 'Produk',
    en: 'Product',
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
    ja: '商品',
    tr: 'Ürün'
  },
  lbl_total_bill: {
    id: 'Total Tagihan',
    ms: 'Jumlah Perlu Dibayar',
    en: 'Total Bill',
    zh: '应付金额',
    ru: 'Сумма к оплате',
    es: 'Total a Pagar',
    it: 'Totale Fattura',
    de: 'Gesamtbetrag',
    fr: 'Montant Total',
    pt: 'Total a Pagar',
    hi: 'कुल राशि',
    uz: 'Jami to\'lov',
    ar: 'المبلغ الإجمالي',
    ja: '合計金額',
    tr: 'Toplam Tutar'
  },
  lbl_deposit_address: {
    id: 'Alamat Deposit Token',
    ms: 'Alamat Deposit Token',
    en: 'Deposit Address',
    zh: '充值接收地址',
    ru: 'Адрес для депозита',
    es: 'Dirección de Depósito',
    it: 'Indirizzo di Deposito',
    de: 'Einzahlungsadresse',
    fr: 'Adresse de Dépôt',
    pt: 'Endereço de Depósito',
    hi: 'डिपॉजिट पता',
    uz: 'Depozit manzili',
    ar: 'عنوان الإيداع',
    ja: '入金アドレス',
    tr: 'Yatırma Adresi'
  },
  lbl_token_url: {
    id: 'URL Token / Explorer',
    ms: 'Pautan Token / Explorer',
    en: 'Token / Explorer URL',
    zh: '区块浏览器链接',
    ru: 'Ссылка на блокчейн / эксплорер',
    es: 'URL del Explorador / Token',
    it: 'URL Explorer Blockchain',
    de: 'Blockchain Explorer Link',
    fr: 'Lien de l\'Explorateur',
    pt: 'Link do Explorador Blockchain',
    hi: 'एक्सप्लोरर लिंक',
    uz: 'Explorer havolasi',
    ar: 'رابط مستكشف البلوكشين',
    ja: 'エクスプローラーURL',
    tr: 'Blokzincir Tarayıcı Bağlantısı'
  },
  delivery_policy_title: {
    id: 'PETUNJUK & KEBIJAKAN PENGIRIMAN',
    ms: 'PANDUAN & POLISI PENGHANTARAN',
    en: 'DELIVERY INSTRUCTIONS & POLICY',
    zh: '发货政策与操作说明',
    ru: 'ИНСТРУКЦИЯ И ПРАВИЛА ДОСТАВКИ',
    es: 'INSTRUCCIONES Y POLÍTICA DE ENTREGA',
    it: 'ISTRUZIONI E POLITICA DI CONSEGNA',
    de: 'LIEFERANWEISUNGEN & RICHTLINIEN',
    fr: 'INSTRUCTIONS ET CONDITIONS DE LIVRAISON',
    pt: 'INSTRUÇÕES E POLÍTICA DE ENTREGA',
    hi: 'निर्देश एवं डिलीवरी नीति',
    uz: 'KO\'RSATMALAR VA YETKAZIB BERISH QOIDALARI',
    ar: 'تعليمات وسياسة التسليم',
    ja: 'お届け手順およびポリシー',
    tr: 'TESLİMAT TALİMATLARI VE POLİTİKASI'
  },
  delivery_policy_auto_crypto: {
    id: '1. Transfer nominal tepat ke alamat deposit di atas (bisa scan QR code).\n2. Setelah transfer, klik tombol "Cek / Konfirmasi Pembayaran".\n3. Akun HANYA dikirim otomatis bila transaksi terkonfirmasi di blockchain.',
    ms: '1. Pindahkan jumlah tepat ke alamat deposit di atas.\n2. Klik "Semak / Sahkan Pembayaran" selepas memindahkan dana.\n3. Akaun HANYA dihantar jika transaksi disahkan di blockchain.',
    en: '1. Transfer the exact amount to the deposit address above (or scan the QR code).\n2. After transferring, click "Check / Confirm Payment".\n3. Credentials are ONLY released once confirmed on the blockchain.',
    zh: '1. 请将准确金额转账至上述充值地址（可直接扫码）。\n2. 完成转账后，点击下方的【检查/确认付款】按钮。\n3. 账号仅在区块链确认到账后自动发放。',
    ru: '1. Переведите точную сумму на указанный выше адрес (можно отсканировать QR-код).\n2. После перевода нажмите кнопку «Проверить оплату».\n3. Данные аккаунта выдаются ТОЛЬКО после подтверждения в блокчейне.',
    es: '1. Transfiera el monto exacto a la dirección indicada arriba (o escanee el QR).\n2. Tras transferir, presione "Verificar Pago".\n3. La cuenta SOLO se entrega tras confirmarse en la blockchain.',
    it: '1. Trasferisci l\'importo esatto all\'indirizzo di deposito (o scansiona il QR).\n2. Dopo il trasferimento, clicca "Verifica Pagamento".\n3. L\'account viene consegnato SOLO dopo la conferma blockchain.',
    de: '1. Überweisen Sie den genauen Betrag an die obige Adresse (oder scannen Sie den QR-Code).\n2. Klicken Sie anschließend auf "Zahlung prüfen / bestätigen".\n3. Die Zugangsdaten werden ERST nach Blockchain-Bestätigung ausgegeben.',
    fr: '1. Transférez le montant exact à l\'adresse ci-dessus (ou scannez le QR code).\n2. Après le transfert, cliquez sur "Vérifier le paiement".\n3. Les identifiants sont livrés UNIQUEMENT après confirmation blockchain.',
    pt: '1. Transfira o valor exato para o endereço de depósito acima (ou escaneie o QR).\n2. Após transferir, clique em "Verificar Pagamento".\n3. A conta é liberada APENAS após confirmação na blockchain.',
    hi: '1. ऊपर दिए गए पते पर सटीक राशि ट्रांसफर करें (या QR कोड स्कैन करें)।\n2. ट्रांसफर के बाद "भुगतान की पुष्टि करें" पर क्लिक करें।\n3. खाता केवल ब्लॉकचेन पुष्टिकरण के बाद ही दिया जाएगा।',
    uz: '1. Aniq miqdorni yuqoridagi manzilga o\'tkazing (QR kodni skanerlang).\n2. O\'tkazgach, "To\'lovni tekshirish" tugmasini bosing.\n3. Hisob FAQAT blokcheynda tasdiqlangandan so\'ng beriladi.',
    ar: '1. حوّل المبلغ المحدد بدقة إلى عنوان الإيداع أعلاه (أو امسح رمز QR).\n2. بعد التحويل، اضغط على زر "التحقق من الدفع".\n3. يتم تسليم الحساب فقط بعد تأكيد المعاملة على البلوكشين.',
    ja: '1. 上記の入金アドレスに正確な金額を送金してください（QRコードのスキャンも可能）。\n2. 送金後、「支払いの確認」ボタンを押してください。\n3. ブロックチェーンでの承認完了後にのみアカウントが自動配信されます。',
    tr: '1. Yukarıdaki adrese tam tutarı transfer edin (QR kodunu tarayabilirsiniz).\n2. Transferden sonra "Ödemeyi Kontrol Et" butonuna tıklayın.\n3. Hesap bilgileri YALNIZCA blokzincir onayı alındıktan sonra verilir.'
  },
  select_network_title: {
    id: 'PILIH JARINGAN TRANSFER KRIPTO MANUAL',
    ms: 'PILIH RANGKAIAN PINDAHAN KRIPTO MANUAL',
    en: 'SELECT MANUAL CRYPTO NETWORK',
    zh: '选择人工转账加密网络',
    ru: 'ВЫБЕРИТЕ СЕТЬ ДЛЯ РУЧНОГО ПЕРЕВОДА',
    es: 'SELECCIONE RED DE TRANSFERENCIA MANUAL',
    it: 'SELEZIONA RETE CRIPTO MANUALE',
    de: 'NETZWERK FÜR MANUELLE ÜBERWEISUNG WÄHLEN',
    fr: 'SÉLECTIONNEZ LE RÉSEAU CRYPTO MANUEL',
    pt: 'SELECIONE A REDE CRIPTO MANUAL',
    hi: 'मैन्युअल क्रिप्टो नेटवर्क चुनें',
    uz: 'QO\'LDA O\'TKAZISH TARMOQNI TANLANG',
    ar: 'اختر شبكة التحويل اليدوي',
    ja: '手動送金の暗号資産ネットワークを選択',
    tr: 'MANUEL KRİPTO AĞINI SEÇİN'
  },
  select_network_prompt: {
    id: 'Pilih salah satu jaringan dompet kripto di bawah untuk melihat alamat tujuan transfer:',
    ms: 'Pilih salah satu rangkaian dompet kripto di bawah untuk melihat alamat tujuan pindahan:',
    en: 'Select one of the crypto wallet networks below to view the destination address:',
    zh: '在下方选择一个加密钱包网络以获取收款地址：',
    ru: 'Выберите одну из сетей кошельков ниже, чтобы получить адрес для перевода:',
    es: 'Seleccione una red a continuación para ver la dirección de destino:',
    it: 'Seleziona una delle reti qui sotto per visualizzare l\'indirizzo di destinazione:',
    de: 'Wählen Sie eines der folgenden Netzwerke, um die Zieladresse anzuzeigen:',
    fr: 'Sélectionnez un réseau ci-dessous pour voir l\'adresse de réception :',
    pt: 'Selecione uma das redes abaixo para ver o endereço de destino:',
    hi: 'गंतव्य पता देखने के लिए नीचे दिए गए नेटवर्क में से एक चुनें:',
    uz: 'Qabul qiluvchi manzilni ko\'rish uchun quyidagi tarmoqlardan birini tanlang:',
    ar: 'اختر إحدى شبكات المحافظ أدناه لعرض عنوان التحويل:',
    ja: '送金先アドレスを表示するには、以下のネットワークを選択してください：',
    tr: 'Hedef adresi görmek için aşağıdaki ağlardan birini seçin:'
  },
  click_to_copy_address: {
    id: 'Klik atau tekan alamat di atas untuk langsung menyalin',
    ms: 'Tekan alamat di atas untuk terus menyalin',
    en: 'Tap address above to quickly copy',
    zh: '点击上方地址可直接复制',
    ru: 'Нажмите на адрес выше, чтобы скопировать',
    es: 'Haga clic en la dirección arriba para copiarla',
    it: 'Tocca l\'indirizzo sopra per copiarlo',
    de: 'Tippen Sie auf die Adresse, um sie zu kopieren',
    fr: 'Appuyez sur l\'adresse ci-dessus pour copier',
    pt: 'Toque no endereço acima para copiar',
    hi: 'कॉपी करने के लिए पते पर टैप करें',
    uz: 'Nusxalash uchun manzilni bosing',
    ar: 'اضغط على العنوان أعلاه لنسخه مباشرة',
    ja: '上記のアドレスをタップしてコピー',
    tr: 'Kopyalamak için yukarıdaki adrese dokunun'
  },
  lbl_qr_link: {
    id: 'Tautan Gambar QR Code',
    ms: 'Pautan Gambar Kod QR',
    en: 'QR Code Image Link',
    zh: '二维码图片链接',
    ru: 'Ссылка на QR-код',
    es: 'Enlace del Código QR',
    it: 'Link Immagine QR Code',
    de: 'QR-Code Bild-Link',
    fr: 'Lien de l\'image QR Code',
    pt: 'Link da Imagem do QR Code',
    hi: 'QR कोड लिंक',
    uz: 'QR-kod rasmi havolasi',
    ar: 'رابط صورة رمز QR',
    ja: 'QRコード画像リンク',
    tr: 'QR Kod Bağlantısı'
  },
  payment_guide_header: {
    id: 'PANDUAN PEMBAYARAN',
    ms: 'PANDUAN BAYARAN',
    en: 'PAYMENT GUIDE',
    zh: '支付操作指引',
    ru: 'ИНСТРУКЦИЯ ПО ОПЛАТЕ',
    es: 'GUÍA DE PAGO',
    it: 'GUIDA AL PAGAMENTO',
    de: 'ZAHLUNGSLEITFADEN',
    fr: 'GUIDE DE PAIEMENT',
    pt: 'GUIA DE PAGAMENTO',
    hi: 'भुगतान मार्गदर्शिका',
    uz: 'TO\'LOV QO\'LLANMASI',
    ar: 'دليل الدفع',
    ja: 'お支払いガイド',
    tr: 'ÖDEME KILAVUZU'
  },
  manual_payment_steps: {
    id: '1. Transfer nominal tepat ke alamat deposit di atas.\n2. Klik "📝 Kirim Bukti Transfer / TXID" untuk mengirim hash atau foto resi.\n3. Akun digital resmi otomatis dikirim ke chat ini segera setelah diverifikasi.',
    ms: '1. Pindahkan jumlah tepat ke alamat deposit di atas.\n2. Klik "📝 Hantar Bukti / TXID" untuk menghantar hash atau foto resit.\n3. Akaun rasmi akan dihantar ke sini selepas disahkan.',
    en: '1. Transfer exact amount to the deposit address above.\n2. Click "📝 Send Proof / TXID" to provide transaction hash or receipt screenshot.\n3. Official account credentials are automatically delivered here once verified.',
    zh: '1. 请向上述地址准确转账对应金额。\n2. 点击【📝 提交转账凭证 / TXID】发送交易哈希或截图。\n3. 管理员核验通过后，账号凭据将自动发送到此对话。',
    ru: '1. Переведите точную сумму на адрес депозита выше.\n2. Нажмите «📝 Отправить чек / TXID», чтобы отправить хеш или скриншот.\n3. Данные аккаунта будут автоматически отправлены сюда после проверки.',
    es: '1. Transfiera el monto exacto a la dirección indicada.\n2. Presione "📝 Enviar Comprobante / TXID" para subir el hash o captura.\n3. Las credenciales se enviarán automáticamente aquí tras la verificación.',
    it: '1. Trasferisci l\'importo esatto all\'indirizzo sopra.\n2. Clicca "📝 Invia Ricevuta / TXID" per inserire l\'hash o screenshot.\n3. Le credenziali ufficiali saranno inviate qui dopo la verifica.',
    de: '1. Überweisen Sie den genauen Betrag an die obige Adresse.\n2. Klicken Sie auf "📝 Beleg / TXID senden", um Transaktions-Hash oder Screenshot zu übermitteln.\n3. Die offiziellen Zugangsdaten werden nach der Prüfung automatisch hierher gesendet.',
    fr: '1. Transférez le montant exact à l\'adresse ci-dessus.\n2. Cliquez sur "📝 Envoyer Preuve / TXID" pour soumettre le hash ou la capture.\n3. Les identifiants officiels seront envoyés ici dès validation.',
    pt: '1. Transfira o valor exato para o endereço acima.\n2. Clique em "📝 Enviar Comprovante / TXID" para enviar a hash ou foto.\n3. As credenciais oficiais serão entregues aqui assim que aprovadas.',
    hi: '1. ऊपर दिए गए पते पर सटीक राशि ट्रांसफर करें।\n2. हैश या रसीद भेजने के लिए "📝 प्रमाण / TXID भेजें" पर क्लिक करें।\n3. सत्यापन के बाद डिजिटल खाता सीधे इस चैट में भेजा जाएगा।',
    uz: '1. Yuqoridagi manzilga aniq miqdorni o\'tkazing.\n2. Tranzaksiya xeshini yoki chek rasmini yuborish uchun "📝 Chek / TXID yuborish" ni bosing.\n3. Tekshirilgach, hisob ma\'lumotlari avtomatik ushbu chatga yuboriladi.',
    ar: '1. حوّل المبلغ المحدد بدقة إلى العنوان أعلاه.\n2. اضغط على "📝 إرسال إيصال التحويل / TXID" لإرسال الهاش أو لقطة الشاشة.\n3. يتم تسليم بيانات الحساب رسميًا إلى هذه المحادثة فور التحقق.',
    ja: '1. 上記アドレスに正確な金額を送金してください。\n2. 「📝 送金証明 / TXID を送信」を押してハッシュまたはスクリーンショットを送信してください。\n3. 確認完了後、公式アカウント情報がこのチャットに自動配信されます。',
    tr: '1. Yukarıdaki adrese tam tutarı transfer edin.\n2. İşlem kodunu veya dekontu göndermek için "📝 Dekont / TXID Gönder"e tıklayın.\n3. Doğrulandıktan sonra resmi hesap bilgileri otomatik olarak bu sohbete iletilir.'
  },
  btn_send_txid: {
    id: '📝 Kirim Bukti Transfer / TXID',
    ms: '📝 Hantar Bukti / TXID',
    en: '📝 Send Transfer Proof / TXID',
    zh: '📝 提交转账凭证 / TXID',
    ru: '📝 Отправить чек / TXID',
    es: '📝 Enviar Comprobante / TXID',
    it: '📝 Invia Ricevuta / TXID',
    de: '📝 Beleg / TXID senden',
    fr: '📝 Envoyer Preuve / TXID',
    pt: '📝 Enviar Comprovante / TXID',
    hi: '📝 भुगतान प्रमाण / TXID भेजें',
    uz: '📝 Chek / TXID yuborish',
    ar: '📝 إرسال إثبات التحويل / TXID',
    ja: '📝 送金証明 / TXID を送信',
    tr: '📝 Dekont / TXID Gönder'
  },
  btn_open_qr: {
    id: '🖼️ Buka Gambar QR Code',
    ms: '🖼️ Buka Gambar Kod QR',
    en: '🖼️ Open QR Code Image',
    zh: '🖼️ 查看收款二维码',
    ru: '🖼️ Открыть QR-код',
    es: '🖼️ Ver Código QR',
    it: '🖼️ Apri Immagine QR Code',
    de: '🖼️ QR-Code Bild öffnen',
    fr: '🖼️ Ouvrir l\'image QR Code',
    pt: '🖼️ Abrir Imagem do QR Code',
    hi: '🖼️ QR कोड चित्र खोलें',
    uz: '🖼️ QR-kod rasmini ochish',
    ar: '🖼️ فتح صورة رمز QR',
    ja: '🖼️ QRコード画像を開く',
    tr: '🖼️ QR Kod Resmini Aç'
  },
  btn_open_explorer: {
    id: '🔍 Buka URL Token / Explorer',
    ms: '🔍 Buka Pautan Token / Explorer',
    en: '🔍 Open Token / Explorer URL',
    zh: '🔍 查看区块链浏览器',
    ru: '🔍 Открыть эксплорер транзакции',
    es: '🔍 Abrir Explorador de Blockchain',
    it: '🔍 Apri Explorer Blockchain',
    de: '🔍 Blockchain Explorer öffnen',
    fr: '🔍 Ouvrir l\'Explorateur Blockchain',
    pt: '🔍 Abrir no Explorador Blockchain',
    hi: '🔍 ब्लॉकचेन एक्सप्लोरर खोलें',
    uz: '🔍 Blokcheyn Explorerni ochish',
    ar: '🔍 فتح مستكشف البلوكشين',
    ja: '🔍 エクスプローラーを開く',
    tr: '🔍 Blokzincir Tarayıcısını Aç'
  },
  btn_view_receipt: {
    id: '🧾 Lihat Bukti Pembayaran Berhasil',
    ms: '🧾 Lihat Bukti Bayaran Berjaya',
    en: '🧾 View Official Payment Receipt',
    zh: '🧾 查看官方付款收据',
    ru: '🧾 Посмотреть чек об оплате',
    es: '🧾 Ver Comprobante de Pago Oficial',
    it: '🧾 Visualizza Ricevuta di Pagamento',
    de: '🧾 Offiziellen Zahlungsbeleg anzeigen',
    fr: '🧾 Voir le reçu de paiement officiel',
    pt: '🧾 Ver Recibo Oficial de Pagamento',
    hi: '🧾 आधिकारिक भुगतान रसीद देखें',
    uz: '🧾 To\'lov chekini ko\'rish',
    ar: '🧾 عرض إيصال الدفع الرسمي',
    ja: '🧾 公式決済レシートを表示',
    tr: '🧾 Resmi Ödeme Makbuzunu Gör'
  },
  btn_back_order: {
    id: '🔙 Kembali ke Detail Pesanan',
    ms: '🔙 Kembali ke Butiran Pesanan',
    en: '🔙 Back to Order Details',
    zh: '🔙 返回订单详情',
    ru: '🔙 Назад к деталям заказа',
    es: '🔙 Volver al Detalle del Pedido',
    it: '🔙 Torna ai Dettagli Ordine',
    de: '🔙 Zurück zu Bestelldetails',
    fr: '🔙 Retour aux détails de la commande',
    pt: '🔙 Voltar aos Detalhes do Pedido',
    hi: '🔙 ऑर्डर विवरण पर वापस जाएं',
    uz: '🔙 Buyurtma tafsilotlariga qaytish',
    ar: '🔙 العودة إلى تفاصيل الطلب',
    ja: '🔙 注文詳細に戻る',
    tr: '🔙 Sipariş Detaylarına Dön'
  },
  btn_back_invoice: {
    id: '🔙 Kembali ke Invoice',
    ms: '🔙 Kembali ke Invois',
    en: '🔙 Back to Invoice',
    zh: '🔙 返回账单',
    ru: '🔙 Назад к счету',
    es: '🔙 Volver a la Factura',
    it: '🔙 Torna alla Fattura',
    de: '🔙 Zurück zur Rechnung',
    fr: '🔙 Retour à la Facture',
    pt: '🔙 Voltar para a Fatura',
    hi: '🔙 चालान पर वापस जाएं',
    uz: '🔙 Hisob-fakturaga qaytish',
    ar: '🔙 العودة إلى الفاتورة',
    ja: '🔙 請求書に戻る',
    tr: '🔙 Faturaya Dön'
  },
  btn_view_order_details: {
    id: '📦 Lihat Detail Pesanan',
    ms: '📦 Lihat Butiran Pesanan',
    en: '📦 View Order Details',
    zh: '📦 查看订单详情',
    ru: '📦 Подробнее о заказе',
    es: '📦 Ver Detalles del Pedido',
    it: '📦 Dettagli Ordine',
    de: '📦 Bestelldetails ansehen',
    fr: '📦 Voir les détails de commande',
    pt: '📦 Ver Detalhes do Pedido',
    hi: '📦 ऑर्डर विवरण देखें',
    uz: '📦 Buyurtma tafsilotlarini ko\'rish',
    ar: '📦 عرض تفاصيل الطلب',
    ja: '📦 注文詳細を見る',
    tr: '📦 Sipariş Detaylarını Gör'
  },
  msg_pending_verification: {
    id: '⏳ Pesanan Anda sedang diverifikasi oleh petugas. Harap tunggu konfirmasi.',
    ms: '⏳ Pesanan anda sedang disahkan oleh pegawai. Sila tunggu pengesahan.',
    en: '⏳ Your order is currently being verified by our staff. Please wait for confirmation.',
    zh: '⏳ 您的订单正在由工作人员核实中，请耐心等待确认。',
    ru: '⏳ Ваш заказ проверяется оператором. Пожалуйста, ожидайте подтверждения.',
    es: '⏳ Su pedido está siendo verificado por nuestro equipo. Por favor espere confirmación.',
    it: '⏳ Il tuo ordine è in fase di verifica da parte del nostro staff. Attendi la conferma.',
    de: '⏳ Ihre Bestellung wird derzeit überprüft. Bitte warten Sie auf die Bestätigung.',
    fr: '⏳ Votre commande est en cours de vérification. Veuillez patienter pour la confirmation.',
    pt: '⏳ Seu pedido está sendo verificado por nossa equipe. Aguarde a confirmação.',
    hi: '⏳ आपके ऑर्डर का सत्यापन किया जा रहा है। कृपया पुष्टि की प्रतीक्षा करें।',
    uz: '⏳ Buyurtmangiz xodimlar tomonidan tekshirilmoqda. Iltimos, tasdiqlashni kuting.',
    ar: '⏳ طلبك قيد التحقق من قبل المشرف. يرجى انتظار التأكيد.',
    ja: '⏳ ご注文はスタッフが確認中です。確認をお待ちください。',
    tr: '⏳ Siparişiniz yetkililer tarafından doğrulanıyor. Lütfen onayı bekleyin.'
  },
  msg_payment_not_detected: {
    id: '⚠️ Pembayaran belum terdeteksi. Silakan selesaikan pembayaran sesuai invoice di bawah.',
    ms: '⚠️ Pembayaran belum dikesan. Sila selesaikan pembayaran mengikut invois di bawah.',
    en: '⚠️ Payment not yet detected. Please complete the payment according to the invoice below.',
    zh: '⚠️ 尚未检测到付款。请根据以下账单完成付款。',
    ru: '⚠️ Оплата пока не обнаружена. Пожалуйста, завершите платеж по счету ниже.',
    es: '⚠️ Pago no detectado aún. Por favor complete el pago según la factura siguiente.',
    it: '⚠️ Pagamento non ancora rilevato. Completa il pagamento seguendo la fattura qui sotto.',
    de: '⚠️ Zahlung noch nicht erkannt. Bitte begleichen Sie den Betrag laut Rechnung unten.',
    fr: '⚠️ Paiement non encore détecté. Veuillez effectuer le paiement selon la facture ci-dessous.',
    pt: '⚠️ Pagamento ainda não detectado. Conclua o pagamento conforme a fatura abaixo.',
    hi: '⚠️ भुगतान अभी नहीं मिला है। कृपया नीचे दिए गए इनवॉइस के अनुसार भुगतान पूरा करें।',
    uz: '⚠️ To\'lov hali aniqlanmadi. Iltimos, quyidagi hisob-faktura bo\'yicha to\'lovni yakunlang.',
    ar: '⚠️ لم يتم الكشف عن الدفع بعد. يرجى إتمام الدفع وفقاً للفاتورة أدناه.',
    ja: '⚠️ お支払いがまだ検出されていません。以下の請求書に従ってお支払いを完了してください。',
    tr: '⚠️ Ödeme henüz algılanmadı. Lütfen aşağıdaki faturaya göre ödemeyi tamamlayın.'
  },
  btn_take_order: {
    id: '🔑 Ambil Pesanan / Kredensial',
    ms: '🔑 Ambil Pesanan / Kredensial',
    en: '🔑 Claim Order / Credentials',
    zh: '🔑 领取订单 / 账号凭证',
    ru: '🔑 Получить заказ / Доступ',
    es: '🔑 Reclamar Pedido / Credenciales',
    it: '🔑 Riscatta Ordine / Credenziali',
    de: '🔑 Bestellung / Zugangsdaten abrufen',
    fr: '🔑 Récupérer la commande / Identifiants',
    pt: '🔑 Resgatar Pedido / Credenciais',
    hi: '🔑 ऑर्डर / क्रेडेंशियल प्राप्त करें',
    uz: '🔑 Buyurtmani olish / Hisob',
    ar: '🔑 استلام الطلب / بيانات الاعتماد',
    ja: '🔑 注文 / アカウント情報を受け取る',
    tr: '🔑 Siparişi / Hesap Bilgilerini Al'
  },
  btn_check_status: {
    id: '🔍 Cek Status Pesanan',
    ms: '🔍 Semak Status Pesanan',
    en: '🔍 Check Order Status',
    zh: '🔍 查看订单状态',
    ru: '🔍 Проверить статус заказа',
    es: '🔍 Consultar Estado del Pedido',
    it: '🔍 Verifica Stato Ordine',
    de: '🔍 Bestellstatus prüfen',
    fr: '🔍 Vérifier le statut de la commande',
    pt: '🔍 Verificar Status do Pedido',
    hi: '🔍 ऑर्डर स्थिति जांचें',
    uz: '🔍 Buyurtma holatini tekshirish',
    ar: '🔍 التحقق من حالة الطلب',
    ja: '🔍 注文ステータスを確認',
    tr: '🔍 Sipariş Durumunu Kontrol Et'
  },
  btn_qris: {
    id: '💳 Bayar via QRIS (Semua E-Wallet & Bank)',
    ms: '💳 Bayar via QRIS (Semua E-Wallet & Bank)',
    en: '💳 Pay via QRIS (All E-Wallets & Banks)',
    zh: '💳 通过 QRIS 支付（支持所有电子钱包及银行）',
    ru: '💳 Оплата через QRIS',
    es: '💳 Pagar con QRIS (Billeteras y Bancos)',
    it: '💳 Paga tramite QRIS',
    de: '💳 Zahlung via QRIS',
    fr: '💳 Payer via QRIS',
    pt: '💳 Pagar via QRIS',
    hi: '💳 QRIS द्वारा भुगतान करें',
    uz: '💳 QRIS orqali to\'lash',
    ar: '💳 الدفع عبر رمز QRIS',
    ja: '💳 QRIS で支払う',
    tr: '💳 QRIS ile Öde'
  },
  btn_ewallet: {
    id: '📱 Bayar via E-Wallet Manual (DANA, GoPay, OVO)',
    ms: '📱 Bayar via E-Wallet Manual',
    en: '📱 Pay via E-Wallet Manual',
    zh: '📱 电子钱包转账',
    ru: '📱 Оплата через Электронный кошелек',
    es: '📱 Pagar con Billetera Digital',
    it: '📱 Paga con Portafoglio Elettronico',
    de: '📱 Zahlung per E-Wallet',
    fr: '📱 Payer par portefeuille électronique',
    pt: '📱 Pagar via Carteira Digital',
    hi: '📱 ई-वॉलेट द्वारा भुगतान करें',
    uz: '📱 Elektron hamyon orqali to\'lash',
    ar: '📱 الدفع عبر المحفظة الإلكترونية',
    ja: '📱 E-ウォレットで支払う',
    tr: '📱 E-Cüzdan ile Öde'
  },
  btn_choose_channel: {
    id: '📢 Channel & Komunitas Resmi',
    ms: '📢 Saluran & Komuniti Rasmi',
    en: '📢 Official Channel & Community',
    zh: '📢 官方频道与社区',
    ru: '📢 Официальный канал и сообщество',
    es: '📢 Canal y Comunidad Oficial',
    it: '📢 Canale e Comunità Ufficiale',
    de: '📢 Offizieller Kanal & Community',
    fr: '📢 Canal et communauté officiels',
    pt: '📢 Canal e Comunidade Oficial',
    hi: '📢 आधिकारिक चैनल और समुदाय',
    uz: '📢 Rasmiy kanal va hamjamiyat',
    ar: '📢 القناة والمجتمع الرسمي',
    ja: '📢 公式チャンネル＆コミュニティ',
    tr: '📢 Resmi Kanal ve Topluluk'
  },
  qr_code_title: {
    id: 'QR CODE PEMBAYARAN',
    ms: 'KOD QR PEMBAYARAN',
    en: 'PAYMENT QR CODE',
    zh: '付款二维码',
    ru: 'QR-КОД ДЛЯ ОПЛАТЫ',
    es: 'CÓDIGO QR DE PAGO',
    it: 'QR CODE DI PAGAMENTO',
    de: 'ZAHLUNGS-QR-CODE',
    fr: 'QR CODE DE PAIEMENT',
    pt: 'QR CODE DE PAGAMENTO',
    hi: 'भुगतान QR कोड',
    uz: 'TO\'LOV QR KODI',
    ar: 'رمز QR للدفع',
    ja: 'お支払いQRコード',
    tr: 'ÖDEME QR KODU'
  },
  scan_qr_prompt: {
    id: 'Pindai (scan) QR Code di atas menggunakan dompet kripto Anda.',
    ms: 'Imbas kod QR di atas menggunakan dompet kripto anda.',
    en: 'Scan the QR Code above using your crypto wallet app.',
    zh: '请使用您的加密货币钱包扫描上方二维码。',
    ru: 'Отсканируйте QR-код выше с помощью вашего криптокошелька.',
    es: 'Escanee el código QR arriba usando su aplicación de billetera cripto.',
    it: 'Scansiona il QR Code sopra utilizzando la tua app di wallet crypto.',
    de: 'Scannen Sie den obigen QR-Code mit Ihrer Krypto-Wallet.',
    fr: 'Scannez le QR Code ci-dessus avec votre portefeuille crypto.',
    pt: 'Escaneie o QR Code acima usando seu aplicativo de carteira cripto.',
    hi: 'अपने क्रिप्टो वॉलेट ऐप से ऊपर दिए गए QR कोड को स्कैन करें।',
    uz: 'Kripto hamyoningiz yordamida yuqoridagi QR-kodni skanerlang.',
    ar: 'امسح رمز QR أعلاه باستخدام تطبيق محفظتك المشفرة.',
    ja: '暗号資産ウォレットアプリで上記のQRコードをスキャンしてください。',
    tr: 'Kripto cüzdan uygulamanızı kullanarak yukarıdaki QR kodunu tarayın.'
  },
  send_txid_title: {
    id: 'KIRIM BUKTI TRANSAKSI / TXID',
    ms: 'HANTAR BUKTI TRANSAKSI / TXID',
    en: 'SUBMIT PAYMENT PROOF / TXID',
    zh: '提交支付凭证 / TXID',
    ru: 'ОТПРАВКА ЧЕКА / TXID',
    es: 'ENVIAR COMPROBANTE / TXID',
    it: 'INVIA RICEVUTA / TXID',
    de: 'ZAHLUNGSBELEG / TXID EINREICHEN',
    fr: 'ENVOYER LA PREUVE DE PAIEMENT / TXID',
    pt: 'ENVIAR COMPROVANTE / TXID',
    hi: 'भुगतान प्रमाण / TXID भेजें',
    uz: 'TRANZAKSIYA CHEKI / TXID YUBORISH',
    ar: 'إرسال إثبات المعاملة / TXID',
    ja: '送金証明 / TXID を送信',
    tr: 'ÖDEME KANITI / TXID GÖNDER'
  },
  send_txid_instructions: {
    id: 'Anda dapat mengirim bukti pembayaran dengan dua cara:\n1. <b>Ketik / Tempel Hash Transaksi (TXID):</b> Salin hash dari dompet Anda dan kirimkan di sini.\n2. <b>Kirim Foto / Screenshot Resi:</b> Unggah gambar tangkapan layar bukti transfer langsung ke chat ini.\n\n<i>Admin akan memverifikasi mutasi dan akun digital akan segera dikirimkan otomatis.</i>',
    ms: 'Anda boleh menghantar bukti bayaran dengan dua cara:\n1. <b>Tampal Hash Transaksi (TXID):</b> Hantar hash transaksi anda di sini.\n2. <b>Hantar Tangkap Layar Resit:</b> Muat naik gambar resit ke chat ini.\n\n<i>Admin akan menyemak dan akaun dihantar secara automatik.</i>',
    en: 'You can submit your proof in two ways:\n1. <b>Type or paste Transaction Hash (TXID):</b> Copy the TXID from your wallet and send it here.\n2. <b>Send Screenshot / Photo:</b> Upload receipt screenshot directly into this chat.\n\n<i>Admin will verify your transfer and release credentials immediately.</i>',
    zh: '您可以通过以下两种方式提交凭证：\n1. <b>输入或粘贴交易哈希 (TXID)：</b> 复制钱包中的交易哈希发送到此对话。\n2. <b>发送转账截图：</b> 直接将付款凭证图片发送到此聊天窗口。\n\n<i>管理员核验无误后，系统将自动送达账号。</i>',
    ru: 'Вы можете отправить подтверждение двумя способами:\n1. <b>Отправьте хеш транзакции (TXID):</b> Скопируйте хеш из кошелька и отправьте в этот чат.\n2. <b>Отправьте фото или скриншот чека:</b> Загрузите скриншот перевода прямо сюда.\n\n<i>Администратор проверит поступление, и аккаунт будет выдан автоматически.</i>',
    es: 'Puede enviar su comprobante de dos formas:\n1. <b>Escriba o pegue el hash de transacción (TXID):</b> Cópielo de su billetera y envíelo aquí.\n2. <b>Envíe foto o captura de pantalla:</b> Suba la imagen directamente a este chat.\n\n<i>El administrador verificará el pago y la cuenta se enviará automáticamente.</i>',
    it: 'Puoi inviare la ricevuta in due modi:\n1. <b>Incolla l\'Hash di Transazione (TXID):</b> Copialo dal tuo wallet e invialo qui.\n2. <b>Invia Screenshot / Foto:</b> Carica lo screenshot direttamente in questa chat.\n\n<i>L\'amministratore verificherà e le credenziali saranno inviate subito.</i>',
    de: 'Sie können Ihren Nachweis auf zwei Arten senden:\n1. <b>Transaktions-Hash (TXID) senden:</b> Kopieren Sie den Hash aus Ihrer Wallet hierher.\n2. <b>Screenshot / Belegfoto senden:</b> Laden Sie das Bild direkt in diesen Chat hoch.\n\n<i>Nach Prüfung werden die Zugangsdaten automatisch zugestellt.</i>',
    fr: 'Vous pouvez envoyer votre preuve de deux manières :\n1. <b>Coller le Hash de Transaction (TXID) :</b> Copiez-le depuis votre portefeuille et envoyez-le ici.\n2. <b>Envoyer une capture d\'écran :</b> Téléversez la photo directement dans ce chat.\n\n<i>L\'administrateur vérifiera et les identifiants seront envoyés instantanément.</i>',
    pt: 'Você pode enviar seu comprovante de duas formas:\n1. <b>Cole a Hash da Transação (TXID):</b> Copie da sua carteira e envie aqui.\n2. <b>Envie Foto ou Print do Comprovante:</b> Envie a imagem diretamente no chat.\n\n<i>O administrador verificará e as credenciais serão entregues automaticamente.</i>',
    hi: 'आप दो तरीकों से प्रमाण भेज सकते हैं:\n1. <b>ट्रांजेक्शन हैश (TXID) पेस्ट करें:</b> अपने वॉलेट से हैश कॉपी करके यहां भेजें।\n2. <b>रसीद का स्क्रीनशॉट भेजें:</b> सीधे इस चैट में फोटो अपलोड करें।\n\n<i>सत्यापन के तुरंत बाद खाता क्रेडेंशियल प्रदान किए जाएंगे।</i>',
    uz: 'To\'lov tasdig\'ini ikki xil usulda yuborishingiz mumkin:\n1. <b>Tranzaksiya xeshini (TXID) yozing:</b> Hamyoningizdagi xeshni nusxalab bu yerga yuboring.\n2. <b>Chek skrinshotini yuboring:</b> To\'lov rasmini to\'g\'ridan-to\'g\'ri chatga yuklang.\n\n<i>Admin tekshirgach, hisob bir zumda yuboriladi.</i>',
    ar: 'يمكنك إرسال إثبات الدفع بطريقتين:\n1. <b>كتابة أو لصق رمز المعاملة (TXID):</b> انسخ الرمز من محفظتك وأرسله هنا.\n2. <b>إرسال صورة أو لقطة شاشة للإيصال:</b> قم برفع الصورة مباشرة في هذه المحادثة.\n\n<i>سيقوم المسؤول بالتحقق وتسليمك بيانات الحساب فورًا.</i>',
    ja: '以下のいずれかの方法で送金証明を提出できます：\n1. <b>トランザクションハッシュ (TXID) を送信：</b> ウォレットからハッシュをコピーしてここに送信。\n2. <b>スクリーンショットを送信：</b> 送金証明の画像を直接このチャットにアップロード。\n\n<i>確認完了後、アカウント情報が自動配信されます。</i>',
    tr: 'Ödeme kanıtınızı iki şekilde gönderebilirsiniz:\n1. <b>İşlem Kodunu (TXID) Yapıştırın:</b> Cüzdanınızdaki kodu kopyalayıp buraya gönderin.\n2. <b>Ekran Görüntüsü / Dekont Gönderin:</b> Görseli doğrudan bu sohbete yükleyin.\n\n<i>Yönetici onayından sonra hesap bilgileri anında otomatik teslim edilecektir.</i>'
  },
  payment_verified_toast: {
    id: '✅ Pembayaran terverifikasi!',
    ms: '✅ Bayaran disahkan!',
    en: '✅ Payment verified!',
    zh: '✅ 付款验证成功！',
    ru: '✅ Оплата подтверждена!',
    es: '✅ ¡Pago verificado!',
    it: '✅ Pagamento verificato!',
    de: '✅ Zahlung bestätigt!',
    fr: '✅ Paiement vérifié !',
    pt: '✅ Pagamento verificado!',
    hi: '✅ भुगतान सत्यापित!',
    uz: '✅ To\'lov tasdiqlandi!',
    ar: '✅ تم التحقق من الدفع!',
    ja: '✅ 決済が確認されました！',
    tr: '✅ Ödeme doğrulandı!'
  },
  lbl_proof_submitted: {
    id: 'Bukti Terkirim',
    ms: 'Bukti Dihantar',
    en: 'Proof Submitted',
    zh: '已提交凭证',
    ru: 'Отправлен чек',
    es: 'Comprobante Enviado',
    it: 'Ricevuta Inviata',
    de: 'Eingereichter Beleg',
    fr: 'Preuve Soumise',
    pt: 'Comprovante Enviado',
    hi: 'प्रस्तुत प्रमाण',
    uz: 'Yuborilgan chek',
    ar: 'الإثبات المرسل',
    ja: '提出済み証明',
    tr: 'Gönderilen Kanıt'
  },
  check_again_later_tip: {
    id: 'Silakan cek kembali setelah transfer Anda selesai diproses jaringan.',
    ms: 'Sila semak semula selepas pemindahan selesai diproses rangkaian.',
    en: 'Please check again once your transfer is fully processed by the network.',
    zh: '待区块链网络完全处理您的转账后，请再次点击检查。',
    ru: 'Пожалуйста, проверьте снова после того, как сеть обработает транзакцию.',
    es: 'Vuelva a comprobar una vez que la red procese su transferencia.',
    it: 'Ricontrolla non appena il trasferimento sarà confermato dalla rete.',
    de: 'Bitte prüfen Sie erneut, sobald die Überweisung im Netzwerk verarbeitet wurde.',
    fr: 'Veuillez vérifier à nouveau une fois le transfert traité par le réseau.',
    pt: 'Verifique novamente assim que a transferência for confirmada na rede.',
    hi: 'नेटवर्क द्वारा ट्रांसफर पूरा होने के बाद कृपया दोबारा जांचें।',
    uz: 'Iltimos, tarmoqda tranzaksiya yakunlangach qayta tekshiring.',
    ar: 'يرجى إعادة المحاولة بمجرد اكتمال معالجة التحويل على الشبكة.',
    ja: 'ネットワークでの送金処理完了後に再度ご確認ください。',
    tr: 'Transferiniz ağ tarafından tamamen işlendikten sonra lütfen tekrar kontrol edin.'
  },
  order_cancelled_toast: {
    id: 'Pesanan dibatalkan.',
    ms: 'Pesanan dibatalkan.',
    en: 'Order cancelled.',
    zh: '订单已取消。',
    ru: 'Заказ отменен.',
    es: 'Pedido cancelado.',
    it: 'Ordine annullato.',
    de: 'Bestellung storniert.',
    fr: 'Commande annulée.',
    pt: 'Pedido cancelado.',
    hi: 'ऑर्डर रद्द कर दिया गया।',
    uz: 'Buyurtma bekor qilindi.',
    ar: 'تم إلغاء الطلب.',
    ja: '注文がキャンセルされました。',
    tr: 'Sipariş iptal edildi.'
  },
  order_cancelled_msg: {
    id: '❌ <b>Pesanan telah dibatalkan & otomatis dihapus dari sistem.</b>',
    ms: '❌ <b>Pesanan telah dibatalkan & dipadamkan dari sistem.</b>',
    en: '❌ <b>Order has been cancelled & removed from the system.</b>',
    zh: '❌ <b>订单已取消并已从系统中移除。</b>',
    ru: '❌ <b>Заказ отменен и автоматически удален из базы данных.</b>',
    es: '❌ <b>El pedido ha sido cancelado y eliminado del sistema.</b>',
    it: '❌ <b>L\'ordine è stato annullato ed eliminato dal sistema.</b>',
    de: '❌ <b>Die Bestellung wurde storniert und aus dem System entfernt.</b>',
    fr: '❌ <b>La commande a été annulée et supprimée du système.</b>',
    pt: '❌ <b>O pedido foi cancelado e removido do sistema.</b>',
    hi: '❌ <b>ऑर्डर रद्द कर दिया गया है और सिस्टम से हटा दिया गया है।</b>',
    uz: '❌ <b>Buyurtma bekor qilindi va tizimdan o\'chirildi.</b>',
    ar: '❌ <b>تم إلغاء الطلب وحذفه تلقائيًا من النظام.</b>',
    ja: '❌ <b>注文はキャンセルされ、システムから削除されました。</b>',
    tr: '❌ <b>Sipariş iptal edildi ve sistemden silindi.</b>'
  },
  no_orders_yet: {
    id: '📦 <i>Anda belum memiliki riwayat pesanan.</i>',
    ms: '📦 <i>Anda belum mempunyai sejarah pesanan.</i>',
    en: '📦 <i>You do not have any order history yet.</i>',
    zh: '📦 <i>您目前还没有任何订单记录。</i>',
    ru: '📦 <i>У вас пока нет истории заказов.</i>',
    es: '📦 <i>Aún no tiene historial de pedidos.</i>',
    it: '📦 <i>Non hai ancora una cronologia ordini.</i>',
    de: '📦 <i>Sie haben noch keine Bestellhistorie.</i>',
    fr: '📦 <i>Vous n\'avez aucun historique de commande pour le moment.</i>',
    pt: '📦 <i>Você ainda não possui histórico de pedidos.</i>',
    hi: '📦 <i>आपके पास अभी तक कोई ऑर्डर इतिहास नहीं है।</i>',
    uz: '📦 <i>Sizda hali buyurtmalar tarixi mavjud emas.</i>',
    ar: '📦 <i>ليس لديك أي سجل طلبات حتى الآن.</i>',
    ja: '📦 <i>注文履歴はまだありません。</i>',
    tr: '📦 <i>Henüz sipariş geçmişiniz bulunmamaktadır.</i>'
  },
  recent_orders_list: {
    id: 'Daftar Pesanan Terakhir',
    ms: 'Senarai Pesanan Terakhir',
    en: 'Recent Orders List',
    zh: '近期订单列表',
    ru: 'Список последних заказов',
    es: 'Lista de Pedidos Recientes',
    it: 'Elenco Ordini Recenti',
    de: 'Aktuelle Bestellungen',
    fr: 'Liste des commandes récentes',
    pt: 'Lista de Pedidos Recentes',
    hi: 'हालिया ऑर्डर सूची',
    uz: 'So\'nggi buyurtmalar ro\'yxati',
    ar: 'قائمة الطلبات الأخيرة',
    ja: '最近の注文一覧',
    tr: 'Son Siparişler Listesi'
  },
  receipt_official_header: {
    id: 'STRUK BUKTI PEMBAYARAN BERHASIL',
    ms: 'RESIT BUKTI BAYARAN BERJAYA',
    en: 'OFFICIAL PAYMENT RECEIPT',
    zh: '官方付款成功收据',
    ru: 'ОФИЦИАЛЬНЫЙ ЧЕК ОБ ОПЛАТЕ',
    es: 'COMPROBANTE OFICIAL DE PAGO',
    it: 'RICEVUTA DI PAGAMENTO UFFICIALE',
    de: 'OFFIZIELLER ZAHLUNGSBELEG',
    fr: 'REÇU DE PAIEMENT OFFICIEL',
    pt: 'RECIBO OFICIAL DE PAGAMENTO',
    hi: 'आधिकारिक भुगतान रसीद',
    uz: 'RASMIY TO\'LOV CHEKI',
    ar: 'إيصال الدفع الرسمي',
    ja: '公式決済完了レシート',
    tr: 'RESMİ ÖDEME MAKBUZU'
  },
  lbl_invoice_no: {
    id: 'Nomor Invoice',
    ms: 'Nombor Invois',
    en: 'Invoice Number',
    zh: '发票单号',
    ru: 'Номер счета',
    es: 'Número de Factura',
    it: 'Numero Fattura',
    de: 'Rechnungsnummer',
    fr: 'Numéro de Facture',
    pt: 'Número da Fatura',
    hi: 'चालान संख्या',
    uz: 'Hisob-faktura raqami',
    ar: 'رقم الفاتورة',
    ja: '請求書番号',
    tr: 'Fatura Numarası'
  },
  lbl_total_paid: {
    id: 'Total Dibayar',
    ms: 'Jumlah Dibayar',
    en: 'Total Paid',
    zh: '已付总额',
    ru: 'Всего оплачено',
    es: 'Total Pagado',
    it: 'Totale Pagato',
    de: 'Gesamt gezahlt',
    fr: 'Total Payé',
    pt: 'Total Pago',
    hi: 'कुल भुगतान किया',
    uz: 'Jami to\'langan',
    ar: 'المبلغ المدفوع',
    ja: 'お支払い合計',
    tr: 'Ödenen Toplam'
  },
  lbl_payment_method: {
    id: 'Metode Pembayaran',
    ms: 'Kaedah Bayaran',
    en: 'Payment Method',
    zh: '付款方式',
    ru: 'Способ оплаты',
    es: 'Método de Pago',
    it: 'Metodo di Pagamento',
    de: 'Zahlungsmethode',
    fr: 'Moyen de Paiement',
    pt: 'Forma de Pagamento',
    hi: 'भुगतान का तरीका',
    uz: 'To\'lov usuli',
    ar: 'طريقة الدفع',
    ja: 'お支払い方法',
    tr: 'Ödeme Yöntemi'
  },
  lbl_destination_address: {
    id: 'Alamat Dompet Tujuan',
    ms: 'Alamat Dompet Tujuan',
    en: 'Destination Wallet Address',
    zh: '目标收款地址',
    ru: 'Адрес кошелька получателя',
    es: 'Dirección de Billetera Destino',
    it: 'Indirizzo Wallet Destinazione',
    de: 'Empfänger-Wallet-Adresse',
    fr: 'Adresse Portefeuille Récepteur',
    pt: 'Endereço da Carteira de Destino',
    hi: 'प्राप्तकर्ता वॉलेट पता',
    uz: 'Qabul qiluvchi hamyon manzili',
    ar: 'عنوان المحفظة المستلمة',
    ja: '受取ウォレットアドレス',
    tr: 'Alıcı Cüzdan Adresi'
  },
  lbl_proof_txid: {
    id: 'Bukti Transfer / TXID',
    ms: 'Bukti Pindahan / TXID',
    en: 'Transfer Proof / TXID',
    zh: '转账凭据 / TXID',
    ru: 'Чек / TXID транзакции',
    es: 'Comprobante / TXID',
    it: 'Ricevuta / TXID',
    de: 'Überweisungsbeleg / TXID',
    fr: 'Preuve / TXID',
    pt: 'Comprovante / TXID',
    hi: 'ट्रांसफर प्रमाण / TXID',
    uz: 'O\'tkazma cheki / TXID',
    ar: 'إثبات التحويل / TXID',
    ja: '送金証明 / TXID',
    tr: 'Transfer Kanıtı / TXID'
  },
  officially_verified: {
    id: 'Telah Diverifikasi Resmi',
    ms: 'Telah Disahkan Rasmi',
    en: 'Officially Verified',
    zh: '已官方核实',
    ru: 'Официально подтверждено',
    es: 'Verificado Oficialmente',
    it: 'Verificato Ufficialmente',
    de: 'Offiziell verifiziert',
    fr: 'Vérifié Officiellement',
    pt: 'Verificado Oficialmente',
    hi: 'आधिकारिक तौर पर सत्यापित',
    uz: 'Rasmiy tasdiqlangan',
    ar: 'تم التحقق رسميًا',
    ja: '公式承認済み',
    tr: 'Resmi Olarak Doğrulandı'
  },
  lbl_tx_time: {
    id: 'Waktu Transaksi',
    ms: 'Masa Transaksi',
    en: 'Transaction Time',
    zh: '交易时间',
    ru: 'Время транзакции',
    es: 'Hora de Transacción',
    it: 'Data e Ora',
    de: 'Transaktionszeit',
    fr: 'Date et Heure',
    pt: 'Hora da Transação',
    hi: 'लेन-देन समय',
    uz: 'Bitim vaqti',
    ar: 'وقت المعاملة',
    ja: '取引日時',
    tr: 'İşlem Zamanı'
  },
  lbl_status: {
    id: 'Status',
    ms: 'Status',
    en: 'Status',
    zh: '状态',
    ru: 'Статус',
    es: 'Estado',
    it: 'Stato',
    de: 'Status',
    fr: 'Statut',
    pt: 'Status',
    hi: 'स्थिति',
    uz: 'Holat',
    ar: 'الحالة',
    ja: 'ステータス',
    tr: 'Durum'
  },
  credentials_delivered_header: {
    id: 'DATA KREDENSIAL AKUN TERKIRIM:',
    ms: 'DATA KREDENSIAL AKAUN DIHANTAR:',
    en: 'DELIVERED ACCOUNT CREDENTIALS:',
    zh: '已发放账号凭据信息：',
    ru: 'ВЫДАННЫЕ ДАННЫЕ АККАУНТА:',
    es: 'CREDENCIALES DE LA CUENTA ENTREGADA:',
    it: 'CREDENZIALI ACCOUNT CONSEGNATE:',
    de: 'GELIEFERTE KONTO-ZUGANGSDATEN:',
    fr: 'IDENTIFIANTS DU COMPTE LIVRÉ :',
    pt: 'CREDENCIALES DA CONTA ENTREGUE:',
    hi: 'वितरित खाता क्रेडेंशियल्स:',
    uz: 'YUBORILGAN HISOB MA\'LUMOTLARI:',
    ar: 'بيانات الحساب المسلَّمة:',
    ja: '配信されたアカウント情報：',
    tr: 'TESLİM EDİLEN HESAP BİLGİLERİ:'
  },
  receipt_guarantee_footer: {
    id: '🔒 <i>Struk ini adalah bukti transaksi yang sah. Kredensial akun dijamin bergaransi penuh 30 hari.</i>',
    ms: '🔒 <i>Resit ini adalah bukti transaksi yang sah. Kredensial akaun dilindungi jaminan penuh 30 hari.</i>',
    en: '🔒 <i>This receipt is proof of a valid transaction. Credentials are backed by our full 30-day warranty.</i>',
    zh: '🔒 <i>本收据为有效交易凭证。所有账号均享 30 天无忧质保。</i>',
    ru: '🔒 <i>Этот чек подтверждает законную сделку. На все данные действует 30-дневная гарантия.</i>',
    es: '🔒 <i>Este recibo es prueba de una transacción válida. Cuenta con garantía completa de 30 días.</i>',
    it: '🔒 <i>Questa ricevuta attesta una transazione valida con garanzia completa di 30 giorni.</i>',
    de: '🔒 <i>Dieser Beleg ist ein Nachweis für eine gültige Transaktion mit 30 Tagen Garantie.</i>',
    fr: '🔒 <i>Ce reçu est la preuve d\'une transaction valide avec garantie de 30 jours.</i>',
    pt: '🔒 <i>Este recibo é comprovante de transação válida com garantia total de 30 dias.</i>',
    hi: '🔒 <i>यह रसीद एक वैध लेन-देन का प्रमाण है। 30 दिनों की पूर्ण वारंटी शामिल है।</i>',
    uz: '🔒 <i>Ushbu chek haqiqiy bitim isbotidir. Hisobga 30 kunlik to\'liq kafolat beriladi.</i>',
    ar: '🔒 <i>هذا الإيصال هو إثبات لمعاملة رسمية معتمدة مع ضمان شامل لمدة 30 يومًا.</i>',
    ja: '🔒 <i>このレシートは正規の取引証明です。30日間の全額・交換保証が付帯しています。</i>',
    tr: '🔒 <i>Bu makbuz geçerli bir işlemin kanıtıdır. Hesap 30 günlük tam garanti kapsamındadır.</i>'
  },
  txid_saved_title: {
    id: 'BUKTI TRANSAKSI / TXID TELAH TERSIMPAN!',
    ms: 'BUKTI TRANSAKSI / TXID TELAH DISIMPAN!',
    en: 'TRANSACTION PROOF / TXID SAVED!',
    zh: '转账凭据 / TXID 已成功保存！',
    ru: 'ЧЕК / TXID УСПЕШНО СОХРАНЕН!',
    es: '¡COMPROBANTE / TXID GUARDADO CON ÉXITO!',
    it: 'RICEVUTA / TXID SALVATO CON SUCCESSO!',
    de: 'TRANSAKTIONSBELEG / TXID ERFOLGREICH GESPEICHERT!',
    fr: 'PREUVE / TXID ENREGISTRÉ AVEC SUCCÈS !',
    pt: 'COMPROVANTE / TXID SALVO COM SUCESSO!',
    hi: 'लेन-देन प्रमाण / TXID सफलतापूर्वक सहेजा गया!',
    uz: 'TRANZAKSIYA CHEKI / TXID MUVAFFAQIYATLI SAQLANDI!',
    ar: 'تم حفظ إثبات المعاملة / TXID بنجاح!',
    ja: '送金証明 / TXID が保存されました！',
    tr: 'İŞLEM KANITI / TXID BAŞARIYLA KAYDEDİLDİ!'
  },
  txid_saved_desc: {
    id: 'Admin akan memverifikasi di Web Admin Panel. Akun digital Anda akan langsung terkirim begitu pembayaran disetujui.',
    ms: 'Admin akan mengesahkan di Admin Panel. Akaun digital anda akan terus dihantar setelah bayaran diluluskan.',
    en: 'Admin will verify the transaction. Your digital account will be delivered immediately upon approval.',
    zh: '管理员将在管理面板中进行核验。付款审核通过后，数字账号将第一时间自动发放。',
    ru: 'Администратор проверит данные. Цифровой товар будет отправлен сразу после одобрения.',
    es: 'El administrador verificará el pago en el panel. Su cuenta se enviará tan pronto como sea aprobado.',
    it: 'L\'amministratore verificherà nel pannello. Il tuo account sarà consegnato non appena approvato.',
    de: 'Der Administrator wird die Zahlung prüfen. Ihr digitales Konto wird sofort nach Freigabe zugestellt.',
    fr: 'L\'administrateur vérifiera la transaction. Votre compte sera livré dès confirmation.',
    pt: 'O administrador verificará no painel. Sua conta será enviada assim que o pagamento for aprovado.',
    hi: 'व्यवस्थापक भुगतान की पुष्टि करेंगे। स्वीकृति के बाद आपका डिजिटल खाता तुरंत भेज दिया जाएगा।',
    uz: 'Admin to\'lovni tekshiradi. Tasdiqlanishi bilan raqamli hisobingiz darhol yuboriladi.',
    ar: 'سيقوم المسؤول بالتحقق من الدفع. سيتم تسليم حسابك الرقمي فور الموافقة.',
    ja: '管理者が入金を確認します。承認され次第、デジタルアカウントが直ちに配信されます。',
    tr: 'Yönetici işlemi doğrulayacaktır. Onaylandıktan sonra dijital hesabınız anında teslim edilecektir.'
  },
  photo_receipt_saved_title: {
    id: 'FOTO BUKTI PEMBAYARAN TELAH DITERIMA!',
    ms: 'FOTO BUKTI BAYARAN TELAH DITERIMA!',
    en: 'PAYMENT PROOF PHOTO RECEIVED!',
    zh: '付款截图凭证已收到！',
    ru: 'ФОТО ЧЕКА ОБ ОПЛАТЕ ПОЛУЧЕНО!',
    es: '¡FOTO DEL COMPROBANTE RECIBIDA!',
    it: 'FOTO DELLA RICEVUTA RICEVUTA!',
    de: 'BELEGFOTO ERFOLGREICH EMPFANGEN!',
    fr: 'PHOTO DU REÇU DE PAIEMENT REÇUE !',
    pt: 'FOTO DO COMPROVANTE RECEBIDA!',
    hi: 'भुगतान रसीद की फोटो प्राप्त हुई!',
    uz: 'TO\'LOV CHEKI RASMI QABUL QILINDI!',
    ar: 'تم استلام صورة إثبات الدفع بنجاح!',
    ja: '送金証明の写真を受領しました！',
    tr: 'ÖDEME KANITI FOTOĞRAFI ALINDI!'
  },
  photo_receipt_saved_desc: {
    id: 'Admin toko akan memeriksa gambar bukti asli Anda. Kredensial akun digital akan otomatis dikirim setelah diverifikasi.',
    ms: 'Admin akan menyemak gambar bukti anda. Kredensial akaun akan dihantar automatik selepas disahkan.',
    en: 'Store admin will examine your receipt screenshot. Account credentials will be automatically sent after verification.',
    zh: '商城管理员将查看您的真实付款截图。账号凭据将在核验通过后自动送达。',
    ru: 'Администратор проверит снимок чека. Данные аккаунта будут отправлены автоматически после подтверждения.',
    es: 'El administrador revisará la captura. Las credenciales se enviarán automáticamente tras la aprobación.',
    it: 'L\'amministratore esaminerà la ricevuta. Le credenziali saranno inviate automaticamente dopo la verifica.',
    de: 'Der Store-Admin wird den Screenshot prüfen. Die Zugangsdaten werden nach Verifizierung versendet.',
    fr: 'L\'administrateur examinera la capture de reçu. Les identifiants seront envoyés après vérification.',
    pt: 'O administrador examinará o comprovante. As credenciais serão enviadas automaticamente após a verificação.',
    hi: 'एडमिन आपकी रसीद का स्क्रीनशॉट जांचेंगे। सत्यापन के बाद खाता क्रेडेंशियल स्वचालित रूप से भेजे जाएंगे।',
    uz: 'Do\'kon admini chek rasmini tekshiradi. Tasdiqlangach hisob ma\'lumotlari avtomatik yuboriladi.',
    ar: 'سيفحص المسؤول صورة الإيصال الخاصة بك. سيتم إرسال بيانات الحساب تلقائيًا بعد التحقق.',
    ja: '管理者が受領スクリーンショットを確認します。確認完了後、アカウント情報が自動配信されます。',
    tr: 'Yönetici dekont görüntüsünü inceleyecektir. Doğrulandıktan sonra hesap bilgileri otomatik gönderilecektir.'
  },
  delivery_direct_header: {
    id: '🎉 PEMBAYARAN DIVERIFIKASI & AKUN TERKIRIM!',
    ms: '🎉 BAYARAN DISAHKAN & AKAUN DIHANTAR!',
    en: '🎉 PAYMENT VERIFIED & ACCOUNT DELIVERED!',
    zh: '🎉 付款已核实，账号已送达！',
    ru: '🎉 ОПЛАТА ПОДТВЕРЖДЕНА! ДАННЫЕ ВАШЕГО АККАУНТА:',
    es: '🎉 ¡PAGO VERIFICADO Y CUENTA ENTREGADA!',
    it: '🎉 PAGAMENTO VERIFICATO E ACCOUNT CONSEGNATO!',
    de: '🎉 ZAHLUNG VERIFIZIERT & KONTO GELIEFERT!',
    fr: '🎉 PAIEMENT VÉRIFIÉ ET COMPTE LIVRÉ !',
    pt: '🎉 PAGAMENTO VERIFICADO E CONTA ENTREGUE!',
    hi: '🎉 भुगतान सत्यापित एवं खाता वितरित!',
    uz: '🎉 TO\'LOV TASDIQLANDI VA HISOB YUBORILDI!',
    ar: '🎉 تم تأكيد الدفع وإرسال بيانات الحساب!',
    ja: '🎉 決済確認完了＆アカウント配信！',
    tr: '🎉 ÖDEME DOĞRULANDI VE HESAP TESLİM EDİLDİ!'
  }
};

/**
 * Pre-translated default welcome messages for all 10 languages
 */
export const DEFAULT_WELCOME_TEXTS = {
  id: `🤖 <b>SELAMAT DATANG DI STORE AKUN CHATGPT & PRODUK DIGITAL!</b>\n\n⚡ <i>Semua transaksi instan, otomatis & bergaransi penuh.</i>\n💎 <b>Layanan Kami:</b>\n• Akun ChatGPT Plus (Private & Shared)\n• Claude Pro & OpenAI API Credits\n• VPN & Berbagai Akun Digital Siap Pakai\n\nSilakan pilih menu di bawah ini:`,
  ms: `🤖 <b>SELAMAT DATANG KE STORE AKAUN CHATGPT & PRODUK DIGITAL!</b>\n\n⚡ <i>Semua transaksi adalah pantas, automatik & berjaminan penuh.</i>\n💎 <b>Perkhidmatan Kami:</b>\n• Akaun ChatGPT Plus (Peribadi & Dikongsi)\n• Claude Pro & Kredit OpenAI API\n• VPN & Akaun Digital Sedia Digunakan\n\nSila pilih menu di bawah:`,
  zh: `🤖 <b>欢迎来到 ChatGPT 账号与数字产品官方商城！</b>\n\n⚡ <i>全自动即时发货，安全加密支付，全天候质保服务。</i>\n💎 <b>精选产品：</b>\n• ChatGPT Plus 独享与共享账号\n• Claude Pro 与 OpenAI API 额度\n• 高速节点 VPN 与各类专业开发工具\n\n请在下方选择所需功能：`,
  ru: `🤖 <b>ДОБРО ПОЖАЛОВАТЬ В МАГАЗИН АККАУНТОВ CHATGPT И ЦИФРОВЫХ ТОВАРОВ!</b>\n\n⚡ <i>Мгновенная автоматическая выдача после оплаты. Полная гарантия!</i>\n💎 <b>В наличии:</b>\n• Аккаунты ChatGPT Plus (Личные и общие)\n• Claude Pro и баланс OpenAI API\n• VPN и полезные цифровые подписки\n\nВыберите интересующий раздел меню:`,
  it: `🤖 <b>BENVENUTO NELLO STORE DI ACCOUNT CHATGPT E PRODOTTI DIGITALI!</b>\n\n⚡ <i>Consegna automatica immediata, pagamenti crypto sicuri e garanzia completa.</i>\n💎 <b>Prodotti Disponibili:</b>\n• Account ChatGPT Plus (Privati e Condivisi)\n• Claude Pro e Crediti OpenAI API\n• VPN e Servizi Digitali Premium\n\nSeleziona una voce dal menu in basso:`,
  es: `🤖 <b>¡BIENVENIDO A LA TIENDA DE CUENTAS CHATGPT Y PRODUCTOS DIGITALES!</b>\n\n⚡ <i>Entrega instantánea y automática tras la confirmación del pago. Garantía total.</i>\n💎 <b>Disponibles:</b>\n• Cuentas ChatGPT Plus (Privadas y Compartidas)\n• Claude Pro y Créditos OpenAI API\n• VPN y Herramientas Digitales Premium\n\nSeleccione una opción en el menú inferior:`,
  hi: `🤖 <b>ChatGPT अकाउंट्स एवं डिजिटल प्रोडक्ट्स स्टोर में आपका स्वागत है!</b>\n\n⚡ <i>तत्काल स्वचालित डिलीवरी, सुरक्षित क्रिप्टो भुगतान और पूर्ण वारंटी।</i>\n💎 <b>उपलब्ध सेवाएं:</b>\n• ChatGPT Plus खाते (निजी एवं साझा)\n• Claude Pro और OpenAI API क्रेडिट्स\n• प्रीमियम VPN और डिजिटल टूल्स\n\nकृपया नीचे दिए गए मेनू से विकल्प चुनें:`,
  uz: `🤖 <b>CHATGPT HISOB-KITOBLARI VA RAQAMLI MAHSULOTLAR DO'KONIGA XUSH KELIBSIZ!</b>\n\n⚡ <i>To'lovdan so'ng bir zumda avtomatik yetkazib berish. To'liq kafolat!</i>\n💎 <b>Mavjud:</b>\n• ChatGPT Plus hisoblari (Shaxsiy va Umumiy)\n• Claude Pro va OpenAI API kreditlari\n• VPN va Premium raqamli xizmatlar\n\nQuyidagi menyudan kerakli bo'limni tanlang:`,
  ar: `🤖 <b>مرحبًا بك في متجر حسابات ChatGPT والمنتجات الرقمية!</b>\n\n⚡ <i>تسليم فوري وتلقائي بعد تأكيد الدفع. ضمان شامل وموثوق.</i>\n💎 <b>المنتجات المتوفرة:</b>\n• حسابات ChatGPT Plus (خاصة ومشارَكة)\n• Claude Pro ورصيد OpenAI API\n• شبكات VPN وأدوات رقمية متميزة\n\nيرجى اختيار أحد الخيارات من القائمة أدناه:`,
  de: `🤖 <b>WILLKOMMEN IM CHATGPT-KONTEN & DIGITALWAREN-STORE!</b>\n\n⚡ <i>Sofortige automatische Zustellung nach Zahlungseingang. Volle Garantie!</i>\n💎 <b>Unser Sortiment:</b>\n• ChatGPT Plus Accounts (Privat & Shared)\n• Claude Pro & OpenAI API Guthaben\n• VPNs & Premium-Entwicklertools\n\nBitte wählen Sie unten eine Option:`,
  fr: `🤖 <b>BIENVENUE DANS LA BOUTIQUE DE COMPTES CHATGPT ET PRODUITS DIGITAUX !</b>\n\n⚡ <i>Livraison instantanée et automatique dès vérification du paiement. Garantie complète !</i>\n💎 <b>Nos Produits :</b>\n• Comptes ChatGPT Plus (Privés et Partagés)\n• Claude Pro et Crédits API OpenAI\n• VPN et Outils Développeur Premium\n\nVeuillez choisir une option ci-dessous :`,
  pt: `🤖 <b>BEM-VINDO À LOJA DE CONTAS CHATGPT E PRODUTOS DIGITAIS!</b>\n\n⚡ <i>Entrega instantânea e automática após confirmação do pagamento. Garantia total!</i>\n💎 <b>Nossos Produtos:</b>\n• Contas ChatGPT Plus (Privadas e Compartilhadas)\n• Claude Pro e Créditos de API OpenAI\n• VPNs e Ferramentas Digitais Premium\n\nPor favor, selecione uma opção no menu abaixo:`,
  ja: `🤖 <b>ChatGPTアカウント＆デジタル商品ストアへようこそ！</b>\n\n⚡ <i>決済確認後、即時自動配信。30日間の安心保証付き。</i>\n💎 <b>取り扱い商品：</b>\n• ChatGPT Plus アカウント（個別・共有）\n• Claude Pro ＆ OpenAI API クレジット\n• 高速VPN ＆ プレミアム開発ツール\n\n下のメニューからお選びください：`,
  tr: `🤖 <b>CHATGPT HESAPLARI VE DİJİTAL ÜRÜNLER MAĞAZASINA HOŞ GELDİNİZ!</b>\n\n⚡ <i>Ödeme onayından sonra anında otomatik teslimat. Tam garanti!</i>\n💎 <b>Hizmetlerimiz:</b>\n• ChatGPT Plus Hesapları (Özel ve Ortak)\n• Claude Pro ve OpenAI API Kredileri\n• Hızlı VPN ve Dijital Araçlar\n\nLütfen aşağıdaki menüden bir seçenek belirleyin:`,
  en: `🤖 <b>WELCOME TO THE CHATGPT & DIGITAL GOODS STORE!</b>\n\n⚡ <i>Instant automated delivery upon verified payment. Full 30-day warranty.</i>\n💎 <b>Our Products:</b>\n• ChatGPT Plus Accounts (Private & Shared)\n• Claude Pro & OpenAI API Credits\n• High-Speed VPNs & Premium Developer Tools\n\nPlease select an option from the menu below:`
};

/**
 * Pre-translated default terms & policies for all 15 languages
 */
export const DEFAULT_TERMS_TEXTS = {
  id: `📜 <b>SYARAT, KETENTUAN & KEBIJAKAN GARANSI</b>\n\n1. Semua akun dicek kesehatannya sebelum dikirim ke pembeli.\n2. Akun HANYA dikirimkan jika pembayaran blockchain atau persetujuan admin telah valid dan sah.\n3. Garansi penggantian (replace) berlaku 30 hari jika akun terkena ban bukan karena pelanggaran berat pengguna.\n4. Harap simpan cookie sesi dan kredensial di tempat aman.`,
  ms: `📜 <b>TERMA, SYARAT & POLISI JAMINAN</b>\n\n1. Semua akaun diperiksa status kesihatannya sebelum dihantar kepada pembeli.\n2. Akaun HANYA akan dihantar jika bayaran blockchain atau pengesahan admin sah.\n3. Jaminan penggantian (replace) sah selama 30 hari sekiranya akaun terkunci tanpa salah guna pengguna.\n4. Sila simpan kuki sesi dan maklumat laluan dengan selamat.`,
  zh: `📜 <b>条款、规则与售后质保政策</b>\n\n1. 所有账号在交付买家前均已通过系统健康度检查。\n2. 账号【仅在】区块链交易确认或管理员审核通过后自动发放。\n3. 提供 30 天质保服务，若非人为滥用导致的封禁支持免费补发。\n4. 请妥善保管您的 Session Cookie 与登录信息，切勿向第三方透露。`,
  ru: `📜 <b>УСЛОВИЯ ОБСЛУЖИВАНИЯ И ГАРАНТИЙНАЯ ПОЛИТИКА</b>\n\n1. Все аккаунты проверяются на работоспособность перед отправкой.\n2. Аккаунт выдается ТОЛЬКО после фактического подтверждения оплаты в блокчейне или одобрения администратором.\n3. Действует 30-дневная гарантия на замену при возникновении проблем с доступом не по вине покупателя.\n4. Храните сессионные куки и пароли в надежном месте.`,
  it: `📜 <b>TERMINI DI SERVIZIO E POLITICA DI GARANZIA</b>\n\n1. Tutti gli account vengono verificati prima dell'invio all'acquirente.\n2. L'account viene consegnato SOLO dopo la conferma effettiva del pagamento blockchain o l'approvazione dell'amministratore.\n3. Garanzia di sostituzione attiva per 30 giorni.\n4. Conserva le credenziali e i cookie di sessione con la massima cura.`,
  es: `📜 <b>TÉRMINOS DE SERVICIO Y POLÍTICA DE GARANTÍA</b>\n\n1. Todas las cuentas se verifican antes de ser enviadas al comprador.\n2. La cuenta SOLO se entrega tras la confirmación efectiva del pago en blockchain o la aprobación del administrador.\n3. Garantía de reemplazo válida por 30 días ante fallas no atribuibles al usuario.\n4. Guarde las credenciales y las cookies de sesión en un lugar seguro.`,
  hi: `📜 <b>नियम, शर्तें एवं वारंटी नीति</b>\n\n1. खरीदार को भेजने से पहले प्रत्येक खाते की जांच की जाती है।\n2. खाता केवल तभी दिया जाता है जब ब्लॉकचेन भुगतान या एडमिन अप्रूवल पूरी तरह सत्यापित हो।\n3. 30 दिनों की रिप्लेसमेंट वारंटी उपलब्ध है यदि कोई अनपेक्षित समस्या आती है।\n4. कृपया अपना पासवर्ड और सेशन कुकी सुरक्षित रखें।`,
  uz: `📜 <b>XIZMAT KO'RSATISH SHARTLARI VA KAFOLAT QOIDALARI</b>\n\n1. Barcha hisoblar xaridorga yetkazilishidan oldin to'liq tekshiriladi.\n2. Hisob FAQAT blokcheynda to'lov tasdiqlangandan yoki administrator ruxsatidan so'ng beriladi.\n3. 30 kunlik almashtirish kafolati amal qiladi.\n4. Sessiya kukilari va parollarni xavfsiz joyda saqlang.`,
  ar: `📜 <b>الشروط والأحكام وسياسة الضمان</b>\n\n1. يتم فحص واختبار جميع الحسابات قبل إرسالها إلى المشتري.\n2. يتم تسليم الحساب فقط بعد التحقق النهائي من الدفع عبر البلوكشين أو موافقة المسؤول.\n3. يسري ضمان الاستبدال لمدة 30 يومًا في حالة حدوث مشاكل غير ناتجة عن سوء الاستخدام.\n4. يرجى تخزين ملفات تعريف الارتباط وكلمات المرور في مكان آمن.`,
  de: `📜 <b>NUTZUNGSBEDINGUNGEN & GARANTIEPOLITIK</b>\n\n1. Alle Accounts werden vor der Auslieferung gründlich geprüft.\n2. Die Zugangsdaten werden ERST nach Blockchain-Bestätigung oder Admin-Freigabe versendet.\n3. 30 Tage Ersatzgarantie bei technischen Problemen.\n4. Bitte bewahren Sie Ihre Passwörter und Cookies sicher auf.`,
  fr: `📜 <b>CONDITIONS D'UTILISATION ET POLITIQUE DE GARANTIE</b>\n\n1. Tous les comptes sont vérifiés avant livraison.\n2. Les identifiants ne sont envoyés QU'APRÈS confirmation blockchain ou validation administrateur.\n3. Garantie de remplacement de 30 jours.\n4. Veuillez conserver vos cookies de session et mots de passe en lieu sûr.`,
  pt: `📜 <b>TERMOS DE USO E POLÍTICA DE GARANTIA</b>\n\n1. Todas as contas são verificadas antes do envio.\n2. As credenciais são liberadas APENAS após confirmação blockchain ou aprovação do admin.\n3. Garantia de substituição válida por 30 dias.\n4. Guarde seus cookies de sessão e senhas em local seguro.`,
  ja: `📜 <b>利用規約および保証ポリシー</b>\n\n1. すべてのアカウントは納品前に動作確認が行われます。\n2. アカウント情報は、ブロックチェーン決済の確認または管理者の承認後にのみ自動発行されます。\n3. 通常利用での不具合に対して30日間の交換保証を提供。\n4. セッショントークンやパスワードは安全に保管してください。`,
  tr: `📜 <b>KULLANIM ŞARTLARI VE GARANTİ POLİTİKASI</b>\n\n1. Tüm hesaplar teslimat öncesinde test edilir ve doğrulanır.\n2. Hesap bilgileri YALNIZCA blokzincir onayı veya yönetici onayından sonra teslim edilir.\n3. Kullanıcı hatası dışındaki durumlarda 30 günlük birebir değişim garantisi geçerlidir.\n4. Oturum çerezlerinizi ve şifrelerinizi lütfen güvenli bir yerde saklayın.`,
  en: `📜 <b>TERMS OF SERVICE & WARRANTY POLICY</b>\n\n1. All digital accounts are verified and tested before delivery.\n2. Credentials are ONLY released after blockchain payment confirmation or admin approval.\n3. 30-day replacement warranty applies for any unexpected account lockouts not caused by TOS violations.\n4. Please store your session tokens, cookies, and passwords securely.`
};

/**
 * Pre-translated default payment guides for all 10 languages (Cara Bayar)
 */
export const DEFAULT_PAYMENT_GUIDES = {
  id: `💳 <b>PANDUAN & CARA PEMBAYARAN KRIPTO</b>\n\n` +
    `⚡ <b>1. Pembayaran Otomatis (NOWPayments - USDT TRC-20):</b>\n` +
    `• Buka Katalog > Pilih Produk > Klik <b>Beli Sekarang (Kripto Otomatis)</b>.\n` +
    `• Invoice otomatis dibuat dengan alamat deposit TRC-20 unik.\n` +
    `• Transfer nominal tepat. Sistem memverifikasi konfirmasi blockchain.\n` +
    `• Klik <b>Cek / Konfirmasi Pembayaran</b>. Kredensial akun langsung terkirim seketika!\n\n` +
    `🪙 <b>2. Transfer Kripto Manual (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Buka Katalog > Pilih Produk > Klik <b>Beli (Transfer Manual)</b>.\n` +
    `• Pilih jaringan dompet (USDT TRC-20, BEP-20, BTC, SOL).\n` +
    `• Salin alamat dompet & kirim dana pas sesuai nominal tagihan.\n` +
    `• Admin memverifikasi di Web Admin Panel dan akun langsung terkirim otomatis!`,
  ms: `💳 <b>PANDUAN & CARA PEMBAYARAN KRIPTO</b>\n\n` +
    `⚡ <b>1. Bayaran Automatik (NOWPayments - USDT TRC-20):</b>\n` +
    `• Buka Katalog > Pilih Produk > Klik <b>Beli Sekarang (Kripto Automatik)</b>.\n` +
    `• Invois automatik dijana dengan alamat deposit TRC-20 unik.\n` +
    `• Pindahkan jumlah yang tepat ke alamat tersebut.\n` +
    `• Klik <b>Semak / Sahkan Pembayaran</b>. Kredensial akaun terus dihantar serta-merta!\n\n` +
    `🪙 <b>2. Pindahan Manual (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Pilih produk > Klik <b>Beli (Pindahan Manual)</b> > Pilih rangkaian.\n` +
    `• Pindahkan dana dan admin akan mengesahkan pesanan di Admin Panel!`,
  zh: `💳 <b>加密货币支付指南与流程</b>\n\n` +
    `⚡ <b>1. 自动加密支付 (NOWPayments - USDT TRC-20):</b>\n` +
    `• 打开产品目录 > 选择商品 > 点击 <b>立即购买（自动加密支付）</b>。\n` +
    `• 系统自动生成专属的 TRC-20 充值地址与账单。\n` +
    `• 按准确金额完成链上转账，点击 <b>检查/确认付款</b>。\n` +
    `• 区块链确认后，系统立即秒发账号与登录凭证！\n\n` +
    `🪙 <b>2. 人工转账 (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• 选择商品 > 点击 <b>购买（人工转账）</b> > 选择目标网络。\n` +
    `• 转账至指定钱包地址，管理员审核通过后账号自动送达！`,
  ru: `💳 <b>РУКОВОДСТВО ПО ОПЛАТЕ КРИПТОВАЛЮТОЙ</b>\n\n` +
    `⚡ <b>1. Автоматическая оплата (NOWPayments - USDT TRC-20):</b>\n` +
    `• Откройте каталог > Выберите товар > Нажмите <b>Купить (Авто-крипто)</b>.\n` +
    `• Будет выставлен счет с уникальным адресом депозита TRC-20.\n` +
    `• Переведите указанную сумму и нажмите <b>Проверить оплату</b>.\n` +
    `• После подтверждения транзакции бот мгновенно отправит аккаунт!\n\n` +
    `🪙 <b>2. Ручной перевод (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Выберите товар > Нажмите <b>Купить (Ручной перевод)</b> > Выберите сеть.\n` +
    `• Переведите средства, и администратор подтвердит выдачу товара!`,
  it: `💳 <b>GUIDA AI PAGAMENTI CRIPTO</b>\n\n` +
    `⚡ <b>1. Pagamento Automatico (NOWPayments - USDT TRC-20):</b>\n` +
    `• Apri Catalogo > Scegli Prodotto > Clicca <b>Acquista Ora (Crypto Auto)</b>.\n` +
    `• Riceverai l'indirizzo di deposito TRC-20 dedicato.\n` +
    `• Effettua il trasferimento e clicca <b>Verifica Pagamento</b> per ricevere subito l'account!\n\n` +
    `🪙 <b>2. Trasferimento Manuale (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Seleziona la rete desiderata, invia il pagamento e attendi l'approvazione dell'amministratore.`,
  es: `💳 <b>GUÍA DE PAGOS CRIPTO</b>\n\n` +
    `⚡ <b>1. Pago Automático (NOWPayments - USDT TRC-20):</b>\n` +
    `• Abra el catálogo > Seleccione producto > Clic en <b>Comprar Ahora (Cripto Auto)</b>.\n` +
    `• Se genera la factura con dirección TRC-20 única.\n` +
    `• Transfiera el monto exacto y presione <b>Verificar Pago</b> para recibir su cuenta al instante!\n\n` +
    `🪙 <b>2. Transferencia Manual (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Seleccione la red deseada, transfiera y el administrador validará la entrega de su cuenta.`,
  hi: `💳 <b>क्रिप्टो भुगतान मार्गदर्शिका</b>\n\n` +
    `⚡ <b>1. स्वचालित भुगतान (NOWPayments - USDT TRC-20):</b>\n` +
    `• कैटलॉग खोलें > उत्पाद चुनें > <b>अभी खरीदें (ऑटोमैटिक क्रिप्टो)</b> पर क्लिक करें।\n` +
    `• यूनिक TRC-20 पता प्राप्त करें, राशि ट्रांसफर करें और <b>भुगतान की पुष्टि करें</b> दबाएं।\n` +
    `• ब्लॉकचेन कन्फर्म होते ही तुरंत अकाउंट क्रेडेंशियल्स प्राप्त करें!\n\n` +
    `🪙 <b>2. मैन्युअल ट्रांसफर (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• नेटवर्क चुनें, भुगतान भेजें और व्यवस्थापक द्वारा सत्यापन के बाद खाता प्राप्त करें।`,
  uz: `💳 <b>KRIPTO TO'LOV BO'YICHA YO'RIQNOMA</b>\n\n` +
    `⚡ <b>1. Avtomatik to'lov (NOWPayments - USDT TRC-20):</b>\n` +
    `• Katalogni oching > Mahsulotni tanlang > <b>Hozir sotib olish (Avto Kripto)</b> ni bosing.\n` +
    `• Maxsus TRC-20 depozit manziliga aniq miqdorni o'tkazing.\n` +
    `• <b>To'lovni tekshirish</b> tugmasini bosing va hisob ma'lumotlarini bir zumda oling!\n\n` +
    `🪙 <b>2. Qo'lda o'tkazma (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Tarmoqni tanlang, mablag' o'tkazing va admin tekshirgach hisobni qabul qiling.`,
  ar: `💳 <b>دليل وطرق الدفع بالعملات المشفرة</b>\n\n` +
    `⚡ <b>1. الدفع التلقائي (NOWPayments - USDT TRC-20):</b>\n` +
    `• افتح الكتالوج > اختر المنتج > اضغط <b>شراء الآن (دفع تلقائي)</b>.\n` +
    `• ستحصل على عنوان إيداع TRC-20 مخصص.\n` +
    `• حوّل المبلغ المحدد واضغط <b>التحقق من الدفع</b> لاستلام الحساب فورًا!\n\n` +
    `🪙 <b>2. التحويل اليدوي (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• اختر الشبكة المناسبة وحوّل المبلغ، وسيقوم المسؤول بالتحقق وتسليمك الحساب.`,
  de: `💳 <b>KRYPTO-ZAHLUNGSANLEITUNG</b>\n\n` +
    `⚡ <b>1. Automatische Zahlung (NOWPayments - USDT TRC-20):</b>\n` +
    `• Katalog öffnen > Produkt wählen > <b>Jetzt kaufen (Auto Krypto)</b> anklicken.\n` +
    `• Eine eindeutige TRC-20 Einzahlungsadresse wird generiert.\n` +
    `• Überweisen Sie den genauen Betrag und klicken Sie auf <b>Zahlung prüfen</b>.\n` +
    `• Sobald bestätigt, werden die Zugangsdaten sofort geliefert!\n\n` +
    `🪙 <b>2. Manuelle Überweisung (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Netzwerk wählen, Betrag senden und Beleg einreichen. Der Admin gibt die Bestellung frei!`,
  fr: `💳 <b>GUIDE DE PAIEMENT CRYPTO</b>\n\n` +
    `⚡ <b>1. Paiement Automatique (NOWPayments - USDT TRC-20):</b>\n` +
    `• Ouvrir le Catalogue > Choisir le Produit > Cliquer sur <b>Acheter (Crypto Auto)</b>.\n` +
    `• Une adresse TRC-20 unique est générée.\n` +
    `• Transférez le montant exact et cliquez sur <b>Vérifier le Paiement</b>.\n` +
    `• Dès confirmation blockchain, vos identifiants sont livrés instantanément !\n\n` +
    `🪙 <b>2. Virement Manuel (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Choisissez le réseau, envoyez les fonds et soumettez la preuve pour validation admin !`,
  pt: `💳 <b>GUIA DE PAGAMENTO EM CRIPTO</b>\n\n` +
    `⚡ <b>1. Pagamento Automático (NOWPayments - USDT TRC-20):</b>\n` +
    `• Abra o Catálogo > Escolha o Produto > Clique em <b>Comprar (Cripto Automático)</b>.\n` +
    `• Uma fatura é gerada com endereço TRC-20 exclusivo.\n` +
    `• Transfira o valor exato e clique em <b>Verificar Pagamento</b>.\n` +
    `• Após confirmação blockchain, suas credenciais são entregues na hora!\n\n` +
    `🪙 <b>2. Transferência Manual (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Escolha a rede, transfira e envie o comprovante para aprovação do administrador!`,
  ja: `💳 <b>暗号資産（仮想通貨）お支払いガイド</b>\n\n` +
    `⚡ <b>1. 自動決済 (NOWPayments - USDT TRC-20):</b>\n` +
    `• カタログを開く > 商品を選択 > <b>今すぐ購入（自動決済）</b> をタップ。\n` +
    `• 専用の TRC-20 入金先アドレスと請求書が生成されます。\n` +
    `• 指定額を送金し、<b>お支払いを確認</b> をタップ。\n` +
    `• ブロックチェーン確認後、アカウント情報が即座に配信されます！\n\n` +
    `🪙 <b>2. 手動送金 (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• ご希望のネットワークを選択して送金し、送金証明（TXID/画像）を提出してください。`,
  tr: `💳 <b>KRİPTO ÖDEME REHBERİ VE TALİMATLARI</b>\n\n` +
    `⚡ <b>1. Otomatik Ödeme (NOWPayments - USDT TRC-20):</b>\n` +
    `• Kataloğu Açın > Ürünü Seçin > <b>Hemen Satın Al (Otomatik Kripto)</b> tıklayın.\n` +
    `• Size özel TRC-20 yatırma adresi oluşturulur.\n` +
    `• Tam tutarı transfer edin ve <b>Ödemeyi Kontrol Et</b> butonuna basın.\n` +
    `• Blokzincir onayından sonra hesap bilgileri anında teslim edilir!\n\n` +
    `🪙 <b>2. Manuel Transfer (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• İlgili ağı seçin, tutarı gönderin ve dekontu iletin. Yönetici onayından sonra teslim edilir!`,
  en: `💳 <b>CRYPTO PAYMENT GUIDE & INSTRUCTIONS</b>\n\n` +
    `⚡ <b>1. Automatic Payment (NOWPayments - USDT TRC-20):</b>\n` +
    `• Open Catalog > Choose Product > Click <b>Buy Now (Auto Crypto)</b>.\n` +
    `• An invoice is generated with a dedicated TRC-20 deposit address.\n` +
    `• Transfer the exact amount and click <b>Check / Confirm Payment</b>.\n` +
    `• Once confirmed on the blockchain, your credentials are delivered instantly!\n\n` +
    `🪙 <b>2. Manual Transfer (TRC20, BEP20, BTC, SOL):</b>\n` +
    `• Select product > Click <b>Buy (Manual Transfer)</b> > Select network.\n` +
    `• Transfer funds to the displayed address. Admin will approve and deliver automatically!`
};

/**
 * Pre-translated default orders guide/template for all 15 languages (Pesanan Saya)
 */
export const DEFAULT_ORDER_GUIDES = {
  id: `📦 <b>RIWAYAT & STATUS PESANAN SAYA</b>\n\n` +
    `• Status <b>PENDING</b>: Menunggu konfirmasi pembayaran Anda.\n` +
    `• Status <b>PAID / VERIFIED</b>: Pembayaran sukses! Kredensial akun Anda aktif dan dapat disalin kapan saja.\n` +
    `• Status <b>CANCELLED</b>: Pesanan dibatalkan.\n\n` +
    `Klik salah satu pesanan Anda di bawah untuk melihat detail atau menyalin kembali akun:`,
  ms: `📦 <b>SEJARAH & STATUS PESANAN SAYA</b>\n\n` +
    `• Status <b>PENDING</b>: Menunggu pengesahan bayaran anda.\n` +
    `• Status <b>PAID / VERIFIED</b>: Bayaran berjaya! Kredensial akaun anda sedia disalin.\n` +
    `• Status <b>CANCELLED</b>: Pesanan dibatalkan.`,
  zh: `📦 <b>我的历史订单与状态说明</b>\n\n` +
    `• 状态 <b>PENDING</b>: 等待区块链或人工确认付款。\n` +
    `• 状态 <b>PAID / VERIFIED</b>: 付款成功！账号凭据已激活，可随时复制查看。\n` +
    `• 状态 <b>CANCELLED</b>: 订单已取消。`,
  ru: `📦 <b>ИСТОРИЯ И СТАТУС ВАШИХ ЗАКАЗОВ</b>\n\n` +
    `• Статус <b>PENDING</b>: Ожидает подтверждения оплаты.\n` +
    `• Статус <b>PAID / VERIFIED</b>: Оплата подтверждена! Данные аккаунта доступны для копирования.\n` +
    `• Статус <b>CANCELLED</b>: Заказ отменен.`,
  it: `📦 <b>CRONOLOGIA E STATO DEI MIEI ORDINI</b>\n\n` +
    `• Stato <b>PENDING</b>: In attesa di verifica del pagamento.\n` +
    `• Stato <b>PAID / VERIFIED</b>: Pagamento confermato! Credenziali dell'account pronte per la copia.\n` +
    `• Stato <b>CANCELLED</b>: Ordine annullato.`,
  es: `📦 <b>HISTORIAL Y ESTADO DE MIS PEDIDOS</b>\n\n` +
    `• Estado <b>PENDING</b>: Esperando confirmación del pago.\n` +
    `• Estado <b>PAID / VERIFIED</b>: ¡Pago confirmado! Credenciales listas para ser copiadas.\n` +
    `• Estado <b>CANCELLED</b>: Pedido cancelado.`,
  hi: `📦 <b>मेरे ऑर्डर का इतिहास और स्थिति</b>\n\n` +
    `• स्थिति <b>PENDING</b>: भुगतान सत्यापन की प्रतीक्षा है।\n` +
    `• स्थिति <b>PAID / VERIFIED</b>: भुगतान सफल! खाता विवरण कॉपी करने के लिए तैयार है।\n` +
    `• स्थिति <b>CANCELLED</b>: ऑर्डर रद्द कर दिया गया।`,
  uz: `📦 <b>MENING BUYURTMALARIM TARIXI VA HOLATI</b>\n\n` +
    `• Holat <b>PENDING</b>: To'lov tasdiqlanishi kutilmoqda.\n` +
    `• Holat <b>PAID / VERIFIED</b>: To'lov muvaffaqiyatli! Hisob ma'lumotlari nusxalash uchun tayyor.\n` +
    `• Holat <b>CANCELLED</b>: Buyurtma bekor qilindi.`,
  ar: `📦 <b>سجل وحالة طلباتي</b>\n\n` +
    `• الحالة <b>PENDING</b>: بانتظار تأكيد الدفع.\n` +
    `• الحالة <b>PAID / VERIFIED</b>: تم الدفع بنجاح! بيانات الحساب جاهزة للنسخ في أي وقت.\n` +
    `• الحالة <b>CANCELLED</b>: تم إلغاء الطلب.`,
  de: `📦 <b>MEINE BESTELLUNGEN & STATUSÜBERSICHT</b>\n\n` +
    `• Status <b>PENDING</b>: Warten auf Zahlungsbestätigung.\n` +
    `• Status <b>PAID / VERIFIED</b>: Zahlung bestätigt! Zugangsdaten können jederzeit kopiert werden.\n` +
    `• Status <b>CANCELLED</b>: Bestellung storniert.`,
  fr: `📦 <b>HISTORIQUE ET STATUT DE MES COMMANDES</b>\n\n` +
    `• Statut <b>PENDING</b> : En attente de confirmation du paiement.\n` +
    `• Statut <b>PAID / VERIFIED</b> : Paiement confirmé ! Vos identifiants sont prêts à être copiés.\n` +
    `• Statut <b>CANCELLED</b> : Commande annulée.`,
  pt: `📦 <b>MEUS PEDIDOS E STATUS</b>\n\n` +
    `• Status <b>PENDING</b>: Aguardando confirmação do pagamento.\n` +
    `• Status <b>PAID / VERIFIED</b>: Pagamento confirmado! Suas credenciais estão prontas para cópia.\n` +
    `• Status <b>CANCELLED</b>: Pedido cancelado.`,
  ja: `📦 <b>注文履歴およびステータス確認</b>\n\n` +
    `• <b>PENDING</b>：お支払い確認待ち。\n` +
    `• <b>PAID / VERIFIED</b>：決済完了！アカウント情報をいつでもコピーできます。\n` +
    `• <b>CANCELLED</b>：注文がキャンセルされました。`,
  tr: `📦 <b>SİPARİŞ GEÇMİŞİM VE DURUMU</b>\n\n` +
    `• Durum <b>PENDING</b>: Ödeme onayı bekleniyor.\n` +
    `• Durum <b>PAID / VERIFIED</b>: Ödeme onaylandı! Hesap bilgileriniz kopyalanmaya hazır.\n` +
    `• Durum <b>CANCELLED</b>: Sipariş iptal edildi.`,
  en: `📦 <b>MY ORDER HISTORY & STATUS OVERVIEW</b>\n\n` +
    `• Status <b>PENDING</b>: Awaiting payment confirmation.\n` +
    `• Status <b>PAID / VERIFIED</b>: Payment confirmed! Your account credentials are ready to copy.\n` +
    `• Status <b>CANCELLED</b>: Order was cancelled.\n\n` +
    `Select an order below to view full details or copy your credentials:`
};

/**
 * Get localized UI string with fallback to Indonesian or English
 */
export function getUI(key, lang = 'id') {
  const item = UI_TRANSLATIONS[key];
  if (!item) return key;
  return item[lang] || item['en'] || item['id'] || key;
}

/**
 * Get localized Welcome text from settings object
 */
export function getLocalizedWelcome(settings = {}, lang = 'id') {
  if (!settings) settings = {};
  if (settings.welcome_translations && settings.welcome_translations[lang]) {
    return settings.welcome_translations[lang];
  }
  if (DEFAULT_WELCOME_TEXTS[lang]) {
    return DEFAULT_WELCOME_TEXTS[lang];
  }
  return settings.welcome_text || DEFAULT_WELCOME_TEXTS['id'];
}

/**
 * Get localized Terms text from settings object
 */
export function getLocalizedTerms(settings = {}, lang = 'id') {
  if (!settings) settings = {};
  if (settings.terms_translations && settings.terms_translations[lang]) {
    return settings.terms_translations[lang];
  }
  if (DEFAULT_TERMS_TEXTS[lang]) {
    return DEFAULT_TERMS_TEXTS[lang];
  }
  return settings.terms_text || DEFAULT_TERMS_TEXTS['id'];
}

/**
 * Get localized Payment Guide text from settings object
 */
export function getLocalizedPaymentGuide(settings = {}, lang = 'id') {
  if (!settings) settings = {};
  if (settings.payment_guide_translations && settings.payment_guide_translations[lang]) {
    return settings.payment_guide_translations[lang];
  }
  if (DEFAULT_PAYMENT_GUIDES[lang]) {
    return DEFAULT_PAYMENT_GUIDES[lang];
  }
  return settings.payment_guide_text || DEFAULT_PAYMENT_GUIDES['id'];
}

/**
 * Get localized Order Guide/Template text from settings object
 */
export function getLocalizedOrderGuide(settings = {}, lang = 'id') {
  if (!settings) settings = {};
  if (settings.order_guide_translations && settings.order_guide_translations[lang]) {
    return settings.order_guide_translations[lang];
  }
  if (DEFAULT_ORDER_GUIDES[lang]) {
    return DEFAULT_ORDER_GUIDES[lang];
  }
  return settings.order_guide_text || DEFAULT_ORDER_GUIDES['id'];
}

/**
 * Common dictionary for dynamic product translations across 15 languages
 */
const COMMON_PRODUCT_TRANSLATIONS = {
  'Akun ChatGPT Plus (Private 1 Bulan)': {
    en: 'ChatGPT Plus Account (Private 1 Month)',
    ms: 'Akaun ChatGPT Plus (Peribadi 1 Bulan)',
    zh: 'ChatGPT Plus 独享账号 (1个月)',
    ru: 'Аккаунт ChatGPT Plus (Личный 1 месяц)',
    es: 'Cuenta ChatGPT Plus (Privada 1 Mes)',
    it: 'Account ChatGPT Plus (Privato 1 Mese)',
    de: 'ChatGPT Plus Konto (Privat 1 Monat)',
    fr: 'Compte ChatGPT Plus (Privé 1 Mois)',
    pt: 'Conta ChatGPT Plus (Privada 1 Mês)',
    hi: 'ChatGPT Plus खाता (निजी 1 महीना)',
    uz: 'ChatGPT Plus hisobi (Shaxsiy 1 oy)',
    ar: 'حساب ChatGPT Plus (خاص لمدة شهر)',
    ja: 'ChatGPT Plus アカウント (個別 1ヶ月)',
    tr: 'ChatGPT Plus Hesabı (Özel 1 Aylık)'
  },
  'Akun ChatGPT Plus (Shared 1 Bulan)': {
    en: 'ChatGPT Plus Account (Shared 1 Month)',
    ms: 'Akaun ChatGPT Plus (Kongsi 1 Bulan)',
    zh: 'ChatGPT Plus 共享账号 (1个月)',
    ru: 'Аккаунт ChatGPT Plus (Общий 1 месяц)',
    es: 'Cuenta ChatGPT Plus (Compartida 1 Mes)',
    it: 'Account ChatGPT Plus (Condiviso 1 Mese)',
    de: 'ChatGPT Plus Konto (Shared 1 Monat)',
    fr: 'Compte ChatGPT Plus (Partagé 1 Mois)',
    pt: 'Conta ChatGPT Plus (Compartilhada 1 Mês)',
    hi: 'ChatGPT Plus खाता (साझा 1 महीना)',
    uz: 'ChatGPT Plus hisobi (Umumiy 1 oy)',
    ar: 'حساب ChatGPT Plus (مشترك لمدة شهر)',
    ja: 'ChatGPT Plus アカウント (共有 1ヶ月)',
    tr: 'ChatGPT Plus Hesabı (Ortak 1 Aylık)'
  },
  'Akun Claude Pro (Private 1 Bulan)': {
    en: 'Claude Pro Account (Private 1 Month)',
    ms: 'Akaun Claude Pro (Peribadi 1 Bulan)',
    zh: 'Claude Pro 独享账号 (1个月)',
    ru: 'Аккаунт Claude Pro (Личный 1 месяц)',
    es: 'Cuenta Claude Pro (Privada 1 Mes)',
    it: 'Account Claude Pro (Privato 1 Mese)',
    de: 'Claude Pro Konto (Privat 1 Monat)',
    fr: 'Compte Claude Pro (Privé 1 Mois)',
    pt: 'Conta Claude Pro (Privada 1 Mês)',
    hi: 'Claude Pro खाता (निजी 1 महीना)',
    uz: 'Claude Pro hisobi (Shaxsiy 1 oy)',
    ar: 'حساب Claude Pro (خاص لمدة شهر)',
    ja: 'Claude Pro アカウント (個別 1ヶ月)',
    tr: 'Claude Pro Hesabı (Özel 1 Aylık)'
  }
};

const COMMON_DESC_TRANSLATIONS = {
  en: 'Ready-to-use digital account with 30-day replacement warranty. Direct email, password, and session token access.',
  ms: 'Akaun digital sedia digunakan dengan jaminan penggantian 30 hari. Akses terus email, kata laluan, dan kuki sesi.',
  zh: '即买即用数字账号，享 30 天无忧免费质保换新。包含完整邮箱、密码及 Session Cookie 登录凭证。',
  ru: 'Готовый цифровой аккаунт с 30-дневной гарантией на замену. Предоставляются email, пароль и сессионный cookie.',
  es: 'Cuenta digital lista para usar con garantía de reemplazo de 30 días. Acceso directo a correo, contraseña y cookie de sesión.',
  it: 'Account digitale pronto all\'uso con garanzia di sostituzione per 30 giorni. Accesso con email, password e cookie di sessione.',
  de: 'Sofort einsatzbereites digitales Konto mit 30 Tagen Ersatzgarantie. Direkter Zugriff auf E-Mail, Passwort und Session-Cookie.',
  fr: 'Compte digital prêt à l\'emploi avec garantie de remplacement de 30 jours. Accès direct email, mot de passe et cookie de session.',
  pt: 'Conta digital pronta para uso com garantia de troca de 30 dias. Acesso direto com email, senha e cookie de sessão.',
  hi: '30 दिनों की रिप्लेसमेंट वारंटी के साथ उपयोग के लिए तैयार खाता। ईमेल, पासवर्ड और सेशन कुकी शामिल हैं।',
  uz: '30 kunlik almashtirish kafolatiga ega tayyor raqamli hisob. Email, parol va sessiya kukisi bilan to\'liq kirish.',
  ar: 'حساب رقمي جاهز للاستخدام مع ضمان استبدال لمدة 30 يومًا. وصول كامل بالبريد الإلكتروني وكلمة المرور وملف تعريف الارتباط.',
  ja: '30日間の安心交換保証付き、即時利用可能なデジタルアカウント。メール、パスワード、セッショントークン完備。',
  tr: '30 günlük birebir değişim garantili, hemen kullanıma hazır dijital hesap. E-posta, şifre ve oturum çerezi içerir.'
};

/**
 * Get localized Product details with intelligent multi-lingual translation
 */
export function getLocalizedProduct(product = {}, lang = 'id') {
  if (!product) {
    return {
      product_id: '',
      title: 'Produk',
      description: '',
      price_usd: 0,
      price_idr: 0,
      category: 'Digital'
    };
  }
  if (product.translations && product.translations[lang]) {
    return {
      ...product,
      title: product.translations[lang].title || product.title || 'Produk',
      description: product.translations[lang].description || product.description || ''
    };
  }

  // Automatic translation fallback if no custom translation entered in database
  let title = product.title || 'Produk';
  let description = product.description || '';

  if (lang !== 'id') {
    if (COMMON_PRODUCT_TRANSLATIONS[title] && COMMON_PRODUCT_TRANSLATIONS[title][lang]) {
      title = COMMON_PRODUCT_TRANSLATIONS[title][lang];
    } else {
      // Automatic term replacement for titles
      title = title
        .replace(/Akun /gi, lang === 'en' ? 'Account ' : lang === 'es' ? 'Cuenta ' : lang === 'fr' ? 'Compte ' : lang === 'de' ? 'Konto ' : lang === 'pt' ? 'Conta ' : lang === 'ja' ? 'アカウント ' : lang === 'tr' ? 'Hesap ' : 'Akun ')
        .replace(/1 Bulan/gi, lang === 'en' ? '1 Month' : lang === 'es' ? '1 Mes' : lang === 'fr' ? '1 Mois' : lang === 'de' ? '1 Monat' : lang === 'pt' ? '1 Mês' : lang === 'ja' ? '1ヶ月' : lang === 'tr' ? '1 Aylık' : '1 Bulan');
    }

    if (!description || description.includes('Akun siap pakai') || description.includes('garansi')) {
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
 * Helper: Parse raw account string into clean structured representation
 */
export function parseAccountCredential(accountData = '') {
  if (!accountData) return { raw: '' };
  
  const parts = accountData.split(':');
  if (parts.length >= 3) {
    return {
      raw: accountData,
      email: parts[0]?.trim(),
      password: parts[1]?.trim(),
      cookie: parts[2]?.trim(),
      apiKey: parts[3]?.trim() || null,
      note: parts.slice(4).join(':').trim() || null
    };
  }
  return { raw: accountData };
}

/**
 * Helper: Generate blockchain explorer URL or direct token view
 */
export function getTokenExplorerUrl(network = '', address = '') {
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

/**
 * Helper: Generate reliable QR Code image URL for any crypto/token address
 */
export function getQrCodeUrl(address = '', size = 300) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(address)}`;
}

/**
 * Multilingual Payment Status Matrix for all 10 Supported Languages
 */
export const PAYMENT_STATUS_TRANSLATIONS = {
  PENDING: {
    id: '⏳ Menunggu Pembayaran',
    ms: '⏳ Menunggu Bayaran',
    zh: '⏳ 等待支付',
    ru: '⏳ Ожидает оплаты',
    it: '⏳ In Attesa di Pagamento',
    es: '⏳ Esperando Pago',
    hi: '⏳ भुगतान प्रतीक्षारत',
    uz: '⏳ To\'lov kutilmoqda',
    ar: '⏳ بانتظار الدفع',
    de: '⏳ Warten auf Zahlung',
    fr: '⏳ En attente de paiement',
    pt: '⏳ Aguardando Pagamento',
    ja: '⏳ お支払い確認待ち',
    tr: '⏳ Ödeme Bekleniyor',
    en: '⏳ Awaiting Payment'
  },
  WAITING_APPROVAL: {
    id: '🔍 Menunggu Verifikasi Admin',
    ms: '🔍 Menunggu Pengesahan Admin',
    zh: '🔍 等待管理员审核',
    ru: '🔍 Ожидает подтверждения администратором',
    it: '🔍 In Attesa di Verifica Admin',
    es: '🔍 Esperando Verificación del Administrador',
    hi: '🔍 व्यवस्थापक सत्यापन की प्रतीक्षा',
    uz: '🔍 Admin tasdiqlashi kutilmoqda',
    ar: '🔍 بانتظار مراجعة المسؤول',
    de: '🔍 Warten auf Admin-Prüfung',
    fr: '🔍 En attente de validation admin',
    pt: '🔍 Aguardando Verificação do Admin',
    ja: '🔍 管理者確認待ち',
    tr: '🔍 Yönetici Onayı Bekleniyor',
    en: '🔍 Awaiting Admin Verification'
  },
  PAID: {
    id: '✅ Lunas & Terverifikasi',
    ms: '✅ Selesai Dibayar',
    zh: '✅ 已支付并已确认',
    ru: '✅ Оплачено и подтверждено',
    it: '✅ Pagato e Verificato',
    es: '✅ Pagado y Verificado',
    hi: '✅ भुगतान सफल एवं सत्यापित',
    uz: '✅ To\'landi va tasdiqlandi',
    ar: '✅ تم الدفع والتحقق',
    de: '✅ Bezahlt & Bestätigt',
    fr: '✅ Payé et Vérifié',
    pt: '✅ Pago e Verificado',
    ja: '✅ お支払い完了＆確認済み',
    tr: '✅ Ödendi ve Doğrulandı',
    en: '✅ Paid & Verified'
  },
  VERIFIED_BY_ADMIN: {
    id: '✅ Terverifikasi oleh Admin',
    ms: '✅ Disahkan oleh Admin',
    zh: '✅ 管理员审核通过',
    ru: '✅ Подтверждено администратором',
    it: '✅ Confermato dall\'Amministratore',
    es: '✅ Confirmado por el Administrador',
    hi: '✅ व्यवस्थापक द्वारा सत्यापित',
    uz: '✅ Admin tomonidan tasdiqlandi',
    ar: '✅ تم التحقق من قِبل المسؤول',
    de: '✅ Vom Admin bestätigt',
    fr: '✅ Confirmé par l\'administrateur',
    pt: '✅ Confirmado pelo Administrador',
    ja: '✅ 管理者承認完了',
    tr: '✅ Yönetici Tarafından Doğrulandı',
    en: '✅ Verified by Admin'
  },
  CANCELLED: {
    id: '❌ Dibatalkan',
    ms: '❌ Dibatalkan',
    zh: '❌ 已取消',
    ru: '❌ Отменен',
    it: '❌ Annullato',
    es: '❌ Cancelado',
    hi: '❌ रद्द कर दिया गया',
    uz: '❌ Bekor qilindi',
    ar: '❌ ملغى',
    de: '❌ Storniert',
    fr: '❌ Annulé',
    pt: '❌ Cancelado',
    ja: '❌ キャンセル済み',
    tr: '❌ İptal Edildi',
    en: '❌ Cancelled'
  },
  EXPIRED: {
    id: '⌛ Kadaluarsa',
    ms: '⌛ Tamat Tempoh',
    zh: '⌛ 已过期',
    ru: '⌛ Истек',
    it: '⌛ Scaduto',
    es: '⌛ Expirado',
    hi: '⌛ समय समाप्त',
    uz: '⌛ Muddati o\'tgan',
    ar: '⌛ منتهي الصلاحية',
    de: '⌛ Abgelaufen',
    fr: '⌛ Expiré',
    pt: '⌛ Expirado',
    ja: '⌛ 期限切れ',
    tr: '⌛ Süresi Doldu',
    en: '⌛ Expired'
  },
  REFUNDED: {
    id: '↩️ Dikembalikan (Refund)',
    ms: '↩️ Dikembalikan',
    zh: '↩️ 已退款',
    ru: '↩️ Возвращено',
    it: '↩️ Rimborsato',
    es: '↩️ Reembolsado',
    hi: '↩️ वापस कर दिया गया',
    uz: '↩️ Qaytarildi',
    ar: '↩️ مسترد',
    de: '↩️ Erstattet',
    fr: '↩️ Remboursé',
    pt: '↩️ Reembolsado',
    ja: '↩️ 返金済み',
    tr: '↩️ İade Edildi',
    en: '↩️ Refunded'
  }
};

/**
 * Multilingual Payment Method Labels
 */
export const PAYMENT_METHOD_TRANSLATIONS = {
  crypto_auto: {
    id: '⚡ Kripto Otomatis (NOWPayments)',
    ms: '⚡ Kripto Automatik (NOWPayments)',
    zh: '⚡ 自动加密支付 (NOWPayments)',
    ru: '⚡ Авто-крипто (NOWPayments)',
    it: '⚡ Crypto Automatico (NOWPayments)',
    es: '⚡ Cripto Automático (NOWPayments)',
    hi: '⚡ ऑटोमैटिक क्रिप्टो (NOWPayments)',
    uz: '⚡ Avtomatik Kripto (NOWPayments)',
    ar: '⚡ دفع تلقائي بالعملات المشفرة',
    de: '⚡ Automatisches Krypto (NOWPayments)',
    fr: '⚡ Crypto Automatique (NOWPayments)',
    pt: '⚡ Cripto Automático (NOWPayments)',
    ja: '⚡ 暗号資産自動決済 (NOWPayments)',
    tr: '⚡ Otomatik Kripto (NOWPayments)',
    en: '⚡ Automated Crypto (NOWPayments)'
  },
  crypto_manual: {
    id: '🪙 Transfer Kripto Manual',
    ms: '🪙 Pindahan Kripto Manual',
    zh: '🪙 人工加密转账',
    ru: '🪙 Ручной перевод криптовалюты',
    it: '🪙 Trasferimento Cripto Manuale',
    es: '🪙 Transferencia Manual Cripto',
    hi: '🪙 मैन्युअल क्रिप्टो ट्रांसफर',
    uz: '🪙 Qo\'lda Kripto O\'tkazmasi',
    ar: '🪙 تحويل يدوي للعملات المشفرة',
    de: '🪙 Manuelle Krypto-Überweisung',
    fr: '🪙 Virement Crypto Manuel',
    pt: '🪙 Transferência Manual Cripto',
    ja: '🪙 暗号資産手動送金',
    tr: '🪙 Manuel Kripto Transferi',
    en: '🪙 Manual Crypto Transfer'
  }
};

/**
 * Order Detail Labels for Invoices & Status Receipts
 */
export const ORDER_LABELS = {
  order_id: {
    id: '🆔 ID Pesanan',
    ms: '🆔 ID Pesanan',
    zh: '🆔 订单号',
    ru: '🆔 Номер заказа',
    it: '🆔 ID Ordine',
    es: '🆔 ID del Pedido',
    hi: '🆔 ऑर्डर आईडी',
    uz: '🆔 Buyurtma ID',
    ar: '🆔 رقم الطلب',
    de: '🆔 Bestellnummer',
    fr: '🆔 ID Commande',
    pt: '🆔 ID do Pedido',
    ja: '🆔 注文ID',
    tr: '🆔 Sipariş No',
    en: '🆔 Order ID'
  },
  product: {
    id: '📦 Produk',
    ms: '📦 Produk',
    zh: '📦 商品名称',
    ru: '📦 Товар',
    it: '📦 Prodotto',
    es: '📦 Producto',
    hi: '📦 उत्पाद',
    uz: '📦 Mahsulot',
    ar: '📦 المنتج',
    de: '📦 Produkt',
    fr: '📦 Produit',
    pt: '📦 Produto',
    ja: '📦 商品',
    tr: '📦 Ürün',
    en: '📦 Product'
  },
  total_amount: {
    id: '💰 Total Tagihan',
    ms: '💰 Jumlah Perlu Dibayar',
    zh: '💰 应付总额',
    ru: '💰 Итого к оплате',
    it: '💰 Totale da Pagare',
    es: '💰 Total a Pagar',
    hi: '💰 कुल देय राशि',
    uz: '💰 Jami to\'lov miqdori',
    ar: '💰 المبلغ الإجمالي',
    de: '💰 Rechnungsbetrag',
    fr: '💰 Montant Total',
    pt: '💰 Valor Total',
    ja: '💰 お支払い総額',
    tr: '💰 Toplam Tutar',
    en: '💰 Total Amount'
  },
  payment_method: {
    id: '💳 Metode Bayar',
    ms: '💳 Kaedah Bayaran',
    zh: '💳 付款方式',
    ru: '💳 Способ оплаты',
    it: '💳 Metodo di Pagamento',
    es: '💳 Método de Pago',
    hi: '💳 भुगतान विधि',
    uz: '💳 To\'lov usuli',
    ar: '💳 طريقة الدفع',
    de: '💳 Zahlungsmethode',
    fr: '💳 Mode de Paiement',
    pt: '💳 Método de Pagamento',
    ja: '💳 決済方法',
    tr: '💳 Ödeme Yöntemi',
    en: '💳 Payment Method'
  },
  payment_status: {
    id: '📊 Status Pembayaran',
    ms: '📊 Status Bayaran',
    zh: '📊 支付状态',
    ru: '📊 Статус оплаты',
    it: '📊 Stato Pagamento',
    es: '📊 Estado del Pago',
    hi: '📊 भुगतान की स्थिति',
    uz: '📊 To\'lov holati',
    ar: '📊 حالة الدفع',
    de: '📊 Zahlungsstatus',
    fr: '📊 Statut du Paiement',
    pt: '📊 Status do Pagamento',
    ja: '📊 お支払い状況',
    tr: '📊 Ödeme Durumu',
    en: '📊 Payment Status'
  },
  crypto_network: {
    id: '🌐 Jaringan / Koin',
    ms: '🌐 Rangkaian / Koin',
    zh: '🌐 目标网络 / 币种',
    ru: '🌐 Сеть / Монета',
    it: '🌐 Rete / Criptovaluta',
    es: '🌐 Red / Criptomoneda',
    hi: '🌐 नेटवर्क / कॉइन',
    uz: '🌐 Tarmoq / Kriptovalyuta',
    ar: '🌐 الشبكة / العملة',
    de: '🌐 Netzwerk / Token',
    fr: '🌐 Réseau / Jeton',
    pt: '🌐 Rede / Criptomoeda',
    ja: '🌐 ネットワーク / 通貨',
    tr: '🌐 Ağ / Kripto Para',
    en: '🌐 Network / Token'
  },
  crypto_address: {
    id: '📥 Alamat Pembayaran',
    ms: '📥 Alamat Pembayaran',
    zh: '📥 收款地址',
    ru: '📥 Адрес для перевода',
    it: '📥 Indirizzo di Pagamento',
    es: '📥 Dirección de Pago',
    hi: '📥 भुगतान का पता',
    uz: '📥 To\'lov manzili',
    ar: '📥 عنوان الدفع',
    de: '📥 Einzahlungsadresse',
    fr: '📥 Adresse de Paiement',
    pt: '📥 Endereço de Pagamento',
    ja: '📥 入金先アドレス',
    tr: '📥 Ödeme Adresi',
    en: '📥 Payment Address'
  },
  transaction_time: {
    id: '📅 Waktu Transaksi',
    ms: '📅 Masa Transaksi',
    zh: '📅 交易时间',
    ru: '📅 Время создания',
    it: '📅 Data e Ora',
    es: '📅 Fecha y Hora',
    hi: '📅 समय',
    uz: '📅 Bitim vaqti',
    ar: '📅 وقت المعاملة',
    de: '📅 Transaktionszeit',
    fr: '📅 Date de Transaction',
    pt: '📅 Horário da Transação',
    ja: '📅 取引日時',
    tr: '📅 İşlem Saati',
    en: '📅 Transaction Time'
  }
};

/**
 * Returns localized text for any payment status
 */
export function getLocalizedPaymentStatus(status = 'PENDING', lang = 'id') {
  const norm = (status || '').toUpperCase().trim();
  const entry = PAYMENT_STATUS_TRANSLATIONS[norm] || PAYMENT_STATUS_TRANSLATIONS['PENDING'];
  return entry[lang] || entry['en'] || entry['id'] || status;
}

/**
 * Returns localized text for payment method
 */
export function getLocalizedPaymentMethod(method = 'crypto_auto', lang = 'id') {
  const entry = PAYMENT_METHOD_TRANSLATIONS[method] || PAYMENT_METHOD_TRANSLATIONS['crypto_auto'];
  return entry[lang] || entry['en'] || entry['id'] || method;
}

/**
 * Formats a rich, beautifully localized receipt & status message in the target language
 */
export function formatLocalizedOrderReceipt(order = {}, lang = 'id') {
  if (!order) return '';
  const statusStr = getLocalizedPaymentStatus(order.payment_status, lang);
  const methodStr = getLocalizedPaymentMethod(order.payment_method, lang);
  const isPaid = order.payment_status === 'PAID' || order.payment_status === 'VERIFIED_BY_ADMIN';

  const lblStatus = ORDER_LABELS.payment_status[lang] || ORDER_LABELS.payment_status['en'];
  const lblOrder = ORDER_LABELS.order_id[lang] || ORDER_LABELS.order_id['en'];
  const lblProduct = ORDER_LABELS.product[lang] || ORDER_LABELS.product['en'];
  const lblAmount = ORDER_LABELS.total_amount[lang] || ORDER_LABELS.total_amount['en'];
  const lblMethod = ORDER_LABELS.payment_method[lang] || ORDER_LABELS.payment_method['en'];
  const lblTime = ORDER_LABELS.transaction_time[lang] || ORDER_LABELS.transaction_time['en'];
  const lblNetwork = ORDER_LABELS.crypto_network[lang] || ORDER_LABELS.crypto_network['en'];
  const lblAddress = ORDER_LABELS.crypto_address[lang] || ORDER_LABELS.crypto_address['en'];

  let header = '';
  if (isPaid) {
    header = `${getUI('payment_success_header', lang)}\n\n`;
  } else if (order.payment_status === 'WAITING_APPROVAL') {
    header = `⏳ <b>${lblStatus}:</b> ${statusStr}\n\n`;
  } else {
    header = `🧾 <b>INVOICE & ${lblStatus.toUpperCase()}:</b>\n\n`;
  }

  let text = header +
    `${lblOrder}: <code>${order.order_id || 'N/A'}</code>\n` +
    `${lblProduct}: <b>${order.product_title || 'Digital Product'}</b>\n` +
    `${lblAmount}: <b>$${order.amount || 0} USD</b>\n` +
    `${lblMethod}: ${methodStr}\n` +
    `${lblStatus}: <b>${statusStr}</b>\n`;

  if (order.crypto_network) {
    text += `${lblNetwork}: <code>${order.crypto_network}</code>\n`;
  }
  if (order.crypto_address && !isPaid) {
    text += `${lblAddress}:\n<code>${order.crypto_address}</code>\n`;
  }
  if (order.created_at) {
    text += `${lblTime}: ${new Date(order.created_at).toLocaleString()}\n`;
  }

  // Account Credentials if paid
  if (isPaid && order.account_delivered) {
    const parsed = parseAccountCredential(order.account_delivered);
    text += `\n${getUI('credentials_label', lang)}\n`;
    if (parsed.email && parsed.password) {
      text += `📧 <b>Email:</b> <code>${parsed.email}</code>\n` +
              `🔑 <b>Password:</b> <code>${parsed.password}</code>\n` +
              (parsed.cookie ? `🍪 <b>Cookie:</b> <code>${parsed.cookie}</code>\n` : '') +
              (parsed.apiKey ? `🔑 <b>API Key:</b> <code>${parsed.apiKey}</code>\n` : '') +
              (parsed.note ? `📝 <b>Catatan:</b> ${parsed.note}\n` : '');
    } else {
      text += `<code>${order.account_delivered}</code>\n`;
    }
    text += `\n${getUI('warranty_tip', lang)}\n`;
  } else if (!isPaid) {
    text += `\n${getUI('payment_pending_notice', lang)}\n`;
  }

  return text;
}
