import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

// Admin email addresses - in production, this should be stored in environment variables or database
const ADMIN_EMAILS = [
  'admin@humanizeaicontents.com',
  'hillangat@gmail.com', // Add your admin email here
  // Add other admin emails as needed
];

export interface AdminStatus {
  isAdmin: boolean;
  isLoading: boolean;
  userEmail: string | null;
}

export const useAdminCheck = (): AdminStatus => {
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    isLoading: true,
    userEmail: null
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = await getCurrentUser();
        const email = user.signInDetails?.loginId || user.username;
        
        const isAdmin = ADMIN_EMAILS.includes(email?.toLowerCase() || '');
        
        setAdminStatus({
          isAdmin,
          isLoading: false,
          userEmail: email || null
        });
      } catch (error) {
        console.log('No authenticated user or error checking admin status:', error);
        setAdminStatus({
          isAdmin: false,
          isLoading: false,
          userEmail: null
        });
      }
    };

    checkAdminStatus();
  }, []);

  return adminStatus;
};

// Helper function to check if current user is admin (for use in components)
export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    const email = user.signInDetails?.loginId || user.username;
    return ADMIN_EMAILS.includes(email?.toLowerCase() || '');
  } catch (error) {
    return false;
  }
};

// Admin-only wrapper component
export const AdminOnly: React.FC<{ 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const { isAdmin, isLoading } = useAdminCheck();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <i className="pi pi-spinner pi-spin" style={{ fontSize: '2rem' }} />
      </div>
    );
  }

  if (!isAdmin) {
    return fallback ? <>{fallback}</> : (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        color: 'var(--text-color-secondary)'
      }}>
        <i className="pi pi-lock" style={{ fontSize: '3rem', marginBottom: '1rem' }} />
        <h3>Access Denied</h3>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
};