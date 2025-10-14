import React, { useState } from 'react';
import FeaturePage from './FeaturePage';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

interface ThemeOption {
  label: string;
  value: string;
  import: string;
}

const themes: ThemeOption[] = [
  { label: 'Lara Light Teal (Current)', value: 'lara-light-teal', import: 'primereact/resources/themes/lara-light-teal/theme.css' },
  { label: 'Lara Dark Teal', value: 'lara-dark-teal', import: 'primereact/resources/themes/lara-dark-teal/theme.css' },
  { label: 'Saga Blue', value: 'saga-blue', import: 'primereact/resources/themes/saga-blue/theme.css' },
  { label: 'Saga Green', value: 'saga-green', import: 'primereact/resources/themes/saga-green/theme.css' },
  { label: 'Vela Blue (Dark)', value: 'vela-blue', import: 'primereact/resources/themes/vela-blue/theme.css' },
  { label: 'Material Design Light', value: 'md-light-indigo', import: 'primereact/resources/themes/md-light-indigo/theme.css' },
  { label: 'Material Design Dark', value: 'md-dark-indigo', import: 'primereact/resources/themes/md-dark-indigo/theme.css' },
  { label: 'Bootstrap Light', value: 'bootstrap4-light-blue', import: 'primereact/resources/themes/bootstrap4-light-blue/theme.css' }
];

const FeaturePageThemeDemo: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(themes[0]);
  const [isChangingTheme, setIsChangingTheme] = useState(false);

  const changeTheme = async (theme: ThemeOption) => {
    setIsChangingTheme(true);
    
    try {
      // Remove existing theme link
      const existingThemeLink = document.querySelector('link[data-theme]');
      if (existingThemeLink) {
        existingThemeLink.remove();
      }
      
      // Add new theme link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://unpkg.com/${theme.import}`;
      link.setAttribute('data-theme', theme.value);
      document.head.appendChild(link);
      
      // Update body class for theme-specific styling
      document.body.className = document.body.className.replace(/p-theme-\S+/g, '');
      document.body.classList.add(`p-theme-${theme.value}`);
      
      setSelectedTheme(theme);
      
      // Small delay to let the theme load
      setTimeout(() => setIsChangingTheme(false), 300);
    } catch (error) {
      console.error('Failed to load theme:', error);
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
          label: "Supported Themes",
          value: "22+",
          icon: "pi-palette",
          color: "#8b5cf6"
        },
        {
          label: "Auto-Adaptation",
          value: "100%",
          icon: "pi-check-circle",
          color: "#10b981"
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
      headerGradient="linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)"
      animated={true}
      loading={isChangingTheme}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card className="mb-4">
          <h3>🎨 Theme Selector</h3>
          <p className="mb-3">
            Select a PrimeReact theme below to see how the FeaturePage component
            automatically adapts its colors, shadows, borders, and styling.
          </p>
          
          <Dropdown
            value={selectedTheme}
            options={themes}
            onChange={(e) => changeTheme(e.value)}
            optionLabel="label"
            placeholder="Select a theme..."
            className="w-full mb-3"
            disabled={isChangingTheme}
          />
          
          {isChangingTheme && (
            <div className="text-center p-3">
              <i className="pi pi-spin pi-spinner mr-2" />
              Loading theme...
            </div>
          )}
        </Card>

        <Card>
          <h3>📋 Current Theme: {selectedTheme.label}</h3>
          <p>
            The FeaturePage is currently using the <strong>{selectedTheme.label}</strong> theme.
            All colors, shadows, borders, and styling are automatically derived from the
            theme's CSS variables.
          </p>
          
          <div className="mt-3">
            <Button 
              label="Reset to Default" 
              icon="pi pi-refresh" 
              onClick={() => changeTheme(themes[0])}
              className="p-button-outlined"
              disabled={isChangingTheme || selectedTheme === themes[0]}
            />
          </div>
        </Card>
      </div>
    </FeaturePage>
  );
};

export default FeaturePageThemeDemo;