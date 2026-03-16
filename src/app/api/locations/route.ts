import { NextResponse } from 'next/server';
import { 
  NE_STATES, 
  NE_DISTRICTS, 
  NE_STATE_INFO, 
  NE_MARKETS,
  TERRAIN_INFO,
  ELEVATION_ZONES,
  REGION_PRODUCTS,
  VEHICLE_INFO,
  getElevationZone,
  getDistrictsForState,
  getStateInfo,
  getMarketsForDistrict,
  getProductsForState,
  type TerrainType,
  type ElevationZone,
} from '@/types';
import { NE_STATES_DATA, ALL_DISTRICTS, getDistrictByName, getDistrictsByState, getShadowZones, getHazardProneDistricts } from '@/lib/ne-india-data';
import { getCurrentSeason, getWeatherImpactMultiplier } from '@/lib/terrain-routing';

// GET /api/locations - Get NE India location data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'states';
  const state = searchParams.get('state');
  const district = searchParams.get('district');
  const terrain = searchParams.get('terrain') as TerrainType | null;
  const elevationZone = searchParams.get('elevationZone') as ElevationZone | null;

  try {
    switch (action) {
      case 'states':
        // Return all NE states with summary info
        return NextResponse.json({
          success: true,
          data: {
            states: NE_STATE_INFO,
            stateNames: NE_STATES,
            totalStates: NE_STATES.length,
          },
        });

      case 'districts':
        // Return districts for a specific state or all districts
        if (state) {
          const stateInfo = getStateInfo(state);
          const districts = getDistrictsForState(state);
          const detailedDistricts = getDistrictsByState(state);
          
          return NextResponse.json({
            success: true,
            data: {
              state: stateInfo,
              districts,
              detailedDistricts,
              totalDistricts: districts.length,
            },
          });
        }
        
        // Return all districts grouped by state
        return NextResponse.json({
          success: true,
          data: {
            districts: NE_DISTRICTS,
            allDistricts: ALL_DISTRICTS,
            totalDistricts: ALL_DISTRICTS.length,
          },
        });

      case 'district':
        // Return specific district details
        if (!district || !state) {
          return NextResponse.json(
            { success: false, error: 'Both district and state parameters are required' },
            { status: 400 }
          );
        }
        
        const districtData = getDistrictByName(district, state);
        if (!districtData) {
          return NextResponse.json(
            { success: false, error: 'District not found' },
            { status: 404 }
          );
        }
        
        const markets = getMarketsForDistrict(district, state);
        const products = getProductsForState(state);
        
        return NextResponse.json({
          success: true,
          data: {
            district: districtData,
            elevationZone: getElevationZone(districtData.averageElevation),
            markets,
            stateProducts: products,
          },
        });

      case 'markets':
        // Return markets/haats
        if (state && district) {
          const filteredMarkets = NE_MARKETS.filter(
            m => m.state === state && m.district === district
          );
          return NextResponse.json({
            success: true,
            data: {
              markets: filteredMarkets,
              total: filteredMarkets.length,
            },
          });
        }
        
        if (state) {
          const stateMarkets = NE_MARKETS.filter(m => m.state === state);
          return NextResponse.json({
            success: true,
            data: {
              markets: stateMarkets,
              total: stateMarkets.length,
            },
          });
        }
        
        return NextResponse.json({
          success: true,
          data: {
            markets: NE_MARKETS,
            total: NE_MARKETS.length,
            byType: {
              haats: NE_MARKETS.filter(m => m.type === 'HAAT'),
              weeklyMarkets: NE_MARKETS.filter(m => m.type === 'WEEKLY_MARKET'),
              permanentMarkets: NE_MARKETS.filter(m => m.type === 'PERMANENT_MARKET'),
              wholesale: NE_MARKETS.filter(m => m.type === 'WHOLESALE'),
            },
          },
        });

      case 'terrain':
        // Return terrain information
        if (terrain) {
          const terrainDetails = TERRAIN_INFO[terrain];
          if (!terrainDetails) {
            return NextResponse.json(
              { success: false, error: 'Invalid terrain type' },
              { status: 400 }
            );
          }
          
          const districtsByTerrain = ALL_DISTRICTS.filter(d => d.terrainType === terrain);
          
          return NextResponse.json({
            success: true,
            data: {
              terrain: terrainDetails,
              districts: districtsByTerrain,
              totalDistricts: districtsByTerrain.length,
            },
          });
        }
        
        return NextResponse.json({
          success: true,
          data: {
            terrainTypes: TERRAIN_INFO,
            elevationZones: ELEVATION_ZONES,
          },
        });

      case 'products':
        // Return region-specific products
        if (state) {
          const stateProducts = REGION_PRODUCTS[state];
          if (!stateProducts) {
            return NextResponse.json(
              { success: false, error: 'Invalid state' },
              { status: 400 }
            );
          }
          
          return NextResponse.json({
            success: true,
            data: {
              state,
              products: stateProducts.products,
              seasonality: stateProducts.seasonality,
            },
          });
        }
        
        return NextResponse.json({
          success: true,
          data: {
            products: REGION_PRODUCTS,
            allProducts: [...new Set(Object.values(REGION_PRODUCTS).flatMap(r => r.products))],
          },
        });

      case 'vehicles':
        // Return vehicle information for logistics
        return NextResponse.json({
          success: true,
          data: {
            vehicles: VEHICLE_INFO,
            terrainCompatibility: Object.entries(VEHICLE_INFO).map(([type, info]) => ({
              type,
              name: info.name,
              capacity: info.capacity,
              suitableTerrains: info.suitableTerrains,
            })),
          },
        });

      case 'shadow-zones':
        // Return low connectivity areas
        const shadowZones = getShadowZones();
        return NextResponse.json({
          success: true,
          data: {
            shadowZones,
            total: shadowZones.length,
            message: 'These districts have low connectivity (score <= 3) and may require special delivery arrangements',
          },
        });

      case 'hazards':
        // Return hazard-prone districts
        const hazardType = searchParams.get('hazardType');
        const hazardProne = getHazardProneDistricts(hazardType as 'LANDSLIDE' | 'FLOOD' | 'FOG' | 'POOR_ROAD' | 'NO_CONNECTIVITY');
        
        return NextResponse.json({
          success: true,
          data: {
            hazardProneDistricts: hazardProne,
            total: hazardProne.length,
            hazardTypes: ['LANDSLIDE', 'FLOOD', 'FOG', 'POOR_ROAD', 'NO_CONNECTIVITY'],
            currentSeason: getCurrentSeason(),
            weatherMultiplier: getWeatherImpactMultiplier(),
          },
        });

      case 'highways':
        // Return highway connectivity information
        const highwayData = NE_STATE_INFO.map(stateInfo => ({
          state: stateInfo.name,
          highways: stateInfo.majorHighways,
          borderCrossings: stateInfo.borderCrossings || [],
        }));
        
        return NextResponse.json({
          success: true,
          data: {
            highways: highwayData,
            majorHighways: [
              { name: 'NH-15', connects: ['Assam', 'Arunachal Pradesh'], description: 'Major north-south corridor' },
              { name: 'NH-37', connects: ['Assam', 'Meghalaya'], description: 'Guwahati-Shillong route' },
              { name: 'NH-2', connects: ['Assam', 'Nagaland', 'Manipur'], description: 'Dimapur-Imphal corridor' },
              { name: 'NH-10', connects: ['West Bengal', 'Sikkim'], description: 'Siliguri-Gangtok route' },
              { name: 'NH-8', connects: ['Assam', 'Tripura'], description: 'Guwahati-Agartala route' },
              { name: 'Trans-Arunachal Highway', connects: ['Arunachal Pradesh'], description: 'East-West corridor in AP' },
            ],
          },
        });

      case 'summary':
        // Return a complete summary of NE India
        return NextResponse.json({
          success: true,
          data: {
            totalStates: NE_STATES.length,
            totalDistricts: ALL_DISTRICTS.length,
            totalMarkets: NE_MARKETS.length,
            states: NE_STATE_INFO.map(s => ({
              name: s.name,
              capital: s.capital,
              districtCount: s.districts.length,
              primaryTerrain: s.primaryTerrain,
              averageElevation: s.averageElevation,
              specialProducts: s.specialProducts,
            })),
            terrainBreakdown: {
              plain: ALL_DISTRICTS.filter(d => d.terrainType === 'PLAIN').length,
              hilly: ALL_DISTRICTS.filter(d => d.terrainType === 'HILLY').length,
              mountainous: ALL_DISTRICTS.filter(d => d.terrainType === 'MOUNTAINOUS').length,
              valley: ALL_DISTRICTS.filter(d => d.terrainType === 'VALLEY').length,
              mixed: ALL_DISTRICTS.filter(d => d.terrainType === 'MIXED').length,
            },
            connectivity: {
              good: ALL_DISTRICTS.filter(d => d.connectivityScore >= 7).length,
              moderate: ALL_DISTRICTS.filter(d => d.connectivityScore >= 4 && d.connectivityScore < 7).length,
              poor: ALL_DISTRICTS.filter(d => d.connectivityScore < 4).length,
            },
            currentSeason: getCurrentSeason(),
            weatherMultiplier: getWeatherImpactMultiplier(),
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: states, districts, district, markets, terrain, products, vehicles, shadow-zones, hazards, highways, or summary' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in locations API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
