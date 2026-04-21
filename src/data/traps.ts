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
      'Un enchevêtrement de câbles RJ45 et d’alimentations bloque le passage. ' +
      'Un néon grésille juste au-dessus.',
    choices: [
      {
        label: 'Foncer (-3 PV, traverse vite)',
        log: 'Tu passes en force. Quelque chose pète dans un rack.',
        effect: { hpDelta: -3 },
      },
      {
        label: 'Démêler patiemment (-1 MP, sûr)',
        log: 'Tu extirpes le bon câble comme un·e ninja IT.',
        effect: { mpDelta: -1 },
      },
    ],
  },
  floor_shock: {
    id: 'floor_shock',
    title: 'Moquette statique',
    text:
      'La moquette grise est chargée. Chaque pas crépite. Un panneau serveur ' +
      'vrombit dans le mur.',
    choices: [
      {
        label: 'Avancer en traînant les pieds (-5 PV)',
        log: 'ZAP. Tu sens tes cheveux se dresser.',
        effect: { hpDelta: -5 },
      },
      {
        label: 'Sauter en rythme (0 PV, cringe)',
        log: 'Tu traverses en bondissant. Personne ne t’a vu, promis.',
      },
    ],
  },

  // ─── Nouvelles épreuves absurdes — favor Marine (Choc / physique) ───

  reunion_infinie: {
    id: 'reunion_infinie',
    title: 'Réunion infinie',
    text: 'Tu es pris·e dans une réunion. L’ordre du jour dit « Tour de table » et recommence à chaque tour.',
    recommendedHero: 'Choc',
    choices: [
      {
        label: 'Forcer la porte (-4 PV, immédiat)',
        log: 'BANG. Tu sors. Les regards pèsent mais tu respires enfin.',
        effect: { hpDelta: -4 },
      },
      {
        label: 'Rester poli·e et attendre (-3 MP)',
        log: 'Tu survis par politesse. Le temps fait son œuvre, l’esprit s’étiole.',
        effect: { mpDelta: -3 },
      },
    ],
  },

  tunnel_validation: {
    id: 'tunnel_validation',
    title: 'Tunnel de validation',
    text: 'Un couloir étroit. À chaque pas, une feuille t’est tendue : « À valider ». Il y en a déjà cinq dans ta main.',
    recommendedHero: 'Choc',
    choices: [
      {
        label: 'Signer tout sans lire (-3 PV, rapide)',
        log: 'Tu signes à l’arrache. Au bout du tunnel, quelqu’un t’applaudit, perplexe.',
        effect: { hpDelta: -3 },
      },
      {
        label: 'Lire chaque feuille (-2 MP, propre)',
        log: 'Tu valides avec rigueur. Petite migraine, conscience claire.',
        effect: { mpDelta: -2 },
      },
    ],
  },

  comite_plantes: {
    id: 'comite_plantes',
    title: 'Comité des plantes vertes',
    text: 'Sept ficus en cercle. Ils ne bougent pas, mais ils délibèrent. L’air est lourd, végétal.',
    recommendedHero: 'Choc',
    choices: [
      {
        label: 'Passer en force (-3 PV)',
        log: 'Une branche te frappe dans le dos. Pas cool. Mais tu passes.',
        effect: { hpDelta: -3 },
      },
      {
        label: 'Attendre la fin du comité (-2 MP)',
        log: 'Ça dure. Tu vieillis. Ils finissent par te laisser passer, sans un mot.',
        effect: { mpDelta: -2 },
      },
    ],
  },
};
