import Papa from 'papaparse';
import { z } from 'zod';
import { RowSchema, normalizeMaterialCode, validPackagingMaterials, validWEEEMaterials, validBatteryMaterials } from './epr-calculator';

export async function parseCSV(file: File): Promise<z.infer<typeof RowSchema>[]> {
  const text = await file.text();
  const { data } = Papa.parse(text, { 
    header: true,
    dynamicTyping: false, // PapaParse по умолчанию возвращает строки
    skipEmptyLines: true // Пропускаем пустые строки
  });
  
  // Массив для хранения ошибок
  const errors: string[] = [];
  
  // Преобразуем строковые значения в числа перед валидацией
  const processedRows = (data as any[])
    .filter(row => {
      // Проверяем, что строка не пустая и содержит все необходимые поля
      return row && 
        row.country && 
        row.stream && 
        row.material_code && 
        row.units && 
        row.unit_weight_kg;
    })
    .map((row, index) => {
      // Нормализация значения stream: 'battery' -> 'batteries'
      let stream = String(row.stream || '').trim();
      if (stream === 'battery') {
        stream = 'batteries';
      }
      
      // Проверяем соответствие материала потоку
      const materialCode = String(row.material_code || '').trim();
      const isValidMaterial = validateMaterial(stream, materialCode);
      
      if (!isValidMaterial) {
        errors.push(`Строка ${index + 1}: Материал "${materialCode}" не является допустимым для потока "${stream}"`);
      }
      
      // Нормализуем код материала
      const normalizedMaterialCode = normalizeMaterialCode(stream, materialCode);
      
      const processedRow = {
        country: String(row.country || '').trim(),
        stream: stream,
        material_code: normalizedMaterialCode,
        units: Number(row.units || 0),
        unit_weight_kg: Number(row.unit_weight_kg || 0)
      };
      
      try {
        return RowSchema.parse(processedRow);
      } catch (error) {
        console.error('Validation error for row:', row, error);
        if (error instanceof z.ZodError) {
          errors.push(`Строка ${index + 1}: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    });
  
  // Если есть ошибки, выбрасываем исключение с их списком
  if (errors.length > 0) {
    throw new Error(`Ошибки при обработке CSV:\n${errors.join('\n')}`);
  }
  
  return processedRows;
}

// Функция для проверки соответствия материала потоку
function validateMaterial(stream: string, materialCode: string): boolean {
  const upperCode = materialCode.toUpperCase();
  
  if (stream === 'packaging') {
    return validPackagingMaterials.some(m => m.toUpperCase() === upperCode);
  } else if (stream === 'weee') {
    return validWEEEMaterials.some(m => m.toUpperCase() === upperCode);
  } else if (stream === 'batteries') {
    return validBatteryMaterials.some(m => m.toUpperCase() === upperCode);
  }
  
  return false;
} 