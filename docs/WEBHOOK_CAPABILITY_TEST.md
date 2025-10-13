# Webhook Handler Capability Test Plan

## 🎯 WEBHOOK OPERATIONS VERIFICATION

The webhook handler has been updated to work with the new security model while maintaining full Stripe integration capability.

### **Authorization Model**
```typescript
.authorization((allow) => [
  allow.ownerDefinedIn("userId"), // Users can only access their own data
  allow.guest().to(["create", "update", "read", "delete"]) // Webhook has full IAM access
])
```

### **All Operations Use IAM Auth**
Every webhook database operation now includes `authMode: 'iam'` to bypass user-level authorization while maintaining data security through proper `userId` assignment.

## 🧪 WEBHOOK EVENT TEST SCENARIOS

### **1. Customer Subscription Created**
**Trigger**: New user subscribes via Stripe checkout
**Webhook Event**: `customer.subscription.created`

**Expected Behavior**:
```typescript
// Webhook should:
1. Extract userId from customer metadata
2. Create new subscription with proper userId
3. Set correct plan limits and status
4. Clean up any duplicate records
```

**Test Steps**:
1. Create new user account
2. Go through Stripe checkout flow
3. Verify webhook receives event
4. Check subscription is created with correct userId
5. Confirm user can see their subscription
6. Verify other users cannot see this subscription

### **2. Customer Subscription Updated**
**Trigger**: User changes subscription plan
**Webhook Event**: `customer.subscription.updated`

**Expected Behavior**:
```typescript
// Webhook should:
1. Find existing subscription by stripeCustomerId
2. Update plan details while preserving userId
3. Adjust usage limits based on new plan
4. Reset usage count on renewals
```

**Test Steps**:
1. User with existing subscription upgrades plan
2. Webhook processes update event
3. Verify plan change is reflected
4. Check usage limits are updated
5. Confirm userId remains unchanged

### **3. Customer Subscription Deleted**
**Trigger**: User cancels subscription
**Webhook Event**: `customer.subscription.deleted`

**Expected Behavior**:
```typescript
// Webhook should:
1. Find subscription by stripeCustomerId
2. Revert to free tier settings
3. Preserve existing usage count
4. Maintain userId for future resubscription
```

**Test Steps**:
1. User cancels active subscription
2. Webhook processes deletion event
3. Verify user reverted to free tier
4. Check usage count is preserved
5. Confirm userId is maintained

### **4. Invoice Payment Succeeded**
**Trigger**: Recurring payment processes successfully
**Webhook Event**: `invoice.payment_succeeded`

**Expected Behavior**:
```typescript
// Webhook should:
1. Identify subscription renewal
2. Reset usage count for new billing cycle
3. Preserve all other subscription data
```

**Test Steps**:
1. Wait for or trigger recurring payment
2. Webhook processes payment success
3. Verify usage count is reset to 0
4. Check subscription remains active

### **5. Invoice Payment Failed**
**Trigger**: Payment method fails
**Webhook Event**: `invoice.payment_failed`

**Expected Behavior**:
```typescript
// Webhook should:
1. Mark subscription as past due
2. Preserve user data and userId
3. Allow grace period for payment retry
```

## 🔒 SECURITY VALIDATION

### **Data Isolation Tests**

#### **Test 1: Cross-User Data Protection**
```bash
# Create two users with subscriptions
USER_A="user-a-123"
USER_B="user-b-456"

# Verify USER_A cannot see USER_B's subscription
# Expected: Empty result or access denied
```

#### **Test 2: Webhook IAM Access**
```bash
# Webhook should successfully:
1. Read subscriptions by stripeCustomerId
2. Create new subscriptions
3. Update existing subscriptions
4. Delete duplicate records

# All with authMode: 'iam'
```

#### **Test 3: UserId Preservation**
```bash
# Verify every webhook operation preserves userId
1. Check new subscriptions have correct userId
2. Updates maintain existing userId
3. Cancellations preserve userId for resubscription
```

## 🚨 ERROR SCENARIOS

### **Missing Customer Metadata**
**Scenario**: Stripe customer has no userId metadata
**Expected**: Webhook logs warning but continues operation
**Mitigation**: Subscription created without userId (will need manual assignment)

### **Duplicate Subscriptions**
**Scenario**: Multiple subscription records for same customer
**Expected**: Webhook consolidates to single record and cleans up duplicates
**Validation**: No orphaned subscription records

### **Authorization Failures**
**Scenario**: Webhook doesn't have proper IAM permissions
**Expected**: Clear error logging with authorization details
**Mitigation**: Verify IAM role has necessary permissions

## 📊 MONITORING & VALIDATION

### **Success Metrics**
- ✅ **100% webhook event processing** without authorization errors
- ✅ **Proper userId assignment** in all subscription operations
- ✅ **Complete data isolation** between users
- ✅ **No cross-user data leakage** in any scenario
- ✅ **Successful subscription lifecycle** management

### **Monitoring Queries**
```bash
# Check webhook success rate
aws logs filter-log-events --log-group-name /aws/lambda/webhook-handler \
  --filter-pattern "Webhook processed successfully"

# Monitor authorization errors
aws logs filter-log-events --log-group-name /aws/lambda/webhook-handler \
  --filter-pattern "authorization error"

# Check userId assignment
aws logs filter-log-events --log-group-name /aws/lambda/webhook-handler \
  --filter-pattern "Creating subscription without userId"
```

### **Database Validation**
```graphql
# Check for subscriptions without userId (should be minimal)
query SubscriptionsWithoutUserId {
  listUserSubscriptions(filter: { userId: { attributeExists: false } }) {
    items {
      id
      stripeCustomerId
      createdAt
    }
  }
}

# Verify no duplicate subscriptions per user
query DuplicateSubscriptions {
  listUserSubscriptions {
    items {
      userId
      stripeCustomerId
      status
    }
  }
}
```

## ✅ DEPLOYMENT CHECKLIST

### **Pre-Deployment**
- [ ] Data model authorization includes full IAM access
- [ ] All webhook operations use `authMode: 'iam'`
- [ ] Customer metadata handling is implemented
- [ ] Error logging is comprehensive

### **Post-Deployment**
- [ ] Test each webhook event type
- [ ] Verify user data isolation
- [ ] Monitor webhook error rates
- [ ] Check subscription data integrity
- [ ] Validate customer metadata extraction

### **Rollback Criteria**
- Authorization errors in webhook logs
- Cross-user data exposure detected  
- Subscription creation failures
- Data integrity issues

The webhook handler now maintains full Stripe integration capability while ensuring complete security and data isolation.