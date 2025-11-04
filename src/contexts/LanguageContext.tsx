import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  availableLanguages: { code: string; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translation function - in a real app, you'd use a proper i18n library
const translations: Record<string, Record<string, string>> = {
  en: {
    'settings.profile': 'Profile Settings',
    'settings.appearance': 'Appearance Settings',
    'settings.security': 'Security Settings',
    'settings.notifications': 'Notification Settings',
    'settings.school': 'School Settings',
    'settings.system': 'System Settings',
    'settings.whiteLabel': 'White Label Settings',
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
    'profile.firstName': 'First Name',
    'profile.lastName': 'Last Name',
    'profile.email': 'Email Address',
    'profile.phone': 'Phone Number',
    'profile.avatar': 'Avatar',
    'appearance.theme': 'Theme',
    'appearance.language': 'Language',
    'appearance.timezone': 'Timezone',
    'appearance.compactMode': 'Compact Mode',
    'security.password': 'Password',
    'security.twoFactor': 'Two-Factor Authentication',
    'notifications.email': 'Email Notifications',
    'notifications.push': 'Push Notifications',
    'notifications.sms': 'SMS Notifications',
  },
  es: {
    'settings.profile': 'Configuración de Perfil',
    'settings.appearance': 'Configuración de Apariencia',
    'settings.security': 'Configuración de Seguridad',
    'settings.notifications': 'Configuración de Notificaciones',
    'settings.school': 'Configuración de Escuela',
    'settings.system': 'Configuración del Sistema',
    'settings.whiteLabel': 'Configuración de Marca Blanca',
    'common.save': 'Guardar Cambios',
    'common.cancel': 'Cancelar',
    'common.loading': 'Cargando...',
    'common.success': 'Éxito',
    'common.error': 'Error',
    'profile.firstName': 'Nombre',
    'profile.lastName': 'Apellido',
    'profile.email': 'Dirección de Correo',
    'profile.phone': 'Número de Teléfono',
    'profile.avatar': 'Avatar',
    'appearance.theme': 'Tema',
    'appearance.language': 'Idioma',
    'appearance.timezone': 'Zona Horaria',
    'appearance.compactMode': 'Modo Compacto',
    'security.password': 'Contraseña',
    'security.twoFactor': 'Autenticación de Dos Factores',
    'notifications.email': 'Notificaciones por Correo',
    'notifications.push': 'Notificaciones Push',
    'notifications.sms': 'Notificaciones SMS',
  },
  fr: {
    'settings.profile': 'Paramètres de Profil',
    'settings.appearance': 'Paramètres d\'Apparence',
    'settings.security': 'Paramètres de Sécurité',
    'settings.notifications': 'Paramètres de Notifications',
    'settings.school': 'Paramètres d\'École',
    'settings.system': 'Paramètres Système',
    'settings.whiteLabel': 'Paramètres de Marque Blanche',
    'common.save': 'Enregistrer les Modifications',
    'common.cancel': 'Annuler',
    'common.loading': 'Chargement...',
    'common.success': 'Succès',
    'common.error': 'Erreur',
    'profile.firstName': 'Prénom',
    'profile.lastName': 'Nom de Famille',
    'profile.email': 'Adresse Email',
    'profile.phone': 'Numéro de Téléphone',
    'profile.avatar': 'Avatar',
    'appearance.theme': 'Thème',
    'appearance.language': 'Langue',
    'appearance.timezone': 'Fuseau Horaire',
    'appearance.compactMode': 'Mode Compact',
    'security.password': 'Mot de Passe',
    'security.twoFactor': 'Authentification à Deux Facteurs',
    'notifications.email': 'Notifications Email',
    'notifications.push': 'Notifications Push',
    'notifications.sms': 'Notifications SMS',
  }
};

const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { userSettings, updateUserSettings } = useSettings();
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Initialize language from user settings
  useEffect(() => {
    if (userSettings?.appearance?.language) {
      setCurrentLanguage(userSettings.appearance.language);
    }
  }, [userSettings]);

  const setLanguage = async (language: string) => {
    setCurrentLanguage(language);
    
    // Update user settings
    try {
      await updateUserSettings({
        appearance: {
          language: language
        }
      });
    } catch (error) {
      console.error('Failed to update language preference:', error);
    }
  };

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en'][key] || key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
