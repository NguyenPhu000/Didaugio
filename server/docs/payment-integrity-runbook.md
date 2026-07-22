# Payment integrity runbook

## Preconditions

- Keep gateway signing keys, SePay webhook secrets, database credentials, and JWT secrets in the approved secret store; never put them in logs, tickets, SQL files, or shell history.
- Use a least-privileged PostgreSQL account that can create and remove only the disposable `didaugio_audit_*` databases used by verification.
- Take a tested backup and obtain change approval before a production Prisma migration. Run `prisma migrate status` first; do not use `migrate reset`, `db push`, or ad-hoc DDL against production.

## Release gate

Run from `server` with an explicit PostgreSQL `DATABASE_URL`:

```sh
npm run quality:payments
npm run quality:migrations
npx prisma validate --schema=prisma/schema.prisma
```

`quality:payments` fails before test execution when `DATABASE_URL` is absent or malformed. Its integration tests create uniquely named disposable audit databases and remove only databases they created. It does not target the configured application database for mutations.

## Reconciliation and monitoring

Investigate only with approved read-only reporting access. Compare succeeded receipts, succeeded/pending refund attempts, payment obligation, and booking state. Do not copy full webhook payloads or secrets into reports.

```sql
SELECT p.id, p.booking_id, p.amount AS obligation,
       COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'succeeded'), 0) AS collected,
       COALESCE(SUM(a.amount) FILTER (WHERE a.status = 'succeeded'), 0) AS refunded
FROM payments p
LEFT JOIN payment_receipts r ON r.payment_id = p.id
LEFT JOIN refund_attempts a ON a.payment_id = p.id
GROUP BY p.id, p.booking_id, p.amount
ORDER BY p.id DESC
LIMIT 100;
```

Alert on invalid signature, unknown transaction reference, amount/currency mismatch, duplicate external transaction/refund identifier, replay conflict, over-collection, refund above collected receipts, and long-lived `pending` refund attempts. Record only identifiers, timestamps, result code, and a sanitized reason.

## Operations

- Gateway callbacks must pass signature verification before any audit or state write. Exact callback replays are idempotent; conflicting replays require investigation, not a retry with edited data.
- Manual collection requires the authenticated actor, amount, reason, idempotency key, and external reference. It creates a receipt; it never overwrites the immutable payment obligation.
- Gateway collections use the verified callback and canonical receipt transition. Do not call internal services or update payment rows manually to mark a gateway payment paid.
- Refunds reserve against succeeded receipts. Manual refunds need actor, reason, and idempotency key. SePay refunds persist a pending attempt before external processing; its signed webhook finalizes it.
- For a pending manual refund caused by a post-commit finalizer failure, use the authenticated bounded recovery endpoint once the original evidence is verified. For gateway pending attempts, reconcile against the provider and accept only the signed matching callback. Escalate ambiguous or mismatched cases; do not mutate tables manually.

## Incident handoff

Include payment/booking IDs, receipt or refund-attempt IDs, provider reference, sanitized timestamp, gateway result, and exact stable error code. Exclude credentials, authorization headers, raw callback bodies, customer PII beyond the approved incident process, and direct SQL write instructions.
