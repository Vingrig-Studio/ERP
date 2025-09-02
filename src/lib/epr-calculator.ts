import { z } from 'zod';

// Standard packaging materials
export const STANDARD_PACKAGING_MATERIALS = [
  "ALUMINIUM",
  "GLASS", 
  "PAPER_CARD",
  "PLASTIC",
  "STEEL",
  "WOOD"
] as const;

// Define valid material codes for each stream
export const validPackagingMaterials = STANDARD_PACKAGING_MATERIALS;

export const validWEEEMaterials = [
  "CAT4_SMALL", "CAT2_SCREEN", "electronics"
];

export const validBatteryMaterials = [
  "PORTABLE_LI_ION", "PORTABLE_NI_MH", "lithium"
];

// Remove the hard-coded fees objects and import from JSON
import packagingFees from '../data/fees/packaging.json';
import weeeFees from '../data/fees/weee.json';
import batteriesFees from '../data/fees/batteries.json';
import constants from '../data/fees/constants.json';

// Function for validating packaging material
export function validatePackagingMaterial(materialCode: string): { isValid: boolean; error?: string } {
  const upperCode = materialCode.replace(/^!/, '').toUpperCase();
  
  if (!STANDARD_PACKAGING_MATERIALS.includes(upperCode as any)) {
    return {
      isValid: false,
      error: `Material "${materialCode}" is not valid. Valid materials: ${STANDARD_PACKAGING_MATERIALS.join(', ')}`
    };
  }
  
  return { isValid: true };
}

// Function for normalising material code
export function normalizeMaterialCode(stream: string, code: string): string {
  // Remove '!' prefix and convert code to uppercase for consistency
  const cleaned = code.replace(/^!/, '');
  const upperCode = cleaned.toUpperCase();
  
  // Check and normalise codes for each stream
  // 1) If this is one of the standard packaging materials — return it as is, regardless of stream
  if (validPackagingMaterials.includes(upperCode as any)) {
    return Object.keys(packagingFees).find(k => k.toUpperCase() === upperCode) || upperCode;
  }
  // 2) Otherwise try to match by WEEE/batteries (in case needed in future)
  if (stream === 'weee') {
    if (validWEEEMaterials.some(m => m.toUpperCase() === upperCode)) {
      return Object.keys(weeeFees).find(k => k.toUpperCase() === upperCode) || upperCode;
    }
  } else if (stream === 'batteries') {
    if (validBatteryMaterials.some(m => m.toUpperCase() === upperCode)) {
      return Object.keys(batteriesFees).find(k => k.toUpperCase() === upperCode) || upperCode;
    }
  }
  
  // If code doesn't match any of the valid ones, return original code
  return upperCode;
}

// Schema for CSV row
export const RowSchema = z.object({
  country: z.string(),
  stream: z.enum(['packaging', 'weee', 'batteries']),
  material_code: z.string(),
  // Optional comment for material if there was replacement
  material_comment: z.string().optional(),
  units: z.number().nonnegative(),
  unit_weight_kg: z.number().nonnegative(),
});

type Row = z.infer<typeof RowSchema>;

type Fees = Record<string, number>;

const feesMap: Record<string, Fees> = {
  packaging: packagingFees,
  weee: weeeFees,
  batteries: batteriesFees,
};

export { feesMap }; // Export for use in page.tsx

export function calculateRowFee(row: Row): number {
  // If material is marked as replaced, remove exclamation mark
  const cleanCode = row.material_code.replace(/^!/, '');
  const normalizedCode = normalizeMaterialCode(row.stream, cleanCode);
  // All rates in JSON stored per kg (rate per tonne / 1000)
  // If material is one of standard packaging — use packaging rates for any stream
  const feePerKg = (validPackagingMaterials.includes(normalizedCode as any)
    ? (packagingFees as Fees)[normalizedCode]
    : (feesMap[row.stream] as Fees)[normalizedCode]) || 0;
  
  if (feePerKg === 0) {
    console.warn(`Rate not found for material: ${row.material_code} (stream: ${row.stream})`);
  }
  
  // Formula: quantity * unit_weight(kg) * (rate per tonne / 1000)
  // Since data has rate per kg, equivalent to: units * unit_weight_kg * feePerKg
  const base = row.units * row.unit_weight_kg * feePerKg;
  
  return base;
}

export function calculateFees(rows: Row[], profile: any): { 
  netTotal: number; 
  vat: number; 
  grandTotal: number;
  packaging: number;
  weee: number;
  batteries: number;
  tax: number;
  disposal: number;
  additional: number;
} {
  let packagingTotal = 0;
  let weeeTotal = 0;
  let batteriesTotal = 0;
  
  rows.forEach(row => {
    const fee = calculateRowFee(row);
    if (row.stream === 'packaging') {
      packagingTotal += fee;
    } else if (row.stream === 'weee') {
      weeeTotal += fee;
    } else if (row.stream === 'batteries') {
      batteriesTotal += fee;
    }
  });
  
  const netTotal = packagingTotal + weeeTotal + batteriesTotal;
  
  // TODO: Add ∑(r_i * i_a / i') term from formula - requires price and unique SKU data
  const priceTerm = 0;
  
  const vat = netTotal * constants.vat_rate;
  const tax = netTotal * constants.tax_rate; // Additional tax from formula
  const disposal = constants.lambda * constants.cl;
  const additional = (constants.lambda / constants.cl) * (0.1 * vat); // From formula
  
  const grandTotal = netTotal + priceTerm + vat + tax + disposal + additional;
  
  return { 
    netTotal, 
    vat, 
    grandTotal,
    packaging: packagingTotal,
    weee: weeeTotal,
    batteries: batteriesTotal,
    tax,
    disposal,
    additional
  };
} 