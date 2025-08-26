# 🚀 Coolify Deployment Guide

Bu rehber, Cozy Invoice sistemini Coolify'a nasıl deploy edeceğinizi açıklar.

## 📋 Ön Gereksinimler

- Coolify kurulu ve çalışır durumda
- Git repository erişimi
- Supabase projesi ve API anahtarları

## 🔧 Coolify Kurulum Adımları

### 1. Yeni Uygulama Oluşturma

1. **Coolify Dashboard**'a giriş yapın
2. **"New Application"** butonuna tıklayın
3. **Source** olarak **"Git"** seçin
4. **Repository URL**'ini girin: `https://github.com/tacicek/Rechnungssytem.git`

### 2. Build Konfigürasyonu

```yaml
# Build Command
npm run build

# Build Output Directory
dist

# Node.js Version
18.x
```

### 3. Environment Variables

Aşağıdaki environment variable'ları ekleyin:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (Optional)
OPENAI_API_KEY=your_openai_api_key

# Resend Email (Optional)
RESEND_API_KEY=your_resend_api_key

# NODE_ENV
NODE_ENV=production
```

### 4. Port Konfigürasyonu

- **Port**: 3000 (veya tercih ettiğiniz port)
- **Health Check Path**: `/`

## 🚀 Deployment

### Otomatik Deployment

1. **Repository'ye push** yapın
2. Coolify otomatik olarak yeni deployment'ı başlatacak
3. Build süreci tamamlandığında uygulama canlı olacak

### Manuel Deployment

1. **"Deploy"** butonuna tıklayın
2. Build sürecini takip edin
3. Deployment tamamlandığında **"Visit"** butonuna tıklayın

## 📊 Monitoring

### Health Checks

- **Path**: `/`
- **Interval**: 30 saniye
- **Timeout**: 10 saniye

### Logs

- **Build Logs**: Build sürecini takip edin
- **Runtime Logs**: Uygulama çalışma loglarını görüntüleyin

## 🔒 Güvenlik

### SSL/TLS

- **Auto SSL**: Coolify otomatik SSL sertifikası sağlar
- **Custom Domain**: Kendi domain'inizi ekleyebilirsiniz

### Environment Variables

- Hassas bilgileri environment variable olarak saklayın
- API anahtarlarını asla kod içinde tutmayın

## 🛠️ Troubleshooting

### Build Hataları

1. **Node.js Version**: 18.x kullandığınızdan emin olun
2. **Dependencies**: `npm install` komutunu çalıştırın
3. **Build Output**: `dist` klasörünün oluştuğunu kontrol edin

### Runtime Hataları

1. **Environment Variables**: Tüm gerekli değişkenlerin set edildiğini kontrol edin
2. **Supabase Connection**: Supabase bağlantısını test edin
3. **Port Conflicts**: Port çakışması olmadığından emin olun

### Performance Optimizasyonu

1. **Build Optimization**: Vite build optimizasyonları aktif
2. **Code Splitting**: Otomatik code splitting
3. **PWA Support**: Progressive Web App özellikleri

## 📱 PWA Özellikleri

- **Offline Support**: Service Worker ile offline çalışma
- **App Installation**: Mobil cihazlara kurulum
- **Push Notifications**: Bildirim desteği (opsiyonel)

## 🔄 Auto-Update

- **Git Push**: Her push'ta otomatik deployment
- **Branch Protection**: Main branch koruması
- **Rollback**: Önceki versiyona geri dönme

## 📞 Support

Sorun yaşarsanız:

1. **Coolify Logs**'u kontrol edin
2. **Build Output**'u inceleyin
3. **Environment Variables**'ı doğrulayın
4. **GitHub Issues**'da yardım arayın

---

**🎉 Başarılı deployment!** Sisteminiz artık Coolify'da çalışıyor.