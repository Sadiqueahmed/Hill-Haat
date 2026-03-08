'use client';

import { motion } from 'framer-motion';
import {
  Wifi,
  Shield,
  Truck,
  Leaf,
  MapPin,
  Clock,
  Users,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Wifi,
    title: 'Offline-First',
    description: 'Works without internet. Sync automatically when connected.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Privacy Preserving',
    description: 'Zero-knowledge proofs protect farmer identity and location.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Truck,
    title: 'Smart Logistics',
    description: 'Hill-terrain aware routing for efficient deliveries.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Leaf,
    title: 'Organic Verified',
    description: 'Verified organic certifications for premium products.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: MapPin,
    title: 'Location Masking',
    description: 'Prove district membership without exposing exact location.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Clock,
    title: 'Real-Time Tracking',
    description: 'Track your orders from farm to doorstep in real-time.',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: Users,
    title: 'Direct Connection',
    description: 'Connect directly with farmers, no middlemen involved.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Multiple payment options with escrow protection.',
    color: 'from-teal-500 to-cyan-500',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Why Choose Hill-Haat?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built specifically for the unique challenges of Northeast India&apos;s hilly terrain and connectivity issues
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="group h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
