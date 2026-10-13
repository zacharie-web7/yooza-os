---
name: Yooza Avis
description: Le système visuel Yooza pour conserver, vérifier et préparer le retour client.
colors:
  yooza-yellow: "#FFE861"
  yooza-black: "#1E1E1C"
  yooza-anthracite: "#2F322D"
  yooza-cream: "#F9F9F5"
  avis-ink: "#1E1E1C"
  avis-muted: "#63635C"
  avis-line: "#E7E6DE"
  avis-surface: "#FFFFFF"
  avis-paper: "#F9F9F5"
  sidebar: "#1E1E1C"
  focus: "#746000"
  primary-hover: "#F3DA45"
  field-line: "#D1D1C3"
  warning-bg: "#FFF5CE"
  warning-text: "#785E0A"
  prepared-bg: "#EAF0E5"
  prepared-text: "#435E2E"
  completed-bg: "#EEF1EB"
  completed-text: "#4C6041"
  in-progress-bg: "#F1EAE3"
  in-progress-text: "#775C42"
  error-bg: "#FFF0EE"
  error-text: "#912D22"
typography:
  headline:
    fontFamily: "Roboto, sans-serif"
    fontSize: "29px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  body-operational:
    fontFamily: "Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  action:
    fontFamily: "Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  metric:
    fontFamily: "Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.02em"
rounded:
  badge: "6px"
  field: "7px"
  control: "8px"
  message: "10px"
  surface: "14px"
  dialog: "16px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.yooza-yellow}"
    textColor: "{colors.avis-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.avis-ink}"
  button-secondary:
    backgroundColor: "{colors.avis-surface}"
    textColor: "{colors.avis-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.avis-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
  field:
    backgroundColor: "{colors.avis-surface}"
    textColor: "{colors.avis-ink}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.avis-surface}"
    textColor: "{colors.avis-ink}"
    rounded: "{rounded.surface}"
    padding: "24px"
  badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-text}"
    rounded: "{rounded.badge}"
    padding: "5px 8px"
  badge-prepared:
    backgroundColor: "{colors.prepared-bg}"
    textColor: "{colors.prepared-text}"
    rounded: "{rounded.badge}"
    padding: "5px 8px"
  badge-completed:
    backgroundColor: "{colors.completed-bg}"
    textColor: "{colors.completed-text}"
    rounded: "{rounded.badge}"
    padding: "5px 8px"
  badge-in-progress:
    backgroundColor: "{colors.in-progress-bg}"
    textColor: "{colors.in-progress-text}"
    rounded: "{rounded.badge}"
    padding: "5px 8px"
---

# Design System: Yooza Avis

## Overview

**Creative North Star: "Le carnet d’intervention Yooza"**

Une identité d’entreprise précise, chaleureuse et sobre accompagne un espace de travail dense. Le logo officiel, le jaune Yooza et l’anthracite donnent les repères. Les grandes surfaces crème et blanches laissent les noms, les documents et les états prendre leur place.

Le système emploie une seule famille de caractères, des contours fins, des coins modérément arrondis et des icônes au trait. La marque apparaît dans les actions et la navigation plutôt que dans des effets décoratifs. La hiérarchie doit rester lisible aussi bien au bureau que sur un téléphone Android.

**Key Characteristics:**

- Jaune signature réservé aux actions principales et aux sélections importantes.
- Anthracite pour les repères de marque, crème pour le fond et blanc pour les zones de travail.
- Densité maîtrisée, libellés explicites et informations secondaires plus discrètes.
- Surfaces plates séparées par des contours et des écarts de ton.
- Une même information organisée selon l’espace disponible.

Cette documentation décrit le code après chargement de `yooza-avis/css/style.css`, puis de `yooza-avis/css/parcours.css`, et les composants de `yooza-avis/js/interface.js`. Les règles du parcours connecté priment sur les styles historiques de la démonstration. Les valeurs du frontmatter sont normatives pour ce système ; les détails non représentables dans ce format sont conservés dans `.impeccable/design.json`.

## Colors

La palette associe un jaune lumineux à des neutres chauds et peu saturés ; les états utilisent des teintes douces lisibles sur blanc.

### Primary

- **Jaune Yooza** (`yooza-yellow`) : action principale, navigation active et sélection de texte. Le survol du bouton principal utilise `primary-hover`.

### Neutral

- **Anthracite Yooza** (`yooza-black`) : couleur du thème, navigation, texte et notifications existantes. Le logo officiel reste l’autorité visuelle.
- **Anthracite de panneau** (`yooza-anthracite`) : introduction compacte de marque, plus claire que la navigation.
- **Crème Yooza** (`yooza-cream`) : fond de travail et barre supérieure.
- **Encre opérationnelle** (`avis-ink`) : rôle de texte et d’icône du parcours connecté, aligné sur l’anthracite Yooza.
- **Gris de lecture** (`avis-muted`) : descriptions, dates, passages sources et métadonnées.
- **Contour chaud** (`avis-line`) : séparateurs, tables, panneaux et contours discrets.
- **Blanc de travail** (`avis-surface`) : cartes, formulaires et documents.
- **Papier opérationnel** (`avis-paper`) : rôle de fond du parcours connecté, aligné sur le crème Yooza.
- **Anthracite de navigation** (`sidebar`) : rôle de fond du menu latéral connecté, aligné sur l’anthracite Yooza.
- **Olive de focus** (`focus`) : contour de focus clavier sur les surfaces claires.
- **Trait de champ** (`field-line`) : bordure des champs de vérification.

Les noms de rôle opérationnels restent distincts dans le frontmatter pour suivre les variables du code, mais reprennent les valeurs de l’identité confirmée. Modifier le code et cette documentation ensemble lorsque ces affectations changent.

### Semantic States

| État | Fond | Texte | Emploi |
|---|---|---|---|
| À vérifier | `warning-bg` | `warning-text` | Vérification humaine à effectuer |
| Demande préparée | `prepared-bg` | `prepared-text` | Brouillon conservé |
| Fin confirmée | `completed-bg` | `completed-text` | Fin des travaux confirmée |
| Travaux en cours | `in-progress-bg` | `in-progress-text` | Intervention non terminée |
| Erreur | `error-bg` | `error-text` | Action à reprendre avec explication |

**The Repère Rule.** Une couleur d’état accompagne toujours un libellé ; le point coloré ne porte jamais seul le sens.

## Typography

**Display Font:** Roboto, avec `sans-serif` en repli.
**Body Font:** Roboto, avec `sans-serif` en repli.

**Character:** Une typographie de travail régulière et directe. Le parcours connecté redéfinit la police des titres sur celle du corps ; l’ancien choix Arial des titres ne gouverne donc pas cette interface.

### Hierarchy

- **Headline** : titre de page compact et gras ; il descend à (25px) sur mobile. Le tableau de bord avec actualisation compacte emploie (24px) sous (550px). La fiche emploie une variante à (27px), ligne (1.3), puis (25px).
- **Title** : titre de carte au niveau normatif ; les sous-titres et les en-têtes de panneau emploient aussi (15px), puis (14px) sur les petites listes.
- **Body** : base du document ; le parcours utilise surtout le rôle `body-operational` et des variantes de (12–14px). Les descriptions sont limitées à (70ch), le corps d’un brouillon à (65ch).
- **Label** : libellés de formulaire. Métadonnées, en-têtes de table et badges descendent à (11px), jamais plus petit dans les nouveaux éléments du parcours.
- **Action** : boutons et actions de premier niveau, avec graisse (600).
- **Metric** : valeurs des compteurs, avec chiffres tabulaires ; variantes à (27px) sous (768px), puis (26px) sous (550px). Les dates et les compteurs des filtres utilisent également des chiffres tabulaires.

Les capitales espacées restent réservées aux petites étiquettes de marque et de document. Les noms, titres d’action, formulaires et onglets utilisent la casse habituelle du français.

**The Lecture Rule.** Le texte long conserve ses retours à la ligne et peut se couper dans les adresses ou les identifiants ; la troncature à deux lignes ne concerne que les résumés de travaux dans les listes.

## Layout

Le bureau combine une navigation latérale fixe (236px), une barre supérieure (76px) et un contenu centré occupant toute la largeur disponible, jusqu’à une largeur maximale de (1640px). Le contenu reçoit des marges intérieures de (34px 36px 48px). Sous (1250px), la navigation passe à (214px) et les marges horizontales à (26px).

Les panneaux ont généralement un rembourrage de (24px), les écarts entre colonnes de (20–25px). Les petites commandes et les lignes utilisent les pas d’espacement du frontmatter ; les espacements spécifiques aux compositions ne deviennent pas de nouveaux jetons globaux.

| Seuil observé | Changement du parcours connecté |
|---|---|
| À partir de 1500px | Rééquilibrage des colonnes de la table |
| Jusqu’à 1250px | Navigation et marges réduites, résumé des travaux retiré de la table, champs de la fiche sur une colonne |
| Jusqu’à 1020px | Colonnes de la fiche empilées, PDF sans position fixe ; panneaux latéraux du tableau de bord déplacés sous la liste |
| Jusqu’à 768px | Navigation escamotable, barre supérieure de 65px, réglages sur une colonne |
| Jusqu’à 550px | Listes sous forme de fiches, recherche et tri empilés, métriques compactes de 90px en grille de deux colonnes, onglets en grille de deux colonnes, logo officiel dans la barre supérieure |

Les champs et les enfants de grille acceptent une largeur minimale nulle afin que les informations longues ne forcent pas le débordement. Les principales actions et les champs ont une hauteur minimale de (44px). Les filtres passent de (40px) à (42px) sur petit écran. Les onglets mesurent (48px), puis (44px) dans la grille mobile.

La fiche place les données et le PDF côte à côte sur le grand bureau. Le PDF est alors un panneau collant à (100px) du haut. Le code ouvre son accordéon initialement dès (900px) ; sous ce seuil, il démarre fermé. Ce seuil comportemental est distinct du seuil de mise en page (1020px).

## Elevation & Depth

La profondeur repose sur les tons et les contours : les cartes, la barre supérieure et les boutons du parcours connecté n’ont pas d’ombre. Les ombres sont réservées aux surfaces flottantes, à la boîte d’import et aux notifications existantes.

### Shadow Vocabulary

- **Import flottant** (`0 18px 60px rgb(0 0 0 / .18)`) : boîte de dialogue d’import, sur un voile (`rgb(20 20 15 / .48)`).
- **Notification flottante** (`0 8px 24px rgba(30,30,28,0.14)`) : notification et éléments flottants historiques, issus de `--shadow-lg`.

Les ombres jaunes et les ornements des cartes statistiques de la démonstration historique ne constituent pas la règle des surfaces connectées.

**The Surface Rule.** Les zones de travail restent plates ; une ombre signale une couche flottante.

## Shapes

Les panneaux et le lecteur PDF adoptent les coins `surface`. Les commandes adoptent `control`, les champs `field`, les badges `badge`, les aperçus de message `message` et la boîte d’import `dialog`. Les éléments de progression et les points de statut sont circulaires. Éviter de transformer les actions ordinaires en pilules.

Les bordures sont fines (1px), les sources et les sections internes utilisent les mêmes contours chauds. Les icônes sont des SVG au trait, avec un tracé principal de (1.7px), des extrémités arrondies et une dimension usuelle de (19px) ; les icônes secondaires mesurent (15–17px).

## Components

### Buttons

Des commandes compactes, nommées par le résultat de l’action. Le bouton principal porte le jaune ; le secondaire reste blanc avec un contour discret, le discret conserve un fond transparent. Les états de survol changent le ton sans déplacer la commande. Les icônes accompagnent le texte avec un écart de (9px).

Le focus clavier utilise un contour de (3px), décalé de (3px). Un bouton indisponible reste visible avec une opacité de (.48) et le curseur adapté. Les boutons larges occupent toute la colonne dans les zones d’action mobiles. Une opération en cours remplace le libellé et peut afficher une roue de chargement.

### Chips

Les badges d’état associent un fond doux, un libellé de (11px) et un point de (5px). Ce sont des informations, pas des actions. Les filtres sont des boutons distincts avec un compteur ; leur sélection utilise un fond jaune pâle, un compteur plus soutenu et `aria-pressed`.

### Cards / Containers

Le panneau blanc est la primitive de travail : contour chaud, coins `surface`, rembourrage normatif et aucun relief. Son en-tête organise le titre et la description dans une première colonne, avec l’action dans une deuxième colonne. Le panneau de prochaine action utilise un jaune très pâle ; l’aperçu e-mail un blanc légèrement crème. L’introduction utilise l’anthracite de panneau ; sous (550px), sa description redondante est masquée et son rembourrage passe à (18px 20px). Ces variations signalent leur rôle sans créer un nouveau style de carte.

### Inputs / Fields

Les champs sont blancs, bordés et toujours associés à un libellé. La recherche ajoute une icône et place le focus sur le groupe complet : contour de (2px), décalé de (2px). Les champs de vérification ont une hauteur minimale de (44px), les zones de texte de (87px), avec redimensionnement vertical.

Les cases à cocher emploient un accent olive ; leur texte peut courir sur plusieurs lignes. Un champ désactivé reçoit un fond crème plus dense et un texte atténué. Les erreurs prennent la forme d’un panneau explicatif de couleur sémantique, sans déplacer le formulaire vers une autre surface.

### Navigation

La navigation latérale utilise le logo officiel fourni dans le dépôt. Les entrées mesurent au moins (48px), affichent un libellé et une icône, et se signalent en jaune lorsqu’elles sont actives. L’état par défaut est gris clair sur anthracite ; le survol éclaircit le texte et relève le fond. Le focus de ces entrées utilise le jaune Yooza afin de rester visible sur le fond sombre.

Sur mobile, le menu devient un tiroir de (250px) avec voile, ouvert depuis une commande tactile de (44px). Sous (550px), le logo officiel anthracite de (87px) remplace le titre dans la barre supérieure ; l’installation devient une commande à icône de (44px) avec un nom accessible. L’actualisation du tableau de bord suit ce même format compact de (44px), avec son propre nom accessible. Un lien d’évitement apparaît au focus pour rejoindre le contenu. Les notifications emploient une zone `aria-live="polite"`.

### Listes de bons

Le bureau présente une table avec en-têtes, client et numéro de bon, résumé, date, état et action d’ouverture nommée pour les technologies d’assistance. Le résumé est limité à deux lignes. Sur petit écran, chaque bon devient une fiche entière cliquable, avec le même nom, numéro, état, résumé et date. Le format mobile ne retire pas ces repères.

Recherche, tri, filtres avec compteurs et pagination restent groupés avec la liste. Le résultat annonce son nombre dans une zone de statut discrète ; un état vide donne une explication et une action utile.

### Métriques filtrables

Un ensemble de quatre boutons partage un conteneur bordé, avec de fins séparateurs. Chaque compteur comporte un libellé, une valeur tabulaire et une icône. Son activation mène à la liste filtrée correspondante ; son apparence reste celle d’un contrôle identifiable au survol et au clavier. Sous (550px), chaque zone conserve une hauteur minimale de (90px) avec un rembourrage de (14px 20px).

### Onglets et document original

Les quatre onglets — Vue d’ensemble, Vérification, Demande d’avis, Historique — gardent leurs libellés explicites. Sur bureau, la sélection est soulignée ; sur petit écran, elle devient une case blanche dans une grille crème. Le clavier utilise les flèches, Début et Fin, avec un seul onglet dans l’ordre de tabulation.

Le document original conserve un titre d’accordéon, les métadonnées du PDF, le lecteur et une ouverture du fichier original. Il reste adjacent à la lecture sur grand écran et accessible dans le flux sur mobile. Le signe d’ouverture complète le titre sans le remplacer.

### Aperçu de demande et QR

L’aperçu conserve les champs À et Objet, le corps complet et l’état « Préparé, non envoyé ». Le téléchargement du fichier EML est une action secondaire explicite. Le QR est rendu depuis le lien configuré, avec un lien lisible et une action de téléchargement ; les petits supports n’emploient jamais une image décorative pour le remplacer.

Les transitions de couleur durent (.18s) et la roue d’import (.8s) par tour. Le système annule animations, transitions et défilement fluide lorsque la préférence de réduction des mouvements est active.

## Do's and Don'ts

### Do:

- **Do** conserver le logo officiel et les trois couleurs d’identité Yooza, avec leurs rôles opérationnels documentés.
- **Do** employer le jaune pour les actions principales et les sélections importantes, avec un texte sombre.
- **Do** conserver les libellés des états, des actions et des champs en plus des icônes et des couleurs.
- **Do** garder un focus clavier visible et des commandes principales d’au moins 44px de hauteur.
- **Do** adapter l’organisation des données à la largeur disponible tout en préservant leurs repères essentiels.
- **Do** appliquer les styles du parcours connecté après la feuille historique et respecter la réduction des mouvements.

### Don't:

- **Don't** remplacer le logo par un texte ou un symbole dessiné.
- **Don't** réintroduire les ombres jaunes et les ornements des statistiques historiques dans les panneaux connectés.
- **Don't** utiliser le point de statut, la couleur ou une icône sans libellé comme unique information.
- **Don't** tronquer le corps d’un brouillon, les passages sources ou une information nécessaire à la vérification.
- **Don't** donner à une action indisponible le même état visuel qu’à une action disponible.
- **Don't** confondre les classes historiques de la démonstration avec les primitives actives du parcours connecté.
