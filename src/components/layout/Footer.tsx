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
} from 'lucide-react';

const footerLinks = {
  marketplace: [
    { name: 'Browse Products', href: '/marketplace' },
    { name: 'Sell Your Produce', href: '/sell' },
    { name: 'Track Orders', href: '/logistics' },
    { name: 'Become a Seller', href: '/sell' },
  ],
  categories: [
    { name: 'Spices', href: '/marketplace?category=SPICES' },
    { name: 'Fruits', href: '/marketplace?category=FRUITS' },
    { name: 'Vegetables', href: '/marketplace?category=VEGETABLES' },
    { name: 'Grains & Cereals', href: '/marketplace?category=GRAINS' },
    { name: 'Tea & Beverages', href: '/marketplace?category=TEA' },
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

const states = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura',
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
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
              Empowering local communities through sustainable agriculture.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>Guwahati, Assam, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-emerald-400" />
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

          {/* Categories Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
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

        {/* States We Serve */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <h3 className="text-white font-semibold mb-4">States We Serve</h3>
          <div className="flex flex-wrap gap-2">
            {states.map((state) => (
              <Link
                key={state}
                href={`/marketplace?state=${encodeURIComponent(state)}`}
                className="px-3 py-1.5 bg-slate-800 rounded-full text-sm hover:bg-emerald-600 hover:text-white transition-colors"
              >
                {state}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Hill-Haat. All rights reserved.
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
        </div>
      </div>
    </footer>
  );
}
