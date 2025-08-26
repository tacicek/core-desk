# 🔐 Development Credentials

## Main Dashboard Access

### Super Admin Account
```
Email: tuncaycicek@outlook.com
Password: Rz8#mK2$vL9@nX4!
User ID: 4e228b7a-9fdb-43b5-9d3b-5bf0df42609b
```

## Access URLs

### 📊 Business Dashboard
- **URL**: http://localhost:5173/auth
- **Features**: 
  - Invoice Management
  - Customer & Product Management
  - Financial Analytics
  - Expense Tracking
  - Revenue Management
  - Swiss QR Invoices
  - PDF Generation
  - Real-time Notifications

### 🛡️ Admin Panel
- **URL**: http://localhost:5173/admin/login
- **Features**:
  - Tenant Management
  - Subscription Management
  - Support Tickets
  - System Analytics
  - User Administration
  - Audit Logs

### 🏠 Landing Page
- **URL**: http://localhost:5173/
- **Features**:
  - Public information
  - User registration
  - Demo access

## Account Permissions

### Super Admin Rights
```json
{
  "full_access": true,
  "manage_tenants": true,
  "manage_subscriptions": true,
  "manage_support": true
}
```

### Database Access
- **Row-Level Security**: Enabled
- **Multi-tenant Isolation**: Active
- **JWT Authentication**: Implemented

## API Integration Credentials

### Supabase
- **Project URL**: As configured in environment
- **Anon Key**: As configured in environment
- **Service Role**: For admin operations

### Third-party Services
- **OpenAI API**: For PDF scanning (configure in settings)
- **Resend API**: For email delivery (configure in settings)
- **n8n Integration**: For workflow automation

## Development Notes

### First Time Setup
1. Access http://localhost:5173/auth
2. Use the credentials above to sign in
3. System will automatically set up vendor profile
4. All enterprise features are immediately available

### Testing Different User Types
- **Super Admin**: Full system access
- **Regular User**: Business dashboard only
- **Guest**: Landing page and registration

### Security Features
- ✅ AES-256-GCM encryption for sensitive data
- ✅ JWT-based authentication
- ✅ Row-Level Security (RLS)
- ✅ Real-time notifications
- ✅ Comprehensive error handling
- ✅ Audit logging

## System Status

### ✅ Implemented Features
- Enterprise security framework
- Real-time notification system
- Advanced analytics dashboard
- PWA with offline capabilities
- German localization (i18n)
- Database optimization
- Comprehensive testing framework

### 🎯 Ready for Use
All enterprise-grade features (5.0/5) are fully implemented and operational.