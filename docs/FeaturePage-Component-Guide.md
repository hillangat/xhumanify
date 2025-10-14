# FeaturePage Component Documentation

## Overview

The `FeaturePage` component is an enterprise-grade, reusable UI component designed to provide a uniform and professional user experience across your application. It features a beautiful gradient header with animations, statistics, breadcrumbs, action buttons, and a content area for your functionality.

## Features

- ✨ **Professional Design**: Modern gradient header with glassmorphism effects
- 🎨 **Fully Customizable**: Custom gradients, colors, icons, and styling
- 📱 **Responsive**: Optimized for all screen sizes and devices
- ♿ **Accessible**: Support for high contrast mode, reduced motion, and screen readers
- 🌙 **Dark Theme Ready**: Built-in dark theme support
- 🎭 **Smooth Animations**: Beautiful entrance animations and hover effects
- 📊 **Statistics Display**: Show key metrics with icons and colors
- 🍞 **Breadcrumb Navigation**: Easy navigation with icon support
- 🎯 **Action Buttons**: Primary and secondary actions in the header
- 📄 **Loading States**: Built-in loading indicator
- 📏 **Scroll Progress**: Visual scroll progress indicator

## Props Interface

```typescript
interface FeaturePageProps {
  /** The main title/name of the feature */
  title: string;
  
  /** Detailed description of what this feature does */
  description: string;
  
  /** Optional subtitle for additional context */
  subtitle?: string;
  
  /** Icon class name (PrimeIcons) for the feature */
  icon?: string;
  
  /** Badge text to show feature status or highlight */
  badge?: {
    text: string;
    severity?: 'success' | 'info' | 'warning' | 'danger' | 'secondary';
  };
  
  /** Optional statistics to display */
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
  }>;
  
  /** Action buttons for the header */
  actions?: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
    outlined?: boolean;
  }>;
  
  /** The main content/functionality component */
  children: React.ReactNode;
  
  /** Optional breadcrumb items */
  breadcrumbs?: Array<{
    label: string;
    url?: string;
    icon?: string;
  }>;
  
  /** Loading state */
  loading?: boolean;
  
  /** Custom header background gradient */
  headerGradient?: string;
  
  /** Enable/disable animations */
  animated?: boolean;
  
  /** Custom CSS class */
  className?: string;
}
```

## Basic Usage

```tsx
import FeaturePage from './components/FeaturePage';

const MyFeaturePage = () => {
  return (
    <FeaturePage
      title="Feature Requests"
      description="Your voice drives our innovation. Explore community ideas and vote on features."
      icon="pi-lightbulb"
    >
      {/* Your feature content goes here */}
      <div>Your feature functionality</div>
    </FeaturePage>
  );
};
```

## Advanced Usage

```tsx
import FeaturePage from './components/FeaturePage';

const AdvancedFeaturePage = () => {
  const handleCreateRequest = () => {
    // Handle create action
  };

  const handleViewAnalytics = () => {
    // Handle analytics action
  };

  return (
    <FeaturePage
      title="Feature Requests"
      subtitle="Community-Driven Innovation"
      description="Your voice drives our innovation. Explore community ideas, vote on features that matter to you, and share your own vision to help us build the tools that will revolutionize your content creation workflow."
      icon="pi-lightbulb"
      badge={{
        text: "Beta",
        severity: "info"
      }}
      stats={[
        {
          label: "Active Requests",
          value: "127",
          icon: "pi-star",
          color: "#f59e0b"
        },
        {
          label: "Votes Cast",
          value: "2.4K",
          icon: "pi-thumbs-up",
          color: "#10b981"
        },
        {
          label: "Completed",
          value: "43",
          icon: "pi-check-circle",
          color: "#8b5cf6"
        }
      ]}
      actions={[
        {
          label: "New Request",
          icon: "pi pi-plus",
          onClick: handleCreateRequest,
          variant: "primary"
        },
        {
          label: "Analytics",
          icon: "pi pi-chart-bar",
          onClick: handleViewAnalytics,
          variant: "secondary",
          outlined: true
        }
      ]}
      breadcrumbs={[
        {
          label: "Home",
          url: "/",
          icon: "pi-home"
        },
        {
          label: "Community",
          url: "/community"
        },
        {
          label: "Feature Requests"
        }
      ]}
      headerGradient="linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
      animated={true}
    >
      <YourFeatureComponent />
    </FeaturePage>
  );
};
```

## Customization

### Custom Gradients

You can provide custom CSS gradients for the header background:

```tsx
<FeaturePage
  headerGradient="linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)"
  // ... other props
>
```

### Custom Statistics Colors

Each statistic can have its own color:

```tsx
stats={[
  {
    label: "Users",
    value: "1.2K",
    icon: "pi-users",
    color: "#3b82f6" // Custom blue color
  }
]}
```

### Action Button Variants

Choose from different button variants:

```tsx
actions={[
  {
    label: "Primary Action",
    onClick: handlePrimary,
    variant: "primary"
  },
  {
    label: "Secondary Action",
    onClick: handleSecondary,
    variant: "secondary",
    outlined: true
  }
]}
```

## Styling

The component uses CSS custom properties for easy theming:

```scss
:root {
  --feature-primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --feature-accent-color: #667eea;
  --feature-text-primary: #2d3748;
  // ... more variables
}
```

### Dark Theme

The component automatically supports dark themes:

```scss
[data-theme="dark"] {
  --feature-text-primary: #ffffff;
  --feature-bg-primary: #1a202c;
  // ... dark theme variables
}
```

## Accessibility

The component includes:

- Proper semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- High contrast mode support
- Reduced motion support for users with vestibular disorders

## Performance

- Optimized animations with `transform` and `opacity`
- Conditional rendering of optional sections
- Efficient event handling
- CSS-in-JS for dynamic styling

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ with polyfills
- Mobile browsers (iOS Safari, Chrome Mobile)

## Examples

### Dashboard Page
```tsx
<FeaturePage
  title="Dashboard"
  description="Overview of your account activity and key metrics."
  icon="pi-chart-line"
  stats={dashboardStats}
>
  <DashboardContent />
</FeaturePage>
```

### Settings Page
```tsx
<FeaturePage
  title="Settings"
  description="Customize your experience and manage your preferences."
  icon="pi-cog"
  headerGradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
>
  <SettingsContent />
</FeaturePage>
```

### User Profile
```tsx
<FeaturePage
  title="User Profile"
  subtitle="Manage Your Account"
  description="Update your personal information and account settings."
  icon="pi-user"
  actions={[
    {
      label: "Edit Profile",
      icon: "pi pi-pencil",
      onClick: handleEdit,
      variant: "primary"
    }
  ]}
>
  <ProfileContent />
</FeaturePage>
```

## Best Practices

1. **Keep descriptions concise** - Aim for 1-2 sentences that clearly explain the feature
2. **Use meaningful icons** - Choose PrimeIcons that relate to your feature
3. **Provide relevant statistics** - Show metrics that matter to users
4. **Group related actions** - Limit to 2-3 primary actions in the header
5. **Use consistent gradients** - Establish a design system for your app
6. **Test responsiveness** - Ensure the component works on all screen sizes
7. **Consider loading states** - Use the loading prop for async operations

## Migration Guide

If you're migrating from individual page components:

1. Wrap your existing content in `<FeaturePage>`
2. Move your page title and description to the component props
3. Convert any header actions to the `actions` prop
4. Replace manual breadcrumbs with the `breadcrumbs` prop
5. Move statistics to the `stats` prop
6. Update your styling to use the new CSS custom properties

This component provides a consistent, professional foundation for all your feature pages while maintaining flexibility for customization.