🚢 Port Tracking — Frontend
Système de suivi portuaire — Interface React + Vite + TailwindCSS

📋 Table des Matières
Aperçu
Changelog récent
Technologies Utilisées
Prérequis
Installation
Configuration
Connexion avec le Backend Spring Boot
Connexion avec MySQL
Rôles & Accès
Structure du Projet
Scripts Disponibles

📌 Aperçu
Port Tracking est une application web de gestion et de suivi des fiches suiveuses portuaires. Elle permet à différents acteurs (Importateur, ADII, Opérateur, Inspecteur, Admin) de suivre le cycle de vie des marchandises depuis leur arrivée jusqu'à leur dédouanement.

🆕 Changelog récent
- ✅ **Corrigé** : "Erreur lors de la soumission" sur la création de fiche — le frontend envoyait du `multipart/form-data` (avec fichiers) alors que le backend attend du JSON pur. La fiche est maintenant créée en JSON, puis les documents sont uploadés séparément via `/api/documents/upload`.
- ✅ **Corrigé** : export Excel/PDF cassé sur la page Rapports — le code accédait à `res.data` alors que `getAllFiches()` retourne déjà le tableau directement.
- ✅ **Ajouté** : validation du champ Contact (téléphone `+212XXXXXXXXX` ou email) à la création de fiche.
- ✅ **Supprimé** : le champ Téléphone redondant à l'inscription (`Login.jsx`) — il n'est demandé qu'une seule fois, dans la fiche.
- ✅ **Confirmé** : l'organisme ADII est verrouillé "Obligatoire" et ne peut pas être décoché à l'étape Organismes.
- ✅ **Ajouté** : agrandissement (lightbox) de la photo d'inspection au clic, avec fermeture par Échap ou clic extérieur.
- ✅ **Refondu** : page Conteneurs — la liste affiche maintenant tous les conteneurs par défaut (recherche + filtre par statut), au lieu d'exiger la sélection d'une fiche au préalable. La création reste possible via un panneau repliable.
- ✅ **Ajouté** : champ Quai visible dans la carte du port (tooltip + aperçu de section), absent auparavant.
- ✅ **Retiré** : le rôle "Importateur" de la liste déroulante de création d'utilisateur côté Admin (les comptes Importateur viennent de l'inscription publique).
- ✅ **Ajouté** : graphique "Objectifs de travail" (jour/semaine) sur les dashboards ADII, Opérateur et Inspecteur.
- ✅ **Ajouté** : sur le dashboard Admin, détection automatique du goulot d'étranglement dans le flux de travail, et affichage des fiches rejetées (auparavant invisibles dans le graphique).
- ✅ **Ajouté** : système d'alertes Admin — panneau "Envoyer une alerte" sur les pages Fiche et Conteneur, permettant de notifier un rôle (ADII/Opérateur/Inspecteur) à propos d'une fiche/conteneur précis.
- ⚠️ **Écart CDC connu** : le cahier des charges prévoit une application mobile Flutter pour les inspecteurs (scan QR + photo sur le terrain). Cette app n'est pas encore développée — l'inspection se fait actuellement uniquement via le web.

🛠 Technologies Utilisées
Technologie	Version	Rôle
React	18+	Framework UI
Vite	5+	Build tool
TailwindCSS	3+	Styling
Axios	1+	Appels API HTTP
React Router DOM	6+	Navigation
Lucide React	0.3+	Icônes

✅ Prérequis
Avant de commencer, assurez-vous d'avoir installé :

Node.js v18 ou supérieur → nodejs.org
npm v9 ou supérieur (inclus avec Node.js)
Spring Boot Backend démarré sur le port 8080
MySQL démarré avec la base de données port_tracking

🚀 Installation
1. Cloner le projet
   git clone https://github.com/votre-repo/port-tracking-frontend.git
   cd port-tracking-frontend
2. Installer les dépendances
   npm install
3. Créer le fichier d'environnement
   Créez un fichier .env à la racine du projet (même niveau que package.json) :

VITE_API_BASE_URL=http://localhost:8080
⚠️ Important : Sans ce fichier, toutes les requêtes API échoueront car Axios n'aura pas d'URL de base.

4. Démarrer l'application
   npm run dev
   L'application sera disponible sur : http://localhost:5173 (ou le port suivant disponible si celui-ci est occupé, ex: 5174/5175 — Vite le choisit automatiquement)

⚙️ Configuration
Fichier .env
# URL de base du backend Spring Boot
VITE_API_BASE_URL=http://localhost:8080
Variable	Description	Valeur par défaut
VITE_API_BASE_URL	URL du backend Spring Boot	http://localhost:8080
Si votre backend tourne sur un port différent, modifiez cette valeur en conséquence.

🔗 Connexion avec le Backend Spring Boot
Architecture de Communication
React (port 5173+)  ←→  Axios  ←→  Spring Boot (port 8080)  ←→  MySQL (port 3306)
Configuration Axios (src/api/axiosConfig.js)
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

Endpoints Backend Requis (mis à jour)
Méthode	Endpoint	Rôle
POST	/api/auth/login	Authentification
POST	/api/auth/register?role={role}	Création utilisateur (body = entité User, sans téléphone obligatoire)
GET	/api/fiches	Liste des fiches
POST	/api/fiches	Créer une fiche — **JSON pur uniquement**, jamais de FormData
PUT	/api/fiches/{id}/statut?acteurId={id}	Changer statut fiche (approuver/rejeter/placer/dédouaner/libérer)
PUT	/api/fiches/{id}/resoumission	Re-soumettre une fiche rejetée
GET	/api/fiches/{id}/historique	Historique fiche
POST	/api/documents/upload	Uploader un document (multipart : ficheId, type, file)
GET	/api/documents/{id}/download	Télécharger un document
GET	/api/documents/fiche/{ficheId}	Documents d'une fiche
GET	/api/conteneurs	Liste de tous les conteneurs (utilisé par défaut sur la page Conteneurs)
GET	/api/conteneurs/fiche/{ficheId}	Conteneurs d'une fiche
POST	/api/conteneurs	Créer un conteneur
PUT	/api/conteneurs/{id}/emplacement	Assigner emplacement — déclenche aussi la création automatique des inspections
GET	/api/conteneurs/{id}/dwell-time	Temps de séjour
GET	/api/inspections	Toutes les inspections
GET	/api/inspections/mes-taches?inspecteurId={id}	Inspections par inspecteur
POST	/api/inspections	Créer une inspection manuellement (rarement nécessaire, voir auto-assignation)
PUT	/api/inspections/{id}/resultat	Enregistrer résultat
POST	/api/inspections/{id}/photo	Uploader une photo d'inspection
GET	/api/notifications?userId={id}	Notifications de l'utilisateur connecté
GET	/api/notifications/unread?userId={id}	Notifications non lues
PUT	/api/notifications/{id}/lu	Marquer comme lu
PUT	/api/notifications/lu-tout?userId={id}	Tout marquer comme lu
POST	/api/notifications/admin-alert	**Admin uniquement** — envoyer une alerte ciblée à un rôle, liée à une fiche en option
GET	/api/qrcode/{conteneurId}	Générer QR Code
GET	/api/users	Liste des utilisateurs (Admin)

> ℹ️ La création d'inspection (`POST /api/inspections`) est désormais déclenchée **automatiquement** côté backend lorsqu'un Opérateur assigne un emplacement à un conteneur : une inspection est créée par organisme requis (hors ADII), assignée à l'inspecteur le moins chargé pour cet organisme. L'appel manuel reste disponible mais n'est presque plus utilisé.

Configuration CORS dans Spring Boot
Pour permettre les appels depuis le frontend, votre backend doit avoir cette configuration :

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

Authentification JWT
L'utilisateur se connecte via /api/auth/login
Le backend retourne un token JWT
Le token est stocké dans localStorage
Axios l'envoie automatiquement dans le header Authorization: Bearer <token>

🗄️ Connexion avec MySQL
Configuration Backend (application.properties)
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
Créer la Base de Données MySQL
CREATE DATABASE IF NOT EXISTS port_tracking;
USE port_tracking;
Données Initiales — Créer les Utilisateurs
USE port_tracking;

-- Les mots de passe sont hashés avec BCrypt (123456)
INSERT INTO users (nom, email, password, role, created_at) VALUES
('Admin User',       'admin@port.ma',       '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ADMIN',       NOW()),
('Importateur Test', 'importateur@port.ma', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'IMPORTATEUR', NOW()),
('Agent ADII',       'adii@port.ma',        '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ADII',        NOW()),
('Operateur Port',   'operateur@port.ma',   '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'OPERATEUR',   NOW()),
('Inspecteur Test',  'inspecteur@port.ma',  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'INSPECTEUR',  NOW());

⚠️ Pour les inspecteurs, pensez aussi à renseigner la colonne `organisme` (ex: ONSSA, AMSSNUR, LPEE) — l'assignation automatique des inspections se base sur ce champ. Un inspecteur sans organisme ne recevra jamais de tâche automatique.

👥 Rôles & Accès
Rôle	Email	Password	Dashboard	Accès
ADMIN	admin@port.ma	123456	Stats globales + flux de travail avec détection de goulot	Gérer utilisateurs, exporter rapports, envoyer des alertes ciblées
IMPORTATEUR	importateur@port.ma	123456	Statuts, timeline, conteneurs, dwell time	Créer/re-soumettre fiches, uploader documents
ADII	adii@port.ma	123456	Décisions à prendre + objectif jour/semaine	Approuver/rejeter fiches
OPERATEUR	operateur@port.ma	123456	File de placement, alertes dwell time, objectif, carte du port	Créer conteneurs, assigner emplacements (déclenche les inspections), planifier manutention, libérer marchandise
INSPECTEUR	inspecteur@port.ma	123456	Inspections assignées + objectif jour/semaine	Enregistrer résultats, uploader photos

Flux de Traitement d'une Fiche
IMPORTATEUR          ADII              OPERATEUR              INSPECTEUR
│                  │                   │                       │
│ Créer Fiche      │                   │                       │
│ (EN_ATTENTE)     │                   │                       │
│ ───────────────► │                   │                       │
│                  │ Approuver/Rejeter │                       │
│                  │ (APPROUVEE)       │                       │
│   ◄── si rejetée, re-soumission ──── │                       │
│                  │ ────────────────► │                       │
│                  │                   │ Assigner Emplacement  │
│                  │                   │ (PLACEE)              │
│                  │                   │ ─── auto-création ──► │ Inspections
│                  │                   │     des inspections   │ assignées
│                  │                   │     (par organisme)   │ automatiquement
│                  │                   │                       │ Soumettre
│                  │                   │                       │ Résultat
│                  │                   │ ◄── (DEDOUANEE) ───── │
│                  │                   │ Libérer Marchandise   │
│ ◄── (LIBEREE) ── │                   │                       │

📁 Structure du Projet
port-tracking-frontend/
├── public/
├── src/
│   ├── api/                    # Appels API Axios
│   │   ├── axiosConfig.js      # Configuration Axios + JWT
│   │   ├── authAPI.js          # Login / Register
│   │   ├── ficheAPI.js         # CRUD Fiches (createFiche envoie du JSON, plus de FormData)
│   │   ├── conteneurAPI.js     # CRUD Conteneurs
│   │   ├── inspectionAPI.js    # CRUD Inspections
│   │   ├── documentAPI.js      # Upload / Download
│   │   ├── notificationAPI.js  # Notifications + sendAdminAlert (nouveau)
│   │   └── userAPI.js          # Gestion utilisateurs
│   ├── components/             # Composants réutilisables
│   │   ├── Navbar.jsx          # Barre de navigation (badge notifications)
│   │   ├── Sidebar.jsx         # Menu latéral par rôle
│   │   └── PrivateRoute.jsx    # Protection des routes
│   ├── context/
│   │   └── AuthContext.jsx     # Contexte Auth + JWT
│   ├── pages/
│   │   ├── Login.jsx           # Login + inscription (sans champ téléphone)
│   │   ├── Dashboard.jsx       # Dashboard par rôle + graphiques d'objectifs
│   │   ├── fiches/
│   │   │   ├── FicheList.jsx
│   │   │   ├── FicheDetail.jsx     # Inclut le panneau d'alerte Admin
│   │   │   └── CreateFiche.jsx     # Stepper 3 étapes : Importateur / Marchandises / Organismes
│   │   ├── conteneurs/
│   │   │   ├── ConteneurList.jsx   # Liste tous les conteneurs par défaut + carte du port
│   │   │   └── ConteneurDetail.jsx # Inclut le panneau d'alerte Admin
│   │   ├── inspections/
│   │   │   ├── InspectionList.jsx
│   │   │   └── InspectionDetail.jsx # Photo agrandissable (lightbox)
│   │   ├── notifications/
│   │   │   └── NotificationList.jsx
│   │   └── admin/
│   │       ├── UserManagement.jsx  # Sans le rôle Importateur dans le formulaire
│   │       └── Reports.jsx         # Export Excel/PDF corrigé
│   ├── App.jsx                 # Routes principales
│   └── main.jsx
├── .env                        # ⚠️ Variables d'environnement
├── package.json
├── vite.config.js
└── tailwind.config.js

📜 Scripts Disponibles
# Démarrer en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint

🔧 Démarrage Complet (Ordre à Respecter)
1. Démarrer MySQL
2. Démarrer Spring Boot (port 8080)
3. Vérifier que .env contient VITE_API_BASE_URL=http://localhost:8080
4. npm run dev (port 5173, ou suivant disponible)
5. Ouvrir l'URL affichée dans le terminal

📝 Notes PFE
Ce projet a été développé dans le cadre d'un Projet de Fin d'Études (PFE)
Backend : Spring Boot 3 + Spring Security + JWT
Base de données : MySQL 8
Frontend : React 18 + Vite + TailwindCSS

⚠️ Écart connu avec le cahier des charges : l'application mobile Flutter pour les inspecteurs (scan QR, photos sur le terrain) n'est pas encore développée. L'inspection se fait actuellement entièrement via cette interface web.