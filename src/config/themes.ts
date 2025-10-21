// PrimeReact Theme Configuration
// Complete list of all available PrimeReact themes with their variants

export interface ThemeConfig {
  id: string;
  name: string;
  category: 'Light' | 'Dark';
  cssPath: string;
  family: string;
  color?: string;
  description?: string;
}

export const THEME_FAMILIES = {
  LARA: 'Lara',
  SAGA: 'Saga', 
  VELA: 'Vela',
  ARYA: 'Arya',
  NOVA: 'Nova',
  LUNA: 'Luna',
  RHEA: 'Rhea',
  FLUENT: 'Fluent',
  MATERIAL: 'Material Design',
  BOOTSTRAP: 'Bootstrap',
  SOHO: 'Soho'
} as const;

export const AVAILABLE_THEMES: ThemeConfig[] = [
  // LARA THEMES (Modern, Clean Design)
  {
    id: 'lara-light-indigo',
    name: 'Lara Light Indigo',
    category: 'Light',
    cssPath: 'primereact/resources/themes/lara-light-indigo/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#3f51b5',
    description: 'Modern light theme with indigo accents'
  },
  {
    id: 'lara-light-blue',
    name: 'Lara Light Blue',
    category: 'Light',
    cssPath: 'primereact/resources/themes/lara-light-blue/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#2196f3'
  },
  {
    id: 'lara-light-purple',
    name: 'Lara Light Purple',
    category: 'Light',
    cssPath: 'primereact/resources/themes/lara-light-purple/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#9c27b0'
  },
  {
    id: 'lara-light-teal',
    name: 'Lara Light Teal',
    category: 'Light',
    cssPath: 'primereact/resources/themes/lara-light-teal/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#009688',
    description: 'Current default theme'
  },
  {
    id: 'lara-light-cyan',
    name: 'Lara Light Cyan',
    category: 'Light',
    cssPath: 'primereact/resources/themes/lara-light-cyan/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#00bcd4'
  },
  {
    id: 'lara-light-pink',
    name: 'Lara Light Pink',
    category: 'Light',
    cssPath: 'primereact/resources/themes/lara-light-pink/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#e91e63'
  },
  {
    id: 'lara-light-amber',
    name: 'Lara Light Amber',
    category: 'Light',
    cssPath: 'primereact/resources/themes/lara-light-amber/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#ffc107'
  },
  {
    id: 'lara-light-green',
    name: 'Lara Light Green',
    category: 'Light',
    cssPath: 'primereact/resources/themes/lara-light-green/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#4caf50'
  },

  // LARA DARK THEMES
  {
    id: 'lara-dark-indigo',
    name: 'Lara Dark Indigo',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/lara-dark-indigo/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#3f51b5'
  },
  {
    id: 'lara-dark-blue',
    name: 'Lara Dark Blue',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/lara-dark-blue/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#2196f3'
  },
  {
    id: 'lara-dark-purple',
    name: 'Lara Dark Purple',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/lara-dark-purple/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#9c27b0'
  },
  {
    id: 'lara-dark-teal',
    name: 'Lara Dark Teal',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/lara-dark-teal/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#009688'
  },
  {
    id: 'lara-dark-cyan',
    name: 'Lara Dark Cyan',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/lara-dark-cyan/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#00bcd4'
  },
  {
    id: 'lara-dark-pink',
    name: 'Lara Dark Pink',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/lara-dark-pink/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#e91e63'
  },
  {
    id: 'lara-dark-amber',
    name: 'Lara Dark Amber',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/lara-dark-amber/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#ffc107'
  },
  {
    id: 'lara-dark-green',
    name: 'Lara Dark Green',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/lara-dark-green/theme.css',
    family: THEME_FAMILIES.LARA,
    color: '#4caf50'
  },

  // SAGA THEMES (Clean and Minimal)
  {
    id: 'saga-blue',
    name: 'Saga Blue',
    category: 'Light',
    cssPath: 'primereact/resources/themes/saga-blue/theme.css',
    family: THEME_FAMILIES.SAGA,
    color: '#2196f3'
  },
  {
    id: 'saga-green',
    name: 'Saga Green',
    category: 'Light',
    cssPath: 'primereact/resources/themes/saga-green/theme.css',
    family: THEME_FAMILIES.SAGA,
    color: '#4caf50'
  },
  {
    id: 'saga-orange',
    name: 'Saga Orange',
    category: 'Light',
    cssPath: 'primereact/resources/themes/saga-orange/theme.css',
    family: THEME_FAMILIES.SAGA,
    color: '#ff9800'
  },
  {
    id: 'saga-purple',
    name: 'Saga Purple',
    category: 'Light',
    cssPath: 'primereact/resources/themes/saga-purple/theme.css',
    family: THEME_FAMILIES.SAGA,
    color: '#9c27b0'
  },

  // VELA THEMES (Dark Variants)
  {
    id: 'vela-blue',
    name: 'Vela Blue',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/vela-blue/theme.css',
    family: THEME_FAMILIES.VELA,
    color: '#2196f3'
  },
  {
    id: 'vela-green',
    name: 'Vela Green',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/vela-green/theme.css',
    family: THEME_FAMILIES.VELA,
    color: '#4caf50'
  },
  {
    id: 'vela-orange',
    name: 'Vela Orange',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/vela-orange/theme.css',
    family: THEME_FAMILIES.VELA,
    color: '#ff9800'
  },
  {
    id: 'vela-purple',
    name: 'Vela Purple',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/vela-purple/theme.css',
    family: THEME_FAMILIES.VELA,
    color: '#9c27b0'
  },

  // ARYA THEMES (Material Dark)
  {
    id: 'arya-blue',
    name: 'Arya Blue',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/arya-blue/theme.css',
    family: THEME_FAMILIES.ARYA,
    color: '#2196f3'
  },
  {
    id: 'arya-green',
    name: 'Arya Green',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/arya-green/theme.css',
    family: THEME_FAMILIES.ARYA,
    color: '#4caf50'
  },
  {
    id: 'arya-orange',
    name: 'Arya Orange',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/arya-orange/theme.css',
    family: THEME_FAMILIES.ARYA,
    color: '#ff9800'
  },
  {
    id: 'arya-purple',
    name: 'Arya Purple',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/arya-purple/theme.css',
    family: THEME_FAMILIES.ARYA,
    color: '#9c27b0'
  },

  // MATERIAL DESIGN THEMES
  {
    id: 'md-light-indigo',
    name: 'Material Light Indigo',
    category: 'Light',
    cssPath: 'primereact/resources/themes/md-light-indigo/theme.css',
    family: THEME_FAMILIES.MATERIAL,
    color: '#3f51b5'
  },
  {
    id: 'md-light-deeppurple',
    name: 'Material Light Deep Purple',
    category: 'Light',
    cssPath: 'primereact/resources/themes/md-light-deeppurple/theme.css',
    family: THEME_FAMILIES.MATERIAL,
    color: '#673ab7'
  },
  {
    id: 'md-dark-indigo',
    name: 'Material Dark Indigo',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/md-dark-indigo/theme.css',
    family: THEME_FAMILIES.MATERIAL,
    color: '#3f51b5'
  },
  {
    id: 'md-dark-deeppurple',
    name: 'Material Dark Deep Purple',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/md-dark-deeppurple/theme.css',
    family: THEME_FAMILIES.MATERIAL,
    color: '#673ab7'
  },

  // BOOTSTRAP THEMES
  {
    id: 'bootstrap4-light-blue',
    name: 'Bootstrap Light Blue',
    category: 'Light',
    cssPath: 'primereact/resources/themes/bootstrap4-light-blue/theme.css',
    family: THEME_FAMILIES.BOOTSTRAP,
    color: '#007bff'
  },
  {
    id: 'bootstrap4-light-purple',
    name: 'Bootstrap Light Purple',
    category: 'Light',
    cssPath: 'primereact/resources/themes/bootstrap4-light-purple/theme.css',
    family: THEME_FAMILIES.BOOTSTRAP,
    color: '#6f42c1'
  },
  {
    id: 'bootstrap4-dark-blue',
    name: 'Bootstrap Dark Blue',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/bootstrap4-dark-blue/theme.css',
    family: THEME_FAMILIES.BOOTSTRAP,
    color: '#007bff'
  },
  {
    id: 'bootstrap4-dark-purple',
    name: 'Bootstrap Dark Purple',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/bootstrap4-dark-purple/theme.css',
    family: THEME_FAMILIES.BOOTSTRAP,
    color: '#6f42c1'
  },

  // NOVA THEMES
  {
    id: 'nova',
    name: 'Nova',
    category: 'Light',
    cssPath: 'primereact/resources/themes/nova/theme.css',
    family: THEME_FAMILIES.NOVA,
    color: '#007ad9'
  },
  {
    id: 'nova-alt',
    name: 'Nova Alt',
    category: 'Light',
    cssPath: 'primereact/resources/themes/nova-alt/theme.css',
    family: THEME_FAMILIES.NOVA,
    color: '#007ad9'
  },
  {
    id: 'nova-accent',
    name: 'Nova Accent',
    category: 'Light',
    cssPath: 'primereact/resources/themes/nova-accent/theme.css',
    family: THEME_FAMILIES.NOVA,
    color: '#007ad9'
  },

  // LUNA THEMES
  {
    id: 'luna-amber',
    name: 'Luna Amber',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/luna-amber/theme.css',
    family: THEME_FAMILIES.LUNA,
    color: '#ffc107'
  },
  {
    id: 'luna-blue',
    name: 'Luna Blue',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/luna-blue/theme.css',
    family: THEME_FAMILIES.LUNA,
    color: '#2196f3'
  },
  {
    id: 'luna-green',
    name: 'Luna Green',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/luna-green/theme.css',
    family: THEME_FAMILIES.LUNA,
    color: '#4caf50'
  },
  {
    id: 'luna-pink',
    name: 'Luna Pink',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/luna-pink/theme.css',
    family: THEME_FAMILIES.LUNA,
    color: '#e91e63'
  },

  // FLUENT THEME
  {
    id: 'fluent-light',
    name: 'Fluent Light',
    category: 'Light',
    cssPath: 'primereact/resources/themes/fluent-light/theme.css',
    family: THEME_FAMILIES.FLUENT,
    color: '#0078d4',
    description: 'Microsoft Fluent Design inspired theme'
  },

  // RHEA THEME
  {
    id: 'rhea',
    name: 'Rhea',
    category: 'Light',
    cssPath: 'primereact/resources/themes/rhea/theme.css',
    family: THEME_FAMILIES.RHEA,
    color: '#dd5e89'
  },

  // SOHO THEMES
  {
    id: 'soho-light',
    name: 'Soho Light',
    category: 'Light',
    cssPath: 'primereact/resources/themes/soho-light/theme.css',
    family: THEME_FAMILIES.SOHO,
    color: '#6366f1'
  },
  {
    id: 'soho-dark',
    name: 'Soho Dark',
    category: 'Dark',
    cssPath: 'primereact/resources/themes/soho-dark/theme.css',
    family: THEME_FAMILIES.SOHO,
    color: '#6366f1'
  }
];

// Helper functions
export const getThemeById = (themeId: string): ThemeConfig | undefined => {
  return AVAILABLE_THEMES.find(theme => theme.id === themeId);
};

export const getThemesByCategory = (category: 'Light' | 'Dark'): ThemeConfig[] => {
  return AVAILABLE_THEMES.filter(theme => theme.category === category);
};

export const getThemesByFamily = (family: string): ThemeConfig[] => {
  return AVAILABLE_THEMES.filter(theme => theme.family === family);
};

export const getDefaultTheme = (): ThemeConfig => {
  return getThemeById('lara-light-teal') || AVAILABLE_THEMES[0];
};

// Theme families grouped for UI display
export const GROUPED_THEMES = Object.values(THEME_FAMILIES).map(family => ({
  family,
  themes: getThemesByFamily(family)
}));