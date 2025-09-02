import { parseCSV } from './csv-handler';
import { calculateFees } from './epr-calculator';
import fs from 'fs/promises';
import { validatePackagingMaterial, STANDARD_PACKAGING_MATERIALS } from './epr-calculator';

async function testCalculator() {
  // Test CSV content
  const testCsv = `
  country,stream,material_code,units,unit_weight_kg
  UK,packaging,Plastic,10,0.5
  UK,weee,electronics,5,1.0
  UK,batteries,lithium,3,0.2
  `;
  
  // Save to temporary file
  await fs.writeFile('test.csv', testCsv.trim());
  
  // Parse
  const file = { text: async () => testCsv } as any;
  const rows = await parseCSV(file);
  
  // Calculate
  const profile = {};
  const result = calculateFees(rows, profile);
  
  console.log('Test Results:', result);
}

testCalculator().catch(console.error); 

// Test material validation
export function testMaterialValidation() {
  console.log('=== Testing Material Validation ===');
  
  // Test valid materials
  console.log('\nValid materials:');
  STANDARD_PACKAGING_MATERIALS.forEach(material => {
    const result = validatePackagingMaterial(material);
    console.log(`${material}: ${result.isValid ? '✅' : '❌'} ${result.error || ''}`);
  });
  
  // Test invalid materials
  console.log('\nInvalid materials:');
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

// Run test if file is executed directly
if (typeof window === 'undefined') {
  testMaterialValidation();
} 