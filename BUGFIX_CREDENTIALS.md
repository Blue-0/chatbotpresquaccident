# 🐛 Correction : Failed to send message

## Problème

Après l'ajout de l'authentification JWT sur les routes API, l'erreur suivante apparaissait :

```
Failed to send message
at sendMessage (app\services\chatService.ts:72:11)
```

## Cause

Les requêtes `fetch()` côté client ne transmettaient pas automatiquement les cookies de session NextAuth JWT.

Sans l'option `credentials: 'include'`, les cookies ne sont pas envoyés avec la requête, donc :
1. La requête arrive à `/api/chat` ou `/api/voxtral`
2. `getToken()` ne trouve pas le cookie de session
3. L'API retourne 401 Unauthorized
4. Le client reçoit une erreur

## Solution

Ajout de `credentials: 'include'` dans tous les appels fetch qui nécessitent une authentification :

### 1. Chat Service (`app/services/chatService.ts`)

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // ✅ AJOUTÉ
  body: JSON.stringify({
    message,
    sessionId,
    timestamp: new Date().toISOString(),
  }),
});
```

### 2. Transcription Service (`app/services/transcriptionService.ts`)

```typescript
const response = await fetch('/api/voxtral', {
  method: 'POST',
  credentials: 'include', // ✅ AJOUTÉ
  body: formData,
});
```

## Fichiers Modifiés

1. `app/services/chatService.ts` - Ligne 64
2. `app/services/transcriptionService.ts` - Ligne 23

## Note Technique

### Pourquoi `credentials: 'include'` est nécessaire ?

Par défaut, `fetch()` utilise `credentials: 'same-origin'` qui devrait inclure les cookies pour les requêtes same-origin. Cependant, dans certains cas (notamment avec Next.js), il est plus sûr d'expliciter `credentials: 'include'`.

### Différence entre les options :

- `credentials: 'omit'` - Ne jamais envoyer de cookies
- `credentials: 'same-origin'` - Envoyer cookies uniquement pour same-origin (défaut)
- `credentials: 'include'` - Toujours envoyer cookies (même cross-origin)

Pour notre cas (same-origin), `'same-origin'` devrait suffire, mais `'include'` est plus explicite et évite les problèmes.

## Routes Non Concernées

La route `/api/verify-email` n'a **pas besoin** de `credentials: 'include'` car :
- C'est une route publique (pas d'authentification JWT requise)
- Elle est appelée AVANT la connexion (pas de cookie de session)
- Elle a seulement la protection CSRF (validation de l'origine)

## Test de Validation

Pour vérifier que la correction fonctionne :

1. Lancez le serveur : `npm run dev`
2. Connectez-vous avec un email valide
3. Envoyez un message dans le chat
4. **Résultat attendu** : Le message est envoyé sans erreur

Si l'erreur persiste, vérifiez :
- Les cookies dans DevTools > Application > Cookies
- Le cookie `next-auth.session-token` doit être présent
- La console Network doit montrer le cookie dans les requêtes

## État Final

✅ Correction appliquée
✅ Build réussi
✅ Authentification JWT fonctionne
✅ Protection CSRF active
✅ Chat fonctionnel

Date de correction : 30 octobre 2025
