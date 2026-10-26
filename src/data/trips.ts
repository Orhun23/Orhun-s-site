// Field log. Coordinates are place-level (2 decimals), read from photo GPS before it was stripped.
import type { ImageMetadata } from 'astro';

import rinjaniRidge from '../assets/media/trips/rinjani-ridge.jpg';
import rinjaniSunrise from '../assets/media/trips/rinjani-sunrise.jpg';
import rinjaniCrater from '../assets/media/trips/rinjani-crater.jpg';
import fujiSummit from '../assets/media/trips/fuji-summit.jpg';
import fujiShadow from '../assets/media/trips/fuji-shadow.jpg';
import osakaNight from '../assets/media/trips/osaka-night.jpg';
import sahara from '../assets/media/trips/sahara.jpg';
import todra from '../assets/media/trips/todra-gorge.jpg';
import camel from '../assets/media/trips/camel.jpg';
import fogo from '../assets/media/trips/fogo.jpg';
import blackBeach from '../assets/media/trips/black-beach.jpg';
import scooter from '../assets/media/trips/scooter.jpg';
import jaipur from '../assets/media/trips/jaipur-wall.jpg';
import agra from '../assets/media/trips/agra-arch.jpg';
import bosphorus from '../assets/media/trips/bosphorus.jpg';
import cistern from '../assets/media/trips/cistern.jpg';

export type Shot = { src: ImageMetadata; alt: string };

export type Trip = {
  id: string;
  place: string;
  country: string;
  coords: string;
  when: string;
  spec: [string, string][]; // the spec-sheet rows
  line: string;
  shots: Shot[];
  video?: { src: string; poster: string; alt: string };
};

const fmt = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'} ${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'W' : 'E'}`;

export const trips: Trip[] = [
  {
    id: 'indonesia',
    place: 'Rinjani, Lombok',
    country: 'Indonesia',
    coords: fmt(-8.41, 116.46),
    when: 'Aug 2025',
    spec: [
      ['Elevation', '3726 m'],
      ['Sleep', '~2 h, in a tent, on a slope'],
      ['Also', 'Swam with a whale shark'],
    ],
    line: 'Climbed most of the night for one sunrise. Then I went in the water with a whale shark, which is less relaxing than it sounds.',
    shots: [
      { src: rinjaniRidge, alt: 'Orhun standing on a volcanic ridge above a sea of clouds at sunrise on Mount Rinjani' },
      { src: rinjaniSunrise, alt: 'Selfie at the Rinjani crater rim camp with the sun setting behind the peaks' },
      { src: rinjaniCrater, alt: 'Rinjani crater lake at dusk, surrounded by jagged peaks' },
    ],
    video: {
      src: '/media/trips/whale-shark.mp4',
      poster: 'trips/whale-shark',
      alt: 'Underwater clip of a whale shark gliding past a snorkeller in green water',
    },
  },
  {
    id: 'japan',
    place: 'Fuji, Osaka & around',
    country: 'Japan',
    coords: fmt(35.36, 138.73),
    when: 'Jul–Aug 2024',
    spec: [
      ['Elevation', '3776 m'],
      ['Shadow shot', '04:59 local'],
      ['Temperature', 'Not what my clothes expected'],
    ],
    line: 'Slept on Fuji, got up before five, watched the mountain throw a triangle shadow across the clouds. Then Osaka at night, which is the opposite of that.',
    shots: [
      { src: fujiSummit, alt: 'Orhun with arms wide on the slopes of Mount Fuji above the clouds, holding a walking stick' },
      { src: fujiShadow, alt: 'The triangular shadow of Mount Fuji cast across clouds at dawn' },
      { src: osakaNight, alt: 'Dotonbori canal in Osaka at night, lined with neon billboards' },
    ],
  },
  {
    id: 'morocco',
    place: 'Sahara, Todra, Taghazout',
    country: 'Morocco',
    coords: fmt(31.14, -4.01),
    when: 'May 2026',
    spec: [
      ['Terrain', 'Sand, rock, concrete bowl'],
      ['Transport', 'Camel (reluctant)'],
      ['Skate level of locals', 'Higher than mine'],
    ],
    line: 'Desert one day, gorge the next, then a concrete bowl on the coast full of kids who skate better than me.',
    shots: [
      { src: sahara, alt: 'Selfie in a white head wrap on top of an orange Sahara dune' },
      { src: todra, alt: 'Orhun walking through the dry riverbed of the Todra Gorge between huge red cliffs' },
      { src: camel, alt: 'Orhun crouched next to a camel lying in the sand' },
    ],
  },
  {
    id: 'cape-verde',
    place: 'Santiago & Fogo',
    country: 'Cape Verde',
    coords: fmt(14.95, -24.34),
    when: 'Sep 2026',
    spec: [
      ['Elevation', '2829 m'],
      ['Volcano status', 'Active'],
      ['Vehicle', 'Rented scooter'],
    ],
    line: 'First trip after the job ended. Scooter across Santiago, up an active volcano on Fogo, black sand at the bottom.',
    shots: [
      { src: fogo, alt: 'Orhun on the steep rocky rim of Pico do Fogo above the clouds' },
      { src: blackBeach, alt: 'Orhun walking along a black sand beach at sunset' },
      { src: scooter, alt: 'Selfie on a scooter on a cobblestone street in Cape Verde' },
    ],
  },
  {
    id: 'india',
    place: 'Agra & Jaipur',
    country: 'India',
    coords: fmt(26.94, 75.81),
    when: 'Dec 2025',
    spec: [
      ['Reason', 'Commissioning a sorter'],
      ['Weekend use', 'Maximised'],
      ['Thali count', 'Lost track'],
    ],
    line: 'Went for work, used every weekend. Agra in the fog, Jaipur from a fort wall at sunset.',
    shots: [
      { src: jaipur, alt: 'Sunset over Jaipur seen from the walls of a hilltop fort' },
      { src: agra, alt: 'Silhouette of Orhun in a carved stone archway looking out at a red sandstone gate' },
    ],
  },
  {
    id: 'turkiye',
    place: 'Istanbul',
    country: 'Türkiye',
    coords: fmt(41.05, 29.03),
    when: 'Jul 2025',
    spec: [
      ['Status', 'Other home country'],
      ['Best view', 'From the water'],
    ],
    line: 'The other half of home. Istanbul from the water at sunset still beats most things.',
    shots: [
      { src: bosphorus, alt: 'Two guys leaning back on a boat on the Bosphorus at sunset, the bridge behind them' },
      { src: cistern, alt: 'The columns of the Basilica Cistern reflected in dark water' },
    ],
  },
];
