import React, { useState } from 'react';
import FeaturePage from './FeaturePage';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { useTheme } from '../contexts/ThemeContext';


const FeaturePageThemeDemo: React.FC = () => {
  const { 
    currentTheme, 
    isDarkMode, 
    availableThemes, 
    changeTheme, 
    toggleDarkMode, 
    isLoading: themeLoading,
    error: themeError 
  } = useTheme();
  const [isChangingTheme, setIsChangingTheme] = useState(false);

  const handleThemeChange = async (themeId: string) => {
    setIsChangingTheme(true);
    
    try {
      await changeTheme(themeId);
      // Small delay for visual feedback
      setTimeout(() => setIsChangingTheme(false), 300);
    } catch (error) {
      console.error('Failed to change theme:', error);
      setIsChangingTheme(false);
    }
  };

  const handleDarkModeToggle = async () => {
    setIsChangingTheme(true);
    
    try {
      await toggleDarkMode();
      setTimeout(() => setIsChangingTheme(false), 300);
    } catch (error) {
      console.error('Failed to toggle dark mode:', error);
      setIsChangingTheme(false);
    }
  };

  const handleCreateDemo = () => {
    console.log('Demo action triggered');
  };

  const handleViewDocs = () => {
    console.log('View documentation');
  };

  return (
    <FeaturePage
      title="FeaturePage Theme Demo"
      subtitle="Universal Theme Compatibility"
      description="This demonstration shows how the FeaturePage component automatically adapts to any PrimeReact theme. Change the theme using the dropdown below to see the component's styling adapt in real-time."
      icon="pi-palette"
      badge={{
        text: "Live Demo",
        severity: "success"
      }}
      stats={[
        {
          label: "Available Themes",
          value: availableThemes.length.toString(),
          icon: "pi-palette",
          color: "#8b5cf6"
        },
        {
          label: "Current Mode",
          value: isDarkMode ? "Dark" : "Light",
          icon: isDarkMode ? "pi-moon" : "pi-sun",
          color: "#10b981"
        },
        {
          label: "Theme Family",
          value: currentTheme.family,
          icon: "pi-bookmark",
          color: "#3b82f6"
        }
      ]}
      actions={[
        {
          label: "Create Demo",
          icon: "pi pi-plus",
          onClick: handleCreateDemo,
          variant: "primary"
        },
        {
          label: "View Docs",
          icon: "pi pi-book",
          onClick: handleViewDocs,
          variant: "secondary",
          outlined: true
        }
      ]}
      animated={true}
      loading={isChangingTheme || themeLoading}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {themeError && (
          <Card className="mb-4" style={{ borderColor: 'var(--red-500)', borderWidth: '2px' }}>
            <h3 style={{ color: 'var(--red-500)' }}>⚠️ Theme Error</h3>
            <p style={{ color: 'var(--red-600)' }}>{themeError}</p>
          </Card>
        )}

        <Card className="mb-4">
          <h3>🎨 Live Theme System</h3>
          <p className="mb-3">
            This demo uses the integrated ThemeContext to show real-time theme switching. 
            All {availableThemes.length} themes are available with automatic persistence.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="darkModeSwitch">
                <i className={`pi ${isDarkMode ? 'pi-moon' : 'pi-sun'}`} style={{ marginRight: '0.5rem' }} />
                Dark Mode
              </label>
              <InputSwitch
                inputId="darkModeSwitch"
                checked={isDarkMode}
                onChange={handleDarkModeToggle}
                disabled={isChangingTheme}
              />
            </div>
          </div>
          
          <Dropdown
            value={currentTheme.id}
            options={availableThemes.map(theme => ({ 
              label: `${theme.name} (${theme.category})`, 
              value: theme.id,
              family: theme.family
            }))}
            onChange={(e) => handleThemeChange(e.value)}
            optionLabel="label"
            placeholder="Select a theme..."
            className="w-full mb-3"
            disabled={isChangingTheme}
            filter
            filterBy="label,family"
            filterPlaceholder="Search themes..."
            emptyFilterMessage="No themes found"
          />
          
          {isChangingTheme && (
            <div className="text-center p-3">
              <i className="pi pi-spin pi-spinner mr-2" />
              Applying theme changes...
            </div>
          )}
        </Card>

        <Card className="mb-4">
          <h3>📋 Current Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <strong>Theme:</strong> {currentTheme.name}
            </div>
            <div>
              <strong>Family:</strong> {currentTheme.family}
            </div>
            <div>
              <strong>Category:</strong> {currentTheme.category}
            </div>
            <div>
              <strong>Mode:</strong> {isDarkMode ? 'Dark' : 'Light'}
            </div>
          </div>
          
          {currentTheme.description && (
            <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
              {currentTheme.description}
            </p>
          )}
          
          <div className="mt-3">
            <Button 
              label="Reset to Default" 
              icon="pi pi-refresh" 
              onClick={() => handleThemeChange('lara-light-teal')}
              className="p-button-outlined"
              disabled={isChangingTheme || currentTheme.id === 'lara-light-teal'}
            />
          </div>
        </Card>

        <Card>
          <h3>✨ Theme Features Demonstrated</h3>
          <ul style={{ lineHeight: '1.6' }}>
            <li><strong>Dynamic Gradients:</strong> Header background adapts to theme colors</li>
            <li><strong>Responsive Colors:</strong> All text and UI elements use theme variables</li>
            <li><strong>Smart Shadows:</strong> Shadow depth adjusts for light/dark themes</li>
            <li><strong>Border Radius:</strong> Corners adapt to theme design language</li>
            <li><strong>Smooth Transitions:</strong> Theme changes animate smoothly</li>
            <li><strong>Persistent Preferences:</strong> Theme selection is saved to your account</li>
            <li><strong>Dark Mode Intelligence:</strong> Automatically finds matching dark/light variants</li>
          </ul>
        </Card>
      </div>
    </FeaturePage>
  );
};

export default FeaturePageThemeDemo;