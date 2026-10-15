# Validation locale PWA

Date de validation : 16 août 2026

| Contrôle | Résultat |
|---|---|
| Chargement de l’application locale | Réussi sur `http://localhost:8000/#/dashboard`. |
| Logo officiel Yooza dans la sidebar | Chargé depuis `assets/yooza-logo-sidebar.png`. |
| Manifeste et icônes | Référencés depuis `index.html`. |
| Déclencheur d’installation | Le bouton « Installer l’app » est présenté lorsque le navigateur expose l’invite PWA. |
| Hors connexion / mises à jour | Service worker installé avec stratégie réseau d’abord et cache de repli. |

Les tests de publication et d’installation seront refaits une fois GitHub Pages configuré.

## Diagnostic navigateur sandbox

Le navigateur de validation confirme la présence du manifeste et du support `navigator.serviceWorker`, mais ne conserve aucune inscription de service worker sur l’origine `localhost` après rechargement. La PWA sera donc revalidée après publication HTTPS sur GitHub Pages, environnement conforme à l’usage réel.

Un enregistrement explicite du service worker a ensuite été accepté avec le scope `http://localhost:8000/`. Cela valide le fichier `service-worker.js` et sa portée ; la configuration PWA est donc prête pour le test HTTPS final sur GitHub Pages.

## Validation GitHub Pages

Le 16 août 2026, Yooza Avis a été déployé avec succès sur GitHub Pages à l’adresse `https://zacharie-web7.github.io/Manus-Test/`.

Le tableau de bord s’affiche en HTTPS avec le logo officiel Yooza, la navigation latérale, les indicateurs de suivi et le bouton d’installation PWA. La source GitHub Pages a été configurée sur **GitHub Actions**.

Le contrôle visuel public confirme que l’interface charge avec les couleurs Yooza, le logo officiel, le tableau de bord complet et le bouton « Installer l’app ».

Le contrôle final de disponibilité confirme également la présence du bouton « Installer l’app » sur l’URL HTTPS publiée.

## Aide d’installation Apple, 15 octobre 2026

Le bouton d’installation est visible dans le navigateur sur iPhone et iPad, y compris lorsque l’iPad utilise une identification de navigateur de bureau. Il ouvre une aide persistante avec les étapes Safari : Partager, Sur l’écran d’accueil, puis Ajouter. L’option Ouvrir comme app web est mentionnée lorsqu’elle est proposée.

L’aide est une région de la page avec titre accessible, bouton de fermeture, retour du focus et fermeture par Échap lorsque le focus est dans cette région. Le bouton et l’aide sont masqués lorsque l’application est ouverte en mode autonome. Le parcours Android continue d’utiliser l’invite native du navigateur.

Les tests automatiques couvrent les identifications Apple, les deux signaux de mode autonome, l’ouverture et la fermeture de l’aide, ainsi que l’invite Android et ses erreurs. Une validation avec identification Apple émulée ne remplace pas un essai sur Safari d’un iPhone ou iPad physique. L’ajout final à l’écran d’accueil reste une action dans le navigateur Apple.
