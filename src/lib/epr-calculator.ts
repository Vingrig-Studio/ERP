import { z } from 'zod';

// Определяем допустимые коды материалов для каждого потока
export const validPackagingMaterials = [
  "PAPER_CARD", "LDPE_FILM", "GLASS", "ALUMINIUM", 
  "Aluminium", "Fibre-based composite", "Glass", 
  "Paper or board", "Plastic", "Steel", "Wood", "Other"
];

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

// Функция для нормализации кода материала
export function normalizeMaterialCode(stream: string, code: string): string {
  // Приводим код к верхнему регистру для единообразия
  const upperCode = code.toUpperCase();
  
  // Проверяем и нормализуем коды для каждого потока
  if (stream === 'packaging') {
    // Проверяем соответствие кода допустимым материалам для упаковки
    if (validPackagingMaterials.some(m => m.toUpperCase() === upperCode)) {
      // Возвращаем код в том виде, в котором он есть в тарифах
      return Object.keys(packagingFees).find(k => k.toUpperCase() === upperCode) || code;
    }
  } else if (stream === 'weee') {
    if (validWEEEMaterials.some(m => m.toUpperCase() === upperCode)) {
      return Object.keys(weeeFees).find(k => k.toUpperCase() === upperCode) || code;
    }
  } else if (stream === 'batteries') {
    if (validBatteryMaterials.some(m => m.toUpperCase() === upperCode)) {
      return Object.keys(batteriesFees).find(k => k.toUpperCase() === upperCode) || code;
    }
  }
  
  // Если код не соответствует ни одному из допустимых, возвращаем исходный код
  return code;
}

// Схема для строки CSV
export const RowSchema = z.object({
  country: z.string(),
  stream: z.enum(['packaging', 'weee', 'batteries']),
  material_code: z.string(),
  units: z.number().positive(),
  unit_weight_kg: z.number().positive(),
});

type Row = z.infer<typeof RowSchema>;

type Fees = Record<string, number>;

const feesMap: Record<string, Fees> = {
  packaging: packagingFees,
  weee: weeeFees,
  batteries: batteriesFees,
};

export { feesMap }; // Экспортируем для использования в page.tsx

export function calculateRowFee(row: Row): number {
  const normalizedCode = normalizeMaterialCode(row.stream, row.material_code);
  const feePerKg = feesMap[row.stream][normalizedCode] || 0;
  
  if (feePerKg === 0) {
    console.warn(`Тариф не найден для материала: ${row.material_code} (поток: ${row.stream})`);
  }
  
  let base = row.units * row.unit_weight_kg * feePerKg;
  
  if (row.stream === 'packaging') {
    base /= constants.kg_divisor; // Apply / i' from formula, assuming for packaging
  }
  
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