# Quiz App - Plateforme d'Apprentissage Interactive

Une plateforme interactive pour la préparation aux certifications IT avec support des flashcards et des quiz.

## 🎯 Fonctionnalités

- **Quiz Interactifs** : Questions à choix multiples, texte libre, ordonnancement, et matching
- **Flashcards** : Apprentissage par répétition espacée
- **Mélange Aléatoire** : Ordre des questions et flashcards aléatoire à chaque session
- **Suivi de Progression** : Tracking des tentatives et des scores
- **Interface Metro UI** : Design moderne et réactif
- **Support Multi-Thèmes** : Azure (AZ-104), Red Hat (RHCSA), etc.

## 📋 Prérequis

- Docker & Docker Compose
- Node.js 20+ (pour développement local)
- PostgreSQL 17 (fourni dans les conteneurs)

## 🚀 Démarrage Rapide

git clone https://

cd quiz-app-v2


### Configurer les variables d'environnement
```bash
cp frontend/frontend.env.example frontend/.env
cp backend/backend.env.example backend/.env
```

### Avec Docker Compose

```bash
# 2. Démarrer les services
docker compose up -d

# 3. Accéder à l'application
# Frontend: http://localhost (via Traefik) ou http://localhost:5173
# Dashboard Traefik: http://localhost:8080
```

## 📁 Structure du Projet

```
.
├── frontend/                 # Application React/Vite
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/           # Pages principales
│   │   ├── store/           # Gestion d'état (Zustand)
│   │   └── lib/             # APIs et utilitaires
│   └── Dockerfile
├── backend/                  # API Node.js/Fastify
│   ├── src/
│   │   ├── routes/          # Routes API
│   │   ├── services/        # Logique métier
│   │   ├── dal/             # Accès données
│   │   └── utils/           # Utilitaires
│   ├── content/             # Contenus YAML (thèmes, questions, flashcards)
│   └── Dockerfile
├── docker-compose.yml        # Orchestration des services
├── traefik.yml              # Configuration Traefik
└── README_3.md              # Ce fichier
```

## 🔧 Configuration

### Variables d'Environnement

#### Root (.env.example)
```env
POSTGRES_DB=edulabs
POSTGRES_USER=edulabs
POSTGRES_PASSWORD=changeme_in_production
```

#### Frontend (frontend/.env.example)
```env
VITE_API_BASE=http://localhost:3000
```

#### Backend (backend/.env.example)
```env
PORT=3000
DATABASE_URL=postgresql://edulabs:password@quiz-db:5432/edulabs_quiz
ALLOWED_ORIGINS=http://localhost:5173,http://localhost
```

## 🐳 Services Docker

| Service | Port | Description |
|---------|------|-------------|
| `traefik` | 80, 8080 | Reverse proxy & load balancer |
| `quiz-frontend` | 5173 | Application React |
| `quiz-backend` | 3000 | API REST |
| `quiz-db` | 5432 | PostgreSQL 17 |

## 📚 Structure du Contenu

Les contenus (questions, flashcards) sont organisés en YAML :

```
backend/content/themes/
├── az-104/              # Thème Azure AZ-104
│   ├── compute/
│   │   ├── vm-linux/
│   │   │   ├── questions.yaml
│   │   │   ├── flashcards.yaml
│   │   │   └── meta.yaml
│   │   └── vmss/
│   └── networking/
└── rhcsa/               # Thème Red Hat RHCSA
    ├── networking/
    └── storage/
```

## 🎲 Mélange Aléatoire des Questions

Le projet utilise un système de seed déterministe avec timestamp pour un mélange aléatoire à chaque session :

- **Propositions de réponses** : Mélangées de façon déterministe (même utilisateur = même ordre)
- **Ordre des questions/flashcards** : Aléatoire à chaque session (timestamp incluau dans le seed)

## 🔌 API Endpoints

### Thèmes
- `GET /themes` - Liste les thèmes disponibles
- `GET /themes/:name` - Détails d'un thème

### Questions
- `GET /themes/:theme/categories/:category/subcategories/:subcat/questions` - Questions d'une sous-catégorie
- `POST /verify` - Vérifier les réponses

### Flashcards
- `GET /themes/:theme/categories/:category/subcategories/:subcat/flashcards` - Flashcards d'une sous-catégorie

### Progression
- `GET /progress` - Obtenir la progression de l'utilisateur
- `POST /attempt` - Enregistrer une tentative
- `POST /progress` - Sauvegarder la progression

## 🛠️ Développement Local

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## 🔌 Traefik Routing

Le projet utilise Traefik pour router les requêtes :
- `/` → Frontend (port 5173)
- `/api/*` → Backend (port 3000)

Configuration dans les labels Docker :
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.frontend.rule=PathPrefix(`/`)"
  - "traefik.http.routers.backend.rule=PathPrefix(`/api`)"
  - "traefik.http.routers.backend.middlewares=strip-api"
```

## 📊 Schéma Base de Données

- **users** : Utilisateurs
- **attempts** : Tentatives de quiz
- **progress** : Progression utilisateur

## 🐛 Dépannage

### Le frontend affiche "NetworkError"
- Vérifier que le backend répond : `curl http://localhost:3000/themes`
- Vérifier la variable `VITE_API_BASE` dans `frontend/.env`

### Les conteneurs ne démarrent pas
```bash
# Vérifier les logs
docker compose logs quiz-frontend
docker compose logs quiz-backend

# Redémarrer
docker compose restart
```

### Les conteneurs ne trouvent pas la base de données
- Vérifier que `quiz-db` est en bonne santé : `docker compose ps`
- Vérifier la chaîne de connexion dans `backend/.env`

## 📝 Licence

MIT

## 👤 Auteur

CallmeVRM

---

**Dernière mise à jour** : Novembre 2025
