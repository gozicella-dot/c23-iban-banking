# C23 Bank Finance - IBAN Integration Platform

Une plateforme bancaire complète pour générer et gérer les IBAN de 79 pays.

## 🚀 Fonctionnalités

- ✅ Inscription et authentification utilisateur
- ✅ Génération d'IBAN automatique
- ✅ Support de 79 pays
- ✅ Gestion de compte bancaire
- ✅ Historique des transactions
- ✅ Interface responsive (mobile et desktop)

## 📋 Structure du Projet
c23-iban-banking/
├── frontend/          # Interface web (Netlify)
│   └── index.html     # Application web
├── backend/           # API REST (Render)
│   ├── server.js      # Serveur Express
│   ├── package.json   # Dépendances
│   ├── .env.example   # Variables d'environnement
│   └── Procfile       # Configuration Render
├── netlify.toml       # Configuration Netlify
└── .gitignore         # Fichiers ignorés Git
## 🛠️ Technologies

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT
- **Hosting**: Netlify (frontend), Render (backend)

## 🔒 Variables d'Environnement

Créez un fichier `.env` dans le dossier `backend/`:

SUPABASE_URL=votre-url-supabase
SUPABASE_KEY=votre-clé-supabase
JWT_SECRET=votre-secret-jwt
NODE_ENV=production
PORT=3000

## 📞 Support

Pour plus d'informations, consultez la documentation de déploiement.

---

**Créé avec ❤️ par C23 Bank Finance**
