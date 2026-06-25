/**
 * Config.gs - Konfiguratsiya moduli
 * Davlat kadastrlari palatasi - Arizalar nazorati tizimi
 * 
 * Barcha sheet nomlari, ustun indekslari va tizim sozlamalari
 * shu modulda markazlashtirilgan holda saqlanadi.
 */

/**
 * Google Sheets ID - loyiha spreadsheet identifikatori
 * @returns {string} Spreadsheet ID
 */
function getSpreadsheetId() {
  return SpreadsheetApp.getActiveSpreadsheet().getId();
}

/**
 * Spreadsheet obyektini olish
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Sheet nomlarini qaytarish
 * @returns {Object} Sheet nomlari
 */
function getSheetNames() {
  return {
    DASHBOARD: 'Dashboard',
    ARIZALAR: 'Arizalar',
    XODIMLAR: 'Xodimlar',
    SOZLAMALAR: 'Sozlamalar',
    BAYRAM_KUNLARI: 'Bayram kunlari',
    LOG: 'Log',
    STATISTIKA: 'Statistika'
  };
}

/**
 * Arizalar sheet ustun indekslari (1-based)
 * @returns {Object} Ustun indekslari
 */
function getArizalarColumns() {
  return {
    ID: 1,
    MUHANDIS: 2,
    ARIZA_RAQAMI: 3,
    KELGAN_SANA: 4,
    OBYEKT_TURI: 5,
    XIZMAT_TURI: 6,
    MUDDAT: 7,
    TUGASH_SANASI: 8,
    QOLGAN_ISH_KUNI: 9,
    HOLATI: 10,
    YAKUNLANGAN_SANA: 11,
    RAD_ETILGAN_SANA: 12,
    RAD_SABABI: 13,
    KIRITILGAN_VAQT: 14,
    OXIRGI_TAHRIR: 15
  };
}

/**
 * Xodimlar sheet ustun indekslari (1-based)
 * @returns {Object} Ustun indekslari
 */
function getXodimlarColumns() {
  return {
    ID: 1,
    FISH: 2
  };
}

/**
 * Sozlamalar sheetidan muddatlarni o'qish
 * Muddatlar kod ichiga yozilmaydi - faqat Sozlamalar sheetidan o'qiladi
 * @returns {Object} Muddatlar (ish kunlari)
 */
function getMuddatlar() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().SOZLAMALAR);
    
    if (!sheet) {
      // Default qiymatlar - agar sheet topilmasa
      return getDefaultMuddatlar();
    }
    
    const data = sheet.getDataRange().getValues();
    const muddatlar = {};
    
    // Sozlamalar sheetida format:
    // Obyekt turi | Xizmat turi | Muddat (ish kuni)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1] && row[2]) {
        const key = row[0].toString().trim() + '_' + row[1].toString().trim();
        muddatlar[key] = parseInt(row[2]);
      }
    }
    
    // Agar bo'sh bo'lsa default qaytarish
    if (Object.keys(muddatlar).length === 0) {
      return getDefaultMuddatlar();
    }
    
    return muddatlar;
  } catch (error) {
    Logger.log('getMuddatlar xatosi: ' + error.message);
    return getDefaultMuddatlar();
  }
}

/**
 * Default muddatlar - Sozlamalar sheet bo'sh bo'lganda
 * @returns {Object} Default muddatlar
 */
function getDefaultMuddatlar() {
  return {
    'Noturar_Tolovli': 10,
    'Noturar_Bepul': 5,
    'Turar_Tolovli': 8,
    'Turar_Bepul': 5
  };
}

/**
 * Holatlar ro'yxati
 * @returns {Object} Holat nomlari
 */
function getHolatlar() {
  return {
    JARAYONDA: 'Jarayonda',
    YAKUNLANDI: 'Yakunlandi',
    RAD_ETILDI: 'Rad etildi'
  };
}

/**
 * Obyekt turlari
 * @returns {Object} Obyekt turlari
 */
function getObyektTurlari() {
  return {
    TURAR: 'Turar',
    NOTURAR: 'Noturar'
  };
}

/**
 * Xizmat turlari
 * @returns {Object} Xizmat turlari
 */
function getXizmatTurlari() {
  return {
    TOLOVLI: 'Tolovli',
    BEPUL: 'Bepul'
  };
}

/**
 * Log sheet ustun indekslari (1-based)
 * @returns {Object} Ustun indekslari
 */
function getLogColumns() {
  return {
    ID: 1,
    FOYDALANUVCHI: 2,
    VAQT: 3,
    AMAL: 4,
    ARIZA_RAQAMI: 5,
    TAFSILOT: 6
  };
}

/**
 * Ranglar konfiguratsiyasi (frontend uchun)
 * @returns {Object} Ranglar
 */
function getRanglar() {
  return {
    KUN_4_PLUS: '#28a745',      // Yashil
    KUN_3: '#007bff',           // Ko'k
    KUN_2: '#ffc107',           // Sariq
    KUN_1: '#fd7e14',           // To'q sariq
    KUN_0: '#dc3545',           // Qizil
    MUDDATI_OTGAN: '#721c24',   // To'q qizil
    YAKUNLANGAN: '#28a745',     // Yashil
    RAD_ETILGAN: '#6c757d'      // Kulrang
  };
}

/**
 * Tizim konfiguratsiyasi
 * @returns {Object} Tizim sozlamalari
 */
function getSystemConfig() {
  return {
    APP_NAME: 'Davlat kadastrlari palatasi',
    APP_SUBTITLE: 'Arizalar nazorati tizimi',
    VERSION: '1.0.0',
    DATE_FORMAT: 'dd.MM.yyyy',
    DATETIME_FORMAT: 'dd.MM.yyyy HH:mm:ss',
    TIMEZONE: 'Asia/Tashkent',
    MAX_ROWS_PER_PAGE: 50
  };
}
