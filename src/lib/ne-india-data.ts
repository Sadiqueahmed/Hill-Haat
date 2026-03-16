// Comprehensive Northeast India Data for Smart Logistics
// Contains district-level data for all 8 NE states

import { TerrainType, HazardZone, RouteSegment } from './terrain-routing';

// District data interface
export interface DistrictData {
  name: string;
  state: string;
  terrainType: TerrainType;
  averageElevation: number; // in meters
  connectivityScore: number; // 1-10, where 10 is excellent connectivity
  hazards: Omit<HazardZone, 'type'> & { types: HazardZone['type'][] };
  specialProduce: string[];
  majorMarkets: string[];
  coordinates?: { lat: number; lng: number };
}

// State summary interface
export interface StateData {
  name: string;
  capital: string;
  totalDistricts: number;
  averageElevation: number;
  primaryTerrain: TerrainType;
  districts: DistrictData[];
  majorHighways: string[];
  borderCrossings?: string[];
}

// ============================================
// ARUNACHAL PRADESH - Land of Dawn-Lit Mountains
// ============================================
const arunachalPradeshDistricts: DistrictData[] = [
  {
    name: 'Tawang',
    state: 'Arunachal Pradesh',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 2669,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'FOG'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'High altitude passes prone to landslides and heavy snowfall' },
    specialProduce: ['Apple', 'Kiwi', 'Buckwheat', 'Yak Cheese'],
    majorMarkets: ['Tawang Market', 'Jang Market'],
    coordinates: { lat: 27.5860, lng: 91.8594 },
  },
  {
    name: 'West Kameng',
    state: 'Arunachal Pradesh',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 1850,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Monsoon landslides common on Bomdila route' },
    specialProduce: ['Orange', 'Ginger', 'Cardamom', 'Bamboo Shoots'],
    majorMarkets: ['Bomdila Market', 'Dirang Market'],
    coordinates: { lat: 27.2644, lng: 92.4156 },
  },
  {
    name: 'East Kameng',
    state: 'Arunachal Pradesh',
    terrainType: 'HILLY',
    averageElevation: 1250,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Remote area with limited road infrastructure' },
    specialProduce: ['Ginger', 'Turmeric', 'Millet', 'Local Vegetables'],
    majorMarkets: ['Seppa Market'],
    coordinates: { lat: 27.2789, lng: 93.0567 },
  },
  {
    name: 'Papum Pare',
    state: 'Arunachal Pradesh',
    terrainType: 'HILLY',
    averageElevation: 650,
    connectivityScore: 7,
    hazards: { types: ['LANDSLIDE'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Better connectivity due to proximity to Itanagar' },
    specialProduce: ['Rice', 'Maize', 'Ginger', 'Orange'],
    majorMarkets: ['Itanagar Market', 'Naharlagun Market', 'Doimukh Market'],
    coordinates: { lat: 27.0844, lng: 93.6053 },
  },
  {
    name: 'Kurung Kumey',
    state: 'Arunachal Pradesh',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 1900,
    connectivityScore: 2,
    hazards: { types: ['LANDSLIDE', 'NO_CONNECTIVITY', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Extremely remote with minimal connectivity' },
    specialProduce: ['Millet', 'Maize', 'Local Herbs'],
    majorMarkets: ['Koloriang Market'],
    coordinates: { lat: 27.8500, lng: 93.4167 },
  },
  {
    name: 'Lower Subansiri',
    state: 'Arunachal Pradesh',
    terrainType: 'HILLY',
    averageElevation: 1100,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Hilly terrain with moderate connectivity' },
    specialProduce: ['Rice', 'Ginger', 'Orange', 'Pineapple'],
    majorMarkets: ['Ziro Market', 'Hapoli Market'],
    coordinates: { lat: 27.5500, lng: 93.8333 },
  },
  {
    name: 'Upper Subansiri',
    state: 'Arunachal Pradesh',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 1750,
    connectivityScore: 3,
    hazards: { types: ['LANDSLIDE', 'NO_CONNECTIVITY'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Remote mountainous region with limited access' },
    specialProduce: ['Millet', 'Maize', 'Wild Herbs'],
    majorMarkets: ['Daporijo Market'],
    coordinates: { lat: 28.0000, lng: 94.2167 },
  },
  {
    name: 'West Siang',
    state: 'Arunachal Pradesh',
    terrainType: 'HILLY',
    averageElevation: 1350,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Siang river valley region' },
    specialProduce: ['Rice', 'Maize', 'Ginger', 'Orange'],
    majorMarkets: ['Along Market', 'Basar Market'],
    coordinates: { lat: 28.1667, lng: 94.8000 },
  },
  {
    name: 'East Siang',
    state: 'Arunachal Pradesh',
    terrainType: 'VALLEY',
    averageElevation: 350,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8, 9], description: 'Flood-prone due to Siang river' },
    specialProduce: ['Rice', 'Mustard', 'Ginger', 'Fish'],
    majorMarkets: ['Pasighat Market', 'Rani Market'],
    coordinates: { lat: 28.0667, lng: 95.3333 },
  },
  {
    name: 'Upper Siang',
    state: 'Arunachal Pradesh',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 2200,
    connectivityScore: 2,
    hazards: { types: ['LANDSLIDE', 'NO_CONNECTIVITY', 'POOR_ROAD'], severity: 'CRITICAL', seasonal: true, months: [5, 6, 7, 8, 9], description: 'Extremely remote high-altitude region' },
    specialProduce: ['Millet', 'Wild Herbs', 'Medicinal Plants'],
    majorMarkets: ['Yingkiong Market'],
    coordinates: { lat: 28.6000, lng: 94.9000 },
  },
  {
    name: 'Dibang Valley',
    state: 'Arunachal Pradesh',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 2400,
    connectivityScore: 2,
    hazards: { types: ['LANDSLIDE', 'NO_CONNECTIVITY'], severity: 'CRITICAL', seasonal: true, months: [5, 6, 7, 8, 9, 10], description: 'One of the most remote districts in India' },
    specialProduce: ['Wild Herbs', 'Bamboo Shoots', 'Local Berries'],
    majorMarkets: ['Anini Market'],
    coordinates: { lat: 28.8500, lng: 95.9000 },
  },
  {
    name: 'Lohit',
    state: 'Arunachal Pradesh',
    terrainType: 'HILLY',
    averageElevation: 850,
    connectivityScore: 6,
    hazards: { types: ['FLOOD', 'LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Lohit river flood plains with hilly areas' },
    specialProduce: ['Rice', 'Ginger', 'Orange', 'Tea Leaves'],
    majorMarkets: ['Tezu Market', 'Namsai Market'],
    coordinates: { lat: 27.9167, lng: 96.1667 },
  },
  {
    name: 'Changlang',
    state: 'Arunachal Pradesh',
    terrainType: 'HILLY',
    averageElevation: 750,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE', 'FLOOD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Easternmost district with mixed terrain' },
    specialProduce: ['Rice', 'Maize', 'Ginger', 'Cane Products'],
    majorMarkets: ['Changlang Market', 'Khonsa Market'],
    coordinates: { lat: 27.3167, lng: 96.4333 },
  },
  {
    name: 'Tirap',
    state: 'Arunachal Pradesh',
    terrainType: 'HILLY',
    averageElevation: 900,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Border district with challenging terrain' },
    specialProduce: ['Rice', 'Ginger', 'Orange', 'Cane Products'],
    majorMarkets: ['Khonsa Market', 'Deomali Market'],
    coordinates: { lat: 27.0500, lng: 96.5500 },
  },
  {
    name: 'Longding',
    state: 'Arunachal Pradesh',
    terrainType: 'HILLY',
    averageElevation: 1050,
    connectivityScore: 3,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD', 'NO_CONNECTIVITY'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Newly created district with limited infrastructure' },
    specialProduce: ['Rice', 'Maize', 'Ginger'],
    majorMarkets: ['Longding Market', 'Kanubari Market'],
    coordinates: { lat: 26.8667, lng: 95.3167 },
  },
  {
    name: 'Namsai',
    state: 'Arunachal Pradesh',
    terrainType: 'PLAIN',
    averageElevation: 150,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Plain area prone to flooding' },
    specialProduce: ['Rice', 'Mustard', 'Sugarcane', 'Tea'],
    majorMarkets: ['Namsai Market', 'Mahadevpur Market'],
    coordinates: { lat: 27.6667, lng: 95.8500 },
  },
];

// ============================================
// ASSAM - Gateway to Northeast India
// ============================================
const assamDistricts: DistrictData[] = [
  {
    name: 'Baksa',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 80,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Brahmaputra floodplain - severe flooding during monsoon' },
    specialProduce: ['Rice', 'Mustard', 'Jute', 'Vegetables'],
    majorMarkets: ['Mushalpur Market', 'Tamulpur Market'],
    coordinates: { lat: 26.5333, lng: 91.3500 },
  },
  {
    name: 'Barpeta',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 50,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Low-lying area near Brahmaputra' },
    specialProduce: ['Rice', 'Mustard', 'Potato', 'Jute'],
    majorMarkets: ['Barpeta Market', 'Pathsala Market'],
    coordinates: { lat: 26.3167, lng: 91.0000 },
  },
  {
    name: 'Biswanath',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 75,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Brahmaputra valley region' },
    specialProduce: ['Rice', 'Tea', 'Sugarcane', 'Mustard'],
    majorMarkets: ['Biswanath Chariali Market', 'Gohpur Market'],
    coordinates: { lat: 26.7333, lng: 93.1500 },
  },
  {
    name: 'Bongaigaon',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 65,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Industrial town with good connectivity' },
    specialProduce: ['Rice', 'Mustard', 'Vegetables', 'Fish'],
    majorMarkets: ['Bongaigaon Market', 'Abhayapuri Market'],
    coordinates: { lat: 26.4833, lng: 90.5667 },
  },
  {
    name: 'Cachar',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 25,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Barak valley - flood prone' },
    specialProduce: ['Rice', 'Tea', 'Ginger', 'Pineapple', 'Lemon'],
    majorMarkets: ['Silchar Market', 'Lakhipur Market'],
    coordinates: { lat: 24.8333, lng: 92.7833 },
  },
  {
    name: 'Charaideo',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 95,
    connectivityScore: 5,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Newly formed district' },
    specialProduce: ['Rice', 'Tea', 'Mustard', 'Ginger'],
    majorMarkets: ['Sonari Market', 'Sapekhati Market'],
    coordinates: { lat: 26.9667, lng: 94.7500 },
  },
  {
    name: 'Chirang',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 70,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Bodo Territorial Region' },
    specialProduce: ['Rice', 'Mustard', 'Vegetables', 'Fish'],
    majorMarkets: ['Kajalgaon Market', 'Basugaon Market'],
    coordinates: { lat: 26.5500, lng: 90.6000 },
  },
  {
    name: 'Darrang',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 70,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Brahmaputra floodplain' },
    specialProduce: ['Rice', 'Jute', 'Potato', 'Mustard'],
    majorMarkets: ['Mangaldoi Market', 'Dalgaon Market'],
    coordinates: { lat: 26.4500, lng: 92.1000 },
  },
  {
    name: 'Dhemaji',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 95,
    connectivityScore: 4,
    hazards: { types: ['FLOOD'], severity: 'CRITICAL', seasonal: true, months: [5, 6, 7, 8, 9], description: 'Severe annual flooding from Brahmaputra tributaries' },
    specialProduce: ['Rice', 'Mustard', 'Ginger', 'Vegetables'],
    majorMarkets: ['Dhemaji Market', 'Silapathar Market'],
    coordinates: { lat: 27.4833, lng: 94.5833 },
  },
  {
    name: 'Dhubri',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 30,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Low-lying char area near Bangladesh border' },
    specialProduce: ['Rice', 'Jute', 'Betel Nut', 'Fish'],
    majorMarkets: ['Dhubri Market', 'Bilasipara Market', 'Gauripur Market'],
    coordinates: { lat: 26.0167, lng: 89.9833 },
  },
  {
    name: 'Dibrugarh',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 95,
    connectivityScore: 8,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Tea hub with excellent connectivity' },
    specialProduce: ['Tea', 'Rice', 'Mustard', 'Bamboo Products'],
    majorMarkets: ['Dibrugarh Market', 'Chabua Market', 'Naharkatia Market'],
    coordinates: { lat: 27.4833, lng: 94.9000 },
  },
  {
    name: 'Dima Hasao',
    state: 'Assam',
    terrainType: 'HILLY',
    averageElevation: 650,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Hill district with limited road access' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Pineapple'],
    majorMarkets: ['Haflong Market', 'Maibang Market'],
    coordinates: { lat: 25.1667, lng: 93.0333 },
  },
  {
    name: 'Goalpara',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 40,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Brahmaputra floodplain' },
    specialProduce: ['Rice', 'Jute', 'Mustard', 'Fish', 'Betel Nut'],
    majorMarkets: ['Goalpara Market', 'Lakhipur Market'],
    coordinates: { lat: 26.1667, lng: 90.6167 },
  },
  {
    name: 'Golaghat',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 85,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Tea growing area near Kaziranga' },
    specialProduce: ['Tea', 'Rice', 'Mustard', 'Orange'],
    majorMarkets: ['Golaghat Market', 'Dergaon Market', 'Bokakhat Market'],
    coordinates: { lat: 26.5167, lng: 93.9667 },
  },
  {
    name: 'Hailakandi',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 25,
    connectivityScore: 5,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Barak valley district' },
    specialProduce: ['Rice', 'Tea', 'Ginger', 'Pineapple'],
    majorMarkets: ['Hailakandi Market', 'Lala Market'],
    coordinates: { lat: 24.6833, lng: 92.5667 },
  },
  {
    name: 'Hojai',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 80,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Newly formed district' },
    specialProduce: ['Rice', 'Ginger', 'Mustard', 'Vegetables'],
    majorMarkets: ['Hojai Market', 'Lanka Market'],
    coordinates: { lat: 26.0000, lng: 92.8667 },
  },
  {
    name: 'Jorhat',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 115,
    connectivityScore: 8,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Tea capital with excellent infrastructure' },
    specialProduce: ['Tea', 'Rice', 'Mustard', 'Ginger', 'Fish'],
    majorMarkets: ['Jorhat Market', 'Titabor Market', 'Mariani Market'],
    coordinates: { lat: 26.7500, lng: 94.2167 },
  },
  {
    name: 'Kamrup',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 55,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Rural Guwahati region' },
    specialProduce: ['Rice', 'Vegetables', 'Fish', 'Areca Nut'],
    majorMarkets: ['Palashbari Market', 'Hajo Market', 'Chhaygaon Market'],
    coordinates: { lat: 26.3500, lng: 91.4667 },
  },
  {
    name: 'Kamrup Metropolitan',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 55,
    connectivityScore: 10,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Guwahati city - best connectivity in NE' },
    specialProduce: ['Vegetables', 'Fish', 'Dairy Products', 'Flowers'],
    majorMarkets: ['Fancy Bazaar', 'Paltan Bazaar', 'Six Mile Market', 'Ganeshguri Market'],
    coordinates: { lat: 26.1445, lng: 91.7362 },
  },
  {
    name: 'Karbi Anglong',
    state: 'Assam',
    terrainType: 'HILLY',
    averageElevation: 550,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Largest district with hilly terrain' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Bamboo', 'Broom Grass'],
    majorMarkets: ['Diphu Market', 'Hamren Market', 'Bokolia Market'],
    coordinates: { lat: 25.8500, lng: 93.4833 },
  },
  {
    name: 'Karimganj',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 20,
    connectivityScore: 5,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Border district with Bangladesh' },
    specialProduce: ['Rice', 'Tea', 'Fish', 'Betel Leaf'],
    majorMarkets: ['Karimganj Market', 'Badarpur Market', 'Patherkandi Market'],
    coordinates: { lat: 24.8500, lng: 92.3500 },
  },
  {
    name: 'Kokrajhar',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 45,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Bodo Territorial Region headquarters' },
    specialProduce: ['Rice', 'Jute', 'Mustard', 'Fish'],
    majorMarkets: ['Kokrajhar Market', 'Gossaigaon Market'],
    coordinates: { lat: 26.4000, lng: 90.2667 },
  },
  {
    name: 'Lakhimpur',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 90,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Subansiri and Brahmaputra floodplains' },
    specialProduce: ['Rice', 'Mustard', 'Tea', 'Ginger'],
    majorMarkets: ['North Lakhimpur Market', 'Dhakuakhana Market'],
    coordinates: { lat: 27.2333, lng: 94.1000 },
  },
  {
    name: 'Majuli',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 35,
    connectivityScore: 3,
    hazards: { types: ['FLOOD'], severity: 'CRITICAL', seasonal: true, months: [5, 6, 7, 8, 9], description: 'World\'s largest river island - accessible only by ferry' },
    specialProduce: ['Rice', 'Mustard', 'Potato', 'Handloom Products'],
    majorMarkets: ['Garmur Market', 'Kamalabari Market'],
    coordinates: { lat: 26.9500, lng: 94.1667 },
  },
  {
    name: 'Morigaon',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 55,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Brahmaputra floodplain' },
    specialProduce: ['Rice', 'Jute', 'Mustard', 'Fish', 'Potato'],
    majorMarkets: ['Morigaon Market', 'Laharighat Market'],
    coordinates: { lat: 26.2500, lng: 92.3667 },
  },
  {
    name: 'Nagaon',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 65,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Central Assam plains' },
    specialProduce: ['Rice', 'Jute', 'Mustard', 'Fish', 'Betel Nut'],
    majorMarkets: ['Nagaon Market', 'Hojai Market', 'Kampur Market'],
    coordinates: { lat: 26.3500, lng: 92.6833 },
  },
  {
    name: 'Nalbari',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 45,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Near Guwahati with good connectivity' },
    specialProduce: ['Rice', 'Mustard', 'Jute', 'Vegetables'],
    majorMarkets: ['Nalbari Market', 'Tihu Market'],
    coordinates: { lat: 26.4500, lng: 91.4333 },
  },
  {
    name: 'Sivasagar',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 95,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Historic town with tea gardens' },
    specialProduce: ['Tea', 'Rice', 'Mustard', 'Fish'],
    majorMarkets: ['Sivasagar Market', 'Nazira Market', 'Simaluguri Market'],
    coordinates: { lat: 26.9833, lng: 94.6333 },
  },
  {
    name: 'Sonitpur',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 85,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Tezpur region with tea estates' },
    specialProduce: ['Tea', 'Rice', 'Mustard', 'Fish', 'Bamboo'],
    majorMarkets: ['Tezpur Market', 'Biswanath Chariali Market', 'Rangapara Market'],
    coordinates: { lat: 26.6333, lng: 92.7833 },
  },
  {
    name: 'South Salmara',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 25,
    connectivityScore: 4,
    hazards: { types: ['FLOOD'], severity: 'CRITICAL', seasonal: true, months: [6, 7, 8, 9], description: 'Char area with severe flooding' },
    specialProduce: ['Rice', 'Jute', 'Fish', 'Betel Nut'],
    majorMarkets: ['Hatsingimari Market', 'Mankachar Market'],
    coordinates: { lat: 25.8833, lng: 89.9833 },
  },
  {
    name: 'Tinsukia',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 115,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Tea and oil town' },
    specialProduce: ['Tea', 'Rice', 'Ginger', 'Mustard', 'Oranges'],
    majorMarkets: ['Tinsukia Market', 'Duliajan Market', 'Digboi Market', 'Margherita Market'],
    coordinates: { lat: 27.5000, lng: 95.3667 },
  },
  {
    name: 'Udalguri',
    state: 'Assam',
    terrainType: 'PLAIN',
    averageElevation: 65,
    connectivityScore: 5,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Bodo Territorial Region' },
    specialProduce: ['Rice', 'Mustard', 'Ginger', 'Vegetables'],
    majorMarkets: ['Udalguri Market', 'Tangla Market', 'Kalaigaon Market'],
    coordinates: { lat: 26.7500, lng: 92.1000 },
  },
  {
    name: 'West Karbi Anglong',
    state: 'Assam',
    terrainType: 'HILLY',
    averageElevation: 450,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Newly formed hill district' },
    specialProduce: ['Ginger', 'Turmeric', 'Bamboo', 'Honey'],
    majorMarkets: ['Hamren Market', 'Donkamokam Market'],
    coordinates: { lat: 25.7500, lng: 92.6333 },
  },
];

// ============================================
// MANIPUR - Jewel of India
// ============================================
const manipurDistricts: DistrictData[] = [
  {
    name: 'Bishnupur',
    state: 'Manipur',
    terrainType: 'VALLEY',
    averageElevation: 790,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Loktak lake area' },
    specialProduce: ['Rice', 'Fish', 'Vegetables', 'Water Chestnut'],
    majorMarkets: ['Bishnupur Market', 'Nambol Market', 'Moirang Market'],
    coordinates: { lat: 24.6000, lng: 93.7500 },
  },
  {
    name: 'Chandel',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 950,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Border district with Myanmar' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Chilli'],
    majorMarkets: ['Jiribam Market', 'Moreh Market'],
    coordinates: { lat: 24.3333, lng: 93.9833 },
  },
  {
    name: 'Churachandpur',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 920,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Largest hill district' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Pineapple', 'Banana'],
    majorMarkets: ['Churachandpur Market', 'Thanlon Market'],
    coordinates: { lat: 24.3333, lng: 93.6833 },
  },
  {
    name: 'Imphal East',
    state: 'Manipur',
    terrainType: 'VALLEY',
    averageElevation: 785,
    connectivityScore: 8,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Imphal valley - good connectivity' },
    specialProduce: ['Rice', 'Vegetables', 'Fish', 'Floriculture'],
    majorMarkets: ['Imphal Keithel', 'Porompat Market', 'Kongba Market'],
    coordinates: { lat: 24.8167, lng: 93.9500 },
  },
  {
    name: 'Imphal West',
    state: 'Manipur',
    terrainType: 'VALLEY',
    averageElevation: 782,
    connectivityScore: 8,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'State capital region' },
    specialProduce: ['Rice', 'Vegetables', 'Fish', 'Handloom Products'],
    majorMarkets: ['Ima Keithel (Mothers Market)', 'Lamphel Market'],
    coordinates: { lat: 24.8000, lng: 93.9333 },
  },
  {
    name: 'Jiribam',
    state: 'Manipur',
    terrainType: 'PLAIN',
    averageElevation: 150,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Railhead and border with Assam' },
    specialProduce: ['Rice', 'Banana', 'Areca Nut', 'Ginger'],
    majorMarkets: ['Jiribam Market'],
    coordinates: { lat: 24.8000, lng: 93.1167 },
  },
  {
    name: 'Kakching',
    state: 'Manipur',
    terrainType: 'VALLEY',
    averageElevation: 780,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Agricultural heartland' },
    specialProduce: ['Rice', 'Vegetables', 'Fish', 'Sugarcane'],
    majorMarkets: ['Kakching Market', 'Wabagai Market'],
    coordinates: { lat: 24.4833, lng: 93.9833 },
  },
  {
    name: 'Kamjong',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 1100,
    connectivityScore: 3,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD', 'NO_CONNECTIVITY'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Remote hill district' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Wild Herbs'],
    majorMarkets: ['Kamjong Market'],
    coordinates: { lat: 24.9333, lng: 94.1667 },
  },
  {
    name: 'Kangpokpi',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 1050,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'NH-2 corridor district' },
    specialProduce: ['Ginger', 'Orange', 'Banana', 'Vegetables'],
    majorMarkets: ['Kangpokpi Market', 'Sadar Hills Market'],
    coordinates: { lat: 24.9333, lng: 93.8500 },
  },
  {
    name: 'Noney',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 1200,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8], description: 'Newly formed district' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Bamboo Shoots'],
    majorMarkets: ['Noney Market', 'Longmai Market'],
    coordinates: { lat: 24.5500, lng: 93.4500 },
  },
  {
    name: 'Pherzawl',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 1300,
    connectivityScore: 3,
    hazards: { types: ['LANDSLIDE', 'NO_CONNECTIVITY'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Remote border district' },
    specialProduce: ['Ginger', 'Wild Herbs', 'Bamboo Products'],
    majorMarkets: ['Pherzawl Market'],
    coordinates: { lat: 24.0000, lng: 93.3167 },
  },
  {
    name: 'Senapati',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 1150,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Strategic location on NH-2' },
    specialProduce: ['Ginger', 'Orange', 'Potato', 'Cabbage', 'Maize'],
    majorMarkets: ['Senapati Market', 'Mao Market'],
    coordinates: { lat: 25.2500, lng: 93.9167 },
  },
  {
    name: 'Tamenglong',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 1350,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Remote western hills' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Alu (Hill Potato)', 'Lemon'],
    majorMarkets: ['Tamenglong Market', 'Nungba Market'],
    coordinates: { lat: 24.9667, lng: 93.5167 },
  },
  {
    name: 'Tengnoupal',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 1250,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'HIGH', seasonal: true, months: [6, 7, 8], description: 'Moreh border trade route' },
    specialProduce: ['Ginger', 'Orange', 'Chilli', 'Banana'],
    majorMarkets: ['Moreh Market', 'Tengnoupal Market'],
    coordinates: { lat: 24.2500, lng: 94.0833 },
  },
  {
    name: 'Thoubal',
    state: 'Manipur',
    terrainType: 'VALLEY',
    averageElevation: 785,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Ikop lake area' },
    specialProduce: ['Rice', 'Fish', 'Vegetables', 'Sugarcane'],
    majorMarkets: ['Thoubal Market', 'Kakching Market', 'Wangjing Market'],
    coordinates: { lat: 24.6000, lng: 93.9833 },
  },
  {
    name: 'Ukhrul',
    state: 'Manipur',
    terrainType: 'HILLY',
    averageElevation: 1450,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Naga hill district' },
    specialProduce: ['Shiitake Mushroom', 'Naga Chilli', 'Saffron (experimental)', 'Plum'],
    majorMarkets: ['Ukhrul Market', 'Tusom Market'],
    coordinates: { lat: 25.0833, lng: 94.3667 },
  },
];

// ============================================
// MEGHALAYA - Abode of Clouds
// ============================================
const meghalayaDistricts: DistrictData[] = [
  {
    name: 'East Garo Hills',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 450,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Garo hills region' },
    specialProduce: ['Ginger', 'Turmeric', 'Areca Nut', 'Cashew', 'Orange'],
    majorMarkets: ['Williamnagar Market', 'Rongjeng Market'],
    coordinates: { lat: 25.4500, lng: 90.6000 },
  },
  {
    name: 'East Jaintia Hills',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 1200,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE', 'FOG'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Coal mining area' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Tea'],
    majorMarkets: ['Khliehriat Market', 'Ladrymbai Market'],
    coordinates: { lat: 25.1667, lng: 92.3667 },
  },
  {
    name: 'East Khasi Hills',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 1520,
    connectivityScore: 7,
    hazards: { types: ['LANDSLIDE', 'FOG'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Shillong plateau - heavy rainfall area' },
    specialProduce: ['Potato', 'Ginger', 'Honey', 'Orchids', 'Tea'],
    majorMarkets: ['Shillong (Bara Bazaar)', 'Laitumkhrah Market', 'Polo Market'],
    coordinates: { lat: 25.5788, lng: 91.8933 },
  },
  {
    name: 'North Garo Hills',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 350,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Newly formed district' },
    specialProduce: ['Areca Nut', 'Ginger', 'Turmeric', 'Banana'],
    majorMarkets: ['Resubelpara Market', 'Mendipathar Market'],
    coordinates: { lat: 25.8833, lng: 90.6167 },
  },
  {
    name: 'Ri Bhoi',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 650,
    connectivityScore: 6,
    hazards: { types: ['LANDSLIDE'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Gateway to Meghalaya from Assam' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Pineapple', 'Areca Nut'],
    majorMarkets: ['Nongpoh Market', 'Byrnihat Market'],
    coordinates: { lat: 25.9000, lng: 91.8833 },
  },
  {
    name: 'South Garo Hills',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 500,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Remote Garo hills' },
    specialProduce: ['Ginger', 'Turmeric', 'Cashew', 'Areca Nut'],
    majorMarkets: ['Baghmara Market', 'Gasuapara Market'],
    coordinates: { lat: 25.2000, lng: 90.6333 },
  },
  {
    name: 'South West Garo Hills',
    state: 'Meghalaya',
    terrainType: 'PLAIN',
    averageElevation: 100,
    connectivityScore: 5,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8, 9], description: 'Plains bordering Bangladesh' },
    specialProduce: ['Rice', 'Jute', 'Areca Nut', 'Fish'],
    majorMarkets: ['Ampati Market', 'Mahendraganj Market'],
    coordinates: { lat: 25.4667, lng: 90.0000 },
  },
  {
    name: 'South West Khasi Hills',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 1450,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Newly formed district' },
    specialProduce: ['Potato', 'Ginger', 'Orange', 'Honey'],
    majorMarkets: ['Mawkyrwat Market', 'Ranikor Market'],
    coordinates: { lat: 25.3667, lng: 91.4667 },
  },
  {
    name: 'West Garo Hills',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 400,
    connectivityScore: 6,
    hazards: { types: ['LANDSLIDE', 'FLOOD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Largest Garo district' },
    specialProduce: ['Ginger', 'Turmeric', 'Areca Nut', 'Cashew', 'Orange'],
    majorMarkets: ['Tura Market', 'Phulbari Market', 'Rongram Market'],
    coordinates: { lat: 25.5167, lng: 90.2167 },
  },
  {
    name: 'West Jaintia Hills',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 1380,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE', 'FOG'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Limestone mining area' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Potato'],
    majorMarkets: ['Jowai Market', 'Khliehriat Market'],
    coordinates: { lat: 25.4500, lng: 92.2000 },
  },
  {
    name: 'West Khasi Hills',
    state: 'Meghalaya',
    terrainType: 'HILLY',
    averageElevation: 1450,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Remote Khasi hills' },
    specialProduce: ['Potato', 'Ginger', 'Honey', 'Broom Grass'],
    majorMarkets: ['Nongstoin Market', 'Mairang Market'],
    coordinates: { lat: 25.5167, lng: 91.2667 },
  },
];

// ============================================
// MIZORAM - Land of the Highlanders
// ============================================
const mizoramDistricts: DistrictData[] = [
  {
    name: 'Aizawl',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 1130,
    connectivityScore: 7,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'State capital with steep terrain' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Banana', 'Anthurium'],
    majorMarkets: ['Bara Bazaar (Aizawl)', 'Millennium Centre', 'Thuampui Market'],
    coordinates: { lat: 23.7307, lng: 92.7173 },
  },
  {
    name: 'Champhai',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 1450,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Border with Myanmar - rice bowl' },
    specialProduce: ['Rice', 'Ginger', 'Turmeric', 'Orange', 'Grapes'],
    majorMarkets: ['Champhai Market', 'Khawzawl Market'],
    coordinates: { lat: 23.4500, lng: 93.3167 },
  },
  {
    name: 'Hnahthial',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 850,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Newly formed district' },
    specialProduce: ['Ginger', 'Turmeric', 'Banana', 'Orange'],
    majorMarkets: ['Hnahthial Market'],
    coordinates: { lat: 22.9333, lng: 93.0333 },
  },
  {
    name: 'Khawzawl',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 1300,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Newly formed district' },
    specialProduce: ['Rice', 'Ginger', 'Orange', 'Vegetables'],
    majorMarkets: ['Khawzawl Market'],
    coordinates: { lat: 23.3333, lng: 93.1167 },
  },
  {
    name: 'Kolasib',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 750,
    connectivityScore: 6,
    hazards: { types: ['LANDSLIDE'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'NH-54 corridor' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Banana'],
    majorMarkets: ['Kolasib Market', 'Bilkhawthlir Market'],
    coordinates: { lat: 24.2167, lng: 92.6833 },
  },
  {
    name: 'Lawngtlai',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 900,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Southernmost district' },
    specialProduce: ['Ginger', 'Turmeric', 'Banana', 'Areca Nut'],
    majorMarkets: ['Lawngtlai Market'],
    coordinates: { lat: 22.5333, lng: 92.7833 },
  },
  {
    name: 'Lunglei',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 1000,
    connectivityScore: 6,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Second largest town' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Banana', 'Bamboo'],
    majorMarkets: ['Lunglei Market', 'Hnahthial Market'],
    coordinates: { lat: 22.8833, lng: 92.7500 },
  },
  {
    name: 'Mamit',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 700,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Dampa Tiger Reserve area' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Banana', 'Coffee'],
    majorMarkets: ['Mamit Market', 'Reiek Market'],
    coordinates: { lat: 23.9333, lng: 92.4833 },
  },
  {
    name: 'Saiha',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 1300,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Palak Dil lake region' },
    specialProduce: ['Ginger', 'Turmeric', 'Fish', 'Orange'],
    majorMarkets: ['Saiha Market', 'Tuipang Market'],
    coordinates: { lat: 22.4833, lng: 92.9833 },
  },
  {
    name: 'Saitual',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 1050,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Newly formed district' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Vegetables'],
    majorMarkets: ['Saitual Market'],
    coordinates: { lat: 23.4000, lng: 92.8500 },
  },
  {
    name: 'Serchhip',
    state: 'Mizoram',
    terrainType: 'HILLY',
    averageElevation: 1100,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Central Mizoram district' },
    specialProduce: ['Ginger', 'Turmeric', 'Rice', 'Orange'],
    majorMarkets: ['Serchhip Market'],
    coordinates: { lat: 23.3000, lng: 92.8500 },
  },
];

// ============================================
// NAGALAND - Land of Festivals
// ============================================
const nagalandDistricts: DistrictData[] = [
  {
    name: 'Chumoukedima',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 350,
    connectivityScore: 6,
    hazards: { types: ['LANDSLIDE'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Gateway to Nagaland from Assam' },
    specialProduce: ['Ginger', 'Turmeric', 'Chilli', 'Vegetables'],
    majorMarkets: ['Chumoukedima Market', 'Medziphema Market'],
    coordinates: { lat: 25.7833, lng: 93.7333 },
  },
  {
    name: 'Dimapur',
    state: 'Nagaland',
    terrainType: 'PLAIN',
    averageElevation: 195,
    connectivityScore: 8,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Commercial hub - only plains district' },
    specialProduce: ['Rice', 'Vegetables', 'Fish', 'Ginger', 'Pineapple'],
    majorMarkets: ['Dimapur Super Market', 'New Market', 'Hong Kong Market'],
    coordinates: { lat: 25.9167, lng: 93.7333 },
  },
  {
    name: 'Kiphire',
    state: 'Nagaland',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 1650,
    connectivityScore: 3,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD', 'NO_CONNECTIVITY'], severity: 'HIGH', seasonal: true, months: [5, 6, 7, 8, 9], description: 'Remote eastern district' },
    specialProduce: ['Naga Chilli', 'Ginger', 'Orange', 'Wild Herbs'],
    majorMarkets: ['Kiphire Market', 'Pungro Market'],
    coordinates: { lat: 25.8500, lng: 94.7667 },
  },
  {
    name: 'Kohima',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1450,
    connectivityScore: 7,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'State capital on hilltop' },
    specialProduce: ['Naga Chilli', 'Ginger', 'Orange', 'Plum', 'Vegetables'],
    majorMarkets: ['Kohima Main Market', 'Super Market'],
    coordinates: { lat: 25.6586, lng: 94.1086 },
  },
  {
    name: 'Longleng',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1150,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Remote Phom Naga district' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Maize'],
    majorMarkets: ['Longleng Market'],
    coordinates: { lat: 26.4500, lng: 94.8000 },
  },
  {
    name: 'Mokokchung',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1350,
    connectivityScore: 6,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Ao Naga heartland' },
    specialProduce: ['Naga Chilli', 'Ginger', 'Orange', 'Plum', 'Rice'],
    majorMarkets: ['Mokokchung Market', 'Tuli Market', 'Changtongya Market'],
    coordinates: { lat: 26.3333, lng: 94.5333 },
  },
  {
    name: 'Mon',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 950,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Konyak Naga district - remote' },
    specialProduce: ['Naga Chilli', 'Ginger', 'Orange', 'Pineapple', 'Wild Herbs'],
    majorMarkets: ['Mon Market', 'Naginimora Market'],
    coordinates: { lat: 26.7500, lng: 95.0833 },
  },
  {
    name: 'Niuland',
    state: 'Nagaland',
    terrainType: 'PLAIN',
    averageElevation: 200,
    connectivityScore: 5,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8], description: 'Newly formed plains district' },
    specialProduce: ['Rice', 'Vegetables', 'Ginger', 'Fish'],
    majorMarkets: ['Niuland Market', 'Athibung Market'],
    coordinates: { lat: 25.7500, lng: 93.6833 },
  },
  {
    name: 'Noklak',
    state: 'Nagaland',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 1550,
    connectivityScore: 3,
    hazards: { types: ['LANDSLIDE', 'NO_CONNECTIVITY', 'POOR_ROAD'], severity: 'CRITICAL', seasonal: true, months: [5, 6, 7, 8, 9, 10], description: 'Most remote district - Khiamniungan' },
    specialProduce: ['Naga Chilli', 'Ginger', 'Wild Herbs', 'Bamboo Shoots'],
    majorMarkets: ['Noklak Market'],
    coordinates: { lat: 26.1333, lng: 94.9500 },
  },
  {
    name: 'Peren',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1050,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Zeliangrong Naga district' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Pineapple', 'Chilli'],
    majorMarkets: ['Peren Market', 'Jalukie Market'],
    coordinates: { lat: 25.5167, lng: 93.6833 },
  },
  {
    name: 'Phek',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1350,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Chakhesang Naga district' },
    specialProduce: ['Naga Chilli', 'Ginger', 'Orange', 'Plum', 'Cane Products'],
    majorMarkets: ['Phek Market', 'Chozuba Market', 'Meluri Market'],
    coordinates: { lat: 25.6667, lng: 94.4333 },
  },
  {
    name: 'Shamator',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1250,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Newly formed Yimkhiung district' },
    specialProduce: ['Naga Chilli', 'Ginger', 'Orange', 'Wild Herbs'],
    majorMarkets: ['Shamator Market'],
    coordinates: { lat: 26.1833, lng: 94.7167 },
  },
  {
    name: 'Tseminyu',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1100,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Newly formed Rengma district' },
    specialProduce: ['Ginger', 'Turmeric', 'Orange', 'Vegetables'],
    majorMarkets: ['Tseminyu Market'],
    coordinates: { lat: 25.7500, lng: 93.9167 },
  },
  {
    name: 'Tuensang',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1450,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Largest and oldest district' },
    specialProduce: ['Naga Chilli', 'Ginger', 'Orange', 'Wild Herbs', 'Cane Products'],
    majorMarkets: ['Tuensang Market', 'Noklak Market'],
    coordinates: { lat: 26.2333, lng: 94.8000 },
  },
  {
    name: 'Wokha',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1050,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Lotha Naga district - land of amur falcons' },
    specialProduce: ['Naga Chilli', 'Ginger', 'Orange', 'Pineapple', 'Bamboo Shoots'],
    majorMarkets: ['Wokha Market', 'Sanis Market'],
    coordinates: { lat: 26.1000, lng: 94.2667 },
  },
  {
    name: 'Zunheboto',
    state: 'Nagaland',
    terrainType: 'HILLY',
    averageElevation: 1350,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Sumi Naga heartland - special mention' },
    specialProduce: ['Naga Chilli (King Chilli)', 'Ginger', 'Orange', 'Plum', 'Wild Herbs'],
    majorMarkets: ['Zunheboto Market', 'Satakha Market', 'Aghunato Market'],
    coordinates: { lat: 25.9500, lng: 94.5167 },
  },
];

// ============================================
// SIKKIM - Land of Monasteries
// ============================================
const sikkimDistricts: DistrictData[] = [
  {
    name: 'East Sikkim',
    state: 'Sikkim',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 1850,
    connectivityScore: 7,
    hazards: { types: ['LANDSLIDE', 'FOG'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Gangtok and surrounding areas' },
    specialProduce: ['Cardamom (Large)', 'Ginger', 'Turmeric', 'Oranges', 'Tea'],
    majorMarkets: ['Gangtok (Lal Bazaar)', 'MG Marg Market', 'Ranipool Market'],
    coordinates: { lat: 27.3333, lng: 88.6167 },
  },
  {
    name: 'North Sikkim',
    state: 'Sikkim',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 2800,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'NO_CONNECTIVITY'], severity: 'CRITICAL', seasonal: true, months: [5, 6, 7, 8, 9, 10], description: 'High altitude - Lachung, Lachen' },
    specialProduce: ['Cardamom', 'Potato', 'Cabbage', 'Kiwi', 'Medicinal Herbs'],
    majorMarkets: ['Mangan Market', 'Lachung Market', 'Chungthang Market'],
    coordinates: { lat: 27.5000, lng: 88.5333 },
  },
  {
    name: 'South Sikkim',
    state: 'Sikkim',
    terrainType: 'HILLY',
    averageElevation: 1400,
    connectivityScore: 6,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Temperate region' },
    specialProduce: ['Cardamom', 'Ginger', 'Turmeric', 'Orange', 'Maize'],
    majorMarkets: ['Namchi Market', 'Jorethang Market', 'Ravangla Market'],
    coordinates: { lat: 27.1667, lng: 88.3500 },
  },
  {
    name: 'West Sikkim',
    state: 'Sikkim',
    terrainType: 'MOUNTAINOUS',
    averageElevation: 1950,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE', 'FOG'], severity: 'HIGH', seasonal: true, months: [6, 7, 8, 9], description: 'Pelling and Khecheopalri region' },
    specialProduce: ['Cardamom', 'Ginger', 'Turmeric', 'Orange', 'Sikkim Mandarin'],
    majorMarkets: ['Geyzing Market', 'Pelling Market', 'Legship Market'],
    coordinates: { lat: 27.3000, lng: 88.2333 },
  },
  {
    name: 'Pakyong',
    state: 'Sikkim',
    terrainType: 'HILLY',
    averageElevation: 1450,
    connectivityScore: 6,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Newly formed district with airport' },
    specialProduce: ['Cardamom', 'Ginger', 'Turmeric', 'Vegetables', 'Flowers'],
    majorMarkets: ['Pakyong Market', 'Rangpo Market'],
    coordinates: { lat: 27.2333, lng: 88.5833 },
  },
  {
    name: 'Soreng',
    state: 'Sikkim',
    terrainType: 'HILLY',
    averageElevation: 1600,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8], description: 'Newly formed district' },
    specialProduce: ['Cardamom', 'Ginger', 'Orange', 'Vegetables'],
    majorMarkets: ['Soreng Market', 'Sombaria Market'],
    coordinates: { lat: 27.3000, lng: 88.2000 },
  },
];

// ============================================
// TRIPURA - Land of Maharajas
// ============================================
const tripuraDistricts: DistrictData[] = [
  {
    name: 'Dhalai',
    state: 'Tripura',
    terrainType: 'HILLY',
    averageElevation: 200,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE', 'FLOOD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Mixed terrain - hills and plains' },
    specialProduce: ['Pineapple', 'Orange', 'Jackfruit', 'Ginger', 'Rubber'],
    majorMarkets: ['Ambassa Market', 'Kamalpur Market', 'Gandacherra Market'],
    coordinates: { lat: 23.8500, lng: 91.8500 },
  },
  {
    name: 'Gomati',
    state: 'Tripura',
    terrainType: 'PLAIN',
    averageElevation: 25,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8, 9], description: 'Gomati river basin' },
    specialProduce: ['Rice', 'Pineapple', 'Jackfruit', 'Fish', 'Rubber'],
    majorMarkets: ['Udaipur Market', 'Amarpur Market'],
    coordinates: { lat: 23.5333, lng: 91.4833 },
  },
  {
    name: 'Khowai',
    state: 'Tripura',
    terrainType: 'PLAIN',
    averageElevation: 30,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Agricultural district' },
    specialProduce: ['Rice', 'Pineapple', 'Jackfruit', 'Mango', 'Rubber'],
    majorMarkets: ['Khowai Market', 'Teliamura Market'],
    coordinates: { lat: 24.1000, lng: 91.6167 },
  },
  {
    name: 'North Tripura',
    state: 'Tripura',
    terrainType: 'PLAIN',
    averageElevation: 35,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Well-connected to Assam' },
    specialProduce: ['Rice', 'Pineapple', 'Jackfruit', 'Rubber', 'Tea'],
    majorMarkets: ['Dharmanagar Market', 'Kailasahar Market', 'Kumarghat Market'],
    coordinates: { lat: 24.3667, lng: 92.1667 },
  },
  {
    name: 'Sepahijala',
    state: 'Tripura',
    terrainType: 'PLAIN',
    averageElevation: 20,
    connectivityScore: 7,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Near Agartala' },
    specialProduce: ['Rice', 'Pineapple', 'Rubber', 'Fish', 'Vegetables'],
    majorMarkets: ['Bishalgarh Market', 'Sonamura Market', 'Jirania Market'],
    coordinates: { lat: 23.7000, lng: 91.3000 },
  },
  {
    name: 'South Tripura',
    state: 'Tripura',
    terrainType: 'PLAIN',
    averageElevation: 25,
    connectivityScore: 6,
    hazards: { types: ['FLOOD'], severity: 'MEDIUM', seasonal: true, months: [7, 8, 9], description: 'Border with Bangladesh' },
    specialProduce: ['Rice', 'Pineapple', 'Jackfruit', 'Mango', 'Rubber'],
    majorMarkets: ['Belonia Market', 'Santirbazar Market', 'Sabroom Market'],
    coordinates: { lat: 23.2500, lng: 91.5000 },
  },
  {
    name: 'Unakoti',
    state: 'Tripura',
    terrainType: 'HILLY',
    averageElevation: 150,
    connectivityScore: 5,
    hazards: { types: ['LANDSLIDE', 'FLOOD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Mixed terrain with archaeological sites' },
    specialProduce: ['Pineapple', 'Orange', 'Jackfruit', 'Ginger', 'Turmeric'],
    majorMarkets: ['Kailasahar Market', 'Kumarghat Market', 'Dharmanagar Market'],
    coordinates: { lat: 24.3167, lng: 92.0167 },
  },
  {
    name: 'West Tripura',
    state: 'Tripura',
    terrainType: 'PLAIN',
    averageElevation: 15,
    connectivityScore: 8,
    hazards: { types: ['FLOOD'], severity: 'LOW', seasonal: true, months: [7, 8], description: 'Agartala region - best connectivity' },
    specialProduce: ['Rice', 'Vegetables', 'Fish', 'Pineapple', 'Handloom'],
    majorMarkets: ['Agartala Maharaja Ganj Market', 'Battala Market', 'Kunjaban Market'],
    coordinates: { lat: 23.8333, lng: 91.2833 },
  },
  // Special mention: Jampui Hills
  {
    name: 'Jampui Hills',
    state: 'Tripura',
    terrainType: 'HILLY',
    averageElevation: 950,
    connectivityScore: 4,
    hazards: { types: ['LANDSLIDE', 'POOR_ROAD'], severity: 'MEDIUM', seasonal: true, months: [6, 7, 8, 9], description: 'Special mention: Orange valley of Tripura' },
    specialProduce: ['Orange (famous)', 'Pineapple', 'Jackfruit', 'Coffee', 'Rubber'],
    majorMarkets: ['Vanghmun Market', 'Jampui Market'],
    coordinates: { lat: 23.9500, lng: 92.2500 },
  },
];

// ============================================
// COMBINED DATA EXPORTS
// ============================================

// All states data
export const NE_STATES_DATA: StateData[] = [
  {
    name: 'Arunachal Pradesh',
    capital: 'Itanagar',
    totalDistricts: arunachalPradeshDistricts.length,
    averageElevation: 1250,
    primaryTerrain: 'MOUNTAINOUS',
    districts: arunachalPradeshDistricts,
    majorHighways: ['NH-13', 'NH-15', 'NH-229', 'Trans-Arunachal Highway'],
    borderCrossings: ['Bum La Pass', 'Kibithu', 'Nampong (Pangsau Pass)'],
  },
  {
    name: 'Assam',
    capital: 'Dispur',
    totalDistricts: assamDistricts.length,
    averageElevation: 80,
    primaryTerrain: 'PLAIN',
    districts: assamDistricts,
    majorHighways: ['NH-15', 'NH-17', 'NH-27', 'NH-37', 'NH-36'],
    borderCrossings: ['Sutarkandi', 'Mankachar', 'Dawki'],
  },
  {
    name: 'Manipur',
    capital: 'Imphal',
    totalDistricts: manipurDistricts.length,
    averageElevation: 950,
    primaryTerrain: 'HILLY',
    districts: manipurDistricts,
    majorHighways: ['NH-2', 'NH-37', 'NH-102'],
    borderCrossings: ['Moreh (Indo-Myanmar)'],
  },
  {
    name: 'Meghalaya',
    capital: 'Shillong',
    totalDistricts: meghalayaDistricts.length,
    averageElevation: 1050,
    primaryTerrain: 'HILLY',
    districts: meghalayaDistricts,
    majorHighways: ['NH-6', 'NH-106', 'NH-217'],
    borderCrossings: ['Dawki', 'Mahendraganj', 'Ghasuapara'],
  },
  {
    name: 'Mizoram',
    capital: 'Aizawl',
    totalDistricts: mizoramDistricts.length,
    averageElevation: 1000,
    primaryTerrain: 'HILLY',
    districts: mizoramDistricts,
    majorHighways: ['NH-54', 'NH-6', 'NH-102A'],
    borderCrossings: ['Zokhawthar', 'Champhai', 'Lawngtlai'],
  },
  {
    name: 'Nagaland',
    capital: 'Kohima',
    totalDistricts: nagalandDistricts.length,
    averageElevation: 1100,
    primaryTerrain: 'HILLY',
    districts: nagalandDistricts,
    majorHighways: ['NH-29', 'NH-36', 'NH-702'],
    borderCrossings: ['Avakhung', 'Pungro'],
  },
  {
    name: 'Sikkim',
    capital: 'Gangtok',
    totalDistricts: sikkimDistricts.length,
    averageElevation: 1800,
    primaryTerrain: 'MOUNTAINOUS',
    districts: sikkimDistricts,
    majorHighways: ['NH-10', 'NH-310', 'NH-510'],
    borderCrossings: ['Nathu La', 'Jelep La'],
  },
  {
    name: 'Tripura',
    capital: 'Agartala',
    totalDistricts: tripuraDistricts.length,
    averageElevation: 30,
    primaryTerrain: 'PLAIN',
    districts: tripuraDistricts,
    majorHighways: ['NH-8', 'NH-108', 'NH-208'],
    borderCrossings: ['Akhaura', 'Srimantapur', 'Belonia'],
  },
];

// Flat list of all districts
export const ALL_DISTRICTS: DistrictData[] = NE_STATES_DATA.flatMap(state => state.districts);

// District lookup by name
export const getDistrictByName = (name: string, state?: string): DistrictData | undefined => {
  return ALL_DISTRICTS.find(d => 
    d.name.toLowerCase() === name.toLowerCase() && 
    (!state || d.state.toLowerCase() === state.toLowerCase())
  );
};

// Alias for backward compatibility
export const getDistrictData = getDistrictByName;

// Get all districts for a state
export const getDistrictsByState = (stateName: string): DistrictData[] => {
  const state = NE_STATES_DATA.find(s => s.name.toLowerCase() === stateName.toLowerCase());
  return state?.districts || [];
};

// Get state data by name
export const getStateByName = (name: string): StateData | undefined => {
  return NE_STATES_DATA.find(s => s.name.toLowerCase() === name.toLowerCase());
};

// Find districts with specific terrain
export const getDistrictsByTerrain = (terrainType: TerrainType): DistrictData[] => {
  return ALL_DISTRICTS.filter(d => d.terrainType === terrainType);
};

// Find shadow zones (low connectivity)
export const getShadowZones = (): DistrictData[] => {
  return ALL_DISTRICTS.filter(d => d.connectivityScore <= 3);
};

// Find hazard-prone districts
export const getHazardProneDistricts = (hazardType?: HazardZone['type']): DistrictData[] => {
  return ALL_DISTRICTS.filter(d => {
    if (!hazardType) return d.hazards.types.length > 0;
    return d.hazards.types.includes(hazardType);
  });
};

// Get districts with special produce
export const getDistrictsByProduce = (produce: string): DistrictData[] => {
  const searchLower = produce.toLowerCase();
  return ALL_DISTRICTS.filter(d => 
    d.specialProduce.some(p => p.toLowerCase().includes(searchLower))
  );
};

// Calculate distance between two districts (simplified haversine)
export const calculateDistance = (
  district1: DistrictData,
  district2: DistrictData
): number => {
  if (!district1.coordinates || !district2.coordinates) {
    // Estimate based on terrain type
    const avgSpeed = 25; // km/h average in hilly terrain
    const estimatedTime = 3; // hours average
    return avgSpeed * estimatedTime;
  }
  
  const R = 6371; // Earth's radius in km
  const lat1 = district1.coordinates.lat * Math.PI / 180;
  const lat2 = district2.coordinates.lat * Math.PI / 180;
  const deltaLat = (district2.coordinates.lat - district1.coordinates.lat) * Math.PI / 180;
  const deltaLng = (district2.coordinates.lng - district1.coordinates.lng) * Math.PI / 180;
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Apply terrain multiplier for road distance (roads are not straight)
  const terrainMultiplier = 1.3; // Average winding factor for NE roads
  
  return Math.round(R * c * terrainMultiplier);
};

// Create a route segment between two districts
export const createRouteSegment = (
  from: DistrictData,
  to: DistrictData
): RouteSegment => {
  const distance = calculateDistance(from, to);
  const avgElevation = (from.averageElevation + to.averageElevation) / 2;
  const maxElevation = Math.max(from.averageElevation, to.averageElevation);
  const avgConnectivity = (from.connectivityScore + to.connectivityScore) / 2;
  
  // Determine dominant terrain
  const terrainPriority: TerrainType[] = ['MOUNTAINOUS', 'HILLY', 'VALLEY', 'PLAIN'];
  const dominantTerrain = terrainPriority.find(t => 
    t === from.terrainType || t === to.terrainType
  ) || 'MIXED';
  
  // Combine hazards
  const combinedHazards: HazardZone[] = [];
  const addHazard = (type: HazardZone['type'], source: DistrictData) => {
    if (source.hazards.types.includes(type)) {
      combinedHazards.push({
        type,
        severity: source.hazards.severity,
        seasonal: source.hazards.seasonal,
        months: source.hazards.months,
        description: `${source.name}: ${source.hazards.description}`,
      });
    }
  };
  
  // Add all unique hazards
  const hazardTypes = new Set([...from.hazards.types, ...to.hazards.types]);
  hazardTypes.forEach(type => {
    addHazard(type, from);
    if (!combinedHazards.find(h => h.type === type)) {
      addHazard(type, to);
    }
  });
  
  // Determine road condition
  const determineRoadCondition = (): RouteSegment['roadCondition'] => {
    if (avgConnectivity >= 8) return 'EXCELLENT';
    if (avgConnectivity >= 6) return 'GOOD';
    if (avgConnectivity >= 4) return 'FAIR';
    if (avgConnectivity >= 2) return 'POOR';
    return 'VERY_POOR';
  };
  
  return {
    from: from.name,
    to: to.name,
    distanceKm: distance,
    terrainType: dominantTerrain,
    averageElevation: avgElevation,
    maxElevation,
    connectivityScore: Math.round(avgConnectivity),
    hazards: combinedHazards,
    roadCondition: determineRoadCondition(),
  };
};

// State names only (for dropdowns)
export const NE_STATE_NAMES = NE_STATES_DATA.map(s => s.name);

// District names grouped by state
export const DISTRICT_NAMES_BY_STATE: Record<string, string[]> = NE_STATES_DATA.reduce(
  (acc, state) => {
    acc[state.name] = state.districts.map(d => d.name);
    return acc;
  },
  {} as Record<string, string[]>
);

// Special routes for reference
export const SPECIAL_ROUTES = {
  JAMPUI_HILLS: {
    name: 'Jampui Hills Route',
    description: 'Orange valley of Tripura - scenic but challenging',
    from: 'West Tripura',
    to: 'Jampui Hills',
    specialNotes: 'Best orange cultivation area in NE India',
  },
  ZUNEHBOTO: {
    name: 'Zunheboto Route',
    description: 'Sumi Naga heartland - home of the famous Naga Chilli',
    from: 'Kohima',
    to: 'Zunheboto',
    specialNotes: 'Challenging terrain, famous for King Chilli (Bhut Jolokia)',
  },
  TAWANG_PASS: {
    name: 'Tawang-Sela Pass Route',
    description: 'High altitude mountain route',
    from: 'West Kameng',
    to: 'Tawang',
    specialNotes: 'Requires permits, extreme weather conditions',
  },
  MOREH_TRADE: {
    name: 'Imphal-Moreh Trade Route',
    description: 'Indo-Myanmar border trade route',
    from: 'Imphal West',
    to: 'Tengnoupal',
    specialNotes: 'Important international trade corridor',
  },
};
