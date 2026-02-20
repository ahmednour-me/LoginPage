import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

export const useAuth = (): AuthState & AuthActions & { isConfigured: boolean } => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase غير مُعد. يرجى إضافة بيانات الاتصال.' };
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'هذا البريد الإلكتروني مسجل بالفعل' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'حدث خطأ غير متوقع' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase غير مُعد. يرجى إضافة بيانات الاتصال.' };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'حدث خطأ غير متوقع' };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    
    await supabase.auth.signOut();
    setState(prev => ({
      ...prev,
      user: null,
      session: null,
    }));
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase غير مُعد. يرجى إضافة بيانات الاتصال.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'حدث خطأ غير متوقع' };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase غير مُعد. يرجى إضافة بيانات الاتصال.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'حدث خطأ غير متوقع' };
    }
  }, []);

  return {
    ...state,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };
};
