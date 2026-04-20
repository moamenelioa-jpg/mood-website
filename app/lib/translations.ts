export type Language = "ar" | "en";

export const translations = {
  // ==========================================
  // COMMON / SHARED
  // ==========================================
  common: {
    brandName: { en: "Mood", ar: "مود" },
    brandTagline: { en: "Premium Peanut Butter", ar: "زبدة فول سوداني فاخرة" },
    loading: { en: "Loading...", ar: "جاري التحميل..." },
    error: { en: "Error", ar: "خطأ" },
    success: { en: "Success", ar: "نجاح" },
    cancel: { en: "Cancel", ar: "إلغاء" },
    confirm: { en: "Confirm", ar: "تأكيد" },
    save: { en: "Save", ar: "حفظ" },
    delete: { en: "Delete", ar: "حذف" },
    edit: { en: "Edit", ar: "تعديل" },
    close: { en: "Close", ar: "إغلاق" },
    currency: { en: "EGP", ar: "ج.م" },
    free: { en: "Free", ar: "مجاناً" },
    required: { en: "Required", ar: "مطلوب" },
    optional: { en: "Optional", ar: "اختياري" },
  },

  // ==========================================
  // NAVBAR
  // ==========================================
  nav: {
    home: { en: "Home", ar: "الرئيسية" },
    products: { en: "Products", ar: "المنتجات" },
    brandStory: { en: "Brand Story", ar: "قصة البراند" },
    wholesale: { en: "Wholesale", ar: "الجملة" },
    contact: { en: "Contact", ar: "تواصل" },
    cart: { en: "Cart", ar: "السلة" },
    shopNow: { en: "Shop Now", ar: "تسوق الآن" },
    openCart: { en: "Open cart", ar: "افتح السلة" },
    openMenu: { en: "Toggle menu", ar: "فتح القائمة" },
    switchLang: { en: "العربية", ar: "English" },
  },

  // ==========================================
  // HOMEPAGE / HERO
  // ==========================================
  home: {
    heroBadge: { en: "A world-class brand experience", ar: "تجربة براند عالمية" },
    heroTitle: { en: "Premium peanut butter for modern shelves.", ar: "زبدة فول سوداني بروح فاخرة" },
    heroDescription: {
      en: "A refined shopping experience that builds trust, boosts conversion, and positions Mood as a premium international brand.",
      ar: "تجربة تصميم متكاملة تصنع انطباعًا قويًا، تبني ثقة، وتجعل العلامة التجارية تبدو عالمية وفخمة.",
    },
    exploreCollection: { en: "Explore the collection", ar: "تسوق المجموعات" },
    discoverMood: { en: "Discover Mood", ar: "اكتشف البراند" },
    trustedBy: { en: "Trusted by", ar: "موثوق به من" },
    retail: { en: "Retail", ar: "تجار" },
    cafes: { en: "Cafés", ar: "مقاهي" },
    health: { en: "Health", ar: "صحّة" },
    browseRange: { en: "Browse the range", ar: "ابدأ التصفح" },
    favoriteProduct: { en: "Favorite product", ar: "المنتج المفضل" },
    internationalAppeal: { en: "International appeal", ar: "تصميم عالمي" },
    brandYouFeel: { en: "A brand you feel.", ar: "هوية تُشعر بها" },
    elegantVisuals: {
      en: "Elegant visuals, refined details, and a look that inspires confidence.",
      ar: "تجربة مرئية راقية، تدرجات دافئة، وتفاصيل تقود إلى الشراء.",
    },
    trust: { en: "Trust", ar: "ثقة" },
    trustDesc: {
      en: "Stronger messaging and clearer product confidence.",
      ar: "هوية أقوى ورسائل أوضح تزيد من مصداقية المنتج.",
    },
    smoothFlow: { en: "Smooth flow", ar: "سلاسة" },
    smoothFlowDesc: {
      en: "A smoother checkout journey with clear calls to action.",
      ar: "رحلة تسوق سهلة، أزرار واضحة، وتركيز على المنتج.",
    },
    // Hero badges
    authentic: { en: "Authentic", ar: "طبيعي" },
    authenticDesc: { en: "100% natural peanut butter with no additives.", ar: "زبدة فول سوداني طبيعية 100% بدون إضافات." },
    smooth: { en: "Smooth", ar: "سلس" },
    smoothDesc: { en: "Rich, creamy texture in every spoonful.", ar: "قوام كريمي غني في كل ملعقة." },
    trusted: { en: "Trusted", ar: "موثوق" },
    trustedDesc: { en: "Loved by thousands of happy customers.", ar: "محبوب من آلاف العملاء السعداء." },
    fast: { en: "Fast", ar: "سريع" },
    fastDesc: { en: "Your order is processed and shipped in no time.", ar: "طلبك يُجهّز ويُشحن في أسرع وقت." },
  },

  // ==========================================
  // PRODUCTS
  // ==========================================
  products: {
    featuredRange: { en: "Featured range", ar: "مجموعة مميزة" },
    title: {
      en: "Products presented with premium polish.",
      ar: "منتجات موود. جودة فائقة وطعم لا يقاوم",
    },
    browseCatalog: { en: "Browse catalog", ar: "استكشف الكتالوج" },
    addToCart: { en: "Add", ar: "أضف إلى السلة" },
    bestSeller: { en: "Best Seller", ar: "الأكثر مبيعًا" },
    new: { en: "New", ar: "جديد" },
    trending: { en: "Trending", ar: "رائج" },
    valuePack: { en: "Value Pack", ar: "عبوة اقتصادية" },
  },

  // ==========================================
  // CART
  // ==========================================
  cart: {
    title: { en: "Your Cart", ar: "سلتك" },
    empty: { en: "Your cart is empty", ar: "السلة فارغة" },
    emptyDesc: { en: "Add some products to continue checkout", ar: "أضف بعض المنتجات للمتابعة" },
    subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
    shipping: { en: "Shipping", ar: "الشحن" },
    total: { en: "Total", ar: "الإجمالي" },
    checkout: { en: "Checkout", ar: "إتمام الشراء" },
    continueShopping: { en: "Continue Shopping", ar: "متابعة التسوق" },
    removeItem: { en: "Remove item", ar: "إزالة المنتج" },
    backToStore: { en: "Back to Store", ar: "العودة للمتجر" },
  },

  // ==========================================
  // CHECKOUT
  // ==========================================
  checkout: {
    title: { en: "Checkout", ar: "إتمام الطلب" },
    customerInfo: { en: "Customer Information", ar: "معلومات العميل" },
    deliveryLocation: { en: "Delivery Location", ar: "موقع التوصيل" },
    orderSummary: { en: "Order Summary", ar: "ملخص الطلب" },
    paymentMethod: { en: "Payment Method", ar: "طريقة الدفع" },

    // Form fields
    fullName: { en: "Full Name", ar: "الاسم الكامل" },
    fullNamePlaceholder: { en: "Enter your full name", ar: "أدخل اسمك الكامل" },
    phone: { en: "Phone Number", ar: "رقم الهاتف" },
    phonePlaceholder: { en: "01012345678", ar: "01012345678" },
    email: { en: "Email", ar: "البريد الإلكتروني" },
    emailPlaceholder: { en: "your@email.com", ar: "بريدك@الإلكتروني.com" },
    governorate: { en: "Governorate", ar: "المحافظة" },
    governoratePlaceholder: { en: "Select Governorate", ar: "اختر المحافظة" },
    city: { en: "City / Area", ar: "المدينة / المنطقة" },
    cityPlaceholder: { en: "e.g., Maadi, Nasr City...", ar: "مثال: المعادي، مدينة نصر..." },
    address: { en: "Detailed Address", ar: "العنوان التفصيلي" },
    addressPlaceholder: {
      en: "Street name, building number, floor, apartment, landmark...",
      ar: "اسم الشارع، رقم المبنى، الدور، الشقة، علامة مميزة...",
    },
    notes: { en: "Order Notes", ar: "ملاحظات الطلب" },
    notesPlaceholder: { en: "Special instructions for delivery...", ar: "تعليمات خاصة للتوصيل..." },

    // Payment methods
    cod: { en: "Cash on Delivery", ar: "الدفع عند الاستلام" },
    codDesc: { en: "Pay when you receive your order", ar: "ادفع عند استلام طلبك" },
    cardPayment: { en: "Card Payment", ar: "الدفع بالبطاقة" },
    cardPaymentDesc: { en: "Pay securely with Visa, Mastercard, or other cards", ar: "ادفع بأمان باستخدام فيزا، ماستركارد، أو بطاقات أخرى" },
    manualPayment: { en: "Manual Payment (Bank / Wallet / InstaPay)", ar: "دفع يدوي (بنكي / محفظة / إنستاباي)" },
    manualPaymentDesc: { en: "Transfer the amount, then upload a receipt", ar: "حوّل المبلغ ثم ارفع إيصال الدفع" },
    bankTransfer: { en: "Bank Transfer", ar: "التحويل البنكي" },
    bankTransferDesc: { en: "Transfer to our bank account", ar: "حوّل إلى حسابنا البنكي" },
    bankDetails: { en: "Bank Account Details", ar: "تفاصيل الحساب البنكي" },
    bankName: { en: "Bank", ar: "البنك" },
    accountHolder: { en: "Account Holder", ar: "اسم صاحب الحساب" },
    iban: { en: "IBAN", ar: "رقم الآيبان" },
    bankTransferNote: { en: "After placing your order, transfer the total amount and upload the transfer receipt on the confirmation page.", ar: "بعد تأكيد الطلب، حوّل المبلغ الإجمالي وارفع إيصال التحويل في صفحة التأكيد." },
    wallet: { en: "Mobile Wallet", ar: "المحفظة الإلكترونية" },
    walletDesc: { en: "Pay via Vodafone Cash, Etisalat, or Orange Money", ar: "ادفع عبر فودافون كاش أو اتصالات أو أورنج موني" },
    walletDetails: { en: "Wallet Transfer Details", ar: "تفاصيل التحويل عبر المحفظة" },
    walletNumber: { en: "Wallet Number", ar: "رقم المحفظة" },
    walletNote: { en: "After placing your order, send the total to the wallet number above and upload the receipt on the confirmation page.", ar: "بعد تأكيد الطلب، أرسل المبلغ إلى رقم المحفظة أعلاه وارفع الإيصال في صفحة التأكيد." },
    receiptReminder: { en: "Please upload a clear receipt after completing the transfer.", ar: "يرجى رفع صورة واضحة للإيصال بعد إتمام التحويل." },
    copy: { en: "Copy", ar: "نسخ" },
    copied: { en: "Copied!", ar: "تم النسخ!" },
    instapay: { en: "InstaPay", ar: "إنستاباي" },
    instapayDesc: { en: "Fast transfer via InstaPay", ar: "تحويل فوري عبر إنستاباي" },
    instapayDetails: { en: "InstaPay Transfer Details", ar: "تفاصيل التحويل عبر إنستاباي" },
    instapayId: { en: "InstaPay ID", ar: "معرّف إنستاباي" },
    instapayNote: { en: "After placing your order, transfer the total via InstaPay and upload the receipt on the confirmation page.", ar: "بعد تأكيد الطلب، حوّل المبلغ عبر إنستاباي وارفع الإيصال في صفحة التأكيد." },

    // Buttons
    placeOrder: { en: "Place Order", ar: "تأكيد الطلب" },
    placeOrderWithReceipt: { en: "Confirm Order & Upload Receipt", ar: "تأكيد الطلب ورفع الإيصال" },
    proceedToPayment: { en: "Proceed to Payment", ar: "المتابعة للدفع" },
    processing: { en: "Processing...", ar: "جاري المعالجة..." },
    creatingOrder: { en: "Creating order...", ar: "جاري إنشاء الطلب..." },
    uploadingReceipt: { en: "Uploading receipt...", ar: "جاري رفع الإيصال..." },

    // Receipt upload (inline at checkout)
    attachReceipt: { en: "Attach Payment Receipt", ar: "إرفاق إيصال الدفع" },
    changeReceipt: { en: "Change", ar: "تغيير" },
    receiptHint: { en: "JPG / PNG / WebP / PDF · max 5 MB", ar: "صورة أو PDF · حد أقصى 5 ميجابايت" },
    receiptRequired: { en: "Please attach your payment receipt before placing the order.", ar: "يرجى إرفاق إيصال الدفع قبل تأكيد الطلب." },

    // Validation & errors
    cartEmpty: { en: "Your cart is empty", ar: "سلتك فارغة" },
    cityRequired: { en: "City is required", ar: "المدينة مطلوبة" },
    orderFailed: { en: "Failed to create order", ar: "فشل في إنشاء الطلب" },
    somethingWrong: { en: "Something went wrong. Please try again.", ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى." },
  },

  // ==========================================
  // SUCCESS PAGE
  // ==========================================
  success: {
    title: { en: "Order Confirmed!", ar: "تم تأكيد الطلب!" },
    description: { en: "Thank you for your order. We'll process it shortly.", ar: "شكراً لطلبك. سنقوم بمعالجته قريباً." },
    orderNumber: { en: "Order Number", ar: "رقم الطلب" },
    saveOrderNumber: { en: "Save this number to track your order", ar: "احفظ هذا الرقم لتتبع طلبك" },
    copy: { en: "Copy", ar: "نسخ" },
    copied: { en: "Copied!", ar: "تم النسخ!" },
    orderItems: { en: "Order Items", ar: "منتجات الطلب" },
    deliveryInfo: { en: "Delivery Information", ar: "معلومات التوصيل" },
    paymentReceived: { en: "Payment received", ar: "تم استلام الدفع" },
    payWhenDelivered: { en: "Pay when delivered", ar: "ادفع عند التوصيل" },
    awaitingPayment: { en: "Awaiting payment", ar: "في انتظار الدفع" },
    paymentRejected: { en: "Payment rejected – please re-upload a valid receipt.", ar: "تم رفض الدفع – يرجى إعادة رفع إيصال صحيح." },
    bankInstructions: { en: "Bank Transfer Instructions", ar: "تعليمات التحويل البنكي" },
    transferTo: { en: "Please transfer the amount to:", ar: "يرجى تحويل المبلغ إلى:" },
    bank: { en: "Bank", ar: "البنك" },
    account: { en: "Account", ar: "الحساب" },
    accountName: { en: "Name", ar: "الاسم" },
    amount: { en: "Amount", ar: "المبلغ" },
    includeOrderNumber: { en: "Please include order number in transfer reference.", ar: "يرجى تضمين رقم الطلب في مرجع التحويل." },
    iban: { en: "IBAN", ar: "رقم الآيبان" },
    uploadProof: { en: "Upload Transfer Receipt", ar: "رفع إيصال التحويل" },
    uploadReceipt: { en: "Choose receipt image", ar: "اختر صورة الإيصال" },
    uploading: { en: "Uploading...", ar: "جاري الرفع..." },
    proofReceived: { en: "Receipt uploaded successfully! We'll verify your payment shortly.", ar: "تم رفع الإيصال بنجاح! سنتحقق من الدفع قريباً." },
    proofNote: { en: "Upload a screenshot or photo of your bank transfer receipt.", ar: "ارفع لقطة شاشة أو صورة لإيصال التحويل البنكي." },
    proofInvalidType: { en: "Please select an image file.", ar: "يرجى اختيار ملف صورة." },
    proofTooLarge: { en: "Image is too large. Max 5MB allowed.", ar: "الصورة كبيرة جداً. الحد الأقصى 5 ميجابايت." },
    proofUploadFailed: { en: "Failed to upload receipt. Please try again.", ar: "فشل رفع الإيصال. يرجى المحاولة مرة أخرى." },
    whatsNext: { en: "What's Next?", ar: "ماذا بعد؟" },
    step1: { en: "We're preparing your order", ar: "نقوم بتجهيز طلبك" },
    step1Desc: { en: "Our team will start processing your order shortly.", ar: "سيبدأ فريقنا بمعالجة طلبك قريباً." },
    step2: { en: "Delivery on the way", ar: "التوصيل في الطريق" },
    step2Desc: { en: "You'll receive your products at your doorstep.", ar: "ستستلم منتجاتك على باب منزلك." },
    continueShopping: { en: "Continue Shopping", ar: "متابعة التسوق" },
    needHelp: { en: "Need help?", ar: "تحتاج مساعدة؟" },
    contactSupport: { en: "Contact our support team", ar: "تواصل مع فريق الدعم" },
  },

  // ==========================================
  // CANCEL PAGE
  // ==========================================
  cancel: {
    title: { en: "Payment Cancelled", ar: "تم إلغاء الدفع" },
    description: { en: "Your payment was cancelled. Don't worry, no charges were made.", ar: "تم إلغاء الدفع. لا تقلق، لم يتم خصم أي مبلغ." },
    orderPending: { en: "is still pending.", ar: "لا يزال معلقاً." },
    tryAgain: { en: "Try Again", ar: "حاول مرة أخرى" },
    backToStore: { en: "Back to Store", ar: "العودة للمتجر" },
    needHelp: { en: "Need help?", ar: "تحتاج مساعدة؟" },
    contactSupport: { en: "Contact our support team", ar: "تواصل مع فريق الدعم" },
  },

  // ==========================================
  // BRAND STORY SECTION
  // ==========================================
  story: {
    title: { en: "Brand story", ar: "قصة البراند" },
    heading: {
      en: "Design that turns peanut butter into a premium brand.",
      ar: "تصميم عالمي لمنتج يروي قصة قوية.",
    },
    description: {
      en: "This experience builds value, puts trust front and center, and positions every section as premium storytelling.",
      ar: "الموقع لا يبيع منتجًا فقط، بل يبني قيمة، يضع الثقة في المقدمة، ويجعل كل قسم يتكلم بلغة الفخامة.",
    },
    startWithMood: { en: "Start with Mood", ar: "ابدأ مع Mood" },
    cinematicHero: { en: "Cinematic hero", ar: "واجهة سينمائية" },
    cinematicHeroDesc: { en: "Stronger product emphasis and premium detail.", ar: "تركيز أكبر على المنتج والتفاصيل." },
    clearBrowsing: { en: "Clear browsing", ar: "تصفح مرن" },
    clearBrowsingDesc: { en: "Balanced layout and effortless readability.", ar: "تنسيق متوازن وسهل القراءة." },
    moreTrust: { en: "More trust", ar: "ثقة أعلى" },
    moreTrustDesc: { en: "Trust cues that feel authentic and elevated.", ar: "مؤشرات ثقة جذابة ومصداقية." },
    globalAppeal: { en: "Global appeal", ar: "هوية عالمية" },
    globalAppealDesc: { en: "Warm palette and elegant international style.", ar: "ألوان دافئة وأسلوب محترف عالمي." },
  },

  // ==========================================
  // TESTIMONIALS
  // ==========================================
  testimonials: {
    customerVoice: { en: "Customer voice", ar: "آراء العملاء" },
    heading: {
      en: "The experience should feel premium, trusted, and inviting.",
      ar: "التجربة يجب أن تشعر بالفخامة والثقة.",
    },
    previousTestimonial: { en: "Previous testimonial", ar: "الاستعراض السابق" },
    nextTestimonial: { en: "Next testimonial", ar: "الاستعراض التالي" },
  },

  // ==========================================
  // WHOLESALE
  // ==========================================
  wholesale: {
    title: { en: "Wholesale & distribution", ar: "الجملة والتوزيع" },
    heading: {
      en: "Ready for retailers, distributors, and premium buyers.",
      ar: "جاهز للعرض أمام تجار وموزعين كبار.",
    },
    description: {
      en: "A premium wholesale presentation designed to attract high-value partners and bulk buyers.",
      ar: "هذا العرض التجاري مصمم ليُظهر المنتج بمظهر احترافي، واضح، وجذاب للأسواق العالية القيمة.",
    },
    requestPricing: { en: "Request pricing", ar: "طلب عرض سعر" },
    becomePartner: { en: "Become a partner", ar: "انضم كشريك" },
  },

  // ==========================================
  // FOOTER
  // ==========================================
  footer: {
    description: {
      en: "Your storefront now feels modern, premium, and built for high-value shoppers.",
      ar: "واجهتك الآن تبدو أكثر احترافية، عصرية، ومرغوبة من المتاجر التقليدية.",
    },
  },

  // ==========================================
  // GOVERNORATES (Egyptian)
  // ==========================================
  governorates: {
    Cairo: { en: "Cairo", ar: "القاهرة" },
    Giza: { en: "Giza", ar: "الجيزة" },
    Alexandria: { en: "Alexandria", ar: "الإسكندرية" },
    Dakahlia: { en: "Dakahlia", ar: "الدقهلية" },
    "Red Sea": { en: "Red Sea", ar: "البحر الأحمر" },
    Beheira: { en: "Beheira", ar: "البحيرة" },
    Fayoum: { en: "Fayoum", ar: "الفيوم" },
    Gharbia: { en: "Gharbia", ar: "الغربية" },
    Ismailia: { en: "Ismailia", ar: "الإسماعيلية" },
    Menoufia: { en: "Menoufia", ar: "المنوفية" },
    Minya: { en: "Minya", ar: "المنيا" },
    Qalyubia: { en: "Qalyubia", ar: "القليوبية" },
    "New Valley": { en: "New Valley", ar: "الوادي الجديد" },
    Suez: { en: "Suez", ar: "السويس" },
    Aswan: { en: "Aswan", ar: "أسوان" },
    Assiut: { en: "Assiut", ar: "أسيوط" },
    "Beni Suef": { en: "Beni Suef", ar: "بني سويف" },
    "Port Said": { en: "Port Said", ar: "بورسعيد" },
    Damietta: { en: "Damietta", ar: "دمياط" },
    Sharqia: { en: "Sharqia", ar: "الشرقية" },
    "South Sinai": { en: "South Sinai", ar: "جنوب سيناء" },
    "Kafr El Sheikh": { en: "Kafr El Sheikh", ar: "كفر الشيخ" },
    Matrouh: { en: "Matrouh", ar: "مطروح" },
    Luxor: { en: "Luxor", ar: "الأقصر" },
    Qena: { en: "Qena", ar: "قنا" },
    "North Sinai": { en: "North Sinai", ar: "شمال سيناء" },
    Sohag: { en: "Sohag", ar: "سوهاج" },
  },
} as const;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get translation by key path
 */
export function t(
  key: string,
  lang: Language
): string {
  const keys = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = translations;

  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = result[k];
    } else {
      return key; // Return key if not found
    }
  }

  if (result && typeof result === "object" && lang in result) {
    return result[lang] as string;
  }

  return key;
}

/**
 * Get the dir attribute based on language
 */
export function getDirection(lang: Language): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

/**
 * Format price with currency
 */
export function formatPriceLocalized(amount: number, lang: Language): string {
  const currency = lang === "ar" ? "ج.م" : "EGP";
  const formattedAmount = amount.toLocaleString(lang === "ar" ? "ar-EG" : "en-EG");
  return lang === "ar" ? `${formattedAmount} ${currency}` : `${currency} ${formattedAmount}`;
}
