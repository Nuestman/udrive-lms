# Theme System Documentation

## Overview

The SunLMS Theme System provides comprehensive theming capabilities including light/dark mode support, custom color schemes, and white-label branding integration. The system is built on CSS custom properties (CSS variables) and Tailwind CSS for maximum flexibility and performance.

## SunLMS Brand Colors

SunLMS uses a warm, professional color palette based on gold/bronze tones that convey trust, excellence, and professionalism.

### Primary Brand Colors

- **Primary**: `#B98C1B` - Main brand color (Gold/Bronze)
- **Secondary**: `#6A4F10` - Deep gold for secondary elements
- **Accent**: `#D4A730` - Lighter gold for highlights and accents
- **Brand Text**: `#150F00` - Dark brown for text and neutral elements

### Color Scale

The brand colors are available in a full 50-900 scale for all variations:

#### Primary Scale
- `primary-50`: `#fbf6ea` (251 246 234)
- `primary-100`: `#f6ebcf` (246 235 207)
- `primary-200`: `#ebd49a` (235 212 154)
- `primary-300`: `#dfbd65` (223 189 101)
- `primary-400`: `#d4a730` (212 167 48)
- `primary-500`: `#B98C1B` (185 140 27) - **Base color**
- `primary-600`: `#916d15` (145 109 21)
- `primary-700`: `#6a4f10` (106 79 16)
- `primary-800`: `#44320a` (68 50 10)
- `primary-900`: `#2b1f06` (43 31 6)

#### Secondary Scale
Uses the same scale as primary, typically defaults to `primary-700` (`#6A4F10`)

#### Accent Scale
Uses the same scale as primary, typically defaults to `primary-400` (`#D4A730`)

### Usage Guidelines

- **Primary**: Use for main actions, buttons, links, and key UI elements
- **Secondary**: Use for secondary actions and less prominent elements
- **Accent**: Use for highlights, call-to-action elements, and emphasis
- **Brand Text**: Use for neutral text elements and dark backgrounds

## Architecture

### Frontend Components

#### ThemeProvider
```typescript
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Provider wraps the entire application
<ThemeProvider>
  <App />
</ThemeProvider>

// Hook for accessing theme functionality
const { theme, setTheme, resolvedTheme, forceThemeUpdate } = useTheme();
```

#### ThemeToggle Component
```typescript
import ThemeToggle from './components/common/ThemeToggle';

// Theme toggle button in header
<ThemeToggle className="ml-2" showLabel={false} />
```

### CSS Architecture

#### CSS Variables System
```css
/* Light theme colors */
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  --color-text-primary: #171717;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  --color-border-primary: #e5e7eb;
  --color-border-secondary: #d1d5db;
  --color-accent-primary: #B98C1B; /* SunLMS brand primary */
  --color-accent-secondary: #d4a730; /* SunLMS brand accent */
  --color-accent-light: #fbf6ea; /* SunLMS brand primary-50 */
  --color-success: #16a34a;
  --color-warning: #f59e0b;
  --color-error: #dc2626;
  --color-info: #06b6d4;

  /* SunLMS Brand Colors */
  --brand-primary: #B98C1B;
  --brand-primary-50: 251 246 234;
  --brand-primary-100: 246 235 207;
  --brand-primary-200: 235 212 154;
  --brand-primary-300: 223 189 101;
  --brand-primary-400: 212 167 48;
  --brand-primary-500: 185 140 27;
  --brand-primary-600: 145 109 21;
  --brand-primary-700: 106 79 16;
  --brand-primary-800: 68 50 10;
  --brand-primary-900: 43 31 6;

  --brand-secondary: #6a4f10;
  --brand-secondary-50: 251 246 234;
  /* ... full scale same as primary ... */

  --brand-accent: #B98C1B;
  --brand-accent-50: 251 246 234;
  /* ... full scale same as primary ... */

  --brand-text: #150F00;
  --brand-neutral-950: 21 15 0;
}

/* Dark theme colors */
.dark {
  --color-bg-primary: #0a0a0a;
  --color-bg-secondary: #111827;
  --color-bg-tertiary: #1f2937;
  --color-text-primary: #ededed;
  --color-text-secondary: #d1d5db;
  --color-text-tertiary: #9ca3af;
  --color-border-primary: #374151;
  --color-border-secondary: #4b5563;
  --color-accent-primary: #B98C1B; /* SunLMS brand primary */
  --color-accent-secondary: #d4a730; /* SunLMS brand accent */
  --color-accent-light: #44320a; /* Darker tone for dark mode */
  --color-success: #34d399;
  --color-warning: #fbbf24;
  --color-error: #f87171;
  --color-info: #22d3ee;
}
```

#### Tailwind Configuration
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        'theme-primary': 'var(--color-bg-primary)',
        'theme-secondary': 'var(--color-bg-secondary)',
        'theme-tertiary': 'var(--color-bg-tertiary)',
        'theme-text-primary': 'var(--color-text-primary)',
        'theme-text-secondary': 'var(--color-text-secondary)',
        'theme-text-tertiary': 'var(--color-text-tertiary)',
        'theme-border-primary': 'var(--color-border-primary)',
        'theme-border-secondary': 'var(--color-border-secondary)',
        'theme-accent-primary': 'var(--color-accent-primary)',
        'theme-accent-secondary': 'var(--color-accent-secondary)',
        'theme-accent-light': 'var(--color-accent-light)',
        'theme-success': 'var(--color-success)',
        'theme-warning': 'var(--color-warning)',
        'theme-error': 'var(--color-error)',
        'theme-info': 'var(--color-info)',
      }
    }
  }
};
```

## Theme Types

### Light Theme
- **Background**: White and light gray tones
- **Text**: Dark gray and black
- **Accents**: Blue and primary brand colors
- **Borders**: Light gray borders
- **Use Case**: Default theme for most users, good for daytime use

### Dark Theme
- **Background**: Dark gray and black tones
- **Text**: Light gray and white
- **Accents**: Lighter blue and brand colors
- **Borders**: Dark gray borders
- **Use Case**: Reduced eye strain, good for low-light environments

### Auto Theme
- **Behavior**: Follows system preference
- **Detection**: Uses `prefers-color-scheme` media query
- **Updates**: Automatically switches when system theme changes
- **Use Case**: Seamless integration with user's system preferences

## Implementation

### Theme Context
```typescript
// ThemeContext.tsx
interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  forceThemeUpdate: (theme: Theme) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return savedTheme || 'light';
  });

  // Apply initial theme immediately
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    root.classList.add(resolvedTheme);
    body.classList.add(resolvedTheme);
  }, []);

  // Update resolved theme when theme changes
  useEffect(() => {
    const newResolvedTheme = resolveTheme(theme);
    setResolvedTheme(newResolvedTheme);
    
    const root = document.documentElement;
    const body = document.body;
    
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    root.classList.add(newResolvedTheme);
    body.classList.add(newResolvedTheme);
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes when 'auto' is selected
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const newResolvedTheme = resolveTheme(theme);
        setResolvedTheme(newResolvedTheme);
        
        const root = document.documentElement;
        const body = document.body;
        
        root.classList.remove('light', 'dark');
        body.classList.remove('light', 'dark');
        
        root.classList.add(newResolvedTheme);
        body.classList.add(newResolvedTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const resolveTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const forceThemeUpdate = (newTheme: Theme) => {
    setThemeState(newTheme);
    const newResolvedTheme = resolveTheme(newTheme);
    setResolvedTheme(newResolvedTheme);
    
    const root = document.documentElement;
    const body = document.body;
    
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    root.classList.add(newResolvedTheme);
    body.classList.add(newResolvedTheme);
    
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      forceThemeUpdate
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Theme Toggle Component
```typescript
// ThemeToggle.tsx
const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, setTheme, resolvedTheme, forceThemeUpdate } = useTheme();
  const { updateUserSettings } = useSettings();

  const getIcon = () => {
    if (theme === 'auto') {
      return <Monitor className="w-4 h-4" />;
    }
    return resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  };

  const getNextTheme = (): Theme => {
    switch (theme) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'auto';
      case 'auto':
        return 'light';
      default:
        return 'light';
    }
  };

  const handleToggle = async () => {
    const newTheme = getNextTheme();
    forceThemeUpdate(newTheme);
    
    // Save to user settings
    try {
      await updateUserSettings({
        appearance: {
          theme: newTheme
        }
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto';
      default:
        return 'Light';
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${className}`}
      title={`Current theme: ${getLabel()}. Click to cycle through themes.`}
    >
      {getIcon()}
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {getLabel()}
        </span>
      )}
    </button>
  );
};
```

## Integration with Settings

### Appearance Settings Modal
```typescript
// AppearanceSettingsModal.tsx
const AppearanceSettingsModal: React.FC<AppearanceSettingsModalProps> = ({ isOpen, onClose }) => {
  const { userSettings, updateUserSettings } = useSettings();
  const { theme, setTheme, forceThemeUpdate } = useTheme();
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    compactMode: false,
    sidebarCollapsed: false,
    fontSize: 'medium',
    highContrast: false
  });

  const handleThemeChange = async (newTheme: Theme) => {
    setAppearanceSettings(prev => ({ ...prev, theme: newTheme }));
    forceThemeUpdate(newTheme);
    
    try {
      await updateUserSettings({
        appearance: {
          theme: newTheme
        }
      });
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Theme Settings
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              appearanceSettings.theme === 'light'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <span className="text-sm font-medium">Light</span>
          </button>
          
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              appearanceSettings.theme === 'dark'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Moon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <span className="text-sm font-medium">Dark</span>
          </button>
          
          <button
            onClick={() => handleThemeChange('auto')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              appearanceSettings.theme === 'auto'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Monitor className="w-6 h-6 mx-auto mb-2 text-gray-500" />
            <span className="text-sm font-medium">Auto</span>
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Display Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Compact Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reduce spacing and padding for more content
              </p>
            </div>
            <Toggle
              enabled={appearanceSettings.compactMode}
              onChange={(enabled) => setAppearanceSettings(prev => ({ ...prev, compactMode: enabled }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">High Contrast</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Increase contrast for better accessibility
              </p>
            </div>
            <Toggle
              enabled={appearanceSettings.highContrast}
              onChange={(enabled) => setAppearanceSettings(prev => ({ ...prev, highContrast: enabled }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

## White Label Integration

### Dynamic Color Application
```typescript
// WhiteLabelContext.tsx
const applyCustomStyles = () => {
  if (!whiteLabelSettings) return;

  const root = document.documentElement;
  
  // Apply custom colors
  if (whiteLabelSettings.primaryColor) {
    root.style.setProperty('--color-primary', whiteLabelSettings.primaryColor);
  }
  if (whiteLabelSettings.secondaryColor) {
    root.style.setProperty('--color-secondary', whiteLabelSettings.secondaryColor);
  }
  if (whiteLabelSettings.accentColor) {
    root.style.setProperty('--color-accent', whiteLabelSettings.accentColor);
  }

  // Apply custom CSS
  if (whiteLabelSettings.customCss) {
    let customStyleElement = document.getElementById('white-label-custom-css');
    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.id = 'white-label-custom-css';
      document.head.appendChild(customStyleElement);
    }
    customStyleElement.textContent = whiteLabelSettings.customCss;
  }
};
```

### Theme-Aware Components
```typescript
// Example of theme-aware component
const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-white dark:bg-gray-800 
      border border-gray-200 dark:border-gray-700 
      rounded-lg shadow-sm
      ${className}
    `}>
      {children}
    </div>
  );
};

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '' }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-gray-500',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500'
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </button>
  );
};
```

## Performance Optimization

### CSS Optimization
```css
/* Optimized CSS variables with fallbacks */
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
}

.dark {
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
}

/* Use CSS custom properties for dynamic theming */
.theme-aware {
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-text-primary, #111827);
  border-color: var(--color-border-primary, #e5e7eb);
}

/* Optimize for performance with will-change */
.theme-transition {
  will-change: background-color, color, border-color;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

### JavaScript Optimization
```typescript
// Optimized theme switching with debouncing
const debouncedThemeUpdate = useMemo(
  () => debounce((newTheme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Use requestAnimationFrame for smooth transitions
    requestAnimationFrame(() => {
      root.classList.remove('light', 'dark');
      body.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      body.classList.add(newTheme);
    });
  }, 100),
  []
);

// Memoized theme resolution
const resolvedTheme = useMemo(() => {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}, [theme]);
```

## Accessibility

### High Contrast Support
```css
/* High contrast theme support */
.high-contrast {
  --color-bg-primary: #000000;
  --color-bg-secondary: #1a1a1a;
  --color-text-primary: #ffffff;
  --color-text-secondary: #cccccc;
  --color-border-primary: #ffffff;
  --color-border-secondary: #cccccc;
}

.high-contrast.dark {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f0f0f0;
  --color-text-primary: #000000;
  --color-text-secondary: #333333;
  --color-border-primary: #000000;
  --color-border-secondary: #333333;
}
```

### Reduced Motion Support
```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .theme-transition {
    transition: none;
  }
  
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support
```typescript
// Screen reader friendly theme toggle
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="theme-toggle"
    >
      {theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
};
```

## Browser Support

### CSS Custom Properties Support
```typescript
// Feature detection for CSS custom properties
const supportsCSSVariables = (): boolean => {
  return window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--test)');
};

// Fallback for older browsers
const applyThemeFallback = (theme: 'light' | 'dark') => {
  if (!supportsCSSVariables()) {
    // Apply theme using class-based approach
    document.documentElement.className = theme;
  }
};
```

### Media Query Support
```typescript
// Check for prefers-color-scheme support
const supportsColorScheme = (): boolean => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all';
};

// Fallback for browsers without prefers-color-scheme support
const getSystemTheme = (): 'light' | 'dark' => {
  if (!supportsColorScheme()) {
    return 'light'; // Default to light theme
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
```

## Testing

### Theme Testing Utilities
```typescript
// Test utilities for theme switching
export const testThemeSwitching = () => {
  const { setTheme, theme } = useTheme();
  
  // Test light theme
  setTheme('light');
  expect(document.documentElement.classList.contains('light')).toBe(true);
  
  // Test dark theme
  setTheme('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  
  // Test auto theme
  setTheme('auto');
  expect(theme).toBe('auto');
};

// Test CSS variable application
export const testCSSVariables = () => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  expect(computedStyle.getPropertyValue('--color-bg-primary')).toBeDefined();
  expect(computedStyle.getPropertyValue('--color-text-primary')).toBeDefined();
};
```

### Visual Regression Testing
```typescript
// Visual regression tests for themes
describe('Theme Visual Tests', () => {
  it('should render light theme correctly', () => {
    render(<App />, { theme: 'light' });
    expect(screen.getByTestId('app')).toMatchSnapshot('light-theme');
  });
  
  it('should render dark theme correctly', () => {
    render(<App />, { theme: 'dark' });
    expect(screen.getByTestId('app')).toMatchSnapshot('dark-theme');
  });
});
```

## Troubleshooting

### Common Issues

#### Theme Not Applying
```typescript
// Debug theme application
const debugThemeApplication = () => {
  console.log('Current theme:', theme);
  console.log('Resolved theme:', resolvedTheme);
  console.log('Document classes:', document.documentElement.className);
  console.log('Body classes:', document.body.className);
  
  // Check CSS variables
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  console.log('CSS variables:', {
    bgPrimary: computedStyle.getPropertyValue('--color-bg-primary'),
    textPrimary: computedStyle.getPropertyValue('--color-text-primary')
  });
};
```

#### Flash of Unstyled Content (FOUC)
```typescript
// Prevent FOUC by applying theme immediately
const preventFOUC = () => {
  // Apply theme before React hydration
  const savedTheme = localStorage.getItem('theme') || 'light';
  const resolvedTheme = savedTheme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : savedTheme;
  
  document.documentElement.classList.add(resolvedTheme);
  document.body.classList.add(resolvedTheme);
};
```

#### Performance Issues
```typescript
// Optimize theme switching performance
const optimizeThemeSwitching = () => {
  // Use CSS transitions instead of JavaScript animations
  const style = document.createElement('style');
  style.textContent = `
    * {
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }
  `;
  document.head.appendChild(style);
  
  // Debounce theme updates
  const debouncedUpdate = debounce((newTheme) => {
    applyTheme(newTheme);
  }, 100);
};
```

## Future Enhancements

### Planned Features
- **Custom Theme Builder**: Visual theme creation interface
- **Theme Presets**: Pre-built theme collections
- **Advanced Color Schemes**: HSL color space support
- **Theme Animations**: Smooth transition animations
- **Theme Sharing**: Share custom themes between users
- **Theme Marketplace**: Community theme marketplace
- **Advanced Accessibility**: Enhanced accessibility features
- **Theme Analytics**: Track theme usage and preferences

### Integration Opportunities
- **Design Systems**: Integration with design system tools
- **Brand Guidelines**: Automated brand compliance
- **Color Theory**: Advanced color theory integration
- **User Preferences**: Machine learning-based theme recommendations
- **Seasonal Themes**: Automatic seasonal theme switching
- **Time-based Themes**: Themes that change based on time of day
- **Location-based Themes**: Themes based on user location
- **Mood-based Themes**: Themes based on user activity patterns
