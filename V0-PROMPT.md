# Prompt V0.app - MedInsight Landing Page

> Copiez-collez ce prompt sur https://v0.dev pour générer la landing page.

---

## Prompt principal

```
Build a complete, production-ready medical SaaS landing page for "MedInsight" - a clinical case management platform for hospitals and healthcare researchers. The page should be in FRENCH.

DESIGN SYSTEM (inspired by a medical clinic template):
- Primary color: #0e384c (dark teal) - used for headers, hero backgrounds, text headings
- Accent color: #1e84b5 (medium blue) - used for buttons, icon boxes, links, CTAs
- Background: #f8fafc (light gray-blue) for sections
- Text color: #64748b (blue-gray) for body text
- White: #ffffff for cards and contrast areas
- Border radius: 14px for buttons, 30px for cards, 40px for large sections
- Font: Inter (Google Fonts)
- Dark mode support via Tailwind dark: classes

PAGE STRUCTURE (all sections must be fully implemented):

1. **Navigation Header** (sticky, backdrop-blur):
   - Logo: Use a HeartPulse icon from lucide-react with "MedInsight" text
   - Nav links: Accueil, Fonctionnalités, À Propos, Services, Contact
   - Right side: "Connexion" ghost button + "Commencer" primary button
   - Mobile: hamburger menu with Sheet component

2. **Hero Section** (dark teal bg #0e384c, min-h-screen):
   - Left: Small accent badge "Plateforme Médicale Nouvelle Génération"
   - Large heading (56px+): "Révolutionnez la Gestion des Cas Cliniques"
   - Subtitle: "MedInsight est la plateforme Offline-First qui permet aux médecins, hôpitaux et chercheurs de documenter, analyser et partager des cas cliniques en toute sécurité."
   - Two CTA buttons: "Démarrer Gratuitement" (primary blue) + "Voir la Démo" (outlined white)
   - Right side: Placeholder for a medical dashboard mockup image (use a styled div with gradient bg as placeholder, 400x300px, border-radius 30px)
   - Bottom wave SVG divider (like the Primecare template)

3. **Stats Bar** (white bg, shadow):
   - 4 stats in a row: "500+ Médecins", "10,000+ Cas Cliniques", "50+ Établissements", "99.9% Disponibilité"
   - Each with a large number and subtitle

4. **Features Section** (6 features, 3x2 grid):
   - Each feature card: icon box (48x48, accent bg, rounded-2xl), title, description
   - Features:
     1. Icon: FolderOpen, Title: "Gestion des Cas Cliniques", Desc: "Documentez les symptômes, diagnostics et traitements de chaque cas avec une interface intuitive."
     2. Icon: RefreshCw, Title: "Sync Offline/Online", Desc: "Continuez à travailler même sans internet. Les données se synchronisent automatiquement."
     3. Icon: Shield, Title: "Sécurité & Conformité", Desc: "Chiffrement de bout en bout, RBAC et journaux d'audit pour une conformité totale."
     4. Icon: BarChart3, Title: "Analyses & Statistiques", Desc: "Tableaux de bord interactifs pour suivre les résultats thérapeutiques et identifier les tendances."
     5. Icon: Users, Title: "Multi-Utilisateurs", Desc: "Collaborez en équipe avec des rôles définis : Admin, Médecin, Chercheur."
     6. Icon: FlaskConical, Title: "Recherche Médicale", Desc: "Accédez à des données anonymisées pour vos études et publications scientifiques."
   - Cards: white bg, border, rounded-3xl, padding 30px, hover shadow-lg transition

5. **About Section** (2 columns):
   - Left: Large heading "À Propos de MedInsight", description text, check-list with 3 items (icons: CheckCircle2)
     - "Conforme aux normes RGPD et sanitaires"
     - "Supporté par des experts en santé numérique"
     - "Déployé dans plus de 50 établissements"
   - Right: Placeholder image area (styled div, gradient bg, rounded-3xl, aspect-ratio 1/1.1)

6. **Services Section** (4 cards in 2x2 grid):
   - Each card: icon, title, description, "En savoir plus →" link
   - Services:
     1. Icon: Building2, Title: "Pour les Hôpitaux", Desc: "Gestion complète des cas cliniques, du diagnostic au suivi des patients."
     2. Icon: Stethoscope, Title: "Pour les Médecins", Desc: "Interface rapide pour documenter les cas et suivre l'évolution des traitements."
     3. Icon: FlaskConical, Title: "Pour les Chercheurs", Desc: "Données anonymisées et outils d'analyse pour la recherche médicale."
     4. Icon: Pill, Title: "Pour les Pharmacies", Desc: "Suivi des prescriptions et interaction médicamenteuse."

7. **Testimonials Section** (bg-secondary, rounded cards):
   - 3 testimonial cards in a row
   - Each: quote text, author avatar (placeholder circle), author name, author role
   - Testimonials:
     1. "MedInsight a transformé notre façon de gérer les cas cliniques. Le mode offline est un vrai plus." - Dr. Amira Bentaleb, Cardiologue
     2. "La synchronisation automatique nous fait gagner un temps précieux au quotidien." - Dr. Karim Mansouri, Chef de Service
     3. "Enfin une plateforme qui respecte les normes de sécurité tout en étant facile à utiliser." - Prof. Nadia Cherif, Directrice de Recherche

8. **CTA Section** (dark teal bg):
   - Large heading: "Prêt à transformer votre pratique médicale ?"
   - Subtitle: "Rejoignez des centaines de professionnels de santé qui font confiance à MedInsight."
   - Two buttons: "Créer un Compte Gratuit" + "Contactez l'Équipe"

9. **Footer** (dark bg #0a2d3f):
   - 4 columns: Logo+description, Liens Rapides, Contact, Suivez-nous
   - Bottom: Copyright "© 2024 MedInsight. Tous droits réservés."

TECHNICAL REQUIREMENTS:
- Use React + TypeScript + Tailwind CSS
- Use lucide-react for ALL icons (HeartPulse, FolderOpen, RefreshCw, Shield, BarChart3, Users, FlaskConical, Building2, Stethoscope, Pill, CheckCircle2, ChevronRight, Mail, Phone, MapPin, Menu, X)
- All sections must have placeholder zones for images (styled divs with gradient backgrounds)
- Fully responsive (mobile-first)
- Smooth scroll between sections
- CSS animations on scroll (fade-in-up)
- Use shadcn/ui Button and Card components
- No placeholder text - all French content as specified above
- The design must feel like a premium medical SaaS product
```

---

## Notes pour V0

- Le prompt est optimisé pour générer une **landing page complète** en une seule génération
- Toutes les zones d'images sont **forcées** (placeholder divs avec gradients)
- Toutes les textes sont **prédéfinis** en français
- Les icônes sont **spécifiées** (lucide-react)
- Le design suit le **design system** du template Primecare (teal + blue + rounded)
