# 🚢 Port Tracking — Frontend

> Système de suivi portuaire — Interface React + Vite + TailwindCSS

---

## 📋 Table des Matières

- [Aperçu](#aperçu)
- [Technologies Utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Connexion avec le Backend Spring Boot](#connexion-avec-le-backend-spring-boot)
- [Connexion avec MySQL](#connexion-avec-mysql)
- [Rôles & Accès](#rôles--accès)
- [Structure du Projet](#structure-du-projet)
- [Scripts Disponibles](#scripts-disponibles)

---

## 📌 Aperçu

Port Tracking est une application web de gestion et de suivi des fiches suiveuses portuaires. Elle permet à différents acteurs (Importateur, ADII, Opérateur, Inspecteur, Admin) de suivre le cycle de vie des marchandises depuis leur arrivée jusqu'à leur dédouanement.

---

## 🛠 Technologies Utilisées

| Technologie | Version | Rôle |
|---|---|---|
| React | 18+ | Framework UI |
| Vite | 5+ | Build tool |
| TailwindCSS | 3+ | Styling |
| Axios | 1+ | Appels API HTTP |
| React Router DOM | 6+ | Navigation |
| Lucide React | 0.3+ | Icônes |

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** v18 ou supérieur → [nodejs.org](https://nodejs.org)
- **npm** v9 ou supérieur (inclus avec Node.js)
- **Spring Boot Backend** démarré sur le port `8080`
- **MySQL** démarré avec la base de données `port_tracking`

---

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/port-tracking-frontend.git
cd port-tracking-frontend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer le fichier d'environnement

Créez un fichier `.env` à la racine du projet (même niveau que `package.json`) :

```env
VITE_API_BASE_URL=http://localhost:8080
```

> ⚠️ **Important** : Sans ce fichier, toutes les requêtes API échoueront car Axios n'aura pas d'URL de base.

### 4. Démarrer l'application

```bash
npm run dev
```

L'application sera disponible sur : **http://localhost:5175**

---

## ⚙️ Configuration

### Fichier `.env`

```env
# URL de base du backend Spring Boot
VITE_API_BASE_URL=http://localhost:8080
```

| Variable | Description | Valeur par défaut |
|---|---|---|
| `VITE_API_BASE_URL` | URL du backend Spring Boot | `http://localhost:8080` |

> Si votre backend tourne sur un port différent, modifiez cette valeur en conséquence.

---

## 🔗 Connexion avec le Backend Spring Boot

### Architecture de Communication

```
React (port 5175)  ←→  Axios  ←→  Spring Boot (port 8080)  ←→  MySQL (port 3306)
```

### Configuration Axios (`src/api/axiosConfig.js`)

```javascript
import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, // http://localhost:8080
});

// Ajout automatique du token JWT à chaque requête
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
```

### Endpoints Backend Requis

| Méthode | Endpoint | Rôle |
|---|---|---|
| POST | `/api/auth/login` | Authentification |
| POST | `/api/auth/register` | Création utilisateur |
| GET | `/api/fiches` | Liste des fiches |
| POST | `/api/fiches` | Créer une fiche |
| PUT | `/api/fiches/{id}/statut` | Changer statut fiche |
| GET | `/api/fiches/{id}/historique` | Historique fiche |
| GET | `/api/conteneurs/fiche/{ficheId}` | Conteneurs d'une fiche |
| POST | `/api/conteneurs` | Créer un conteneur |
| PUT | `/api/conteneurs/{id}/emplacement` | Assigner emplacement |
| GET | `/api/inspections` | Toutes les inspections |
| GET | `/api/inspections/mes-taches` | Inspections par inspecteur |
| POST | `/api/inspections` | Créer une inspection |
| PUT | `/api/inspections/{id}/resultat` | Enregistrer résultat |
| GET | `/api/notifications/me` | Notifications utilisateur |
| PUT | `/api/notifications/{id}/lu` | Marquer comme lu |
| GET | `/api/qrcode/{conteneurId}` | Générer QR Code |
| GET | `/api/users` | Liste des utilisateurs |

### Configuration CORS dans Spring Boot

Pour permettre les appels depuis le frontend, votre backend doit avoir cette configuration :

```java
// CorsConfig.java
@Bean
public CorsFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("http://localhost:*"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return new CorsFilter(source);
}
```

### Authentification JWT

1. L'utilisateur se connecte via `/api/auth/login`
2. Le backend retourne un token JWT
3. Le token est stocké dans `localStorage`
4. Axios l'envoie automatiquement dans le header `Authorization: Bearer <token>`

---

## 🗄️ Connexion avec MySQL

### Configuration Backend (`application.properties`)

```properties
# Base de données
spring.datasource.url=jdbc:mysql://localhost:3306/port_tracking
spring.datasource.username=root
spring.datasource.password=votre_mot_de_passe
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# Port du serveur
server.port=8080
```

### Créer la Base de Données MySQL

```sql
CREATE DATABASE IF NOT EXISTS port_tracking;
USE port_tracking;
```

### Données Initiales — Créer les Utilisateurs

```sql
USE port_tracking;

-- Les mots de passe sont hashés avec BCrypt (123456)
INSERT INTO users (nom, email, password, role, created_at) VALUES
('Admin User',       'admin@port.ma',       '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ADMIN',       NOW()),
('Importateur Test', 'importateur@port.ma', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'IMPORTATEUR', NOW()),
('Agent ADII',       'adii@port.ma',        '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ADII',        NOW()),
('Operateur Port',   'operateur@port.ma',   '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'OPERATEUR',   NOW()),
('Inspecteur Test',  'inspecteur@port.ma',  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'INSPECTEUR',  NOW());
```

---

## 👥 Rôles & Accès

| Rôle | Email | Password | Accès |
|---|---|---|---|
| **ADMIN** | admin@port.ma | 123456 | Tout |
| **IMPORTATEUR** | importateur@port.ma | 123456 | Créer fiches, documents |
| **ADII** | adii@port.ma | 123456 | Valider fiches, créer inspections |
| **OPERATEUR** | operateur@port.ma | 123456 | Assigner conteneurs |
| **INSPECTEUR** | inspecteur@port.ma | 123456 | Soumettre résultats inspection |

### Flux de Traitement d'une Fiche

```
IMPORTATEUR          ADII              OPERATEUR         INSPECTEUR
   │                  │                   │                  │
   │ Créer Fiche       │                   │                  │
   │ (EN_ATTENTE)      │                   │                  │
   │ ──────────────► │                   │                  │
   │                  │ Approuver/Rejeter │                  │
   │                  │ (APPROUVEE)        │                  │
   │                  │ ────────────────► │                  │
   │                  │                   │ Assigner          │
   │                  │                   │ Emplacement       │
   │                  │                   │ (PLACEE)          │
   │                  │ Créer Inspection  │                  │
   │                  │ ──────────────────────────────────► │
   │                  │                   │                  │ Soumettre
   │                  │                   │                  │ Résultat
   │                  │                   │                  │ (DEDOUANEE)
```

---

## 📁 Structure du Projet

```
port-tracking-frontend/
├── public/
├── src/
│   ├── api/                    # Appels API Axios
│   │   ├── axiosConfig.js      # Configuration Axios + JWT
│   │   ├── authAPI.js          # Login / Register
│   │   ├── ficheAPI.js         # CRUD Fiches
│   │   ├── conteneurAPI.js     # CRUD Conteneurs
│   │   ├── inspectionAPI.js    # CRUD Inspections
│   │   ├── documentAPI.js      # Upload / Download
│   │   ├── notificationAPI.js  # Notifications
│   │   └── userAPI.js          # Gestion utilisateurs
│   ├── components/             # Composants réutilisables
│   │   ├── Navbar.jsx          # Barre de navigation (badge notifications)
│   │   ├── Sidebar.jsx         # Menu latéral par rôle
│   │   └── PrivateRoute.jsx    # Protection des routes
│   ├── context/
│   │   └── AuthContext.jsx     # Contexte Auth + JWT
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── fiches/
│   │   │   ├── FicheList.jsx
│   │   │   ├── FicheDetail.jsx
│   │   │   └── CreateFiche.jsx
│   │   ├── conteneurs/
│   │   │   ├── ConteneurList.jsx
│   │   │   └── ConteneurDetail.jsx
│   │   ├── inspections/
│   │   │   └── InspectionList.jsx
│   │   ├── notifications/
│   │   │   └── NotificationList.jsx
│   │   ├── documents/
│   │   │   └── DocumentList.jsx
│   │   └── admin/
│   │       ├── UserManagement.jsx
│   │       └── Reports.jsx
│   ├── App.jsx                 # Routes principales
│   └── main.jsx
├── .env                        # ⚠️ Variables d'environnement
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 📜 Scripts Disponibles

```bash
# Démarrer en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint
```

---

## 🔧 Démarrage Complet (Ordre à Respecter)

```
1. Démarrer MySQL
2. Démarrer Spring Boot (port 8080)
3. Vérifier que .env contient VITE_API_BASE_URL=http://localhost:8080
4. npm run dev (port 5175)
5. Ouvrir http://localhost:5175
```

---

## 📝 Notes PFE

- Ce projet a été développé dans le cadre d'un **Projet de Fin d'Études (PFE)**
- Backend : **Spring Boot 3** + **Spring Security** + **JWT**
- Base de données : **MySQL 8**
- Frontend : **React 18** + **Vite** + **TailwindCSS**
