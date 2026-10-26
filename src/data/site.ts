// Single source of truth for personal facts used across the site.
// Deliberately NOT here: street address, phone, birthdate, gender, nationality line.

export const person = {
  name: 'Orhun Habib Erdogan',
  short: 'Orhun',
  initials: 'O.H.E.',
  age: 23,
  role: 'Mechatronics engineer',
  base: 'Eindhoven, NL',
  coords: '51.44°N 5.47°E',
  timezone: 'Europe/Amsterdam',
  email: 'orhun2303@gmail.com',
  linkedin: 'https://www.linkedin.com/in/orhunhabiberdogan',
  github: 'https://github.com/orhun23',
};

export const site = {
  title: 'Orhun Habib Erdogan — machines, then skateboarding',
  description:
    'Mechatronics engineer from Eindhoven. Software that moves real machines, a tallbike, an Iron Man helmet, a home-built 3D printer, and a lot of time on boards.',
  heroLine: ['I make machines do things.', 'Then I go skateboarding.'],
};

// The "drawing set": every homepage section is a sheet.
export const sheets = [
  { id: 'top', no: '01', title: 'General arrangement' },
  { id: 'status', no: '02', title: 'Status' },
  { id: 'builds', no: '03', title: 'Builds' },
  { id: 'field-log', no: '04', title: 'Field log' },
  { id: 'work', no: '05', title: 'Day job' },
  { id: 'contact', no: '06', title: 'Contact' },
] as const;

export const nav = [
  { href: '/#builds', label: 'Builds' },
  { href: '/#field-log', label: 'Field log' },
  { href: '/work', label: 'Work' },
  { href: '/#contact', label: 'Contact' },
];
