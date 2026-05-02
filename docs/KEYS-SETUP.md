# NexusTower Key Setup Guide

This guide shows where each key comes from and what to click in each provider.

## 1. Turso database URL and auth token

1. Go to [https://turso.tech](https://turso.tech) and sign in.
2. Click **Create Database**.
3. Enter `nexus-tower` as the database name.
4. Pick the closest region.
5. Click **Create Database**.
6. Open the new database from the list.
7. Copy the database URL from the overview page.
8. Open the **Auth Tokens** or **Tokens** tab.
9. Click **Generate Token** or **Create Token**.
10. Copy the token value.

Use these as `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

## 2. Clerk publishable key and secret key

1. Go to [https://clerk.com](https://clerk.com) and sign in.
2. Click **Add application** or **Create application**.
3. Name the app `NexusTower`.
4. Open the app dashboard.
5. In the left menu, click **API Keys**.
6. Copy the **Publishable key**.
7. Copy the **Secret key**.
8. If prompted, confirm the sign-in path is `/sign-in` and the sign-up path is `/sign-up`.

Use these as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

## 3. AWS Bedrock access keys and region

Recommended user name: `nexus-tower-bedrock-runtime`

Use a dedicated IAM user for this project. Do not reuse a personal admin user. The app only needs Bedrock runtime invoke permissions, so avoid broad policies like `AdministratorAccess` or `AmazonBedrockFullAccess`.

Fastest path for a deadline: use whichever model is already available in your Bedrock console. If Anthropic access is still pending, you can use an Amazon model that is already enabled, then set `BEDROCK_MODEL_ID` to that model's exact ID and keep the IAM policy scoped to that model ARN.

### 3.1 Open IAM

1. Go to the [AWS Console](https://console.aws.amazon.com/).
2. Search for **IAM**.
3. Click **IAM** in the search results.
4. In the left sidebar, click **Users**.
5. Click **Create user**.
6. Enter `nexus-tower-bedrock-runtime` as the user name.
7. Leave **Provide user access to the AWS Management Console** off.
8. Continue to the permissions step.

### 3.2 Attach the least-privilege policy

1. On the permissions step, choose **Attach policies directly**.
2. Click **Create policy**.
3. Switch to the **JSON** tab.
4. Paste this policy.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowBedrockInvokeOnly",
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
```

5. Click **Next**.
6. Name the policy `NexusTowerBedrockInvokeOnly`.
7. Click **Create policy**.
8. Return to the user creation flow.
9. Search for `NexusTowerBedrockInvokeOnly`.
10. Select it and continue.

### 3.3 Create access keys

Important: this step happens on the **IAM user page**, not on the policy page. If you are looking at a policy like `NexusTowerBedrockInvokeOnly`, click **IAM users** in the left sidebar first, then open `nexus-tower-bedrock-runtime`.

1. Open the IAM user details for `nexus-tower-bedrock-runtime`.
2. Click the **Security credentials** tab near the top of the page.
3. Scroll down until you see **Access keys**.
4. Click **Create access key**.
5. When AWS asks for the use case, choose **Application running outside AWS**.
6. Click **Next** or **Continue** through the warning screens.
7. Copy the **Access key ID**.
8. Copy the **Secret access key**.
9. Save both values in your `.env.local` file right away.

### 3.4 Enable Bedrock

1. Use the AWS region selector in the top-right corner.
2. Choose the region you want to use, usually `us-east-1`.
3. Search for **Amazon Bedrock** and open it.
4. In the left sidebar, click **Model access**.
5. If Anthropic is already enabled, use `anthropic.claude-3-5-sonnet-20241022-v2:0`.
6. If not, switch to the **Amazon** provider and pick a model that already shows access, such as the Nova family.
7. Open the model details and copy the exact model ID shown there.
8. Click **Request model access** only if the model is not enabled yet and you still have time to wait for approval.
9. Enable the model for your account.

Use these as `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `BEDROCK_MODEL_ID`.

If you switch models, update the policy resource ARN to match the model you chose.

## 4. aisstream.io API key

1. Go to [https://aisstream.io](https://aisstream.io).
2. Create a free account or sign in.
3. Open your dashboard.
4. Find the API key or WebSocket key section.
5. Copy the key shown there.

Use it as `AISSTREAM_API_KEY`.

## 5. OpenRouteService key, optional

1. Go to [https://openrouteservice.org](https://openrouteservice.org).
2. Sign in or create an account.
3. Open the dashboard.
4. Find **API Keys**.
5. Create a key if needed.
6. Copy the key.

Use it as `OPENROUTESERVICE_API_KEY`.

## 6. WITS username, optional

You are on the right site if you see the WITS top navigation with **QUICK SEARCH**, **ADVANCED QUERY**, and your account email in the top-right corner.

1. Go to the World Bank WITS site.
2. Sign in or create an account if prompted.
3. Look at the top-right of the page and copy the login email or account identifier shown there.
4. If your account has a separate visible username field in the profile area, use that instead.

Use it as `WITS_USER_NAME`.

## 7. Cron secret

Generate a secure random string using OpenSSL:

```bash
openssl rand -base64 32
```

Copy the output and use it as the value for `CRON_SECRET` in your `.env.local` file and Vercel deployment settings.

1. Generate a long random string with a password generator.
2. Copy it into your env file as `CRON_SECRET`.
3. Use the same value in your deployment settings.

## 8. Put the values in your local env file

1. Copy `.env.local.example` to `.env.local`.
2. Paste each key into the matching variable.
3. Keep the filled `.env.local` file local only.
4. Do not commit the real env file.

## Quick checklist

- Turso: database URL + auth token
- Clerk: publishable key + secret key
- AWS: access key ID + secret access key + region + Bedrock model ID
- aisstream.io: API key
- Optional: OpenRouteService key
- Optional: WITS username
- Cron: random secret value
