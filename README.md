# Affiliate Payout Management System

A backend system for managing affiliate sales, advance payouts, sale reconciliation, user withdrawals, and failed withdrawal recovery.

The project is implemented using JavaScript, Node.js, Express.js, MongoDB, and Mongoose.

---

## Features

- User creation
- Affiliate sale creation
- Pending, approved, and rejected sale statuses
- 10% advance payout for pending sales
- Duplicate advance payout prevention
- Sale reconciliation
- Approved sale final payout calculation
- Rejected sale negative adjustment
- User withdrawable balance management
- One withdrawal every 24 hours
- Failed, cancelled, and rejected withdrawal recovery
- Idempotent balance restoration
- User sales API
- User withdrawal history API
- User payout summary API
- MongoDB transactions for withdrawal processing

---

## Technology Stack

- JavaScript
- Node.js
- Express.js
- MongoDB
- Mongoose
- Postman for API testing

---

## Project Structure

```text
affiliate-payout-system/
│
├── src/
│   ├── app.js
│   │
│   ├── config/
│   │   └── database.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Sale.js
│   │   ├── Payout.js
│   │   └── Withdrawal.js
│   │
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── saleRoutes.js
│   │   ├── payoutRoutes.js
│   │   └── withdrawalRoutes.js
│   │
│   ├── services/
│   │   ├── userService.js
│   │   ├── advancePayoutService.js
│   │   ├── reconciliationService.js
│   │   └── withdrawalService.js
│   |
│   
│       
│
├── .env
├── .env.example
├── .gitignore
├── DESIGN.md
├── README.md
├── package.json
└── package-lock.json
```

---

## Prerequisites

Install the following software before running the project:

- Node.js
- npm
- MongoDB Atlas account or local MongoDB
- Postman or another API testing tool

---

## Installation

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Move into the project directory:

```bash
cd affiliate-payout-system
```

Install the project dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Example:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/affiliate_payouts
```

Do not commit the `.env` file to GitHub because it contains private database credentials.

An example environment file is included as:

```text
.env.example
```

---

## Running the Application

Run the application in development mode:

```bash
npm run dev
```

Run the application normally:

```bash
npm start
```

The server runs on:

```text
http://localhost:5000
```

---

## Health Check

### Request

```http
GET /health
```

Full URL:

```text
http://localhost:5000/health
```

### Example response

```json
{
  "success": true,
  "message": "Affiliate payout system is running"
}
```

---

# API Documentation

## 1. Create a User

### Request

```http
POST /api/users
```

Full URL:

```text
http://localhost:5000/api/users
```

### Request body

```json
{
  "userId": "test1",
  "name": "Test User",
  "email": "test1@example.com"
}
```

### Example response

```json
{
  "success": true,
  "data": {
    "_id": "user-mongodb-id",
    "userId": "test1",
    "name": "Test User",
    "email": "test1@example.com",
    "withdrawableBalance": 0,
    "lastWithdrawalAt": null
  }
}
```

---

## 2. Get a User

### Request

```http
GET /api/users/:userId
```

Example:

```text
GET http://localhost:5000/api/users/test1
```

This returns the user's details and current withdrawable balance.

---

## 3. Create a Sale

### Request

```http
POST /api/sales
```

Full URL:

```text
http://localhost:5000/api/sales
```

### Request body

```json
{
  "userId": "test1",
  "brand": "brand_1",
  "earning": 50
}
```

### Example response

```json
{
  "success": true,
  "data": {
    "_id": "sale-mongodb-id",
    "userId": "test1",
    "brand": "brand_1",
    "earning": 50,
    "status": "pending",
    "reconciledAt": null
  }
}
```

Every newly created sale starts with:

```text
status: pending
```

Valid brands are:

```text
brand_1
brand_2
brand_3
```

---

## 4. Process Advance Payouts

### Request

```http
POST /api/payouts/advance/process
```

Full URL:

```text
http://localhost:5000/api/payouts/advance/process
```

No request body is required.

The system:

1. Finds all pending sales
2. Calculates 10% of each earning
3. Creates or updates the payout record
4. Marks the advance payout as paid
5. Adds the advance amount to the user's balance
6. Skips sales whose advance payout has already been paid

### Example calculation

```text
Earning = ₹50
Advance payout = 10% of ₹50
Advance payout = ₹5
```

### Example response

```json
{
  "success": true,
  "message": "Advance payout process completed",
  "data": [
    {
      "saleId": "sale-mongodb-id",
      "status": "paid",
      "advancePayment": 5,
      "payoutId": "payout-mongodb-id"
    }
  ]
}
```

If the endpoint is called again for the same sale, the sale is skipped:

```json
{
  "success": true,
  "message": "Advance payout process completed",
  "data": [
    {
      "saleId": "sale-mongodb-id",
      "status": "skipped",
      "message": "Advance payout already paid"
    }
  ]
}
```

---

## 5. Reconcile a Sale

### Request

```http
PATCH /api/sales/:saleId/reconcile
```

Example:

```text
PATCH http://localhost:5000/api/sales/SALE_ID/reconcile
```

Replace `SALE_ID` with the MongoDB `_id` of the sale.

### Approve a sale

Request body:

```json
{
  "status": "approved"
}
```

For an approved sale:

```text
Final amount = Earning - Advance payment
```

Example:

```text
Earning = ₹40
Advance payment = ₹4
Final amount = ₹36
```

### Reject a sale

Request body:

```json
{
  "status": "rejected"
}
```

For a rejected sale:

```text
Final adjustment = -Advance payment
```

Example:

```text
Advance payment = ₹5
Final adjustment = -₹5
```

A sale can only be reconciled once. A sale whose status is already `approved` or `rejected` cannot be reconciled again.

---

## 6. Get User Sales

### Request

```http
GET /api/users/:userId/sales
```

Example:

```text
GET http://localhost:5000/api/users/test1/sales
```

This returns all sales belonging to the specified user.

---

## 7. Get User Payout Summary

### Request

```http
GET /api/users/:userId/payout-summary
```

Example:

```text
GET http://localhost:5000/api/users/test1/payout-summary
```

### Example response

```json
{
  "success": true,
  "data": {
    "userId": "test1",
    "withdrawableBalance": 70,
    "totalAdvancePaid": 12,
    "totalFinalAmount": 68,
    "totalApprovedFinalAmount": 72,
    "totalRejectedAdjustment": -4
  }
}
```

The exact values depend on the user's sales and payout history.

---

## 8. Initiate a Withdrawal

### Request

```http
POST /api/withdrawals
```

Full URL:

```text
http://localhost:5000/api/withdrawals
```

### Request body

```json
{
  "userId": "test1",
  "amount": 20
}
```

### Example response

```json
{
  "success": true,
  "message": "Withdrawal initiated successfully",
  "data": {
    "withdrawal": {
      "_id": "withdrawal-mongodb-id",
      "userId": "test1",
      "amount": 20,
      "status": "initiated",
      "balanceRestored": false
    },
    "remainingBalance": 50
  }
}
```

When the withdrawal is initiated:

```text
New balance = Current balance - Withdrawal amount
```

A user cannot withdraw more than their current balance.

A user can make only one withdrawal every 24 hours.

---

## 9. Get User Withdrawals

### Request

```http
GET /api/users/:userId/withdrawals
```

Example:

```text
GET http://localhost:5000/api/users/test1/withdrawals
```

This returns the user's withdrawal history.

---

## 10. Update Withdrawal Status

### Request

```http
PATCH /api/withdrawals/:withdrawalId/status
```

Replace `WITHDRAWAL_ID` with the MongoDB `_id` of the withdrawal.

---

### Mark withdrawal as processing

Request body:

```json
{
  "status": "processing"
}
```

---

### Mark withdrawal as completed

Request body:

```json
{
  "status": "completed"
}
```

For a completed withdrawal, the balance is not restored because the user successfully received the money.

---

### Mark withdrawal as failed

Request body:

```json
{
  "status": "failed",
  "failureReason": "Bank rejected the transaction"
}
```

For a failed withdrawal, the amount is added back to the user's balance.

---

### Mark withdrawal as cancelled

Request body:

```json
{
  "status": "cancelled",
  "failureReason": "User cancelled the request"
}
```

For a cancelled withdrawal, the amount is added back to the user's balance.

---

### Mark withdrawal as rejected

Request body:

```json
{
  "status": "rejected",
  "failureReason": "Invalid bank account"
}
```

For a rejected withdrawal, the amount is added back to the user's balance.

The `balanceRestored` field ensures that the amount is restored only once.

---

# Business Rules

## Advance Payout

Every pending sale receives an advance payout equal to 10% of its earning.

```text
Advance payout = Earning × 10 / 100
```

For example:

```text
Earning = ₹40
Advance payout = ₹4
```

The same sale must never receive the advance payout twice.

---

## Approved Sale

For an approved sale:

```text
Final amount = Earning - Advance payment
```

Example:

```text
Earning = ₹40
Advance payment = ₹4
Final amount = ₹36
```

The user has already received ₹4, so only ₹36 is added during reconciliation.

---

## Rejected Sale

For a rejected sale:

```text
Final adjustment = -Advance payment
```

Example:

```text
Advance payment = ₹5
Final adjustment = -₹5
```

The advance is deducted because the user was not entitled to receive it.

---

## Withdrawal Restriction

A user can initiate only one withdrawal within 24 hours.

If a withdrawal fails, is cancelled, or is rejected, the cooldown is reset because the transfer did not succeed.

---

## Failed Withdrawal Recovery

When a withdrawal fails:

```text
New balance = Current balance + Failed withdrawal amount
```

The failed amount is restored only once.

---

# Edge Cases Handled

- User does not exist
- Sale does not exist
- Payout does not exist
- Invalid sale status
- Invalid brand
- Negative earning
- Duplicate advance payout processing
- Existing payout in failed state
- Existing payout in processing state
- Sale reconciled more than once
- Withdrawal amount is zero
- Withdrawal amount is negative
- Withdrawal amount exceeds balance
- Withdrawal attempted within 24 hours
- Failed withdrawal balance recovery
- Duplicate failed withdrawal callback
- Invalid withdrawal status
- Withdrawal updated after reaching a final status

---

# Design Decisions

## Separate Payout Collection

Payout data is stored separately from sales because a sale has multiple financial stages:

```text
Advance payout
Final payout
Reconciliation adjustment
```

This provides a clear financial record for every sale.

---

## Unique Sale-Payout Relationship

Each payout contains a unique `saleId`.

This ensures that:

```text
One sale = One payout record
```

This helps prevent duplicate advance payouts.

---

## Service Layer

Business logic is kept in service files instead of placing all logic inside routes.

This improves:

- Readability
- Reusability
- Maintainability
- Separation of concerns

---

## MongoDB Transactions

Withdrawal operations use MongoDB transactions so that:

1. The user's balance is changed
2. The withdrawal record is created

as one atomic operation.

If either operation fails, the transaction is rolled back.

---

## Money Representation

This implementation uses JavaScript numbers for simplicity.

In a production payment system, money should be represented using:

- Integer paise
- MongoDB Decimal128
- A decimal arithmetic library

This avoids floating-point precision problems.

---

## Simulated Payment Transfer

The current implementation simulates the payment transfer by marking the payout as paid.

A production version would integrate with a payment provider and process asynchronous webhooks.

---

# Manual Testing

The APIs were manually tested using Postman.

The following workflows were verified:

- User creation
- Sale creation
- Advance payout processing
- Duplicate advance payout prevention
- Approved sale reconciliation
- Rejected sale reconciliation
- Withdrawal balance validation
- 24-hour withdrawal restriction
- Failed withdrawal balance recovery
- Duplicate recovery prevention
- User payout summary

Automated tests were not included because they were not explicitly required in the assignment. They can be added as a future improvement.

---

# Future Improvements

- Authentication
- Admin and user roles
- Role-based authorization
- Admin dashboard
- Real payment provider integration
- Payment provider webhook verification
- Audit log collection
- Immutable payment ledger
- Background payout job queue
- Distributed locking
- Automated tests
- Swagger API documentation
- Pagination for list APIs
- Integer paise-based money storage
- Better financial reconciliation reports

---

## Author

Gaurav Giri