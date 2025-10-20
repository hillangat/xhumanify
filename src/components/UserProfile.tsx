import React, { useState, useRef, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, updateUserAttributes, fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { Chip } from 'primereact/chip';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';

import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import FeaturePage from './FeaturePage';
import { useSubscription } from '../contexts/SubscriptionContext';

import './UserProfile.scss';

interface UserProfile {
  username: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
}

interface ContentHistory {
  id: string;
  originalContent: string;
  processedContent: string;
  description?: string;
  createdAt: string;
}

interface UsageStats {
  totalProcessed: number;
  wordsThisMonth: number;
  avgWordsPerDay: number;
  mostActiveDay: string;
  favoriteTone: string;
  totalSaved: number;
}

const UserProfile: React.FC = () => {
  const client = generateClient<Schema>();
  const toast = useRef<Toast>(null);
  const { subscription, currentTier, usageCount, usageLimit } = useSubscription();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [contentHistory, setContentHistory] = useState<ContentHistory[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentHistory | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    loadUserProfile();
    loadContentHistory();
    loadUsageStats();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      const profile: UserProfile = {
        username: user.username,
        email: attributes.email || '',
        given_name: attributes.given_name || '',
        family_name: attributes.family_name || '',
        picture: attributes.picture || '',
        bio: attributes['custom:bio'] || '',
        company: attributes['custom:company'] || '',
        website: attributes['custom:website'] || '',
        location: attributes['custom:location'] || ''
      };
      
      setUserProfile(profile);
      setEditForm(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Profile Error',
        detail: 'Failed to load user profile',
        life: 3000
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadContentHistory = async () => {
    try {
      const { data } = await client.models.UserContentHistory.list({
        limit: 50
      });
      
      if (data) {
        setContentHistory(data as ContentHistory[]);
      }
    } catch (error) {
      console.error('Failed to load content history:', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const { data: historyData } = await client.models.UserContentHistory.list();
      const { data: usageData } = await client.models.UsageTracking.list();
      
      if (historyData && usageData) {
        // Calculate statistics
        const totalProcessed = historyData.length;
        const totalSaved = historyData.length;
        
        // Calculate words this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const thisMonthHistory = historyData.filter(item => 
          new Date(item.createdAt || '') >= thisMonth
        );
        
        const wordsThisMonth = thisMonthHistory.reduce((total, item) => {
          return total + (item.originalContent?.split(' ').length || 0);
        }, 0);
        
        // Generate chart data for last 7 days
        const chartLabels = [];
        const chartValues = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
          chartLabels.push(dayLabel);
          
          const dayUsage = historyData.filter(item => {
            const itemDate = new Date(item.createdAt || '');
            return itemDate.toDateString() === date.toDateString();
          }).length;
          
          chartValues.push(dayUsage);
        }
        
        setChartData({
          labels: chartLabels,
          datasets: [
            {
              label: 'Daily Usage',
              data: chartValues,
              fill: false,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }
          ]
        });
        
        setUsageStats({
          totalProcessed,
          wordsThisMonth,
          avgWordsPerDay: Math.round(wordsThisMonth / new Date().getDate()),
          mostActiveDay: 'Monday', // Could be calculated from data
          favoriteTone: 'Professional', // Could be tracked
          totalSaved
        });
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    
    setIsSaving(true);
    try {
      const attributesToUpdate: Record<string, string> = {};
      
      if (editForm.given_name !== userProfile.given_name) {
        attributesToUpdate.given_name = editForm.given_name || '';
      }
      if (editForm.family_name !== userProfile.family_name) {
        attributesToUpdate.family_name = editForm.family_name || '';
      }
      if (editForm.bio !== userProfile.bio) {
        attributesToUpdate['custom:bio'] = editForm.bio || '';
      }
      if (editForm.company !== userProfile.company) {
        attributesToUpdate['custom:company'] = editForm.company || '';
      }
      if (editForm.website !== userProfile.website) {
        attributesToUpdate['custom:website'] = editForm.website || '';
      }
      if (editForm.location !== userProfile.location) {
        attributesToUpdate['custom:location'] = editForm.location || '';
      }
      
      if (Object.keys(attributesToUpdate).length > 0) {
        await updateUserAttributes({ userAttributes: attributesToUpdate });
      }
      
      setUserProfile({ ...userProfile, ...editForm });
      setIsEditing(false);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Profile Updated',
        detail: 'Your profile has been successfully updated',
        life: 3000
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Update Failed',
        detail: 'Failed to update profile. Please try again.',
        life: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContent = async (content: ContentHistory) => {
    try {
      await client.models.UserContentHistory.delete({ id: content.id });
      await loadContentHistory();
      setShowDeleteDialog(false);
      setSelectedContent(null);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Content Deleted',
        detail: 'Content has been successfully deleted',
        life: 3000
      });
    } catch (error) {
      console.error('Failed to delete content:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Delete Failed',
        detail: 'Failed to delete content. Please try again.',
        life: 3000
      });
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'info';
      case 'lite': return 'success';
      case 'standard': return 'warning';
      case 'pro': return 'danger';
      default: return 'info';
    }
  };

  const getUsagePercentage = () => {
    if (usageLimit === 999999) return 0; // Unlimited
    return Math.round((usageCount / usageLimit) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const actionBodyTemplate = (content: ContentHistory) => {
    return (
      <div className="action-buttons">
        <Button
          icon="pi pi-eye"
          size="small"
          outlined
          onClick={() => {
            setSelectedContent(content);
            // Could open a view dialog
          }}
          tooltip="View Content"
        />
        <Button
          icon="pi pi-trash"
          size="small"
          outlined
          severity="danger"
          onClick={() => {
            setSelectedContent(content);
            setShowDeleteDialog(true);
          }}
          tooltip="Delete Content"
        />
      </div>
    );
  };

  if (isLoadingProfile) {
    return (
      <FeaturePage
        title="User Profile"
        description="Loading your profile information..."
        loading={true}
        className="user-profile-page"
      >
        <div>Loading profile...</div>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      title="User Profile"
      subtitle="Manage Your Account and Track Your Progress"
      description="View your subscription details, usage statistics, content history, and manage your account preferences."
      icon="pi pi-user"
      badge={{
        text: `${currentTier?.charAt(0).toUpperCase()}${currentTier?.slice(1)} Plan`,
        severity: getPlanColor(currentTier || 'free')
      }}
      stats={[
        {
          label: "Current Plan",
          value: currentTier?.charAt(0).toUpperCase() + currentTier?.slice(1) || "Free",
          icon: "pi pi-star",
          color: "primary"
        },
        {
          label: "Words Used",
          value: usageCount.toString(),
          icon: "pi pi-chart-bar",
          color: "info"
        },
        {
          label: "Content Saved",
          value: usageStats?.totalSaved.toString() || "0",
          icon: "pi pi-save",
          color: "success"
        },
        {
          label: "This Month",
          value: usageStats?.wordsThisMonth.toString() || "0",
          icon: "pi pi-calendar",
          color: "warning"
        }
      ]}
      breadcrumbs={[
        { label: 'Home', url: '/', icon: 'pi pi-home' },
        { label: 'Profile', url: '/profile', icon: 'pi pi-user' }
      ]}
      actions={[
        ...(currentTier !== 'pro' ? [{
          label: "Upgrade Plan",
          icon: "pi pi-star",
          onClick: () => window.location.href = '/upgrade',
          variant: "primary" as const
        }] : []),
        {
          label: "Settings",
          icon: "pi pi-cog",
          onClick: () => window.location.href = '/settings',
          variant: "secondary"
        }
      ]}
      className="user-profile-page"
    >
      <Toast ref={toast} position="top-right" />
      
      <div className="user-profile">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          
          {/* Profile Information Tab */}
          <TabPanel header="Profile Information" leftIcon="pi pi-user">
            <div className="profile-grid">
              <Card className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <Avatar
                      image={userProfile?.picture}
                      label={userProfile?.given_name?.[0] || userProfile?.username?.[0] || 'U'}
                      size="xlarge"
                      shape="circle"
                    />
                    <div className="profile-info">
                      <h2>{userProfile?.given_name} {userProfile?.family_name}</h2>
                      <p className="username">@{userProfile?.username}</p>
                      <Chip
                        label={`${currentTier?.charAt(0).toUpperCase()}${currentTier?.slice(1)} Member`}
                        icon="pi pi-star"
                        className={`plan-chip plan-${currentTier}`}
                      />
                    </div>
                  </div>
                  
                  <div className="profile-actions">
                    {!isEditing ? (
                      <Button
                        label="Edit Profile"
                        icon="pi pi-pencil"
                        onClick={() => setIsEditing(true)}
                        outlined
                      />
                    ) : (
                      <div className="edit-actions">
                        <Button
                          label="Cancel"
                          icon="pi pi-times"
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm(userProfile || {});
                          }}
                          outlined
                          severity="secondary"
                        />
                        <Button
                          label="Save"
                          icon="pi pi-check"
                          onClick={handleSaveProfile}
                          loading={isSaving}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <Divider />
                
                <div className="profile-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Email</label>
                      <InputText value={userProfile?.email} disabled />
                    </div>
                    
                    <div className="detail-item">
                      <label>First Name</label>
                      <InputText
                        value={isEditing ? (editForm.given_name || '') : (userProfile?.given_name || '')}
                        onChange={(e) => setEditForm({ ...editForm, given_name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="detail-item">
                      <label>Last Name</label>
                      <InputText
                        value={isEditing ? (editForm.family_name || '') : (userProfile?.family_name || '')}
                        onChange={(e) => setEditForm({ ...editForm, family_name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="detail-item">
                      <label>Company</label>
                      <InputText
                        value={isEditing ? (editForm.company || '') : (userProfile?.company || '')}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Your company name"
                      />
                    </div>
                    
                    <div className="detail-item">
                      <label>Location</label>
                      <InputText
                        value={isEditing ? (editForm.location || '') : (userProfile?.location || '')}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        disabled={!isEditing}
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div className="detail-item">
                      <label>Website</label>
                      <InputText
                        value={isEditing ? (editForm.website || '') : (userProfile?.website || '')}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        disabled={!isEditing}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    
                    <div className="detail-item full-width">
                      <label>Bio</label>
                      <InputTextarea
                        value={isEditing ? (editForm.bio || '') : (userProfile?.bio || '')}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>
          
          {/* Subscription & Usage Tab */}
          <TabPanel header="Subscription & Usage" leftIcon="pi pi-chart-bar">
            <div className="usage-grid">
              <Card className="subscription-card">
                <div className="subscription-header">
                  <h3>Current Subscription</h3>
                  <Badge
                    value={currentTier?.charAt(0).toUpperCase() + currentTier?.slice(1)}
                    severity={getPlanColor(currentTier || 'free')}
                    size="large"
                  />
                </div>
                
                <div className="subscription-details">
                  <div className="usage-meter">
                    <div className="usage-info">
                      <span>Monthly Usage</span>
                      <span>{usageCount} / {usageLimit === 999999 ? '∞' : usageLimit} words</span>
                    </div>
                    <ProgressBar
                      value={getUsagePercentage()}
                      showValue={false}
                      className="usage-progress"
                    />
                    <div className="usage-percentage">
                      {usageLimit === 999999 ? 'Unlimited' : `${getUsagePercentage()}% used`}
                    </div>
                  </div>
                  
                  {subscription && (
                    <div className="subscription-info">
                      <div className="info-item">
                        <label>Plan Status</label>
                        <Chip
                          label={subscription.status || 'Active'}
                          icon="pi pi-check-circle"
                          className="status-chip"
                        />
                      </div>
                      <div className="info-item">
                        <label>Current Period</label>
                        <span>
                          {subscription.currentPeriodStart
                            ? formatDate(subscription.currentPeriodStart)
                            : 'N/A'
                          } - {subscription.currentPeriodEnd
                            ? formatDate(subscription.currentPeriodEnd)
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="subscription-actions">
                    {currentTier !== 'pro' && (
                      <Button
                        label="Upgrade Plan"
                        icon="pi pi-star"
                        onClick={() => window.location.href = '/upgrade'}
                      />
                    )}
                    <Button
                      label="Billing Portal"
                      icon="pi pi-credit-card"
                      onClick={() => window.location.href = '/billing'}
                      outlined
                    />
                  </div>
                </div>
              </Card>
              
              <Card className="stats-card">
                <h3>Usage Statistics</h3>
                {usageStats && (
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{usageStats.totalProcessed}</div>
                      <div className="stat-label">Total Processed</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{usageStats.wordsThisMonth}</div>
                      <div className="stat-label">Words This Month</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{usageStats.avgWordsPerDay}</div>
                      <div className="stat-label">Avg Words/Day</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{usageStats.favoriteTone}</div>
                      <div className="stat-label">Favorite Tone</div>
                    </div>
                  </div>
                )}
                
                {chartData && (
                  <div className="chart-container">
                    <h4>Daily Usage (Last 7 Days)</h4>
                    <Chart type="line" data={chartData} />
                  </div>
                )}
              </Card>
            </div>
          </TabPanel>
          
          {/* Content History Tab */}
          <TabPanel header="Content History" leftIcon="pi pi-history">
            <Card className="history-card">
              {/* <div className="history-header">
                <h3>Your Content History</h3>
                <Button
                  label="Clear All"
                  icon="pi pi-trash"
                  onClick={() => {
                    // Could implement bulk delete
                  }}
                  outlined
                  severity="danger"
                  size="small"
                />
              </div> */}
              
              <DataTable
                value={contentHistory}
                paginator
                rows={10}
                className="content-history-table"
                emptyMessage="No content history found"
                sortField="createdAt"
                sortOrder={-1}
              >
                <Column
                  field="description"
                  header="Description"
                  body={(rowData) => rowData.description || 'Untitled'}
                />
                <Column
                  field="originalContent"
                  header="Original"
                  body={(rowData) => (
                    <div className="content-preview">
                      {rowData.originalContent.substring(0, 50)}...
                    </div>
                  )}
                />
                <Column
                  field="createdAt"
                  header="Created"
                  body={(rowData) => formatDate(rowData.createdAt)}
                  sortable
                />
                <Column
                  body={actionBodyTemplate}
                  header="Actions"
                  style={{ width: '160px' }}
                />
              </DataTable>
            </Card>
          </TabPanel>
        </TabView>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        header="Confirm Delete"
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowDeleteDialog(false)}
              outlined
            />
            <Button
              label="Delete"
              icon="pi pi-trash"
              onClick={() => selectedContent && handleDeleteContent(selectedContent)}
              severity="danger"
            />
          </div>
        }
      >
        <p>Are you sure you want to delete this content? This action cannot be undone.</p>
      </Dialog>
    </FeaturePage>
  );
};

export default UserProfile;