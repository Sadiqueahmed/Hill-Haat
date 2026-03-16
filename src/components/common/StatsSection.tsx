'use client';

import { motion } from 'framer-motion';
import { Users, Package, Truck, MapPin, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { platformStats } from '@/data/sample-data';

const stats = [
  {
    icon: Users,
    label: 'Active Farmers',
    value: platformStats.totalFarmers,
    suffix: '+',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    icon: Package,
    label: 'Products Listed',
    value: platformStats.activeListings,
    suffix: '+',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    icon: Truck,
    label: 'Orders Delivered',
    value: platformStats.totalOrders,
    suffix: '+',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    icon: MapPin,
    label: 'States Covered',
    value: platformStats.statesCovered,
    suffix: '',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    prefix: 'NE India',
  },
];

export function StatsSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Trusted by Thousands</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Empowering farmers and connecting communities across Northeast India
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl md:text-4xl font-bold text-foreground">
                      {stat.value.toLocaleString()}
                    </span>
                    {stat.suffix && (
                      <span className={`text-xl font-semibold ${stat.color}`}>
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Total Transaction Value</p>
                <p className="text-2xl font-bold">₹{(platformStats.totalTransactions / 10000000).toFixed(1)} Cr+</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Average Delivery Time</p>
                <p className="text-2xl font-bold">{platformStats.avgDeliveryTime} Days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Customer Satisfaction</p>
                <p className="text-2xl font-bold">{platformStats.satisfactionRate}%</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
