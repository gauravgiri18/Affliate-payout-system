# Low-Level Design: Affiliate Payout Management System

## 1. Overview

The Affiliate Payout Management System manages affiliate sales and payouts.

Every sale initially enters the system with a `pending` status.

For every pending sale, the user can receive an advance payout equal to 10% of the sale earning.

Later, an administrator reconciles the sale as either:

- `approved`
- `rejected`

For an approved sale, the user receives the remaining amount after subtracting the advance payout.

For a rejected sale, the advance payout is deducted from the user's balance as a negative adjustment.

The system also allows users to withdraw their balance. A user can make only one withdrawal every 24 hours.

If a withdrawal fails, is cancelled, or is rejected, the amount is credited back to the user's withdrawable balance.

---

## 2. Requirements

### Functional Requirements

The system should:

1. Create users
2. Create affiliate sales
3. Store pending, approved, and rejected sale statuses
4. Calculate 10% advance payouts
5. Prevent duplicate advance payouts
6. Reconcile pending sales
7. Calculate approved sale final payouts
8. Apply rejected sale adjustments
9. Maintain the user's withdrawable balance
10. Enforce one withdrawal every 24 hours
11. Restore failed withdrawal amounts
12. Prevent duplicate balance restoration
13. Provide APIs to view users, sales, payouts, and withdrawals

### Non-Functional Requirements

The system should:

- Keep financial records consistent
- Avoid duplicate payouts
- Handle repeated requests safely
- Validate input data
- Separate business logic from route handlers
- Support future payment provider integration
- Provide clear error responses

---

## 3. Technology Stack

- JavaScript
- Node.js
- Express.js
- MongoDB
- Mongoose
- MongoDB transactions
- Postman for manual API testing

---

## 4. High-Level Architecture

```text
Client / Postman
       |
       v
Express Routes
       |
       v
Service Layer
       |
       v
Mongoose Models
       |
       v
MongoDB
```

### Route Layer

The route layer receives HTTP requests and sends HTTP responses.

Examples:

```text
POST /api/sales
POST /api/payouts/advance/process
PATCH /api/sales/:saleId/reconcile
POST /api/withdrawals
```

### Service Layer

The service layer contains the business logic.

Examples:

- Advance payout processing
- Sale reconciliation
- Withdrawal validation
- Failed withdrawal recovery

### Model Layer

The model layer defines the MongoDB schemas.

Models:

- User
- Sale
- Payout
- Withdrawal

---

## 5. Database Collections

The system contains four main collections:

```text
users
sales
payouts
withdrawals
```

---

## 6. Entity Relationship Diagram

```text
User 1 ─────────────── many Sales
User 1 ─────────────── many Payouts
User 1 ─────────────── many Withdrawals
Sale 1 ────────────── 1 Payout
```

### Explanation

- One user can have multiple affiliate sales
- One user can have multiple payout records
- One user can have multiple withdrawals
- Each sale has one payout record
- `saleId` is unique in the payout collection

---

## 7. User Schema

Important fields:

```text
userId
name
email
withdrawableBalance
lastWithdrawalAt
createdAt
updatedAt
```

Example document:

```json
{
  "_id": "user-mongodb-id",
  "userId": "test1",
  "name": "Test User",
  "email": "test1@example.com",
  "withdrawableBalance": 70,
  "lastWithdrawalAt": null,
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Field Explanation

#### `userId`

A unique application-level identifier for the user.

Example:

```text
test1
```

#### `withdrawableBalance`

The amount currently available for withdrawal.

#### `lastWithdrawalAt`

The date and time of the user's last withdrawal.

This field is used to enforce the 24-hour withdrawal restriction.

---

## 8. Sale Schema

Important fields:

```text
userId
brand
earning
status
reconciledAt
createdAt
updatedAt
```

Example document:

```json
{
  "_id": "sale-mongodb-id",
  "userId": "test1",
  "brand": "brand_1",
  "earning": 50,
  "status": "pending",
  "reconciledAt": null,
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Allowed Brands

```text
brand_1
brand_2
brand_3
```

### Allowed Sale Statuses

```text
pending
approved
rejected
```

### Sale Lifecycle

```text
pending → approved
pending → rejected
```

A sale cannot be reconciled more than once.

---

## 9. Payout Schema

Important fields:

```text
saleId
userId
earning
advancePayment
advanceStatus
advancePaidAt
finalAmount
finalStatus
reconciliationAdjustment
finalPaidAt
createdAt
updatedAt
```

Example document:

```json
{
  "_id": "payout-mongodb-id",
  "saleId": "sale-mongodb-id",
  "userId": "test1",
  "earning": 50,
  "advancePayment": 5,
  "advanceStatus": "paid",
  "advancePaidAt": "date",
  "finalAmount": -5,
  "finalStatus": "paid",
  "reconciliationAdjustment": -5,
  "finalPaidAt": "date",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Advance Statuses

```text
not_paid
processing
paid
failed
```

### Final Statuses

```text
not_calculated
calculated
paid
```

### Unique Constraint

The `saleId` field is unique.

This enforces:

```text
One sale = One payout record
```

This protects the system from creating multiple payout records for one sale.

---

## 10. Withdrawal Schema

Important fields:

```text
userId
amount
status
failureReason
balanceRestored
processedAt
createdAt
updatedAt
```

Example document:

```json
{
  "_id": "withdrawal-mongodb-id",
  "userId": "test1",
  "amount": 20,
  "status": "failed",
  "failureReason": "Bank rejected the transaction",
  "balanceRestored": true,
  "processedAt": "date",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Allowed Withdrawal Statuses

```text
initiated
processing
completed
failed
cancelled
rejected
```

---

## 11. Advance Payout Workflow

```text
Find all pending sales
          |
          v
Find payout by saleId
          |
          v
Does payout exist?
     /              \
   Yes               No
   |                 |
Check status       Calculate 10%
   |                 |
   v                 v
Paid? Skip       Create payout
Processing? Skip      |
Failed? Retry        v
Not paid? Retry   Mark as paid
                       |
                       v
                Increase user balance
```

### Advance Calculation

```text
Advance payment = Earning × 10 / 100
```

Example:

```text
Earning = ₹50
Advance payment = ₹5
```

### Duplicate Prevention

The system prevents duplicate payments using:

1. Existing payout lookup by `saleId`
2. `advanceStatus` checking
3. Unique index on `saleId`
4. Per-sale processing logic

If the advance payout is already paid, the sale is skipped.

---

## 12. Reconciliation Workflow

An administrator sends one of the following statuses:

```text
approved
rejected
```

The sale must currently be:

```text
pending
```

### Approved Sale

```text
Final amount = Earning - Advance payment
```

Example:

```text
Earning = ₹40
Advance payment = ₹4
Final amount = ₹36
```

The user already received ₹4 during the advance payout phase, so only ₹36 is added during reconciliation.

Total amount received for the sale:

```text
₹4 + ₹36 = ₹40
```

### Rejected Sale

```text
Final adjustment = -Advance payment
```

Example:

```text
Advance payment = ₹5
Final adjustment = -₹5
```

The user initially received ₹5, but the sale was rejected. Therefore, ₹5 is deducted.

Net amount received for the rejected sale:

```text
₹5 - ₹5 = ₹0
```

### Reconciliation Updates

During reconciliation, the system updates:

1. User balance
2. Sale status
3. Sale reconciliation time
4. Payout final amount
5. Payout final status
6. Payout final payment time

---

## 13. Withdrawal Workflow

```text
User requests withdrawal
          |
          v
Validate userId and amount
          |
          v
Find user
          |
          v
Check 24-hour restriction
          |
          v
Check sufficient balance
          |
          v
Decrease user balance
          |
          v
Create withdrawal record
          |
          v
Commit transaction
```

### Withdrawal Example

```text
Current balance = ₹70
Withdrawal amount = ₹20
Remaining balance = ₹50
```

The user's balance and withdrawal record are created inside a MongoDB transaction.

---

## 14. Withdrawal Restriction

The system stores the time of the last withdrawal:

```text
lastWithdrawalAt
```

Before starting another withdrawal, the system calculates:

```text
Current time - lastWithdrawalAt
```

If the result is less than 24 hours, the request is rejected.

The user receives an error:

```text
Only one withdrawal is allowed every 24 hours
```

For failed, cancelled, or rejected withdrawals, the cooldown is reset because the transfer did not succeed.

---

## 15. Failed Withdrawal Recovery

A withdrawal may fail, be cancelled, or be rejected.

Failure statuses:

```text
failed
cancelled
rejected
```

When one of these statuses occurs:

```text
New balance = Current balance + Withdrawal amount
```

Example:

```text
Balance after initiating withdrawal = ₹50
Failed withdrawal amount = ₹20
Restored balance = ₹70
```

### Idempotency

The system uses:

```text
balanceRestored
```

When the amount is restored:

```text
balanceRestored = true
```

If the same failure notification is received again, the system does not restore the amount again.

This prevents:

```text
₹20 restored once
₹20 restored a second time accidentally
```

---

## 16. API Design

### User APIs

```http
POST /api/users
GET /api/users/:userId
GET /api/users/:userId/sales
GET /api/users/:userId/withdrawals
GET /api/users/:userId/payout-summary
```

### Sale APIs

```http
POST /api/sales
PATCH /api/sales/:saleId/reconcile
```

### Payout APIs

```http
POST /api/payouts/advance/process
```

### Withdrawal APIs

```http
POST /api/withdrawals
PATCH /api/withdrawals/:withdrawalId/status
```

---

## 17. Service Design

### `advancePayoutService.js`

Responsibilities:

- Find pending sales
- Calculate advance payout
- Create payout records
- Prevent duplicate advance payouts
- Update user balance

### `reconciliationService.js`

Responsibilities:

- Validate reconciliation status
- Find the sale
- Find the payout
- Calculate final amount
- Update sale status
- Update payout status
- Update user balance

### `withdrawalService.js`

Responsibilities:

- Validate withdrawal requests
- Check user balance
- Enforce 24-hour restriction
- Create withdrawals
- Restore failed withdrawal amounts
- Prevent duplicate balance restoration

### `userService.js`

Responsibilities:

- Fetch user information
- Fetch user sales
- Fetch user withdrawals
- Calculate payout summaries

---

## 18. Error Handling

The system handles the following errors:

- User not found
- Sale not found
- Payout not found
- Withdrawal not found
- Invalid sale status
- Invalid withdrawal status
- Invalid brand
- Negative earning
- Missing required values
- Withdrawal amount greater than balance
- Withdrawal attempted within 24 hours
- Sale reconciled more than once
- Withdrawal updated after final status
- Duplicate advance payout attempt
- Duplicate balance restoration attempt

---

## 19. Database Indexes

The following fields are indexed:

```text
User.userId
User.email
Sale.userId
Sale.status
Payout.saleId
Payout.userId
Payout.advanceStatus
Withdrawal.userId
Withdrawal.status
```

### Reasons for Indexes

#### `User.userId`

Used frequently to find users.

#### `User.email`

Used to prevent duplicate emails.

#### `Sale.userId`

Used to fetch a user's sales.

#### `Sale.status`

Used to find pending sales.

#### `Payout.saleId`

Used to find the payout for a sale and prevent duplicates.

#### `Payout.userId`

Used to calculate a user's payout summary.

#### `Withdrawal.userId`

Used to fetch a user's withdrawal history.

---

## 20. Idempotency Strategy

### Advance Payout Idempotency

The system checks for an existing payout using:

```text
saleId
```

If the payout is already marked as paid, processing is skipped.

The unique `saleId` index provides database-level protection.

### Reconciliation Idempotency

A sale can only be reconciled when:

```text
status = pending
```

If the sale is already approved or rejected, the operation is rejected.

### Failed Withdrawal Idempotency

A failed withdrawal restores money only if:

```text
balanceRestored = false
```

After restoration:

```text
balanceRestored = true
```

---

## 21. Transaction Strategy

Withdrawal operations use a MongoDB transaction.

The following operations happen within one transaction:

1. Find the user
2. Validate the balance
3. Update the user's balance
4. Create the withdrawal record
5. Commit the transaction

If any operation fails, the transaction is aborted.

This prevents situations where:

```text
Balance is reduced but withdrawal record is not created
```

or:

```text
Withdrawal record is created but balance is not reduced
```

---

## 22. Trade-offs

### JavaScript Numbers for Money

The current implementation stores amounts as JavaScript numbers.

This is simple for the assignment but can cause floating-point precision issues in production.

A production system should use:

- Integer paise
- MongoDB Decimal128
- A decimal arithmetic library

### Balance Stored on User

The current system stores the current balance directly on the User document.

Advantages:

- Fast balance reads
- Simple withdrawal validation
- Easy implementation

Disadvantages:

- Less detailed accounting history
- Requires careful transactional updates

A production system could add an immutable wallet ledger.

### Simulated Payment Transfer

The implementation simulates payment transfers.

A production system would integrate with a payment provider and process:

- Payment requests
- Provider responses
- Webhooks
- Retries
- Idempotency keys

### Service-Based Design

Business logic is kept in services rather than route handlers.

Advantages:

- Better separation of concerns
- Easier maintenance
- Easier future testing
- Reusable business logic

---

## 23. Security Considerations

The current assignment implementation does not include authentication.

In production, the following should be added:

- User authentication
- Admin authentication
- Role-based authorization
- Input validation library
- Rate limiting
- Request logging
- Webhook signature verification
- Secure environment variable management

Only administrators should be allowed to:

- Reconcile sales
- Process payout jobs
- Update withdrawal statuses

---

## 24. Future Improvements

- Authentication and authorization
- Admin and user roles
- Admin dashboard
- Real payment provider integration
- Payment provider webhooks
- Immutable transaction ledger
- Background job queue
- Distributed locking
- Automated tests
- Swagger API documentation
- Pagination
- Search and filtering
- Integer paise-based money storage
- Audit logs
- Notifications for payout status changes

---

## 25. Conclusion

The system separates sales, payouts, users, and withdrawals into independent collections.

The service layer contains the main business rules.

Duplicate payouts are prevented using application checks and database uniqueness.

Withdrawal operations use transactions.

Failed withdrawals restore the balance exactly once using an idempotency field.

The design can be extended later with authentication, payment provider integration, background jobs, and a full financial ledger.