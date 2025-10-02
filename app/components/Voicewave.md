# Voicewave Component - Guide de Personnalisation

## 📊 Propriétés Disponibles

### Dimensions
```tsx
width={300}           // Largeur du canvas (px)
height={60}           // Hauteur du canvas (px)
```

### Barres - Style de Base
```tsx
barCount={40}         // Nombre de barres (plus = plus détaillé)
barWidth={5}          // Largeur de chaque barre (auto si non spécifié)
barGap={2}            // Espace entre les barres (px)
barColor="#43bb8c"    // Couleur des barres (hex, rgb, rgba)
```

### Barres - Hauteur et Animation
```tsx
barMinHeight={4}      // Hauteur minimale au repos (px)
barMaxHeight={0.8}    // Hauteur max relative (0-1, 1 = 100% du canvas)
sensitivity={1}       // Sensibilité de l'animation (0.5-2)
```

### Barres - Forme
```tsx
style="rounded"       // Style: 'bars' | 'rounded' | 'line'
barRadius={2}         // Rayon des coins arrondis (px, si style='rounded')
```

### Fond
```tsx
backgroundColor="rgba(255,255,255,0.1)"  // Couleur de fond
showBackground={false}                   // Afficher le fond
```

## 🎨 Exemples Visuels

### Style 1: Moderne (Défaut)
```tsx
<Voicewave
  isRecording={isRecording}
  audioStream={audioStream}
  width={300}
  height={60}
  barColor="#43bb8c"
  barCount={40}
  barGap={2}
  barRadius={3}
  style="rounded"
  sensitivity={1}
/>
```
✨ Barres arrondies, espacées, fluide

---

### Style 2: Minimaliste Lignes
```tsx
<Voicewave
  isRecording={isRecording}
  audioStream={audioStream}
  width={400}
  height={50}
  barColor="#000000"
  barCount={60}
  barGap={4}
  style="line"
  barMinHeight={2}
  sensitivity={1.2}
/>
```
📊 Lignes fines, nombreuses, style épuré

---

### Style 3: Barres Classiques
```tsx
<Voicewave
  isRecording={isRecording}
  audioStream={audioStream}
  width={350}
  height={80}
  barColor="#f76565"
  barCount={30}
  barGap={3}
  style="bars"
  barMinHeight={6}
  barMaxHeight={0.9}
  sensitivity={0.8}
/>
```
🎵 Barres rectangulaires, moins sensibles, style audio classique

---

### Style 4: Dégradé avec Fond
```tsx
<Voicewave
  isRecording={isRecording}
  audioStream={audioStream}
  width={500}
  height={70}
  barColor="#6366f1"
  backgroundColor="rgba(99, 102, 241, 0.1)"
  showBackground={true}
  barCount={50}
  barGap={1}
  barRadius={4}
  style="rounded"
  sensitivity={1.5}
/>
```
🌈 Fond coloré, très sensible, nombreuses barres

---

### Style 5: Compact et Dense
```tsx
<Voicewave
  isRecording={isRecording}
  audioStream={audioStream}
  width={200}
  height={40}
  barColor="#10b981"
  barCount={80}
  barGap={0}
  barWidth={2}
  barRadius={1}
  style="rounded"
  barMinHeight={2}
  sensitivity={1.3}
/>
```
⚡ Très dense, compact, ultra-réactif

---

### Style 6: Large et Épais
```tsx
<Voicewave
  isRecording={isRecording}
  audioStream={audioStream}
  width={400}
  height={100}
  barColor="#f59e0b"
  barCount={20}
  barGap={8}
  barWidth={12}
  barRadius={6}
  style="rounded"
  barMinHeight={8}
  barMaxHeight={0.85}
  sensitivity={0.9}
/>
```
💪 Grosses barres, bien espacées, imposant

---

## 🎯 Recommandations par Usage

### Pour un Chat (comme actuellement)
```tsx
<Voicewave
  width={300}
  height={60}
  barColor="#43bb8c"
  barCount={40}
  barGap={2}
  barRadius={3}
  style="rounded"
  sensitivity={1}
/>
```

### Pour un Podcast/Enregistrement Long
```tsx
<Voicewave
  width={600}
  height={80}
  barColor="#8b5cf6"
  barCount={100}
  barGap={1}
  style="line"
  sensitivity={1.2}
/>
```

### Pour un Style iOS/Apple
```tsx
<Voicewave
  width={280}
  height={50}
  barColor="#007AFF"
  barCount={50}
  barGap={2}
  barRadius={8}
  style="rounded"
  barMinHeight={3}
  sensitivity={0.9}
/>
```

### Pour un Style Android/Material
```tsx
<Voicewave
  width={320}
  height={64}
  barColor="#6200EE"
  backgroundColor="rgba(98, 0, 238, 0.08)"
  showBackground={true}
  barCount={45}
  barGap={2}
  style="bars"
  sensitivity={1.1}
/>
```

## 🎨 Palettes de Couleurs Populaires

```tsx
// Vert (actuel)
barColor="#43bb8c"

// Bleu Professionnel
barColor="#3b82f6"

// Rouge/Rose Dynamique
barColor="#f43f5e"

// Violet Moderne
barColor="#8b5cf6"

// Orange Énergique
barColor="#f97316"

// Dégradé (nécessite modification du composant)
// À venir: support des gradients
```

## ⚡ Astuces Performance

- **Plus de barres** (barCount > 60) = Plus de détails mais plus de calculs
- **Sensitivity** entre 0.8-1.5 pour un bon équilibre
- **barMaxHeight** à 0.8 évite que les barres touchent les bords
- **style="line"** est le plus léger en performance

## 🔧 Personnalisation Dynamique

Vous pouvez changer les props dynamiquement :

```tsx
const [visualStyle, setVisualStyle] = useState<'bars' | 'rounded' | 'line'>('rounded');

<Voicewave
  style={visualStyle}
  barColor={theme === 'dark' ? '#43bb8c' : '#059669'}
  sensitivity={userVolume}
/>
```
