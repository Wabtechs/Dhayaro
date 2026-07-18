import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email')
      return
    }

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo className="h-12 w-12 rounded-xl" />
          <h1 className="text-2xl font-bold text-primary">Dhayaro</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                  <Mail className="h-7 w-7 text-success" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Email envoyé
                </h2>
                <p className="text-sm text-muted-foreground">
                  Si un compte existe avec l'adresse{' '}
                  <span className="font-medium text-foreground">{email}</span>,
                  vous recevrez un lien de réinitialisation de mot de passe.
                </p>
                <p className="text-xs text-muted-foreground">
                  Vérifiez votre boîte de réception et vos spams.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="mt-4 w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    Mot de passe oublié
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Entrez votre adresse email et nous vous enverrons un lien
                    pour réinitialiser votre mot de passe.
                  </p>
                </div>

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

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Envoi en cours...
                      </div>
                    ) : (
                      'Envoyer le lien de réinitialisation'
                    )}
                  </Button>
                </form>

                <Link
                  href="/login"
                  className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
