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
]
