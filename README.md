# Kipepeo referral platform

Kipepeo is a dashboard-first frontend foundation for a Kenyan referral marketing platform.

## Run locally

Open `index.html` directly in a browser. No build step is required.

## Included in this slice

- Responsive dashboard overview
- Referral link and share actions
- Referral history with search
- Wallet summary and transaction ledger view
- M-Pesa withdrawal request form with validation
- Profile and security views
- Notification popover
- Explicit fee, eligibility, and compliance copy

The interface uses sample data so it is safe to preview without creating financial transactions.

## Production boundary

This static slice does not activate accounts, call M-Pesa, authenticate users, write wallet balances, or create commissions. Those behaviors must be implemented server-side before launch:

- Verify Daraja callbacks and make payment processing idempotent.
- Calculate commissions from verified payments inside database transactions.
- Keep wallet changes in an append-only ledger; never trust frontend amounts.
- Add password hashing, sessions, CSRF protection, authorization, rate limiting, validation, fraud review, and audit logs.
- Store secrets in environment variables and separate sandbox from production credentials.
- Have the business model and customer-facing terms reviewed for applicable Kenyan compliance requirements.
