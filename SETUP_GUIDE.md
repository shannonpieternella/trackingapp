# UTM Tracking Platform - Complete Setup Guide

## Snelle Installatie (5 minuten)

### Stap 1: Installeer MongoDB (als je het nog niet hebt)

**MacOS:**
```bash
# Met Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download en installeer van: https://www.mongodb.com/try/download/community

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### Stap 2: Start de UTM Tracking Platform

```bash
# Open een terminal in de project folder
cd utm-tracking-platform

# Installeer dependencies (eenmalig)
npm install

# Start de applicatie
npm run dev
```

### Stap 3: Open de applicatie

Open je browser en ga naar: **http://localhost:3000**

## Eerste Gebruik

### 1. Maak een Account

1. Klik op "Don't have an account? Sign up"
2. Vul je gegevens in:
   - Full Name: Je naam
   - Email: Je email adres
   - Password: Minimaal 6 karakters
   - Organization: Optioneel
3. Klik op "Create Account"

### 2. Eerste Campaign Aanmaken

1. Ga naar "Campaigns" in het menu
2. Klik op "Create Campaign"
3. Vul in:
   - Campaign Name: bijv. "Summer Sale 2024"
   - Platform: Kies je marketing platform
   - Start Date: Vandaag
   - Budget: Optioneel
4. Klik op "Create Campaign"

### 3. UTM Link Genereren

1. Ga naar "UTM Builder" in het menu
2. Vul in:
   - Website URL: `https://jouwwebsite.com/product`
   - Campaign Source: `facebook`
   - Campaign Medium: `social`
   - Campaign Name: `summer-sale-2024`
3. Klik op "Generate UTM Link"
4. Kopieer de gegenereerde link

### 4. Tracking Script Installeren

1. Ga naar je Dashboard
2. Zoek je API key (wordt getoond na registratie)
3. Voeg dit script toe aan ELKE pagina van je website:

```html
<!-- UTM Tracking Script -->
<script>
  window.UTM_API_KEY = 'jouw-api-key-hier';
</script>
<script src="http://localhost:3000/api/tracking/script.js?domain=jouwwebsite.com"></script>
```

**Voor WordPress:**
Voeg toe aan header.php of gebruik een plugin zoals "Insert Headers and Footers"

**Voor HTML websites:**
Voeg toe voor de closing `</body>` tag

## Test de Tracking

### 1. Test een UTM Link

1. Open een incognito/privé browser venster
2. Plak je UTM link en bezoek de pagina
3. Ga terug naar je Dashboard
4. Je zou binnen 30 seconden de sessie moeten zien

### 2. Test Conversies

Voeg deze code toe waar een conversie plaatsvindt (bijv. na een aankoop):

```javascript
// Track een conversie
if (window.utmTracker) {
  window.utmTracker.conversion('purchase', 99.99, 'EUR', {
    orderId: '12345',
    product: 'Summer Package'
  });
}
```

## Veelgestelde Problemen

### "MongoDB connection error"
**Oplossing:** Start MongoDB:
```bash
# MacOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Windows
Start MongoDB via Services
```

### "Cannot connect to server"
**Oplossing:** Zorg dat de server draait:
```bash
cd utm-tracking-platform
npm run dev
```

### "Tracking script not working"
**Oplossing:** 
1. Controleer of het domain correct is
2. Vervang `localhost:3000` met je server URL als je live bent
3. Check de browser console voor errors

## Live Deployment

Voor productie gebruik:

1. **Update .env file:**
   - Verander JWT_SECRET naar een veilige random string
   - Update CORS_ORIGIN naar je domain

2. **Use HTTPS:**
   - Installeer een SSL certificaat
   - Update alle http:// naar https://

3. **Start met PM2:**
   ```bash
   npm install -g pm2
   pm2 start backend/app.js --name utm-tracker
   pm2 save
   pm2 startup
   ```

## Support

- Check logs: `pm2 logs utm-tracker`
- Database issues: Check MongoDB status
- Tracking issues: Check browser console

## API Endpoints voor Testing

Test de API met deze curl commands:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Analytics
curl http://localhost:3000/api/analytics/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Ready to Track! 🚀

Je UTM Tracking Platform is nu klaar voor gebruik. Begin met het maken van campaigns en het tracken van je marketing performance!