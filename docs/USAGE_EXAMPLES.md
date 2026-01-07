# Usage Examples

Real-world examples of using the Agentic Development Pipeline.

## Table of Contents

1. [Simple Feature: Contact Form](#example-1-contact-form)
2. [Complex Feature: User Authentication](#example-2-user-authentication)
3. [API Integration: Payment Processing](#example-3-payment-processing)
4. [Refactoring: Database Migration](#example-4-database-refactoring)
5. [Bug Fix: Form Validation](#example-5-bug-fix)
6. [Testing Only: Existing Code](#example-6-testing-existing-code)

---

## Example 1: Contact Form

### Scenario
You want to add a simple contact form to your landing page.

### Your Prompt to Claude Code

```
I need a contact form for our landing page with:
- Name field (required)
- Email field (required, must be valid email)
- Message field (required, minimum 10 characters)
- Submit button
- Show success message after submission
- Store submissions in a 'contacts' database table
- Send notification email to admin@example.com

Run the full agentic pipeline for this feature.
```

### What Happens

#### Phase 1: Requirements Agent Output

Located at: `docs/requirements/contact-form.md`

```markdown
# Contact Form Feature

## Feature Summary
- **Feature Name**: Landing Page Contact Form
- **Priority**: High
- **Business Value**: Allows potential customers to contact us

## Functional Requirements
- FR-001: User can enter name, email, and message
- FR-002: Email field validates format (user@domain.com)
- FR-003: Message must be at least 10 characters
- FR-004: Form submission creates database record
- FR-005: Admin receives email notification on submission
- FR-006: User sees success message after submission

## Test Scenarios

### Happy Path
1. User fills all fields correctly → submission succeeds
2. User sees "Thank you, we'll be in touch!" message
3. Form fields are cleared after submission

### Edge Cases
1. Email with special characters (test+tag@example.com)
2. Very long message (1000+ characters)
3. Unicode characters in name (José, 李明)
4. Multiple rapid submissions (prevent duplicates)

### Error Scenarios
1. Empty name → "Name is required"
2. Invalid email → "Please enter a valid email"
3. Message too short → "Message must be at least 10 characters"
4. Server error → "Something went wrong, please try again"
```

**You review and approve** ✅

#### Phase 2: Code Builder Output

Creates these files:
- `src/components/ContactForm.jsx` (or .vue, .tsx)
- `src/api/routes/contact.js`
- `src/services/contact-service.js`
- `src/db/migrations/003_create_contacts.sql`
- `src/utils/email.js`

#### Phase 3: Test Builder Output

Creates:
- `tests/playwright/contact-form.spec.js`
- `tests/api/contact.test.js`
- `tests/database/contacts.test.js`

#### Phase 4: Validation Report

Located at: `docs/validation/contact-form-report.md`

```markdown
## Test Results
- Total: 15 tests
- Passed: 15 ✅
- Failed: 0

## Requirements Coverage
- FR-001 through FR-006: ✅ All covered

## Security Validation
- ✅ Email validation prevents XSS
- ✅ SQL injection protected (parameterized queries)
- ✅ Rate limiting on endpoint

## Deployment Readiness
✅ Ready for production
```

**Total Time**: ~5 minutes

---

## Example 2: User Authentication

### Scenario
You need full user authentication for your SaaS app.

### Your Prompt to Claude Code

```
Implement user authentication system with:
- User registration (email + password)
- Email verification (send verification link)
- Login with email/password
- JWT token-based authentication
- Password reset flow
- Logout functionality
- Protected routes that require authentication
- Session management (tokens expire after 7 days)
- Password requirements: min 8 chars, 1 uppercase, 1 number

Security requirements:
- Hash passwords with bcrypt
- Secure token generation
- HTTPS only cookies
- Prevent brute force with rate limiting

Run the full agentic pipeline for this feature.
```

### What Happens

#### Phase 1: Requirements Agent

Generates comprehensive requirements covering:
- 15+ functional requirements
- Security requirements
- User flows for each scenario
- Edge cases (expired tokens, invalid emails, etc.)
- Error scenarios
- Database schema for users, sessions, password_resets
- API endpoint specifications
- Email templates

**Estimated**: 60-90 seconds to generate

**You review**: Check security requirements, edge cases, password policy

#### Phase 2: Code Builder

Implements:
- User model with password hashing
- Authentication middleware
- JWT token service
- Email verification service
- Password reset service
- API routes for all auth operations
- Database migrations
- Email templates

**Estimated**: 2-4 minutes

#### Phase 3: Test Builder

Creates comprehensive tests:
- E2E registration flow (fill form → receive email → verify → login)
- E2E password reset flow
- API tests for all endpoints
- Database tests for user creation, token validation
- Security tests (SQL injection, XSS attempts)
- Token expiration tests
- Rate limiting tests

**Estimated**: 2-3 minutes

#### Phase 4: Validation

Runs all tests and validates:
- Authentication works in real browsers
- Tokens are secure
- Emails are sent (or logged in dev)
- Password hashing works
- Rate limiting prevents abuse
- Security requirements met

**Estimated**: 1-2 minutes

### Expected Output

- ✅ 45+ tests covering all scenarios
- ✅ Security validation passed
- ✅ End-to-end flows verified in real browsers
- ✅ Production-ready authentication system

**Total Time**: ~8-12 minutes

---

## Example 3: Payment Processing

### Scenario
Integrate Stripe payment processing for subscriptions.

### Your Prompt to Claude Code

```
Integrate Stripe for subscription payments:

Features:
- Monthly subscription plans ($9, $29, $99)
- One-time setup with Stripe Checkout
- Store subscription status in database
- Webhook handler for payment events
- Cancel subscription option
- Update payment method
- Display payment history

Subscription status should determine access:
- Free tier: Limited features
- Pro tier ($29): Full features
- Enterprise tier ($99): Full features + priority support

Requirements:
- Use Stripe Checkout for PCI compliance
- Handle webhook events securely
- Test mode for development
- Clear error messages for payment failures
- Subscription renewal reminders

Run the full agentic pipeline.
```

### What Happens

#### Phase 1: Requirements Agent

Analyzes and generates:
- Payment flow diagrams
- Webhook event handling requirements
- Database schema for subscriptions, payment_methods
- Security requirements for webhook signatures
- Edge cases (failed payments, cancellations during trial, etc.)
- Error scenarios and user feedback

#### Phase 2: Code Builder

Implements:
- Stripe SDK integration
- Checkout session creation
- Webhook endpoint with signature verification
- Subscription service
- Payment history service
- Middleware for subscription-based access control
- Database migrations

#### Phase 3: Test Builder

Creates tests:
- E2E: User subscribes → payment succeeds → access granted
- E2E: Payment fails → user sees error message
- API: Webhook signature validation
- API: Subscription status checks
- Database: Subscription records created correctly
- Mock Stripe in tests to avoid real charges

#### Phase 4: Validation

Validates:
- Webhook handling is secure
- Access control works correctly
- Payment failure handling is graceful
- Subscription status is accurate

### Special Considerations

For payment integrations, the Validation Agent will:
- Use Stripe test mode
- Mock webhook events
- Verify signature validation works
- NOT charge real money in tests

**Total Time**: ~10-15 minutes for complete integration

---

## Example 4: Database Refactoring

### Scenario
You need to refactor your user data model to add profile information.

### Your Prompt to Claude Code

```
Refactor user data model:

Current: All user data in one 'users' table
New: Separate 'users' and 'user_profiles' tables

Migration plan:
- Create new user_profiles table
- Move bio, avatar_url, phone, address to user_profiles
- Keep email, password_hash in users table
- One-to-one relationship users:user_profiles
- Migrate existing data
- Update all code that touches user data
- Ensure tests still pass

Run the full agentic pipeline with focus on data integrity.
```

### What Happens

#### Phase 1: Requirements Agent

Generates:
- Database schema changes
- Data migration steps
- Rollback plan
- List of all code that needs updating
- Test scenarios for data integrity
- Edge cases (users without profiles, etc.)

#### Phase 2: Code Builder

Implements:
- New migration file (up and down)
- Updated user model with profile relationship
- Data migration script
- Updated queries throughout codebase
- Backward compatibility layer (if needed)

#### Phase 3: Test Builder

Creates:
- Database tests for migration
- Tests for new relationships
- Tests verifying data integrity after migration
- Rollback tests

#### Phase 4: Validation

Validates:
- Migration runs successfully
- All existing data preserved
- Relationships work correctly
- Rollback works if needed
- No breaking changes to API

### Key Validation Points

```markdown
## Data Integrity Checks
- ✅ All 10,000 users migrated successfully
- ✅ No data loss (compared before/after)
- ✅ All relationships maintained
- ✅ Queries return same results as before
- ✅ Rollback tested and working
```

**Total Time**: ~6-10 minutes

---

## Example 5: Bug Fix

### Scenario
Users can submit forms with whitespace-only input.

### Your Prompt to Claude Code

```
Fix bug: Form validation accepts whitespace-only input

Current behavior:
- User can submit "   " (spaces) as valid input
- Validation only checks if field is not empty

Expected behavior:
- Trim whitespace before validation
- Empty or whitespace-only input should fail validation
- Show error: "This field cannot be empty"

Affected forms:
- Contact form (name, message)
- User profile (bio, company name)
- Comments (comment text)

Run validation pipeline to ensure fix works everywhere.
```

### What Happens

#### Phase 1: Requirements Agent

Generates:
- Clear specification of bug
- Expected behavior
- All affected locations
- Test scenarios to verify fix
- Regression test scenarios

#### Phase 2: Code Builder

Implements:
- Updated validation utility function
- Applied to all affected forms
- Error message updates

```javascript
// Before
if (!value) {
  throw new Error('This field is required');
}

// After
if (!value || !value.trim()) {
  throw new Error('This field cannot be empty');
}
```

#### Phase 3: Test Builder

Creates tests:
- Submit with spaces → fails validation
- Submit with tabs → fails validation
- Submit with newlines → fails validation
- Submit with actual content → passes
- Test for each affected form

#### Phase 4: Validation

Validates:
- Bug is fixed in all locations
- No regressions in other validations
- Error messages are clear

**Total Time**: ~3-5 minutes

---

## Example 6: Testing Existing Code

### Scenario
You have existing code without comprehensive tests.

### Your Prompt to Claude Code

```
Create comprehensive test suite for existing checkout flow.

The checkout flow includes:
- Add items to cart
- Apply discount code
- Enter shipping address
- Enter payment info
- Review order
- Submit order
- Show confirmation

Code exists in:
- src/components/Checkout/
- src/services/cart-service.js
- src/services/order-service.js
- src/api/routes/orders.js

Use test builder and validation agents only (no code changes).
```

### What Happens

#### Test Builder Agent

Creates:
- E2E test for full checkout flow
- E2E test for discount code application
- API tests for cart operations
- API tests for order submission
- Database tests for order creation
- Edge case tests (invalid discount, missing address, etc.)

```javascript
// Example E2E test
test('complete checkout flow', async ({ page }) => {
  // Add item to cart
  await page.goto('/products/123');
  await page.click('[data-testid="add-to-cart"]');

  // Go to checkout
  await page.click('[data-testid="cart-icon"]');
  await page.click('[data-testid="checkout-button"]');

  // Apply discount
  await page.fill('[data-testid="discount-code"]', 'SAVE10');
  await page.click('[data-testid="apply-discount"]');
  await expect(page.locator('[data-testid="discount-applied"]')).toBeVisible();

  // Enter shipping
  await page.fill('[data-testid="address"]', '123 Main St');
  await page.fill('[data-testid="city"]', 'San Francisco');
  // ... etc

  // Submit order
  await page.click('[data-testid="place-order"]');

  // Verify confirmation
  await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
  await expect(page.locator('[data-testid="order-number"]')).toHaveText(/ORD-\d+/);
});
```

#### Validation Agent

Runs all tests and reports:
- Which parts of checkout work correctly
- Which parts have issues
- Suggestions for improvements
- Security concerns (if any)
- Performance issues (if any)

**Use Case**: Validates existing code before refactoring

**Total Time**: ~4-6 minutes

---

## Pro Tips

### 1. Be Specific About Data Models

Instead of:
> "Add a blog feature"

Say:
> "Add blog with posts table (title, content, author_id, published_at, slug), comments table (post_id, user_id, content), and tags with many-to-many relationship"

### 2. Specify Security Requirements Upfront

Always mention:
- Authentication needs
- Authorization rules
- Data validation rules
- Rate limiting
- Input sanitization

### 3. Clarify User Experience

Instead of:
> "Add error handling"

Say:
> "Show validation errors inline below each field. Show success message in a toast notification. Clear form after successful submission."

### 4. Include Edge Cases in Your Description

This helps the Requirements Agent:
- "Handle missing data gracefully"
- "Support Unicode in all text fields"
- "Prevent duplicate submissions"
- "Work offline where possible"

### 5. Mention Integration Points

If integrating with existing code:
- "Integrate with existing user authentication system"
- "Use existing email service (src/services/email.js)"
- "Follow existing API response format"

---

## Common Patterns

### Pattern: Feature Flag

```
Add feature flag system:
- Store flags in database
- Check flags before rendering features
- Admin UI to toggle flags
- Support percentage rollouts (show to 10% of users)
```

### Pattern: Audit Log

```
Add audit logging for:
- User login/logout
- Data modifications (create, update, delete)
- Permission changes
- Store: timestamp, user_id, action, resource, changes
- Queryable by date range, user, action type
```

### Pattern: API Rate Limiting

```
Implement rate limiting:
- 100 requests per minute per user
- 10 requests per minute for auth endpoints
- Use Redis for distributed rate limiting
- Return 429 with Retry-After header
- Graceful degradation if Redis unavailable
```

---

## Next Steps

- Try one of these examples in your own project
- Modify examples to fit your specific needs
- Combine patterns for complex features
- Build your own library of prompts that work well

**Remember**: The better your initial description, the better the output! 🎯
