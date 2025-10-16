import { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { Sidebar } from 'primereact/sidebar';
import { Divider } from 'primereact/divider';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import './Header.scss';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const userMenuRef = useRef<Menu>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.log('No authenticated user');
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, []);

  const getUserDisplayName = () => {
    if (!currentUser) return 'My Account';
    
    // Try to get a user-friendly display name
    const email = currentUser.signInDetails?.loginId || currentUser.username;
    const username = currentUser.username;
    
    // Use email if available, otherwise username, otherwise fallback
    if (email && email.includes('@')) {
      return email.split('@')[0]; // Return part before @ for cleaner display
    }
    
    return username || 'My Account';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      path: '/',
      command: () => {
        navigate('/');
        setMobileMenuVisible(false);
      }
    },
    {
      label: 'History',
      icon: 'pi pi-history',
      path: '/history',
      command: () => {
        navigate('/history');
        setMobileMenuVisible(false);
      }
    },
    {
      label: 'Feature Requests',
      icon: 'pi pi-lightbulb',
      path: '/features',
      command: () => {
        navigate('/features');
        setMobileMenuVisible(false);
      }
    },
    {
      label: 'AI Detection',
      icon: 'pi pi-search',
      path: '/ai-detection',
      command: () => {
        navigate('/ai-detection');
        setMobileMenuVisible(false);
      }
    },
    {
      label: 'Pricing',
      icon: 'pi pi-dollar',
      path: '/upgrade',
      command: () => {
        navigate('/upgrade');
        setMobileMenuVisible(false);
      }
    },
    {
      label: 'About',
      icon: 'pi pi-info-circle',
      path: '/about',
      command: () => {
        navigate('/about');
        setMobileMenuVisible(false);
      }
    },
    {
      label: 'Terms',
      icon: 'pi pi-file',
      path: '/terms',
      command: () => {
        navigate('/terms');
        setMobileMenuVisible(false);
      }
    },
    {
      label: 'Contact',
      icon: 'pi pi-envelope',
      path: '/contact',
      command: () => {
        navigate('/contact');
        setMobileMenuVisible(false);
      }
    }
  ];

  const userMenuItems = [
    {
      label: getUserDisplayName(),
      icon: 'pi pi-user',
      disabled: true,
      className: 'user-info-item'
    },
    {
      separator: true
    },
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => {
        console.log('Navigate to profile');
      }
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        console.log('Navigate to settings');
      }
    },
    {
      label: 'Billing',
      icon: 'pi pi-credit-card',
      command: () => {
        navigate('/upgrade');
      }
    },
    {
      separator: true
    },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => {
        handleLogout();
      }
    }
  ];

  const isActivePage = (path: string) => {
    return location.pathname === path || location.pathname === path + '/';
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuVisible(false);
  }, [location.pathname]);

  return (
    <>
      <header className="elegant-header">
        <div className="header-container">
          <div className="nav-header-content">
            {/* Logo */}
            <div className="logo-section" onClick={() => navigate('/')}>
              <div className="logo-icon">
                <i className="pi pi-sparkles"></i>
              </div>
              <div className="logo-text">
                <span className="logo-x">Humanize</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  label={item.label}
                  icon={item.icon}
                  text
                  className={`nav-button ${isActivePage(item.path) ? 'active' : ''}`}
                  onClick={item.command}
                />
              ))}
            </nav>

            {/* Right Side Controls */}
            <div className="header-controls">
              {/* User Menu */}
              <div className="user-menu-container">
                <Button
                  icon="pi pi-user"
                  rounded
                  text
                  className="user-button"
                  onClick={(e) => userMenuRef.current?.toggle(e)}
                  aria-label="User menu"
                />
                <Menu
                  model={userMenuItems}
                  popup
                  ref={userMenuRef}
                  id="user-menu"
                  popupAlignment="right"
                  className="elegant-user-menu"
                />
              </div>

              {/* Mobile Menu Button */}
              <Button
                icon="pi pi-bars"
                rounded
                text
                className="mobile-menu-button"
                onClick={() => setMobileMenuVisible(true)}
                aria-label="Open menu"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <Sidebar
        visible={mobileMenuVisible}
        position="right"
        onHide={() => setMobileMenuVisible(false)}
        className="mobile-sidebar"
        modal
      >
        <div className="mobile-menu-content">
          <div className="mobile-header">
            <div className="mobile-logo">
              <div className="logo-icon">
                <i className="pi pi-sparkles"></i>
              </div>
              <div className="logo-text">
                <span className="logo-x">x</span>Humanify
              </div>
            </div>
            <Button
              icon="pi pi-times"
              rounded
              text
              className="close-button"
              onClick={() => setMobileMenuVisible(false)}
              aria-label="Close menu"
            />
          </div>

          <Divider />

          <div className="mobile-nav">
            {navigationItems.map((item) => (
              <div
                key={item.path}
                className={`mobile-nav-item ${isActivePage(item.path) ? 'active' : ''}`}
                onClick={item.command}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
                {isActivePage(item.path) && <i className="pi pi-check current-indicator"></i>}
              </div>
            ))}
          </div>

          <Divider />

          <div className="mobile-user-section">
            <div className="mobile-user-info">
              <i className="pi pi-user"></i>
              <span>{getUserDisplayName()}</span>
            </div>
            <div className="mobile-user-actions">
              <Button
                label="Profile"
                icon="pi pi-user"
                text
                className="mobile-action-button"
                onClick={() => {
                  setMobileMenuVisible(false);
                  console.log('Navigate to profile');
                }}
              />
              <Button
                label="Settings"
                icon="pi pi-cog"
                text
                className="mobile-action-button"
                onClick={() => {
                  setMobileMenuVisible(false);
                  console.log('Navigate to settings');
                }}
              />
              <Button
                label="Billing"
                icon="pi pi-credit-card"
                text
                className="mobile-action-button"
                onClick={() => {
                  setMobileMenuVisible(false);
                  navigate('/upgrade');
                }}
              />
              <Button
                label="Sign Out"
                icon="pi pi-sign-out"
                text
                className="mobile-action-button sign-out"
                onClick={() => {
                  setMobileMenuVisible(false);
                  handleLogout();
                }}
              />
            </div>
          </div>
        </div>
      </Sidebar>
    </>
  );
}
