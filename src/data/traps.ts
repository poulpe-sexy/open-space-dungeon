import type { EventDef } from './types';

/**
 * Traps use the same declarative shape as events: text + choices + effects.
 * They typically feature a mandatory damage branch (can't just walk away)
 * and a risky "disarm" choice. Kept minimal for MVP — expand freely.
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
        label: 'Foncer (-4 PV, traverse vite)',
        log: 'Tu passes en force. Quelque chose pète dans un rack.',
        effect: { hpDelta: -4 },
      },
      {
        label: 'Démêler patiemment (-2 MP, sûr)',
        log: 'Tu extirpes le bon câble comme un·e ninja IT.',
        effect: { mpDelta: -2 },
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
        label: 'Avancer en traînant les pieds (-6 PV)',
        log: 'ZAP. Tu sens tes cheveux se dresser.',
        effect: { hpDelta: -6 },
      },
      {
        label: 'Sauter en rythme (0 PV, cringe)',
        log: 'Tu traverses en bondissant. Personne ne t\u2019a vu, promis.',
      },
    ],
  },

  // ─── Nouvelles épreuves absurdes — favor Marine (Choc / physique) ───────────

  reunion_infinie: {
    id: 'reunion_infinie',
    title: 'Réunion infinie',
    text:
      'Tu es pris·e dans une réunion. L\u2019ordre du jour dit « Tour de table » '
      + 'et recommence à chaque tour.',
    recommendedHero: 'Choc',
    choices: [
      {
        label: 'Forcer la porte (-5 PV, immédiat)',
        log: 'BANG. Tu sors. Les regards pèsent mais tu respires enfin.',
        effect: { hpDelta: -5 },
      },
      {
        label: 'Rester poli·e et attendre (-3 MP)',
        log: 'Tu survis par politesse. Le temps fait son œuvre, l\u2019esprit s\u2019étiole.',
        effect: { mpDelta: -3 },
      },
    ],
  },

  // ─── Tunnel de validation — enrichi, ordre logique Lisible→Validé→Conforme ──

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
        label: 'Tamponner dans l\u2019ordre : Lisible → Validé → Conforme',
        log:
          'Chaque feuille passe dans le bon ordre. Au bout du tunnel, '
          + 'un tampon net t\u2019attend sur un pupitre — propre, décisif. '
          + 'Tu le glisses dans ta poche.',
        effect: { grantRewardItemId: 'tampon_net' },
      },
      {
        label: 'Signer tout sans lire (-4 PV, rapide)',
        log:
          'Tu signes à l\u2019arrache. Au bout du tunnel, quelqu\u2019un t\u2019applaudit, perplexe.',
        effect: { hpDelta: -4 },
      },
      {
        label: 'Lire chaque feuille (-2 MP, propre mais lent)',
        log: 'Tu valides avec rigueur. Petite migraine, conscience claire.',
        effect: { mpDelta: -2 },
      },
    ],
  },
};
