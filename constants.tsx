
import React from 'react';
import { LayoutDashboard, FileText, CreditCard, User, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { MarketEvent, ZoneType, Application, AppStatus } from './types';

export const EVENTS: MarketEvent[] = [
  {
    id: 'mini-1',
    title: 'MINI LAVRS Market',
    date: '21. 03. 2026',
    location: 'Vnitroblock, Holešovice',
    status: 'open',
    image: '/media/1cde43c8-e02d-43da-aa4c-2c21532f5797.webp'
  },
  {
    id: 'mini-2',
    title: 'MINI LAVRS Market',
    date: '30. 05. 2026',
    location: 'Vnitroblock, Holešovice',
    status: 'open',
    image: '/media/LAVRSMarket-1681924565.png'
  },
  {
    id: 'mini-3',
    title: 'MINI LAVRS Market',
    date: '25. 07. 2026',
    location: 'Vnitroblock, Holešovice',
    status: 'open',
    image: '/media/Lavrsmarket-2022-foto-Dominika-Hruba.jpg'
  },
  {
    id: 'vianoce-mini-1',
    title: 'Vánoční MINI LAVRS Market',
    date: '28. 11. 2026',
    location: 'Radlická Kulturní Sportovna',
    status: 'closed',
    image: '/media/lavrs-bundy-foto-dominika-hruba-nahled.jpg'
  },
  {
    id: 'lavrs-big-1',
    title: 'LAVRS Market',
    date: '25.–26. 09. 2026',
    location: 'Garbe Holešovice',
    status: 'closed',
    image: '/media/lavrs-market.webp',
    description: '1 booking = 2 dny. Přihláška se vztahuje na oba dny.'
  }
];

export const MOCK_APPLICATIONS: Application[] = [];

export const ZONE_DETAILS = {
  [ZoneType.S]: {
    label: 'Spot S',
    dimensions: '1.5 x 1.5m',
    equipment: ['1x Stůl', '1x Židle'],
    price: '2.500 Kč'
  },
  [ZoneType.M]: {
    label: 'Spot M',
    dimensions: '2.0 x 2.0m',
    equipment: ['1x Stojan na šaty', '1x Stůl', '2x Židle'],
    price: '4.200 Kč'
  },
  [ZoneType.L]: {
    label: 'Spot L',
    dimensions: '3.0 x 3.0m',
    equipment: ['2x Stojan na šaty', '2x Stůl', '2x Židle', 'Zrcadlo'],
    price: '6.800 Kč'
  }
};

export const MOCK_EVENT_PLANS: { [key: string]: any } = {
  'mini-1': {
    eventId: 'mini-1',
    gridSize: { width: 12, height: 8 },
    zones: [
      { id: 'z1', name: 'Hlavní sál', color: '#EF4444', category: 'Secondhands', capacities: { S: 5, M: 10, L: 2 } },
      { id: 'z2', name: 'Designers Zone', color: '#8B5CF6', category: 'Designers', capacities: { S: 2, M: 5, L: 1 } }
    ],
    stands: [
      { id: 's1', x: 1, y: 1, size: 'M', zoneId: 'z1' },
      { id: 's2', x: 1, y: 2, size: 'M', zoneId: 'z1' },
      { id: 's3', x: 2, y: 1, size: 'S', zoneId: 'z1' },
      { id: 's4', x: 5, y: 5, size: 'L', zoneId: 'z2' }
    ],
    prices: {
      S: '2.500 Kč',
      M: '4.200 Kč',
      L: '6.800 Kč'
    },
    equipment: {
      S: ['1x Stůl', '1x Židle'],
      M: ['1x Stojan na šaty', '1x Stůl', '2x Židle'],
      L: ['2x Stojan na šaty', '2x Stůl', '2x Židle', 'Zrcadlo']
    },
    extras: [
      { id: 'extra-chair', label: 'Extra Židle', price: '200 Kč' },
      { id: 'extra-table', label: 'Extra Stůl', price: '400 Kč' },
      { id: 'rack-rent', label: 'Extra stojan', price: '300 Kč' },
      { id: 'electricity', label: 'Přípojka elektřiny', price: '500 Kč' }
    ]
  }
};
