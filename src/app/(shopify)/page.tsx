'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dropzone } from '@/components/calculator/Dropzone';
import { Loader2, Package, Info, Edit, Check } from 'lucide-react';
import { parseCSV } from '@/lib/csv-handler';
import { calculateFees, calculateRowFee, feesMap, validPackagingMaterials, validWEEEMaterials, validBatteryMaterials } from '@/lib/epr-calculator';
import JSZip from 'jszip';
import { Parser } from 'json2csv';
import packagingFees from '@/data/fees/packaging.json';
import weeeFees from '@/data/fees/weee.json';
import batteriesFees from '@/data/fees/batteries.json';
import { Input } from '@/components/ui/input';

// Компонент для отображения тарифов
function RatesInfo() {
  const [showRates, setShowRates] = useState(false);
  
  return (
    <div className="mt-4">
      <Button variant="outline" onClick={() => setShowRates(!showRates)} className="flex items-center">
        <Info className="mr-2 h-4 w-4" />
        {showRates ? 'Скрыть тарифы' : 'Показать текущие тарифы'}
      </Button>
      
      {showRates && (
        <Card className="mt-2 p-4">
          <h3 className="font-bold mb-2">Текущие тарифы (£ за тонну)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Материал</TableHead>
                <TableHead>Ставка (£/тонну)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Aluminium</TableCell>
                <TableCell>435</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Fibre-based composite</TableCell>
                <TableCell>455</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Glass</TableCell>
                <TableCell>240</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Paper or board</TableCell>
                <TableCell>215</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Plastic</TableCell>
                <TableCell>485</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Steel</TableCell>
                <TableCell>305</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Wood</TableCell>
                <TableCell>320</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Other</TableCell>
                <TableCell>280</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-sm mt-2">Примечание: В расчетах используются тарифы в £ за кг (тариф / 1000)</p>
        </Card>
      )}
    </div>
  );
}

export default function CalculatorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedMaterial, setEditedMaterial] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);

  const handleDrop = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
    setRows([]);
  };

  const calculate = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null); // Сбрасываем ошибку перед новым расчётом
    try {
      const parsedRows = await parseCSV(file);
      setRows(parsedRows);
      await processRows(parsedRows);
    } catch (error) {
      console.error('Error in calculation:', error);
      setResult(null);
      if (error instanceof Error) {
        setError(`Ошибка расчёта: ${error.message}`);
      } else {
        setError('Неизвестная ошибка при расчёте. Проверьте формат CSV файла.');
      }
    }
    setIsLoading(false);
  };

  // Функция для обработки строк и расчета результата
  const processRows = async (currentRows: any[]) => {
    try {
      const profile = {}; // Mock profile для оффлайн
      const summary = calculateFees(currentRows, profile);
      const breakdown = currentRows.map(row => {
        const fee = calculateRowFee(row);
        const totalWeight = row.units * row.unit_weight_kg;
        return { 
          ...row, 
          fee,
          total_weight_kg: totalWeight,
          fee_per_kg: (feesMap[row.stream][row.material_code] || 0),
          line_fee: fee,
          hwmc_fee: 0 // Пока 0, можно добавить логику
        };
      });

      // Генерация всех необходимых CSV файлов
      const parser = new Parser();
      
      // 1. breakdown.csv - основной отчет
      const breakdownFields = ['country', 'stream', 'material_code', 'units', 'unit_weight_kg', 'total_weight_kg', 'fee_per_kg', 'line_fee', 'hwmc_fee'];
      const breakdownCsv = parser.parse(breakdown);
      
      // 2. organisation_details.csv - данные организации (пример)
      const orgDetails = [{
        organisation_name: 'Example Company',
        organisation_type_code: 'LIMITED_COMPANY',
        sic_code: '34221',
        companies_house_number: '12334486',
        home_nation_code: 'ENG',
        is_household: true,
        is_large_producer: true,
        registered_address_line_1: 'Example Street 1',
        registered_city: 'London',
        registered_postcode: 'E149PB',
        registered_country_code: 'GB',
        approved_person_first_name: 'John',
        approved_person_last_name: 'Doe',
        approved_person_job_title: 'Manager',
        approved_person_email: 'john@example.com',
        approved_person_phone_number: '1234567890'
      }];
      const orgDetailsCsv = parser.parse(orgDetails);
      
      // 3. pepr_packaging.csv - данные по упаковке
      const packagingRows = breakdown
        .filter(row => row.stream === 'packaging')
        .map(row => ({
          ReportingYear: '2025',
          ProducerID: 'PROD12345',
          Material: row.material_code,
          Weight_Tonnes: (row.units * row.unit_weight_kg / 1000).toFixed(6)
        }));
      const peprPackagingCsv = parser.parse(packagingRows);
      
      // 4. weee_producer_data.csv
      const weeeRows = breakdown
        .filter(row => row.stream === 'weee')
        .map(row => ({
          EA_Producer_Registration_Number: 'WEE/AB1234CD',
          Reporting_Period: '2025-Q4',
          EEE_Category_Code: row.material_code,
          Units_Placed_on_Market: row.units,
          Weight_Tonnes: (row.units * row.unit_weight_kg / 1000).toFixed(6)
        }));
      const weeeCsv = parser.parse(weeeRows);
      
      // 5. battery_producer_data.csv
      const batteryRows = breakdown
        .filter(row => row.stream === 'batteries')
        .map(row => ({
          Producer_ID: 'BATT/PROD54321',
          Year: '2025',
          Battery_Type_Code: row.material_code,
          Weight_Tonnes_Placed_on_Market: (row.units * row.unit_weight_kg / 1000).toFixed(6)
        }));
      const batteryCsv = parser.parse(batteryRows);
      
      // 6. brand_details.csv
      const brandDetails = [{ brand_name: 'Example Brand' }];
      const brandDetailsCsv = parser.parse(brandDetails);
      
      // 7. partner_details.csv
      const partnerDetails = [{
        partner_first_name: 'Jane',
        partner_last_name: 'Smith',
        partner_email: 'jane@example.com',
        partner_phone_number: '0987654321',
        is_designated_partner: true
      }];
      const partnerDetailsCsv = parser.parse(partnerDetails);

      // Создаем ZIP архив со всеми файлами
      const zip = new JSZip();
      zip.file('breakdown.csv', breakdownCsv);
      zip.file('organisation_details.csv', orgDetailsCsv);
      zip.file('pepr_packaging.csv', peprPackagingCsv);
      zip.file('weee_producer_data.csv', weeeCsv);
      zip.file('battery_producer_data.csv', batteryCsv);
      zip.file('brand_details.csv', brandDetailsCsv);
      zip.file('partner_details.csv', partnerDetailsCsv);
      
      const zipData = await zip.generateAsync({ type: 'base64' });

      setResult({
        success: true,
        summary,
        breakdownPreview: breakdown,
        zipData,
      });
    } catch (error) {
      console.error('Error in calculation:', error);
      setResult(null);
      if (error instanceof Error) {
        setError(`Ошибка расчёта: ${error.message}`);
      } else {
        setError('Неизвестная ошибка при расчёте.');
      }
    }
  };

  // Функция для начала редактирования материала
  const startEditingMaterial = (index: number, material: string) => {
    setEditingRow(index);
    setEditedMaterial(material);
  };

  // Функция для сохранения отредактированного материала
  const saveEditedMaterial = async (index: number) => {
    // Проверка на валидность материала для потока
    const row = rows[index];
    const stream = row.stream;
    
    let isValid = false;
    if (stream === 'packaging') {
      isValid = validPackagingMaterials.some(m => m.toUpperCase() === editedMaterial.toUpperCase());
    } else if (stream === 'weee') {
      isValid = validWEEEMaterials.some(m => m.toUpperCase() === editedMaterial.toUpperCase());
    } else if (stream === 'batteries') {
      isValid = validBatteryMaterials.some(m => m.toUpperCase() === editedMaterial.toUpperCase());
    }
    
    if (!isValid) {
      alert(`Материал "${editedMaterial}" не является допустимым для потока "${stream}"`);
      return;
    }
    
    // Обновляем строку с новым материалом
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], material_code: editedMaterial };
    setRows(updatedRows);
    
    // Перерасчет с обновленными данными
    await processRows(updatedRows);
    
    // Сбрасываем состояние редактирования
    setEditingRow(null);
    setEditedMaterial('');
  };

  // Функция для получения доступных материалов в зависимости от потока
  const getAvailableMaterials = (stream: string) => {
    if (stream === 'packaging') {
      return validPackagingMaterials;
    } else if (stream === 'weee') {
      return validWEEEMaterials;
    } else if (stream === 'batteries') {
      return validBatteryMaterials;
    }
    return [];
  };

  const downloadZIP = () => {
    if (!result?.zipData) return;
    const link = document.createElement('a');
    link.href = `data:application/zip;base64,${result.zipData}`;
    link.download = 'compliance_bundle.zip';
    link.click();
  };

  return (
    <div className="p-4">
      <Dropzone onDrop={handleDrop} />
      <div className="mt-2">
        {file && <p className="text-sm">Выбран файл: {file.name}</p>}
      </div>
      <Button disabled={!file || isLoading} onClick={calculate} className="mt-2">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Calculate Fees'}
      </Button>
      
      <RatesInfo />
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{error}</p>
          <p className="text-sm mt-2">
            Убедитесь, что CSV файл содержит столбцы: country, stream (packaging/weee/batteries), 
            material_code, units, unit_weight_kg
          </p>
        </div>
      )}
      
      {result && (
        <Card className="mt-4">
          <h2>Grand Total: £{result.summary.grandTotal.toFixed(2)}</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <Package />
              <h3>Packaging</h3>
              <p>£{result.summary.packaging.toFixed(2)}</p>
            </Card>
            <Card>
              <Package />
              <h3>WEEE</h3>
              <p>£{result.summary.weee.toFixed(2)}</p>
            </Card>
            <Card>
              <Package />
              <h3>Batteries</h3>
              <p>£{result.summary.batteries.toFixed(2)}</p>
            </Card>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead>Material Code</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Unit Weight (kg)</TableHead>
                <TableHead>Fee (£)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.breakdownPreview.map((row: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{row.country}</TableCell>
                  <TableCell>{row.stream}</TableCell>
                  <TableCell>
                    {editingRow === i ? (
                      <div className="flex items-center">
                        <select 
                          value={editedMaterial} 
                          onChange={(e) => setEditedMaterial(e.target.value)}
                          className="p-1 border rounded mr-2"
                        >
                          {getAvailableMaterials(row.stream).map((material, idx) => (
                            <option key={idx} value={material}>{material}</option>
                          ))}
                        </select>
                        <Button 
                          size="sm" 
                          onClick={() => saveEditedMaterial(i)}
                          variant="outline"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {row.material_code}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => startEditingMaterial(i, row.material_code)}
                          className="ml-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{row.units}</TableCell>
                  <TableCell>{row.unit_weight_kg}</TableCell>
                  <TableCell>{row.fee ? row.fee.toFixed(2) : '0.00'}</TableCell>
                  <TableCell>
                    {row.fee_per_kg === 0 && (
                      <span className="text-red-500 text-xs">Тариф не найден</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button onClick={downloadZIP}>Download Compliance Bundle</Button>
        </Card>
      )}
    </div>
  );
} 