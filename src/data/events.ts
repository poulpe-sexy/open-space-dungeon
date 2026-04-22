import type { EventDef } from './types';

export const EVENTS: Record<string, EventDef> = {
  coffee_machine: {
    id: 'coffee_machine',
    title: 'Machine à café runique',
    text: 'Une vieille machine gronde dans le couloir. Un gobelet tremble sur le plateau.',
    choices: [
      {
        label: 'Prendre un expresso (+3 MP, -1 PV)',
        log: 'Tu bois. C\u2019est brûlant, le cœur s\u2019emballe. Clarté immédiate, légère tachycardie.',
        effect: { mpDelta: 3, hpDelta: -1 },
      },
      {
        label: 'Prendre un déca (+3 PV, -1 MP)',
        log: 'Réconfortant. Tu décélères. L\u2019esprit s\u2019apaise — peut-être un peu trop.',
        effect: { hpDelta: 3, mpDelta: -1 },
      },
      {
        label: 'Ignorer (+1 PV)',
        log: 'Tu passes. Discipline récompensée : tu gardes le fil.',
        effect: { hpDelta: 1 },
      },
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
      {
        label: 'Laisser (+1 PV)',
        log: 'Tu le reposes. Certaines vérités attendent — et l\u2019ignorance est parfois reposante.',
        effect: { hpDelta: 1 },
      },
    ],
  },

  pep_talk: {
    id: 'pep_talk',
    title: 'Motivational poster',
    text: 'Un poster affiche "TOGETHER WE SHIP". Tu sens une vague d\u2019énergie douteuse.',
    choices: [
      {
        label: 'Respirer à fond (+4 PV, -1 MP)',
        log: 'Tu absorbes le cringe. Il devient ta force. Le corp va mieux, l\u2019âme en paye le prix.',
        effect: { hpDelta: 4, mpDelta: -1 },
      },
      {
        label: 'Détourner le regard (+2 MP)',
        log: 'Tu ne céderas pas. La résistance forge la concentration.',
        effect: { mpDelta: 2 },
      },
    ],
  },

  // ─── Standup éternel — choix rééquilibrés, plus de dominance ────────────────

  standup_eternel: {
    id: 'standup_eternel',
    title: 'Stand-up éternel',
    text:
      'Le stand-up dure depuis 47 minutes. Le manager vient de demander « et côté perso, des news ? » '
      + 'Tu aperçois trois stratégies de sortie.',
    choices: [
      {
        label: 'Lancer un BLOQUANT et sortir (+3 PV, -1 MP)',
        log: 'Tu abats ta carte. L\u2019équipe hoche la tête. Tu passes la porte avant le prochain tour de table.',
        effect: { hpDelta: 3, mpDelta: -1 },
      },
      {
        label: 'Raconter une anecdote tangentielle (+3 MP, -1 PV)',
        log: 'Ton histoire dévie le fil. Le manager sourit. Tu en profites pour filer — mais l\u2019effort creuse.',
        effect: { mpDelta: 3, hpDelta: -1 },
      },
      {
        label: 'Attendre en silence jusqu\u2019à la fin (+2 PV, +1 MP)',
        log: 'Tu attends. Deux décisions tombent à la fin. Pas le meilleur bilan, mais solide.',
        effect: { hpDelta: 2, mpDelta: 1 },
      },
      {
        label: 'Quitter sans un mot (+2 MP)',
        log: 'Personne ne remarque. C\u2019est un signe — et tu gardes toute ton énergie mentale.',
        effect: { mpDelta: 2 },
      },
    ],
  },

  // ─── Slack maudit — "Ne pas déranger" a maintenant un coût en MP ────────────

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
        label: 'Passer en mode Ne pas déranger (-2 MP)',
        log: 'Silence. Tu coupes le flux. Ça coûte de l\u2019énergie mentale de décrocher — mais dans le tiroir, un casque anti-ping attend depuis 2022.',
        effect: { mpDelta: -2, grantRewardItemId: 'casque_anti_ping' },
      },
      {
        label: 'Marquer comme lu sans ouvrir (+1 PV)',
        log: 'Geste de pouvoir. La culpabilité monte en silence — mais le corps, lui, est soulagé.',
        effect: { hpDelta: 1 },
      },
    ],
  },

  // ─── Comité des plantes — parler aux plantes coûte maintenant du MP ─────────

  comite_plantes: {
    id: 'comite_plantes',
    title: 'Comité des plantes vertes',
    text:
      'Sept ficus en cercle délibèrent en silence. L\u2019air est dense, végétal. '
      + 'Un post-it sur le plus grand ficus indique : « ODJ : périmètre projet ».',
    recommendedHero: 'Choc',
    choices: [
      {
        label: 'Parler aux plantes du projet (-2 MP)',
        log:
          'Tu exposes le périmètre, l\u2019objectif, les contraintes — ça demande du souffle. '
          + 'Les ficus inclinent leurs feuilles. Sur le bureau voisin, une feuille de cadrage apparaît.',
        effect: { mpDelta: -2, grantRewardItemId: 'feuille_cadrage' },
      },
      {
        label: 'Passer en force (-3 PV, +1 MP)',
        log: 'Une branche te frappe dans le dos. L\u2019adrénaline compense. Pas cool, mais tu passes.',
        effect: { hpDelta: -3, mpDelta: 1 },
      },
      {
        label: 'Attendre la fin du comité (+2 PV, -1 MP)',
        log: 'Ça dure. Tu observes. Les ficus décident enfin. Un peu de sérénité végétale te reste.',
        effect: { hpDelta: 2, mpDelta: -1 },
      },
    ],
  },
};
