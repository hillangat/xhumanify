import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Badge } from 'primereact/badge';
import { Chart } from 'primereact/chart';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import FeaturePage from './FeaturePage';
import './AdminPage.scss';

interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  lastLoginAt?: string;
  status: 'active' | 'suspended' | 'deleted';
  subscriptionPlan: string;
  usageCount: number;
  usageLimit: number;
  stripeCustomerId?: string;
  totalSpent: number;
  loginCount: number;
  lastActivity?: string;
}

interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  planName: string;
  status: string;
  usageCount: number;
  usageLimit: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalSubscriptions: number;
  paidSubscriptions: number;
  freeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalUsage: number;
  averageUsagePerUser: number;
}

const AdminPage: React.FC = () => {
  const client = generateClient<Schema>();
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalSubscriptions: 0,
    paidSubscriptions: 0,
    freeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalUsage: 0,
    averageUsagePerUser: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialogVisible, setUserDialogVisible] = useState(false);
  const [suspensionDialogVisible, setSuspensionDialogVisible] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [chartData, setChartData] = useState<any>({});
  const [activeTab, setActiveTab] = useState(0);
  
  const toast = React.useRef<Toast>(null);

  useEffect(() => {
    loadAdminData();
    setupChartData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      await loadUsers();
      await loadSubscriptions();
      await loadSystemStats();
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load admin data'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Get all user subscriptions to build user list
      const { data: subscriptionsData } = await client.models.UserSubscription.list({
        authMode: 'iam' // Use IAM auth for admin access
      });

      // Transform subscription data into user data
      const usersMap = new Map<string, User>();
      
      subscriptionsData?.forEach(sub => {
        if (sub.userId) {
          const userId = sub.userId;
          const existing = usersMap.get(userId);
          
          if (!existing) {
            // Create new user entry
            usersMap.set(userId, {
              id: userId,
              email: sub.stripeCustomerId === `free-${userId}` ? `user-${userId.slice(0, 8)}@example.com` : 'Unknown',
              name: `User ${userId.slice(0, 8)}`,
              createdAt: sub.createdAt || new Date().toISOString(),
              lastLoginAt: sub.updatedAt || undefined,
              status: 'active', // Default status
              subscriptionPlan: sub.planName || 'free',
              usageCount: sub.usageCount || 0,
              usageLimit: sub.usageLimit || 1500,
              stripeCustomerId: sub.stripeCustomerId,
              totalSpent: sub.planName === 'free' ? 0 : 29.00, // Mock revenue
              loginCount: Math.floor(Math.random() * 100) + 1, // Mock data
              lastActivity: sub.updatedAt || undefined
            });
          } else {
            // Update existing user with latest subscription info
            existing.subscriptionPlan = sub.planName || existing.subscriptionPlan;
            existing.usageCount = sub.usageCount || existing.usageCount;
            existing.usageLimit = sub.usageLimit || existing.usageLimit;
            existing.stripeCustomerId = sub.stripeCustomerId || existing.stripeCustomerId;
            existing.lastActivity = sub.updatedAt || existing.lastActivity;
          }
        }
      });

      setUsers(Array.from(usersMap.values()));
    } catch (error) {
      console.error('Error loading users:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load users'
      });
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data: subscriptionsData } = await client.models.UserSubscription.list({
        authMode: 'iam' // Use IAM auth for admin access
      });

      const transformedSubs: Subscription[] = subscriptionsData?.map(sub => ({
        id: sub.id,
        userId: sub.userId || 'Unknown',
        userEmail: sub.stripeCustomerId === `free-${sub.userId}` ? `user-${sub.userId?.slice(0, 8)}@example.com` : 'Unknown',
        planName: sub.planName || 'free',
        status: sub.status || 'active',
        usageCount: sub.usageCount || 0,
        usageLimit: sub.usageLimit || 1500,
        currentPeriodStart: sub.currentPeriodStart || undefined,
        currentPeriodEnd: sub.currentPeriodEnd || undefined,
        stripeCustomerId: sub.stripeCustomerId || undefined,
        stripeSubscriptionId: sub.stripeSubscriptionId || undefined,
        stripePriceId: sub.stripePriceId || undefined,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
        createdAt: sub.createdAt || new Date().toISOString(),
        updatedAt: sub.updatedAt || new Date().toISOString()
      })) || [];

      setSubscriptions(transformedSubs);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load subscriptions'
      });
    }
  };

  const loadSystemStats = async () => {
    try {
      // Get subscription stats
      const { data: subscriptionsData } = await client.models.UserSubscription.list({
        authMode: 'iam'
      });

      // Get usage tracking stats
      await client.models.UsageTracking.list({
        authMode: 'iam'
      });

      // Calculate statistics
      const totalUsers = subscriptionsData?.length || 0;
      const paidSubscriptions = subscriptionsData?.filter(sub => 
        sub.planName && sub.planName !== 'free' && sub.status === 'active'
      ).length || 0;
      const freeUsers = totalUsers - paidSubscriptions;
      const totalUsage = subscriptionsData?.reduce((sum, sub) => sum + (sub.usageCount || 0), 0) || 0;
      const averageUsagePerUser = totalUsers > 0 ? Math.round(totalUsage / totalUsers) : 0;

      // Mock revenue calculation based on plans
      const monthlyRevenue = paidSubscriptions * 29; // Approximate
      const totalRevenue = monthlyRevenue * 6; // Mock 6 months of data

      const stats: SystemStats = {
        totalUsers,
        activeUsers: totalUsers, // Assuming all are active for now
        suspendedUsers: 0, // No suspension tracking yet
        totalSubscriptions: totalUsers,
        paidSubscriptions,
        freeUsers,
        totalRevenue,
        monthlyRevenue,
        totalUsage,
        averageUsagePerUser
      };

      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load system statistics'
      });
    }
  };

  const setupChartData = () => {
    const usageData = {
      labels: ['Free', 'Lite', 'Standard', 'Pro'],
      datasets: [
        {
          label: 'Users by Plan',
          data: [1013, 156, 67, 11],
          backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350'],
          borderColor: ['#1E88E5', '#4CAF50', '#FF9800', '#F44336'],
          borderWidth: 1
        }
      ]
    };

    const revenueData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      datasets: [
        {
          label: 'Monthly Revenue ($)',
          data: [3200, 4100, 3800, 5200, 4900, 6100, 7200, 6800, 7900, 8234],
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66, 165, 245, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    setChartData({ usageData, revenueData });
  };

  const handleSuspendUser = (user: User) => {
    setSelectedUser(user);
    setSuspensionDialogVisible(true);
  };

  const confirmSuspendUser = async () => {
    if (!selectedUser || !suspensionReason.trim()) return;

    try {
      // For now, just update local state since we don't have user suspension in the schema
      // In a real implementation, you'd add a suspended status to UserSubscription or create a UserStatus model
      console.log(`Suspending user ${selectedUser.id} for reason: ${suspensionReason}`);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, status: 'suspended' as const }
          : u
      ));

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `User ${selectedUser.email} has been suspended (local only)`
      });

      setSuspensionDialogVisible(false);
      setSuspensionReason('');
      setSelectedUser(null);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to suspend user'
      });
    }
  };

  const handleReactivateUser = async (user: User) => {
    confirmDialog({
      message: `Are you sure you want to reactivate ${user.email}?`,
      header: 'Confirm Reactivation',
      icon: 'pi pi-info-circle',
      accept: async () => {
        try {
          // Update local state
          setUsers(prev => prev.map(u => 
            u.id === user.id 
              ? { ...u, status: 'active' as const }
              : u
          ));

          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: `User ${user.email} has been reactivated (local only)`
          });
        } catch (error) {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to reactivate user'
          });
        }
      }
    });
  };

  const handleResetUsage = async (user: User) => {
    confirmDialog({
      message: `Reset usage count for ${user.email}? This will set their usage to 0.`,
      header: 'Confirm Usage Reset',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          // Find and update the user's subscription
          const { data: userSubscriptions } = await client.models.UserSubscription.list({
            filter: { userId: { eq: user.id } },
            authMode: 'iam'
          });

          if (userSubscriptions && userSubscriptions.length > 0) {
            const subscription = userSubscriptions[0];
            await client.models.UserSubscription.update({
              id: subscription.id,
              usageCount: 0
            }, {
              authMode: 'iam'
            });

            // Update local state
            setUsers(prev => prev.map(u => 
              u.id === user.id 
                ? { ...u, usageCount: 0 }
                : u
            ));

            toast.current?.show({
              severity: 'success',
              summary: 'Success',
              detail: `Usage reset for ${user.email}`
            });
          } else {
            toast.current?.show({
              severity: 'warn',
              summary: 'Warning',
              detail: 'No subscription found for this user'
            });
          }
        } catch (error) {
          console.error('Error resetting usage:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to reset usage'
          });
        }
      }
    });
  };

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setUserDialogVisible(true);
  };

  const exportUserData = () => {
    const csvContent = [
      ['Email', 'Name', 'Plan', 'Status', 'Usage', 'Created', 'Last Login', 'Total Spent'].join(','),
      ...users.map(user => [
        user.email,
        user.name || '',
        user.subscriptionPlan,
        user.status,
        `${user.usageCount}/${user.usageLimit}`,
        new Date(user.createdAt).toLocaleDateString(),
        user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
        `$${user.totalSpent.toFixed(2)}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statusBodyTemplate = (user: User) => {
    const severity = user.status === 'active' ? 'success' : 
                    user.status === 'suspended' ? 'warning' : 'danger';
    return <Badge value={user.status} severity={severity} />;
  };

  const usageBodyTemplate = (user: User) => {
    const percentage = (user.usageCount / user.usageLimit) * 100;
    return (
      <div className="usage-display">
        <div className="usage-text">
          {user.usageCount.toLocaleString()} / {user.usageLimit.toLocaleString()}
        </div>
        <ProgressBar value={percentage} style={{ height: '6px', marginTop: '4px' }} />
      </div>
    );
  };

  const planBodyTemplate = (user: User) => {
    const planColors: Record<string, string> = {
      free: '#9E9E9E',
      lite: '#2196F3',
      standard: '#FF9800',
      pro: '#4CAF50'
    };
    return (
      <Tag 
        value={user.subscriptionPlan} 
        style={{ backgroundColor: planColors[user.subscriptionPlan] || '#9E9E9E' }}
      />
    );
  };

  const actionsBodyTemplate = (user: User) => {
    return (
      <div className="action-buttons">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => handleViewUserDetails(user)}
          tooltip="View Details"
        />
        {user.status === 'active' ? (
          <Button
            icon="pi pi-ban"
            className="p-button-rounded p-button-text p-button-warning p-button-sm"
            onClick={() => handleSuspendUser(user)}
            tooltip="Suspend User"
          />
        ) : (
          <Button
            icon="pi pi-check"
            className="p-button-rounded p-button-text p-button-success p-button-sm"
            onClick={() => handleReactivateUser(user)}
            tooltip="Reactivate User"
          />
        )}
        <Button
          icon="pi pi-refresh"
          className="p-button-rounded p-button-text p-button-info p-button-sm"
          onClick={() => handleResetUsage(user)}
          tooltip="Reset Usage"
        />
      </div>
    );
  };

  const header = (
    <div className="table-header">
      <h2>User Management</h2>
      <div className="header-actions">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)}
            placeholder="Search users..."
          />
        </span>
        <Button
          label="Export CSV"
          icon="pi pi-download"
          className="p-button-outlined"
          onClick={exportUserData}
        />
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          onClick={loadAdminData}
        />
      </div>
    </div>
  );

  return (
    <FeaturePage title="Admin Dashboard" description="Comprehensive admin dashboard for managing users, subscriptions, and system statistics">
      <div className="admin-page">
        <Toast ref={toast} />
        <ConfirmDialog />

        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          {/* Dashboard Tab */}
          <TabPanel header="Dashboard" leftIcon="pi pi-chart-line">
            <div className="dashboard-grid">
              {/* Statistics Cards */}
              <div className="stats-row">
                <Card className="stat-card">
                  <div className="stat-content">
                    <div className="stat-icon users">
                      <i className="pi pi-users" />
                    </div>
                    <div className="stat-details">
                      <h3>{systemStats.totalUsers.toLocaleString()}</h3>
                      <p>Total Users</p>
                      <small>{systemStats.activeUsers} active</small>
                    </div>
                  </div>
                </Card>

                <Card className="stat-card">
                  <div className="stat-content">
                    <div className="stat-icon revenue">
                      <i className="pi pi-dollar" />
                    </div>
                    <div className="stat-details">
                      <h3>${systemStats.monthlyRevenue.toLocaleString()}</h3>
                      <p>Monthly Revenue</p>
                      <small>${systemStats.totalRevenue.toLocaleString()} total</small>
                    </div>
                  </div>
                </Card>

                <Card className="stat-card">
                  <div className="stat-content">
                    <div className="stat-icon subscriptions">
                      <i className="pi pi-credit-card" />
                    </div>
                    <div className="stat-details">
                      <h3>{systemStats.paidSubscriptions}</h3>
                      <p>Paid Subscriptions</p>
                      <small>{systemStats.freeUsers} free users</small>
                    </div>
                  </div>
                </Card>

                <Card className="stat-card">
                  <div className="stat-content">
                    <div className="stat-icon usage">
                      <i className="pi pi-chart-bar" />
                    </div>
                    <div className="stat-details">
                      <h3>{systemStats.averageUsagePerUser.toLocaleString()}</h3>
                      <p>Avg Usage/User</p>
                      <small>{systemStats.totalUsage.toLocaleString()} total</small>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="charts-row">
                <Card title="Users by Plan" className="chart-card">
                  <Chart type="doughnut" data={chartData.usageData} />
                </Card>
                <Card title="Revenue Trend" className="chart-card">
                  <Chart type="line" data={chartData.revenueData} />
                </Card>
              </div>
            </div>
          </TabPanel>

          {/* Users Tab */}
          <TabPanel header="Users" leftIcon="pi pi-users">
            <Card>
              <DataTable
                value={users}
                paginator
                rows={25}
                dataKey="id"
                loading={loading}
                globalFilter={globalFilter}
                header={header}
                emptyMessage="No users found"
                className="admin-table"
              >
                <Column field="email" header="Email" sortable />
                <Column field="name" header="Name" sortable />
                <Column field="subscriptionPlan" header="Plan" body={planBodyTemplate} sortable />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                <Column field="usageCount" header="Usage" body={usageBodyTemplate} />
                <Column 
                  field="createdAt" 
                  header="Created" 
                  sortable
                  body={(user) => new Date(user.createdAt).toLocaleDateString()}
                />
                <Column 
                  field="lastActivity" 
                  header="Last Activity" 
                  sortable
                  body={(user) => user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'N/A'}
                />
                <Column 
                  field="totalSpent" 
                  header="Total Spent" 
                  sortable
                  body={(user) => `$${user.totalSpent.toFixed(2)}`}
                />
                <Column body={actionsBodyTemplate} header="Actions" />
              </DataTable>
            </Card>
          </TabPanel>

          {/* Subscriptions Tab */}
          <TabPanel header="Subscriptions" leftIcon="pi pi-credit-card">
            <Card>
              <DataTable
                value={subscriptions}
                paginator
                rows={25}
                dataKey="id"
                loading={loading}
                emptyMessage="No subscriptions found"
                className="admin-table"
              >
                <Column field="userEmail" header="User Email" sortable />
                <Column field="planName" header="Plan" sortable />
                <Column field="status" header="Status" sortable />
                <Column 
                  field="currentPeriodEnd" 
                  header="Next Billing" 
                  sortable
                  body={(sub) => sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                />
                <Column field="cancelAtPeriodEnd" header="Cancelling" body={(sub) => sub.cancelAtPeriodEnd ? 'Yes' : 'No'} />
              </DataTable>
            </Card>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel header="Settings" leftIcon="pi pi-cog">
            <div className="settings-grid">
              <Card title="System Configuration">
                <div className="setting-item">
                  <label>Default Free Plan Limit</label>
                  <InputText defaultValue="1500" />
                </div>
                <div className="setting-item">
                  <label>Max Login Attempts</label>
                  <InputText defaultValue="5" />
                </div>
                <div className="setting-item">
                  <Checkbox checked />
                  <label>Enable New User Registration</label>
                </div>
              </Card>

              <Card title="Maintenance">
                <Button label="Clear Cache" icon="pi pi-trash" className="p-button-outlined" />
                <Button label="Backup Database" icon="pi pi-download" className="p-button-outlined" />
                <Button label="System Health Check" icon="pi pi-heart" className="p-button-outlined" />
              </Card>
            </div>
          </TabPanel>
        </TabView>

        {/* User Details Dialog */}
        <Dialog
          header="User Details"
          visible={userDialogVisible}
          style={{ width: '600px' }}
          onHide={() => setUserDialogVisible(false)}
        >
          {selectedUser && (
            <div className="user-details">
              <div className="detail-row">
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div className="detail-row">
                <strong>Name:</strong> {selectedUser.name || 'Not provided'}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> <Badge value={selectedUser.status} />
              </div>
              <div className="detail-row">
                <strong>Plan:</strong> {selectedUser.subscriptionPlan}
              </div>
              <div className="detail-row">
                <strong>Usage:</strong> {selectedUser.usageCount} / {selectedUser.usageLimit}
              </div>
              <div className="detail-row">
                <strong>Total Spent:</strong> ${selectedUser.totalSpent.toFixed(2)}
              </div>
              <div className="detail-row">
                <strong>Login Count:</strong> {selectedUser.loginCount}
              </div>
              <div className="detail-row">
                <strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
              </div>
              <div className="detail-row">
                <strong>Last Login:</strong> {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}
              </div>
            </div>
          )}
        </Dialog>

        {/* Suspension Dialog */}
        <Dialog
          header="Suspend User"
          visible={suspensionDialogVisible}
          style={{ width: '500px' }}
          onHide={() => setSuspensionDialogVisible(false)}
          footer={(
            <div>
              <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => setSuspensionDialogVisible(false)}
              />
              <Button
                label="Suspend"
                icon="pi pi-ban"
                className="p-button-warning"
                onClick={confirmSuspendUser}
                disabled={!suspensionReason.trim()}
              />
            </div>
          )}
        >
          {selectedUser && (
            <div>
              <p>You are about to suspend <strong>{selectedUser.email}</strong></p>
              <div className="field">
                <label htmlFor="reason">Reason for suspension:</label>
                <InputTextarea
                  id="reason"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  rows={4}
                  cols={50}
                  placeholder="Please provide a reason for this suspension..."
                />
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </FeaturePage>
  );
};

export default AdminPage;