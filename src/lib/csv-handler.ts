import Papa from 'papaparse';
import { z } from 'zod';
import { RowSchema, normalizeMaterialCode, validPackagingMaterials, validWEEEMaterials, validBatteryMaterials, validatePackagingMaterial } from './epr-calculator';

// Material replacement rules and comments
const materialReplacementMap: Record<string, { target: 'ALUMINIUM' | 'GLASS' | 'PAPER_CARD' | 'PLASTIC' | 'STEEL' | 'WOOD'; comment: string }> = {
  'LDPE_FILM': { target: 'PLASTIC', comment: 'polyethylene film → PLASTIC' },
  'CAT2_SCREEN': { target: 'PLASTIC', comment: 'plastic screen components → PLASTIC' },
  'CAT4_SMALL': { target: 'PLASTIC', comment: 'small plastic components → PLASTIC' },
  'PORTABLE_NI_MH': { target: 'ALUMINIUM', comment: 'nickel–metal hydride batteries → ALUMINIUM' },
  'PORTABLE_LI_ION': { target: 'ALUMINIUM', comment: 'lithium‑ion batteries → ALUMINIUM' },
};

function applyMaterialReplacement(stream: string, materialCode: string): { material_code: string; material_comment?: string } {
  const upper = String(materialCode || '').trim().toUpperCase();
  const rule = materialReplacementMap[upper];
  // Apply replacements for any stream to standardise to six materials
  if (rule) {
    return { material_code: `!${rule.target}`, material_comment: rule.comment };
  }
  return { material_code: upper };
}

export async function parseCSV(file: File): Promise<z.infer<typeof RowSchema>[]> {
  console.log(`[parseCSV] start: name="${(file as any)?.name}", size=${(file as any)?.size}`);
  const text = await file.text();
  const { data } = Papa.parse(text, { 
    header: true,
    dynamicTyping: false, // PapaParse returns strings by default
    skipEmptyLines: true // Skip empty lines
  });
  console.log(`[parseCSV] rows parsed=${(data as any[]).length}`);
  const headers = Object.keys(((data as any[])[0] || {}));
  console.log(`[parseCSV] headers: ${headers.join(', ')}`);
  
  // Array to store errors
  const errors: string[] = [];
  
  // Convert string values to numbers before validation
  const processedRows = (data as any[])
    .filter((row, index) => {
      // Check that row is not empty and contains all required fields
      const ok = row && 
        row.country !== undefined && row.country !== null && String(row.country).trim() !== '' &&
        row.stream !== undefined && row.stream !== null && String(row.stream).trim() !== '' &&
        row.material_code !== undefined && row.material_code !== null && String(row.material_code).trim() !== '' &&
        row.units !== undefined && row.units !== null && String(row.units).trim() !== '' &&
        row.unit_weight_kg !== undefined && row.unit_weight_kg !== null && String(row.unit_weight_kg).trim() !== '';
      if (!ok) {
        const missing: string[] = [];
        if (!(row && row.country !== undefined && row.country !== null && String(row.country).trim() !== '')) missing.push('country');
        if (!(row && row.stream !== undefined && row.stream !== null && String(row.stream).trim() !== '')) missing.push('stream');
        if (!(row && row.material_code !== undefined && row.material_code !== null && String(row.material_code).trim() !== '')) missing.push('material_code');
        if (!(row && row.units !== undefined && row.units !== null && String(row.units).trim() !== '')) missing.push('units');
        if (!(row && row.unit_weight_kg !== undefined && row.unit_weight_kg !== null && String(row.unit_weight_kg).trim() !== '')) missing.push('unit_weight_kg');
        const msg = `Row ${index + 1}: missing fields: ${missing.join(', ')}`;
        console.warn(`[parseCSV] ${msg}`);
        errors.push(msg);
      }
      return ok;
    })
    .map((row, index) => {
      // Normalise stream value: 'battery' -> 'batteries'
      let stream = String(row.stream || '').trim();
      if (stream === 'battery') {
        stream = 'batteries';
      }
      
      // Apply material replacement according to rules
      const originalMaterial = String(row.material_code || '').trim();
      const { material_code: replacedMaterial, material_comment } = applyMaterialReplacement(stream, originalMaterial);
      if (originalMaterial.toUpperCase() !== replacedMaterial.toUpperCase()) {
        console.log(`[parseCSV][row ${index + 1}] material replacement: "${originalMaterial}" → "${replacedMaterial}" (${material_comment || ''})`);
      }

      // Check material compliance with stream (after replacement)
      const validationResult = validateMaterial(stream, replacedMaterial);
      
      if (!validationResult.isValid) {
        const emsg = `Row ${index + 1}: ${validationResult.error}`;
        console.warn(`[parseCSV] ${emsg}`);
        errors.push(emsg);
      }
      
      // Normalise material code
      const normalizedMaterialCode = normalizeMaterialCode(stream, replacedMaterial);
      
      const unitsNum = Number(row.units);
      const weightNum = Number(row.unit_weight_kg);
      if (Number.isNaN(unitsNum)) {
        const emsg = `Row ${index + 1}: units field is not a number -> "${row.units}"`;
        console.warn(`[parseCSV] ${emsg}`);
        errors.push(emsg);
      }
      if (Number.isNaN(weightNum)) {
        const emsg = `Row ${index + 1}: unit_weight_kg field is not a number -> "${row.unit_weight_kg}"`;
        console.warn(`[parseCSV] ${emsg}`);
        errors.push(emsg);
      }

      const processedRow = {
        country: String(row.country || '').trim(),
        stream: stream,
        material_code: normalizedMaterialCode,
        material_comment: material_comment,
        units: unitsNum,
        unit_weight_kg: weightNum
      };
      
      try {
        return RowSchema.parse(processedRow);
      } catch (error) {
        console.error('[parseCSV] Validation error for row:', { index: index + 1, row: processedRow }, error);
        if (error instanceof z.ZodError) {
          errors.push(`Row ${index + 1}: ${error.errors.map(e => e.message).join(', ')}`);
        }
        return null as any;
      }
    });
  
  const validRows = (processedRows as Array<z.infer<typeof RowSchema> | null>).filter((r): r is z.infer<typeof RowSchema> => r !== null);
  console.log(`[parseCSV] valid rows: ${validRows.length}, errors: ${errors.length}`);
  
  // If there are errors, throw exception with their list
  if (errors.length > 0) {
    console.error('[parseCSV] aggregated errors:', errors);
    throw new Error(`Errors processing CSV:\n${errors.join('\n')}`);
  }
  
  console.log('[parseCSV] success');
  return validRows;
}

// Function to check material compliance with stream
function validateMaterial(stream: string, materialCode: string): { isValid: boolean; error?: string } {
  const upperCode = materialCode.replace(/^!/, '').toUpperCase();
  
  // After standardisation we allow six materials for any stream
  if (validPackagingMaterials.includes(upperCode as any)) {
    return { isValid: true };
  }

  if (stream === 'weee') {
    const isValid = validWEEEMaterials.some(m => m.toUpperCase() === upperCode);
    if (!isValid) {
      return {
        isValid: false,
        error: `Material "${materialCode}" is not valid for stream "weee". Valid materials: ${validWEEEMaterials.join(', ')}`
      };
    }
  } else if (stream === 'batteries') {
    const isValid = validBatteryMaterials.some(m => m.toUpperCase() === upperCode);
    if (!isValid) {
      return {
        isValid: false,
        error: `Material "${materialCode}" is not valid for stream "batteries". Valid materials: ${validBatteryMaterials.join(', ')}`
      };
    }
  }
  
  return { isValid: true };
} 