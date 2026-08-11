import { ErrorCode, type ErrorCodeType } from './error-codes'

interface ErrorMessage {
  title: string
  message: string
  action?: string
}

export const ERROR_MESSAGES: Record<ErrorCodeType, ErrorMessage> = {
  [ErrorCode.VALIDATION_ERROR]: {
    title: 'Informations invalides',
    message: 'Certaines informations saisies ne sont pas valides. Vérifiez les champs indiqués.',
    action: 'Corriger les champs',
  },
  [ErrorCode.AUTHENTICATION_FAILED]: {
    title: 'Connexion impossible',
    message: 'Adresse e-mail ou mot de passe incorrect.',
    action: 'Vérifier vos identifiants',
  },
  [ErrorCode.SESSION_EXPIRED]: {
    title: 'Session expirée',
    message: 'Votre session a expiré. Veuillez vous reconnecter.',
    action: 'Se reconnecter',
  },
  [ErrorCode.ACCESS_DENIED]: {
    title: 'Accès refusé',
    message: 'Votre compte ne dispose pas des autorisations nécessaires pour effectuer cette action.',
    action: "Retour à l'accueil",
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    title: 'Élément introuvable',
    message: "L'élément demandé est introuvable ou a peut-être été supprimé.",
    action: 'Retour à la liste',
  },
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    title: 'Élément existant',
    message: 'Cet élément existe déjà. Veuillez utiliser une autre valeur.',
    action: 'Modifier la valeur',
  },
  [ErrorCode.RESOURCE_CREATE_FAILED]: {
    title: "Impossible d'enregistrer",
    message: "L'enregistrement n'a pas pu être effectué. Vérifiez les informations saisies puis réessayez.",
    action: 'Réessayer',
  },
  [ErrorCode.RESOURCE_UPDATE_FAILED]: {
    title: 'Impossible de modifier',
    message: 'La modification n\'a pas pu être effectuée. Vérifiez les informations saisies puis réessayez.',
    action: 'Réessayer',
  },
  [ErrorCode.RESOURCE_DELETE_FAILED]: {
    title: 'Impossible de supprimer',
    message: "La suppression n'a pas pu être effectuée. Cet élément est peut-être utilisé par d'autres données.",
    action: 'Réessayer',
  },
  [ErrorCode.NETWORK_ERROR]: {
    title: 'Problème de connexion',
    message: 'Impossible de contacter le serveur. Vérifiez votre connexion Internet puis réessayez.',
    action: 'Réessayer',
  },
  [ErrorCode.REQUEST_TIMEOUT]: {
    title: 'Délai dépassé',
    message: 'Le serveur a mis trop de temps à répondre. Veuillez réessayer.',
    action: 'Réessayer',
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    title: 'Trop de tentatives',
    message: 'Vous avez effectué trop de demandes en peu de temps. Veuillez patienter avant de réessayer.',
    action: 'Patienter',
  },
  [ErrorCode.CONFLICT]: {
    title: 'Conflit',
    message: 'Cette opération ne peut pas être effectuée car les informations ont changé ou existent déjà.',
    action: 'Actualiser la page',
  },
  [ErrorCode.SERVER_ERROR]: {
    title: 'Erreur inattendue',
    message: 'Une erreur inattendue s\'est produite. Veuillez réessayer dans quelques instants.',
    action: 'Réessayer',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    title: 'Service temporairement indisponible',
    message: 'Le service est temporairement indisponible. Veuillez réessayer ultérieurement.',
    action: 'Réessayer',
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    title: 'Erreur inconnue',
    message: 'Une erreur inconnue s\'est produite. Veuillez réessayer.',
    action: 'Réessayer',
  },
  [ErrorCode.INVALID_JSON]: {
    title: 'Requête invalide',
    message: 'La demande ne peut pas être traitée. Vérifiez les informations puis réessayez.',
    action: 'Réessayer',
  },
  [ErrorCode.DATABASE_ERROR]: {
    title: 'Erreur de base de données',
    message: 'Une erreur est survenue lors de l\'accès aux données. Veuillez réessayer.',
    action: 'Réessayer',
  },
  [ErrorCode.TOKEN_REFRESH_FAILED]: {
    title: 'Session expirée',
    message: 'Votre session n\'est plus valide. Veuillez vous reconnecter.',
    action: 'Se reconnecter',
  },
}

export function getErrorMessage(code: ErrorCodeType): ErrorMessage {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR]
}
