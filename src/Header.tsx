import React, { useState } from 'react';
import './Header.scss';

// Define TypeScript interface for navigation items
interface NavItem {
  label: string;
  url: string;
  children?: NavItem[];
}

interface HeaderProps {
  navItems: NavItem[];
}

const Header: React.FC<HeaderProps> = ({ navItems }) => {
  const [isOpen, setIsOpen] = useState<number | null>(null);

  const toggleDropdown = (index: number | null) => {
    setIsOpen(isOpen === index ? null : index);
  };

  return (
    <header>
      <nav>
        <div>
          <div>
            <div>Logo</div>
          </div>
          <div>
            {navItems.map((item, index) => (
              <div key={index} className="relative">
                <a
                  href={item.url}
                  onMouseEnter={() => item.children && toggleDropdown(index)}
                  onMouseLeave={() => item.children && toggleDropdown(null)}
                >
                  {item.label}
                </a>
                {item.children && isOpen === index && (
                  <div>
                    {item.children.map((child, childIndex) => (
                      <a
                        key={childIndex}
                        href={child.url}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
