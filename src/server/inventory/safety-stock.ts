/**
 * Calculates safety stock using the standard formula:
 * Safety Stock = Z * σ_LT * sqrt(L)
 * 
 * Where:
 * Z = Z-score for desired service level (e.g., 1.65 for 95%)
 * σ_LT = Standard deviation of demand during lead time
 * L = Lead time in days
 */
export function calculateSafetyStock(
  demandSigma: number, 
  leadTimeDays: number, 
  serviceLevel: 0.90 | 0.95 | 0.99 = 0.95
): number {
  const zScores = {
    0.90: 1.28,
    0.95: 1.65,
    0.99: 2.33,
  };

  const z = zScores[serviceLevel];
  
  // Simplified approximation for hackathon: assuming demand variability is provided directly
  return Math.ceil(z * demandSigma * Math.sqrt(leadTimeDays));
}

/**
 * Calculates the reorder point:
 * Reorder Point = (Average Daily Demand * Lead Time) + Safety Stock
 */
export function calculateReorderPoint(
  demandMean: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  return Math.ceil((demandMean * leadTimeDays) + safetyStock);
}
