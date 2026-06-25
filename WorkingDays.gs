/**
 * WorkingDays.gs - Ish kunlari hisoblash moduli
 * Davlat kadastrlari palatasi - Arizalar nazorati tizimi
 * 
 * Shanba, Yakshanba va Bayram kunlarini hisobga olgan holda
 * ish kunlarini hisoblash funksiyalari.
 */

/**
 * Bayram kunlari ro'yxatini Sheetdan o'qish
 * @returns {Array<number>} Bayram kunlari timestamps massivi
 */
function getBayramKunlari() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().BAYRAM_KUNLARI);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }
    
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    const holidays = [];
    
    for (let i = 0; i < data.length; i++) {
      const val = data[i][0];
      if (val instanceof Date && !isNaN(val.getTime())) {
        // Faqat sana qismi (vaqtni olib tashlash)
        const dateOnly = new Date(val.getFullYear(), val.getMonth(), val.getDate());
        holidays.push(dateOnly.getTime());
      }
    }
    
    return holidays;
  } catch (error) {
    Logger.log('getBayramKunlari xatosi: ' + error.message);
    return [];
  }
}

/**
 * Berilgan kun ish kuni ekanligini tekshirish
 * Shanba (6), Yakshanba (0) va bayram kunlari ish kuni emas
 * @param {Date} date - Tekshiriladigan sana
 * @param {Array<number>} holidays - Bayram kunlari timestamps
 * @returns {boolean} true - agar ish kuni bo'lsa
 */
function isWorkingDay(date, holidays) {
  if (!date || !(date instanceof Date)) return false;
  
  const dayOfWeek = date.getDay();
  
  // Shanba (6) va Yakshanba (0) - dam olish kunlari
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // Bayram kunlari tekshirish
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dateTime = dateOnly.getTime();
  
  if (holidays && holidays.indexOf(dateTime) !== -1) {
    return false;
  }
  
  return true;
}

/**
 * Boshlanish sanasidan N ish kuni qo'shib tugash sanasini hisoblash
 * @param {Date} startDate - Boshlanish sanasi
 * @param {number} workingDays - Qo'shiladigan ish kunlari soni
 * @returns {Date} Tugash sanasi
 */
function addWorkingDays(startDate, workingDays) {
  try {
    if (!startDate || !workingDays || workingDays <= 0) {
      return startDate;
    }
    
    const holidays = getBayramKunlari();
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let daysAdded = 0;
    
    while (daysAdded < workingDays) {
      // Keyingi kunga o'tish
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Ish kuni ekanligini tekshirish
      if (isWorkingDay(currentDate, holidays)) {
        daysAdded++;
      }
    }
    
    return currentDate;
  } catch (error) {
    Logger.log('addWorkingDays xatosi: ' + error.message);
    return startDate;
  }
}

/**
 * Ikki sana orasidagi qolgan ish kunlarini hisoblash
 * @param {Date} fromDate - Boshlanish sanasi (bugun)
 * @param {Date} toDate - Tugash sanasi
 * @returns {number} Qolgan ish kunlari (manfiy bo'lishi mumkin - muddati o'tgan)
 */
function getRemainingWorkingDays(fromDate, toDate) {
  try {
    if (!fromDate || !toDate) return 0;
    
    const holidays = getBayramKunlari();
    const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    
    // Agar tugash sanasi o'tgan bo'lsa - manfiy hisoblash
    if (to.getTime() < from.getTime()) {
      return -countWorkingDaysBetween(to, from, holidays);
    }
    
    return countWorkingDaysBetween(from, to, holidays);
  } catch (error) {
    Logger.log('getRemainingWorkingDays xatosi: ' + error.message);
    return 0;
  }
}

/**
 * Ikki sana orasidagi ish kunlari sonini hisoblash (ichki funksiya)
 * @param {Date} startDate - Boshlanish sanasi
 * @param {Date} endDate - Tugash sanasi
 * @param {Array<number>} holidays - Bayram kunlari
 * @returns {number} Ish kunlari soni
 */
function countWorkingDaysBetween(startDate, endDate, holidays) {
  let count = 0;
  let current = new Date(startDate.getTime());
  
  // Boshlanish kunini hisoblamaymiz, keyingi kundan boshlaymiz
  current.setDate(current.getDate() + 1);
  
  while (current.getTime() <= endDate.getTime()) {
    if (isWorkingDay(current, holidays)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Muddatni hisoblash (Obyekt turi va Xizmat turiga qarab)
 * @param {string} obyektTuri - 'Turar' yoki 'Noturar'
 * @param {string} xizmatTuri - 'Tolovli' yoki 'Bepul'
 * @returns {number} Muddat (ish kunlari)
 */
function calculateMuddat(obyektTuri, xizmatTuri) {
  try {
    const muddatlar = getMuddatlar();
    const key = sanitize(obyektTuri) + '_' + sanitize(xizmatTuri);
    
    if (muddatlar[key] !== undefined) {
      return muddatlar[key];
    }
    
    // Default qiymat
    Logger.log('Muddat topilmadi: ' + key + '. Default 5 ish kuni.');
    return 5;
  } catch (error) {
    Logger.log('calculateMuddat xatosi: ' + error.message);
    return 5;
  }
}

/**
 * Ariza uchun tugash sanasi va muddatni hisoblash
 * @param {Date} kelganSana - Ariza kelgan sana
 * @param {string} obyektTuri - Obyekt turi
 * @param {string} xizmatTuri - Xizmat turi
 * @returns {Object} {muddat, tugashSanasi, qolganKun}
 */
function calculateDeadline(kelganSana, obyektTuri, xizmatTuri) {
  try {
    const muddat = calculateMuddat(obyektTuri, xizmatTuri);
    const tugashSanasi = addWorkingDays(kelganSana, muddat);
    const today = getToday();
    const qolganKun = getRemainingWorkingDays(today, tugashSanasi);
    
    return {
      muddat: muddat,
      tugashSanasi: tugashSanasi,
      qolganKun: qolganKun
    };
  } catch (error) {
    Logger.log('calculateDeadline xatosi: ' + error.message);
    return {
      muddat: 5,
      tugashSanasi: new Date(),
      qolganKun: 0
    };
  }
}

/**
 * Barcha jarayondagi arizalar uchun qolgan kunlarni yangilash
 * Bu funksiya har kuni yoki sahifa ochilganda ishga tushirilishi mumkin
 */
function updateAllRemainingDays() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    if (!sheet || sheet.getLastRow() <= 1) return;
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const today = getToday();
    const holidays = getBayramKunlari();
    const lastRow = sheet.getLastRow();
    
    const data = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const holati = data[i][cols.HOLATI - 1];
      
      // Faqat jarayondagi arizalar uchun yangilash
      if (holati === holatlar.JARAYONDA) {
        const tugashSanasi = data[i][cols.TUGASH_SANASI - 1];
        
        if (tugashSanasi instanceof Date) {
          const qolganKun = getRemainingWorkingDays(today, tugashSanasi);
          // Qolgan ish kuni ustunini yangilash
          sheet.getRange(i + 2, cols.QOLGAN_ISH_KUNI).setValue(qolganKun);
        }
      }
    }
  } catch (error) {
    Logger.log('updateAllRemainingDays xatosi: ' + error.message);
  }
}
