import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Logo } from '@/components/ui/logo'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  FolderOpen,
  RefreshCw,
  Shield,
  BarChart3,
  Users,
  FlaskConical,
  Building2,
  Stethoscope,
  Pill,
  CheckCircle2,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react'

const features = [
  {
    icon: FolderOpen,
    title: 'Gestion des Cas Cliniques',
    description:
      'Documentez les symptômes, diagnostics et traitements de chaque cas avec une interface intuitive et rapide.',
  },
  {
    icon: RefreshCw,
    title: 'Sync Offline/Online',
    description:
      "Continuez à travailler même sans internet. Les données se synchronisent automatiquement dès la connexion rétablie.",
  },
  {
    icon: Shield,
    title: 'Sécurité & Conformité',
    description:
      'Chiffrement de bout en bout, contrôle d\'accès RBAC et journaux d\'audit pour une conformité totale.',
  },
  {
    icon: BarChart3,
    title: 'Analyses & Statistiques',
    description:
      'Tableaux de bord interactifs pour suivre les résultats thérapeutiques et identifier les tendances médicales.',
  },
  {
    icon: Users,
    title: 'Multi-Utilisateurs',
    description:
      'Collaborez en équipe avec des rôles définis : Administrateur, Médecin, Chercheur.',
  },
  {
    icon: FlaskConical,
    title: 'Recherche Médicale',
    description:
      "Accédez à des données anonymisées pour vos études et publications scientifiques.",
  },
]

const services = [
  {
    icon: Building2,
    title: 'Pour les Hôpitaux',
    description:
      'Gestion complète des cas cliniques, du diagnostic au suivi des patients avec un tableau de bord centralisé.',
  },
  {
    icon: Stethoscope,
    title: 'Pour les Médecins',
    description:
      'Interface rapide pour documenter les cas et suivre l\'évolution des traitements au quotidien.',
  },
  {
    icon: FlaskConical,
    title: 'Pour les Chercheurs',
    description:
      "Données anonymisées et outils d'analyse avancés pour la recherche médicale et les publications.",
  },
  {
    icon: Pill,
    title: 'Pour les Pharmacies',
    description:
      'Suivi des prescriptions et détection d\'interactions médicamenteuses en temps réel.',
  },
]

const testimonials = [
  {
    quote:
      'Dhayaro a transformé notre façon de gérer les cas cliniques. Le mode offline est un vrai plus pour nos équipes mobiles.',
    name: 'Dr. Jean-Pierre Lukusa',
    role: 'Cardiologue, Hôpital Général de Kinshasa',
  },
  {
    quote:
      'La synchronisation automatique nous fait gagner un temps précieux au quotidien. Je recommande vivement cette plateforme.',
    name: 'Dr. Patrice Kabongo',
    role: 'Chef de Service Neurologie, Cliniques Universitaires de Kinshasa',
  },
  {
    quote:
      "Enfin une plateforme qui respecte les normes de sécurité tout en étant facile à utiliser au quotidien.",
    name: 'Prof. Espérance Ilunga',
    role: 'Directrice de Recherche Médicale, Hôpital Général de Kinshasa',
  },
]

const stats = [
  { value: '500+', label: 'Médecins' },
  { value: '10,000+', label: 'Cas Cliniques' },
  { value: '50+', label: 'Établissements' },
  { value: '99.9%', label: 'Disponibilité' },
]

const checklist = [
  'Conforme aux normes RGPD et sanitaires',
  'Supporté par des experts en santé numérique',
  'Déployé dans plus de 50 établissements',
]

export default function LandingPage() {
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#features"
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform focus:translate-y-0"
      >
        Aller au contenu principal
      </a>

      {/* Navigation */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-border bg-card/80 shadow-sm backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="text-lg font-bold text-foreground">Dhayaro</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Fonctionnalités
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              À Propos
            </a>
            <a href="#services" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Services
            </a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Témoignages
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Commencer</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-card/95 backdrop-blur-xl md:hidden">
            <div className="space-y-1 px-4 py-4">
              <a href="#features" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                Fonctionnalités
              </a>
              <a href="#about" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                À Propos
              </a>
              <a href="#services" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                Services
              </a>
              <a href="#testimonials" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                Témoignages
              </a>
              <Separator className="my-2" />
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Commencer</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-primary pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Plateforme Médicale Nouvelle Génération
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Révolutionnez la{' '}
              <span className="text-accent">Gestion des Cas Cliniques</span>
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-relaxed text-white/70">
              Dhayaro est la plateforme Offline-First qui permet aux médecins,
              hôpitaux et chercheurs de documenter, analyser et partager des cas
              cliniques en toute sécurité.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="bg-accent text-white hover:bg-accent/90" asChild>
                <Link href="/login">
                  Démarrer Gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/login">Voir la Démo</Link>
              </Button>
            </div>
          </div>

          <div className="hidden animate-fade-in-up lg:block" style={{ animationDelay: '0.2s' }}>
          <img
              src="/hero-illustration.png"
              alt="Dhayaro Dashboard"
              width={800}
              height={600}
              className="aspect-[4/3] w-full rounded-3xl border border-white/10 shadow-2xl object-cover"
          />
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L48 108C96 96 192 72 288 66C384 60 480 72 576 78C672 84 768 84 864 78C960 72 1056 60 1152 60C1248 60 1344 72 1392 78L1440 84V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="var(--color-background)" />
          </svg>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 -mt-1 bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-accent">
              Fonctionnalités
            </span>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Une plateforme complète pour gérer l'ensemble du cycle de vie des cas
              cliniques, de la création à l'analyse.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border-border/50 transition-all duration-300 hover:border-accent/30 hover:shadow-lg"
              >
                <CardContent className="p-7">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-secondary/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-accent">
                À Propos
              </span>
              <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl">
                La plateforme médica de nouvelle génération
              </h2>
              <p className="mb-8 text-muted-foreground leading-relaxed">
                Dhayaro a été conçue par des professionnels de santé pour des
                professionnels de santé. Notre mission est de fournir un outil puissant,
                sécurisé et facile à utiliser pour améliorer la prise en charge des
                patients.
              </p>
              <ul className="space-y-4">
                {checklist.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/login">
                  Demander une démo
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <img
              src="/about-illustration.png"
              alt="Dhayaro Team"
              width={600}
              height={660}
              className="aspect-[1/1.1] w-full rounded-3xl shadow-xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-accent">
              Services
            </span>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Pour chaque acteur de la santé
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Dhayaro s'adapte aux besoins spécifiques de chaque professionnelle et
              établissement de santé.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {services.map((service) => (
              <Card
                key={service.title}
                className="group border-border/50 transition-all duration-300 hover:border-accent/30 hover:shadow-lg"
              >
                <CardContent className="flex gap-5 p-7">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 transition-colors group-hover:bg-accent">
                    <service.icon className="h-7 w-7 text-accent transition-colors group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      {service.title}
                    </h3>
                    <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                      {service.description}
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80"
                    >
                      Commencer <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-secondary/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-accent">
              Témoignages
            </span>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Ce que disent nos utilisateurs
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.name}
                className="border-border/50 transition-all duration-300 hover:shadow-lg"
              >
                <CardContent className="p-7">
                  <div className="mb-4 text-4xl text-accent/30">"</div>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    {testimonial.quote}
                  </p>
                  <Separator className="mb-4" />
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {testimonial.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Prêt à transformer votre pratique médicale ?
          </h2>
          <p className="mb-10 text-lg text-white/70">
            Rejoignez des centaines de professionnels de santé qui font confiance à
            Dhayaro pour gérer leurs cas cliniques.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="bg-accent text-white hover:bg-accent/90" asChild>
              <Link href="/login">
                Créer un Compte Gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => {
                navigator.clipboard.writeText("contact@dhayaro.cd")
                toast({ title: "Email copié", description: "contact@dhayaro.cd a été copié dans le presse-papier" })
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contactez l'Équipe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a2d3f] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Logo variant="dark" className="h-6 w-6" />
                <span className="text-lg font-bold text-white">Dhayaro</span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-white/50">
                Plateforme de gestion de cas cliniques médicaux. Offline-First,
                sécurisée et conforme aux normes de santé.
              </p>
              <div className="flex gap-3">
                <Logo variant="dark" className="h-10 w-auto rounded bg-white/10 p-1" />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
                Liens Rapides
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-sm text-white/50 transition-colors hover:text-accent">
                    Fonctionnalites
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-sm text-white/50 transition-colors hover:text-accent">
                    A Propos
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-sm text-white/50 transition-colors hover:text-accent">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-sm text-white/50 transition-colors hover:text-accent">
                    Temoinages
                  </a>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-white/50 transition-colors hover:text-accent">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
                Contact
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-white/50">
                  <MapPin className="h-4 w-4 shrink-0 text-accent" />
                  Kinshasa, RD Congo
                </li>
                <li className="flex items-center gap-2 text-sm text-white/50">
                  <Phone className="h-4 w-4 shrink-0 text-accent" />
                  +243 81 222 0001
                </li>
                <li className="flex items-center gap-2 text-sm text-white/50">
                  <Mail className="h-4 w-4 shrink-0 text-accent" />
                  contact@dhayaro.cd
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <span className="text-sm text-white/30 cursor-not-allowed">
                    Politique de Confidentialite
                  </span>
                </li>
                <li>
                  <span className="text-sm text-white/30 cursor-not-allowed">
                    Conditions d&apos;Utilisation
                  </span>
                </li>
                <li>
                  <span className="text-sm text-white/30 cursor-not-allowed">
                    Mentions Legales
                  </span>
                </li>
                <li>
                  <span className="text-sm text-white/30 cursor-not-allowed">
                    RGPD
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-10 bg-white/10" />

          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Dhayaro. Tous droits réservés.
            </p>
            <p className="text-sm text-white/40">
              Construit avec ❤️ pour la médecine
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
