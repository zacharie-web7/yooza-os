# Yooza Avis : parcours connecté

La PWA existante conserve son apparence et découvre la configuration de son serveur à /avis-config. Si cette route est absente (404), elle reste en démonstration explicitement indiquée, avec clients fictifs et simulations. Une erreur réseau n’est pas présentée comme une démonstration réussie.

## Utilisation avec le backend

Le serveur doit servir ce dossier et l’API sur la même origine. Configuration : mode local ou google, apiBase et clientId Google public. Le mode local du pilote reste exclusivement sur 127.0.0.1. Le mode Google demande une identité Google professionnelle autorisée et conserve le jeton en mémoire; aucun jeton ni données métier dans localStorage. Une identité expirée renvoie à la connexion.

Le parcours ajoute les bons importés : liste paginée, PDF original et anciennes variantes, sources, corrections, sélection explicite d’un contact, confirmation des travaux, historique et aperçu. Les demandes sont préparées, jamais présentées comme envoyées. Un brouillon EML peut être téléchargé pour vérification et utilisation manuelle.

Les données structurées sont rendues avec textContent. Le service worker cache uniquement les ressources publiques de la PWA, jamais l’API ni les PDF. Le mode connecté ne mélange pas les clients V1 fictifs aux données du serveur.

## Recette du 13/10/2026

32 tests frontend, contrôles de syntaxe et parcours Chrome sur HP : import, correction, confirmation des suites, préparation, rechargement avec aperçu conservé; mobile 390 px sans débordement. Tests avec PDF et contact fictifs, aucun envoi. Revue indépendante conjointe avec le backend.

Le backend compagnon est zacharie-web7/yooza-os-backend, branche codex/avis-parcours-complet-20261013, migration 0008 et routes /api/v1/avis. Les deux dépôts composent la même livraison; aucune donnée client réelle n’est publiée dans ce dépôt public.

Connexion Google réelle et accès HTTPS au téléphone non vérifiés. Le pilote local permet déjà l’import et la préparation sur le HP; la configuration du véritable lien Google reste nécessaire pour préparer une demande destinée à un client.

## QR code des avis, 13/10/2026

Réglages affiche le QR du lien enregistré et permet son téléchargement PNG. L’aperçu d’une demande affiche le QR du lien contenu dans son message conservé, même si les réglages changent ensuite. Le brouillon EML reste textuel avec un lien cliquable; aucune image jointe ni aucun envoi automatique ajouté. Les PDF originaux ne sont pas modifiés.

Génération locale avec qrcode-generator 2.0.4, fichier dist/qrcode.js du paquet npm copié sans modification sous js/vendor et licence MIT conservée. SHA-256 : 79ec86f82856005b1c887905cfccfcfbec3821ca61c7fd5a952faa5f778f791c. Aucun service de QR tiers, abonnement ni redirection supplémentaire. Fond blanc, modules noirs, marge de quatre modules, correction Q, téléchargement en pixels entiers. Le service worker v2.1 cache les nouveaux scripts publics.

Recette HP : 32 tests frontend et syntaxe réussis; Chrome télécharge le PNG des réglages, un décodeur indépendant jsQR 1.4.0 vérifie l’URL à taille entière et moitié. QR de l’ancien brouillon fictif inchangé, mobile 390 px sans débordement. Le lien Google fourni est enregistré dans le pilote, sans nouvelle validation d’intervention ni demande client. L’accès HTTP au lien atteint le consentement Google Maps : la fiche et la saisie d’avis ne sont pas vérifiées dans une session Google connectée.
