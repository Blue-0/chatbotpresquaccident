# ChatBot Presqu'Accident - E2I AgentSecu

Application de chat avec assistant IA incluant la transcription audio via Voxtral (Mistral AI).

## 🚀 Fonctionnalités

- 💬 Interface de chat avec assistant IA E2I AgentSecu
- 🎤 **Transcription audio** via microphone (Voxtral API)
- 🎨 Animations fluides avec Anime.js
- 🔐 Authentification NextAuth
- ✨ UI moderne avec Tailwind CSS et particules animées

## 📋 Pré-requis

- Node.js 18+ 
- npm ou yarn
- Clé API Mistral AI (pour Voxtral)

## 🛠️ Installation

```bash
# Cloner le repo
git clone https://github.com/Blue-0/chatbotpresquaccident.git
cd chatbotpresquaccident

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés API
```

### Variables d'environnement requises

```bash
# .env.local
MISTRAL_API_KEY=your_mistral_api_key_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

## 🏃‍♂️ Démarrage

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Documentation technique

### Transcription audio (Voxtral)

Documentation complète: [`VOXTRAL_CLEAN.md`](./VOXTRAL_CLEAN.md)

**Architecture simplifiée:**
1. Utilisateur clique sur le micro 🎤
2. MediaRecorder capture l'audio
3. À l'arrêt, conversion WebM → WAV 16kHz mono
4. Envoi à l'API Voxtral de Mistral AI
5. Affichage du texte transcrit

**Changements récents:**
- ✅ Suppression du système temps réel (segments 1s)
- ✅ Transcription complète après enregistrement
- ✅ Code simplifié de 40%
- ✅ Architecture plus fiable et maintenable

Voir [`CLEANUP_SUMMARY.md`](./CLEANUP_SUMMARY.md) pour les détails.

### Tests

Guide de test complet: [`TEST_GUIDE.md`](./TEST_GUIDE.md)

**Tests essentiels:**
- ✅ Enregistrement basique (5-10s)
- ✅ Enregistrements courts et longs
- ✅ Multiple enregistrements successifs
- ✅ Animations Anime.js
- ✅ Gestion d'erreurs

### 🎬 Animations Voicewave

**Animation simple et élégante** du visualiseur audio :
- ✨ Fade in/out avec opacity
- 📐 Slide up/down avec translateY
- ⚡ 400ms apparition / 300ms disparition
- 🎯 Configuration inline ultra-simple

**Intégration** : Overlay sur l'input de chat pour remplacer visuellement le texte pendant l'enregistrement.

Documentation complète: [`app/components/AnimatedVoicewave.md`](./app/components/AnimatedVoicewave.md)

**Refactoring récent** : [`CLEAN_CODE_REFACTORING.md`](./CLEAN_CODE_REFACTORING.md)
- ✅ Code simplifié de 40%
- ✅ 4 fichiers supprimés
- ✅ Configuration inline
- ✅ Animation optimisée (opacity + translateY uniquement)

## 🏗️ Structure du projet

```
chatbotpresquaccident/
├── app/
│   ├── Chat/
│   │   └── page.tsx              # Page principale du chat
│   ├── api/
│   │   ├── chat/route.ts         # API route pour le chat IA
│   │   └── voxtral/route.ts      # API route pour Voxtral transcription
│   ├── Login/
│   │   └── page.tsx              # Page de connexion
│   └── layout.tsx                # Layout principal
├── src/
│   ├── components/
│   │   ├── Particles.tsx         # Particules animées background
│   │   └── ui/                   # Composants UI (shadcn)
│   └── lib/
│       └── animations.ts         # Helpers Anime.js
├── VOXTRAL_CLEAN.md              # 📖 Documentation Voxtral complète
├── CLEANUP_SUMMARY.md            # 📋 Résumé des changements
└── TEST_GUIDE.md                 # 🧪 Guide de test
```

## 🎨 Technologies utilisées

- **Framework**: Next.js 15.5.2 (App Router)
- **UI**: React 19.1.0 + TypeScript
- **Styling**: Tailwind CSS 3.4.1
- **Animations**: Anime.js 4.2.0
- **Auth**: NextAuth.js
- **IA**: Mistral AI (Voxtral pour transcription)
- **Audio**: Web Audio API + MediaRecorder API

## 🔧 Scripts disponibles

```bash
npm run dev          # Démarrer en développement
npm run build        # Build pour production
npm run start        # Démarrer en production
npm run lint         # Linter ESLint
```

## 📦 Dépendances principales

```json
{
  "next": "^15.5.2",
  "react": "^19.1.0",
  "animejs": "^4.2.0",
  "next-auth": "^4.24.11",
  "marked": "^15.0.6",
  "tailwindcss": "^3.4.1"
}
```

## 🧪 Workflow de développement

1. **Développer** sur une branche feature
2. **Tester** avec le guide [`TEST_GUIDE.md`](./TEST_GUIDE.md)
3. **Lint** avec `npm run lint`
4. **Build** avec `npm run build` pour vérifier
5. **Commit** avec messages clairs
6. **Merge** après review

## 🐛 Débogage

### Problèmes courants

**Transcription ne fonctionne pas:**
- Vérifier `MISTRAL_API_KEY` dans `.env.local`
- Vérifier permission microphone accordée
- Consulter console browser pour erreurs

**Erreur "Unable to decode audio data":**
- Parler plus longtemps (> 2 secondes)
- Vérifier connexion internet stable

**Build échoue:**
- Vérifier `npm install` complet
- Vérifier Node.js version >= 18
- Supprimer `.next` et rebuild

### Logs utiles

La console affiche des logs émojis pour faciliter le debug:
- 🎤 Enregistrement
- 🔄 Conversion/Transcription
- ✅ Succès
- ⚠️ Avertissement
- ❌ Erreur

## 📝 Contributions

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Auteurs

- Blue-0 - Développement initial

## 🙏 Remerciements

- Mistral AI pour l'API Voxtral
- Vercel pour Next.js
- shadcn pour les composants UI
- Julian Garnier pour Anime.js

## 📞 Support

Pour toute question ou problème:
1. Consulter la documentation technique
2. Vérifier les issues GitHub existantes
3. Créer une nouvelle issue si nécessaire

## 🔄 Changelog

### v2.0.0 (Oct 2025) - Simplification majeure
- ✅ Suppression système temps réel segments 1s
- ✅ Architecture transcription simplifiée
- ✅ Réduction code 40%
- ✅ Fiabilité améliorée
- 📖 Documentation complète créée

### v1.0.0 - Version initiale
- Chat avec assistant IA
- Transcription audio temps réel
- Authentification
- UI moderne

---

**Made with ❤️ using Next.js and Mistral AI**
