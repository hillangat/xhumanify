import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { Timeline } from 'primereact/timeline';
import FeaturePage from './FeaturePage';
import './AboutPage.scss';

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: 'pi pi-brain',
      title: 'Advanced AI Humanization',
      description: 'Transform robotic AI-generated content into natural, human-like text that passes all detection tools.'
    },
    {
      icon: 'pi pi-shield',
      title: 'Undetectable Output',
      description: 'Our advanced algorithms ensure your content remains undetectable by leading AI detection systems.'
    },
    {
      icon: 'pi pi-palette',
      title: 'Multiple Tone Options',
      description: 'Choose from various writing tones including neutral, professional, casual, academic, and creative.'
    },
    {
      icon: 'pi pi-gauge',
      title: 'Real-time Processing',
      description: 'Experience lightning-fast humanization with detailed usage tracking and instant results.'
    },
    {
      icon: 'pi pi-cloud',
      title: 'Secure & Scalable',
      description: 'Built on AWS infrastructure with enterprise-grade security and unlimited scalability.'
    },
    {
      icon: 'pi pi-users',
      title: 'Community-Driven',
      description: 'Continuous improvements based on user feedback and feature requests from our community.'
    }
  ];

  const techStack = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'AWS Amplify', category: 'Backend' },
    { name: 'Claude 3.5 Sonnet', category: 'AI Model' },
    { name: 'Stripe', category: 'Payments' },
    { name: 'GraphQL', category: 'API' },
    { name: 'DynamoDB', category: 'Database' },
    { name: 'PrimeReact', category: 'UI Components' }
  ];

  const milestones = [
    {
      status: 'Conceptualization',
      date: '2024 Q1',
      icon: 'pi pi-lightbulb',
      color: '#9C27B0',
      description: 'Identified the need for advanced AI content humanization tools'
    },
    {
      status: 'Alpha Development',
      date: '2024 Q2',
      icon: 'pi pi-code',
      color: '#673AB7',
      description: 'Built core humanization engine with Claude 3.5 Sonnet integration'
    },
    {
      status: 'Beta Release',
      date: '2024 Q3',
      icon: 'pi pi-users',
      color: '#FF9800',
      description: 'Launched beta version with subscription management and usage tracking'
    },
    {
      status: 'Public Launch',
      date: '2024 Q4',
      icon: 'pi pi-rocket',
      color: '#4CAF50',
      description: 'Full public release with community features and advanced analytics'
    },
    {
      status: 'Future Expansion',
      date: '2025+',
      icon: 'pi pi-star',
      color: '#2196F3',
      description: 'API access, enterprise features, and multi-language support'
    }
  ];

  return (
    <FeaturePage
      title="About Humanize"
      subtitle="Revolutionizing AI Content with Human Intelligence"
      description="Transform artificial, robotic AI-generated text into authentic, natural content that reads like it was written by a human expert. Our cutting-edge platform bridges the gap between AI efficiency and human authenticity."
      icon="pi-info-circle"
      badge={{
        text: "Advanced AI Platform",
        severity: "info"
      }}
      stats={[
        {
          label: "Undetection Rate",
          value: "99.8%",
          icon: "pi-shield",
          color: "success"
        },
        {
          label: "Processing Speed",
          value: "2.3s",
          icon: "pi-clock",
          color: "info"
        },
        {
          label: "Words Processed",
          value: "50M+",
          icon: "pi-file-edit",
          color: "warning"
        },
        {
          label: "Active Users",
          value: "10K+",
          icon: "pi-users",
          color: "primary"
        }
      ]}
      breadcrumbs={[
        { label: 'Home', url: '/', icon: 'pi-home' },
        { label: 'About', url: '/about', icon: 'pi-info-circle' }
      ]}
      actions={[
        {
          label: "Start Humanizing",
          icon: "pi pi-play",
          onClick: () => window.location.href = '/',
          variant: "primary"
        },
        {
          label: "View Pricing",
          icon: "pi pi-credit-card",
          onClick: () => window.location.href = '/upgrade',
          outlined: true
        }
      ]}
      className="about-page-feature"
    >
      <div className="about-page-content">
      {/* Mission Statement */}
      <section className="mission-section">
        <Card className="mission-card">
          <div className="mission-content">
            <div className="mission-icon">
              <i className="pi pi-heart"></i>
            </div>
            <h2>Our Mission</h2>
            <p>
              To democratize high-quality content creation by providing advanced AI humanization tools that make artificial intelligence output indistinguishable from human writing. We believe that everyone should have access to professional-grade content that maintains authenticity while leveraging the power of AI.
            </p>
          </div>
        </Card>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose Our Platform?</h2>
          <p>Discover the features that make us the leading AI content humanization solution</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <Card key={index} className="feature-card">
              <div className="feature-icon">
                <i className={feature.icon}></i>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Transform your AI content in three simple steps</p>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Input Your Content</h3>
              <p>Paste your AI-generated text into our secure editor. Our system supports content of any length and complexity.</p>
            </div>
          </div>
          <div className="step-arrow">
            <i className="pi pi-arrow-right"></i>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Choose Your Tone</h3>
              <p>Select from multiple writing tones including professional, casual, academic, or creative to match your needs.</p>
            </div>
          </div>
          <div className="step-arrow">
            <i className="pi pi-arrow-right"></i>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get Human-Like Results</h3>
              <p>Receive perfectly humanized content that maintains your original meaning while sounding completely natural.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="technology-section">
        <div className="section-header">
          <h2>Powered by Cutting-Edge Technology</h2>
          <p>Built with enterprise-grade tools and the latest AI innovations</p>
        </div>
        <Card className="tech-card">
          <div className="tech-grid">
            {techStack.map((tech, index) => (
              <div key={index} className="tech-item">
                <Tag value={tech.category} severity="secondary" />
                <span className="tech-name">{tech.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Journey Timeline */}
      <section className="timeline-section">
        <div className="section-header">
          <h2>Our Journey</h2>
          <p>From concept to the leading AI humanization platform</p>
        </div>
        <Card className="timeline-card">
          <Timeline 
            value={milestones} 
            align="alternate" 
            className="custom-timeline"
            marker={(item) => (
              <span 
                className="custom-marker" 
                style={{ backgroundColor: item.color }}
              >
                <i className={item.icon}></i>
              </span>
            )}
            content={(item) => (
              <Card className="timeline-content">
                <div className="timeline-header">
                  <h4>{item.status}</h4>
                  <span className="timeline-date">{item.date}</span>
                </div>
                <p>{item.description}</p>
              </Card>
            )}
          />
        </Card>
      </section>

      {/* The Problem We Solve */}
      <section className="problem-solution-section">
        <div className="problem-solution-grid">
          <Card className="problem-card">
            <div className="card-header">
              <i className="pi pi-exclamation-triangle problem-icon"></i>
              <h3>The Problem</h3>
            </div>
            <ul>
              <li>AI-generated content sounds robotic and unnatural</li>
              <li>Detection tools can easily identify artificial text</li>
              <li>Generic content lacks human personality and warmth</li>
              <li>Manual rewriting is time-consuming and inconsistent</li>
              <li>Existing tools produce weird or random word replacements</li>
            </ul>
          </Card>
          <Card className="solution-card">
            <div className="card-header">
              <i className="pi pi-check-circle solution-icon"></i>
              <h3>Our Solution</h3>
            </div>
            <ul>
              <li>Advanced AI algorithms create natural, flowing text</li>
              <li>Undetectable by all major AI detection systems</li>
              <li>Preserves meaning while adding human authenticity</li>
              <li>Instant processing with consistent quality</li>
              <li>Intelligent context-aware transformations</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Values */}
      <section className="values-section">
        <div className="section-header">
          <h2>Our Core Values</h2>
          <p>The principles that guide everything we do</p>
        </div>
        <div className="values-grid">
          <div className="value-item">
            <i className="pi pi-shield value-icon"></i>
            <h4>Privacy First</h4>
            <p>Your content is secure and private. We never store or share your data beyond processing requirements.</p>
          </div>
          <div className="value-item">
            <i className="pi pi-heart value-icon"></i>
            <h4>Quality Obsessed</h4>
            <p>We're committed to delivering the highest quality humanization that exceeds your expectations.</p>
          </div>
          <div className="value-item">
            <i className="pi pi-users value-icon"></i>
            <h4>Community Driven</h4>
            <p>Our roadmap is shaped by user feedback and feature requests from our vibrant community.</p>
          </div>
          <div className="value-item">
            <i className="pi pi-cog value-icon"></i>
            <h4>Innovation Focus</h4>
            <p>We continuously improve our algorithms and features to stay ahead of the curve.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <Card className="cta-card">
          <div className="cta-content">
            <h2>Ready to Transform Your Content?</h2>
            <p>Join thousands of users who trust our platform for professional-grade AI content humanization.</p>
            <div className="cta-buttons">
              <Button 
                label="Start Humanizing" 
                icon="pi pi-play"
                className="p-button-lg"
                onClick={() => window.location.href = '/'}
              />
              <Button 
                label="View Pricing" 
                icon="pi pi-credit-card"
                outlined
                className="p-button-lg"
                onClick={() => window.location.href = '/upgrade'}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Contact */}
      <section className="contact-section">
        <Divider />
        <div className="contact-content">
          <h3>Get in Touch</h3>
          <p>Have questions or need support? We're here to help!</p>
          <div className="contact-links">
            <Button 
              label="Feature Request" 
              icon="pi pi-plus"
              outlined
              onClick={() => window.location.href = '/features'}
            />
            <Button 
              label="Contact Support" 
              icon="pi pi-envelope"
              outlined
              onClick={() => window.location.href = 'mailto:support@humanizeaicontents.com'}
            />
          </div>
          
          <div className="legal-links">
            <Button 
              label="Terms of Service" 
              link 
              className="legal-link"
              onClick={() => window.location.href = '/terms'}
            />
            <Button 
              label="Privacy Policy" 
              link 
              className="legal-link"
              onClick={() => window.location.href = '/privacy'}
            />
          </div>
        </div>
      </section>
      </div>
    </FeaturePage>
  );
};

export default AboutPage;