import React from 'react';
import FeaturePage from './FeaturePage';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import './ContactPage.scss';

const ContactPage: React.FC = () => {
  const handleEmailSupport = () => {
    window.location.href = 'mailto:support@humanizeaicontents.com?subject=Support Request - Humanify AI';
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('support@humanizeaicontents.com');
      // You could add a toast notification here if you have one
    } catch (err) {
      console.log('Failed to copy email');
    }
  };

  return (
    <FeaturePage
      title="Contact Support"
      subtitle="We're Here to Help"
      description="Have a question, concern, or need assistance? We're dedicated to providing you with the best possible support experience."
      icon="pi-envelope"
      badge={{
        text: "24-48h Response",
        severity: "success"
      }}
      stats={[
        {
          label: "Response Time",
          value: "24-48h",
          icon: "pi-clock",
          color: "#10b981"
        },
        {
          label: "Support Rating",
          value: "4.9/5",
          icon: "pi-star",
          color: "#f59e0b"
        },
        {
          label: "Issues Resolved",
          value: "99.2%",
          icon: "pi-check-circle",
          color: "#8b5cf6"
        }
      ]}
      actions={[
        {
          label: "Email Support",
          icon: "pi pi-envelope",
          onClick: handleEmailSupport,
          variant: "primary"
        }
      ]}
      breadcrumbs={[
        {
          label: "Home",
          url: "/",
          icon: "pi-home"
        },
        {
          label: "Contact Support", icon: "pi-envelope"
        }
      ]}
      headerGradient="linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"
      animated={true}
    >
      <div className="contact-page-content">
        <div className="contact-main-card">
          <Card className="support-card">
            <div className="support-content">
              <div className="support-icon">
                <i className="pi pi-heart-fill" />
              </div>
              <h2>We Care About Your Experience</h2>
              <p className="support-message">
                Your concerns and feedback are incredibly important to us. We understand that when you reach out for support, 
                you need help, and we're committed to providing you with the assistance you deserve.
              </p>
              
              <div className="email-section">
                <h3>Get in Touch</h3>
                <p>
                  For any questions, technical issues, billing inquiries, or general support, 
                  please contact us at:
                </p>
                
                <div className="email-container">
                  <div className="email-display">
                    <i className="pi pi-envelope" />
                    <span className="email-text">support@humanizeaicontents.com</span>
                    <Button 
                      icon="pi pi-copy" 
                      className="p-button-text copy-btn"
                      onClick={handleCopyEmail}
                      tooltip="Copy email address"
                      tooltipOptions={{ position: 'top' }}
                    />
                  </div>
                  
                  <Button 
                    label="Send Email"
                    icon="pi pi-external-link"
                    className="email-button"
                    onClick={handleEmailSupport}
                  />
                </div>
              </div>

              <div className="commitment-section">
                <h3>Our Commitment to You</h3>
                <div className="commitment-grid">
                  <div className="commitment-item">
                    <i className="pi pi-clock" />
                    <div>
                      <h4>Quick Response</h4>
                      <p>We strive to respond to all inquiries within 24-48 hours</p>
                    </div>
                  </div>
                  
                  <div className="commitment-item">
                    <i className="pi pi-heart" />
                    <div>
                      <h4>Personal Care</h4>
                      <p>Every message is read and handled with personal attention</p>
                    </div>
                  </div>
                  
                  <div className="commitment-item">
                    <i className="pi pi-shield" />
                    <div>
                      <h4>Dedicated Resolution</h4>
                      <p>We're committed to resolving your issues as quickly and thoroughly as possible</p>
                    </div>
                  </div>
                  
                  <div className="commitment-item">
                    <i className="pi pi-users" />
                    <div>
                      <h4>Human Support</h4>
                      <p>Real people who understand your needs and can provide meaningful help</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="final-message">
                <div className="message-highlight">
                  <i className="pi pi-info-circle" />
                  <p>
                    <strong>We're here for you.</strong> Whether you're experiencing a technical issue, 
                    have a question about your subscription, or simply want to share feedback about our service, 
                    we want to hear from you. Your success with Humanify AI is our priority, and we'll do 
                    everything humanly possible to ensure you have the best experience.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </FeaturePage>
  );
};

export default ContactPage;