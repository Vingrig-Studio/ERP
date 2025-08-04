import { parseCSV } from './csv-handler';
import { calculateFees } from './epr-calculator';
import fs from 'fs/promises';

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