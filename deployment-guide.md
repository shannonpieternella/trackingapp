# Deployment Guide - UTM Tracking Platform

## Van Lokaal naar Productie

### 1. **Environment Variables** (.env)
```bash
# Production .env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/utm-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this
REDIS_URL=redis://localhost:6379
```

### 2. **Tracking Scripts Aanpassen**

In de tracking scripts voor klanten, verander:
```javascript
// Van:
var TRACKING_URL = 'http://localhost:3000';

// Naar:
var TRACKING_URL = 'https://tracking.jouwdomein.nl';
```

### 3. **Deployment Opties**

#### A. **VPS (DigitalOcean, Linode, etc.)**
```bash
# Op de server
git clone <your-repo>
cd utm-tracking-platform
npm install
npm run build

# PM2 voor process management
npm install -g pm2
pm2 start backend/app.js --name utm-tracker
pm2 save
pm2 startup
```

#### B. **Heroku**
```bash
# Voeg Procfile toe
echo "web: node backend/app.js" > Procfile

# Deploy
heroku create utm-tracker-app
heroku addons:create mongolab
git push heroku main
```

#### C. **Docker**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "backend/app.js"]
```

### 4. **Nginx Configuration** (voor VPS)
```nginx
server {
    listen 80;
    server_name tracking.jouwdomein.nl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. **SSL Certificate** (Belangrijk!)
```bash
# Met Let's Encrypt
sudo certbot --nginx -d tracking.jouwdomein.nl
```

### 6. **CORS Settings Updaten**

In `backend/app.js`, pas CORS aan voor je productie domeinen:
```javascript
app.use(cors({
  origin: [
    'https://klantwebsite1.nl',
    'https://klantwebsite2.com',
    // etc.
  ],
  credentials: true
}));
```

### 7. **MongoDB Atlas Setup**
1. Ga naar https://cloud.mongodb.com
2. Maak gratis cluster
3. Whitelist je server IP
4. Kopieer connection string naar .env

### 8. **Monitoring**
```bash
# PM2 monitoring
pm2 monit

# Of gebruik gratis services:
# - UptimeRobot (uptime monitoring)
# - Sentry (error tracking)
```

## Testing Checklist

### Lokaal:
- [ ] Test alle pagina's met `/test-user-flow`
- [ ] Check dashboard data
- [ ] Test conversion tracking
- [ ] Verify UTM parameters

### Productie:
- [ ] SSL certificaat werkt
- [ ] Tracking pixel laadt (check Network tab)
- [ ] Dashboard toegankelijk
- [ ] API endpoints reageren
- [ ] MongoDB connection werkt
- [ ] Conversions worden getrackt

## Klanten Instructies

Voor elke klant:
1. Geef ze hun API key
2. Stuur tracking setup link: `https://tracking.jouwdomein.nl/tracking-setup`
3. Ze passen domein aan in het script
4. Ze plakken code op hun site
5. Test met `?utm_source=test`

## Belangrijk voor Productie

1. **Backup MongoDB** regelmatig
2. **Rate limiting** is al ingesteld
3. **API keys** per klant (nu gebruik je 1 key)
4. **GDPR compliance** - voeg privacy policy toe

## Commando's Overzicht

```bash
# Development
npm run dev

# Production
npm start

# Met PM2
pm2 start backend/app.js --name utm-tracker
pm2 logs utm-tracker
pm2 restart utm-tracker
```