import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import UserFeedback, { UserFeedbackData } from './UserFeedback';
import './UserFeedbackDemo.scss';

const UserFeedbackDemo: React.FC = () => {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useRef<Toast>(null);

  // Sample content for demo
  const sampleOriginalContent = "This is a sample AI-generated text that needs to be humanified. It contains technical jargon and robotic language patterns that should be made more natural and conversational.";

  const handleFeedbackSubmit = async (feedbackData: UserFeedbackData) => {
    setIsSubmitting(true);
    
    try {
      // Add timestamp and processing time for complete data
      const completeFeedback = {
        ...feedbackData,
        timestamp: new Date().toISOString(),
        processing_time_ms: Math.floor(Math.random() * 3000) + 1000, // Demo: random processing time
        originalContent: sampleOriginalContent,
        processedContent: "This sample text has been transformed into more natural, conversational language that feels genuinely human-written."
      };

      console.log('Feedback Data to Submit:', completeFeedback);
      
      // Here you would typically save to your backend:
      // await client.models.UserFeedback.create(completeFeedback);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.current?.show({
        severity: 'success',
        summary: 'Feedback Submitted!',
        detail: 'Thank you for your valuable feedback.',
        life: 4000
      });
      
      setShowFeedbackDialog(false);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      toast.current?.show({
        severity: 'error',
        summary: 'Submission Failed',
        detail: 'Unable to submit feedback. Please try again.',
        life: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackCancel = () => {
    setShowFeedbackDialog(false);
  };

  return (
    <div className="feedback-demo-container">
      <div className="demo-header">
        <h2>UserFeedback Component Demo</h2>
        <p>This demo shows how to collect user feedback about content humanification.</p>
      </div>

      <div className="demo-content">
        <div className="sample-content">
          <h3>Sample Content Processing</h3>
          <div className="content-box">
            <h4>Original (AI-generated):</h4>
            <p>{sampleOriginalContent}</p>
          </div>
          <div className="content-box processed">
            <h4>Processed (Humanified):</h4>
            <p>This sample text has been transformed into more natural, conversational language that feels genuinely human-written.</p>
          </div>
        </div>

        <div className="demo-actions">
          <Button
            label="Collect Feedback"
            icon="pi pi-comment"
            onClick={() => setShowFeedbackDialog(true)}
            className="feedback-button"
          />
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog
        header="User Feedback"
        visible={showFeedbackDialog}
        onHide={() => !isSubmitting && handleFeedbackCancel()}
        modal
        className="feedback-dialog"
        style={{ width: '90vw', maxWidth: '700px' }}
        closable={!isSubmitting}
      >
        <UserFeedback
          onSubmit={handleFeedbackSubmit}
          onCancel={handleFeedbackCancel}
          originalContent={sampleOriginalContent}
          disabled={isSubmitting}
        />
      </Dialog>

      {/* Toast for notifications */}
      <Toast ref={toast} position="top-right" className="app-toast" />
    </div>
  );
};

export default UserFeedbackDemo;