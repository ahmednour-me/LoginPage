import { createClient } from '@supabase/supabase-js';

// ============================================
// ⚠️ إعدادات Supabase - يجب تعديلها
// ============================================
// قم بإنشاء مشروع على https://supabase.com
// ثم انسخ URL و anon key من إعدادات المشروع
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// التحقق من وجود الإعدادات - يجب أن تكون URLs صالحة
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isConfigured = isValidUrl(supabaseUrl) && supabaseAnonKey.length > 0;

// إنشاء client فقط إذا كانت الإعدادات صحيحة، وإلا استخدم dummy URL
const safeUrl = isConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = isConfigured;

// أنواع البيانات
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthError {
  message: string;
  status?: number;
}
