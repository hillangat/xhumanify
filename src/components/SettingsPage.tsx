import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ThemeSelector } from './ThemeSelector';
import AccountDeletion from './AccountDeletion';
import './SettingsPage.scss';

export const SettingsPage: React.FC = () => {
  const [showAccountDeletion, setShowAccountDeletion] = useState(false);

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="page-title">
            <i className="pi pi-cog" />
            Settings
          </h1>
          <p className="page-subtitle">
            Customize your application preferences and appearance
          </p>
        </div>

        <div className="settings-content">
          <div className="settings-grid">
            {/* Theme Settings */}
            <div className="settings-section">
              <ThemeSelector />
            </div>

            {/* Additional Settings Sections */}
            <div className="settings-section">
              <Card className="settings-card">
                <h3 className="card-title">
                  <i className="pi pi-user" />
                  Account Settings
                </h3>
                <div className="setting-item">
                  <label className="setting-label">Profile Information</label>
                  <p className="setting-description">Manage your account details and preferences</p>
                  <div className="setting-actions">
                    <i className="pi pi-chevron-right" />
                  </div>
                </div>
                <Divider />
                <div className="setting-item">
                  <label className="setting-label">Privacy & Security</label>
                  <p className="setting-description">Control your privacy settings and security options</p>
                  <div className="setting-actions">
                    <i className="pi pi-chevron-right" />
                  </div>
                </div>
                <Divider />
                <div className="setting-item danger-item">
                  <label className="setting-label">Delete Account</label>
                  <p className="setting-description">Permanently delete your account and all associated data</p>
                  <div className="setting-actions">
                    <Button
                      label="Delete Account"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      outlined
                      onClick={() => setShowAccountDeletion(true)}
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div className="settings-section">
              <Card className="settings-card">
                <h3 className="card-title">
                  <i className="pi pi-bell" />
                  Notifications
                </h3>
                <div className="setting-item">
                  <label className="setting-label">Email Notifications</label>
                  <p className="setting-description">Receive updates and alerts via email</p>
                  <div className="setting-actions">
                    <i className="pi pi-chevron-right" />
                  </div>
                </div>
                <Divider />
                <div className="setting-item">
                  <label className="setting-label">Push Notifications</label>
                  <p className="setting-description">Get real-time notifications in your browser</p>
                  <div className="setting-actions">
                    <i className="pi pi-chevron-right" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="settings-section">
              <Card className="settings-card">
                <h3 className="card-title">
                  <i className="pi pi-globe" />
                  Language & Region
                </h3>
                <div className="setting-item">
                  <label className="setting-label">Language</label>
                  <p className="setting-description">Choose your preferred language</p>
                  <div className="setting-actions">
                    <span className="setting-value">English (US)</span>
                    <i className="pi pi-chevron-right" />
                  </div>
                </div>
                <Divider />
                <div className="setting-item">
                  <label className="setting-label">Time Zone</label>
                  <p className="setting-description">Set your local time zone</p>
                  <div className="setting-actions">
                    <span className="setting-value">UTC-5</span>
                    <i className="pi pi-chevron-right" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Account Deletion Dialog */}
        <Dialog
          visible={showAccountDeletion}
          onHide={() => setShowAccountDeletion(false)}
          header="Account Deletion"
          style={{ width: '90vw', maxWidth: '900px' }}
          modal
          maximizable
        >
          <AccountDeletion />
        </Dialog>
      </div>
    </div>
  );
};