# 🚀 Vercel + Neon Deployment Guide

## ✅ Database Setup Complete

The Prisma schema has been updated to use PostgreSQL and pushed to Neon.

## Required Environment Variables on Vercel

Go to your Vercel project → Settings → Environment Variables and add:

### Database Variables
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon pooled connection string (with `-pooler` in hostname) |
| `DIRECT_DATABASE_URL` | Your Neon direct connection string (without `-pooler`) |

### Clerk Authentication Variables
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_xxxxx` (from Clerk Dashboard) |
| `CLERK_SECRET_KEY` | `sk_test_xxxxx` (from Clerk Dashboard) |

## Getting Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select existing
3. Copy the **Publishable Key** (starts with `pk_test_`)
4. Copy the **Secret Key** (starts with `sk_test_`)

## After Setting Environment Variables

1. Go to Vercel → Deployments
2. Click "Redeploy" on the latest deployment

## Local Development

```bash
bun run dev
```

The app uses the Neon database for both local and production.
