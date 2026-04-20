This is a [Next.js](https://nextjs.org) project for Mood Foods with a public storefront and an admin dashboard (products, orders, articles) backed by Firebase and Supabase.

## Getting Started

1) Create `.env.local` with the required environment variables:

```
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin (server) — use ONE of the two options
# Option A: Base64-encoded service account JSON (recommended)
FIREBASE_SERVICE_ACCOUNT_BASE64=...
# Option B: individual creds
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase (for image uploads from Admin)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=assets

# One-time: superadmin bootstrap secret (see below)
BOOTSTRAP_SECRET=changeme
```

2) Install and run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Admin Dashboard (Products)

- Admin URL: `/admin`
- First-time setup (superadmin): run once to grant admin to the hardcoded email in `app/api/admin/bootstrap/route.ts` (default: `moamenelioa@gmail.com`). Replace before use if needed.

```
# Start the dev server, then run this once in another terminal:
curl -X POST http://localhost:3000/api/admin/bootstrap \
	-H "Content-Type: application/json" \
	-d '{"secret":"'$BOOTSTRAP_SECRET'"}'
```

- Sign in at `/admin/login` using Google or email/password for the configured admin user.
- Products management at `/admin/products`: list, search, sort, archive/restore, delete, create, and edit. Image uploads use Supabase Storage.
- Quick start: use the "Seed Products" button on `/admin/products` to populate sample products, or call the API:

```
curl -X POST http://localhost:3000/api/admin/seed?target=products \
	-H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

## Public Storefront

- Home and products pages read from Firestore via API routes:
	- Public list: `/api/products` (active, ordered by `sortOrder`)
	- Store pages: `/` shows featured, `/products` shows full list

Ensure Firestore has a `products` collection. Use the seeder above to populate quickly.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Environment variables must be configured in the Vercel project. For Firebase Admin, prefer `FIREBASE_SERVICE_ACCOUNT_BASE64`.
