import { MegaMenu } from 'primereact/megamenu';
import { useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import './Header.scss';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to home page or login page after logout
      navigate('/');
      // Optional: Show success message or refresh the page
      //window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      // Optional: Show error message to user
    }
  };

  const megaMenuItems = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      url: '/',
      className: location.pathname === '/' ? 'active-menu-item' : ''
    },
    {
      label: 'History',
      icon: 'pi pi-history',
      url: '/history',
      className: location.pathname === '/history' ? 'active-menu-item' : ''
    },
    {
      label: 'Features',
      icon: 'pi pi-star',
      className: location.pathname === '/features' ? 'active-menu-item' : '',
      items: [
        [
          {
            label: 'AI Tools',
            items: [
              { label: 'Content Humanizer', icon: 'pi pi-file-edit' },
              { label: 'Text Analyzer', icon: 'pi pi-chart-line' },
              { label: 'Grammar Check', icon: 'pi pi-check-circle' }
            ]
          }
        ],
        [
          {
            label: 'Integrations',
            items: [
              { label: 'API Access', icon: 'pi pi-cog' },
              { label: 'Webhooks', icon: 'pi pi-link' },
              { label: 'Third Party', icon: 'pi pi-external-link' }
            ]
          }
        ]
      ]
    },
    {
      label: 'About',
      icon: 'pi pi-info-circle',
      className: location.pathname === '/about' ? 'active-menu-item' : ''
    },
    {
      label: 'Contact',
      icon: 'pi pi-envelope',
      className: location.pathname === '/contact' ? 'active-menu-item' : ''
    }
  ];

  const userMenuItem = {
    label: 'My XHumanify',
    icon: 'pi pi-user',
    className: 'user-menu-item',
    items: [
      [
        {
          label: 'Account',
          items: [
            { 
              label: 'Profile', 
              icon: 'pi pi-user',
              command: () => console.log('Navigate to profile')
            },
            { 
              label: 'Settings', 
              icon: 'pi pi-cog',
              command: () => console.log('Navigate to settings')
            },
            { 
              label: 'Billing', 
              icon: 'pi pi-credit-card',
              command: () => console.log('Navigate to billing')
            },
            { 
              label: 'Log Out', 
              icon: 'pi pi-sign-out',
              command: () => handleLogout()
            }
          ]
        }
      ],
      [
        {
          label: 'Actions',
          items: [
            { 
              label: 'Log Out', 
              icon: 'pi pi-sign-out',
              command: () => handleLogout()
            }
          ]
        }
      ]
    ]
  };

  return (
    <div className="card header-card">
      <MegaMenu 
        model={megaMenuItems} 
        start={<div className="p-menubar-start"><strong>XHumanify</strong></div>}
        end={<MegaMenu model={[userMenuItem]} className="user-megamenu" />}
      />
    </div>
  );
}
