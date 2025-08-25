# 🚀 Cozy Invoice - Coolify Deployment Guide

This guide will help you deploy the Cozy Invoice system to your Coolify-hosted Supabase instance.

## 📋 Prerequisites

- ✅ Coolify instance running
- ✅ Supabase deployed on Coolify at `https://supabasekong.g53.ch`
- ✅ GitHub repository: `https://github.com/tacicek/Rechnungssytem.git`

## 🗄️ Step 1: Database Setup

### Option A: Using Supabase SQL Editor (Recommended)

1. Open your Supabase dashboard at `https://supabasekong.g53.ch`
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the entire content from `database-setup.sql`
5. Click **Run** to execute the script

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to your Supabase instance
supabase login

# Connect to your project
supabase link --project-ref your-project-id

# Run the setup script
supabase db push
```

## 🔐 Step 2: Authentication Setup

In your Supabase dashboard:

1. Go to **Authentication → Settings**
2. Enable **Email** provider
3. Configure **Site URL**: Your final Coolify deployment URL
4. Configure **Redirect URLs**: Add your deployment domain
5. **Disable** email confirmations for easier testing (optional)

## ⚙️ Step 3: Coolify Configuration

### Repository Settings
```
Repository URL: https://github.com/tacicek/Rechnungssytem.git
Branch: main
```

### Build Settings
```
Build Command: npm run build
Output Directory: dist
Node Version: 18
```

### Environment Variables

Set these in Coolify's environment variables section:

```bash
# Required - Supabase Configuration
VITE_SUPABASE_URL=https://supabasekong.g53.ch
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NjA1NDUwMCwiZXhwIjo0OTExNzI4MTAwLCJyb2xlIjoiYW5vbiJ9.3HimbWxdolmrpZbbXuvHEC_8Mm1_wX0FJ3xnqmaOyzQ

# Application Settings
NODE_ENV=production
VITE_APP_NAME=Cozy Invoice
VITE_APP_VERSION=1.0.0

# Optional - AI Features
# VITE_OPENAI_API_KEY=your_openai_api_key_here

# Optional - Email Features  
# VITE_RESEND_API_KEY=your_resend_api_key_here
```

## 🔧 Step 4: First Time Setup

After successful deployment:

1. **Access your application** via the Coolify-provided URL
2. **Register first user**:
   - Click "Sign Up"
   - Enter email and password
   - This will be your admin account

3. **Create your vendor/company**:
   - The system will prompt you to create a vendor profile
   - Fill in your company details
   - Upload your logo (optional)

4. **Configure company settings**:
   - Go to Settings → Company
   - Enter your complete business information
   - Set up invoice templates and terms

## 🎯 Step 5: Initial Data Setup

### Add Your First Customer
1. Go to **Customers** page
2. Click **"+ Neuer Kunde"**
3. Enter customer details
4. Save

### Add Your First Product/Service
1. Go to **Products** page  
2. Click **"+ Neues Produkt"**
3. Enter product/service details
4. Set pricing and tax rates
5. Save

### Create Your First Invoice
1. Go to **Invoices** page
2. Click **"+ Neue Rechnung"** 
3. Select customer
4. Add products/services
5. Generate PDF and send

## 📊 System Features Available

✅ **Dashboard** - Financial overview and statistics  
✅ **Invoicing** - Create, manage, and send invoices with Swiss QR codes  
✅ **Customers** - Complete CRM functionality  
✅ **Products** - Product catalog with categories  
✅ **Offers** - Quotation management  
✅ **Expenses** - Business expense tracking  
✅ **Revenue** - Revenue tracking and reporting  
✅ **Reports** - Tax and financial reports  
✅ **Multi-device** - Responsive design for mobile and desktop  

## 🔍 Troubleshooting

### Build Errors
- Check Node.js version is 18+
- Verify all environment variables are set
- Check build logs in Coolify

### Database Connection Issues
- Verify `VITE_SUPABASE_URL` is correct
- Check `VITE_SUPABASE_ANON_KEY` is valid
- Ensure database setup script ran successfully

### Authentication Issues
- Check Supabase Auth settings
- Verify redirect URLs match your domain
- Check RLS policies are active

### Permission Errors
- Ensure user is assigned to a vendor
- Check RLS policies in database
- Verify user profile exists

## 🆘 Support

If you encounter issues:

1. Check Coolify deployment logs
2. Check browser console for errors
3. Verify Supabase connection in Network tab
4. Check database tables were created correctly

## 🎉 Success!

Your Cozy Invoice system should now be running successfully on Coolify with your own Supabase instance!

**Next Steps:**
- Customize your invoice templates
- Set up automated backups
- Configure email notifications (optional)
- Add more users to your vendor account