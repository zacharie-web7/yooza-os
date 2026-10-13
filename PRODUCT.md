# Yooza Avis

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Zach et l’équipe Yooza vérifient des bons d’intervention au bureau et sur téléphone Android.

## Product Purpose

Conserver les PDF des interventions, vérifier leurs données et préparer une demande d’avis Google au bon client après confirmation de la fin des travaux. Tout envoi exige un aperçu exact et une confirmation explicite.

## Operating Context

Pilote local sur le HP, base PostgreSQL et API Yooza OS existantes. Agent 01 est l’hébergement final demandé; cette refonte concerne l’interface du pilote.

## Capabilities and Constraints

Import PDF manuel et Gmail en lecture seule, données conservées, dédoublonnage et variantes, extraction avec passages sources, corrections et vérification humaine. Recherche Teamleader avec choix explicite du client et de son e-mail. Préparation, téléchargement EML et envoi après aperçu exact et confirmation. Les états d’envoi vérifié ou incertain restent visibles sans répétition automatique. Le pilote autorise seulement les destinataires @yooza.be. Gmail, Teamleader et envoi nécessitent une configuration serveur; ces connexions permanentes sont absentes du HP et leur installation relève du point 4. Lien et QR Google configurables. Scans et signatures demandent une lecture visuelle. Ne pas confondre la démonstration publique avec les données du pilote.

## Brand Commitments

Nom Yooza Avis, logo officiel fourni par le dépôt, palette Yooza existante. L’utilisateur demande de retrouver puis dépasser la qualité de l’interface d’origine, tout en gardant les fonctions réellement raccordées. Reprise autonome autorisée jusqu’à livraison de la refonte.

## Evidence on Hand

Trois vrais bons précédemment comparés à l’extraction. Pour les captures publiables, utiliser exclusivement les fixtures nommées comme fictives et des adresses example.test. Ne pas inventer de statistiques d’avis reçus ou d’e-mails envoyés.

## Product Principles

- Une donnée extraite doit rester comparable au PDF original.
- Les états réels déterminent les actions disponibles.
- La recherche et les filtres servent le travail quotidien.
- La simplicité des écrans doit préserver la richesse utile des informations.
