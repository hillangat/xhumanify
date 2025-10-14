import React from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import FeaturePage from './FeaturePage';
import './TermsOfService.scss';

const TermsOfService: React.FC = () => {
  const lastUpdated = "October 13, 2025";
  const effectiveDate = "October 13, 2025";

  return (
    <FeaturePage
      title="Terms of Service"
      subtitle="Legal Terms and Conditions"
      description="Please read these terms carefully. They constitute a legally binding agreement between you and Humanize AI Content. By using our service, you agree to be bound by these terms."
      icon="pi pi-file"
      badge={{
        text: `Updated ${lastUpdated}`,
        severity: "info"
      }}
      stats={[
        {
          label: "Effective Date",
          value: effectiveDate,
          icon: "pi pi-calendar",
          color: "info"
        },
        {
          label: "Sections",
          value: "15",
          icon: "pi pi-list",
          color: "primary"
        },
        {
          label: "Legal Protection",
          value: "Full",
          icon: "pi pi-shield",
          color: "success"
        }
      ]}
      breadcrumbs={[
        { label: 'Home', url: '/', icon: "pi-home" },
        { label: 'Terms of Service', url: '/terms', icon: "pi-file" }
      ]}
      actions={[
        {
          label: "Return to Application",
          icon: "pi pi-arrow-left",
          onClick: () => window.location.href = '/',
          outlined: true
        },
        {
          label: "Contact Support",
          icon: "pi pi-envelope",
          onClick: () => window.location.href = 'mailto:support@humanizeaicontents.com',
          variant: "secondary"
        }
      ]}
      className="terms-of-service-page"
    >
      <div className="terms-of-service-content">

      <Card className="terms-content">
        <div className="terms-section">
          <h2>1. ACCEPTANCE OF TERMS</h2>
          <p>
            By accessing, using, or subscribing to the Humanize AI Content service ("Service"), including the website located at <strong>humanizeaicontents.com</strong> and all associated applications, APIs, and platforms (collectively, the "Platform"), you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legally binding agreement between you and Humanize AI Content ("Company," "we," "us," or "our").
          </p>
          <p>
            IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE SERVICE. Your use of the Service constitutes acceptance of these Terms as they may be amended from time to time.
          </p>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>2. DESCRIPTION OF SERVICE</h2>
          <p>
            The Service provides artificial intelligence-powered content transformation tools designed to modify AI-generated text to appear more human-authored ("Content Humanization"). The Service includes:
          </p>
          <ul>
            <li>AI-powered text processing and rewriting capabilities</li>
            <li>Multiple tone and style options (neutral, professional, casual, academic, creative)</li>
            <li>Usage tracking and analytics</li>
            <li>Subscription management and billing services</li>
            <li>Customer support and documentation</li>
            <li>Feature request and community feedback systems</li>
          </ul>
          <p>
            The Service operates on a subscription basis with different tiers (Free, Lite, Standard, Pro) offering varying usage limits and features.
          </p>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>3. USER ELIGIBILITY AND ACCOUNT REGISTRATION</h2>
          <h3>3.1 Eligibility</h3>
          <p>
            You must be at least 18 years old and capable of forming a binding contract to use the Service. If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
          </p>
          
          <h3>3.2 Account Registration</h3>
          <p>
            To access certain features, you must create an account providing accurate, current, and complete information. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Immediately notifying us of any unauthorized use</li>
            <li>Keeping your account information current and accurate</li>
          </ul>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>4. ACCEPTABLE USE POLICY</h2>
          <h3>4.1 Permitted Uses</h3>
          <p>You may use the Service only for lawful purposes and in accordance with these Terms. Permitted uses include:</p>
          <ul>
            <li>Processing your own original content or content you have legal rights to modify</li>
            <li>Academic and research purposes (subject to institutional policies)</li>
            <li>Business communications and marketing materials you own</li>
            <li>Personal writing and creative projects</li>
          </ul>

          <h3>4.2 Prohibited Uses</h3>
          <p>You agree NOT to use the Service for:</p>
          <ul>
            <li><strong>Illegal Activities:</strong> Any unlawful purpose or activity prohibited by applicable laws</li>
            <li><strong>Academic Misconduct:</strong> Violating academic integrity policies, including plagiarism, cheating, or misrepresenting authorship in academic submissions</li>
            <li><strong>Intellectual Property Infringement:</strong> Processing copyrighted content without authorization</li>
            <li><strong>Harmful Content:</strong> Creating, processing, or distributing content that is defamatory, harassing, threatening, or promotes violence</li>
            <li><strong>Spam and Abuse:</strong> Mass-producing content for spam, manipulation, or deceptive practices</li>
            <li><strong>Misinformation:</strong> Deliberately creating or spreading false information</li>
            <li><strong>Commercial Misrepresentation:</strong> Misrepresenting AI-generated content as human-authored where disclosure is required by law</li>
            <li><strong>System Abuse:</strong> Attempting to circumvent usage limits, reverse engineer the Service, or disrupt operations</li>
            <li><strong>Automated Abuse:</strong> Using bots, scrapers, or automated tools without prior written consent</li>
          </ul>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>5. CONTENT AND INTELLECTUAL PROPERTY</h2>
          <h3>5.1 User Content</h3>
          <p>
            You retain ownership of all content you submit to the Service ("User Content"). By submitting User Content, you grant us a non-exclusive, worldwide, royalty-free license to:
          </p>
          <ul>
            <li>Process, store, and transmit your User Content as necessary to provide the Service</li>
            <li>Create derivative works (the humanized output) from your User Content</li>
            <li>Use anonymized, aggregated data for service improvement and analytics</li>
          </ul>
          
          <h3>5.2 Generated Content</h3>
          <p>
            The output generated by our Service ("Generated Content") is provided to you under a non-exclusive license. You may use Generated Content according to these Terms, but you acknowledge that:
          </p>
          <ul>
            <li>Generated Content may not be unique to you</li>
            <li>Similar outputs may be generated for other users with similar inputs</li>
            <li>You are responsible for ensuring Generated Content meets your specific use case requirements</li>
          </ul>

          <h3>5.3 Our Intellectual Property</h3>
          <p>
            The Service, including all software, algorithms, user interfaces, and documentation, is our proprietary property protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on our technology.
          </p>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>6. SUBSCRIPTION TERMS AND BILLING</h2>
          <h3>6.1 Subscription Plans</h3>
          <p>
            We offer multiple subscription tiers with different usage limits and features:
          </p>
          <ul>
            <li><strong>Free Plan:</strong> 1,500 words per month with basic features</li>
            <li><strong>Lite Plan:</strong> 20,000 words per month at $19/month or $171/year</li>
            <li><strong>Standard Plan:</strong> 50,000 words per month at $29/month or $261/year</li>
            <li><strong>Pro Plan:</strong> 150,000 words per month at $79/month or $711/year</li>
          </ul>

          <h3>6.2 Billing and Payment</h3>
          <p>
            Subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as expressly provided in these Terms or required by law. We use Stripe for payment processing, and you agree to Stripe's terms of service.
          </p>

          <h3>6.3 Usage Limits and Overage</h3>
          <p>
            Usage is calculated based on word count of both input and output content, converted from token usage. We do not charge overage fees - service access is suspended when limits are exceeded until the next billing cycle or plan upgrade.
          </p>

          <h3>6.4 Automatic Renewal and Cancellation</h3>
          <p>
            Subscriptions automatically renew unless cancelled. You may cancel at any time through your account settings or customer portal. Cancellation takes effect at the end of the current billing period.
          </p>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>7. PRIVACY AND DATA PROTECTION</h2>
          <p>
            Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. Key points include:
          </p>
          <ul>
            <li>We process User Content only to provide the Service</li>
            <li>Content is not stored longer than necessary for processing</li>
            <li>We use AWS infrastructure with enterprise-grade security</li>
            <li>We may use anonymized, aggregated data for service improvement</li>
            <li>We comply with applicable data protection laws including GDPR and CCPA</li>
          </ul>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>8. SERVICE AVAILABILITY AND MODIFICATIONS</h2>
          <h3>8.1 Service Availability</h3>
          <p>
            While we strive for high availability, we do not guarantee uninterrupted access to the Service. We may temporarily suspend or restrict access for maintenance, updates, or security reasons.
          </p>

          <h3>8.2 Service Modifications</h3>
          <p>
            We reserve the right to modify, update, or discontinue features of the Service at our discretion. We will provide reasonable notice of material changes that affect your use of the Service.
          </p>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>9. DISCLAIMERS AND LIMITATIONS OF LIABILITY</h2>
          <h3>9.1 Service Disclaimers</h3>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, INCLUDING:
          </p>
          <ul>
            <li>Accuracy, completeness, or quality of Generated Content</li>
            <li>Guarantee that Generated Content will be undetectable by AI detection tools</li>
            <li>Fitness for any particular purpose</li>
            <li>Non-infringement of third-party rights</li>
            <li>Uninterrupted or error-free operation</li>
          </ul>

          <h3>9.2 Content Responsibility</h3>
          <p>
            You acknowledge that:
          </p>
          <ul>
            <li>Generated Content may contain errors, inaccuracies, or inappropriate material</li>
            <li>You are solely responsible for reviewing and verifying Generated Content</li>
            <li>We have no obligation to monitor or review User Content or Generated Content</li>
            <li>You assume all risks associated with your use of Generated Content</li>
          </ul>

          <h3>9.3 Limitation of Liability</h3>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM. WE SHALL NOT BE LIABLE FOR:
          </p>
          <ul>
            <li>Indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, revenue, data, or business opportunities</li>
            <li>Damages resulting from use of Generated Content</li>
            <li>Third-party claims arising from your use of the Service</li>
          </ul>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>10. INDEMNIFICATION</h2>
          <p>
            You agree to indemnify, defend, and hold harmless the Company, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including attorneys' fees) arising from:
          </p>
          <ul>
            <li>Your use of the Service in violation of these Terms</li>
            <li>Your User Content or use of Generated Content</li>
            <li>Your violation of any third-party rights</li>
            <li>Your violation of applicable laws or regulations</li>
          </ul>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>11. TERMINATION</h2>
          <h3>11.1 Termination by You</h3>
          <p>
            You may terminate your account at any time by contacting customer support or using account settings. Paid subscriptions remain active until the end of the billing period.
          </p>

          <h3>11.2 Termination by Us</h3>
          <p>
            We may suspend or terminate your access immediately if you:
          </p>
          <ul>
            <li>Violate these Terms or our Acceptable Use Policy</li>
            <li>Engage in fraudulent or illegal activities</li>
            <li>Pose a security risk to the Service or other users</li>
            <li>Fail to pay subscription fees</li>
          </ul>

          <h3>11.3 Effect of Termination</h3>
          <p>
            Upon termination, your access to the Service will cease, and we may delete your account data according to our data retention policies. Provisions that should survive termination will remain in effect.
          </p>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>12. DISPUTE RESOLUTION</h2>
          <h3>12.1 Governing Law</h3>
          <p>
            These Terms are governed by the laws of [YOUR_JURISDICTION], without regard to conflict of law principles.
          </p>

          <h3>12.2 Dispute Resolution Process</h3>
          <p>
            Any disputes arising from these Terms or your use of the Service shall be resolved through:
          </p>
          <ol>
            <li><strong>Informal Resolution:</strong> Good faith negotiation for 30 days</li>
            <li><strong>Binding Arbitration:</strong> Individual arbitration under [ARBITRATION_RULES] if informal resolution fails</li>
            <li><strong>Class Action Waiver:</strong> You waive the right to participate in class actions or collective proceedings</li>
          </ol>

          <h3>12.3 Exceptions</h3>
          <p>
            Either party may seek injunctive relief in court for intellectual property infringement or misuse of confidential information.
          </p>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>13. CHANGES TO TERMS</h2>
          <p>
            We may update these Terms to reflect changes in our Service, business practices, or legal requirements. Material changes will be communicated through:
          </p>
          <ul>
            <li>Email notification to your registered email address</li>
            <li>Prominent notice in the Service interface</li>
            <li>Updated "Last Modified" date on this page</li>
          </ul>
          <p>
            Continued use of the Service after changes become effective constitutes acceptance of the updated Terms.
          </p>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>14. MISCELLANEOUS PROVISIONS</h2>
          <h3>14.1 Entire Agreement</h3>
          <p>
            These Terms, together with our Privacy Policy and any additional agreements, constitute the entire agreement between you and us regarding the Service.
          </p>

          <h3>14.2 Severability</h3>
          <p>
            If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force and effect.
          </p>

          <h3>14.3 Force Majeure</h3>
          <p>
            We shall not be liable for any failure to perform due to causes beyond our reasonable control, including natural disasters, government actions, or infrastructure failures.
          </p>

          <h3>14.4 Assignment</h3>
          <p>
            We may assign these Terms in connection with a merger, acquisition, or sale of assets. You may not assign your rights without our written consent.
          </p>

          <h3>14.5 Export Compliance</h3>
          <p>
            The Service may be subject to export control laws. You agree to comply with all applicable import and export regulations.
          </p>
        </div>

        <Divider />

        <div className="terms-section">
          <h2>15. CONTACT INFORMATION</h2>
          <p>
            For questions about these Terms or the Service, please contact us:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> support@humanizeaicontents.com</p>
            {/* <p><strong>Address:</strong> [YOUR_BUSINESS_ADDRESS]</p> */}
            <p><strong>Business Hours:</strong> 9am - 5pm EST</p>
          </div>
        </div>

        <Divider />

        <div className="acknowledgment-section">
          <h2>ACKNOWLEDGMENT</h2>
          <p>
            BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT USE THE SERVICE.
          </p>
          
          <div className="terms-actions">
            <Button 
              label="Return to Application" 
              icon="pi pi-arrow-left"
              onClick={() => window.location.href = '/'}
              className="p-button-outlined"
            />
            <Button 
              label="Contact Support" 
              icon="pi pi-envelope"
              onClick={() => window.location.href = 'mailto:support@humanizeaicontents.com'}
              className="p-button-secondary"
            />
          </div>
        </div>
      </Card>
      </div>
    </FeaturePage>
  );
};

export default TermsOfService;