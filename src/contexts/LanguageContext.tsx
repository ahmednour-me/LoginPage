import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  // Auth Form
  login: string;
  signup: string;
  forgotPassword: string;
  fullName: string;
  email: string;
  password: string;
  enterFullName: string;
  enterEmail: string;
  sendResetLink: string;
  createAccount: string;
  forgotPasswordLink: string;
  createNewAccount: string;
  haveAccount: string;
  backToLogin: string;
  processing: string;
  
  // Validation
  invalidEmail: string;
  passwordMin: string;
  nameMin: string;
  
  // Messages
  welcomeBack: string;
  loginSuccess: string;
  loginError: string;
  signupError: string;
  accountCreated: string;
  checkEmailConfirm: string;
  resetSent: string;
  checkEmailReset: string;
  error: string;
  warning: string;
  databaseNotConfigured: string;
  databaseWarning: string;
  accountLocked: string;
  attemptsRemaining: string;
  
  // Footer
  developedBy: string;
  
  // Theme
  lightMode: string;
  darkMode: string;
}

const translations: Record<Language, Translations> = {
  en: {
    login: 'Login',
    signup: 'Sign Up',
    forgotPassword: 'Forgot Password',
    fullName: 'Full Name',
    email: 'Email',
    password: 'Password',
    enterFullName: 'Enter your full name',
    enterEmail: 'example@email.com',
    sendResetLink: 'Send Reset Link',
    createAccount: 'Create Account',
    forgotPasswordLink: 'Forgot password?',
    createNewAccount: 'Create new account',
    haveAccount: 'Have an account? Login',
    backToLogin: 'Back to login',
    processing: 'Processing...',
    
    invalidEmail: 'Invalid email address',
    passwordMin: 'Password must be at least 6 characters',
    nameMin: 'Name must be at least 2 characters',
    
    welcomeBack: 'Welcome back!',
    loginSuccess: 'Successfully logged in',
    loginError: 'Login Error',
    signupError: 'Sign Up Error',
    accountCreated: 'Account Created!',
    checkEmailConfirm: 'Please check your email to confirm your account',
    resetSent: 'Reset Link Sent!',
    checkEmailReset: 'Please check your email to reset your password',
    error: 'Error',
    warning: 'Warning',
    databaseNotConfigured: 'Database not configured. Please add Supabase credentials.',
    databaseWarning: '⚠️ Database not configured. Please add environment variables in .env file',
    accountLocked: 'Too many failed attempts. Account locked for 15 minutes.',
    attemptsRemaining: '{n} attempts remaining',
    
    developedBy: 'Developed by Ahmed Nour',
    
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
  },
  ar: {
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    forgotPassword: 'نسيت كلمة المرور',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    enterFullName: 'أدخل اسمك الكامل',
    enterEmail: 'example@email.com',
    sendResetLink: 'إرسال رابط الاستعادة',
    createAccount: 'إنشاء حساب',
    forgotPasswordLink: 'نسيت كلمة المرور؟',
    createNewAccount: 'إنشاء حساب جديد',
    haveAccount: 'لديك حساب؟ سجل دخولك',
    backToLogin: 'العودة لتسجيل الدخول',
    processing: 'جاري المعالجة...',
    
    invalidEmail: 'البريد الإلكتروني غير صالح',
    passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    nameMin: 'الاسم يجب أن يكون حرفين على الأقل',
    
    welcomeBack: 'مرحباً بك!',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    loginError: 'خطأ في تسجيل الدخول',
    signupError: 'خطأ في إنشاء الحساب',
    accountCreated: 'تم إنشاء الحساب!',
    checkEmailConfirm: 'يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب',
    resetSent: 'تم الإرسال!',
    checkEmailReset: 'يرجى التحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور',
    error: 'خطأ',
    warning: 'تنبيه',
    databaseNotConfigured: 'قاعدة البيانات غير مُعدة. يرجى إضافة بيانات Supabase.',
    databaseWarning: '⚠️ قاعدة البيانات غير مُعدة. يرجى إضافة متغيرات البيئة في ملف .env',
    accountLocked: 'محاولات فاشلة كثيرة. تم قفل الحساب لمدة 15 دقيقة.',
    attemptsRemaining: '{n} محاولات متبقية',
    
    developedBy: 'تم التطوير بواسطة أحمد نور',
    
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language],
    isRTL: language === 'ar',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
