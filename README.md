This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

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

## FCM Web Push (PWA Notifications)

This app can send Firebase Cloud Messaging (FCM) web push notifications. When you add a new milestone in the Love Counter page, the app triggers a push with the message: "Một kỷ niệm mới vừa được thêm".

### Environment variables

Client-side (already in `.env.local`):

- `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (your Web Push certificate key from Firebase Console)

Server-side (required for sending notifications from Next.js API routes):

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Notes:

- `FIREBASE_ADMIN_PRIVATE_KEY` must preserve newlines. If you store it with literal `\n`, the code converts it back to real newlines automatically.
- Tokens are stored in Realtime Database at `pushTokens/*`.

### iOS (installed PWA)

- Push notifications only work for an installed PWA (Add to Home Screen) on iOS versions that support Web Push.
- The permission prompt must be triggered by a user gesture. This project requests permission when you press "+ Thêm kỷ niệm mới".

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
