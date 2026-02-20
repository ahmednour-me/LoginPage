# 🐉 Dragon Auth - Interactive Login Experience

<div align="center">

![Dragon Auth](https://img.shields.io/badge/Dragon-Auth-orange?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=for-the-badge&logo=supabase)

**An interactive authentication page featuring animated dragons that respond to user interactions**

[Live Demo](#) • [Documentation](#documentation) • [Installation](#installation)

</div>

---

## ✨ Features

- 🐉 **Interactive Dragons** - Two animated dragons that respond to user actions
- 🌙 **Dark/Light Mode** - Professional theme switching with smooth transitions
- 🌍 **Bilingual Support** - Full English and Arabic language support (RTL ready)
- 🔐 **Complete Auth Flow** - Login, Sign Up, and Password Recovery
- 🎨 **Glassmorphism UI** - Modern, elegant design with blur effects
- 📱 **Fully Responsive** - Works beautifully on all devices
- ⚡ **Supabase Ready** - Just add your credentials to connect

---

## 🐉 Dragon Behaviors

| State | Description |
|-------|-------------|
| 🕊️ **Free Roaming** | Dragons fly freely around the screen |
| 👀 **Watching Form** | Dragons focus on the form when user interacts |
| 👤 **Following User** | Dragons track the mouse cursor after typing |
| 🎉 **Celebrating** | Happy dance animation on successful login |

---

## 🚀 Installation

### Prerequisites

- Node.js 18+ 
- npm or bun

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ahmednour-me/LoginPage.git

# Navigate to project directory
cd dragon-auth

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🔧 Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Add Supabase Credentials

Edit `.env` with your Supabase project details:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database

Run the SQL schema in your Supabase SQL Editor:

```sql
-- Located in: database/schema.sql
```

This creates:
- `profiles` table for user data
- Trigger for automatic profile creation
- Row Level Security policies

---

## 📁 Project Structure

```
dragon-auth/
├── src/
│   ├── components/
│   │   ├── Dragon.tsx        # Main dragon animation component
│   │   ├── AuthForm.tsx      # Authentication form
│   │   └── SettingsBar.tsx   # Theme & language controls
│   ├── contexts/
│   │   ├── ThemeContext.tsx  # Dark/light mode management
│   │   └── LanguageContext.tsx # i18n support
│   ├── hooks/
│   │   └── useAuth.ts        # Authentication hook
│   └── lib/
│       └── supabase.ts       # Supabase client configuration
├── database/
│   └── schema.sql            # Database setup script
└── .env.example              # Environment template
```

---

## 🌍 Internationalization

The app supports English (default) and Arabic with RTL layout:

```typescript
// Switch language programmatically
const { setLanguage } = useLanguage();
setLanguage('ar'); // Arabic
setLanguage('en'); // English
```

### Adding New Languages

1. Add translations in `src/contexts/LanguageContext.tsx`
2. Update the language switcher in `SettingsBar.tsx`

---

## 🎨 Customization

### Theme Colors

Edit `src/index.css` to customize the color palette:

```css
:root {
  --primary: 30 15% 20%;
  --background: 40 30% 96%;
  /* ... */
}

.dark {
  --primary: 40 25% 90%;
  --background: 30 15% 8%;
  /* ... */
}
```

### Dragon Colors

Modify dragon colors in `src/components/Dragon.tsx`:

```typescript
const baseColor = isDark 
  ? (dragonIndex === 0 ? "#c4b5a0" : "#8fa8b8")
  : (dragonIndex === 0 ? "#2a2a2a" : "#1a3a4a");
```

---

## 📄 API Reference

### useAuth Hook

```typescript
const { 
  user,           // Current user object
  isLoading,      // Loading state
  isConfigured,   // Database connection status
  signIn,         // (email, password) => Promise
  signUp,         // (email, password, fullName?) => Promise
  resetPassword,  // (email) => Promise
  signOut,        // () => Promise
} = useAuth();
```

### useTheme Hook

```typescript
const { 
  theme,        // 'light' | 'dark'
  isDark,       // boolean
  toggleTheme,  // () => void
} = useTheme();
```

### useLanguage Hook

```typescript
const { 
  language,     // 'en' | 'ar'
  isRTL,        // boolean
  t,            // Translation object
  setLanguage,  // (lang) => void
} = useLanguage();
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Supabase | Backend & Auth |
| Zod | Form Validation |
| Lucide React | Icons |

---

## 👨‍💻 Developer

<div align="center">

**Developed by Ahmed Nour Ahmed from Qena, Egypt**

[![Portfolio](https://img.shields.io/badge/Portfolio-ahmednour.vercel.app-blue?style=for-the-badge)](https://ahmednour.vercel.app)

</div>

---

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with ❤️

</div>
