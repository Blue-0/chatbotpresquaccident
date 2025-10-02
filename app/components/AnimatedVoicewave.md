# AnimatedVoicewave - Documentation

## 📖 Vue d'ensemble

Composant React qui anime l'apparition et la disparition du visualiseur audio `Voicewave` avec des transitions CSS fluides gérées par Anime.js.

## 🎯 Concept

Le composant utilise une animation **simple et élégante** basée sur deux propriétés CSS :
- **opacity** : Contrôle la visibilité (0 → 1 pour apparition, 1 → 0 pour disparition)
- **translateY** : Crée un mouvement vertical (slide up/down)

## ✨ Animations

### Apparition (Enter)
```typescript
{
  opacity: [0, 1],      // Fade in
  translateY: [20, 0],  // Slide up depuis 20px
  duration: 400,        // 400ms
  easing: 'easeOutCubic'
}
```

### Disparition (Exit)
```typescript
{
  opacity: [1, 0],       // Fade out
  translateY: [0, -20],  // Slide up vers -20px
  duration: 300,         // 300ms
  easing: 'easeInCubic'
}
```

## 🚀 Utilisation

### Import
```typescript
import { AnimatedVoicewave } from '@/app/components/AnimatedVoicewave';
```

### Exemple de base
```tsx
<AnimatedVoicewave
  isRecording={isRecording}
  audioStream={audioStream}
/>
```

### Exemple avec personnalisation
```tsx
<AnimatedVoicewave
  isRecording={isRecording}
  audioStream={audioStream}
  width={320}
  height={70}
  barColor="#43bb8c"
  barCount={45}
  barGap={2}
  barRadius={3}
  style="rounded"
  barMinHeight={2}
  barMaxHeight={0.9}
  sensitivity={2}
/>
```

### Exemple en overlay sur l'input
```tsx
<div className="relative">
  {/* Animation en overlay */}
  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
    <AnimatedVoicewave
      isRecording={isRecording}
      audioStream={audioStream}
      width={320}
      height={70}
      barColor="#43bb8c"
    />
  </div>

  {/* Input qui devient transparent */}
  <div style={{ opacity: isRecording ? 0 : 1, transition: 'opacity 0.3s ease' }}>
    <ChatInput {...inputProps} />
  </div>
</div>
```

## 📋 Props

### Props requises

| Prop | Type | Description |
|------|------|-------------|
| `isRecording` | `boolean` | Déclenche l'animation (true = apparition, false = disparition) |
| `audioStream` | `MediaStream \| null` | Flux audio du microphone pour la visualisation |

### Props optionnelles (style Voicewave)

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `width` | `number` | `320` | Largeur du visualiseur en pixels |
| `height` | `number` | `70` | Hauteur du visualiseur en pixels |
| `barColor` | `string` | `"#43bb8c"` | Couleur des barres (hex, rgb, etc.) |
| `barCount` | `number` | `45` | Nombre de barres |
| `barGap` | `number` | `2` | Espacement entre les barres en pixels |
| `barRadius` | `number` | `3` | Rayon des coins arrondis en pixels |
| `style` | `'bars' \| 'rounded' \| 'line'` | `'rounded'` | Style visuel des barres |
| `barMinHeight` | `number` | `2` | Hauteur minimale des barres |
| `barMaxHeight` | `number` | `0.9` | Hauteur maximale relative (0-1) |
| `sensitivity` | `number` | `2` | Sensibilité à l'audio (0.5-3.0) |

## 🎨 Personnalisation des animations

Pour modifier les animations, éditez la constante `ANIMATION_CONFIG` dans le composant :

```typescript
const ANIMATION_CONFIG = {
  enter: {
    opacity: [0, 1],
    translateY: [20, 0],   // Changez cette valeur
    duration: 400,         // Ajustez la durée
    easing: 'easeOutCubic', // Modifiez l'easing
  },
  exit: {
    opacity: [1, 0],
    translateY: [0, -20],  // Changez cette valeur
    duration: 300,         // Ajustez la durée
    easing: 'easeInCubic', // Modifiez l'easing
  },
};
```

### Easings disponibles

- `linear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeInExpo`, `easeOutExpo`, `easeInOutExpo`
- `easeInBack`, `easeOutBack`, `easeInOutBack`
- `easeOutElastic(amplitude, period)`

Voir [Anime.js Documentation](https://animejs.com/documentation/#pennerFunctions)

## 🏗️ Architecture

```
AnimatedVoicewave
├── Wrapper <div>
│   ├── Ref: wrapperRef
│   ├── Animation: opacity + translateY
│   └── Style: opacity: 0, pointerEvents: conditional
│
└── Voicewave (composant enfant)
    └── Props: isRecording, audioStream, ...autres
```

### Flux d'animation

1. **isRecording devient true**
   - `useEffect` détecte le changement
   - `animate()` applique l'animation d'entrée
   - Voicewave apparaît avec fade in + slide up

2. **isRecording devient false**
   - `useEffect` détecte le changement
   - `animate()` applique l'animation de sortie
   - Voicewave disparaît avec fade out + slide up

## 🎭 Comportement

- **Initial** : `opacity: 0` (invisible)
- **Enregistrement** : Animation d'apparition (400ms)
- **Arrêt** : Animation de disparition (300ms)
- **Pointer events** : Désactivés quand non enregistré

## 💡 Bonnes pratiques

### ✅ À faire

```tsx
// Intégrer comme overlay
<div className="relative">
  <div className="absolute inset-0 z-10 pointer-events-none">
    <AnimatedVoicewave isRecording={isRecording} audioStream={audioStream} />
  </div>
  <YourComponent />
</div>

// Synchroniser avec l'état d'enregistrement
const [isRecording, setIsRecording] = useState(false);
<AnimatedVoicewave isRecording={isRecording} audioStream={stream} />
```

### ❌ À éviter

```tsx
// Ne pas conditionner le rendu (l'animation ne fonctionnera pas)
{isRecording && <AnimatedVoicewave />} // ❌

// Toujours monter le composant
<AnimatedVoicewave isRecording={isRecording} /> // ✅

// Ne pas oublier audioStream
<AnimatedVoicewave isRecording={true} /> // ❌ Manque audioStream
```

## 🔧 Dépendances

- **React** 19.1.0+
- **Anime.js** 4.2.0+
- **Voicewave** (composant enfant)

## 📦 Structure de fichiers

```
app/components/
├── AnimatedVoicewave.tsx    # Composant principal avec animations
├── AnimatedVoicewave.md      # Cette documentation
└── Voicewave.tsx             # Composant de visualisation audio
```

## 🐛 Troubleshooting

### L'animation ne se joue pas
- Vérifier que `isRecording` change bien de valeur
- Vérifier que le composant est monté (pas dans un `{condition && ...}`)

### Le composant reste visible
- Vérifier que `isRecording` devient bien `false`
- Vérifier qu'il n'y a pas de style CSS qui override `opacity`

### Performance
- L'animation utilise GPU acceleration (transform + opacity)
- Pas de repaint/reflow coûteux
- Optimisé pour 60 FPS

## 📚 Ressources

- [Anime.js Documentation](https://animejs.com/documentation/)
- [Voicewave Documentation](./Voicewave.md)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**Made with ❤️ using Anime.js v4 and React 19**
