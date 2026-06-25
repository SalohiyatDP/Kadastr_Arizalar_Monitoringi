/**
 * Utils.gs - Yordamchi funksiyalar moduli
 * Davlat kadastrlari palatasi - Arizalar nazorati tizimi
 * 
 * Sana formatlash, validatsiya, ID generatsiya va boshqa
 * umumiy yordamchi funksiyalar.
 */

/**
 * Yangi unikal ID generatsiya qilish
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Sheet obyekti
 * @returns {number} Yangi ID
 */
function generateId(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return 1;
    }
    const lastId = sheet.getRange(lastRow, 1).getValue();
    return (parseInt(lastId) || 0) + 1;
  } catch (error) {
    Logger.log('generateId xatosi: ' + error.message);
    return 1;
  }
}

/**
 * Sanani formatlash (dd.MM.yyyy)
 * @param {Date} date - Sana obyekti
 * @returns {string} Formatlangan sana
 */
function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const config = getSystemConfig();
  return Utilities.formatDate(date, config.TIMEZONE, config.DATE_FORMAT);
}

/**
 * Sana va vaqtni formatlash (dd.MM.yyyy HH:mm:ss)
 * @param {Date} date - Sana obyekti
 * @returns {string} Formatlangan sana va vaqt
 */
function formatDateTime(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const config = getSystemConfig();
  return Utilities.formatDate(date, config.TIMEZONE, config.DATETIME_FORMAT);
}

/**
 * Stringdan Date obyektiga aylantirish
 * @param {string} dateStr - Sana string (dd.MM.yyyy yoki yyyy-MM-dd)
 * @returns {Date|null} Date obyekti yoki null
 */
function parseDate(dateStr) {
  try {
    if (!dateStr) return null;
    
    let parts;
    if (dateStr.includes('.')) {
      // dd.MM.yyyy format
      parts = dateStr.split('.');
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else if (dateStr.includes('-')) {
      // yyyy-MM-dd format
      parts = dateStr.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    
    return null;
  } catch (error) {
    Logger.log('parseDate xatosi: ' + error.message);
    return null;
  }
}

/**
 * Bugungi sanani olish (Toshkent vaqti bo'yicha)
 * @returns {Date} Bugungi sana
 */
function getToday() {
  const config = getSystemConfig();
  const now = new Date();
  const formatted = Utilities.formatDate(now, config.TIMEZONE, 'yyyy-MM-dd');
  const parts = formatted.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

/**
 * Hozirgi vaqtni olish (Toshkent vaqti bo'yicha)
 * @returns {Date} Hozirgi vaqt
 */
function getNow() {
  return new Date();
}

/**
 * Ariza raqami takror emasligini tekshirish
 * @param {string} arizaRaqami - Tekshiriladigan ariza raqami
 * @param {number|null} excludeId - Istisno qilinadigan ID (tahrirlashda)
 * @returns {boolean} true - agar takror bo'lmasa
 */
function isArizaRaqamiUnique(arizaRaqami, excludeId) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return true;
    }
    
    const cols = getArizalarColumns();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, cols.ARIZA_RAQAMI).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const rowId = data[i][cols.ID - 1];
      const rowAriza = data[i][cols.ARIZA_RAQAMI - 1].toString().trim();
      
      if (rowAriza === arizaRaqami.toString().trim() && rowId !== excludeId) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    Logger.log('isArizaRaqamiUnique xatosi: ' + error.message);
    return true;
  }
}

/**
 * Sheetdan ma'lumotlarni obyektlar massivi sifatida o'qish
 * @param {string} sheetName - Sheet nomi
 * @param {Object} columns - Ustun indekslari obyekti
 * @returns {Array<Object>} Ma'lumotlar massivi
 */
function getSheetDataAsObjects(sheetName, columns) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      const obj = {};
      for (const [key, colIndex] of Object.entries(columns)) {
        const value = data[i][colIndex - 1];
        // Sana obyektlarini formatlash
        if (value instanceof Date) {
          obj[key] = formatDate(value);
        } else {
          obj[key] = value !== undefined && value !== null ? value.toString() : '';
        }
      }
      result.push(obj);
    }
    
    return result;
  } catch (error) {
    Logger.log('getSheetDataAsObjects xatosi: ' + error.message);
    return [];
  }
}

/**
 * Javob obyekti yaratish (muvaffaqiyatli)
 * @param {*} data - Qaytariladigan ma'lumot
 * @param {string} message - Xabar
 * @returns {Object} Standart javob obyekti
 */
function successResponse(data, message) {
  return {
    success: true,
    data: data,
    message: message || 'Muvaffaqiyatli'
  };
}

/**
 * Javob obyekti yaratish (xato)
 * @param {string} message - Xato xabari
 * @param {*} error - Xato tafsilotlari
 * @returns {Object} Standart xato javob obyekti
 */
function errorResponse(message, error) {
  return {
    success: false,
    data: null,
    message: message || 'Xatolik yuz berdi',
    error: error ? error.toString() : ''
  };
}

/**
 * Ma'lumotni validatsiya qilish
 * @param {Object} data - Tekshiriladigan ma'lumot
 * @param {Array<string>} requiredFields - Majburiy maydonlar
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateData(data, requiredFields) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(field + ' maydoni to\'ldirilishi shart');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Stringni tozalash (trimming va sanitization)
 * @param {*} value - Tozalanadigan qiymat
 * @returns {string} Tozalangan string
 */
function sanitize(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return value.toString().trim();
}

/**
 * Raqam ekanligini tekshirish
 * @param {*} value - Tekshiriladigan qiymat
 * @returns {boolean}
 */
function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Sana oralig'ida ekanligini tekshirish
 * @param {Date} date - Tekshiriladigan sana
 * @param {Date} startDate - Boshlanish sanasi
 * @param {Date} endDate - Tugash sanasi
 * @returns {boolean}
 */
function isDateInRange(date, startDate, endDate) {
  if (!date || !startDate || !endDate) return false;
  const d = date.getTime();
  return d >= startDate.getTime() && d <= endDate.getTime();
}

/**
 * Oyning birinchi kunini olish
 * @param {number} year - Yil
 * @param {number} month - Oy (0-based)
 * @returns {Date}
 */
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1);
}

/**
 * Oyning oxirgi kunini olish
 * @param {number} year - Yil
 * @param {number} month - Oy (0-based)
 * @returns {Date}
 */
function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0);
}
