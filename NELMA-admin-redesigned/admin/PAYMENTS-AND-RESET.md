# Cash collection and password-reset delivery

## Cash collection

Sales managers can open a delivered cash order and select **Record cash received**, then **Confirm cash received**. Only confirm after the full displayed amount has been received. Partial payments are not supported. Delivery alone never marks an order paid.

The backend checks the role, delivery state, payment method, current payment state and exact amount. It records a paid receipt and a CASH_COLLECTED audit event identifying the staff member, order and amount. Retrying a completed request returns the existing receipt. Concurrent attempts cannot create duplicate collection records. Pending payment initializations are retired so late callbacks cannot overwrite collection.

The customer order, dashboard, notifications and sales report update after collection. Paid sales are attributed to the payment date; pending orders use their creation date. System administrators can view receipts and audit records but cannot record collection. No database migration is required; existing payments and audit tables are used.

For cash-only production, set `PAYMENT_PROVIDER=cash` in **backend/.env**. This disables mobile money in the backend payment-method list and does not require mobile-money credentials. The dashboard continues to disable mobile money.

## Email and SMS reset codes

Reset requests using an email address send email to the account's stored email address. Requests using a phone number send SMS to its stored normalized phone number. Both channels are supported; one channel is used per request. Codes expire after PASSWORD_RESET_EXPIRE_MINUTES, are stored hashed, and are single-use. A successful resend invalidates previous codes. Reset submissions are rate-limited and successful resets revoke refresh sessions.

Configure these values locally in **backend/.env**, not the root .env or admin/.env. Never put provider secrets in VITE_ variables.

```dotenv
NOTIFICATION_PROVIDER=smtp_twilio
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURITY=starttls
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=your-verified-sender@example.com
NOTIFICATION_TIMEOUT_SECONDS=10
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=your-twilio-number-in-e164-format
TWILIO_MESSAGING_SERVICE_SID=
```

Use `SMTP_SECURITY=ssl` with port 465 if your mail provider requires implicit TLS. STARTTLS and SSL both validate server certificates. An SMTP relay that authenticates the server another way can leave both SMTP_USERNAME and SMTP_PASSWORD empty. Configure either a Twilio sender number or a Messaging Service SID; the service takes precedence when supplied. Your Twilio account and sender must support delivery to your customers' destination countries. See [Twilio's Messages API](https://www.twilio.com/docs/messaging/api/message-resource).

Restart the backend after changes. Production startup validates the notification configuration. Provider failures return a retryable error without exposing provider details or committing a new reset code. Unknown/inactive accounts receive the same generic response and do not trigger delivery. Real-provider codes are never returned in API responses, even when testing with APP_ENV=development.

To activate production also follow the existing backend production requirements: DEBUG=false, strong JWT/internal secrets, production database and explicit CORS origins. SMTP/Twilio credentials are required; placeholders are not working credentials. Do not use the isolated browser-verification server in production, since it deliberately forces development providers.

## Verification

Automated tests exercise SMTP STARTTLS/SSL, destination selection, SMS request authentication, sender/service selection, provider rejection, reset completion/reuse/resend, configuration validation, cash permissions, amount/state validation, concurrent retries, stale callbacks and report attribution. Provider transports are simulated in these tests; external email inbox and mobile-handset delivery still require a live test after credentials and senders are configured.
