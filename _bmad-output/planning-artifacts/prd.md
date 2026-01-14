

## User Journeys

### 1. Utilisateur Final : "L'Agent Pressé" (Focus Non-Régression)
**Persona:** Agent de terrain ou employé, souvent en mouvement, peu de temps pour des tâches administratives.
**Situation:** Vient de témoigner d'un presque-accident ou d'un risque sécurité.
**But:** Signaler l'incident le plus rapidement possible (moins de 30 secondes) et reprendre son travail.

**Narrative Journey:**
1.  **Ouverture:** L'agent sort son téléphone et ouvre "Agent Secu". L'authentification est transparente (session persistante).
2.  **Action:** Il appuie immédiatement sur le bouton "Micro" central bien visible.
3.  **Interaction:** Il dicte : "Attention, il y a une fuite d'eau près de la zone de charge des chariots."
4.  **Feedback:** L'application transcrit sa voix en texte en temps réel ou quasi-réel. Il voit le texte s'afficher.
5.  **Clôture:** Il valide l'envoi ou répond à une question de précision de l'IA ("Est-ce balisé ?"). Il reçoit une confirmation et range son téléphone.

**Risques Refactoring:**
*   Augmentation de la latence au démarrage de l'app.
*   Perte de la session utilisateur.
*   Problème d'initiation du matériel audio (micro).

### 2. Développeur : "Le Mainteneur Zen" (Focus Architecture)
**Persona:** Développeur Full-stack reprenant le projet pour maintenance ou évolution.
**Situation:** Doit ajouter un nouveau champ de métadonnée aux incidents.
**But:** Implémenter le changement rapidement sans introduire de bugs collatéraux.

**Narrative Journey:**
1.  **Exploration:** Il ouvre le projet. La structure des dossiers est explicite (`services/`, `components/`, `hooks/`).
2.  **Modification:**
    *   Il localise le modèle de données centralisé (pas dispersé dans l'UI).
    *   Il modifie le composant UI formulaire qui est découplé de la logique d'appel API.
3.  **Validation:** Il lance `npm run test`. Les tests unitaires et E2E confirment que le changement n'a pas cassé le flux audio ou l'auth.
4.  **Déploiement:** Il pousse son code en production avec confiance.

## Journey Requirements Summary

De ces parcours découlent les exigences techniques suivantes :

*   **Performance:** Le "Time to Interactive" doit rester sous les 1s pour l'agent.
*   **Robustesse:** L'authentification et l'accès micro doivent être couverts par des tests automatisés robustes.
*   **Modularité:** Le code doit être structuré pour permettre à un développeur de modifier une partie (UI) sans impacter l'autre (Logique).

## Domain-Specific Requirements

### Technical Constraints (Browser & Hardware)

*   **Audio API Compatibility:** L'abstraction de la logique audio dans des services/hooks doit préserver la gestion spécifique des navigateurs (ex: contraintes de l'`AudioContext` sur iOS qui nécessite une interaction utilisateur explicite).
*   **Permissions Sandboxing:** Le refactoring ne doit pas interférer avec le modèle de permission du navigateur pour le microphone.

### Security & Privacy

*   **Secret Management:** La réorganisation des fichiers ne doit jamais exposer de variables d'environnement (Clés Mistral, NextAuth Secret) côté client (Browser). Les appels API vers Voxtral doivent rester proxifiés par le backend Next.js.
*   **Data Minimization:** Les logs ajoutés pour le débogage ne doivent pas contenir de données audio brutes ou de PII (Personnellement Identifiable Information) des utilisateurs.

### Architecture Patterns

*   **State Consistency:** L'état de l'interface (Enregistrement en cours, Transcodage, Envoi) doit être géré via une machine à état finie ou un contexte global robuste pour éviter les états incohérents (ex: bouton "Stop" actif alors que l'enregistrement est fini).
*   **Error Handling:** Chaque couche (Service, Hook, UI) doit avoir une stratégie de remontée d'erreur standardisée. Une erreur API doit être traduite en message utilisateur compréhensible ("Connexion instable" vs "500 Internal Server Error").
