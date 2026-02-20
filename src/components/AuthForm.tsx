import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '@/lib/rateLimiter';

type AuthMode = 'login' | 'signup' | 'forgot-password';

interface AuthFormProps {
  onModeChange?: (mode: AuthMode) => void;
  onSuccess?: () => void;
  onFormFocus?: () => void;
  onFormBlur?: () => void;
  onTyping?: (field: 'email' | 'password' | 'name') => void;
}

export const AuthForm = ({ 
  onModeChange, 
  onSuccess,
  onFormFocus,
  onFormBlur,
  onTyping,
}: AuthFormProps) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const lockoutTimerRef = useRef<NodeJS.Timeout>();
  
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();
  const { t, isRTL } = useLanguage();
  const { isDark } = useTheme();

  // Lockout countdown
  useEffect(() => {
    if (lockoutSeconds > 0) {
      lockoutTimerRef.current = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) {
            clearInterval(lockoutTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(lockoutTimerRef.current);
    }
  }, [lockoutSeconds]);

  // Dynamic validation schemas using translations
  const emailSchema = z.string().email(t.invalidEmail);
  const passwordSchema = z.string().min(6, t.passwordMin);
  const nameSchema = z.string().min(2, t.nameMin).optional();

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    onModeChange?.(newMode);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode !== 'forgot-password') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === 'signup' && fullName) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!isConfigured) {
      toast({
        title: t.warning,
        description: t.databaseNotConfigured,
        variant: 'destructive',
      });
      return;
    }

    // Rate limiting for login
    if (mode === 'login') {
      const rateCheck = checkRateLimit(email);
      if (!rateCheck.allowed) {
        setLockoutSeconds(rateCheck.lockoutSeconds);
        toast({
          title: t.error,
          description: t.accountLocked,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          const result = recordFailedAttempt(email);
          if (result.locked) {
            setLockoutSeconds(result.lockoutSeconds);
          }
          const rateInfo = checkRateLimit(email);
          toast({
            title: t.loginError,
            description: result.locked ? t.accountLocked : `${error} (${t.attemptsRemaining.replace('{n}', String(rateInfo.remainingAttempts))})`,
            variant: 'destructive',
          });
        } else {
          clearAttempts(email);
          toast({
            title: t.welcomeBack,
            description: t.loginSuccess,
          });
          onSuccess?.();
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: t.signupError,
            description: error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t.accountCreated,
            description: t.checkEmailConfirm,
          });
          handleModeChange('login');
        }
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: t.error,
            description: error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t.resetSent,
            description: t.checkEmailReset,
          });
          handleModeChange('login');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(10px)',
    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.3)',
    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(35,35,35,0.9)',
  };

  const labelColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(55,55,55,0.8)';
  const linkColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(75,75,75,0.7)';

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {mode === 'signup' && (
        <div className="space-y-2">
          <label 
            className={`block text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}
            style={{ color: labelColor }}
          >
            {t.fullName}
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              onTyping?.('name');
            }}
            onFocus={onFormFocus}
            onBlur={onFormBlur}
            className={`w-full px-4 py-3 rounded-xl ${isRTL ? 'text-right' : 'text-left'} outline-none transition-all duration-300 focus:ring-2 focus:ring-amber-400/50`}
            style={inputStyle}
            placeholder={t.enterFullName}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          {errors.name && (
            <p className={`text-red-500 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{errors.name}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label 
          className={`block text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}
          style={{ color: labelColor }}
        >
          {t.email}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            onTyping?.('email');
          }}
          onFocus={onFormFocus}
          onBlur={onFormBlur}
          className={`w-full px-4 py-3 rounded-xl ${isRTL ? 'text-right' : 'text-left'} outline-none transition-all duration-300 focus:ring-2 focus:ring-amber-400/50`}
          style={inputStyle}
          placeholder={t.enterEmail}
          dir="ltr"
        />
        {errors.email && (
          <p className={`text-red-500 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{errors.email}</p>
        )}
      </div>

      {mode !== 'forgot-password' && (
        <div className="space-y-2">
          <label 
            className={`block text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}
            style={{ color: labelColor }}
          >
            {t.password}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              onTyping?.('password');
            }}
            onFocus={onFormFocus}
            onBlur={onFormBlur}
            className={`w-full px-4 py-3 rounded-xl ${isRTL ? 'text-right' : 'text-left'} outline-none transition-all duration-300 focus:ring-2 focus:ring-amber-400/50`}
            style={inputStyle}
            placeholder="••••••••"
            dir="ltr"
          />
          {errors.password && (
            <p className={`text-red-500 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>{errors.password}</p>
          )}
        </div>
      )}

      {lockoutSeconds > 0 && mode === 'login' && (
        <div 
          className="p-3 rounded-xl text-center text-sm font-medium"
          style={{ 
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'rgba(239,68,68,0.9)',
          }}
        >
          🔒 {t.accountLocked} ({Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')})
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || lockoutSeconds > 0}
        className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, rgba(255,193,7,0.8) 0%, rgba(255,152,0,0.8) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          boxShadow: '0 4px 15px rgba(255,152,0,0.3)',
        }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t.processing}
          </span>
        ) : mode === 'login' ? (
          t.login
        ) : mode === 'signup' ? (
          t.createAccount
        ) : (
          t.sendResetLink
        )}
      </button>

      <div 
        className="flex items-center justify-center gap-4 text-sm flex-wrap"
        style={{ color: linkColor }}
      >
        {mode === 'login' && (
          <>
            <button 
              type="button"
              onClick={() => handleModeChange('forgot-password')}
              className="hover:opacity-100 transition-opacity hover:underline"
              style={{ opacity: 0.8 }}
            >
              {t.forgotPasswordLink}
            </button>
            <span style={{ opacity: 0.5 }}>|</span>
            <button 
              type="button"
              onClick={() => handleModeChange('signup')}
              className="hover:opacity-100 transition-opacity hover:underline"
              style={{ opacity: 0.8 }}
            >
              {t.createNewAccount}
            </button>
          </>
        )}
        {mode === 'signup' && (
          <button 
            type="button"
            onClick={() => handleModeChange('login')}
            className="hover:opacity-100 transition-opacity hover:underline"
            style={{ opacity: 0.8 }}
          >
            {t.haveAccount}
          </button>
        )}
        {mode === 'forgot-password' && (
          <button 
            type="button"
            onClick={() => handleModeChange('login')}
            className="hover:opacity-100 transition-opacity hover:underline"
            style={{ opacity: 0.8 }}
          >
            {t.backToLogin}
          </button>
        )}
      </div>

      {!isConfigured && (
        <div 
          className="mt-4 p-3 rounded-lg text-center text-xs"
          style={{ 
            background: isDark ? 'rgba(255,193,7,0.15)' : 'rgba(255,193,7,0.2)',
            border: '1px solid rgba(255,193,7,0.4)',
            color: isDark ? 'rgba(255,200,0,0.9)' : 'rgba(100,80,0,0.9)',
          }}
        >
          {t.databaseWarning}
        </div>
      )}
    </form>
  );
};

export default AuthForm;
