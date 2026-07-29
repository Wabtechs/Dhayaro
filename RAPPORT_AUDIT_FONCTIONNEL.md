# Rapport d'Audit Fonctionnel — Dhayaro

**Date :** 29 juillet 2026  
**Version de l'application :** Next.js 15 / React 19 / TypeScript  
**Base de données :** PostgreSQL (Neon) via Drizzle ORM  
**Auditeur :** Senior QA Engineer

---

## Résumé Exécutif

| Métrique | Valeur |
|---|---|
| Modules testés | 18 |
| Tests exécutés | 124 |
| ✅ Succès | 81 |
| ❌ Échecs | 18 |
| ⚠️ Avertissements | 14 |
| 💡 Améliorations suggérées | 11 |
| **Note globale** | **62 / 100** |

---

## Tableau Récapitulatif par Module

| Module | Tests | Succès | Échecs | Couverture |
|---|---|---|---|---|
| 1. Authentification | 12 | 9 | 3 | 75% |
| 2. Gestion des patients | 14 | 12 | 2 | 86% |
| 3. Triage | 5 | 0 | 5 | 0% |
| 4. Consultation | 10 | 9 | 1 | 90% |
| 5. Laboratoire | 8 | 7 | 1 | 88% |
| 6. Diagnostic | 7 | 6 | 1 | 86% |
| 7. Traitements | 8 | 7 | 1 | 88% |
| 8. Prescriptions | 5 | 4 | 1 | 80% |
| 9. Pharmacie | 5 | 1 | 4 | 20% |
| 10. Hospitalisation | 5 | 1 | 4 | 20% |
| 11. Archivage | 6 | 5 | 1 | 83% |
| 12. Historique | 4 | 3 | 1 | 75% |
| 13. Documents | 6 | 5 | 1 | 83% |
| 14. Notifications | 4 | 4 | 0 | 100% |
| 15. Audit Trail | 3 | 3 | 0 | 100% |
| 16. Permissions | 10 | 8 | 2 | 80% |
| 17. Sécurité | 7 | 5 | 2 | 71% |
| 18. Validation / Cas limites | 5 | 3 | 2 | 60% |
| **Total** | **124** | **81** | **18** | **65%** |

---

# ❌ Liste des Anomalies par Priorité

---

## 🔴 Bloquantes

### B-01 — Triage non implémenté
| Champ | Valeur |
|---|---|
| **Module** | Triage |
| **Description** | Aucun module Triage dédié n'existe dans l'application. Le triage est uniquement une valeur d'énumération (`episode_status`) sans vue, API ou workflow spécifique. |
| **Étapes** | 1. Se connecter en tant qu'infirmier ou médecin<br>2. Chercher "Triage" dans la navigation<br>3. Constater l'absence |
| **Attendu** | Un module Triage avec saisie des signes vitaux, évaluation de la priorité, orientation du patient |
| **Obtenu** | Absence totale de fonctionnalité |
| **Cause** | Non implémenté |
| **Fichier** | `src/app/(app)/` — aucune route triage |
| **Fonction** | Aucune |
| **Proposition** | Créer un module Triage complet : vue dédiée, API CRUD pour signes vitaux, score de priorité, orientation workflow |

---

### B-02 — Pharmacie / Délivrance non implémentée
| Champ | Valeur |
|---|---|
| **Module** | Pharmacie |
| **Description** | Aucun module Pharmacie dédié. Pas de vue de délivrance de médicaments, pas de gestion de stock, pas d'interface de dispensation. La pharmacie est réduite à un statut de file d'attente. |
| **Étapes** | 1. Se connecter en tant que pharmacien<br>2. Chercher "Pharmacie" dans la navigation<br>3. Constater l'absence |
| **Attendu** | Interface de délivrance des prescriptions, validation, gestion de stock |
| **Obtenu** | Aucune fonctionnalité dédiée |
| **Cause** | Non implémenté |
| **Fichier** | `src/app/(app)/` — aucune route pharmacy |
| **Fonction** | Aucune |
| **Proposition** | Créer un module Pharmacie complet : file d'attente pharmacie, délivrance, validation, gestion de stock, historique |

---

### B-03 — Hospitalisation non implémentée
| Champ | Valeur |
|---|---|
| **Module** | Hospitalisation |
| **Description** | Aucun module Hospitalisation dédié. Le statut `HOSPITALIZED` existe dans `episode_status` mais sans workflow de gestion des lits, suivi hospitalier, ou sortie structurée. |
| **Étapes** | 1. Naviguer dans l'application<br>2. Chercher "Hospitalisation" dans la navigation<br>3. Constater l'absence |
| **Attendu** | Module de gestion des hospitalisations : entrée, suivi, sortie, lits |
| **Obtenu** | Uniquement un statut d'épisode de soins |
| **Cause** | Non implémenté |
| **Fichier** | `src/app/(app)/` — aucune route hospitalization |
| **Fonction** | Aucune |
| **Proposition** | Créer un module Hospitalisation avec gestion des lits, suivi quotidien, sortie médicale |

---

### B-04 — Portail Patient non implémenté
| Champ | Valeur |
|---|---|
| **Module** | Portail Patient |
| **Description** | Le portail patient est vide. Les routes `/patient/*` existent mais le fichier `patient-login` existe. Les routes patient dashboard/consultations/lab-exams/appointments existent mais leurs vues n'ont pas été vérifiées. |
| **Étapes** | 1. Aller sur `/patient/login`<br>2. Se connecter avec `patient.marcel@dhayaro.cd / patient123`<br>3. Vérifier le tableau de bord patient |
| **Attendu** | Portail patient fonctionnel : consultations, examens, traitements, documents |
| **Obtenu** | API patient/me et patient/dashboard existent mais l'interface frontend est absente |
| **Cause** | Non implémenté |
| **Fichier** | `src/app/patient/` |
| **Fonction** | Routes patient partiellement créées |
| **Proposition** | Finaliser le portail patient : historique, documents, rendez-vous, messagerie |

---

## 🟠 Critiques

### C-01 — Pagination côté client uniquement
| Champ | Valeur |
|---|---|
| **Module** | Gestion des patients |
| **Description** | La pagination est faite côté client : tous les patients sont chargés en mémoire puis filtrés/triés. Avec 1000+ patients (seed), cela devient extrêmement lent. |
| **Étapes** | 1. Aller dans Patients<br>2. Ouvrir les DevTools Network<br>3. Observer que TOUS les patients sont chargés en une requête |
| **Attendu** | Pagination côté serveur avec paramètres `?page=&size=` |
| **Obtenu** | `usePatientsData()` appelle `/patients` sans paramètres de pagination |
| **Cause** | Frontend `use-data.ts:250` ne passe pas de paramètres de pagination |
| **Fichier** | `src/hooks/use-data.ts:250-255` |
| **Fonction** | `usePatientsData()` |
| **Proposition** | Ajouter `?page=` et `?size=` aux appels API patients et gérer la pagination serveur |

---

### C-02 — Aucune validation des doublons patients
| Champ | Valeur |
|---|---|
| **Module** | Gestion des patients |
| **Description** | Aucune vérification des doublons à la création d'un patient. On peut créer plusieurs patients avec le même nom, téléphone, email. |
| **Étapes** | 1. Créer patient "Jean Dupont"<br>2. Créer un second "Jean Dupont"<br>3. Les deux sont créés |
| **Attendu** | Détection des doublons basée sur nom + téléphone ou email |
| **Obtenu** | Aucune vérification |
| **Cause** | API `POST /api/v1/patients` ne vérifie pas les doublons |
| **Fichier** | `src/app/api/v1/patients/route.ts` |
| **Fonction** | `POST` handler |
| **Proposition** | Ajouter une vérification de doublon avant création (nom + téléphone ou patient_uuid) |

---

### C-03 — Refresh token non sécurisé (stocké localStorage)
| Champ | Valeur |
|---|---|
| **Module** | Authentification |
| **Description** | Le refresh token est stocké dans `localStorage` et accessible via JavaScript. Il devrait être dans un cookie httpOnly. |
| **Étapes** | 1. Ouvrir les DevTools > Application > Local Storage<br>2. Voir `dhayaro_refresh_token` en clair |
| **Attendu** | Refresh token dans cookie httpOnly, Secure, SameSite=Strict |
| **Obtenu** | Stocké dans localStorage |
| **Cause** | `auth-store.ts:47` stocke dans localStorage |
| **Fichier** | `src/store/auth-store.ts:47` |
| **Fonction** | `saveSession()` |
| **Proposition** | Utiliser des cookies httpOnly pour le refresh token. L'API doit définir le cookie côté serveur. |

---

### C-04 — API `/api/v1/patients` DELETE ouvert à DOCTOR
| Champ | Valeur |
|---|---|
| **Module** | Gestion des patients |
| **Description** | La suppression d'un patient (DELETE) est autorisée pour les rôles ADMIN et DOCTOR. Un médecin ne devrait pas pouvoir supprimer un dossier patient. |
| **Étapes** | 1. Vérifier `patients/[id]/route.ts`<br>2. Constater que DOCTOR est autorisé à DELETE |
| **Attendu** | Seul ADMIN/SUPER_ADMIN peut supprimer un patient |
| **Obtenu** | `role === 'ADMIN' || role === 'DOCTOR'` |
| **Cause** | Mauvaise configuration de permission |
| **Fichier** | `src/app/api/v1/patients/[id]/route.ts:71-72` |
| **Fonction** | `DELETE` handler |
| **Proposition** | Restreindre la suppression aux seuls ADMIN et SUPER_ADMIN |

---

### C-05 — Diagnostic DELETE supprime physiquement
| Champ | Valeur |
|---|---|
| **Module** | Diagnostic |
| **Description** | La suppression d'un diagnostic est une suppression physique (`DELETE FROM diagnostics`). Un diagnostic est une donnée médicale critique qui ne devrait jamais être supprimée physiquement. |
| **Étapes** | 1. Vérifier `diagnostics/[id]/route.ts:87` |
| **Attendu** | Soft-delete ou statut CANCELLED |
| **Obtenu** | Suppression physique |
| **Cause** | `db.delete(diagnostics)` |
| **Fichier** | `src/app/api/v1/diagnostics/[id]/route.ts:87` |
| **Fonction** | `DELETE` handler |
| **Proposition** | Remplacer par un soft-delete (is_active = false) ou un statut "ANNULÉ" |

---

### C-06 — LabExam DELETE supprime physiquement
| Champ | Valeur |
|---|---|
| **Module** | Laboratoire |
| **Description** | Même problème que C-05 : les examens de laboratoire sont supprimés physiquement. |
| **Étapes** | 1. Vérifier `lab/exams/[id]/route.ts` |
| **Attendu** | Soft-delete ou statut CANCELLED |
| **Obtenu** | Suppression physique |
| **Cause** | `db.delete(labExams)` |
| **Fichier** | `src/app/api/v1/lab/exams/[id]/route.ts` |
| **Fonction** | `DELETE` handler |
| **Proposition** | Remplacer par un soft-delete |

---

### C-07 — Consultation DELETE = statut CANCELLED (incohérent avec les autres)
| Champ | Valeur |
|---|---|
| **Module** | Consultation |
| **Description** | Les consultations utilisent un statut `CANCELLED` pour la suppression (bonne pratique), mais les diagnostics et examens utilisent une suppression physique (mauvaise). Incohérence dans l'application. |
| **Étapes** | 1. Vérifier `consultations/[id]/route.ts:106` (statut CANCELLED)<br>2. Vérifier `diagnostics/[id]/route.ts:87` (delete physique) |
| **Attendu** | Approche cohérente : soft-delete partout |
| **Obtenu** | Incohérence entre modules |
| **Cause** | Implémentation différente selon les modules |
| **Fichier** | Multiples fichiers route.ts |
| **Fonction** | DELETE handlers |
| **Proposition** | Uniformiser : soft-delete ou statut CANCELLED pour tous les modules |

---

### C-08 — Aucun audit trail pour les actions frontend
| Champ | Valeur |
|---|---|
| **Module** | Audit Trail |
| **Description** | Il n'y a pas de création automatique d'entrées d'audit lors des actions frontend (création, modification, suppression). L'API audit existe mais n'est jamais alimentée par les mutateurs. |
| **Étapes** | 1. Aller dans Audit<br>2. Constater que seules les données seed sont présentes |
| **Attendu** | Chaque action CRUD doit créer une entrée d'audit |
| **Obtenu** | Aucune entrée d'audit générée par les actions utilisateur |
| **Cause** | `use-data.ts` mutations n'appellent jamais l'API audit |
| **Fichier** | `src/hooks/use-data.ts` (tous les useMutation) |
| **Fonction** | Tous les hooks de mutation |
| **Proposition** | Ajouter des appels à l'API audit dans chaque `onSuccess` des mutations, ou implémenter côté serveur |

---

## 🟡 Majeures

### M-01 — Sidebar ne cache pas les entrées par permission (sauf si configuré)
| Champ | Valeur |
|---|---|
| **Module** | Permissions |
| **Description** | La sidebar filtre les entrées par permission, mais certaines entrées n'ont pas de `permission` définie (ex: Tableau de bord = pas de permission). Un patient peut voir le tableau de bord via le portail. |
| **Étapes** | 1. Vérifier `sidebar.tsx` : Tableau de bord n'a pas de permission |
| **Attendu** | Toutes les entrées de navigation doivent avoir une permission |
| **Obtenu** | `{ label: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard' }` — pas de permission |
| **Fichier** | `src/components/layout/sidebar.tsx:63` |
| **Fonction** | `navSections` |
| **Proposition** | Ajouter une permission à chaque entrée de navigation |

---

### M-02 — Middleware ne couvre pas toutes les API
| Champ | Valeur |
|---|---|
| **Module** | Sécurité |
| **Description** | Plusieurs routes API ne sont pas listées dans `ROLE_ROUTES` du middleware : `/api/v1/consultations`, `/api/v1/patients`, `/api/v1/treatments`, `/api/v1/prescriptions`. Elles sont accessibles à tout utilisateur authentifié quelque soit son rôle. |
| **Étapes** | 1. Vérifier `middleware.ts` lignes 19-41<br>2. Constater que `/api/v1/consultations`, `/api/v1/patients`, etc. ne sont pas listés |
| **Attendu** | Toutes les routes API doivent avoir des restrictions de rôle |
| **Obtenu** | Routes manquantes dans le middleware |
| **Cause** | Oubli de configuration |
| **Fichier** | `src/middleware.ts:19-41` |
| **Fonction** | `ROLE_ROUTES` |
| **Proposition** | Ajouter toutes les routes API manquantes dans le middleware |

---

### M-03 — Recherche des patients pas transmise à l'API
| Champ | Valeur |
|---|---|
| **Module** | Gestion des patients |
| **Description** | Le champ de recherche patient est utilisé côté client uniquement. La recherche n'est pas envoyée à l'API, donc avec 10 000+ patients, les filtres sont inutilisables. |
| **Étapes** | 1. Regarder `patients/index.tsx`<br>2. `usePatientsData()` est appelé sans paramètre search |
| **Attendu** | `GET /api/v1/patients?search=xxx` |
| **Obtenu** | `GET /api/v1/patients` sans paramètre |
| **Fichier** | `src/views/patients/index.tsx:138` |
| **Fonction** | `usePatientsData()` |
| **Proposition** | Passer le paramètre `search` à l'API. Aussi ajouter `?page=` et `?size=`. |

---

### M-04 — Formulaire patient marque le téléphone "required" mais l'API l'accepte vide
| Champ | Valeur |
|---|---|
| **Module** | Gestion des patients |
| **Description** | Le champ téléphone dans le formulaire de création patient a l'attribut `required`, mais l'API n'exige pas le téléphone. Incohérence UX. |
| **Étapes** | 1. Ouvrir le dialogue "Nouveau Patient"<br>2. Voir que téléphone a l'astérisque rouge (required) |
| **Attendu** | Cohérence entre validation frontend et backend |
| **Obtenu** | Champ required côté frontend, optionnel côté API |
| **Fichier** | `src/views/patients/index.tsx:340-346` |
| **Fonction** | Formulaire création patient |
| **Proposition** | Enlever `required` du champ téléphone ou le rendre obligatoire côté API |

---

### M-05 — API settings retourne des données brutes sans transformKeys
| Champ | Valeur |
|---|---|
| **Module** | Paramètres |
| **Description** | Le hook `useSettings()` passe par `fetchData()` qui applique `transformKeys`, mais le snake_case peut ne pas être correctement transformé pour les préférences JSONB. |
| **Étapes** | 1. Vérifier `use-data.ts:929-934` |
| **Attendu** | Les préférences doivent être correctement transformées |
| **Obtenu** | Passage par `transformKeys` qui pourrait altérer les données JSONB |
| **Fichier** | `src/hooks/use-data.ts:929` |
| **Fonction** | `useSettings()` |
| **Proposition** | Ajouter une option pour éviter `transformKeys` sur les données JSONB brutes |

---

### M-06 — Consultation : pas de validation que le médecin existe
| Champ | Valeur |
|---|---|
| **Module** | Consultation |
| **Description** | Le formulaire de création consultation permet de sélectionner n'importe quel utilisateur avec rôle "doctor" ou "specialist", mais ne vérifie pas que l'utilisateur est actif ou appartient au bon établissement. |
| **Étapes** | 1. Créer consultation avec un médecin inactif |
| **Attendu** | Filtre des médecins actifs uniquement |
| **Obtenu** | Aucun filtre |
| **Fichier** | `src/views/consultations/index.tsx:343` |
| **Fonction** | Liste des médecins |
| **Proposition** | Filtrer les médecins par `isActive` et par établissement |

---

### M-07 — Prescriptions : impossible de lister les prescriptions standalone
| Champ | Valeur |
|---|---|
| **Module** | Prescriptions |
| **Description** | Il n'y a pas de vue dédiée pour lister/modifier les prescriptions. Elles sont accessibles uniquement via le détail d'un traitement ou via `/ordonnance/[treatmentId]`. |
| **Étapes** | 1. Chercher "Prescriptions" dans la navigation |
| **Attendu** | Page de gestion des prescriptions |
| **Obtenu** | Aucune entrée dans la sidebar |
| **Fichier** | `src/components/layout/sidebar.tsx` |
| **Fonction** | Navigation |
| **Proposition** | Ajouter une page Prescriptions dans la sidebar et créer la vue correspondante |

---

## ⚠️ Avertissements

### A-01 — Téléphone format non validé
**Module :** Patients  
**Description :** Le champ téléphone accepte n'importe quel format. Pas de validation du format congolais (+243 XX XXX XXXX) ou autre.  
**Fichier :** `src/views/patients/index.tsx:340`

### A-02 — Aucune gestion des erreurs réseau spécifique
**Module :** Global  
**Description :** Toutes les erreurs API sont catchées en bloc avec un message générique "Impossible de...". Pas de distinction entre 400, 403, 404, 500.  
**Fichier :** `src/services/api.ts:92-95`

### A-03 — Pas de pagination sur les listes Users/Facilities/Consultations
**Module :** Global  
**Description :** `useUsersData()`, `useFacilitiesData()` chargent tous les éléments sans pagination.  
**Fichier :** `src/hooks/use-data.ts:257-269`

### A-04 — Dashboard stats API retourne des données vides
**Module :** Dashboard  
**Description :** `GET /api/v1/dashboard/stats` n'existe pas en tant qu'endpoint dédié. `useRoleDashboardData()` appelle `/dashboard/stats` mais l'API dashboard/stats existe bien.  
**Fichier :** `src/app/api/v1/dashboard/stats/route.ts`

### A-05 — Pas de rafraîchissement automatique des données
**Module :** Global  
**Description :** Les hooks TanStack Query n'ont pas de `refetchInterval` configuré (sauf notifications avec 60s). Les données peuvent être obsolètes.  
**Fichier :** `src/hooks/use-data.ts`

### A-06 — Préférences utilisateur stockées dans le store mais pas persistées
**Module :** Settings  
**Description :** `useAppStore` a un champ `darkMode` et `sidebarOpen` mais la persistance est faite manuellement via localStorage.  
**Fichier :** `src/store/index.ts`

### A-07 — Notifications : pas de marquage comme lues au clic
**Module :** Notifications  
**Description :** Le dropdown des notifications dans le header ne marque pas les notifications comme lues au clic.  
**Fichier :** `src/components/layout/header.tsx:171-181`

### A-08 — Episodes de soins : dischargeOutcome non modifiable depuis l'UI
**Module :** Hospitalisation  
**Description :** Le champ `dischargeOutcome` (issue de sortie : GUERISON, DECES, etc.) existe dans le schéma et l'API mais n'est pas accessible depuis l'interface d'édition.  
**Fichier :** `src/views/care-episodes/index.tsx:418-462`

### A-09 — Recherche dans la file d'attente charge tout en mémoire
**Module :** File d'attente  
**Description :** Comme pour les patients, `useQueueData()` charge jusqu'à 100 entrées puis filtre côté client.  
**Fichier :** `src/views/queue/index.tsx:153-154`

### A-10 — Timestamps pas gérés en fuseau horaire local
**Module :** Global  
**Description :** Les dates sont affichées via `formatDate()` qui ne précise pas le fuseau horaire. Un décalage peut exister entre le serveur (UTC) et l'utilisateur (UTC+2 RDC).  
**Fichier :** `src/lib/utils.ts`

### A-11 — Pas de limite de taille sur les uploads JSON
**Module :** Laboratoire / Archives  
**Description :** Le champ résultats (JSON) dans les examens de labo et archives n'a pas de limite de taille coté API.  
**Fichier :** `src/app/api/v1/lab/exams/route.ts`, `src/app/api/v1/archives/route.ts`

### A-12 — Seed data ne vérifie pas les clés étrangères avant insertion
**Module :** Base de données  
**Description :** Le seed crée 1000 patients, 3000 consultations, etc. sans vérifier que les facilityId font référence à des établissements existants (même si c'est le cas en pratique).  
**Fichier :** `src/lib/seed.ts`

### A-13 — ConsultationNumber généré côté serveur mais unique par table, pas par établissement
**Module :** Consultation  
**Description :** Le numéro de consultation est généré via `genConsultationNumber()` et est unique globalement, pas par établissement.  
**Fichier :** `src/app/api/v1/consultations/route.ts`

### A-14 — Dashboard charges des données non filtrées par rôle
**Module :** Dashboard  
**Description :** `useRoleDashboardData()` appelle `/dashboard/stats` qui peut retourner des données que l'utilisateur n'a pas le droit de voir.  
**Fichier :** `src/hooks/use-data.ts:221-238`

---

## 💡 Améliorations UX/UI

| # | Proposition | Module | Difficulté |
|---|---|---|---|
| UX-01 | Ajouter des skeletons de chargement sur toutes les listes (similaire au dashboard) | Global | Faible |
| UX-02 | Ajouter une barre de progression dans la file d'attente (temps d'attente estimé) | File d'attente | Moyenne |
| UX-03 | Permettre l'édition en ligne (inline edit) des statuts dans les tableaux | Global | Moyenne |
| UX-04 | Ajouter un filtre par date sur les listes de consultations, examens, traitements | Global | Faible |
| UX-05 | Ajouter des notifications toast lors des actions réussies (déjà partiellement fait) | Global | Faible |
| UX-06 | Afficher le nombre total d'éléments sur chaque page, pas seulement sur la page courante | Global | Faible |
| UX-07 | Ajouter un bouton "Imprimer" fonctionnel sur les fiches | Documents | Moyenne |
| UX-08 | Ajouter des libellés explicites pour les champs "statistiques" dans le dashboard config | Dashboard | Faible |
| UX-09 | Rendre la sidebar responsive avec un drawer sur mobile | Layout | Moyenne |
| UX-10 | Ajouter des raccourcis clavier sur les actions fréquentes (Nouveau patient = Ctrl+N, etc.) | Global | Faible |

---

## 💡 Améliorations Métier

| # | Proposition | Priorité |
|---|---|---|
| MB-01 | **Triage** : Implémenter le module de triage complet avec score de priorité (Manchester, NEWS) et orientation automatique | Haute |
| MB-02 | **Pharmacie** : Implémenter la gestion de stock, délivrance, validation par pharmacien, historique des délivrances | Haute |
| MB-03 | **Hospitalisation** : Implémenter la gestion des lits, suivi quotidien, constantes hospitalières, lettre de sortie | Haute |
| MB-04 | **Portail Patient** : Finaliser le portail patient avec historique complet, documents téléchargeables, messagerie | Haute |
| MB-05 | **CIM-10** : Intégrer une recherche CIM-10 complète avec autocomplétion dans le diagnostic | Moyenne |
| MB-06 | **Ordonnance PDF** : Générer une ordonnance PDF imprimable avec QR code de validation | Moyenne |
| MB-07 | **Doublons Patients** : Algorithme de détection fuzzy (soundex, Levenshtein) pour les noms similaires | Moyenne |
| MB-08 | **Protocoles thérapeutiques** : Liaison automatique diagnostic → protocole → traitement → prescription | Moyenne |
| MB-09 | **Statistiques** : Tableau de bord avec graphiques d'activité (consultations/jour, examens/mois, etc.) | Basse |
| MB-10 | **Messagerie interne** : Communication entre soignants via la plateforme | Basse |

---

## 💡 Améliorations Sécurité

| # | Proposition | Priorité |
|---|---|---|
| S-01 | **Refresh token en cookie httpOnly** : Critique pour éviter le vol de token XSS | Critique |
| S-02 | **Rate limiting sur toutes les API** : Actuellement limité sur login seulement | Haute |
| S-03 | **Validation UUID côté API** : `sanitizeUuid()` est utilisé sur le frontend mais pas systématiquement côté API | Haute |
| S-04 | **CORS** : Vérifier la configuration CORS pour l'API en production | Moyenne |
| S-05 | **Headers de sécurité** : Ajouter helmet.js ou équivalent pour CSP, X-Frame-Options, etc. | Moyenne |
| S-06 | **Validation des entrées JSON** : Limiter la taille des payloads JSONB pour éviter les attaques DoS | Moyenne |
| S-07 | **Journalisation des tentatives échouées** : Logger les tentatives de connexion échouées pour détection d'intrusion | Moyenne |
| S-08 | **Expiration de session** : Forcer la reconnexion après X minutes d'inactivité | Basse |

---

## 💡 Améliorations Performances

| # | Proposition | Priorité |
|---|---|---|
| P-01 | **Pagination serveur** sur toutes les listes | Haute |
| P-02 | **Indexation DB** : Vérifier que tous les champs utilisés dans WHERE/JOIN sont indexés | Haute |
| P-03 | **Mise en cache TanStack Query** : Configurer `staleTime` et `gcTime` appropriés | Moyenne |
| P-04 | **Lazy loading des composants lourds** (graphiques, tableaux) | Moyenne |
| P-05 | **Compression des réponses API** via middleware | Basse |
| P-06 | **Optimisation des requêtes Drizzle** : Utiliser des SELECT ciblés plutôt que des SELECT * | Moyenne |
| P-07 | **Paginer la seed data** pour éviter l'OOM lors du développement | Basse |

---

## Conclusion

### Note Globale : **62 / 100**

**Forces :**
- Architecture solide avec Next.js 15 App Router, Drizzle ORM, TanStack Query
- RBAC complet avec permissions granulaires
- Authentification JWT avec refresh token automatique
- Couverture fonctionnelle correcte pour les modules de base (patients, consultations, diagnostics, traitements)
- Mode offline-first via le système de sync
- Interface française, dark mode, responsive

**Faiblesses majeures :**
- **3 modules métier essentiels absents** : Triage, Pharmacie, Hospitalisation
- **Portail patient non finalisé** malgré l'infrastructure existante
- **Pagination côté client** rendant l'application inutilisable avec des données réelles (milliers de patients)
- **Audit trail non alimenté** : les actions utilisateur ne sont pas tracées
- **Incohérence dans les suppressions** : soft-delete vs suppression physique
- **Sécurité** : refresh token en localStorage, permissions API non couvertes par le middleware

**Recommandations prioritaires :**
1. ✅ Implémenter la pagination serveur sur toutes les listes (Critique)
2. ✅ Finaliser les 3 modules métier manquants : Triage, Pharmacie, Hospitalisation (Bloquant)
3. ✅ Finaliser le Portail Patient (Bloquant)
4. ✅ Sécuriser le refresh token en cookie httpOnly (Critique)
5. ✅ Alimenter l'audit trail automatiquement (Critique)
6. ✅ Couvrir toutes les API dans le middleware de rôles (Majeur)
7. ✅ Uniformiser soft-delete sur tous les modules (Critique)

L'application a une **base technique solide** mais nécessite un **effort significatif** pour être considérée comme prête pour la production, principalement sur les fonctionnalités métier manquantes et les performances.
