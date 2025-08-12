import { parseCSV } from './csv-handler';
import { calculateFees } from './epr-calculator';
import fs from 'fs/promises';
import { validatePackagingMaterial, STANDARD_PACKAGING_MATERIALS } from './epr-calculator';

async function testCalculator() {
  // Тестовый CSV контент
  const testCsv = `
  country,stream,material_code,units,unit_weight_kg
  UK,packaging,Plastic,10,0.5
  UK,weee,electronics,5,1.0
  UK,batteries,lithium,3,0.2
  `;
  
  // Сохраняем в временный файл
  await fs.writeFile('test.csv', testCsv.trim());
  
  // Парсим
  const file = { text: async () => testCsv } as any;
  const rows = await parseCSV(file);
  
  // Расчёт
  const profile = {};
  const result = calculateFees(rows, profile);
  
  console.log('Test Results:', result);
}

testCalculator().catch(console.error); 

// Тестируем валидацию материалов
export function testMaterialValidation() {
  console.log('=== Тестирование валидации материалов ===');
  
  // Тестируем правильные материалы
  console.log('\nПравильные материалы:');
  STANDARD_PACKAGING_MATERIALS.forEach(material => {
    const result = validatePackagingMaterial(material);
    console.log(`${material}: ${result.isValid ? '✅' : '❌'} ${result.error || ''}`);
  });
  
  // Тестируем неправильные материалы
  console.log('\nНеправильные материалы:');
  const invalidMaterials = [
    'Aluminium', // неправильный регистр
    'GLASS', // правильный
    'paper', // неправильный
    'PLASTIC', // правильный
    'steel', // неправильный регистр
    'WOOD', // правильный
    'Other', // не существует
    'Fibre-based composite', // не существует
    'LDPE_FILM', // не существует
    'plastic' // неправильный регистр
  ];
  
  invalidMaterials.forEach(material => {
    const result = validatePackagingMaterial(material);
    console.log(`${material}: ${result.isValid ? '✅' : '❌'} ${result.error || ''}`);
  });
}

// Запускаем тест если файл выполняется напрямую
if (typeof window === 'undefined') {
  testMaterialValidation();
} 