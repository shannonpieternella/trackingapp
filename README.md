# UTM Tracking & Analytics Platform

Een complete UTM tracking platform met server-side analytics, page journey tracking, en performance insights.

## Features

- **UTM Link Builder**: Genereer en beheer UTM tracking links
- **Campaign Management**: Organiseer en monitor marketing campaigns
- **Real-time Analytics**: Live dashboard met actuele bezoekersinformatie
- **Complete Page Tracking**: Volg de volledige user journey op je website
- **Multi-Touch Attribution**: Volg conversies terug naar de originele bron
- **Performance Reports**: Gedetailleerde rapporten en data export

## Tech Stack

- **Backend**: Node.js + Express API
- **Database**: MongoDB voor user/session data
- **Frontend**: HTML/CSS/JavaScript met Chart.js voor visualisaties
- **Tracking**: JavaScript SDK voor website tracking

## Installatie

### Vereisten

- Node.js (v14 of hoger)
- MongoDB (v4.4 of hoger)
- Redis (optioneel maar aanbevolen)

### Stap 1: Clone het project

```bash
git clone <repository-url>
cd utm-tracking-platform
```

### Stap 2: Installeer dependencies

```bash
npm install
```

### Stap 3: Configureer environment variabelen

Kopieer het `.env` bestand en pas de waarden aan:

```bash
cp .env.example .env
```

Belangrijke variabelen:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Geheime sleutel voor JWT tokens
- `PORT`: Server poort (standaard 3000)

### Stap 4: Start MongoDB

```bash
# MacOS met Homebrew
brew services start mongodb-community

# Of start MongoDB handmatig
mongod
```

### Stap 5: Start de applicatie

```bash
# Development mode
npm run dev

# Production mode
npm start
```

De applicatie is nu beschikbaar op `http://localhost:3000`

## Gebruik

### 1. Account Registratie

- Ga naar `http://localhost:3000`
- Klik op "Don't have an account? Sign up"
- Vul je gegevens in en maak een account

### 2. Tracking Script Installatie

Na het inloggen, voeg het tracking script toe aan je website:

```html
<script>
  window.UTM_API_KEY = 'your-api-key-here';
</script>
<script src="http://localhost:3000/api/tracking/script.js?domain=yourdomain.com"></script>
```

### 3. UTM Links Maken

1. Ga naar "UTM Builder" in het menu
2. Vul de vereiste velden in:
   - Website URL
   - Campaign Source (bijv. google, facebook)
   - Campaign Medium (bijv. cpc, social)
   - Campaign Name
3. Klik op "Generate UTM Link"
4. Kopieer de gegenereerde link of short URL

### 4. Campaign Management

1. Ga naar "Campaigns" om een nieuwe campaign aan te maken
2. Vul de campaign details in:
   - Naam, platform, budget
   - Start- en einddatum
   - Default UTM parameters
3. Koppel UTM links aan campaigns voor betere tracking

### 5. Analytics Dashboard

Het dashboard toont:
- Real-time bezoekersaantallen
- Traffic sources breakdown
- Top performing campaigns
- Entry/exit pages
- Conversion tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - Registreer nieuwe gebruiker
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get huidige gebruiker

### UTM Management
- `POST /api/utm/build` - Genereer UTM link
- `GET /api/utm/templates` - Get UTM templates
- `POST /api/utm/bulk` - Bulk UTM creatie
- `GET /api/utm/history` - Link geschiedenis

### Analytics
- `GET /api/analytics/overview` - Analytics overzicht
- `GET /api/analytics/sources` - Traffic sources
- `GET /api/analytics/pages` - Page analytics
- `GET /api/analytics/realtime` - Real-time data

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `GET /api/campaigns/:id/performance` - Campaign performance

## Development

### Project Structuur

```
utm-tracking-platform/
├── backend/
│   ├── api/          # API routes
│   ├── controllers/  # Request handlers
│   ├── models/       # Database models
│   ├── middleware/   # Express middleware
│   └── app.js        # Express app setup
├── frontend/
│   ├── public/       # Static assets
│   │   ├── css/      # Stylesheets
│   │   └── js/       # JavaScript files
│   └── views/        # HTML pages
└── package.json
```

### Database Schema

**User Model**:
- Email, password, organization
- API key voor tracking
- Subscription plan
- Domain verificatie

**Campaign Model**:
- Campaign details (naam, platform, budget)
- UTM defaults
- Performance metrics
- Gekoppelde links

**Session Model**:
- Visitor tracking
- UTM parameters
- Page journey
- Conversions

## Troubleshooting

### MongoDB connection errors
```bash
# Check of MongoDB draait
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community
```

### Port already in use
```bash
# Verander de PORT in .env
PORT=3001
```

### Tracking script laadt niet
- Controleer CORS settings in backend/app.js
- Verifieer dat het domain is toegevoegd in je account

## Licentie

MIT License