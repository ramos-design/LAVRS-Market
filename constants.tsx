
import React from 'react';
import { LayoutDashboard, FileText, CreditCard, User, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { MarketEvent, ZoneType, Application, AppStatus, ZoneCategory, Banner, Category } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'Secondhands', name: 'Secondhands', description: 'Vintage a second-hand móda' },
  { id: 'České značky', name: 'České značky', description: 'Lokální české značky' },
  { id: 'Designers', name: 'Designers', description: 'Designérské kousky' },
  { id: 'Beauty ZONE', name: 'Beauty ZONE', description: 'Kosmetika a péče' },
  { id: 'TATTOO', name: 'TATTOO', description: 'Tetování a body art' },
  { id: 'Reuse', name: 'Reuse zone', description: 'Udržitelná a kreativní tvorba' }
];

// ... existing code ...

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'b1',
    title: "Přípravy na Vánoce vrcholí",
    subtitle: "Nezapomeňte si včas rezervovat své místo na Vánočním LAVRS marketu. Kapacity se rychle plní!",
    image: "/media/1cde43c8-e02d-43da-aa4c-2c21532f5797.webp",
    tag: "DŮLEŽITÉ"
  },
  {
    id: 'b2',
    title: "Nová lokace v Holešovicích",
    subtitle: "Zářijový LAVRS market se přesouvá do úžasných prostor Garbe Holešovice. Máte se na co těšit.",
    image: "/media/lavrs-market.webp",
    tag: "NOVINKA"
  },
  {
    id: 'b3',
    title: "Workshop: Circular Fashion",
    subtitle: "Chcete se dozvědět více o tom, jak lépe prezentovat svou udržitelnou značku? Sledujte náš newsletter.",
    image: "/media/Lavrsmarket-2022-foto-Dominika-Hruba.jpg",
    tag: "WORKSHOP"
  }
];


export const EVENTS: MarketEvent[] = [
  {
    id: 'mini-1',
    title: 'LAVRS market',
    date: '21. 03. 2026',
    location: 'Vnitroblock, Holešovice',
    status: 'open',
    image: '/media/1cde43c8-e02d-43da-aa4c-2c21532f5797.webp'
  },
  {
    id: 'mini-2',
    title: 'LAVRS market',
    date: '30. 05. 2026',
    location: 'Vnitroblock, Holešovice',
    status: 'open',
    image: '/media/LAVRSMarket-1681924565.png'
  },
  {
    id: 'mini-3',
    title: 'LAVRS market',
    date: '25. 07. 2026',
    location: 'Vnitroblock, Holešovice',
    status: 'open',
    image: '/media/Lavrsmarket-2022-foto-Dominika-Hruba.jpg'
  },
  {
    id: 'vianoce-mini-1',
    title: 'Vánoční LAVRS market',
    date: '28. 11. 2026',
    location: 'Radlická Kulturní Sportovna',
    status: 'closed',
    image: '/media/lavrs-bundy-foto-dominika-hruba-nahled.jpg'
  },
  {
    id: 'lavrs-big-1',
    title: 'LAVRS market',
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
      'Secondhands': '2.500 Kč',
      'České značky': '3.800 Kč',
      'Designers': '4.200 Kč',
      'Beauty ZONE': '3.500 Kč',
      'TATTOO': '5.500 Kč',
      'Reuse': '2.200 Kč'
    },
    equipment: {
      'Secondhands': ['1x Stojan na šaty (vlastní)', '1x Stůl', '1x Židle'],
      'České značky': ['1x Stojan na šaty', '1x Stůl', '2x Židle'],
      'Designers': ['1x Stojan na šaty', '1x Stůl', '2x Židle', 'Zrcadlo'],
      'Beauty ZONE': ['1x Stůl', '2x Židle', 'Zrcadlo'],
      'TATTOO': ['1x Stůl', '2x Židle', 'Podložka'],
      'Reuse': ['1x Stůl', '2x Židle']
    },
    categorySizes: {
      'Secondhands': 'Spot M',
      'České značky': 'Spot S',
      'Designers': 'Spot M',
      'Beauty ZONE': 'Spot S',
      'TATTOO': 'Spot L',
      'Reuse': 'Spot M'
    },
    extras: [
      { id: 'extra-chair', label: 'Extra Židle', price: '200 Kč' },
      { id: 'extra-table', label: 'Extra Stůl', price: '400 Kč' },
      { id: 'rack-rent', label: 'Extra stojan', price: '300 Kč' },
      { id: 'electricity', label: 'Přípojka elektřiny', price: '500 Kč' }
    ]
  }
};
