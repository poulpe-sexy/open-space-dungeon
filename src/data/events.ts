import type { EventDef } from './types';

export const EVENTS: Record<string, EventDef> = {
  coffee_machine: {
    id: 'coffee_machine',
    title: 'Machine \u00e0 caf\u00e9 runique',
    text: 'Une vieille machine gronde dans le couloir. Un gobelet tremble sur le plateau.',
    choices: [
      {
        label: 'Prendre un expresso (+3 MP)',
        log: 'Tu bois. C\u2019est brûlant mais ça clarifie l\u2019esprit.',
        effect: { mpDelta: 3 },
      },
      {
        label: 'Prendre un d\u00e9ca (+4 PV)',
        log: 'Étonnamment réconfortant. Tu respires.',
        effect: { hpDelta: 4 },
      },
      { label: 'Ignorer', log: 'Tu passes. La machine soupire.' },
    ],
  },
  mystery_memo: {
    id: 'mystery_memo',
    title: 'M\u00e9mo non lu',
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
        label: 'Respirer \u00e0 fond (+3 PV, +1 MP)',
        log: 'Le cringe devient ta force.',
        effect: { hpDelta: 3, mpDelta: 1 },
      },
      { label: 'D\u00e9tourner le regard', log: 'Tu ne céderas pas.' },
    ],
  },

  // ─── Nouvelles épreuves absurdes — favor Alphonse (Roublard / social) ───

  slack_maudit: {
    id: 'slack_maudit',
    title: 'Slack maudit',
    text: 'Un canal #urgent clignote. 47 messages non-lus. Le dernier : « ping @here il y a 2 s ».',
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
        label: 'Marquer comme lu sans ouvrir',
        log: 'Geste de pouvoir. La culpabilité monte en silence.',
        effect: { hpDelta: -1 },
      },
    ],
  },

  powerpoint_interdit: {
    id: 'powerpoint_interdit',
    title: 'PowerPoint interdit',
    text: 'Une slide trône au centre de la salle. Titre : « Roadmap v37 — NE PAS DIFFUSER ». Elle clignote.',
    recommendedHero: 'Roublard',
    choices: [
      {
        label: 'Fermer sans lire (+1 PV)',
        log: 'Discipline. Tu sens les yeux de la hiérarchie sur toi, approbateurs.',
        effect: { hpDelta: 1 },
      },
      {
        label: 'Lire la slide (-4 PV, +3 MP)',
        log: 'Tu vois des choses. Trop de choses. Ton cerveau reste marqué.',
        effect: { hpDelta: -4, mpDelta: 3 },
      },
      {
        label: 'La présenter à voix haute',
        log: 'Personne n’écoute. C’est pire que prévu. (-1 MP)',
        effect: { mpDelta: -1 },
      },
    ],
  },

  ascenseur_priorites: {
    id: 'ascenseur_priorites',
    title: 'Ascenseur des priorités',
    text: 'Quatre boutons : URGENT, CRITIQUE, BLOQUANT, P0. Aucun n’indique d’étage.',
    recommendedHero: 'Roublard',
    choices: [
      {
        label: 'URGENT (classique, +2 PV)',
        log: 'L’ascenseur monte d’un étage. Rien ne brûle aujourd’hui.',
        effect: { hpDelta: 2 },
      },
      {
        label: 'CRITIQUE (risqué, -2 PV, +2 MP)',
        log: 'Secousse. Quelque chose vient d’être décidé quelque part, tu le sens.',
        effect: { hpDelta: -2, mpDelta: 2 },
      },
      {
        label: 'P0 (tout brûle)',
        log: 'L’ascenseur descend au sous-sol. Tu aurais dû choisir mieux. (-3 PV)',
        effect: { hpDelta: -3 },
      },
    ],
  },
};
