'use client';

import Link from 'next/link';
import {
  Mountain,
  Leaf,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Truck,
  Calendar,
  Store,
  Route,
  PartyPopper,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NE_STATE_INFO, NE_MARKETS } from '@/types';

const footerLinks = {
  marketplace: [
    { name: 'Browse Products', href: '/marketplace' },
    { name: 'Sell Your Produce', href: '/sell' },
    { name: 'Track Orders', href: '/logistics' },
    { name: 'Become a Seller', href: '/sell' },
  ],
  categories: [
    { name: 'Naga Chilli (Ghost Pepper)', href: '/marketplace?category=SPICES' },
    { name: 'Assam Tea', href: '/marketplace?category=TEA' },
    { name: 'Chakhao Black Rice', href: '/marketplace?category=GRAINS' },
    { name: 'Lakadong Turmeric', href: '/marketplace?category=SPICES' },
    { name: 'Sikkim Cardamom', href: '/marketplace?category=SPICES' },
    { name: 'Tripura Pineapple', href: '/marketplace?category=FRUITS' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Shipping Info', href: '#' },
    { name: 'Returns & Refunds', href: '#' },
    { name: 'Contact Us', href: '#' },
  ],
  company: [
    { name: 'About Us', href: '#' },
    { name: 'Our Story', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Press', href: '#' },
  ],
};

// NE India Festivals for Footer
const neFestivals = [
  { name: 'Bihu', state: 'Assam', month: 'Apr, Jan' },
  { name: 'Hornbill', state: 'Nagaland', month: 'Dec' },
  { name: 'Wangala', state: 'Meghalaya', month: 'Nov' },
  { name: 'Losar', state: 'Sikkim', month: 'Feb' },
  { name: 'Chapchar Kut', state: 'Mizoram', month: 'Mar' },
  { name: 'Ningol Chakouba', state: 'Manipur', month: 'Nov' },
];

// Major Highways connecting NE India
const neHighways = [
  { name: 'NH-15', connects: 'Assam - Arunachal Pradesh' },
  { name: 'NH-37', connects: 'Guwahati - Tinsukia' },
  { name: 'NH-29', connects: 'Dimapur - Kohima (Nagaland)' },
  { name: 'NH-10', connects: 'Siliguri - Gangtok (Sikkim)' },
  { name: 'NH-6', connects: 'Shillong - Silchar (Meghalaya)' },
  { name: 'NH-54', connects: 'Aizawl (Mizoram) to NH-6' },
];

// State Emojis
const stateEmojis: Record<string, string> = {
  'Arunachal Pradesh': '🏔️',
  'Assam': '🍵',
  'Manipur': '🍚',
  'Meghalaya': '🍯',
  'Mizoram': '🫚',
  'Nagaland': '🌶️',
  'Sikkim': '🌱',
  'Tripura': '🍍',
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Cultural Border Top */}
      <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 via-blue-500 to-purple-500" />
      
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Mountain className="h-8 w-8 text-emerald-400" />
                <Leaf className="h-4 w-4 text-emerald-300 absolute -top-1 -right-1" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">Hill-Haat</span>
                <span className="text-xs text-slate-400 -mt-1">Farm to Highway</span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">
              Connecting farmers from Northeast India&apos;s hilly regions with buyers across the nation. 
              From the Seven Sisters & One Brother to your doorstep.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>HQ: Guwahati, Assam, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>support@hillhaat.in</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              <Link href="#" className="hover:text-emerald-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-emerald-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-emerald-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-emerald-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Marketplace</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.marketplace.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Regional Categories Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">NE Specialties</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* States We Serve - Enhanced */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-emerald-400" />
            <h3 className="text-white font-semibold">States We Serve - Seven Sisters & One Brother</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {NE_STATE_INFO.map((state) => (
              <Link
                key={state.name}
                href={`/marketplace?state=${encodeURIComponent(state.name)}`}
                className="group p-3 bg-slate-800 rounded-lg hover:bg-emerald-600 transition-all duration-300 text-center"
              >
                <span className="text-2xl block mb-1">{stateEmojis[state.name]}</span>
                <p className="text-xs font-medium group-hover:text-white">{state.name}</p>
                <p className="text-xs text-slate-400 group-hover:text-emerald-100">
                  {state.districts.length} districts
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Major Highways */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Route className="h-5 w-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Highway Connectivity</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {neHighways.map((highway) => (
              <div
                key={highway.name}
                className="p-3 bg-slate-800 rounded-lg"
              >
                <p className="text-sm font-medium text-white">{highway.name}</p>
                <p className="text-xs text-slate-400 mt-1">{highway.connects}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Markets & Haats */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Popular Markets & Haats</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {NE_MARKETS.slice(0, 12).map((market) => (
              <div
                key={`${market.name}-${market.state}`}
                className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <p className="text-sm font-medium text-white truncate">{market.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {market.district}, {market.state}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-400">
                    {market.type.replace('_', ' ')}
                  </Badge>
                  {market.marketDays && (
                    <span className="text-xs text-slate-500">{market.marketDays.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Festivals */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <PartyPopper className="h-5 w-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Regional Festivals & Harvest Seasons</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {neFestivals.map((festival) => (
              <div
                key={festival.name}
                className="p-3 bg-slate-800 rounded-lg"
              >
                <p className="text-sm font-medium text-white">{festival.name}</p>
                <p className="text-xs text-slate-400 mt-1">{festival.state}</p>
                <Badge variant="outline" className="mt-2 text-xs border-amber-500/50 text-amber-400">
                  {festival.month}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Harvest Calendar */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Seasonal Harvest Calendar</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { season: 'Spring', months: 'Mar - May', icon: '🌸', products: ['Fresh Tea', 'Ginger', 'Turmeric', 'Strawberries'] },
              { season: 'Monsoon', months: 'Jun - Sep', icon: '🌧️', products: ['Pineapple', 'Passion Fruit', 'Bamboo Shoots', 'Mushrooms'] },
              { season: 'Autumn', months: 'Oct - Nov', icon: '🍂', products: ['Large Cardamom', 'Kiwi', 'Rice Harvest', 'Oranges'] },
              { season: 'Winter', months: 'Dec - Feb', icon: '❄️', products: ['Apples', 'Mustard Greens', 'Naga Chilli', 'Joha Rice'] },
            ].map((season) => (
              <div
                key={season.season}
                className="p-4 bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{season.icon}</span>
                  <div>
                    <p className="font-medium text-white">{season.season}</p>
                    <p className="text-xs text-slate-400">{season.months}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {season.products.map((product, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-slate-700">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics Info */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Terrain-Aware Logistics</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { terrain: 'Plain', speed: '40 km/h', multiplier: '1.0x', areas: 'Assam valleys, Tripura' },
              { terrain: 'Hilly', speed: '25 km/h', multiplier: '1.5x', areas: 'Meghalaya, Nagaland, Mizoram' },
              { terrain: 'Mountainous', speed: '15 km/h', multiplier: '2.0x', areas: 'Arunachal, Sikkim' },
              { terrain: 'Valley', speed: '30 km/h', multiplier: '1.3x', areas: 'Imphal Valley, Brahmaputra' },
            ].map((terrain) => (
              <div
                key={terrain.terrain}
                className="p-3 bg-slate-800 rounded-lg"
              >
                <p className="font-medium text-white">{terrain.terrain} Terrain</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>Avg Speed: {terrain.speed}</span>
                  <span>Cost: {terrain.multiplier}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">{terrain.areas}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Hill-Haat. Connecting Northeast India with the world. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-emerald-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-emerald-400 transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
          
          {/* Made with love */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Made with ❤️ for the farmers of Northeast India • Arunachal • Assam • Manipur • Meghalaya • Mizoram • Nagaland • Sikkim • Tripura
            </p>
          </div>
        </div>
      </div>

      {/* Cultural Border Bottom */}
      <div className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 via-emerald-500 via-amber-500 to-red-500" />
    </footer>
  );
}
