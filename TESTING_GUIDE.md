# 🧪 Guide de Test - Améliorations de Sécurité

Ce guide vous aidera à vérifier que toutes les améliorations de sécurité fonctionnent correctement.

---

## 🏁 Pré-requis

1. Assurez-vous que les dépendances sont installées :
```bash
npm install
```

2. Vérifiez que le build fonctionne :
```bash
npm run build
```

3. Lancez le serveur de développement :
```bash
npm run dev
```

---

## ✅ Tests de Sécurité

### Test 1 : Protection XSS (CRITIQUE)

**Objectif :** Vérifier que le HTML malveillant est sanitizé

**Étapes :**
1. Connectez-vous à l'application
2. Envoyez un message au chatbot
3. Modifiez manuellement la réponse du webhook n8n pour inclure :
   ```html
   <img src=x onerror="alert('XSS')">
   <script>alert('XSS')</script>
   ```

**Résultat attendu :**
- ✅ Les tags `<script>` sont supprimés
- ✅ L'attribut `onerror` est supprimé
- ✅ Aucune alerte JavaScript ne s'affiche
- ✅ Le contenu texte est affiché de manière sécurisée

**Vérification dans DevTools :**
```javascript
// Ouvrir la console et vérifier que le HTML est sanitizé
document.querySelector('.text-sm.leading-relaxed').innerHTML
// Ne devrait pas contenir de <script> ou d'attributs d'événement
```

---

### Test 2 : Injection SQL Airtable (CRITIQUE)

**Objectif :** Vérifier que les requêtes Airtable sont sécurisées

**Étapes :**
1. Sur la page de login, essayez ces emails malveillants :
   - `test@example.com" OR {mail} != ""`
   - `test@example.com" AND {name} = "admin`
   - `test@example.com\n{mail}`

**Résultat attendu :**
- ✅ Tous les caractères spéciaux sont échappés
- ✅ Aucune injection ne fonctionne
- ✅ Seul un email valide dans Airtable permet la connexion
- ✅ Message d'erreur : "Email non autorisé" pour les tentatives d'injection

**Vérification dans les logs :**
```bash
# Vérifier que la formule Airtable utilise LOWER()
# et que les caractères spéciaux sont échappés
```

---

### Test 3 : Authentification sur API (ÉLEVÉ)

**Objectif :** Vérifier que les API nécessitent une authentification

**Étapes :**
1. Ouvrez DevTools > Network
2. Sans être connecté, essayez d'appeler les API :

```javascript
// Test /api/chat sans authentification
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'test', sessionId: '123' })
}).then(r => r.json()).then(console.log);

// Test /api/voxtral sans authentification
const formData = new FormData();
formData.append('audio', new Blob(['test']));
fetch('/api/voxtral', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log);
```

**Résultat attendu :**
- ✅ Réponse HTTP 401 Unauthorized
- ✅ Message : "Non autorisé - Authentification requise"

---

### Test 4 : Génération Sécurisée d'ID de Session (ÉLEVÉ)

**Objectif :** Vérifier que les IDs de session sont cryptographiquement sécurisés

**Étapes :**
1. Ouvrez DevTools > Console
2. Supprimez le sessionId du localStorage :
```javascript
localStorage.removeItem('sessionId');
```
3. Rechargez la page
4. Vérifiez le nouveau sessionId :
```javascript
localStorage.getItem('sessionId');
```

**Résultat attendu :**
- ✅ L'ID fait 32 caractères (hexadécimal)
- ✅ Il est impossible de prédire la valeur
- ✅ Format : `a1b2c3d4e5f6...` (hexadécimal uniquement)

**Vérification :**
```javascript
const sessionId = localStorage.getItem('sessionId');
console.log('Length:', sessionId.length); // Devrait être 32
console.log('Is hex:', /^[0-9a-f]{32}$/.test(sessionId)); // Devrait être true
```

---

### Test 5 : Headers de Sécurité (ÉLEVÉ)

**Objectif :** Vérifier que tous les headers de sécurité sont présents

**Étapes :**
1. Ouvrez DevTools > Network
2. Rechargez la page
3. Cliquez sur la requête principale (document)
4. Allez dans l'onglet "Headers"

**Résultat attendu :**
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Content-Security-Policy: ...` (présent)
- ✅ `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- ✅ `Permissions-Policy: camera=(), microphone=(self), geolocation=()`

**Vérification automatique :**
```javascript
// Ouvrir la console et exécuter :
const headers = performance.getEntriesByType('navigation')[0];
// Vérifier dans DevTools > Network > Headers
```

---

### Test 6 : Protection CSRF (ÉLEVÉ)

**Objectif :** Vérifier que les requêtes cross-origin sont bloquées

**Étapes :**
1. Créez un fichier HTML local `test-csrf.html` :

```html
<!DOCTYPE html>
<html>
<body>
  <script>
    // Tentative d'appel depuis une autre origine
    fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test', sessionId: '123' })
    })
    .then(r => r.json())
    .then(console.log)
    .catch(console.error);
  </script>
</body>
</html>
```

2. Ouvrez ce fichier dans votre navigateur (`file:///...`)
3. Vérifiez les erreurs dans la console

**Résultat attendu :**
- ✅ HTTP 403 Forbidden
- ✅ Message : "Origine non autorisée - Requête bloquée"
- ✅ Les requêtes depuis votre domaine autorisé fonctionnent normalement

---

### Test 7 : Cookies Sécurisés NextAuth

**Objectif :** Vérifier que les cookies de session sont sécurisés

**Étapes :**
1. Connectez-vous à l'application
2. Ouvrez DevTools > Application > Cookies
3. Cherchez les cookies next-auth

**Résultat attendu :**
- ✅ Cookie `next-auth.session-token` présent
- ✅ Attribut `HttpOnly` activé (non accessible via JavaScript)
- ✅ Attribut `Secure` activé en production
- ✅ Attribut `SameSite` configuré

**Vérification :**
```javascript
// Cette commande devrait retourner undefined ou vide
document.cookie.includes('next-auth.session-token');
// false = bon (HttpOnly empêche l'accès JavaScript)
```

---

## 🔍 Tests de Non-Régression

### Test A : Fonctionnalité Chat

**Étapes :**
1. Connectez-vous avec un email valide
2. Envoyez un message texte
3. Enregistrez un message vocal
4. Écoutez la réponse en TTS

**Résultat attendu :**
- ✅ Tous les messages s'affichent correctement
- ✅ L'audio est transcrit correctement
- ✅ Le TTS fonctionne
- ✅ L'interface reste réactive

---

### Test B : Authentification

**Étapes :**
1. Essayez de vous connecter avec un email non autorisé
2. Essayez de vous connecter avec un email valide
3. Essayez d'accéder à `/Chat` sans être connecté
4. Déconnectez-vous et vérifiez la redirection

**Résultat attendu :**
- ✅ Email non autorisé : erreur affichée
- ✅ Email valide : connexion réussie
- ✅ Sans auth : redirection vers `/Login`
- ✅ Déconnexion : redirection vers `/Login`

---

## 🛠️ Outils de Test Automatisés

### Vérification des Headers (en ligne)

1. Visitez : https://securityheaders.com/
2. Entrez l'URL de votre application
3. Vérifiez le score

**Score attendu :** A ou A+ (après déploiement en production)

---

### Scan de Vulnérabilités

```bash
# Vérifier les dépendances
npm audit

# Résultat attendu : 0 vulnerabilities
```

---

### Vérification TypeScript

```bash
# Vérifier qu'il n'y a pas d'erreurs TypeScript
npm run build

# Résultat attendu : ✓ Compiled successfully
```

---

## 📊 Checklist de Validation

Avant de déployer en production, vérifiez que :

- [ ] Tous les tests de sécurité passent
- [ ] `npm audit` ne montre aucune vulnérabilité
- [ ] Le build réussit sans erreurs
- [ ] Les fonctionnalités de chat fonctionnent
- [ ] L'authentification fonctionne correctement
- [ ] Les headers de sécurité sont présents
- [ ] Les secrets ne sont PAS dans le code (`.env` dans `.gitignore`)
- [ ] La documentation est à jour

---

## 🚨 En Cas de Problème

### Problème : DOMPurify ne fonctionne pas côté serveur

**Solution :** DOMPurify nécessite un DOM. La fonction `sanitizeHTML()` détecte l'environnement et ne sanitize que côté client.

---

### Problème : CORS bloque les requêtes légitimes

**Solution :** Vérifiez que `NEXTAUTH_URL` dans `.env.local` correspond à votre domaine :
```bash
NEXTAUTH_URL=http://localhost:3000  # ou votre domaine en production
```

---

### Problème : Les tests CSRF échouent en développement

**Solution :** La validation CSRF autorise automatiquement localhost en mode développement. Vérifiez `NODE_ENV` :
```javascript
console.log(process.env.NODE_ENV); // devrait être "development"
```

---

## 📝 Rapport de Test

Après avoir exécuté tous les tests, remplissez ce tableau :

| Test | Status | Notes |
|------|--------|-------|
| XSS Protection | ⬜ PASS / ❌ FAIL | |
| Injection SQL | ⬜ PASS / ❌ FAIL | |
| Auth API | ⬜ PASS / ❌ FAIL | |
| Session ID | ⬜ PASS / ❌ FAIL | |
| Headers | ⬜ PASS / ❌ FAIL | |
| CSRF | ⬜ PASS / ❌ FAIL | |
| Cookies | ⬜ PASS / ❌ FAIL | |
| Chat | ⬜ PASS / ❌ FAIL | |
| Auth Flow | ⬜ PASS / ❌ FAIL | |

---

**Note :** Si un test échoue, consultez `SECURITY_IMPROVEMENTS.md` pour vérifier que toutes les modifications ont été appliquées correctement.
