import NepaliDate from 'nepali-date-converter';

export interface NepaliMonthInfo {
  index: number; // 0 to 11
  monthNumber: number; // 1 to 12
  name: string; // e.g. "Ashwin"
  nepaliName: string; // e.g. "असोज"
  short: string;
}

export const NEPALI_MONTHS: NepaliMonthInfo[] = [
  { index: 0, monthNumber: 1, name: 'Baishakh', nepaliName: 'बैशाख', short: 'Bai' },
  { index: 1, monthNumber: 2, name: 'Jestha', nepaliName: 'जेठ', short: 'Jes' },
  { index: 2, monthNumber: 3, name: 'Ashadh', nepaliName: 'असार', short: 'Ash' },
  { index: 3, monthNumber: 4, name: 'Shrawan', nepaliName: 'श्रावण', short: 'Shr' },
  { index: 4, monthNumber: 5, name: 'Bhadra', nepaliName: 'भाद्र', short: 'Bha' },
  { index: 5, monthNumber: 6, name: 'Ashwin', nepaliName: 'असोज', short: 'Asw' },
  { index: 6, monthNumber: 7, name: 'Kartik', nepaliName: 'कार्तिक', short: 'Kar' },
  { index: 7, monthNumber: 8, name: 'Mangsir', nepaliName: 'मंसिर', short: 'Man' },
  { index: 8, monthNumber: 9, name: 'Poush', nepaliName: 'पुष', short: 'Pou' },
  { index: 9, monthNumber: 10, name: 'Magh', nepaliName: 'माघ', short: 'Mag' },
  { index: 10, monthNumber: 11, name: 'Falgun', nepaliName: 'फागुन', short: 'Fal' },
  { index: 11, monthNumber: 12, name: 'Chaitra', nepaliName: 'चैत', short: 'Cha' },
];

export const NEPALI_DAYS = [
  { index: 0, name: 'Aaitabar', englishShort: 'Sun', nepali: 'आइत' },
  { index: 1, name: 'Sombar', englishShort: 'Mon', nepali: 'सोम' },
  { index: 2, name: 'Mangalbar', englishShort: 'Tue', nepali: 'मंगल' },
  { index: 3, name: 'Budhabar', englishShort: 'Wed', nepali: 'बुध' },
  { index: 4, name: 'Bihibar', englishShort: 'Thu', nepali: 'बिही' },
  { index: 5, name: 'Shukrabar', englishShort: 'Fri', nepali: 'शुक्र' },
  { index: 6, name: 'Sanibar', englishShort: 'Sat', nepali: 'शनि' },
];

const nepaliDigitsMap: Record<string, string> = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
};

/**
 * Converts Western digits 0-9 to Devanagari numerals ०-९
 */
export const toNepaliDigits = (input: string | number): string => {
  return String(input).replace(/[0-9]/g, (digit) => nepaliDigitsMap[digit] || digit);
};

/**
 * Normalizes input (Date, AD string '2026-10-01', or BS string '2083-06-15')
 * into a valid NepaliDate instance.
 */
export const parseToNepaliDate = (input?: string | Date | null): NepaliDate => {
  if (!input) {
    return new NepaliDate();
  }

  if (input instanceof Date) {
    return new NepaliDate(input);
  }

  const str = String(input).trim();
  if (!str) {
    return new NepaliDate();
  }

  // Check if string matches YYYY-MM-DD or YYYY/MM/DD
  const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    // If year is >= 2070, it's already a Bikram Sambat year (e.g. 2082, 2083)
    if (year >= 2000 && year <= 2100 && (year >= 2060 || year >= 2070)) {
      try {
        return new NepaliDate(year, Math.max(0, Math.min(11, month - 1)), Math.max(1, Math.min(32, day)));
      } catch {
        return new NepaliDate();
      }
    }

    // Otherwise it's likely an AD Gregorian date (e.g. 2025, 2026) -> convert to BS
    try {
      const adDate = new Date(year, month - 1, day);
      if (!isNaN(adDate.getTime())) {
        return new NepaliDate(adDate);
      }
    } catch {
      // fallback
    }
  }

  // Try direct parse
  try {
    return new NepaliDate(str);
  } catch {
    return new NepaliDate();
  }
};

/**
 * Formats a date into a standard BS string "YYYY-MM-DD"
 */
export const toBsDateString = (input?: string | Date | null): string => {
  const nd = parseToNepaliDate(input);
  const bs = nd.getBS();
  const y = bs.year;
  const m = String(bs.month + 1).padStart(2, '0');
  const d = String(bs.date).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns today's BS date string in "YYYY-MM-DD" format
 */
export const getTodayBsDate = (): string => {
  return toBsDateString(new Date());
};

/**
 * Human-readable Nepali date formatter
 * Example: "15 Ashwin 2083" or "१५ असोज २०८३"
 */
export const formatNepaliDate = (
  input?: string | Date | null,
  format: 'full' | 'devanagari' | 'standard' | 'withDay' | 'monthYear' = 'full'
): string => {
  const nd = parseToNepaliDate(input);
  const bs = nd.getBS();
  const monthInfo = NEPALI_MONTHS[bs.month] || NEPALI_MONTHS[0];
  const dayIndex = typeof bs.day === 'number' ? bs.day : 0;
  const dayInfo = NEPALI_DAYS[dayIndex] || NEPALI_DAYS[0];

  switch (format) {
    case 'standard':
      return `${bs.year}-${String(bs.month + 1).padStart(2, '0')}-${String(bs.date).padStart(2, '0')}`;
    
    case 'devanagari':
      return `${toNepaliDigits(bs.date)} ${monthInfo.nepaliName} ${toNepaliDigits(bs.year)}`;
    
    case 'withDay':
      return `${bs.date} ${monthInfo.name} ${bs.year}, ${dayInfo.englishShort}`;
    
    case 'monthYear':
      return `${monthInfo.name} ${bs.year}`;

    case 'full':
    default:
      return `${bs.date} ${monthInfo.name} ${bs.year}`;
  }
};

/**
 * Calculates number of days in a given BS month and year
 */
export const getDaysInNepaliMonth = (year: number, monthIndex: number): number => {
  try {
    const start = new NepaliDate(year, monthIndex, 1);
    const end = monthIndex === 11 
      ? new NepaliDate(year + 1, 0, 1) 
      : new NepaliDate(year, monthIndex + 1, 1);
    
    const diffMs = end.toJsDate().getTime() - start.toJsDate().getTime();
    return Math.round(diffMs / 86400000);
  } catch {
    return 30;
  }
};

/**
 * Returns weekday index (0 = Sunday ... 6 = Saturday) for the 1st of a BS month
 */
export const getFirstDayOfNepaliMonth = (year: number, monthIndex: number): number => {
  try {
    const start = new NepaliDate(year, monthIndex, 1);
    return start.getDay();
  } catch {
    return 0;
  }
};

/**
 * Converts BS date string "YYYY-MM-DD" to Javascript Date (AD)
 */
export const bsToAdDate = (bsDateStr: string): Date => {
  const nd = parseToNepaliDate(bsDateStr);
  return nd.toJsDate();
};

/**
 * Current Fiscal Year in BS (e.g. "2082/83")
 */
export const getCurrentFiscalYear = (): string => {
  const nd = new NepaliDate();
  const bs = nd.getBS();
  // In Nepal, fiscal year starts Shrawan 1 (month index 3)
  if (bs.month >= 3) {
    const nextYear = String(bs.year + 1).slice(-2);
    return `${bs.year}/${nextYear}`;
  } else {
    const prevYear = bs.year - 1;
    const currYearShort = String(bs.year).slice(-2);
    return `${prevYear}/${currYearShort}`;
  }
};
