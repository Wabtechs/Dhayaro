const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

type TokenListener = (token: string) => void;

export class ApiError extends Error {
  code: string
  status: number
  fieldErrors: Record<string, string>

  constructor(message: string, code: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function mapStatusToCode(status: number): string {
  switch (status) {
    case 400: return 'INVALID_JSON'
    case 401: return 'SESSION_EXPIRED'
    case 403: return 'ACCESS_DENIED'
    case 404: return 'RESOURCE_NOT_FOUND'
    case 408: return 'REQUEST_TIMEOUT'
    case 409: return 'CONFLICT'
    case 422: return 'VALIDATION_ERROR'
    case 429: return 'RATE_LIMIT_EXCEEDED'
    case 502: return 'SERVICE_UNAVAILABLE'
    case 503: return 'SERVICE_UNAVAILABLE'
    default: return 'SERVER_ERROR'
  }
}

const DETAIL_MESSAGE_MAP: Record<string, string> = {
  'Invalid email or password': 'Adresse e-mail ou mot de passe incorrect.',
  'Invalid or expired token': 'Votre session n\'est plus valide. Veuillez vous reconnecter.',
  'Authentication required': 'Connexion requise. Veuillez vous reconnecter.',
  'Insufficient permissions': 'Votre compte ne dispose pas des autorisations nécessaires pour effectuer cette action.',
  'Access denied': 'Accès refusé. Votre compte ne dispose pas des autorisations nécessaires.',
  'Not authenticated': 'Connexion requise. Veuillez vous reconnecter.',
  'Internal server error': 'Une erreur inattendue s\'est produite. Veuillez réessayer dans quelques instants.',
  'Invalid JSON body': 'La demande ne peut pas être traitée. Vérifiez les informations puis réessayez.',
  'Patient not found': 'Patient introuvable.',
  'Doctor not found': 'Médecin introuvable.',
  'Treatment not found': 'Traitement introuvable.',
  'Protocol not found': 'Protocole introuvable.',
  'Queue entry not found': 'Entrée de file d\'attente introuvable.',
  'User not found': 'Utilisateur introuvable.',
  'Batch not found': 'Lot introuvable.',
  'Movement not found': 'Mouvement introuvable.',
  'Supply not found': 'Produit introuvable.',
  'Purchase order not found': 'Bon de commande introuvable.',
  'Only administrators can update users': 'Seuls les administrateurs peuvent modifier les utilisateurs.',
  'Only administrators can delete users': 'Seuls les administrateurs peuvent supprimer les utilisateurs.',
  'Only administrators can create users': 'Seuls les administrateurs peuvent créer des utilisateurs.',
  'facilityId is required for this role': 'L\'identifiant de l\'établissement est requis pour ce rôle.',
  'facilityId cannot be empty for this role': 'L\'identifiant de l\'établissement ne peut pas être vide pour ce rôle.',
  'Seuls les administrateurs peuvent supprimer un patient': 'Seuls les administrateurs peuvent supprimer un patient.',
  'ids or all must be provided': 'Veuillez fournir des identifiants ou sélectionner tout.',
  'No valid ids provided': 'Aucun identifiant valide fourni.',
  'La quantité doit être supérieure à zéro': 'La quantité doit être supérieure à zéro.',
  'Stock insuffisant': 'Stock insuffisant.',
  'Too many login attempts. Please try again later.': 'Vous avez effectué trop de tentatives. Veuillez patienter avant de réessayer.',
  'Erreur interne': 'Une erreur inattendue s\'est produite. Veuillez réessayer dans quelques instants.',
  'ID invalide': 'Identifiant invalide.',
  'Invalid protocol ID': 'Identifiant de protocole invalide.',
  'Database error': 'Une erreur est survenue lors de l\'accès aux données. Veuillez réessayer.',
  'Access reserved for patients': 'Accès réservé aux patients.',
}

const STATUS_MESSAGE_MAP: Record<number, string> = {
  400: 'La demande ne peut pas être traitée. Vérifiez les informations puis réessayez.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  403: 'Votre compte ne dispose pas des autorisations nécessaires pour effectuer cette action.',
  404: 'L\'élément demandé est introuvable ou a peut-être été supprimé.',
  408: 'Le serveur a mis trop de temps à répondre. Veuillez réessayer.',
  409: 'Cette opération ne peut pas être effectuée car les informations ont changé ou existent déjà.',
  422: 'Certaines informations saisies ne sont pas valides. Vérifiez les champs indiqués.',
  429: 'Vous avez effectué trop de demandes en peu de temps. Veuillez patienter avant de réessayer.',
  500: 'Une erreur inattendue s\'est produite. Veuillez réessayer dans quelques instants.',
  502: 'Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.',
  503: 'Le service est temporairement indisponible. Veuillez réessayer ultérieurement.',
}

function mapDetailToMessage(status: number, detail?: string): string | undefined {
  if (!detail) return STATUS_MESSAGE_MAP[status]
  if (detail in DETAIL_MESSAGE_MAP) return DETAIL_MESSAGE_MAP[detail]
  const lowerDetail = detail.toLowerCase()
  if (lowerDetail.includes('not found') || lowerDetail.includes('introuvable')) {
    return 'L\'élément demandé est introuvable ou a peut-être été supprimé.'
  }
  if (lowerDetail.includes('already exists') || lowerDetail.includes('déjà')) {
    return 'Cet élément existe déjà. Veuillez utiliser une autre valeur.'
  }
  if (lowerDetail.includes('foreign key') || lowerDetail.includes('contrainte')) {
    return 'Impossible de supprimer cet élément car il est encore utilisé.'
  }
  if (lowerDetail.includes('unique') || lowerDetail.includes('duplicate')) {
    return 'Cet élément existe déjà. Veuillez utiliser une autre valeur.'
  }
  if (lowerDetail.includes('permission') || lowerDetail.includes('authoriz')) {
    return 'Votre compte ne dispose pas des autorisations nécessaires pour effectuer cette action.'
  }
  if (lowerDetail.includes('internal server error') || lowerDetail.includes('erreur interne')) {
    return 'Une erreur inattendue s\'est produite. Veuillez réessayer dans quelques instants.'
  }
  return STATUS_MESSAGE_MAP[status]
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<string> | null = null;
  private onTokenRefreshed: TokenListener | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setTokenListener(listener: TokenListener) {
    this.onTokenRefreshed = listener;
  }

  private getToken(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('dhayaro_token') || '';
  }

  private async doRefresh(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) throw new ApiError('Échec du rafraîchissement du jeton.', 'TOKEN_REFRESH_FAILED', 401);

    const data = await response.json();
    const newToken: string = data.access_token;

    localStorage.setItem('dhayaro_token', newToken);
    this.onTokenRefreshed?.(newToken);

    return newToken;
  }

  private async requestWithAuth<T>(endpoint: string, options: ApiOptions = {}, retry = true): Promise<T> {
    const { method = 'GET', body, token } = options;
    const authToken = token || this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && retry) {
      try {
        if (!this.refreshPromise) {
          this.refreshPromise = this.doRefresh();
        }
        const newToken = await this.refreshPromise;
        this.refreshPromise = null;
        return this.requestWithAuth<T>(endpoint, { ...options, token: newToken }, false);
      } catch {
        this.refreshPromise = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dhayaro_token');
          localStorage.removeItem('dhayaro_user');
          document.cookie = 'dhayaro_token=; path=/; max-age=0';
          window.location.href = '/login';
        }
        throw new ApiError(
          'Votre session a expiré. Veuillez vous reconnecter.',
          'SESSION_EXPIRED',
          401
        );
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => null)

      const message = error?.message || mapDetailToMessage(response.status, error?.detail) || 'Une erreur inattendue s\'est produite.'
      const code = error?.code || mapStatusToCode(response.status)
      const fieldErrors = error?.errors || {}

      throw new ApiError(message, code, response.status, fieldErrors)
    }
    return response.json()
  }

  login(email: string, password: string) {
    return this.requestWithAuth<{ access_token: string; refresh_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }, false);
  }

  refreshToken() {
    return this.requestWithAuth<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
    }, false);
  }

  getMe(token: string) {
    return this.requestWithAuth<unknown>('/auth/me', { token });
  }

  get<T>(endpoint: string, token: string) {
    return this.requestWithAuth<T>(endpoint, { token });
  }

  post<T>(endpoint: string, body: unknown, token: string) {
    const enriched = this.enrichBody(body);
    return this.requestWithAuth<T>(endpoint, { method: 'POST', body: enriched, token });
  }

  put<T>(endpoint: string, body: unknown, token: string) {
    const enriched = this.enrichBody(body);
    return this.requestWithAuth<T>(endpoint, { method: 'PUT', body: enriched, token });
  }

  private enrichBody(body: unknown): unknown {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return body;
    const activeFacility = typeof window !== 'undefined' ? localStorage.getItem('dhayaro_active_facility') : null;
    if (!activeFacility) return body;
    const b = body as Record<string, unknown>;
    if (b.facilityId !== undefined) return body;
    return { ...b, facilityId: activeFacility };
  }

  patch<T>(endpoint: string, body: unknown, token: string) {
    const enriched = this.enrichBody(body);
    return this.requestWithAuth<T>(endpoint, { method: 'PATCH', body: enriched, token });
  }

  delete<T>(endpoint: string, token: string) {
    return this.requestWithAuth<T>(endpoint, { method: 'DELETE', token });
  }
}

export const api = new ApiClient(API_BASE);
