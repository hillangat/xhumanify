# Stripe Subscription Management Portal Setup Guide

## Overview
This guide will help you create a complete subscription management portal using Stripe's Customer Portal, allowing users to manage their subscriptions, billing, and payment methods.

## Prerequisites
- Stripe account with API keys
- AWS Amplify backend setup
- User authentication system in place
- Existing subscription system

## Step 1: Stripe Dashboard Configuration

### 1.1 Enable Customer Portal in Stripe Dashboard
1. Log into your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Settings** → **Billing** → **Customer Portal**
3. Click **Activate Customer Portal**
4. Configure the following settings:

#### Business Information
- **Business name**: Your company name
- **Privacy policy URL**: https://yourapp.com/privacy
- **Terms of service URL**: https://yourapp.com/terms

#### Functionality Settings
- ✅ **Update payment methods**: Allow customers to add/remove cards
- ✅ **Update billing details**: Allow address/email updates
- ✅ **Download invoices**: Enable invoice downloads
- ✅ **Cancel subscriptions**: Allow self-service cancellation
- ✅ **Pause subscriptions**: Allow subscription pausing (optional)
- ✅ **Switch plans**: Allow plan upgrades/downgrades

#### Appearance
- **Brand color**: Match your app's primary color
- **Logo**: Upload your company logo
- **Custom CSS**: Optional styling overrides

### 1.2 Configure Products and Prices
1. Go to **Products** in Stripe Dashboard
2. Ensure all your subscription plans are properly configured:
   - **Basic Plan**: $X/month
   - **Pro Plan**: $Y/month
   - **Enterprise Plan**: $Z/month

## Step 2: Backend Implementation

### 2.1 Create Stripe Portal Session Function

Create a new Amplify function for generating portal sessions:

```bash
# In your terminal
cd amplify/functions
mkdir stripe-portal
cd stripe-portal
```

#### 2.1.1 Create the Function Resource
**File: `amplify/functions/stripe-portal/resource.ts`**
```typescript
import { defineFunction } from '@aws-amplify/backend';

export const stripePortal = defineFunction({
  name: 'stripe-portal',
  entry: './handler.ts',
  environment: {
    STRIPE_SECRET_KEY: 'YOUR_STRIPE_SECRET_KEY',
    FRONTEND_URL: 'https://yourdomain.com'
  },
  timeoutSeconds: 30
});
```

#### 2.1.2 Create the Handler Function
**File: `amplify/functions/stripe-portal/handler.ts`**
```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { customerId, returnUrl } = body;

    // Validate required parameters
    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Customer ID is required'
        })
      };
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.FRONTEND_URL}/dashboard`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: session.url
      })
    };

  } catch (error) {
    console.error('Error creating portal session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
```

#### 2.1.3 Add Dependencies
**File: `amplify/functions/stripe-portal/package.json`**
```json
{
  "name": "stripe-portal",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "stripe": "^14.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.119"
  }
}
```

### 2.2 Update Backend Configuration

#### 2.2.1 Add Function to Backend
**File: `amplify/backend.ts`**
```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stripePortal } from './functions/stripe-portal/resource';

export const backend = defineBackend({
  auth,
  data,
  stripePortal
});
```

#### 2.2.2 Create API Endpoint
**File: `amplify/data/resource.ts`** (add to existing schema)
```typescript
// Add this to your existing schema
const schema = a.schema({
  // ... existing models ...
  
  createPortalSession: a
    .mutation()
    .arguments({
      customerId: a.string().required(),
      returnUrl: a.string()
    })
    .returns(a.customType({
      url: a.string().required()
    }))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(stripePortal))
});
```

## Step 3: Frontend Implementation

### 3.1 Create Portal Service
**File: `src/utils/stripePortal.ts`**
```typescript
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface PortalSessionResponse {
  url: string;
}

export const createPortalSession = async (
  customerId: string,
  returnUrl?: string
): Promise<string> => {
  try {
    const response = await client.mutations.createPortalSession({
      customerId,
      returnUrl: returnUrl || window.location.origin + '/dashboard'
    });

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    return response.data?.url || '';
  } catch (error) {
    console.error('Failed to create portal session:', error);
    throw new Error('Unable to access subscription portal');
  }
};
```

### 3.2 Create Portal Component
**File: `src/components/SubscriptionPortal.tsx`**
```typescript
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { createPortalSession } from '../utils/stripePortal';

interface SubscriptionPortalProps {
  customerId: string;
  className?: string;
  label?: string;
}

const SubscriptionPortal: React.FC<SubscriptionPortalProps> = ({
  customerId,
  className = '',
  label = 'Manage Subscription'
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  const handlePortalAccess = async () => {
    if (!customerId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'No Subscription',
        detail: 'No active subscription found',
        life: 3000
      });
      return;
    }

    setLoading(true);
    
    try {
      const portalUrl = await createPortalSession(
        customerId,
        window.location.href
      );
      
      // Redirect to Stripe portal
      window.location.href = portalUrl;
      
    } catch (error) {
      console.error('Portal access error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Portal Access Failed',
        detail: error instanceof Error ? error.message : 'Unable to access subscription portal',
        life: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <Button
        label={label}
        icon="pi pi-credit-card"
        onClick={handlePortalAccess}
        loading={loading}
        className={`subscription-portal-btn ${className}`}
        outlined
      />
    </>
  );
};

export default SubscriptionPortal;
```

### 3.3 Add Portal to User Dashboard
**File: `src/components/UserDashboard.tsx`** (or wherever appropriate)
```typescript
import SubscriptionPortal from './SubscriptionPortal';

// In your component where you display subscription info
const UserDashboard = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);

  return (
    <div className="user-dashboard">
      {/* Other dashboard content */}
      
      <div className="subscription-section">
        <h3>Subscription Management</h3>
        <p>Manage your billing, payment methods, and subscription settings.</p>
        
        {subscriptionData?.stripeCustomerId && (
          <SubscriptionPortal 
            customerId={subscriptionData.stripeCustomerId}
            label="Manage Billing"
          />
        )}
      </div>
    </div>
  );
};
```

### 3.4 Add Portal to Pricing Component
**File: `src/components/PricingComponent.tsx`** (update existing)
```typescript
// Add this to your existing pricing component
import SubscriptionPortal from './SubscriptionPortal';

// In the render method where you show current subscription
{hasActiveSubscription && subscription?.stripeCustomerId && (
  <div className="current-subscription">
    <h4>Current Plan: {subscription.planName}</h4>
    <SubscriptionPortal 
      customerId={subscription.stripeCustomerId}
      label="Manage Plan"
      className="manage-plan-btn"
    />
  </div>
)}
```

## Step 4: Environment Configuration

### 4.1 Set Environment Variables
Update your environment configuration:

**File: `.env.local`**
```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL for portal return
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4.2 Update Amplify Environment
```bash
# Set Stripe secret in Amplify
npx ampx sandbox secret set STRIPE_SECRET_KEY
# Enter your Stripe secret key when prompted
```

## Step 5: Testing

### 5.1 Test Portal Creation
1. Create a test customer in Stripe Dashboard
2. Assign a subscription to the test customer
3. Use the customer ID to test portal creation
4. Verify the portal loads with correct customer data

### 5.2 Test Portal Functionality
- ✅ Update payment methods
- ✅ Download invoices
- ✅ Cancel subscription
- ✅ Upgrade/downgrade plans
- ✅ Update billing information

## Step 6: Deployment

### 6.1 Deploy Backend
```bash
# Deploy your Amplify backend
npx ampx sandbox deploy
```

### 6.2 Update Stripe Webhook
If using webhooks, update the endpoint URL in Stripe Dashboard:
- Go to **Developers** → **Webhooks**
- Update the endpoint URL to your deployed function URL

### 6.3 Test Production
1. Test with real Stripe account in test mode
2. Verify all portal functions work correctly
3. Test return URLs redirect properly

## Step 7: Error Handling & Monitoring

### 7.1 Add Comprehensive Error Handling
```typescript
// Enhanced error handling in portal service
export const createPortalSession = async (
  customerId: string,
  returnUrl?: string
): Promise<string> => {
  try {
    // Validate customer ID format
    if (!customerId || !customerId.startsWith('cus_')) {
      throw new Error('Invalid customer ID format');
    }

    const response = await client.mutations.createPortalSession({
      customerId,
      returnUrl: returnUrl || window.location.origin + '/dashboard'
    });

    if (response.errors) {
      // Log error details for debugging
      console.error('GraphQL errors:', response.errors);
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.url) {
      throw new Error('No portal URL received');
    }

    return response.data.url;
    
  } catch (error) {
    // Enhanced error logging
    console.error('Portal session creation failed:', {
      customerId,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString()
    });
    
    throw new Error('Unable to access subscription portal. Please try again or contact support.');
  }
};
```

### 7.2 Add Loading States
```typescript
// Enhanced loading states in component
const [portalState, setPortalState] = useState<{
  loading: boolean;
  error: string | null;
}>({
  loading: false,
  error: null
});
```

## Step 8: Security Considerations

### 8.1 Validate Customer Ownership
Ensure users can only access their own customer portal:

```typescript
// In your backend function
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Get user ID from JWT token
    const userId = event.requestContext.authorizer?.claims?.sub;
    
    // Verify customer belongs to user
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.metadata?.userId !== userId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    // Continue with portal creation...
  } catch (error) {
    // Handle errors...
  }
};
```

### 8.2 Rate Limiting
Implement rate limiting to prevent abuse:

```typescript
// Add rate limiting logic
const rateLimitKey = `portal_${userId}`;
// Implement your rate limiting logic here
```

## Troubleshooting Common Issues

### Issue 1: "Failed to fetch" Error
**Cause**: CORS or network configuration issues
**Solution**: 
- Check CORS headers in function
- Verify API Gateway configuration
- Check network connectivity

### Issue 2: "Customer not found" Error
**Cause**: Invalid customer ID or customer doesn't exist
**Solution**:
- Verify customer ID format (`cus_...`)
- Check if customer exists in Stripe
- Ensure customer is properly created during signup

### Issue 3: Portal doesn't redirect back
**Cause**: Incorrect return URL configuration
**Solution**:
- Verify return URL is properly formatted
- Check Stripe portal settings
- Ensure return URL is whitelisted

### Issue 4: Authentication errors
**Cause**: User not properly authenticated
**Solution**:
- Check user authentication status
- Verify JWT token is valid
- Ensure user has necessary permissions

## Best Practices

1. **Always validate customer ownership** before creating portal sessions
2. **Use proper error handling** and user-friendly error messages
3. **Implement loading states** for better UX
4. **Log errors appropriately** for debugging
5. **Test thoroughly** in both development and production
6. **Monitor portal usage** through Stripe Dashboard
7. **Keep Stripe SDK updated** to latest version
8. **Use environment variables** for all sensitive data

## Next Steps

After completing this setup:
1. Test the complete flow with real users
2. Monitor portal usage in Stripe Dashboard
3. Set up alerts for failed portal creations
4. Consider adding analytics to track user behavior
5. Implement feedback collection for portal experience

This portal setup will provide your users with a professional, secure way to manage their subscriptions while reducing support overhead for your team.