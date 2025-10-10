import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { DataView } from 'primereact/dataview';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressBar } from 'primereact/progressbar';
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { Timeline } from 'primereact/timeline';
import './FeatureRequestPage.scss';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  submitterId: string;
  submitterDisplayName?: string;
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  voterCount: number;
  status: string;
  priority: string;
  adminNotes?: string;
  publicResponse?: string;
  estimatedEffort?: string;
  targetVersion?: string;
  assignedTo?: string;
  tags?: string[];
  relatedFeatures?: string[];
  duplicateOf?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface FeatureVote {
  id: string;
  featureRequestId: string;
  userId: string;
  voteType: string;
  createdAt: string;
}

const FeatureRequestPage: React.FC = () => {
  const client = generateClient<Schema>();
  const toast = useRef<Toast>(null);
  
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFeatureDialog, setShowNewFeatureDialog] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  const [showFeatureDetail, setShowFeatureDetail] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Map<string, string>>(new Map());
  const [activeTab, setActiveTab] = useState(0);
  
  // Form state
  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    category: '',
    tags: []
  });

  const categories = [
    { label: 'Text Processing', value: 'text-processing', icon: 'pi pi-file-edit' },
    { label: 'UI/UX', value: 'ui-ux', icon: 'pi pi-palette' },
    { label: 'Billing', value: 'billing', icon: 'pi pi-credit-card' },
    { label: 'Performance', value: 'performance', icon: 'pi pi-bolt' },
    { label: 'Integration', value: 'integration', icon: 'pi pi-link' },
    { label: 'Other', value: 'other', icon: 'pi pi-question-circle' }
  ];

  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Under Review', value: 'under-review' },
    { label: 'Planned', value: 'planned' },
    { label: 'In Development', value: 'in-development' },
    { label: 'Testing', value: 'testing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Rejected', value: 'rejected' }
  ];

  const tagOptions = [
    { label: 'High Priority', value: 'high-priority' },
    { label: 'Easy Win', value: 'easy-win' },
    { label: 'Popular', value: 'popular' },
    { label: 'AI Enhancement', value: 'ai-enhancement' },
    { label: 'User Experience', value: 'user-experience' },
    { label: 'Performance', value: 'performance' },
    { label: 'Accessibility', value: 'accessibility' }
  ];

  useEffect(() => {
    loadFeatures();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      loadUserVotes(user.userId);
    } catch (error) {
      console.log('No authenticated user');
    }
  };

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const { data } = await client.models.FeatureRequest.list({
        limit: 100
      });
      
      // Sort by total votes (popularity) and then by creation date
      const sortedFeatures = data.sort((a, b) => {
        if (b.totalVotes !== a.totalVotes) {
          return b.totalVotes - a.totalVotes;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setFeatures(sortedFeatures as FeatureRequest[]);
    } catch (error) {
      console.error('Error loading features:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load feature requests',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserVotes = async (userId: string) => {
    try {
      const { data } = await client.models.FeatureVote.list({
        filter: { userId: { eq: userId } }
      });
      
      const votesMap = new Map();
      data.forEach(vote => {
        votesMap.set(vote.featureRequestId, vote.voteType);
      });
      setUserVotes(votesMap);
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  const handleVote = async (featureId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Authentication Required',
        detail: 'Please sign in to vote on features',
        life: 3000
      });
      return;
    }

    try {
      const existingVote = userVotes.get(featureId);
      
      if (existingVote === voteType) {
        // Remove vote if clicking same vote type
        const votes = await client.models.FeatureVote.list({
          filter: { 
            featureRequestId: { eq: featureId },
            userId: { eq: currentUser.userId }
          }
        });
        
        if (votes.data.length > 0) {
          await client.models.FeatureVote.delete({ id: votes.data[0].id });
          userVotes.delete(featureId);
        }
      } else {
        // Update or create vote
        const votes = await client.models.FeatureVote.list({
          filter: { 
            featureRequestId: { eq: featureId },
            userId: { eq: currentUser.userId }
          }
        });
        
        if (votes.data.length > 0) {
          await client.models.FeatureVote.update({
            id: votes.data[0].id,
            voteType: voteType
          });
        } else {
          await client.models.FeatureVote.create({
            featureRequestId: featureId,
            userId: currentUser.userId,
            voteType: voteType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        userVotes.set(featureId, voteType);
      }
      
      setUserVotes(new Map(userVotes));
      
      // Refresh feature data to update vote counts
      await loadFeatures();
      
    } catch (error) {
      console.error('Error voting:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to submit vote',
        life: 3000
      });
    }
  };

  const handleSubmitFeature = async () => {
    if (!currentUser) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Authentication Required',
        detail: 'Please sign in to submit features',
        life: 3000
      });
      return;
    }

    if (!newFeature.title.trim() || !newFeature.description.trim() || !newFeature.category) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Incomplete Form',
        detail: 'Please fill in all required fields',
        life: 3000
      });
      return;
    }

    try {
      await client.models.FeatureRequest.create({
        title: newFeature.title.trim(),
        description: newFeature.description.trim(),
        category: newFeature.category,
        submitterId: currentUser.userId,
        submitterDisplayName: currentUser.signInDetails?.loginId?.split('@')[0] || 'Anonymous',
        upvotes: 0,
        downvotes: 0,
        totalVotes: 0,
        voterCount: 0,
        status: 'submitted',
        priority: 'low',
        tags: newFeature.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setShowNewFeatureDialog(false);
      setNewFeature({ title: '', description: '', category: '', tags: [] });
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Feature request submitted successfully!',
        life: 3000
      });
      
      await loadFeatures();
      
    } catch (error) {
      console.error('Error submitting feature:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to submit feature request',
        life: 3000
      });
    }
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-development': return 'info';
      case 'planned': return 'warning';
      case 'under-review': return 'help';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || 'pi pi-question-circle';
  };

  const renderFeatureCard = (feature: FeatureRequest) => {
    const userVote = userVotes.get(feature.id);
    
    const header = (
      <div className="feature-card-header">
        <div className="category-info">
          <i className={getCategoryIcon(feature.category)} />
          <span>{categories.find(c => c.value === feature.category)?.label}</span>
        </div>
        <div className="voting-section">
          <Button
            icon="pi pi-angle-up"
            className={`vote-btn upvote ${userVote === 'upvote' ? 'active' : ''}`}
            onClick={() => handleVote(feature.id, 'upvote')}
            text
            size="small"
          />
          <span className="vote-count">{feature.upvotes - feature.downvotes}</span>
          <Button
            icon="pi pi-angle-down"
            className={`vote-btn downvote ${userVote === 'downvote' ? 'active' : ''}`}
            onClick={() => handleVote(feature.id, 'downvote')}
            text
            size="small"
          />
        </div>
      </div>
    );

    const footer = (
      <div className="feature-card-footer">
        <div className="status-info">
          <Tag 
            value={feature.status} 
            severity={getStatusSeverity(feature.status)} 
            className="status-tag"
          />
          {feature.priority && (
            <Badge 
              value={feature.priority} 
              style={{ backgroundColor: getPriorityColor(feature.priority) }}
            />
          )}
        </div>
        <div className="meta-info">
          <small>
            by {feature.submitterDisplayName || 'Anonymous'} • 
            {new Date(feature.createdAt).toLocaleDateString()}
          </small>
        </div>
      </div>
    );

    return (
      <Card
        header={header}
        footer={footer}
        className="feature-card"
        onClick={() => {
          setSelectedFeature(feature);
          setShowFeatureDetail(true);
        }}
      >
        <div className="feature-content">
          <h3>{feature.title}</h3>
          <p className="description">
            {feature.description.length > 150 
              ? `${feature.description.substring(0, 150)}...` 
              : feature.description
            }
          </p>
          
          {feature.tags && feature.tags.length > 0 && (
            <div className="tags-section">
              {feature.tags.slice(0, 3).map((tag, index) => (
                <Tag key={index} value={tag} className="feature-tag" />
              ))}
              {feature.tags.length > 3 && (
                <span className="more-tags">+{feature.tags.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  const getTabFilteredFeatures = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // Popular
        return features.sort((a, b) => b.totalVotes - a.totalVotes);
      case 1: // Recent
        return features.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 2: // In Progress
        return features.filter(f => ['planned', 'in-development', 'testing'].includes(f.status));
      case 3: // Completed
        return features.filter(f => f.status === 'completed');
      default:
        return features;
    }
  };

  const toolbarStartContent = (
    <div className="toolbar-start">
      <h2>Feature Requests</h2>
      <Badge value={features.length} className="feature-count" />
    </div>
  );

  const toolbarEndContent = (
    <Button
      label="Submit Feature"
      icon="pi pi-plus"
      onClick={() => setShowNewFeatureDialog(true)}
      className="submit-feature-btn"
    />
  );

  return (
    <div className="feature-request-page">
      <Toast ref={toast} />
      
      <Toolbar 
        start={toolbarStartContent}
        end={toolbarEndContent}
        className="page-toolbar"
      />

      <div className="content-container">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          <TabPanel header="🔥 Popular" leftIcon="pi pi-star">
            <DataView
              value={getTabFilteredFeatures(0)}
              itemTemplate={renderFeatureCard}
              layout="grid"
              loading={loading}
              emptyMessage="No feature requests found"
              className="features-grid"
            />
          </TabPanel>
          
          <TabPanel header="🆕 Recent" leftIcon="pi pi-clock">
            <DataView
              value={getTabFilteredFeatures(1)}
              itemTemplate={renderFeatureCard}
              layout="grid"
              loading={loading}
              emptyMessage="No feature requests found"
              className="features-grid"
            />
          </TabPanel>
          
          <TabPanel header="🚧 In Progress" leftIcon="pi pi-cog">
            <DataView
              value={getTabFilteredFeatures(2)}
              itemTemplate={renderFeatureCard}
              layout="grid"
              loading={loading}
              emptyMessage="No features in progress"
              className="features-grid"
            />
          </TabPanel>
          
          <TabPanel header="✅ Completed" leftIcon="pi pi-check">
            <DataView
              value={getTabFilteredFeatures(3)}
              itemTemplate={renderFeatureCard}
              layout="grid"
              loading={loading}
              emptyMessage="No completed features"
              className="features-grid"
            />
          </TabPanel>
        </TabView>
      </div>

      {/* Submit New Feature Dialog */}
      <Dialog
        header="Submit New Feature Request"
        visible={showNewFeatureDialog}
        onHide={() => setShowNewFeatureDialog(false)}
        style={{ width: '600px' }}
        modal
        footer={
          <div className="dialog-footer">
            <Button
              label="Cancel"
              outlined
              onClick={() => setShowNewFeatureDialog(false)}
            />
            <Button
              label="Submit"
              icon="pi pi-send"
              onClick={handleSubmitFeature}
            />
          </div>
        }
      >
        <div className="feature-form">
          <div className="form-field">
            <label htmlFor="title">Title *</label>
            <InputText
              id="title"
              value={newFeature.title}
              onChange={(e) => setNewFeature({...newFeature, title: e.target.value})}
              placeholder="Brief, descriptive title for your feature"
              className="w-full"
            />
          </div>

          <div className="form-field">
            <label htmlFor="category">Category *</label>
            <Dropdown
              id="category"
              value={newFeature.category}
              options={categories}
              onChange={(e) => setNewFeature({...newFeature, category: e.value})}
              placeholder="Select a category"
              className="w-full"
            />
          </div>

          <div className="form-field">
            <label htmlFor="description">Description *</label>
            <InputTextarea
              id="description"
              value={newFeature.description}
              onChange={(e) => setNewFeature({...newFeature, description: e.target.value})}
              placeholder="Detailed description of the feature and why it would be valuable"
              rows={5}
              className="w-full"
            />
          </div>

          <div className="form-field">
            <label htmlFor="tags">Tags (Optional)</label>
            <MultiSelect
              id="tags"
              value={newFeature.tags}
              options={tagOptions}
              onChange={(e) => setNewFeature({...newFeature, tags: e.value})}
              placeholder="Select relevant tags"
              className="w-full"
              maxSelectedLabels={3}
            />
          </div>
        </div>
      </Dialog>

      {/* Feature Detail Dialog */}
      {selectedFeature && (
        <Dialog
          header={selectedFeature.title}
          visible={showFeatureDetail}
          onHide={() => setShowFeatureDetail(false)}
          style={{ width: '800px' }}
          modal
        >
          <div className="feature-detail">
            <div className="detail-header">
              <div className="voting-section large">
                <Button
                  icon="pi pi-angle-up"
                  className={`vote-btn upvote large ${userVotes.get(selectedFeature.id) === 'upvote' ? 'active' : ''}`}
                  onClick={() => handleVote(selectedFeature.id, 'upvote')}
                  text
                />
                <span className="vote-count large">{selectedFeature.upvotes - selectedFeature.downvotes}</span>
                <Button
                  icon="pi pi-angle-down"
                  className={`vote-btn downvote large ${userVotes.get(selectedFeature.id) === 'downvote' ? 'active' : ''}`}
                  onClick={() => handleVote(selectedFeature.id, 'downvote')}
                  text
                />
              </div>
              
              <div className="status-badges">
                <Tag 
                  value={selectedFeature.status} 
                  severity={getStatusSeverity(selectedFeature.status)} 
                  className="status-tag large"
                />
                <Badge 
                  value={selectedFeature.priority} 
                  style={{ backgroundColor: getPriorityColor(selectedFeature.priority) }}
                  className="priority-badge"
                />
                <Tag 
                  value={categories.find(c => c.value === selectedFeature.category)?.label} 
                  icon={getCategoryIcon(selectedFeature.category)}
                  className="category-tag"
                />
              </div>
            </div>

            <Divider />

            <div className="detail-content">
              <h4>Description</h4>
              <p>{selectedFeature.description}</p>

              {selectedFeature.publicResponse && (
                <>
                  <Divider />
                  <h4>Team Response</h4>
                  <div className="admin-response">
                    <Avatar icon="pi pi-users" className="admin-avatar" />
                    <p>{selectedFeature.publicResponse}</p>
                  </div>
                </>
              )}

              {selectedFeature.tags && selectedFeature.tags.length > 0 && (
                <>
                  <Divider />
                  <h4>Tags</h4>
                  <div className="tags-section">
                    {selectedFeature.tags.map((tag, index) => (
                      <Tag key={index} value={tag} className="feature-tag" />
                    ))}
                  </div>
                </>
              )}

              <Divider />
              <div className="meta-information">
                <div className="meta-item">
                  <strong>Submitted by:</strong> {selectedFeature.submitterDisplayName || 'Anonymous'}
                </div>
                <div className="meta-item">
                  <strong>Created:</strong> {new Date(selectedFeature.createdAt).toLocaleDateString()}
                </div>
                <div className="meta-item">
                  <strong>Last updated:</strong> {new Date(selectedFeature.updatedAt).toLocaleDateString()}
                </div>
                {selectedFeature.estimatedEffort && (
                  <div className="meta-item">
                    <strong>Estimated effort:</strong> {selectedFeature.estimatedEffort}
                  </div>
                )}
                {selectedFeature.targetVersion && (
                  <div className="meta-item">
                    <strong>Target version:</strong> {selectedFeature.targetVersion}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default FeatureRequestPage;