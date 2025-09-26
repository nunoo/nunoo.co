# Admin Account Setup

This portfolio site uses Supabase for authentication and storage. Only authenticated admin users can upload photos, while the public gallery is accessible to everyone.

## Creating Your Admin Account

Since there's no public registration (for security), you need to create your admin account directly in Supabase:

### Method 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add user** → **Create new user**
5. Fill in:
   - Email: `your-email@example.com`
   - Password: Your secure password
   - ✅ Check **Auto Confirm Email** (important!)
6. Click **Create user**

### Method 2: SQL Editor

1. In Supabase Dashboard, go to **SQL Editor**
2. Run this query (replace with your details):

```sql
-- Create a new admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'your-email@example.com', -- Change this
  crypt('your-secure-password', gen_salt('bf')), -- Change this
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  FALSE
);
```

## Accessing Your Admin Area

Once your account is created:

1. **Login**: Navigate to `/admin` on your deployed site
2. **Upload Photos**: After login, you'll be redirected to `/admin/photos`
3. **Public Gallery**: Available at `/photos` (no login required)

## Security Notes

- There is **no public registration endpoint** by design
- Only create accounts through Supabase Dashboard
- The admin area is completely separate from the public portfolio
- Photos are stored in Supabase Storage with automatic CDN distribution

## Troubleshooting

### Can't login?
- Ensure you checked "Auto Confirm Email" when creating the user
- Check that your password is correct
- Verify the user appears in Supabase Dashboard → Authentication → Users

### Upload fails?
- Check that the storage bucket named `photos` exists and is public
- Ensure your environment variables are set correctly in Vercel
- Verify you're logged in (check for cookies in browser dev tools)