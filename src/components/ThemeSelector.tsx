import React, { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeConfig, GROUPED_THEMES } from '../config/themes';
import './ThemeSelector.scss';

interface ThemeOption {
  label: string;
  value: string;
  theme: ThemeConfig;
  disabled?: boolean;
}

export const ThemeSelector: React.FC = () => {
  const { 
    currentTheme, 
    isDarkMode, 
    lightThemes, 
    darkThemes, 
    isLoading, 
    changeTheme, 
    toggleDarkMode, 
    error 
  } = useTheme();

  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // Group themes by family for better organization
  const createThemeOptions = (themes: ThemeConfig[]): ThemeOption[] => {
    const options: ThemeOption[] = [];
    
    Object.entries(GROUPED_THEMES).forEach(([familyName, familyGroup]) => {
      const familyOptions = themes.filter(theme => 
        familyGroup.themes.some(ft => ft.id === theme.id)
      );

      if (familyOptions.length > 0) {
        // Add family header
        options.push({
          label: `--- ${familyName} ---`,
          value: `header-${familyName}`,
          theme: familyOptions[0],
          disabled: true
        });

        // Add themes from this family
        familyOptions.forEach(theme => {
          options.push({
            label: `${theme.name}${theme.color ? ` (${theme.color})` : ''}`,
            value: theme.id,
            theme
          });
        });
      }
    });

    return options;
  };

  const lightThemeOptions = createThemeOptions(lightThemes);
  const darkThemeOptions = createThemeOptions(darkThemes);

  const availableOptions = isDarkMode ? darkThemeOptions : lightThemeOptions;

  const handleThemeChange = async (themeId: string) => {
    if (themeId.startsWith('header-')) return; // Skip family headers
    
    try {
      setIsChangingTheme(true);
      await changeTheme(themeId);
    } catch (error) {
      console.error('Failed to change theme:', error);
    } finally {
      setIsChangingTheme(false);
    }
  };

  const handleDarkModeToggle = async () => {
    try {
      setIsChangingTheme(true);
      await toggleDarkMode();
    } catch (error) {
      console.error('Failed to toggle dark mode:', error);
    } finally {
      setIsChangingTheme(false);
    }
  };

  const clearPreview = () => {
    setPreviewTheme(null);
    // Clear preview and return to current theme
  };

  const customDropdownOption = (option: ThemeOption) => {
    if (option.disabled) {
      return (
        <div className="theme-option-header">
          <strong>{option.label}</strong>
        </div>
      );
    }

    return (
      <div className={`theme-option ${previewTheme === option.value ? 'preview-active' : ''}`}>
        <div className="theme-info">
          <span className="theme-name">{option.label}</span>
          <small className="theme-details">
            {option.theme.family} • {option.theme.category}
          </small>
        </div>
        <div className="theme-preview-dot">
          <div 
            className="color-swatch"
            style={{ 
              background: `linear-gradient(135deg, ${getThemeColor(option.theme)}, ${isDarkMode ? '#374151' : '#f8fafc'})` 
            }}
          />
        </div>
      </div>
    );
  };

  const getThemeColor = (theme: ThemeConfig): string => {
    // Use the actual color from theme config if available
    if (theme.color) {
      return theme.color;
    }

    // Fallback to color mapping for themes without explicit color
    const colorMap: Record<string, string> = {
      'teal': '#14B8A6',
      'blue': '#3B82F6',
      'green': '#10B981',
      'indigo': '#6366F1',
      'purple': '#8B5CF6',
      'pink': '#EC4899',
      'cyan': '#06B6D4',
      'orange': '#F97316',
      'amber': '#F59E0B',
      'lime': '#84CC16',
      'emerald': '#10B981'
    };

    return colorMap[theme.color?.toLowerCase() || ''] || '#6366F1';
  };

  if (isLoading) {
    return (
      <Card className="theme-selector-card">
        <div className="loading-container">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          <p>Loading theme settings...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="theme-selector-card">
      <h3 className="card-title">
        <i className="pi pi-palette" style={{ marginRight: '0.5rem' }} />
        Theme Settings
      </h3>

      {error && (
        <Message severity="error" text={error} className="mb-3" />
      )}

      <div className="theme-controls">
        {/* Dark Mode Toggle */}
        <div className="control-group">
          <label htmlFor="darkModeSwitch" className="control-label">
            <i className={`pi ${isDarkMode ? 'pi-moon' : 'pi-sun'}`} />
            Dark Mode
          </label>
          <InputSwitch 
            inputId="darkModeSwitch"
            checked={isDarkMode} 
            onChange={handleDarkModeToggle}
            disabled={isChangingTheme}
            className="ml-2"
          />
        </div>

        <Divider />

        {/* Theme Selection */}
        <div className="control-group">
          <label className="control-label">
            <i className="pi pi-brush" />
            Theme
          </label>
          <div className="theme-dropdown-container">
            <Dropdown
              value={currentTheme.id}
              options={availableOptions}
              onChange={(e) => handleThemeChange(e.value)}
              optionLabel="label"
              optionValue="value"
              disabled={isChangingTheme}
              placeholder="Select a theme"
              className="theme-dropdown"
              itemTemplate={customDropdownOption}
              valueTemplate={(option) => {
                if (!option) return currentTheme.name;
                const selectedTheme = availableOptions.find(opt => opt.value === option);
                return selectedTheme ? selectedTheme.label : currentTheme.name;
              }}
              filter
              filterBy="label"
              filterPlaceholder="Search themes..."
              emptyFilterMessage="No themes found"
              onMouseEnter={() => {}}
              onMouseLeave={clearPreview}
            />
            {isChangingTheme && (
              <div className="changing-indicator">
                <ProgressSpinner style={{ width: '20px', height: '20px' }} />
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* Current Theme Info */}
        <div className="current-theme-info">
          <h4 className="info-title">Current Theme</h4>
          <div className="theme-details-card">
            <div className="theme-header">
              <div 
                className="theme-preview-large"
                style={{ 
                  background: `linear-gradient(135deg, var(--primary-color), var(--surface-ground))` 
                }}
              />
              <div className="theme-meta">
                <h5>{currentTheme.name}</h5>
                <p>{currentTheme.family} Family</p>
                <small>{isDarkMode ? 'Dark' : 'Light'} Mode{currentTheme.color && ` • ${currentTheme.color}`}</small>
              </div>
            </div>
            
            {currentTheme.description && (
              <p className="theme-description">{currentTheme.description}</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Button
            label="Reset to Default"
            icon="pi pi-refresh"
            className="p-button-outlined p-button-sm"
            onClick={() => handleThemeChange('lara-light-teal')}
            disabled={isChangingTheme || currentTheme.id === 'lara-light-teal'}
          />
        </div>
      </div>
    </Card>
  );
};