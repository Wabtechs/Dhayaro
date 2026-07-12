import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { HeartPulse, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email')
      return
    }
    if (!password.trim()) {
      setError('Veuillez entrer votre mot de passe')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate('/app', { replace: true })
    } catch {
      setError('Identifiant ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-primary lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="flex flex-col items-center gap-6 px-12 text-center">
          <Link to="/" className="flex flex-col items-center gap-4">
            <img src="/logo.png" alt="MedInsight" className="h-20 w-20 rounded-2xl bg-white/10 p-3 object-contain" />
            <h1 className="text-4xl font-bold text-white">MedInsight</h1>
          </Link>
          <p className="max-w-md text-lg text-white/80">
            Plateforme de Gestion de Cas Cliniques
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6 text-white/60">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                <HeartPulse className="h-6 w-6" />
              </div>
              <span className="text-xs">Cas Cliniques</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                <Mail className="h-6 w-6" />
              </div>
              <span className="text-xs">Collaboration</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                <Lock className="h-6 w-6" />
              </div>
              <span className="text-xs">Sécurisé</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <img src="/logo.png" alt="MedInsight" className="h-10 w-10 rounded-lg object-contain" />
            <span className="text-xl font-bold text-primary">MedInsight</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Connexion
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre tableau de bord
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <span className="text-muted-foreground">
                      Se souvenir de moi
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Mot de passe oublié?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Connexion...
                    </div>
                  ) : (
                    'Connexion'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Identifiants de démonstration :
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Admin :</span>{' '}
                admin@medinsight.dz
              </p>
              <p>
                <span className="font-medium text-foreground">Médecin :</span>{' '}
                doctor@medinsight.dz
              </p>
              <p>
                <span className="font-medium text-foreground">Infirmier :</span>{' '}
                nurse@medinsight.dz
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
