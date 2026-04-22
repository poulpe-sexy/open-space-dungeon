import type { EventDef } from './types';

export const EVENTS: Record<string, EventDef> = {
  coffee_machine: {
    id: 'coffee_machine',
    title: 'Machine à café runique',
    text: 'Une vieille machine gronde dans le couloir. Un gobelet tremble sur le plateau.',
    choices: [
      {
        label: 'Prendre un expresso (+3 MP)',
        log: 'Tu bois. C\u2019est brûlant mais ça clarifie l\u2019esprit.',
        effect: { mpDelta: 3 },
      },
      {
        label: 'Prendre un déca (+4 PV)',
        log: 'Étonnamment réconfortant. Tu respires.',
        effect: { hpDelta: 4 },
      },
      { label: 'Ignorer', log: 'Tu passes. La machine soupire.' },
    ],
  },

  mystery_memo: {
    id: 'mystery_memo',
    title: 'Mémo non lu',
    text: 'Un mémo imprimé traîne au sol. En-tête "STRICTEMENT CONFIDENTIEL".',
    choices: [
      {
        label: 'Lire (+2 MP, -2 PV)',
        log: 'Tu comprends trop de choses d\u2019un coup. Migraine, mais illumination.',
        effect: { mpDelta: 2, hpDelta: -2 },
      },
      { label: 'Laisser', log: 'Tu le reposes. Certaines vérités attendent.' },
    ],
  },

  pep_talk: {
    id: 'pep_talk',
    title: 'Motivational poster',
    text: 'Un poster affiche "TOGETHER WE SHIP". Tu sens une vague d\u2019énergie douteuse.',
    choices: [
      {
        label: 'Respirer à fond (+3 PV, +1 MP)',
        log: 'Le cringe devient ta force.',
        effect: { hpDelta: 3, mpDelta: 1 },
      },
      { label: 'Détourner le regard', log: 'Tu ne céderas pas.' },
    ],
  },

  // ─── Standup éternel — event social, approches hero-typées ─────────────────

  standup_eternel: {
    id: 'standup_eternel',
    title: 'Stand-up éternel',
    text:
      'Le stand-up dure depuis 47 minutes. Le manager vient de demander « et côté perso, des news ? » '
      + 'Tu aperçois trois stratégies de sortie.',
    choices: [
      {
        label: 'Lancer un BLOQUANT et sortir (+2 PV, -1 MP)',
        log: 'Tu abats ta carte. L\u2019équipe hoche la tête. Tu passes la porte avant le prochain tour de table.',
        effect: { hpDelta: 2, mpDelta: -1 },
      },
      {
        label: 'Raconter une anecdote tangentielle (+2 MP, -1 PV)',
        log: 'Ton histoire dévie le fil. Le manager sourit. Tu en profites pour filer discrètement.',
        effect: { mpDelta: 2, hpDelta: -1 },
      },
      {
        label: 'Attendre en silence jusqu\u2019à la fin (+3 PV, +1 MP)',
        log: 'La réunion finit. Tu avais raison d\u2019attendre — deux décisions importantes sont tombées à la fin.',
        effect: { hpDelta: 3, mpDelta: 1 },
      },
      {
        label: 'Quitter sans un mot',
        log: 'Personne ne remarque. C\u2019est un signe.',
      },
    ],
  },

  // ─── Slack maudit — enrichi avec Casque anti-ping ──────────────────────────

  slack_maudit: {
    id: 'slack_maudit',
    title: 'Slack maudit',
    text:
      'Un canal #urgent clignote. 47 messages non-lus. Le dernier : « ping @here il y a 2 s ».',
    recommendedHero: 'Roublard',
    choices: [
      {
        label: 'Réagir 👀 (désamorcer, +1 MP)',
        log: 'La notif se calme. Tu as répondu sans répondre. Art délicat.',
        effect: { mpDelta: 1 },
      },
      {
        label: 'Lire tout le fil (-3 PV, +2 MP)',
        log: 'Tu absorbes 20 minutes de drama. Migraine, mais tu as tout le contexte.',
        effect: { hpDelta: -3, mpDelta: 2 },
      },
      {
        label: 'Passer en mode Ne pas déranger',
        log: 'Silence. Paix. Tu trouves dans le tiroir un casque anti-ping qui traîne depuis 2022.',
        effect: { grantRewardItemId: 'casque_anti_ping' },
      },
      {
        label: 'Marquer comme lu sans ouvrir',
        log: 'Geste de pouvoir. La culpabilité monte en silence.',
        effect: { hpDelta: -1 },
      },
    ],
  },

  // ─── Comité des plantes — event (déplacé depuis traps), reward feuille_cadrage ─

  comite_plantes: {
    id: 'comite_plantes',
    title: 'Comité des plantes vertes',
    text:
      'Sept ficus en cercle délibèrent en silence. L\u2019air est dense, végétal. '
      + 'Un post-it sur le plus grand ficus indique : « ODJ : périmètre projet ».',
    recommendedHero: 'Choc',
    choices: [
      {
        label: 'Parler aux plantes du projet',
        log:
          'Tu exposes le périmètre, l\u2019objectif, les contraintes. Les ficus inclinent leurs feuilles. '
          + 'Sur le bureau voisin, une feuille de cadrage apparaît — propre, lisible.',
        effect: { grantRewardItemId: 'feuille_cadrage' },
      },
      {
        label: 'Passer en force (-4 PV)',
        log: 'Une branche te frappe dans le dos. Pas cool. Mais tu passes.',
        effect: { hpDelta: -4 },
      },
      {
        label: 'Attendre la fin du comité (-2 MP)',
        log: 'Ça dure. Tu vieillis. Ils finissent par te laisser passer, sans un mot.',
        effect: { mpDelta: -2 },
      },
    ],
  },
};
