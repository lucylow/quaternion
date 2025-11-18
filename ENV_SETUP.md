# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Supabase Configuration
# Get these from https://app.supabase.com/project/_/settings/api

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For server-side (Node.js)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Art Generation API Keys (Optional)
# Get these from https://www.imagine.art or your API provider
IMAGINEART_API_KEY=your_imagineart_api_key
DREAMINA_API_KEY=your_dreamina_api_key
IMAGINEART_API_URL=https://api.imagine.art/v1
DREAMINA_API_URL=https://api.imagine.art/v1/dreamina

# Frontend Art Generation API URLs (optional, defaults to /api/art)
VITE_IMAGINEART_API_URL=/api/art/imagineart
VITE_DREAMINA_API_URL=/api/art/dreamina
```

## Getting Your Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## Notes

- Never commit `.env` to version control
- `.env` is already in `.gitignore`
- The app will gracefully fall back to localStorage if Supabase is not configured

