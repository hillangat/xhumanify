import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { ThemeConfig, getThemeById, getDefaultTheme, AVAILABLE_THEMES } from '../config/themes';

interface ThemeContextType {
  currentTheme: ThemeConfig;
  isDarkMode: boolean;
  availableThemes: ThemeConfig[];
  lightThemes: ThemeConfig[];
  darkThemes: ThemeConfig[];
  isLoading: boolean;
  changeTheme: (themeId: string) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  refreshThemes: () => Promise<void>;
  error: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const client = generateClient<Schema>();
  
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(getDefaultTheme());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Categorized themes for easier selection
  const lightThemes = AVAILABLE_THEMES.filter(theme => theme.category === 'Light');
  const darkThemes = AVAILABLE_THEMES.filter(theme => theme.category === 'Dark');

  // Initialize theme system
  useEffect(() => {
    initializeTheme();
  }, []);

  const initializeTheme = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const user = await getCurrentUser();
      const currentUserId = user.userId;
      setUserId(currentUserId);

      // Load user settings from database
      const userSettings = await loadUserSettings(currentUserId);
      
      if (userSettings) {
        // Apply saved theme settings
        const savedTheme = getThemeById(userSettings.theme || 'lara-light-teal') || getDefaultTheme();
        const savedDarkMode = userSettings.darkMode || false;
        
        await applyTheme(savedTheme, savedDarkMode, false); // Don't save to DB during initialization
        setCurrentTheme(savedTheme);
        setIsDarkMode(savedDarkMode);
      } else {
        // No saved settings, create default settings
        const defaultTheme = getDefaultTheme();
        await createUserSettings(currentUserId, defaultTheme.id, false);
        await applyTheme(defaultTheme, false, false);
        setCurrentTheme(defaultTheme);
        setIsDarkMode(false);
      }

    } catch (error) {
      console.error('Failed to initialize theme:', error);
      setError('Failed to load theme settings');
      
      // Fallback to default theme
      const defaultTheme = getDefaultTheme();
      await applyTheme(defaultTheme, false, false);
      setCurrentTheme(defaultTheme);
      setIsDarkMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSettings = async (userId: string) => {
    try {
      const { data: settings } = await client.models.UserSettings.list({
        filter: { userId: { eq: userId } },
        limit: 1
      });
      
      return settings && settings.length > 0 ? settings[0] : null;
    } catch (error) {
      console.error('Failed to load user settings:', error);
      return null;
    }
  };

  const createUserSettings = async (userId: string, themeId: string, darkMode: boolean) => {
    try {
      await client.models.UserSettings.create({
        userId,
        theme: themeId,
        darkMode,
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to create user settings:', error);
    }
  };

  const updateUserSettings = async (userId: string, themeId: string, darkMode: boolean) => {
    try {
      // Get existing settings first
      const existingSettings = await loadUserSettings(userId);
      
      if (existingSettings) {
        // Update existing settings
        await client.models.UserSettings.update({
          id: existingSettings.id,
          theme: themeId,
          darkMode,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new settings if none exist
        await createUserSettings(userId, themeId, darkMode);
      }
    } catch (error) {
      console.error('Failed to update user settings:', error);
      throw error;
    }
  };

  const applyTheme = async (theme: ThemeConfig, darkMode: boolean, persistent: boolean = true) => {
    try {
      // Remove existing theme links
      const existingThemeLinks = document.querySelectorAll('link[data-theme-type="primereact"]');
      existingThemeLinks.forEach(link => link.remove());

      // Apply the selected theme
      const themeToApply = darkMode && theme.category === 'Light' 
        ? findDarkVariant(theme) || theme 
        : !darkMode && theme.category === 'Dark'
        ? findLightVariant(theme) || theme
        : theme;

      // Create and add new theme link
      const themeLink = document.createElement('link');
      themeLink.rel = 'stylesheet';
      themeLink.href = `https://unpkg.com/${themeToApply.cssPath}`;
      themeLink.setAttribute('data-theme-type', 'primereact');
      themeLink.setAttribute('data-theme-id', themeToApply.id);
      
      // Add to document head
      document.head.appendChild(themeLink);

      // Update document classes for theme-specific styling
      updateDocumentClasses(themeToApply, darkMode);

      // Wait for theme to load
      await new Promise((resolve) => {
        themeLink.onload = resolve;
        themeLink.onerror = resolve; // Resolve even on error to prevent hanging
        setTimeout(resolve, 1000); // Fallback timeout
      });

      // Save to database if this is a user-initiated change
      if (persistent && userId) {
        await updateUserSettings(userId, themeToApply.id, darkMode);
      }

      // Update local state
      setCurrentTheme(themeToApply);
      setIsDarkMode(darkMode);

    } catch (error) {
      console.error('Failed to apply theme:', error);
      throw error;
    }
  };

  const findDarkVariant = (lightTheme: ThemeConfig): ThemeConfig | null => {
    // Try to find dark variant of the same family and color
    const darkVariant = darkThemes.find(dark => 
      dark.family === lightTheme.family && 
      dark.color === lightTheme.color
    );
    
    if (darkVariant) return darkVariant;

    // Fallback to any dark theme from the same family
    return darkThemes.find(dark => dark.family === lightTheme.family) || null;
  };

  const findLightVariant = (darkTheme: ThemeConfig): ThemeConfig | null => {
    // Try to find light variant of the same family and color
    const lightVariant = lightThemes.find(light => 
      light.family === darkTheme.family && 
      light.color === darkTheme.color
    );
    
    if (lightVariant) return lightVariant;

    // Fallback to any light theme from the same family
    return lightThemes.find(light => light.family === darkTheme.family) || null;
  };

  const updateDocumentClasses = (theme: ThemeConfig, darkMode: boolean) => {
    // Remove existing theme classes
    document.body.className = document.body.className.replace(/p-theme-\S+/g, '');
    
    // Add new theme class
    document.body.classList.add(`p-theme-${theme.id}`);
    
    // Add dark mode class if applicable
    if (darkMode || theme.category === 'Dark') {
      document.body.classList.add('p-dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('p-dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Add theme family class for specific styling
    document.body.classList.add(`p-theme-family-${theme.family.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const changeTheme = async (themeId: string) => {
    try {
      setError(null);
      const newTheme = getThemeById(themeId);
      
      if (!newTheme) {
        throw new Error(`Theme with id "${themeId}" not found`);
      }

      await applyTheme(newTheme, isDarkMode);
      
    } catch (error) {
      console.error('Failed to change theme:', error);
      setError('Failed to change theme');
      throw error;
    }
  };

  const toggleDarkMode = async () => {
    try {
      setError(null);
      const newDarkMode = !isDarkMode;
      await applyTheme(currentTheme, newDarkMode);
      
    } catch (error) {
      console.error('Failed to toggle dark mode:', error);
      setError('Failed to toggle dark mode');
      throw error;
    }
  };

  const refreshThemes = async () => {
    await initializeTheme();
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    isDarkMode,
    availableThemes: AVAILABLE_THEMES,
    lightThemes,
    darkThemes,
    isLoading,
    changeTheme,
    toggleDarkMode,
    refreshThemes,
    error
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};