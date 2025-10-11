import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { classNames } from 'primereact/utils';
import './FeatureRequestPage.scss';

type CategoryType = 'textprocessing' | 'uiux' | 'billing' | 'performance' | 'integration' | 'other';
type StatusType = 'submitted' | 'underreview' | 'planned' | 'indevelopment' | 'testing' | 'completed' | 'rejected';
type PriorityType = 'low' | 'medium' | 'high' | 'critical';
type VoteType = 'upvote' | 'downvote';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: CategoryType;
  submitterId: string;
  submitterDisplayName?: string;
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  voterCount: number;
  status: StatusType;
  priority: PriorityType;
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
  
  // Form data type
  type FormData = {
    title: string;
    description: string;
    category: CategoryType | null;
    tags: string[];
  };
  
  // Form state with react-hook-form
  const defaultValues: FormData = {
    title: '',
    description: '',
    category: null,
    tags: []
  };

  const { control, formState: { errors }, handleSubmit, reset } = useForm<FormData>({ defaultValues });

  const categories: Array<{ label: string; value: CategoryType; icon: string }> = [
    { label: 'Text Processing', value: 'textprocessing', icon: 'pi pi-file-edit' },
    { label: 'UI/UX', value: 'uiux', icon: 'pi pi-palette' },
    { label: 'Billing', value: 'billing', icon: 'pi pi-credit-card' },
    { label: 'Performance', value: 'performance', icon: 'pi pi-bolt' },
    { label: 'Integration', value: 'integration', icon: 'pi pi-link' },
    { label: 'Other', value: 'other', icon: 'pi pi-question-circle' }
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
        const aVotes = a.totalVotes || 0;
        const bVotes = b.totalVotes || 0;
        if (bVotes !== aVotes) {
          return bVotes - aVotes;
        }
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
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

  const handleVote = async (featureId: string, voteType: VoteType) => {
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

  const handleSubmitFeature = async (data: any) => {
    if (!currentUser) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Authentication Required',
        detail: 'Please sign in to submit features',
        life: 3000
      });
      return;
    }

    try {
      await client.models.FeatureRequest.create({
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category as CategoryType,
        submitterId: currentUser.userId,
        submitterDisplayName: currentUser.signInDetails?.loginId?.split('@')[0] || 'Anonymous',
        upvotes: 0,
        downvotes: 0,
        totalVotes: 0,
        voterCount: 0,
        status: 'submitted' as StatusType,
        priority: 'low' as PriorityType,
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setShowNewFeatureDialog(false);
      reset();
      
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

  const getFormErrorMessage = (name: keyof FormData) => {
    return errors[name] && <small className="p-error">{errors[name]?.message}</small>
  };

  const getStatusSeverity = (status: StatusType): 'success' | 'info' | 'secondary' | 'warning' | 'danger' => {
    switch (status) {
      case 'completed': return 'success';
      case 'indevelopment': return 'info';
      case 'planned': return 'warning';
      case 'underreview': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: PriorityType) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getCategoryIcon = (category: CategoryType) => {
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
        return features.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
      case 1: // Recent
        return features.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        });
      case 2: // In Progress
        return features.filter(f => ['planned', 'indevelopment', 'testing'].includes(f.status));
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
          <TabPanel header="Popular" leftIcon="pi pi-star">
            <DataView
              value={getTabFilteredFeatures(0)}
              itemTemplate={renderFeatureCard}
              layout="grid"
              loading={loading}
              emptyMessage="No feature requests found"
              className="features-grid"
            />
          </TabPanel>
          
          <TabPanel header="Recent" leftIcon="pi pi-clock">
            <DataView
              value={getTabFilteredFeatures(1)}
              itemTemplate={renderFeatureCard}
              layout="grid"
              loading={loading}
              emptyMessage="No feature requests found"
              className="features-grid"
            />
          </TabPanel>
          
          <TabPanel header="In Progress" leftIcon="pi pi-cog">
            <DataView
              value={getTabFilteredFeatures(2)}
              itemTemplate={renderFeatureCard}
              layout="grid"
              loading={loading}
              emptyMessage="No features in progress"
              className="features-grid"
            />
          </TabPanel>
          
          <TabPanel header="Completed" leftIcon="pi pi-check">
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
        style={{ width: '650px', maxWidth: '90vw' }}
        modal
        className="feature-request-dialog"
        footer={
          <div className="dialog-footer">
            <Button
              label="Cancel"
              outlined
              onClick={() => {
                setShowNewFeatureDialog(false);
                reset();
              }}
            />
            <Button 
              label="Submit Request" 
              icon="pi pi-send" 
              onClick={handleSubmit(handleSubmitFeature)}
            />
          </div>
        }
      >
        <form onSubmit={handleSubmit(handleSubmitFeature)} className="feature-form p-fluid">
          <div className="field">
            <span className="p-float-label">
              <Controller 
                name="title" 
                control={control} 
                rules={{ required: 'Title is required.' }} 
                render={({ field, fieldState }) => (
                  <InputText 
                    id={field.name} 
                    {...field} 
                    className={classNames({ 'p-invalid': fieldState.invalid })} 
                  />
                )} 
              />
              <label htmlFor="title" className={classNames({ 'p-error': errors.title })}>Title*</label>
            </span>
            {getFormErrorMessage('title')}
          </div>

          <div className="field">
            <span className="p-float-label">
              <Controller 
                name="category" 
                control={control} 
                rules={{ required: 'Category is required.' }} 
                render={({ field, fieldState }) => (
                  <Dropdown 
                    id={field.name} 
                    value={field.value} 
                    onChange={(e) => field.onChange(e.value)} 
                    options={categories} 
                    optionLabel="label"
                    placeholder="Select a category"
                    className={classNames({ 'p-invalid': fieldState.invalid })} 
                  />
                )} 
              />
              <label htmlFor="category" className={classNames({ 'p-error': errors.category })}>Category*</label>
            </span>
            {getFormErrorMessage('category')}
          </div>

          <div className="field">
            <span className="p-float-label">
              <Controller 
                name="description" 
                control={control} 
                rules={{ required: 'Description is required.' }} 
                render={({ field, fieldState }) => (
                  <InputTextarea 
                    id={field.name} 
                    {...field} 
                    rows={5}
                    className={classNames({ 'p-invalid': fieldState.invalid })} 
                  />
                )} 
              />
              <label htmlFor="description" className={classNames({ 'p-error': errors.description })}>Description*</label>
            </span>
            {getFormErrorMessage('description')}
          </div>

          <div className="field">
            <span className="p-float-label">
              <Controller 
                name="tags" 
                control={control} 
                render={({ field }) => (
                  <MultiSelect 
                    id={field.name} 
                    value={field.value} 
                    onChange={(e) => field.onChange(e.value)} 
                    options={tagOptions} 
                    optionLabel="label"
                    placeholder="Select relevant tags"
                    maxSelectedLabels={3}
                  />
                )} 
              />
              <label htmlFor="tags">Tags (Optional)</label>
            </span>
          </div>
        </form>
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