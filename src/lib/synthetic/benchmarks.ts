/**
 * Synthetic-but-plausible benchmark distributions for ~30 common CPT/HCPCS codes
 * (Section 7.11, Section 10). FAKE DATA seeded as the starting point for the
 * compounding price dataset; the cron later recomputes aggregates from anonymized
 * line items. Region 'CA' matches the demo user's state.
 */
export interface BenchmarkSeed {
  code: string;
  label: string;
  median: number;
  p25: number;
  p75: number;
  sampleSize: number;
}

export const BENCHMARK_REGION = 'CA';

export const BENCHMARK_SEEDS: BenchmarkSeed[] = [
  { code: '99213', label: 'Office visit, established, level 3', median: 145, p25: 110, p75: 190, sampleSize: 4200 },
  { code: '99214', label: 'Office visit, established, level 4', median: 210, p25: 165, p75: 270, sampleSize: 3800 },
  { code: '99284', label: 'Emergency visit, level 4', median: 980, p25: 640, p75: 1320, sampleSize: 2600 },
  { code: '99285', label: 'Emergency visit, level 5', median: 1450, p25: 980, p75: 1900, sampleSize: 2400 },
  { code: '99244', label: 'Office consultation, level 4', median: 360, p25: 280, p75: 470, sampleSize: 900 },
  { code: '70450', label: 'CT head, without contrast', median: 760, p25: 520, p75: 980, sampleSize: 1800 },
  { code: '72148', label: 'MRI lumbar spine, without contrast', median: 1100, p25: 820, p75: 1450, sampleSize: 1500 },
  { code: '73562', label: 'X-ray knee, 3 views', median: 165, p25: 120, p75: 220, sampleSize: 1200 },
  { code: '71046', label: 'Chest X-ray, 2 views', median: 175, p25: 130, p75: 240, sampleSize: 2100 },
  { code: '80053', label: 'Comprehensive metabolic panel', median: 95, p25: 60, p75: 140, sampleSize: 5200 },
  { code: '80048', label: 'Basic metabolic panel', median: 55, p25: 38, p75: 78, sampleSize: 4800 },
  { code: '85025', label: 'Complete blood count w/ differential', median: 48, p25: 32, p75: 70, sampleSize: 5000 },
  { code: '96360', label: 'IV hydration, first hour', median: 280, p25: 190, p75: 380, sampleSize: 1400 },
  { code: '20610', label: 'Joint injection, major', median: 320, p25: 240, p75: 430, sampleSize: 1100 },
  { code: '00840', label: 'Anesthesia, lower abdomen', median: 1200, p25: 850, p75: 1650, sampleSize: 700 },
  { code: '45378', label: 'Diagnostic colonoscopy', median: 1350, p25: 980, p75: 1800, sampleSize: 950 },
  { code: '45380', label: 'Colonoscopy with biopsy', median: 1650, p25: 1200, p75: 2150, sampleSize: 880 },
  { code: '93000', label: 'ECG, complete', median: 95, p25: 65, p75: 135, sampleSize: 3100 },
  { code: '93005', label: 'ECG, tracing only', median: 60, p25: 42, p75: 88, sampleSize: 2800 },
  { code: '36415', label: 'Routine venipuncture', median: 25, p25: 15, p75: 38, sampleSize: 6200 },
  { code: 'J7030', label: 'Normal saline IV, 1000 ml', median: 90, p25: 55, p75: 130, sampleSize: 1700 },
  { code: '74177', label: 'CT abdomen & pelvis w/ contrast', median: 1500, p25: 1100, p75: 1950, sampleSize: 1300 },
  { code: '76700', label: 'Abdominal ultrasound, complete', median: 420, p25: 300, p75: 560, sampleSize: 1000 },
  { code: '12001', label: 'Simple wound repair', median: 350, p25: 250, p75: 480, sampleSize: 800 },
  { code: '90471', label: 'Immunization administration', median: 40, p25: 28, p75: 58, sampleSize: 2200 },
  { code: '99283', label: 'Emergency visit, level 3', median: 620, p25: 420, p75: 850, sampleSize: 2700 },
  { code: '99204', label: 'Office visit, new patient, level 4', median: 320, p25: 250, p75: 410, sampleSize: 1900 },
  { code: '81002', label: 'Urinalysis, non-automated', median: 18, p25: 12, p75: 28, sampleSize: 3400 },
  { code: '82947', label: 'Glucose, quantitative', median: 22, p25: 14, p75: 34, sampleSize: 3600 },
  { code: '71250', label: 'CT chest, without contrast', median: 820, p25: 580, p75: 1080, sampleSize: 1250 },
];
