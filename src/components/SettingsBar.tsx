import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Moon, Globe } from 'lucide-react';

export const SettingsBar = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Language Toggle */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: isDark 
            ? 'rgba(255,255,255,0.1)' 
            : 'rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)',
          border: isDark 
            ? '1px solid rgba(255,255,255,0.2)' 
            : '1px solid rgba(0,0,0,0.1)',
        }}
        title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      >
        <Globe className="w-4 h-4" style={{ color: isDark ? 'hsl(40, 20%, 90%)' : 'hsl(30, 15%, 30%)' }} />
        <span 
          className="text-sm font-medium"
          style={{ color: isDark ? 'hsl(40, 20%, 90%)' : 'hsl(30, 15%, 30%)' }}
        >
          {language === 'en' ? 'عربي' : 'EN'}
        </span>
      </button>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: isDark 
            ? 'rgba(255,255,255,0.1)' 
            : 'rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)',
          border: isDark 
            ? '1px solid rgba(255,255,255,0.2)' 
            : '1px solid rgba(0,0,0,0.1)',
        }}
        title={isDark ? t.lightMode : t.darkMode}
      >
        {isDark ? (
          <Sun className="w-4 h-4" style={{ color: 'hsl(45, 100%, 60%)' }} />
        ) : (
          <Moon className="w-4 h-4" style={{ color: 'hsl(30, 15%, 30%)' }} />
        )}
      </button>
    </div>
  );
};

export default SettingsBar;
