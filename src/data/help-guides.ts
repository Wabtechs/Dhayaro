export interface HelpStep {
  title: string
  description: string
  image?: string
}

export interface HelpSection {
  title: string
  icon: string
  steps: HelpStep[]
}

export interface HelpGuide {
  role: string
  title: string
  description: string
  sections: HelpSection[]
}

export const HELP_GUIDES: HelpGuide[] = [
  {
    role: 'receptionist',
    title: 'Guide du Réceptionniste',
    description: 'Apprenez à gérer l\'accueil des patients, la file d\'attente et les tâches administratives courantes.',
    sections: [
      {
        title: 'Tableau de bord',
        icon: 'LayoutDashboard',
        steps: [
          {
            title: 'Vue d\'ensemble',
            description: 'Le tableau de bord affiche un résumé des activités du jour : nombre de patients en attente, consultations en cours, et notifications récentes.',
          },
          {
            title: 'Indicateurs clés',
            description: 'Consultez les statistiques du jour : nouveaux patients, retours, temps d\'attente moyen et répartition par service.',
          },
        ],
      },
      {
        title: 'File d\'attente',
        icon: 'ListOrdered',
        steps: [
          {
            title: 'Ajouter un patient à la file',
            description: 'Cliquez sur "Ajouter" dans la page File d\'attente. Sélectionnez le patient, choisissez la priorité (Normal, Urgent) et le médecin traitant si connu.',
          },
          {
            title: 'Attribuer un médecin',
            description: 'Depuis la file d\'attente, cliquez sur le bouton "Assigner" d\'un patient. Sélectionnez le médecin disponible dans la liste déroulante.',
          },
          {
            title: 'Modifier la priorité',
            description: 'Pour un patient dont l\'état s\'aggrave, utilisez le bouton "Priorité" pour passer en mode Urgent. Cela le déplacera en tête de file.',
          },
          {
            title: 'Rechercher dans la file',
            description: 'Utilisez la barre de recherche pour filtrer par nom de patient ou numéro de ticket.',
          },
        ],
      },
      {
        title: 'Gestion des patients',
        icon: 'UserRound',
        steps: [
          {
            title: 'Enregistrer un nouveau patient',
            description: 'Cliquez sur "Patients" puis "Nouveau patient". Remplissez les informations obligatoires : nom, prénom, date de naissance, sexe et téléphone. Les autres champs peuvent être complétés plus tard.',
          },
          {
            title: 'Rechercher un patient existant',
            description: 'Utilisez la barre de recherche en haut de la liste des patients. Vous pouvez chercher par nom, numéro de dossier ou téléphone.',
          },
          {
            title: 'Modifier les informations',
            description: 'Cliquez sur le nom d\'un patient pour ouvrir sa fiche. Utilisez le bouton "Modifier" pour mettre à jour ses coordonnées ou ses informations médicales de base.',
          },
          {
            title: 'Archiver un patient',
            description: 'Pour les patients inactifs, utilisez le menu "Actions" puis "Archiver". Le patient sera conservé dans la base mais masqué des recherches courantes.',
          },
        ],
      },
      {
        title: 'Consultations',
        icon: 'Stethoscope',
        steps: [
          {
            title: 'Créer une consultation',
            description: 'Depuis la fiche patient ou le menu Consultations, cliquez sur "Nouvelle consultation". Renseignez le motif, les symptômes et assignez un médecin.',
          },
          {
            title: 'Suivre l\'état',
            description: 'La liste des consultations montre le statut : En attente, En cours, Terminée ou Annulée. Vous pouvez filtrer par statut.',
          },
        ],
      },
      {
        title: 'Documents',
        icon: 'FileText',
        steps: [
          {
            title: 'Générer un document',
            description: 'Dans la page Documents, cliquez sur "Nouveau document". Choisissez le type (Certificat, Rapport, Référence), le patient et le médecin.',
          },
          {
            title: 'Imprimer un document',
            description: 'Une fois le document créé, utilisez le bouton "Imprimer" pour l\'envoyer à l\'imprimante. Un historique des impressions est conservé.',
          },
        ],
      },
      {
        title: 'Épisodes de soins',
        icon: 'ClipboardList',
        steps: [
          {
            title: 'Créer un épisode',
            description: 'Un épisode de soins est automatiquement créé lors de l\'enregistrement d\'une consultation. Vous pouvez aussi en créer manuellement depuis la page Épisodes de soins.',
          },
          {
            title: 'Consulter l\'historique',
            description: 'La page Épisodes de soins regroupe toutes les consultations, diagnostics et traitements d\'un patient de façon chronologique.',
          },
        ],
      },
      {
        title: 'Notifications',
        icon: 'Bell',
        steps: [
          {
            title: 'Consulter ses notifications',
            description: 'Cliquez sur la cloche dans l\'en-tête ou allez dans la page Notifications pour voir les alertes : nouveaux patients, changements de statut, etc.',
          },
          {
            title: 'Marquer comme lu',
            description: 'Cliquez sur une notification pour la marquer comme lue. Utilisez "Tout marquer comme lu" pour vider le compteur.',
          },
        ],
      },
    ],
  },
  {
    role: 'doctor',
    title: 'Guide du Médecin Généraliste',
    description: 'Prescriptions, diagnostics, suivi des patients et outils d\'aide à la décision clinique.',
    sections: [
      {
        title: 'Tableau de bord',
        icon: 'LayoutDashboard',
        steps: [
          {
            title: 'Vue d\'ensemble',
            description: 'Le tableau de bord affiche vos consultations du jour, les diagnostics récents, les examens de laboratoire en attente et les patients sous traitement.',
          },
          {
            title: 'Indicateurs clés',
            description: 'Consultez le nombre de consultations aujourd\'hui, les patients en attente de diagnostic, les examens de laboratoire demandés et la répartition par statut.',
          },
          {
            title: 'Actions rapides',
            description: 'Utilisez la section Actions rapides pour accéder directement à Nouvelle consultation, Nouveau patient, Nouveau diagnostic ou Nouvelle prescription.',
          },
        ],
      },
      {
        title: 'File d\'attente & Triage',
        icon: 'ListOrdered',
        steps: [
          {
            title: 'Consulter la file d\'attente',
            description: 'La page File d\'attente montre les patients en attente de consultation. Filtrez par priorité pour voir les urgences en premier.',
          },
          {
            title: 'Effectuer un triage',
            description: 'Depuis la page Triage, prenez les constantes vitales (tension, pouls, température, SpO2), assignez une priorité et un médecin traitant.',
          },
        ],
      },
      {
        title: 'Patients',
        icon: 'UserRound',
        steps: [
          {
            title: 'Rechercher un patient',
            description: 'Utilisez la barre de recherche pour trouver un patient par nom, numéro de dossier ou téléphone. La liste affiche les informations de base et le statut.',
          },
          {
            title: 'Ouvrir la fiche patient',
            description: 'Cliquez sur un patient pour voir sa fiche complète : données démographiques, antécédents, consultations passées, traitements en cours.',
          },
          {
            title: 'Modifier les informations',
            description: 'Depuis la fiche patient, cliquez sur "Modifier" pour mettre à jour les coordonnées ou les informations médicales.',
          },
        ],
      },
      {
        title: 'Consultations',
        icon: 'Stethoscope',
        steps: [
          {
            title: 'Créer une consultation',
            description: 'Cliquez sur "Nouvelle consultation" depuis la page Consultations ou depuis la fiche patient. Renseignez le motif, les symptômes, les signes cliniques et le diagnostic provisoire.',
          },
          {
            title: 'Suivre les consultations',
            description: 'La liste des consultations affiche le statut (En attente, En cours, Terminée, Annulée) et le médecin assigné. Filtrez par statut ou date.',
          },
          {
            title: 'Mettre à jour une consultation',
            description: 'Ouvrez une consultation en cours pour ajouter des notes, modifier le diagnostic ou changer le statut en "Terminée" une fois la consultation achevée.',
          },
        ],
      },
      {
        title: 'Diagnostics',
        icon: 'ClipboardList',
        steps: [
          {
            title: 'Poser un diagnostic',
            description: 'Depuis la page Diagnostics, cliquez sur "Nouveau diagnostic". Sélectionnez la maladie (code CIM-10), le type (Provisoire, Différentiel ou Final) et ajoutez une description.',
          },
          {
            title: 'Types de diagnostic',
            description: 'Utilisez "Provisoire" pour un diagnostic non confirmé, "Différentiel" pour les hypothèses concurrentes, et "Final" pour le diagnostic retenu. Seuls les spécialistes valident.',
          },
          {
            title: 'Consulter l\'historique',
            description: 'La liste des diagnostics par patient montre l\'évolution : diagnostics provisoires devenus finals, validations et examens associés.',
          },
        ],
      },
      {
        title: 'Traitements & Prescriptions',
        icon: 'Pill',
        steps: [
          {
            title: 'Prescrire un traitement',
            description: 'Dans la page Traitements, cliquez sur "Nouveau traitement". Sélectionnez le médicament, la posologie, la durée et les instructions. Le statut initial est "Prescrit".',
          },
          {
            title: 'Générer une ordonnance',
            description: 'Depuis la fiche d\'un traitement, cliquez sur le bouton "Ordonnance" pour générer un PDF imprimable. L\'ordonnance reprend les médicaments et la posologie.',
          },
          {
            title: 'Suivre l\'administration',
            description: 'Le statut du traitement évolue : Prescrit → En cours → Terminé. Vous pouvez voir l\'historique des administrations par les infirmiers.',
          },
        ],
      },
      {
        title: 'Examens de laboratoire',
        icon: 'FlaskConical',
        steps: [
          {
            title: 'Demander un examen',
            description: 'Dans la page Laboratoire, cliquez sur "Nouvel examen". Sélectionnez le patient, la catégorie d\'examen, et ajoutez une indication clinique.',
          },
          {
            title: 'Suivre les résultats',
            description: 'Les examens demandés apparaissent avec le statut "Demande". Une fois les résultats saisis par le laboratoire, le statut passe à "Terminé". Cliquez pour voir les résultats.',
          },
          {
            title: 'Consulter la fiche de résultats',
            description: 'Utilisez le bouton fichier pour ouvrir la fiche récapitulative de l\'examen avec tous les résultats et notes du laborantin.',
          },
        ],
      },
      {
        title: 'Protocoles thérapeutiques',
        icon: 'FileText',
        steps: [
          {
            title: 'Consulter les protocoles',
            description: 'La page Protocoles affiche les protocoles de traitement par maladie. Utilisez la recherche pour trouver un protocole par nom ou par pathologie.',
          },
          {
            title: 'Créer un protocole',
            description: 'Cliquez sur "Nouveau protocole". Renseignez le nom, la maladie associée, la population cible et les étapes du traitement.',
          },
        ],
      },
      {
        title: 'Aide à la décision clinique',
        icon: 'Brain',
        steps: [
          {
            title: 'Utiliser l\'aide à la décision',
            description: 'Sélectionnez une maladie dans le menu déroulant pour voir les statistiques (taux de guérison, mortalité, durée moyenne), les cas similaires et les protocoles recommandés.',
          },
          {
            title: 'Analyser les cas similaires',
            description: 'La section "Cas similaires" montre des cas anonymisés avec symptômes, diagnostics, traitements et évolution pour éclairer votre décision clinique.',
          },
        ],
      },
      {
        title: 'Base de connaissances',
        icon: 'BookOpen',
        steps: [
          {
            title: 'Rechercher des cas',
            description: 'La base de connaissances contient des cas cliniques anonymisés. Utilisez la recherche et les filtres par maladie ou sexe pour explorer.',
          },
          {
            title: 'Utilisation pour la recherche',
            description: 'Ces cas servent à la recherche médicale et à l\'amélioration continue des protocoles. Les données sont complètement anonymisées.',
          },
        ],
      },
      {
        title: 'Épisodes de soins',
        icon: 'Activity',
        steps: [
          {
            title: 'Suivi des épisodes',
            description: 'Chaque consultation crée automatiquement un épisode de soins. La page Épisodes de soins regroupe toutes les interventions autour d\'une pathologie de façon chronologique.',
          },
          {
            title: 'Créer un épisode manuellement',
            description: 'Vous pouvez créer un épisode de soins manuellement pour regrouper des consultations liées à une même affection chronique.',
          },
        ],
      },
      {
        title: 'Documents & Rapports',
        icon: 'FileSpreadsheet',
        steps: [
          {
            title: 'Générer des documents',
            description: 'Créez des certificats médicaux, rapports de consultation ou lettres de référence depuis la page Documents.',
          },
          {
            title: 'Consulter les rapports',
            description: 'La page Rapports offre une vue d\'ensemble des statistiques et indicateurs de performance clinique.',
          },
        ],
      },
    ],
  },
  {
    role: 'admin',
    title: 'Guide de l\'Administrateur',
    description: 'Gestion des utilisateurs, établissements, paramètres système et supervision de l\'activité.',
    sections: [
      {
        title: 'Tableau de bord',
        icon: 'LayoutDashboard',
        steps: [
          {
            title: 'Vue d\'ensemble',
            description: 'Le tableau de bord administrateur affiche les statistiques globales : utilisateurs actifs, patients enregistrés, consultations du jour et taux de résolution.',
          },
          {
            title: 'Actions rapides',
            description: 'Accédez rapidement à la création d\'utilisateurs, la gestion des établissements, les paramètres système et le journal d\'audit.',
          },
          {
            title: 'Graphiques',
            description: 'Les graphiques montrent l\'activité par mois (courbe) et la répartition par statut (camembert) pour un suivi global.',
          },
        ],
      },
      {
        title: 'Gestion des utilisateurs',
        icon: 'Users',
        steps: [
          {
            title: 'Créer un utilisateur',
            description: 'Dans la page Utilisateurs, cliquez sur "Nouvel utilisateur". Remplissez les champs : nom, prénom, email, rôle, établissement d\'affectation et mot de passe provisoire.',
          },
          {
            title: 'Modifier un utilisateur',
            description: 'Cliquez sur un utilisateur dans la liste pour modifier son profil, changer son rôle ou son établissement d\'affectation.',
          },
          {
            title: 'Désactiver un compte',
            description: 'Utilisez le bouton "Désactiver" pour suspendre l\'accès d\'un utilisateur sans supprimer ses données historiques.',
          },
          {
            title: 'Gestion des rôles',
            description: 'Les rôles disponibles sont : Super Administrateur, Administrateur, Médecin, Spécialiste, Infirmier, Réceptionniste, Laborantin, Pharmacien, Comptable, Archiviste et Patient.',
          },
        ],
      },
      {
        title: 'Établissements',
        icon: 'Building2',
        steps: [
          {
            title: 'Ajouter un établissement',
            description: 'Dans la page Établissements, cliquez sur "Nouvel établissement". Renseignez le nom, l\'adresse, le téléphone et le type d\'établissement (Hôpital, Clinique, Centre de santé).',
          },
          {
            title: 'Configurer un établissement',
            description: 'Chaque établissement peut avoir sa propre configuration : code établissement, statut actif/inactif et informations de contact.',
          },
          {
            title: 'Supervision multi-établissement',
            description: 'En tant qu\'administrateur, vous pouvez basculer entre les établissements via le sélecteur en haut de l\'écran. Les données sont filtrées automatiquement.',
          },
        ],
      },
      {
        title: 'Paramètres système',
        icon: 'Settings',
        steps: [
          {
            title: 'Configuration générale',
            description: 'La page Paramètres permet de configurer les préférences système : nom de l\'établissement, fuseau horaire, langue et notifications globales.',
          },
          {
            title: 'Préférences personnelles',
            description: 'Chaque utilisateur peut configurer ses préférences personnelles (thème, langue, notifications). Les administrateurs voient aussi les paramètres système globaux.',
          },
        ],
      },
      {
        title: 'Journal d\'audit',
        icon: 'Shield',
        steps: [
          {
            title: 'Consulter l\'audit',
            description: 'Le journal d\'audit enregistre toutes les actions importantes : créations, modifications, suppressions et connexions. Filtrez par utilisateur, action ou date.',
          },
          {
            title: 'Audit fonctionnel',
            description: 'La page Audit Fonctionnel offre une vue synthétique des actions critiques pour la conformité réglementaire.',
          },
        ],
      },
      {
        title: 'Rapports & Statistiques',
        icon: 'BarChart3',
        steps: [
          {
            title: 'Rapports d\'activité',
            description: 'La page Rapports génère des statistiques détaillées : nombre de consultations, patients, examens par période et par service.',
          },
          {
            title: 'Statistiques des maladies',
            description: 'La page Statistiques des Maladies montre la prévalence, l\'incidence et la répartition géographique des pathologies.',
          },
        ],
      },
      {
        title: 'Notifications',
        icon: 'Bell',
        steps: [
          {
            title: 'Gérer les notifications',
            description: 'Consultez et gérez l\'ensemble des notifications système. Vous pouvez les marquer comme lues ou les supprimer.',
          },
          {
            title: 'Alertes importantes',
            description: 'Les notifications incluent les alertes de sécurité, les demandes d\'activation de compte et les rapports d\'anomalies.',
          },
        ],
      },
    ],
  },
  {
    role: 'nurse',
    title: 'Guide de l\'Infirmier(ère)',
    description: 'Prise en charge des patients, administration des soins, triage et suivi hospitalier.',
    sections: [
      {
        title: 'Tableau de bord',
        icon: 'LayoutDashboard',
        steps: [
          {
            title: 'Vue d\'ensemble',
            description: 'Le tableau de bord infirmier affiche les patients hospitalisés, les traitements à administrer, la file d\'attente et les épisodes de soins actifs.',
          },
          {
            title: 'Actions rapides',
            description: 'Accédez rapidement aux patients hospitalisés, à la file d\'attente, à l\'enregistrement d\'un nouveau patient et aux traitements en cours.',
          },
        ],
      },
      {
        title: 'File d\'attente & Triage',
        icon: 'ListOrdered',
        steps: [
          {
            title: 'Gérer la file d\'attente',
            description: 'Ajoutez des patients à la file d\'attente, modifiez leur priorité (Normal, Urgent) et assignez un médecin.',
          },
          {
            title: 'Effectuer le triage',
            description: 'Prenez les constantes vitales (tension artérielle, pouls, température, saturation en oxygène, poids, taille). Définissez la priorité et orientez le patient vers le médecin.',
          },
          {
            title: 'Rechercher dans la file',
            description: 'Utilisez la barre de recherche pour filtrer les patients par nom ou numéro de ticket.',
          },
        ],
      },
      {
        title: 'Patients',
        icon: 'UserRound',
        steps: [
          {
            title: 'Enregistrer un patient',
            description: 'Créez un nouveau patient avec ses informations de base : nom, prénom, date de naissance, sexe, téléphone et adresse.',
          },
          {
            title: 'Consulter une fiche patient',
            description: 'Ouvrez la fiche d\'un patient pour voir ses informations, ses consultations passées et ses traitements en cours.',
          },
          {
            title: 'Mettre à jour les informations',
            description: 'Modifiez les coordonnées du patient si nécessaire. Les informations médicales sont mises à jour par les médecins.',
          },
        ],
      },
      {
        title: 'Soins & Traitements',
        icon: 'Pill',
        steps: [
          {
            title: 'Consulter les traitements prescrits',
            description: 'La page Traitements liste toutes les prescriptions en cours pour les patients. Filtrez par statut ou par patient.',
          },
          {
            title: 'Administrer un traitement',
            description: 'Une fois le traitement prescrit par le médecin, vous pouvez le marquer comme "En cours" lors de la première administration et "Terminé" à la fin.',
          },
          {
            title: 'Suivi des prescriptions',
            description: 'Consultez les prescriptions en cours depuis la page Prescriptions pour voir les détails de posologie et les instructions.',
          },
        ],
      },
      {
        title: 'Hospitalisation',
        icon: 'BedDouble',
        steps: [
          {
            title: 'Gérer les hospitalisations',
            description: 'La page Hospitalisation permet de suivre les patients admis, leur durée de séjour et les soins prodigués.',
          },
          {
            title: 'Suivi des épisodes actifs',
            description: 'Les épisodes de soins en cours sont visibles depuis la page Hospitalisation pour coordonner les soins.',
          },
        ],
      },
      {
        title: 'Épisodes de soins',
        icon: 'Activity',
        steps: [
          {
            title: 'Créer un épisode de soins',
            description: 'Un épisode de soins peut être créé pour regrouper les interventions autour d\'une pathologie. Il est automatiquement lié aux consultations.',
          },
          {
            title: 'Consulter l\'historique',
            description: 'La page Épisodes de soins regroupe toutes les interventions de façon chronologique pour un suivi continu.',
          },
        ],
      },
      {
        title: 'Examens de laboratoire',
        icon: 'FlaskConical',
        steps: [
          {
            title: 'Consulter les résultats',
            description: 'La page Laboratoire vous permet de voir les résultats des examens demandés pour les patients. Les résultats sont en lecture seule.',
          },
        ],
      },
      {
        title: 'Documents',
        icon: 'FileText',
        steps: [
          {
            title: 'Consulter les documents',
            description: 'La page Documents affiche les documents générés pour les patients : certificats, rapports, ordonnances. Consultation en lecture seule.',
          },
        ],
      },
    ],
  },
  {
    role: 'laboratory',
    title: 'Guide du Laborantin',
    description: 'Gestion des examens de laboratoire, saisie des résultats et validation des analyses.',
    sections: [
      {
        title: 'Tableau de bord',
        icon: 'LayoutDashboard',
        steps: [
          {
            title: 'Vue d\'ensemble',
            description: 'Le tableau de bord affiche les examens en attente, en cours, terminés et validés. Les indicateurs clés vous aident à prioriser votre travail.',
          },
          {
            title: 'Actions rapides',
            description: 'Accédez rapidement aux examens en attente, aux résultats à valider, aux catégories d\'examens et aux documents.',
          },
          {
            title: 'Graphiques',
            description: 'Les graphiques montrent le volume d\'examens par mois et la répartition par statut.',
          },
        ],
      },
      {
        title: 'Examens de laboratoire',
        icon: 'FlaskConical',
        steps: [
          {
            title: 'Créer un examen',
            description: 'Cliquez sur "Nouvel examen". Sélectionnez le patient, le médecin prescripteur, la catégorie d\'examen et le nom de l\'examen. Ajoutez une indication clinique si nécessaire.',
          },
          {
            title: 'Saisir les résultats',
            description: 'Depuis la liste des examens, cliquez sur le bouton d\'édition (crayon) pour saisir les résultats. Utilisez le champ "Résultats" pour structurer les données.',
          },
          {
            title: 'Modifier le statut',
            description: 'Au fur et à mesure du traitement, mettez à jour le statut : Demande → En cours → Terminé. Ajoutez des notes de résultat si besoin.',
          },
          {
            title: 'Valider un examen',
            description: 'Une fois les résultats saisis, vous pouvez valider l\'examen. Un examen validé ne peut plus être modifié (sauf par un administrateur).',
          },
          {
            title: 'Consulter le détail',
            description: 'Cliquez sur un examen pour ouvrir sa page de détail avec toutes les informations : résultats, notes, historique des modifications.',
          },
          {
            title: 'Imprimer un rapport',
            description: 'Utilisez le bouton d\'impression pour générer un rapport PDF de l\'examen avec les résultats et les informations patient.',
          },
        ],
      },
      {
        title: 'Catégories d\'examens',
        icon: 'FolderOpen',
        steps: [
          {
            title: 'Gérer les catégories',
            description: 'La page Catégories permet de consulter les différentes catégories d\'examens (Biochimie, Hématologie, Microbiologie, etc.) utilisées pour classer les analyses.',
          },
        ],
      },
      {
        title: 'Patients',
        icon: 'UserRound',
        steps: [
          {
            title: 'Rechercher un patient',
            description: 'Utilisez la recherche pour trouver un patient par nom ou numéro de dossier. Nécessaire pour associer un examen au bon patient.',
          },
          {
            title: 'Consulter la fiche',
            description: 'La fiche patient vous permet de voir l\'historique des examens demandés et leurs résultats.',
          },
        ],
      },
      {
        title: 'Documents',
        icon: 'FileText',
        steps: [
          {
            title: 'Créer un document',
            description: 'Générez des rapports d\'analyse ou des comptes rendus de laboratoire depuis la page Documents.',
          },
        ],
      },
    ],
  },
  {
    role: 'pharmacist',
    title: 'Guide du Pharmacien',
    description: 'Dispensation des médicaments, suivi des ordonnances et gestion des prescriptions.',
    sections: [
      {
        title: 'Tableau de bord',
        icon: 'LayoutDashboard',
        steps: [
          {
            title: 'Vue d\'ensemble',
            description: 'Le tableau de bord affiche les prescriptions en attente de dispensation et les traitements en cours dans l\'établissement.',
          },
        ],
      },
      {
        title: 'Dispensation des médicaments',
        icon: 'Pill',
        steps: [
          {
            title: 'Consulter les prescriptions',
            description: 'La page Pharmacie affiche la liste des traitements prescrits en attente de dispensation. Filtrez par statut : Prescrit, En cours, Terminé.',
          },
          {
            title: 'Délivrer un médicament',
            description: 'Cliquez sur "Détail" pour voir la prescription complète. Si le statut est "Prescrit", le bouton "Délivrer" permet de marquer le traitement comme dispensé.',
          },
          {
            title: 'Vérifier les informations',
            description: 'Avant de délivrer, vérifiez la posologie, les instructions et les éventuelles contre-indications sur la fiche détaillée.',
          },
        ],
      },
      {
        title: 'Prescriptions',
        icon: 'ClipboardList',
        steps: [
          {
            title: 'Consulter les ordonnances',
            description: 'La page Prescriptions liste toutes les ordonnances émises par les médecins. Vous pouvez voir le détail des médicaments prescrits.',
          },
          {
            title: 'Générer une ordonnance PDF',
            description: 'Depuis la fiche d\'un traitement, utilisez le bouton "Ordonnance" pour visualiser et imprimer l\'ordonnance au format PDF.',
          },
        ],
      },
      {
        title: 'Traitements',
        icon: 'Activity',
        steps: [
          {
            title: 'Suivi des traitements',
            description: 'La page Traitements permet de voir l\'ensemble des prescriptions : patients concernés, médicaments, posologies et statuts d\'avancement.',
          },
        ],
      },
      {
        title: 'Notifications',
        icon: 'Bell',
        steps: [
          {
            title: 'Nouvelles prescriptions',
            description: 'Vous recevrez une notification à chaque nouvelle prescription émise par un médecin, pour un traitement rapide.',
          },
        ],
      },
    ],
  },
]
