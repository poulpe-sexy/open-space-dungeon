import type { EventDef } from './types';

/**
 * Traps use the same declarative shape as events: text + choices + effects.
 * Design contract: every choice has BOTH a cost AND a benefit (or a unique
 * trade-off), so the player faces a genuine decision rather than a pure
 * "best vs. worst" selection.
 */
export const TRAPS: Record<string, EventDef> = {
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

  // ─── Réunion infinie — chaque issue a maintenant un avantage ────────────────

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

  // ─── Tunnel de validation — le bon ordre coûte maintenant du MP ─────────────

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
};
