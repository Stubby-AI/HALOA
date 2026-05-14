# Security Specification for Haloa App

## Data Invariants
1. A user can only read their own profile.
2. A user can only read their own orders.
3. A user can create an order, but it must be linked to their own `uid`.
4. A user can update their own order to add a `paymentReceipt` if the current status is `pending_payment`.
5. Only admins (none specified yet, so I'll design for future admin capability) can change order status to `packed`, `shipped`, or `delivered`.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create an order with another user's `userId`.
2. **State Shortcutting**: Attempt to create an order with status `delivered`.
3. **Resource Poisoning**: Injection of a very long string (> 1MB) as `paymentReceipt`.
4. **Price Tampering**: Attempt to update an order's `total` after creation.
5. **Unauthorized Access**: Attempt to read another user's order by ID.
6. **Shadow Update**: Adding a field `isAdmin: true` to the user profile.
7. **Email Spoofing**: Login with an unverified email (though we use Google Auth which is verified).
8. **Orphaned Writes**: Creating an order without a user ID.
9. **Terminal State Lockdown**: Attempt to change an order after it is `delivered`.
10. **Query Scraping**: Attempting a `list` on all orders without a `where` filter on `userId`.
11. **Malicious ID**: Creating an order with a 1KB string as order ID.
12. **PII Leak**: Accessing the `admin` collection (if it existed) as a normal user.

## Test Runner
(I'll generate the rules now based on these specs)
