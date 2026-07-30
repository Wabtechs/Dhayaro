'use client'

import { useEffect } from 'react'

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4 text-destructive">⚠</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Erreur inattendue</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Une erreur s&apos;est produite dans cette page. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
