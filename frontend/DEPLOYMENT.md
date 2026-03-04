# Sewa Shubham Bakery — Deployment Guide

## Steps to Deploy

### 1. Set Production API URL
Edit `frontend/.env.production` and set `VITE_API_URL` to your live backend URL:
```
VITE_API_URL=https://api.sewashubhambakery.com/api
```

### 2. Build the Frontend
```bash
cd frontend
npm run build
```

### 3. Upload to Hostinger
Upload the contents of `frontend/dist/` to your Hostinger `public_html` directory.

### 4. Set Backend Environment Variables
Set these in Hostinger control panel (or `.env` on your server):

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay key (rzp_test_* or rzp_live_*) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `FRONTEND_URL` | Your production frontend URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL |

### 5. Switch Razorpay to Live Mode
Change `RAZORPAY_KEY_ID` from `rzp_test_*` to `rzp_live_*` and update `RAZORPAY_KEY_SECRET` accordingly before accepting real payments.

### 6. Run Merge Script (Once)
On the production server, run the category merge script:
```bash
cd backend
node scripts/mergeDuplicateCategories.js
```
