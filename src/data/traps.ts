import type { EventDef } from './types';

/**
 * Traps — obstacles ponctuels à traverser.
 *
 * Design contract :
 *   - Chaque choix doit avoir un coût ET un avantage (pas de choix purement
 *     gratuit ni purement punitif).
 *   - Les choix « physiques » (Choc) coûtent en PV ; les choix « méthodiques »
 *     (Sage) coûtent en MP ; les choix « agiles » (Roublard) coûtent un peu
 *     des deux mais de façon optimisée.
 *   - Tous les héros peuvent tenter tous les choix. `recommendedHero` est un
 *     indice contextuel, pas une restriction.
 *   - Valeurs typiques : perte PV entre −2 et −5, perte MP entre −1 et −3,
 *     gain PV entre +1 et +3, gain MP entre +1 et +2.
 */
export const TRAPS: Record<string, EventDef> = {

  // ── Pièges existants ─────────────────────────────────────────────────────

  cable_snare: {
    id: 'cable_snare',
    title: 'Nœud de câbles',
    text:
      'Un enchevêtrement de câbles RJ45 et d\u2019alimentations bloque le passage. '
      + 'Un néon grésille juste au-dessus.',
    choices: [
      {
        label: 'Foncer (-3 PV, +1 MP)',
        log: 'Tu passes en force. Adrénaline. Quelque chose pète dans un rack, mais tu es déjà loin.',
        effect: { hpDelta: -3, mpDelta: 1 },
      },
      {
        label: 'Démêler patiemment (-2 MP, +2 PV)',
        log: 'Tu extirpes le bon câble comme un·e ninja IT. Satisfaction incompréhensible.',
        effect: { mpDelta: -2, hpDelta: 2 },
      },
    ],
  },

  floor_shock: {
    id: 'floor_shock',
    title: 'Moquette statique',
    text:
      'La moquette grise est chargée. Chaque pas crépite. Un panneau serveur '
      + 'vrombit dans le mur.',
    choices: [
      {
        label: 'Avancer en traînant les pieds (-5 PV, +2 MP)',
        log: 'ZAP. La décharge te traverse — mais quelque chose se clarifie brutalement dans ta tête.',
        effect: { hpDelta: -5, mpDelta: 2 },
      },
      {
        label: 'Sauter en rythme (-1 MP)',
        log: 'Tu traverses en bondissant. Ça demande de la concentration. Personne ne t\u2019a vu, promis.',
        effect: { mpDelta: -1 },
      },
    ],
  },

  reunion_infinie: {
    id: 'reunion_infinie',
    title: 'Réunion infinie',
    text:
      'Tu es pris·e dans une réunion. L\u2019ordre du jour dit « Tour de table » '
      + 'et recommence à chaque tour.',
    recommendedHero: 'Choc',
    choices: [
      {
        label: 'Forcer la porte (-5 PV, +2 MP)',
        log: 'BANG. Tu sors. Les regards pèsent — mais l\u2019adrénaline de la fuite compense.',
        effect: { hpDelta: -5, mpDelta: 2 },
      },
      {
        label: 'Rester poli·e et attendre (-3 MP, +2 PV)',
        log: 'Tu survis par politesse. Tu entends deux informations utiles. L\u2019esprit s\u2019étiole, mais le corps repose.',
        effect: { mpDelta: -3, hpDelta: 2 },
      },
    ],
  },

  tunnel_validation: {
    id: 'tunnel_validation',
    title: 'Tunnel de validation',
    text:
      'Un couloir étroit. À chaque pas, une feuille t\u2019est tendue : « À valider ». '
      + 'Il y en a déjà cinq dans ta main. Trois tampons traînent au sol : '
      + '« Lisible », « Validé », « Conforme ».',
    recommendedHero: 'Choc',
    choices: [
      {
        label: 'Tamponner dans l\u2019ordre : Lisible → Validé → Conforme (-2 MP)',
        log:
          'Chaque feuille passe dans le bon ordre — ça prend du souffle. Au bout du tunnel, '
          + 'un tampon net t\u2019attend sur un pupitre — propre, décisif. '
          + 'Tu le glisses dans ta poche.',
        effect: { mpDelta: -2, grantRewardItemId: 'tampon_net' },
      },
      {
        label: 'Signer tout sans lire (-3 PV, +1 MP)',
        log:
          'Tu signes à l\u2019arrache. Au bout du tunnel, quelqu\u2019un t\u2019applaudit, perplexe. L\u2019adrénaline passe.',
        effect: { hpDelta: -3, mpDelta: 1 },
      },
      {
        label: 'Lire chaque feuille (-2 MP, +1 PV)',
        log: 'Tu valides avec rigueur. Petite migraine, conscience claire — et une légère fierté.',
        effect: { mpDelta: -2, hpDelta: 1 },
      },
    ],
  },

  // ── Nouveaux pièges ──────────────────────────────────────────────────────

  /**
   * Piège physique — zone open_space / salles_reu / direction.
   * Choc avantagé (bloquer), Roublard avantagé (esquiver), Sage avantagé (guider).
   */
  chaise_roulettes: {
    id: 'chaise_roulettes',
    title: 'Chaise à roulettes possédée',
    text:
      'Une chaise de bureau fonce dans le couloir à pleine vitesse. '
      + 'Elle tourne légèrement. Elle te vise.',
    choices: [
      {
        label: 'Esquiver de justesse (-2 PV, +1 MP)',
        log: 'Elle frôle ta cheville. Adrénaline. Tu rebondis, tu continues.',
        effect: { hpDelta: -2, mpDelta: 1 },
      },
      {
        label: 'Bloquer avec le corps (-4 PV, +2 MP)',
        log: 'Tu absorbes l\u2019impact. La chaise s\u2019arrête. Le couloir te regarde avec respect.',
        effect: { hpDelta: -4, mpDelta: 2 },
      },
      {
        label: 'La guider vers un mur (-2 MP, +2 PV)',
        log: 'Tu poses les mains dessus au bon moment. Impact contrôlé, trajectoire corrigée. Propre.',
        effect: { mpDelta: -2, hpDelta: 2 },
      },
    ],
  },

  /**
   * Piège administratif — zone technique / direction.
   * Roublard avantagé (bluff), Sage avantagé (lecture), Choc avantagé (force).
   */
  scanner_demoniaque: {
    id: 'scanner_demoniaque',
    title: 'Scanner démoniaque',
    text:
      'Un scanner fixe posé en travers du couloir. Écran : '
      + '« Document conforme, signé, lisible, validé, certifié. Veuillez présenter. »',
    recommendedHero: 'Roublard',
    choices: [
      {
        label: 'Forcer le mécanisme (-4 PV, +1 MP)',
        log: 'Tu jettes un document dans la fente. Il refuse. Tu forces. Il craque. Tu passes.',
        effect: { hpDelta: -4, mpDelta: 1 },
      },
      {
        label: 'Répondre « conforme et signé » avec aplomb (-2 PV, +2 MP)',
        log: 'Il hésite. Tu maintiens le regard. Il laisse passer — un peu déçu, toi galvanisé·e.',
        effect: { hpDelta: -2, mpDelta: 2 },
      },
      {
        label: 'Lire attentivement la logique du scanner (-1 MP, +2 PV)',
        log: 'Il cherche un QR code dans le coin inférieur gauche. Tu en trouves un sur ton badge. Bingo.',
        effect: { mpDelta: -1, hpDelta: 2 },
      },
    ],
  },

  /**
   * Piège de surcharge — zone open_space / salles_reu.
   * Sage avantagé (méthode), Roublard avantagé (contournement), Choc avantagé (arrachage).
   */
  avalanche_postit: {
    id: 'avalanche_postit',
    title: 'Avalanche de post-it',
    text:
      'Tu effleurés un coin de mur. Un millier de post-its jaunes '
      + 's\u2019abattent en cascade agile.',
    choices: [
      {
        label: 'Arracher frénétiquement (-3 PV, +1 MP)',
        log: 'Coupures de papier partout. Le toner vole. Tu traverses quand même.',
        effect: { hpDelta: -3, mpDelta: 1 },
      },
      {
        label: 'Décoller méthodiquement (-2 MP, +2 PV)',
        log: 'Tu reconstruis la pile dans le bon ordre. Satisfaction procédurale maximale.',
        effect: { mpDelta: -2, hpDelta: 2 },
      },
      {
        label: 'Contourner en rasant le mur d\u2019en face (-1 PV, -1 MP)',
        log: 'Tu patauges à moitié dedans. C\u2019est collant et désorientant, mais tu passes.',
        effect: { hpDelta: -1, mpDelta: -1 },
      },
    ],
  },

  /**
   * Piège environnemental — zone salles_reu / technique / direction.
   * Sage avantagé (interprétation), Roublard avantagé (synchronisation), Choc avantagé (rush).
   */
  neon_conformite: {
    id: 'neon_conformite',
    title: 'Néon de la conformité',
    text:
      'Un néon rouge et blanc clignote selon un rythme inconnu. Panneau : '
      + '« Accès réservé aux collaborateurs alignés avec le process ».',
    choices: [
      {
        label: 'Traverser vite en apnée (-3 PV, +1 MP)',
        log: 'Il crépite. Tu passes. L\u2019alignement saigne légèrement, l\u2019adrénaline reste.',
        effect: { hpDelta: -3, mpDelta: 1 },
      },
      {
        label: 'Couper l\u2019alimentation (-2 MP, +2 PV)',
        log: 'Tu trouves le disjoncteur dans l\u2019angle. Ça s\u2019éteint. Passage libre, calme absolu.',
        effect: { mpDelta: -2, hpDelta: 2 },
      },
      {
        label: 'Synchroniser le passage sur le rythme (-1 MP, +1 PV)',
        log: 'Tu attends le bon intervalle lumineux. Tu glisses entre deux clignotements. Élégant.',
        effect: { mpDelta: -1, hpDelta: 1 },
      },
    ],
  },

  /**
   * Piège de déplacement — zone accueil / open_space.
   * Roublard avantagé (surf), Sage avantagé (lenteur), Choc avantagé (foncer).
   */
  sol_cire: {
    id: 'sol_cire',
    title: 'Sol fraîchement ciré',
    text:
      'Un panneau « SOL MOUILLÉ » gît au sol, renversé, inutile. '
      + 'Le couloir brille comme un miroir administratif.',
    recommendedHero: 'Roublard',
    choices: [
      {
        label: 'Avancer très lentement (-1 MP, +1 PV)',
        log: 'Petits pas. Concentration totale. Tu arrives. Personne ne t\u2019a vu souffrir.',
        effect: { mpDelta: -1, hpDelta: 1 },
      },
      {
        label: 'Foncer (-3 PV, +2 MP)',
        log: 'Tu glisses, tu chutes, tu continues sur le ventre. Adrénaline maximale.',
        effect: { hpDelta: -3, mpDelta: 2 },
      },
      {
        label: 'Surfer sur la glissade (-1 PV, +2 MP)',
        log: 'Tu lâches prise. La physique devient ton alliée. Presque classe.',
        effect: { hpDelta: -1, mpDelta: 2 },
      },
    ],
  },

  /**
   * Piège mécanique — zone open_space / salles_reu / technique.
   * Sage avantagé (commande), Choc avantagé (arrachage), Roublard avantagé (couper).
   */
  imprimante_infinie: {
    id: 'imprimante_infinie',
    title: 'Imprimante à formulaire infini',
    text:
      'Une imprimante au milieu du couloir crache des feuilles en boucle. '
      + 'La pile monte à la cheville. Elle monte au genou.',
    choices: [
      {
        label: 'Arracher les feuilles à deux mains (-3 PV, +1 MP)',
        log: 'Coupures. Toner sur les doigts. Tu traverses. Le bruit continue derrière toi.',
        effect: { hpDelta: -3, mpDelta: 1 },
      },
      {
        label: 'Débrancher l\u2019alimentation (-2 MP, +2 PV)',
        log: 'Tu cherches le câble. Tu le tires. Le silence est beau. La pile reste.',
        effect: { mpDelta: -2, hpDelta: 2 },
      },
      {
        label: 'Trouver « Annuler toutes les tâches » (-1 MP, +3 PV)',
        log: 'Le bon bouton existait. Il était juste caché sous un post-it. Tu passes dans un calme absolu.',
        effect: { mpDelta: -1, hpDelta: 3 },
      },
    ],
  },

  /**
   * Piège de contrôle — zone technique / direction.
   * Roublard avantagé (badge imaginaire), Sage avantagé (négociation), Choc avantagé (force).
   */
  portique_alignement: {
    id: 'portique_alignement',
    title: 'Portique d\u2019alignement',
    text:
      'Un portique d\u2019entreprise scanne chaque passant. '
      + 'Écran : « Êtes-vous aligné avec la vision stratégique ? »',
    recommendedHero: 'Roublard',
    choices: [
      {
        label: 'Forcer le portique (-4 PV, +1 MP)',
        log: 'L\u2019alarme retentit. Tu passes quand même. Les vigiles arrivent trop tard.',
        effect: { hpDelta: -4, mpDelta: 1 },
      },
      {
        label: 'Négocier avec l\u2019écran (-2 MP, +2 PV)',
        log: 'Tu expliques ta valeur au capteur. Il cède, légèrement confus. Victoire de la rhétorique.',
        effect: { mpDelta: -2, hpDelta: 2 },
      },
      {
        label: 'Présenter un badge imaginaire avec conviction (-1 MP)',
        log:
          'Tu gestes comme si tu badgeais. Le portique s\u2019ouvre. Il croyait en toi. '
          + 'Dans la poche tu retrouves un laissez-passer B38 — tu ne sais pas depuis quand il est là.',
        effect: { mpDelta: -1, grantRewardItemId: 'laissez_passer' },
      },
    ],
  },

  /**
   * Piège absurde — zone accueil / salles_reu / direction.
   * Sage avantagé (isolation), Roublard avantagé (documentation), Choc avantagé (nettoyage).
   */
  gobelet_maudit: {
    id: 'gobelet_maudit',
    title: 'Le Gobelet renversé maudit',
    text:
      'Un gobelet de café traîne au bord d\u2019un plan de travail. '
      + 'Tu croises son regard. Il tombe.',
    choices: [
      {
        label: 'Nettoyer immédiatement (-2 PV, +2 MP)',
        log: 'Chaud. Ça brûle les doigts. L\u2019adrénaline de la crise te pousse vers l\u2019avant.',
        effect: { hpDelta: -2, mpDelta: 2 },
      },
      {
        label: 'Sauter par-dessus la flaque (-1 PV, +1 MP)',
        log: 'Acrobatique. Partiellement réussi. Tu retombes de l\u2019autre côté, légèrement galvanisé·e.',
        effect: { hpDelta: -1, mpDelta: 1 },
      },
      {
        label: 'Isoler la zone avec des post-its (-2 MP, +3 PV)',
        log: 'Tu délimites proprement. Ça prend du temps mais tu maîtrises la situation. Satisfaction du damage control.',
        effect: { mpDelta: -2, hpDelta: 3 },
      },
      {
        label: 'Documenter le désastre (-1 MP, +1 PV)',
        log: 'Photo, rapport d\u2019incident, timestamp. Tu te sens au-dessus de la situation. Légèrement.',
        effect: { mpDelta: -1, hpDelta: 1 },
      },
    ],
  },
};
