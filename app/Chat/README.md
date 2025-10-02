# Chat Page - Clean Code Architecture

## 📁 Structure

Cette page a été refactorisée suivant les principes du clean code pour améliorer la maintenabilité et la testabilité.

### Composants (`/app/components/`)

- **`ChatHeader.tsx`** - En-tête de la page avec titre et bouton de déconnexion
- **`ChatMessage.tsx`** - Composant de message individuel avec bouton TTS
- **`ChatInput.tsx`** - Zone de saisie avec textarea auto-redimensionnable et boutons
- **`LoadingScreen.tsx`** - Écran de chargement réutilisable avec particles

### Hooks Personnalisés (`/app/hooks/`)

- **`useAudioRecording.ts`** - Gestion de l'enregistrement audio
  - `startRecording()` - Démarre l'enregistrement
  - `stopRecording()` - Arrête et retourne le Blob audio
  - `isRecording` - État d'enregistrement

- **`useTextToSpeech.ts`** - Synthèse vocale native du navigateur
  - `speak(content, id)` - Lance la lecture vocale
  - `isSpeaking` - ID du message en cours de lecture

- **`useSessionId.ts`** - Gestion de l'ID de session (existant)

### Services (`/app/services/`)

- **`chatService.ts`** - Logique métier du chat
  - `sendMessage()` - Envoie un message et retourne les réponses
  - `createUserMessage()` - Crée un message utilisateur
  - `createErrorMessage()` - Crée un message d'erreur
  - `INITIAL_MESSAGE` - Message d'accueil initial

- **`transcriptionService.ts`** - Service de transcription audio
  - `transcribeAudio(blob)` - Transcrit un Blob audio en texte

### Utilitaires (`/app/utils/`)

- **`audioConverter.ts`** - Conversion audio WebM vers WAV
  - `convertWebMToWav(blob)` - Convertit et resample l'audio

## 🎯 Principes Appliqués

### 1. **Séparation des Responsabilités (SRP)**
Chaque fichier a une responsabilité unique et bien définie.

### 2. **Extraction des Hooks Personnalisés**
Les logiques complexes sont extraites dans des hooks réutilisables :
- Enregistrement audio
- Synthèse vocale
- Gestion de session

### 3. **Composants Atomiques**
Les composants UI sont petits, réutilisables et testables indépendamment.

### 4. **Services Métier**
La logique métier est séparée des composants React :
- Communication API
- Transformation des données
- Gestion des messages

### 5. **Constants et Configuration**
Les valeurs magiques sont remplacées par des constantes nommées et configurables.

### 6. **Gestion d'État Simplifiée**
Le state est organisé et géré de manière cohérente avec des callbacks mémorisés.

### 7. **Type Safety**
Utilisation stricte de TypeScript avec des interfaces claires.

## 🔄 Flux de Données

```
User Input
    ↓
ChatInput Component
    ↓
handleSubmit (page.tsx)
    ↓
chatService.sendMessage()
    ↓
API Call (/api/chat)
    ↓
Update Messages State
    ↓
ChatMessage Component
    ↓
Render
```

## 🎤 Flux Audio

```
Mic Button Click
    ↓
useAudioRecording.startRecording()
    ↓
User speaks
    ↓
Stop Recording
    ↓
useAudioRecording.stopRecording() → Blob
    ↓
transcriptionService.transcribeAudio()
    ↓
audioConverter.convertWebMToWav()
    ↓
API Call (/api/voxtral)
    ↓
Update Input Message
```

## 🔊 Flux TTS

```
Speaker Button Click
    ↓
useTextToSpeech.speak()
    ↓
Extract Text from HTML
    ↓
Find French Voice
    ↓
Browser SpeechSynthesis API
    ↓
Update isSpeaking State
```

## 📦 Avantages

### Maintenabilité
- Code organisé par responsabilité
- Facile à comprendre et modifier
- Changements localisés

### Testabilité
- Composants isolés testables
- Services testables indépendamment
- Hooks testables avec React Testing Library

### Réutilisabilité
- Composants réutilisables
- Hooks réutilisables dans d'autres pages
- Services partagés

### Performance
- useCallback pour éviter les re-renders
- Composants optimisés
- État minimal

## 🚀 Améliorations Futures

1. **Tests Unitaires**
   - Tests des hooks
   - Tests des services
   - Tests des composants

2. **Gestion d'Erreur**
   - Error boundaries
   - Toast notifications
   - Retry logic

3. **Optimisations**
   - React.memo pour les composants
   - Virtualization pour les longs chats
   - Lazy loading des messages

4. **Accessibilité**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

5. **Internationalisation**
   - Messages multilingues
   - Format de dates localisé
