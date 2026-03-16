import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Category, QualityGrade, ListingStatus, UserRole, OrderStatus, PaymentStatus, TerrainType, DeliveryStatus, VehicleType } from '@prisma/client';

// NE India authentic farmer names and business data
const NE_FARMERS = [
  // Arunachal Pradesh
  {
    clerkId: 'arunachal_farmer_1',
    name: 'Tsering Norbu',
    email: 'tsering.norbu@email.com',
    phone: '+91 98765 11111',
    businessName: 'Tawang Highland Farm',
    description: 'Third generation farmer from Tawang growing organic kiwi and apples at 2500m altitude. Specializing in temperate fruits and buckwheat.',
    district: 'Tawang',
    state: 'Arunachal Pradesh',
    address: 'Tawang, Arunachal Pradesh',
    pincode: '790104',
    elevation: 2669,
    products: [
      { title: 'Organic Kiwi - Tawang Highland', category: 'FRUITS', price: 380, unit: 'kg', description: 'Premium kiwi grown at 2500m altitude in Tawang. Sweet, tangy, and rich in vitamins. Limited seasonal harvest from the pristine Eastern Himalayas.' },
      { title: 'Arunachal Apple - Fresh', category: 'FRUITS', price: 280, unit: 'kg', description: 'Crisp and juicy apples from the high-altitude orchards of Tawang. Grown without pesticides in pristine mountain environment.' },
      { title: 'Buckwheat Flour - Organic', category: 'GRAINS', price: 180, unit: 'kg', description: 'Traditional buckwheat flour from Arunachal Pradesh. Gluten-free, nutrient-rich, perfect for traditional dishes and healthy cooking.' },
    ],
  },
  {
    clerkId: 'arunachal_farmer_2',
    name: 'Tagam Mibang',
    email: 'tagam.mibang@email.com',
    phone: '+91 98765 11112',
    businessName: 'East Siang Organic Collective',
    description: 'Farmer from Pasighat specializing in indigenous rice varieties and ginger grown in the Siang river valley.',
    district: 'East Siang',
    state: 'Arunachal Pradesh',
    address: 'Pasighat, East Siang',
    pincode: '791102',
    elevation: 350,
    products: [
      { title: 'Arunachal Indigenous Rice', category: 'GRAINS', price: 120, unit: 'kg', description: 'Traditional rice varieties from the Siang valley. Naturally grown using traditional methods passed down through generations.' },
      { title: 'Organic Ginger - Adi Variety', category: 'SPICES', price: 190, unit: 'kg', description: 'Aromatic ginger from the Adi hills of Arunachal. Known for its intense flavor and medicinal properties.' },
    ],
  },

  // Assam
  {
    clerkId: 'assam_farmer_1',
    name: 'Bapuk Das',
    email: 'bapuk.das@email.com',
    phone: '+91 98765 22221',
    businessName: 'Dibrugarh Tea & Spices Estate',
    description: 'Multi-generational farmer with tea gardens and spice plantations in Upper Assam. Known for premium orthodox tea and Lakadong turmeric.',
    district: 'Dibrugarh',
    state: 'Assam',
    address: 'Naharkatia, Dibrugarh',
    pincode: '786004',
    elevation: 95,
    products: [
      { title: 'Assam Orthodox Tea - Premium Grade', category: 'TEA', price: 450, unit: 'kg', description: 'Single-origin orthodox tea from the tea gardens of Upper Assam. Full-bodied, malty flavor with bright liquor. Hand-plucked and traditionally processed.' },
      { title: 'Lakadong Turmeric - High Curcumin', category: 'SPICES', price: 280, unit: 'kg', description: 'Premium Lakadong turmeric with 7-12% curcumin content - among the highest in the world. Vibrant color, intense flavor, exceptional medicinal properties.' },
      { title: 'Fresh Bamboo Shoots - Assam Special', category: 'VEGETABLES', price: 80, unit: 'kg', description: 'Tender bamboo shoots harvested fresh from Assam forests. Essential ingredient for traditional Northeast cuisine.' },
    ],
  },
  {
    clerkId: 'assam_farmer_2',
    name: 'Malati Gogoi',
    email: 'malati.gogoi@email.com',
    phone: '+91 98765 22222',
    businessName: 'Jorhat Organic Produce',
    description: 'Woman farmer from Jorhat specializing in organic rice, mustard, and traditional Assamese vegetables.',
    district: 'Jorhat',
    state: 'Assam',
    address: 'Titabor, Jorhat',
    pincode: '785630',
    elevation: 115,
    products: [
      { title: 'Joha Rice - Aromatic Variety', category: 'GRAINS', price: 140, unit: 'kg', description: 'Premium Joha rice - Assam\'s aromatic rice variety. Delicate fragrance, perfect for special occasions and traditional dishes.' },
      { title: 'Organic Mustard Seeds', category: 'SPICES', price: 120, unit: 'kg', description: 'Cold-pressed mustard seeds from organic farms of Jorhat. Perfect for oil extraction and traditional cooking.' },
    ],
  },
  {
    clerkId: 'assam_farmer_3',
    name: 'Biren Kalita',
    email: 'biren.kalita@email.com',
    phone: '+91 98765 22223',
    businessName: 'Karbi Anglong Spice Farm',
    description: 'Tribal farmer from the Karbi hills specializing in ginger, turmeric, and exotic hill vegetables.',
    district: 'Karbi Anglong',
    state: 'Assam',
    address: 'Diphu, Karbi Anglong',
    pincode: '782460',
    elevation: 550,
    products: [
      { title: 'Karbi Ginger - Hill Variety', category: 'SPICES', price: 200, unit: 'kg', description: 'Premium hill ginger from the Karbi Anglong highlands. Intense flavor, high essential oil content, organically grown.' },
      { title: 'Wild Honey - Karbi Forests', category: 'HONEY', price: 750, unit: 'kg', description: 'Pure wild honey collected from the pristine forests of Karbi Anglong. Rich in forest flora essence, unprocessed and raw.' },
    ],
  },

  // Manipur
  {
    clerkId: 'manipur_farmer_1',
    name: 'Priya Devi',
    email: 'priya.devi@email.com',
    phone: '+91 98765 33331',
    businessName: 'Imphal Black Rice Collective',
    description: 'Traditional rice farmer preserving the heritage of Chakhao - Manipur\'s GI tagged black rice. Third generation farmer.',
    district: 'Imphal West',
    state: 'Manipur',
    address: 'Langthabal, Imphal West',
    pincode: '795004',
    elevation: 782,
    products: [
      { title: 'Chakhao - Manipur Black Rice (GI Tag)', category: 'GRAINS', price: 320, unit: 'kg', description: 'GI tagged Chakhao black rice from Manipur. Rich in antioxidants, nutty flavor, turns purple when cooked. Cultural heritage preserved through generations.' },
      { title: 'Manipur Pineapple - Kew Variety', category: 'FRUITS', price: 80, unit: 'piece', description: 'Sweet and tangy Kew pineapple from Manipur\'s hill farms. Known for exceptional sweetness and low fiber content.' },
    ],
  },
  {
    clerkId: 'manipur_farmer_2',
    name: 'Thangjam Singh',
    email: 'thangjam.singh@email.com',
    phone: '+91 98765 33332',
    businessName: 'Ukhrul Exotic Produce',
    description: 'Farmer from Ukhrul hills growing exotic shiitake mushrooms, Naga chilli, and temperate fruits.',
    district: 'Ukhrul',
    state: 'Manipur',
    address: 'Ukhrul, Manipur',
    pincode: '795142',
    elevation: 1450,
    products: [
      { title: 'Shiitake Mushroom - Ukhrul Grown', category: 'VEGETABLES', price: 600, unit: 'kg', description: 'Premium shiitake mushrooms cultivated in the cool hills of Ukhrul. Rich umami flavor, meaty texture, perfect for Asian cuisine.' },
      { title: 'Passion Fruit - Hill Variety', category: 'FRUITS', price: 250, unit: 'kg', description: 'Tropical passion fruit from the Manipur hills. Sweet-tart flavor, perfect for juices and desserts.' },
    ],
  },

  // Meghalaya
  {
    clerkId: 'meghalaya_farmer_1',
    name: 'John Marwein',
    email: 'john.marwein@email.com',
    phone: '+91 98765 44441',
    businessName: 'Cherrapunji Exotic Produce',
    description: 'Farmer from the wettest place on earth, specializing in rare herbs, Lakadong turmeric, and organic vegetables.',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    address: 'Cherrapunji, East Khasi Hills',
    pincode: '793108',
    elevation: 1520,
    products: [
      { title: 'Lakadong Turmeric - Cherrapunji Gold', category: 'SPICES', price: 350, unit: 'kg', description: 'Premium Lakadong turmeric from Cherrapunji. World\'s highest curcumin content (7-12%). Vibrant color, intense aroma.' },
      { title: 'Meghalaya Honey - Wild Forest', category: 'HONEY', price: 850, unit: 'kg', description: 'Pure wild honey from the rainforests of Cherrapunji. Collected using traditional methods, rich in medicinal properties.' },
      { title: 'Sohiong - Wild Mangosteen', category: 'FRUITS', price: 400, unit: 'kg', description: 'Rare wild mangosteen from Meghalaya forests. Sweet-tart flavor, rich in antioxidants. Short seasonal availability.' },
    ],
  },
  {
    clerkId: 'meghalaya_farmer_2',
    name: 'Basan Shira',
    email: 'basan.shira@email.com',
    phone: '+91 98765 44442',
    businessName: 'West Garo Hills Farm',
    description: 'Garo farmer specializing in ginger, turmeric, and cashew cultivation in the western hills of Meghalaya.',
    district: 'West Garo Hills',
    state: 'Meghalaya',
    address: 'Tura, West Garo Hills',
    pincode: '794001',
    elevation: 400,
    products: [
      { title: 'Garo Ginger - Organic', category: 'SPICES', price: 180, unit: 'kg', description: 'Premium organic ginger from Garo Hills. Intense flavor, high essential oil content, perfect for culinary and medicinal use.' },
      { title: 'Meghalaya Cashew - Raw', category: 'OTHER', price: 550, unit: 'kg', description: 'Raw cashew nuts from the Garo hills. Premium quality, naturally processed, ready for roasting.' },
    ],
  },

  // Mizoram
  {
    clerkId: 'mizoram_farmer_1',
    name: 'Lalthanmawia',
    email: 'lalthanmawia@email.com',
    phone: '+91 98765 55551',
    businessName: 'Aizawl Highland Farm',
    description: 'Mizo farmer growing ginger, turmeric, passion fruit, and bird eye chilli in the steep hills around Aizawl.',
    district: 'Aizawl',
    state: 'Mizoram',
    address: 'Aizawl, Mizoram',
    pincode: '796001',
    elevation: 1130,
    products: [
      { title: 'Mizo Bird Eye Chilli', category: 'SPICES', price: 650, unit: 'kg', description: 'Small but extremely spicy bird eye chilli from Mizoram. Popular in Southeast Asian cuisine. Grown in the hills using traditional methods.' },
      { title: 'Mizoram Passion Fruit', category: 'FRUITS', price: 280, unit: 'kg', description: 'Sweet-tart passion fruit from Mizoram hills. Perfect for juices, desserts, and cocktails.' },
      { title: 'Aizawl Ginger - Premium', category: 'SPICES', price: 200, unit: 'kg', description: 'Highland ginger from Mizoram with intense flavor. Low fiber, high aroma, perfect for culinary use.' },
    ],
  },
  {
    clerkId: 'mizoram_farmer_2',
    name: 'Vanlalruata',
    email: 'vanlalruata@email.com',
    phone: '+91 98765 55552',
    businessName: 'Champhai Valley Rice Farm',
    description: 'Rice farmer from Champhai, the rice bowl of Mizoram, near the Myanmar border.',
    district: 'Champhai',
    state: 'Mizoram',
    address: 'Champhai, Mizoram',
    pincode: '796321',
    elevation: 1450,
    products: [
      { title: 'Champhai Rice - Mizo Variety', category: 'GRAINS', price: 100, unit: 'kg', description: 'Premium short-grain rice from Champhai valley. Naturally aromatic, perfect for daily consumption.' },
      { title: 'Avocado - Mizoram Grown', category: 'FRUITS', price: 350, unit: 'kg', description: 'Creamy avocados from the cool hills of Champhai. Rich in healthy fats, perfect for salads and smoothies.' },
    ],
  },

  // Nagaland
  {
    clerkId: 'nagaland_farmer_1',
    name: 'Limasen Ao',
    email: 'limasen.ao@email.com',
    phone: '+91 98765 66661',
    businessName: 'Mokokchung Highland Produce',
    description: 'Ao Naga farmer growing exotic king chilli (ghost pepper), kiwi, and traditional hill vegetables.',
    district: 'Mokokchung',
    state: 'Nagaland',
    address: 'Chuchuyimpang, Mokokchung',
    pincode: '798601',
    elevation: 1350,
    products: [
      { title: 'Naga King Chilli (Bhut Jolokia) - Dried', category: 'SPICES', price: 1400, unit: 'kg', description: 'World-famous King Chilli from Nagaland. Once the hottest chilli in the world with over 1 million Scoville units. Essential for authentic Northeast cuisine.' },
      { title: 'Nagaland Kiwi - Premium', category: 'FRUITS', price: 350, unit: 'kg', description: 'Sweet, tangy kiwi from the high-altitude farms of Mokokchung. Grown at 1300m+ for optimal sweetness.' },
    ],
  },
  {
    clerkId: 'nagaland_farmer_2',
    name: 'Kevisekho',
    email: 'kevisekho@email.com',
    phone: '+91 98765 66662',
    businessName: 'Kohima Tribal Farm',
    description: 'Angami Naga farmer from Kohima specializing in organic vegetables, king chilli, and plums.',
    district: 'Kohima',
    state: 'Nagaland',
    address: 'Jotsoma, Kohima',
    pincode: '797001',
    elevation: 1450,
    products: [
      { title: 'Naga King Chilli - Fresh', category: 'SPICES', price: 800, unit: 'kg', description: 'Fresh King Chilli (Ghost Pepper) from Kohima farms. Handle with caution! Essential for authentic Naga cuisine.' },
      { title: 'Naga Plum - Hill Variety', category: 'FRUITS', price: 200, unit: 'kg', description: 'Sweet-tart plums from the hills of Kohima. Perfect for eating fresh or making preserves.' },
      { title: 'Bamboo Shoot - Fermented', category: 'VEGETABLES', price: 150, unit: 'kg', description: 'Traditional fermented bamboo shoot from Nagaland. Essential ingredient for authentic Naga dishes.' },
    ],
  },

  // Sikkim
  {
    clerkId: 'sikkim_farmer_1',
    name: 'Tashi Dorjee',
    email: 'tashi.dorjee@email.com',
    phone: '+91 98765 77771',
    businessName: 'Sikkim Mountain Organics',
    description: 'Organic farmer from Gangtok specializing in large cardamom, temi tea, and medicinal herbs.',
    district: 'East Sikkim',
    state: 'Sikkim',
    address: 'Gangtok, East Sikkim',
    pincode: '737101',
    elevation: 1850,
    products: [
      { title: 'Sikkim Large Cardamom (Bari Elaichi)', category: 'SPICES', price: 950, unit: 'kg', description: 'World-renowned large cardamom from Sikkim. Distinct smoky flavor and aroma. Essential for Indian cuisine and traditional medicine. GI tagged.' },
      { title: 'Temi Tea - Sikkim Orthodox', category: 'TEA', price: 500, unit: 'kg', description: 'Premium orthodox tea from Temi Tea Garden, Sikkim\'s only tea estate. Delicate flavor, golden liquor, organically grown.' },
      { title: 'Sikkim Medicinal Herbs Pack', category: 'HERBS', price: 400, unit: 'pack', description: 'Traditional medicinal herbs from the Sikkim Himalayas. Includes local varieties used in traditional medicine.' },
    ],
  },
  {
    clerkId: 'sikkim_farmer_2',
    name: 'Pemba Sherpa',
    email: 'pemba.sherpa@email.com',
    phone: '+91 98765 77772',
    businessName: 'North Sikkim Highland Farm',
    description: 'Sherpa farmer from Lachung growing buckwheat, potatoes, and high-altitude vegetables.',
    district: 'North Sikkim',
    state: 'Sikkim',
    address: 'Lachung, North Sikkim',
    pincode: '737120',
    elevation: 2800,
    products: [
      { title: 'Sikkim Buckwheat - Organic', category: 'GRAINS', price: 200, unit: 'kg', description: 'Nutritious buckwheat from the high Himalayas of North Sikkim. Gluten-free, perfect for pancakes and noodles.' },
      { title: 'Lachung Potato - Hill Variety', category: 'VEGETABLES', price: 60, unit: 'kg', description: 'Creamy potatoes from the high-altitude farms of Lachung. Perfect texture, naturally organic.' },
    ],
  },

  // Tripura
  {
    clerkId: 'tripura_farmer_1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    phone: '+91 98765 88881',
    businessName: 'Jampui Hills Organic Farm',
    description: 'Third generation farmer from the famous Jampui Hills - the orange valley of Tripura. Specializing in organic ginger and citrus.',
    district: 'North Tripura',
    state: 'Tripura',
    address: 'Jampui Hills, North Tripura',
    pincode: '799102',
    elevation: 950,
    products: [
      { title: 'Jampui Orange - Premium', category: 'FRUITS', price: 150, unit: 'kg', description: 'Famous sweet oranges from Jampui Hills, Tripura. Known as the best oranges in Northeast India. Seasonal: November to January.' },
      { title: 'Organic Ginger - Jampui Hills', category: 'SPICES', price: 180, unit: 'kg', description: 'Premium quality organic ginger from Jampui Hills. Known for its intense flavor and medicinal properties.' },
    ],
  },
  {
    clerkId: 'tripura_farmer_2',
    name: 'Suman Deb',
    email: 'suman.deb@email.com',
    phone: '+91 98765 88882',
    businessName: 'West Tripura Pineapple Farm',
    description: 'Farmer specializing in premium pineapples and jackfruit from the plains of West Tripura.',
    district: 'West Tripura',
    state: 'Tripura',
    address: 'Mohanpur, West Tripura',
    pincode: '799211',
    elevation: 15,
    products: [
      { title: 'Tripura Queen Pineapple', category: 'FRUITS', price: 70, unit: 'piece', description: 'Sweet and juicy Queen pineapple from Tripura. Known for exceptional sweetness and minimal fiber. GI tagged variety.' },
      { title: 'Fresh Jackfruit - Tripura Special', category: 'FRUITS', price: 50, unit: 'kg', description: 'Premium jackfruit from Tripura orchards. Sweet, fleshy, perfect for eating fresh or cooking.' },
    ],
  },
];

// Logistics partners for NE India
const LOGISTICS_PARTNERS = [
  {
    clerkId: 'logistics_ne_1',
    name: 'Northeast Express Logistics',
    email: 'neexpress@email.com',
    phone: '+91 98765 99991',
    businessName: 'Northeast Express Logistics',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    address: 'Guwahati, Assam',
    pincode: '781001',
    vehicleType: VehicleType.SMALL_TRUCK,
    serviceableStates: ['Assam', 'Meghalaya', 'Tripura', 'Nagaland', 'Manipur'],
    terrainExpertise: ['PLAIN', 'HILLY', 'VALLEY'],
    baseRate: 40,
    perKmRate: 10,
    terrainMultiplier: 1.5,
  },
  {
    clerkId: 'logistics_ne_2',
    name: 'Himalayan Transport Co',
    email: 'himalayan@email.com',
    phone: '+91 98765 99992',
    businessName: 'Himalayan Transport Co',
    district: 'East Sikkim',
    state: 'Sikkim',
    address: 'Gangtok, Sikkim',
    pincode: '737101',
    vehicleType: VehicleType.PICKUP,
    serviceableStates: ['Sikkim', 'Arunachal Pradesh', 'Assam'],
    terrainExpertise: ['MOUNTAINOUS', 'HILLY'],
    baseRate: 50,
    perKmRate: 12,
    terrainMultiplier: 2.0,
  },
  {
    clerkId: 'logistics_ne_3',
    name: 'Mizo Highland Carriers',
    email: 'mizohighland@email.com',
    phone: '+91 98765 99993',
    businessName: 'Mizo Highland Carriers',
    district: 'Aizawl',
    state: 'Mizoram',
    address: 'Aizawl, Mizoram',
    pincode: '796001',
    vehicleType: VehicleType.PICKUP,
    serviceableStates: ['Mizoram', 'Manipur', 'Assam'],
    terrainExpertise: ['HILLY', 'MOUNTAINOUS'],
    baseRate: 45,
    perKmRate: 11,
    terrainMultiplier: 1.8,
  },
];

// POST /api/seed - Seed database with realistic NE India data
export async function POST() {
  try {
    // Clear existing data
    await db.trackingEvent.deleteMany();
    await db.delivery.deleteMany();
    await db.cartItem.deleteMany();
    await db.order.deleteMany();
    await db.review.deleteMany();
    await db.listing.deleteMany();
    await db.rider.deleteMany();
    await db.logisticsPartner.deleteMany();
    await db.deliveryRoute.deleteMany();
    await db.notification.deleteMany();
    await db.user.deleteMany();

    // Create buyer users
    const buyers = await Promise.all([
      db.user.create({
        data: {
          clerkId: 'demo_buyer_1',
          email: 'amit.kumar@email.com',
          name: 'Amit Kumar',
          phone: '+91 12345 67890',
          role: UserRole.BUYER,
          district: 'Kamrup Metropolitan',
          state: 'Assam',
          address: 'GS Road, Guwahati, Assam',
          pincode: '781005',
          isVerified: true,
          aadhaarVerified: true,
          totalPurchases: 25,
        },
      }),
      db.user.create({
        data: {
          clerkId: 'demo_buyer_2',
          email: 'priya.sharma@email.com',
          name: 'Priya Sharma',
          phone: '+91 12345 67891',
          role: UserRole.BUYER,
          district: 'East Sikkim',
          state: 'Sikkim',
          address: 'MG Marg, Gangtok, Sikkim',
          pincode: '737101',
          isVerified: true,
          totalPurchases: 12,
        },
      }),
      db.user.create({
        data: {
          clerkId: 'demo_buyer_3',
          email: 'david.murmu@email.com',
          name: 'David Murmu',
          phone: '+91 12345 67892',
          role: UserRole.BUYER,
          district: 'West Tripura',
          state: 'Tripura',
          address: 'Agartala, Tripura',
          pincode: '799001',
          isVerified: true,
          totalPurchases: 8,
        },
      }),
    ]);

    // Create farmer users and their listings
    const farmerUsers = [];
    const allListings = [];
    
    for (const farmer of NE_FARMERS) {
      const user = await db.user.create({
        data: {
          clerkId: farmer.clerkId,
          email: farmer.email,
          name: farmer.name,
          phone: farmer.phone,
          role: UserRole.FARMER,
          businessName: farmer.businessName,
          description: farmer.description,
          district: farmer.district,
          state: farmer.state,
          address: farmer.address,
          pincode: farmer.pincode,
          isVerified: true,
          aadhaarVerified: Math.random() > 0.3,
          panVerified: Math.random() > 0.4,
          bankAccountVerified: true,
          totalSales: Math.floor(Math.random() * 100) + 10,
          rating: 4.2 + Math.random() * 0.8,
          reviewCount: Math.floor(Math.random() * 50) + 5,
        },
      });
      
      farmerUsers.push(user);

      // Create listings for this farmer
      for (const product of farmer.products) {
        const listing = await db.listing.create({
          data: {
            title: product.title,
            description: product.description,
            category: product.category as Category,
            price: product.price,
            unit: product.unit,
            minOrder: product.unit === 'piece' ? 1 : product.unit === 'pack' ? 1 : 2,
            maxQuantity: product.unit === 'piece' ? 100 : product.unit === 'pack' ? 50 : 500,
            quality: QualityGrade.A_PLUS,
            isOrganic: true,
            isVerified: true,
            district: farmer.district,
            state: farmer.state,
            elevation: farmer.elevation,
            nearestHighway: 'NH-37', // Default
            harvestDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            viewCount: Math.floor(Math.random() * 500) + 50,
            orderCount: Math.floor(Math.random() * 50) + 5,
            status: ListingStatus.ACTIVE,
            sellerId: user.id,
          },
        });
        allListings.push(listing);
      }
    }

    // Create logistics partners
    for (const partner of LOGISTICS_PARTNERS) {
      const user = await db.user.create({
        data: {
          clerkId: partner.clerkId,
          email: partner.email,
          name: partner.name,
          phone: partner.phone,
          role: UserRole.LOGISTICS,
          businessName: partner.businessName,
          district: partner.district,
          state: partner.state,
          address: partner.address,
          pincode: partner.pincode,
          isVerified: true,
        },
      });

      await db.logisticsPartner.create({
        data: {
          userId: user.id,
          businessName: partner.businessName,
          phone: partner.phone,
          vehicleType: partner.vehicleType,
          serviceableStates: JSON.stringify(partner.serviceableStates),
          terrainExpertise: JSON.stringify(partner.terrainExpertise),
          currentDistrict: partner.district,
          currentState: partner.state,
          isAvailable: true,
          baseRate: partner.baseRate,
          perKmRate: partner.perKmRate,
          terrainMultiplier: partner.terrainMultiplier,
          rating: 4.0 + Math.random() * 1.0,
          totalDeliveries: Math.floor(Math.random() * 200) + 50,
          isVerified: true,
          documentsVerified: true,
        },
      });
    }

    // Create sample orders
    const orders = [];
    for (let i = 0; i < 5; i++) {
      const buyer = buyers[i % buyers.length];
      const listing = allListings[Math.floor(Math.random() * allListings.length)];
      const quantity = Math.floor(Math.random() * 10) + 5;
      
      const order = await db.order.create({
        data: {
          buyerId: buyer.id,
          sellerId: listing.sellerId,
          listingId: listing.id,
          quantity,
          unitPrice: listing.price,
          totalPrice: listing.price * quantity,
          status: ['PENDING', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'][i] as OrderStatus,
          paymentStatus: i < 3 ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paymentMethod: 'UPI',
          deliveryAddress: buyer.address || '',
          deliveryDistrict: buyer.district || '',
          deliveryState: buyer.state || '',
          deliveryPincode: buyer.pincode || '',
          deliveryPhone: buyer.phone || '',
          terrainType: TerrainType.MIXED,
          elevationGain: Math.floor(Math.random() * 500),
          estimatedDeliveryTime: Math.floor(Math.random() * 180) + 60,
          deliveryDifficulty: Math.floor(Math.random() * 5) + 3,
        },
      });
      orders.push(order);
    }

    // Create delivery routes
    const routes = [
      { name: 'Guwahati-Shillong', pickup: 'Kamrup Metropolitan', pickupState: 'Assam', drop: 'East Khasi Hills', dropState: 'Meghalaya', distance: 100, terrain: TerrainType.HILLY },
      { name: 'Guwahati-Tawang', pickup: 'Kamrup Metropolitan', pickupState: 'Assam', drop: 'Tawang', dropState: 'Arunachal Pradesh', distance: 480, terrain: TerrainType.MOUNTAINOUS },
      { name: 'Dimapur-Kohima', pickup: 'Dimapur', pickupState: 'Nagaland', drop: 'Kohima', dropState: 'Nagaland', distance: 74, terrain: TerrainType.HILLY },
      { name: 'Gangtok-Siliguri', pickup: 'East Sikkim', pickupState: 'Sikkim', drop: 'Darjeeling', dropState: 'West Bengal', distance: 115, terrain: TerrainType.MOUNTAINOUS },
      { name: 'Agartala-Guwahati', pickup: 'West Tripura', pickupState: 'Tripura', drop: 'Kamrup Metropolitan', dropState: 'Assam', distance: 550, terrain: TerrainType.PLAIN },
    ];

    for (const route of routes) {
      await db.deliveryRoute.create({
        data: {
          name: route.name,
          pickupLocation: route.pickup,
          pickupDistrict: route.pickup,
          pickupState: route.pickupState,
          dropLocation: route.drop,
          dropDistrict: route.drop,
          dropState: route.dropState,
          terrainType: route.terrain,
          distance: route.distance,
          estimatedTime: route.distance * (route.terrain === TerrainType.MOUNTAINOUS ? 3 : route.terrain === TerrainType.HILLY ? 2 : 1.5),
          baseCost: route.distance * 8,
          elevationGain: route.terrain === TerrainType.MOUNTAINOUS ? 1500 : route.terrain === TerrainType.HILLY ? 500 : 0,
          maxElevation: route.terrain === TerrainType.MOUNTAINOUS ? 2500 : route.terrain === TerrainType.HILLY ? 1200 : 200,
          connectivityScore: route.terrain === TerrainType.MOUNTAINOUS ? 5 : route.terrain === TerrainType.HILLY ? 6 : 8,
          isActive: true,
        },
      });
    }

    // Create reviews
    await db.review.createMany({
      data: [
        { listingId: allListings[0].id, reviewerId: buyers[0].id, rating: 5, comment: 'Excellent quality! Will order again.', isVerified: true },
        { listingId: allListings[1].id, reviewerId: buyers[1].id, rating: 4, comment: 'Great product, fast delivery.', isVerified: true },
        { listingId: allListings[2].id, reviewerId: buyers[2].id, rating: 5, comment: 'Authentic quality, highly recommended!', isVerified: true },
      ],
    });

    // Create notifications
    await db.notification.createMany({
      data: [
        { userId: buyers[0].id, type: 'ORDER_DELIVERED', title: 'Order Delivered', message: 'Your order has been delivered successfully', isRead: true },
        { userId: buyers[0].id, type: 'ORDER_SHIPPED', title: 'Order Shipped', message: 'Your order is on its way', isRead: false },
        { userId: buyers[1].id, type: 'ORDER_CONFIRMED', title: 'Order Confirmed', message: 'Your order has been confirmed by the seller', isRead: false },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with NE India data',
      data: {
        farmers: farmerUsers.length,
        buyers: buyers.length,
        listings: allListings.length,
        orders: orders.length,
        routes: routes.length,
        logisticsPartners: LOGISTICS_PARTNERS.length,
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
