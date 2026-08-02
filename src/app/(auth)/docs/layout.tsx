const sections = [
  { id: 'a-propos', title: 'À propos' },
  { id: 'architecture', title: 'Architecture' },
  { id: 'structure', title: 'Structure du projet' },
  { id: 'roles', title: 'Rôles utilisateur' },
  { id: 'api', title: 'Endpoints API' },
  { id: 'db', title: 'Base de données' },
  { id: 'installation', title: 'Installation & développement' },
  { id: 'test-accounts', title: 'Comptes de test' },
  { id: 'deploiement', title: 'Déploiement' },
  { id: 'conventions', title: 'Conventions de code' },
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Dhayaro Docs</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://dhayaro.vercel.app"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Retour à l&apos;app
            </a>
            <a
              href="/login"
              className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Connexion
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Documentation du projet
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            PWA médicale pour la gestion des dossiers cliniques en RDC
          </p>
        </div>

        <nav className="mb-8 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {children}
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-400 dark:text-gray-600">
          Dhayaro &copy; {new Date().getFullYear().toString()} — Documentation technique du projet
        </footer>
      </div>
    </div>
  )
}
