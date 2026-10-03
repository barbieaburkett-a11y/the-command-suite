# QuickBooks sandbox OAuth setup

This application uses the OAuth 2.0 `authorization_code` flow. Tokens are encrypted before they are stored in the workspace-scoped D1 database. The client secret and token-encryption key must be supplied through environment variables and must never be committed.

## 1. Register the local callback

In the Intuit Developer app's **Keys & credentials** page, add this redirect URI exactly:

```text
http://localhost:3002/api/quickbooks/callback
```

The Intuit Quick Start URL is useful for Intuit's hosted tutorial, but it cannot receive the callback for this local application.

## 2. Configure private staging

Add the following to `.env.local`:

```dotenv
QUICKBOOKS_CLIENT_ID=your_sandbox_client_id
QUICKBOOKS_CLIENT_SECRET=copy_from_the_intuit_keys_page
QUICKBOOKS_REDIRECT_URI=http://localhost:3002/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox
QUICKBOOKS_TOKEN_ENCRYPTION_KEY=generate_a_long_random_secret
QUICKBOOKS_SCOPES=com.intuit.quickbooks.accounting com.intuit.quickbooks.payment openid profile email phone address
```

Do not commit `.env.local`.

## 3. Run locally

```powershell
pnpm run build
node scripts/start-private-staging.mjs
```

Open `http://localhost:3002/command/quickbooks`, activate the staging entitlement, and choose **Connect QuickBooks securely**. Use `localhost` consistently because browser session cookies do not transfer between `127.0.0.1` and `localhost`. Intuit returns `code`, `realmId`, and `state` to the callback. The server validates the one-time state, exchanges the code at Intuit's token endpoint, encrypts the returned access and refresh tokens, and stores them for that workspace only.

## 4. Run the sandbox calls

After connection, open **Sync controls**:

- **Get company info** calls `GET /v3/company/{realmId}/companyinfo/{realmId}` through the protected application API.
- **Get user info** calls `GET /v1/openid_connect/userinfo` through the protected application API.
- **Create sandbox test charge** calls `POST /quickbooks/v4/payments/charges`. Paste a current request body from Intuit's Payments API Explorer; the app forwards it only after explicit confirmation and only while `QUICKBOOKS_ENVIRONMENT=sandbox`.

The normal sync controls demonstrate protected Accounting API calls for accounts, customers, vendors, estimates, invoices, payments, and reports.

## 5. Token refresh and errors

Before each API call, the server checks the access-token expiration. It uses the stored refresh token against `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer` when fewer than five minutes remain, encrypts the rotated tokens, and replaces the prior values. Failed Intuit calls return a controlled error and update the workspace connection status without exposing tokens or credentials.

Official references:

- https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
- https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/openid-connect
- https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/companyinfo
- https://developer.intuit.com/app/developer/qbpayments/docs/api/resources/all-entities/charges
