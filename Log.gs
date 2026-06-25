/**
 * Log.gs - Jurnal (log) moduli
 * Davlat kadastrlari palatasi - Arizalar nazorati tizimi
 * 
 * Har bir amal uchun log yozish:
 * Kim, Qachon, Nima qildi, Qaysi ariza
 */

/**
 * Log yozish
 * @param {string} foydalanuvchi - Kim bajardi
 * @param {string} amal - Nima qildi
 * @param {string} arizaRaqami - Qaysi ariza
 * @param {string} tafsilot - Qo'shimcha ma'lumot
 */
function writeLog(foydalanuvchi, amal, arizaRaqami, tafsilot) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().LOG);
    
    if (!sheet) {
      Logger.log('Log sheet topilmadi');
      return;
    }
    
    const logCols = getLogColumns();
    const newId = generateId(sheet);
    const now = getNow();
    
    const logRow = [
      newId,
      sanitize(foydalanuvchi),
      now,
      sanitize(amal),
      sanitize(arizaRaqami),
      sanitize(tafsilot)
    ];
    
    sheet.appendRow(logRow);
    
  } catch (error) {
    // Log yozishda xatolik bo'lsa ham asosiy operatsiyani to'xtatmaymiz
    Logger.log('writeLog xatosi: ' + error.message);
  }
}

/**
 * Log yozuvlarini olish (oxirgi N ta)
 * @param {number} limit - Nechta yozuv (default: 50)
 * @returns {Object} Log yozuvlari
 */
function getLogEntries(limit) {
  try {
    const maxEntries = limit || 50;
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().LOG);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse([], 'Log bo\'sh');
    }
    
    const logCols = getLogColumns();
    const lastRow = sheet.getLastRow();
    const startRow = Math.max(2, lastRow - maxEntries + 1);
    const numRows = lastRow - startRow + 1;
    
    const data = sheet.getRange(startRow, 1, numRows, 6).getValues();
    const entries = [];
    
    // Oxirgi yozuvlar birinchi bo'lishi uchun teskari tartibda
    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i];
      entries.push({
        id: row[logCols.ID - 1],
        foydalanuvchi: row[logCols.FOYDALANUVCHI - 1].toString(),
        vaqt: row[logCols.VAQT - 1] instanceof Date ? formatDateTime(row[logCols.VAQT - 1]) : '',
        amal: row[logCols.AMAL - 1].toString(),
        arizaRaqami: row[logCols.ARIZA_RAQAMI - 1].toString(),
        tafsilot: row[logCols.TAFSILOT - 1].toString()
      });
    }
    
    return successResponse(entries, 'Log yozuvlari');
    
  } catch (error) {
    Logger.log('getLogEntries xatosi: ' + error.message);
    return errorResponse('Log yozuvlarini olishda xatolik', error);
  }
}

/**
 * Muhandis bo'yicha log yozuvlarini olish
 * @param {string} muhandis - Muhandis ismi
 * @param {number} limit - Nechta yozuv
 * @returns {Object} Filtrlangan log yozuvlari
 */
function getLogByEngineer(muhandis, limit) {
  try {
    if (!muhandis) {
      return errorResponse('Muhandis ko\'rsatilmagan');
    }
    
    const maxEntries = limit || 30;
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().LOG);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse([], 'Log bo\'sh');
    }
    
    const logCols = getLogColumns();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
    const entries = [];
    
    for (let i = data.length - 1; i >= 0 && entries.length < maxEntries; i--) {
      const row = data[i];
      if (row[logCols.FOYDALANUVCHI - 1].toString().trim() === muhandis.trim()) {
        entries.push({
          id: row[logCols.ID - 1],
          foydalanuvchi: row[logCols.FOYDALANUVCHI - 1].toString(),
          vaqt: row[logCols.VAQT - 1] instanceof Date ? formatDateTime(row[logCols.VAQT - 1]) : '',
          amal: row[logCols.AMAL - 1].toString(),
          arizaRaqami: row[logCols.ARIZA_RAQAMI - 1].toString(),
          tafsilot: row[logCols.TAFSILOT - 1].toString()
        });
      }
    }
    
    return successResponse(entries, 'Log yozuvlari');
    
  } catch (error) {
    Logger.log('getLogByEngineer xatosi: ' + error.message);
    return errorResponse('Log yozuvlarini olishda xatolik', error);
  }
}
