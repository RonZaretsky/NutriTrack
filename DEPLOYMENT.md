# Deployment Guide

This guide explains how to deploy NutriTrack to different environments (development, staging, and production).

## Environment Configuration

### Development Environment
- **Demo Mode**: ✅ Enabled
- **Purpose**: Local development and testing
- **Database**: Development Supabase project
- **Features**: Full demo mode controls visible

### Staging Environment
- **Demo Mode**: ✅ Enabled
- **Purpose**: Testing before production deployment
- **Database**: Staging Supabase project
- **Features**: Demo mode available for testing

### Production Environment
- **Demo Mode**: ❌ Disabled
- **Purpose**: Live application for end users
- **Database**: Production Supabase project
- **Features**: No demo mode controls visible

## Local Development

### 1. Development Mode (with demo controls)
```bash
# Copy development environment file
cp env.development .env

# Edit .env with your development credentials
# Then run:
npm run dev
```

### 2. Production Mode (without demo controls)
```bash
# Copy production environment file
cp env.production .env

# Edit .env with your production credentials
# Then run:
npm run dev:prod
```

## Building for Different Environments

### Development Build
```bash
npm run build:dev
```
- Includes demo mode controls
- Uses development environment variables
- Output: `dist/` folder

### Staging Build
```bash
npm run build:staging
```
- Includes demo mode controls
- Uses staging environment variables
- Output: `dist/` folder

### Production Build
```bash
npm run build
```
- No demo mode controls
- Uses production environment variables
- Output: `dist/` folder

## Deployment Platforms

### GitHub Pages (Production)
- **Automatic**: Pushes to `main` branch trigger deployment
- **Environment**: Production (no demo mode)
- **URL**: `https://ronzaretsky.github.io/NutriTrack/`

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Vercel
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in Vercel dashboard

## Environment Variables

### Required Variables
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

### Optional Variables
```bash
VITE_APP_ENV=development|staging|production
VITE_DEMO_MODE=true|false
VITE_OPENAI_API_KEY=your_openai_api_key  # Only needed for development
```

## Database Setup

### Development Database
1. Create a new Supabase project for development
2. Update `env.development` with your dev project credentials
3. Run migrations and seed data

## AI Service Setup

### Supabase Edge Function (Production)
1. Deploy the AI proxy function to your Supabase project:
   ```bash
   supabase functions deploy ai-proxy
   ```
2. Set the OpenAI API key in your Supabase project:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_openai_api_key
   ```

### Development AI Setup
1. For local development, you can use OpenAI directly by setting `VITE_OPENAI_API_KEY`
2. For production, the AI requests go through the secure Supabase Edge Function

### Staging Database
1. Create a new Supabase project for staging
2. Update `env.staging` with your staging project credentials
3. Copy production data structure

### Production Database
1. Create a new Supabase project for production
2. Update `env.production` with your production project credentials
3. Set up proper security rules and RLS policies

## Security Considerations

### Production Deployment
- ✅ Demo mode is automatically disabled
- ✅ Demo controls are hidden from UI
- ✅ Uses production database
- ✅ Environment variables are properly secured

### Development/Staging
- ✅ Demo mode available for testing
- ✅ Demo controls visible in UI
- ✅ Uses separate databases
- ✅ Safe for testing and development

## Troubleshooting

### Demo Mode Still Visible in Production
1. Check `VITE_APP_ENV` is set to `production`
2. Check `VITE_DEMO_MODE` is set to `false`
3. Clear browser cache and reload
4. Verify the build used production mode

### Environment Variables Not Loading
1. Ensure `.env` file exists in project root
2. Check variable names start with `VITE_`
3. Restart development server after changes
4. Verify variables are set in deployment platform

### Build Errors
1. Check all required environment variables are set
2. Verify Supabase credentials are correct
3. Check for syntax errors in environment files
4. Review build logs for specific error messages 