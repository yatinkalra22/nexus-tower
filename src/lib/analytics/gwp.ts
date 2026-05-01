/**
 * GLEC Framework v3 Well-to-Wheel (WTW) Emission Factors
 * Values in kg CO2e per tonne-km (tkm)
 * Sources: GLEC Framework v3.0, 2023.
 */
export const EMISSION_FACTORS = {
  sea_container: 0.0151, // Average container ship
  road_heavy_truck: 0.0820, // Heavy duty truck
  air_freight: 0.6020, // Dedicated cargo plane
  rail_freight: 0.0220, // Electric/Diesel mix
};

interface GwpInput {
  mode: keyof typeof EMISSION_FACTORS;
  distanceKm: number;
  weightKg: number;
}

/**
 * Computes Global Warming Potential (GWP) in kg CO2e.
 */
export function computeGwp({ mode, distanceKm, weightKg }: GwpInput): number {
  const factor = EMISSION_FACTORS[mode] || EMISSION_FACTORS.sea_container;
  const tonnes = weightKg / 1000;
  const tkm = tonnes * distanceKm;
  return tkm * factor;
}
