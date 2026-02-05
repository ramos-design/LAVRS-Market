
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

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    brandName: 'Vintage Soul',
    brandDescription: 'Curated 90s sportswear and luxury accessories.',
    instagram: '@vintage.soul',
    website: 'vintagesoul.cz',
    contactPerson: 'Tereza Nováková',
    phone: '+420 777 123 456',
    email: 'tereza@vintagesoul.cz',
    billingName: 'Vintage Soul s.r.o.',
    ic: '12345678',
    billingAddress: 'Vnitroblock, Holešovice, Praha',
    billingEmail: 'faktury@vintagesoul.cz',
    zone: ZoneType.M,
    status: AppStatus.PENDING,
    submittedAt: '2024-08-01',
    images: ['https://picsum.photos/seed/brand1/400/400', 'https://picsum.photos/seed/brand2/400/400'],
    eventId: 'mini-1',
    consentGDPR: true,
    consentOrg: true,
    consentStorno: true,
    consentNewsletter: false
  },
  {
    id: 'app-2',
    brandName: 'Linen Dreams',
    brandDescription: 'Slow fashion made from deadstock linen fabrics.',
    instagram: '@linen_dreams',
    website: 'linendreams.eu',
    contactPerson: 'Jana Modrá',
    phone: '+420 602 111 222',
    email: 'jana@linendreams.eu',
    billingName: 'Jana Modrá',
    ic: '87654321',
    billingAddress: 'Brno, Česká 12',
    billingEmail: 'jana@linendreams.eu',
    zone: ZoneType.S,
    status: AppStatus.APPROVED,
    submittedAt: '2024-07-28',
    images: ['https://picsum.photos/seed/brand3/400/400'],
    eventId: 'mini-1',
    paymentDeadline: '2024-08-15',
    consentGDPR: true,
    consentOrg: true,
    consentStorno: true,
    consentNewsletter: true
  }
];

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
