'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Page introuvable</h1>
        <p className="text-sm text-muted-foreground mb-6">
          La page que vous recherchez n&apos;existe pas ou a peut-être été déplacée.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
          >
            Retour en arrière
          </button>
        </div>
      </div>
    </div>
  )
}
