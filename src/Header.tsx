import { Menubar } from 'primereact/menubar';
import { FaUser } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import './Header.scss';

export default function Header() {
  const location = useLocation();

  const menuItems = [
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
      className: location.pathname === '/features' ? 'active-menu-item' : ''
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

  return (
    <div className="card header-card">
      <Menubar 
        model={menuItems} 
        start={<div className="p-menubar-start"><strong>XHumanify</strong></div>}
        end={
          <div className="p-menubar-end">
            <div className="user-icon-circle">
              <FaUser style={{ fontSize: '1.2rem' }} />
            </div>
          </div>}
      />
    </div>
  );
}
