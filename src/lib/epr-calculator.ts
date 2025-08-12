import { z } from 'zod';

// Стандартные материалы для упаковки
export const STANDARD_PACKAGING_MATERIALS = [
  "ALUMINIUM",
  "GLASS", 
  "PAPER_CARD",
  "PLASTIC",
  "STEEL",
  "WOOD"
] as const;

// Определяем допустимые коды материалов для каждого потока
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

// Функция для валидации материала упаковки
export function validatePackagingMaterial(materialCode: string): { isValid: boolean; error?: string } {
  const upperCode = materialCode.replace(/^!/, '').toUpperCase();
  
  if (!STANDARD_PACKAGING_MATERIALS.includes(upperCode as any)) {
    return {
      isValid: false,
      error: `Материал "${materialCode}" не является допустимым. Допустимые материалы: ${STANDARD_PACKAGING_MATERIALS.join(', ')}`
    };
  }
  
  return { isValid: true };
}

// Функция для нормализации кода материала
export function normalizeMaterialCode(stream: string, code: string): string {
  // Убираем префикс '!' и приводим код к верхнему регистру для единообразия
  const cleaned = code.replace(/^!/, '');
  const upperCode = cleaned.toUpperCase();
  
  // Проверяем и нормализуем коды для каждого потока
  // 1) Если это один из стандартных упаковочных материалов — возвращаем его как есть, независимо от потока
  if (validPackagingMaterials.includes(upperCode as any)) {
    return Object.keys(packagingFees).find(k => k.toUpperCase() === upperCode) || upperCode;
  }
  // 2) Иначе пробуем сопоставить по WEEE/батареям (на случай, если в будущем потребуется)
  if (stream === 'weee') {
    if (validWEEEMaterials.some(m => m.toUpperCase() === upperCode)) {
      return Object.keys(weeeFees).find(k => k.toUpperCase() === upperCode) || upperCode;
    }
  } else if (stream === 'batteries') {
    if (validBatteryMaterials.some(m => m.toUpperCase() === upperCode)) {
      return Object.keys(batteriesFees).find(k => k.toUpperCase() === upperCode) || upperCode;
    }
  }
  
  // Если код не соответствует ни одному из допустимых, возвращаем исходный код
  return upperCode;
}

// Схема для строки CSV
export const RowSchema = z.object({
  country: z.string(),
  stream: z.enum(['packaging', 'weee', 'batteries']),
  material_code: z.string(),
  // Необязательный комментарий к материалу, если была замена
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

export { feesMap }; // Экспортируем для использования в page.tsx

export function calculateRowFee(row: Row): number {
  // Если материал помечен как заменённый, убираем восклицательный знак
  const cleanCode = row.material_code.replace(/^!/, '');
  const normalizedCode = normalizeMaterialCode(row.stream, cleanCode);
  // Все ставки в JSON храним за кг (ставка за тонну / 1000)
  // Если материал один из стандартных упаковочных — используем ставки упаковки для любого потока
  const feePerKg = (validPackagingMaterials.includes(normalizedCode as any)
    ? (packagingFees as Fees)[normalizedCode]
    : (feesMap[row.stream] as Fees)[normalizedCode]) || 0;
  
  if (feePerKg === 0) {
    console.warn(`Тариф не найден для материала: ${row.material_code} (поток: ${row.stream})`);
  }
  
  // Формула: количество * вес_единицы(кг) * (ставка за тонну / 1000)
  // Так как в данных ставка за кг, эквивалентно: units * unit_weight_kg * feePerKg
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