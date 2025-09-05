# 🌤️ WeerApp - Stunning Weather PWA

Een prachtige Progressive Web App (PWA) voor weerinformatie met een stunning glass-morphism design, speciaal geoptimaliseerd voor iPhone.

## ✨ Features

- **🎨 Glass-Morphism Design**: Moderne, transparante UI met prachtige glaseffecten
- **📱 iPhone Geoptimaliseerd**: Perfecte weergave op iPhone met native iOS styling
- **🌍 Locatie-gebaseerd**: Automatische locatiedetectie voor lokale weerinformatie
- **🌧️ Buienradar Integratie**: Nederlandse regenradar voor actuele neerslaginformatie
- **📊 Uitgebreide Voorspelling**: 24-uurs en 7-daagse weersvoorspelling
- **⚡ PWA Functionaliteit**: Offline support, installatie mogelijkheid, push notifications
- **🔄 Real-time Updates**: Automatische verversing van weerdata
- **🎭 Smooth Animations**: Vloeiende animaties en micro-interactions

## 🚀 Installatie

1. **Clone de repository**:
   ```bash
   git clone <repository-url>
   cd weerapp
   ```

2. **API Keys instellen**:
   - Verkrijg een gratis API key van [OpenWeatherMap](https://openweathermap.org/api)
   - Verkrijg een API key van [Buienradar](https://www.buienradar.nl/api)
   - Vervang de placeholder keys in `app.js`:
     ```javascript
     this.apiKey = 'YOUR_OPENWEATHER_API_KEY';
     this.buienradarApiKey = 'YOUR_BUIENRADAR_API_KEY';
     ```

3. **Server starten**:
   ```bash
   # Met Python
   python -m http.server 8000
   
   # Of met Node.js
   npx serve .
   
   # Of met PHP
   php -S localhost:8000
   ```

4. **Open in browser**:
   - Ga naar `http://localhost:8000`
   - Voor beste ervaring: gebruik Chrome/Safari op iPhone

## 📱 PWA Installatie

### Op iPhone:
1. Open de app in Safari
2. Tap op de "Deel" knop
3. Selecteer "Zet op beginscherm"
4. Tap "Toevoegen"

### Op Desktop:
1. Klik op het installatie-icoon in de adresbalk
2. Of ga naar het menu > "App installeren"

## 🎨 Design Features

### Glass-Morphism Effecten
- **Transparante achtergronden** met blur effecten
- **Subtiele borders** met glaseffecten
- **Gradient orbs** voor dynamische achtergrond
- **Smooth shadows** voor diepte

### iPhone Styling
- **SF Pro Display** font voor native iOS look
- **Safe area** support voor iPhone X+ notches
- **Touch-optimized** knoppen en interacties
- **Native scroll** gedrag

### Responsive Design
- **Mobile-first** approach
- **Flexible grid** system
- **Adaptive typography**
- **Touch-friendly** interface

## 🔧 Technische Details

### Tech Stack
- **HTML5** - Semantische markup
- **CSS3** - Moderne styling met custom properties
- **Vanilla JavaScript** - Geen frameworks, pure performance
- **Service Worker** - Offline functionaliteit
- **Web APIs** - Geolocation, Notifications, Background Sync

### API Integraties
- **OpenWeatherMap** - Weerdata en voorspellingen
- **Buienradar** - Nederlandse regenradar
- **Geolocation API** - Automatische locatiedetectie

### PWA Features
- **Manifest** - App metadata en installatie
- **Service Worker** - Caching en offline support
- **Background Sync** - Achtergrond updates
- **Push Notifications** - Weerwaarschuwingen

## 📁 Project Structuur

```
weerapp/
├── index.html          # Hoofdpagina
├── styles.css          # Glass-morphism styling
├── app.js             # JavaScript functionaliteit
├── manifest.json      # PWA manifest
├── sw.js             # Service Worker
├── icons/            # App iconen (verschillende formaten)
└── README.md         # Documentatie
```

## 🎯 Gebruik

1. **Toestemming geven**: Sta locatietoegang toe voor automatische weerinformatie
2. **Weer bekijken**: Huidige temperatuur, vochtigheid, windsnelheid
3. **Voorspellingen**: 24-uurs en 7-daagse weersvoorspelling
4. **Buienradar**: Actuele regenradar voor Nederland
5. **Verversen**: Tap op de refresh knop voor nieuwe data

## 🔄 Offline Functionaliteit

De app werkt ook offline dankzij de Service Worker:
- **Gecachte data** wordt getoond
- **Stale-while-revalidate** strategie
- **Background updates** wanneer online
- **Offline indicator** voor gebruiker

## 🌟 Performance

- **Lazy loading** van afbeeldingen
- **Efficient caching** strategieën
- **Minimal JavaScript** footprint
- **Optimized animations** met CSS transforms
- **Progressive enhancement**

## 🐛 Troubleshooting

### Locatie werkt niet
- Controleer browser permissies
- Zorg voor HTTPS verbinding
- Test op echte device (niet localhost)

### API errors
- Controleer API keys
- Check API quota limits
- Verificeer internet verbinding

### PWA installatie
- Gebruik HTTPS
- Controleer manifest.json
- Test in Chrome DevTools > Application

## 📄 Licentie

MIT License - Vrij te gebruiken voor persoonlijke en commerciële projecten.

## 🤝 Bijdragen

Pull requests zijn welkom! Voor grote wijzigingen, open eerst een issue.

## 📞 Support

Voor vragen of problemen, open een issue op GitHub.

---

**Gemaakt met ❤️ voor de beste weerervaring op iPhone** 📱✨
# Wheaty
