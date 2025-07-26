# 🚀 UTM Tracking Platform - Quick Start (5 minuten)

## 1️⃣ Start de Applicatie

```bash
# Open terminal in deze folder en run:
./start.sh

# Of handmatig:
npm install
npm run dev
```

## 2️⃣ Maak een Account

1. Open browser: **http://localhost:3000**
2. Klik: **"Don't have an account? Sign up"**
3. Vul in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `test123`
4. Klik: **Create Account**

## 3️⃣ Krijg je API Key

Na login zie je bovenaan het dashboard:
- **Your API Key:** `utm_xxxxxxxxxxxxx`
- Klik **Copy** om te kopiëren

## 4️⃣ Test de Tracking

### Optie A: Test Website (Makkelijkst)

1. Open `test-website.html` in een tekst editor
2. Vervang `YOUR-API-KEY` met jouw API key:
   ```javascript
   window.UTM_API_KEY = 'utm_xxxxxxxxxxxxx';
   ```
3. Sla het bestand op
4. Open `test-website.html` in je browser
5. Klik op de test buttons om events te tracken
6. Check je dashboard - je zou de data moeten zien!

### Optie B: Je Eigen Website

Voeg dit toe aan elke pagina van je website:

```html
<!-- Voor </body> tag -->
<script>
  window.UTM_API_KEY = 'jouw-api-key-hier';
</script>
<script src="http://localhost:3000/api/tracking/script.js?domain=jouwwebsite.com"></script>
```

## 5️⃣ Maak je Eerste UTM Link

1. Ga naar **UTM Builder** in het menu
2. Vul in:
   - Website URL: `https://example.com`
   - Campaign Source: `facebook`
   - Campaign Medium: `social`
   - Campaign Name: `summer-sale`
3. Klik **Generate UTM Link**
4. Kopieer de link en gebruik hem!

## 6️⃣ Bekijk Analytics

- **Dashboard**: Real-time bezoekers en overview
- **Campaigns**: Beheer je marketing campaigns
- **UTM Builder**: Maak tracking links

## 🎯 Test URLs

Test deze URLs in je browser (na installatie tracking script):

```
http://localhost:3000/test-website.html?utm_source=google&utm_medium=cpc&utm_campaign=test
http://localhost:3000/test-website.html?utm_source=facebook&utm_medium=social&utm_campaign=test
http://localhost:3000/test-website.html?utm_source=email&utm_medium=newsletter&utm_campaign=test
```

## ⚡ Troubleshooting

### "MongoDB connection error"
```bash
# MacOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Windows
Start MongoDB from Services
```

### "Tracking not working"
1. Check browser console (F12)
2. Verify API key is correct
3. Check domain in tracking script

### "Cannot see data"
1. Wacht 30 seconden (real-time update)
2. Refresh dashboard
3. Check date range filters

## 📞 Need Help?

1. Check `SETUP_GUIDE.md` voor detailed instructions
2. Check browser console voor errors
3. Check server logs in terminal

---

**Ready to track! 🎉** Open http://localhost:3000 en begin!