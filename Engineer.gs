/**
 * Engineer.gs - Muhandis operatsiyalari moduli
 * Davlat kadastrlari palatasi - Arizalar nazorati tizimi
 * 
 * Ariza kiritish, yakunlash, rad etish va muhandis dashboard
 * ma'lumotlarini olish funksiyalari.
 */

/**
 * Xodimlar ro'yxatini olish (dropdown uchun)
 * @returns {Object} {success, data: [{id, fish}]}
 */
function getXodimlarList() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().XODIMLAR);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse([], 'Xodimlar ro\'yxati bo\'sh');
    }
    
    const cols = getXodimlarColumns();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
    const xodimlar = [];
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][1]) {
        xodimlar.push({
          id: data[i][cols.ID - 1],
          fish: data[i][cols.FISH - 1].toString().trim()
        });
      }
    }
    
    return successResponse(xodimlar, 'Muvaffaqiyatli');
  } catch (error) {
    Logger.log('getXodimlarList xatosi: ' + error.message);
    return errorResponse('Xodimlar ro\'yxatini olishda xatolik', error);
  }
}

/**
 * Yangi ariza kiritish
 * @param {Object} formData - Ariza ma'lumotlari
 * @returns {Object} Natija
 */
function submitAriza(formData) {
  try {
    // Validatsiya
    const validation = validateData(formData, ['muhandis', 'arizaRaqami', 'kelganSana', 'obyektTuri', 'xizmatTuri']);
    if (!validation.valid) {
      return errorResponse('Validatsiya xatosi: ' + validation.errors.join(', '));
    }
    
    // Ariza raqami unikal ekanligini tekshirish
    if (!isArizaRaqamiUnique(formData.arizaRaqami, null)) {
      return errorResponse('Bu ariza raqami allaqachon mavjud: ' + formData.arizaRaqami);
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    
    // Kelgan sana
    const kelganSana = parseDate(formData.kelganSana);
    if (!kelganSana) {
      return errorResponse('Kelgan sana noto\'g\'ri formatda');
    }
    
    // Muddat va tugash sanasini hisoblash
    const deadlineInfo = calculateDeadline(kelganSana, formData.obyektTuri, formData.xizmatTuri);
    
    // Yangi ID generatsiya
    const newId = generateId(sheet);
    const now = getNow();
    
    // Ma'lumotlarni yozish
    const newRow = [
      newId,                                    // ID
      sanitize(formData.muhandis),              // Muhandis
      sanitize(formData.arizaRaqami),           // Ariza raqami
      kelganSana,                               // Kelgan sana
      sanitize(formData.obyektTuri),            // Obyekt turi
      sanitize(formData.xizmatTuri),            // Xizmat turi
      deadlineInfo.muddat,                      // Muddat (ish kuni)
      deadlineInfo.tugashSanasi,                // Tugash sanasi
      deadlineInfo.qolganKun,                   // Qolgan ish kuni
      holatlar.JARAYONDA,                       // Holati
      '',                                       // Yakunlangan sana
      '',                                       // Rad etilgan sana
      '',                                       // Rad sababi
      now,                                      // Kiritilgan vaqt
      now                                       // Oxirgi tahrir
    ];
    
    sheet.appendRow(newRow);
    
    // Log yozish
    writeLog(formData.muhandis, 'Ariza kiritildi', formData.arizaRaqami, 
      'Obyekt: ' + formData.obyektTuri + ', Xizmat: ' + formData.xizmatTuri + ', Muddat: ' + deadlineInfo.muddat + ' ish kuni');
    
    return successResponse({
      id: newId,
      muddat: deadlineInfo.muddat,
      tugashSanasi: formatDate(deadlineInfo.tugashSanasi),
      qolganKun: deadlineInfo.qolganKun
    }, 'Ariza muvaffaqiyatli kiritildi');
    
  } catch (error) {
    Logger.log('submitAriza xatosi: ' + error.message);
    return errorResponse('Ariza kiritishda xatolik yuz berdi', error);
  }
}

/**
 * Arizani yakunlash
 * @param {number} arizaId - Ariza ID
 * @param {string} muhandis - Muhandis ismi
 * @returns {Object} Natija
 */
function yakunlashAriza(arizaId, muhandis) {
  try {
    if (!arizaId) {
      return errorResponse('Ariza ID ko\'rsatilmagan');
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    
    // Arizani topish
    const rowIndex = findArizaRowById(sheet, arizaId);
    if (rowIndex === -1) {
      return errorResponse('Ariza topilmadi: ID=' + arizaId);
    }
    
    // Holatni tekshirish
    const currentStatus = sheet.getRange(rowIndex, cols.HOLATI).getValue();
    if (currentStatus !== holatlar.JARAYONDA) {
      return errorResponse('Bu ariza allaqachon ' + currentStatus + ' holatida');
    }
    
    const now = getNow();
    const arizaRaqami = sheet.getRange(rowIndex, cols.ARIZA_RAQAMI).getValue();
    
    // Holatni yangilash
    sheet.getRange(rowIndex, cols.HOLATI).setValue(holatlar.YAKUNLANDI);
    sheet.getRange(rowIndex, cols.YAKUNLANGAN_SANA).setValue(now);
    sheet.getRange(rowIndex, cols.OXIRGI_TAHRIR).setValue(now);
    
    // Log yozish
    writeLog(muhandis, 'Ariza yakunlandi', arizaRaqami.toString(), '');
    
    return successResponse({id: arizaId}, 'Ariza muvaffaqiyatli yakunlandi');
    
  } catch (error) {
    Logger.log('yakunlashAriza xatosi: ' + error.message);
    return errorResponse('Arizani yakunlashda xatolik', error);
  }
}

/**
 * Arizani rad etish
 * @param {number} arizaId - Ariza ID
 * @param {string} muhandis - Muhandis ismi
 * @param {string} sabab - Rad etish sababi (ixtiyoriy)
 * @returns {Object} Natija
 */
function radEtishAriza(arizaId, muhandis, sabab) {
  try {
    if (!arizaId) {
      return errorResponse('Ariza ID ko\'rsatilmagan');
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    
    // Arizani topish
    const rowIndex = findArizaRowById(sheet, arizaId);
    if (rowIndex === -1) {
      return errorResponse('Ariza topilmadi: ID=' + arizaId);
    }
    
    // Holatni tekshirish
    const currentStatus = sheet.getRange(rowIndex, cols.HOLATI).getValue();
    if (currentStatus !== holatlar.JARAYONDA) {
      return errorResponse('Bu ariza allaqachon ' + currentStatus + ' holatida');
    }
    
    const now = getNow();
    const arizaRaqami = sheet.getRange(rowIndex, cols.ARIZA_RAQAMI).getValue();
    
    // Holatni yangilash
    sheet.getRange(rowIndex, cols.HOLATI).setValue(holatlar.RAD_ETILDI);
    sheet.getRange(rowIndex, cols.RAD_ETILGAN_SANA).setValue(now);
    sheet.getRange(rowIndex, cols.RAD_SABABI).setValue(sanitize(sabab));
    sheet.getRange(rowIndex, cols.OXIRGI_TAHRIR).setValue(now);
    
    // Log yozish
    writeLog(muhandis, 'Ariza rad etildi', arizaRaqami.toString(), 
      sabab ? 'Sabab: ' + sabab : 'Sabab ko\'rsatilmagan');
    
    return successResponse({id: arizaId}, 'Ariza rad etildi');
    
  } catch (error) {
    Logger.log('radEtishAriza xatosi: ' + error.message);
    return errorResponse('Arizani rad etishda xatolik', error);
  }
}

/**
 * Muhandisning arizalarini olish
 * @param {string} muhandis - Muhandis ismi
 * @returns {Object} {success, data: Array}
 */
function getEngineerArizalar(muhandis) {
  try {
    if (!muhandis || muhandis.trim() === '') {
      return errorResponse('Muhandis tanlanmagan');
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse([], 'Arizalar topilmadi');
    }
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const today = getToday();
    const holidays = getBayramKunlari();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
    const arizalar = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowMuhandis = row[cols.MUHANDIS - 1].toString().trim();
      
      if (rowMuhandis === muhandis.trim()) {
        // Qolgan kunni real vaqtda hisoblash (faqat jarayondagi uchun)
        let qolganKun = row[cols.QOLGAN_ISH_KUNI - 1];
        if (row[cols.HOLATI - 1] === holatlar.JARAYONDA && row[cols.TUGASH_SANASI - 1] instanceof Date) {
          qolganKun = getRemainingWorkingDays(today, row[cols.TUGASH_SANASI - 1]);
        }
        
        arizalar.push({
          id: row[cols.ID - 1],
          muhandis: rowMuhandis,
          arizaRaqami: row[cols.ARIZA_RAQAMI - 1].toString(),
          kelganSana: row[cols.KELGAN_SANA - 1] instanceof Date ? formatDate(row[cols.KELGAN_SANA - 1]) : '',
          obyektTuri: row[cols.OBYEKT_TURI - 1].toString(),
          xizmatTuri: row[cols.XIZMAT_TURI - 1].toString(),
          muddat: row[cols.MUDDAT - 1],
          tugashSanasi: row[cols.TUGASH_SANASI - 1] instanceof Date ? formatDate(row[cols.TUGASH_SANASI - 1]) : '',
          qolganKun: qolganKun,
          holati: row[cols.HOLATI - 1].toString(),
          yakunlanganSana: row[cols.YAKUNLANGAN_SANA - 1] instanceof Date ? formatDate(row[cols.YAKUNLANGAN_SANA - 1]) : '',
          radEtilganSana: row[cols.RAD_ETILGAN_SANA - 1] instanceof Date ? formatDate(row[cols.RAD_ETILGAN_SANA - 1]) : '',
          radSababi: row[cols.RAD_SABABI - 1] ? row[cols.RAD_SABABI - 1].toString() : ''
        });
      }
    }
    
    return successResponse(arizalar, 'Muvaffaqiyatli');
    
  } catch (error) {
    Logger.log('getEngineerArizalar xatosi: ' + error.message);
    return errorResponse('Arizalarni olishda xatolik', error);
  }
}

/**
 * Muhandis statistikasi
 * @param {string} muhandis - Muhandis ismi
 * @returns {Object} Statistika
 */
function getEngineerStats(muhandis) {
  try {
    if (!muhandis || muhandis.trim() === '') {
      return errorResponse('Muhandis tanlanmagan');
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    const stats = {
      jami: 0,
      jarayonda: 0,
      yakunlangan: 0,
      radEtilgan: 0,
      bugunTugaydi: 0,
      muddatiOtgan: 0
    };
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse(stats, 'Statistika');
    }
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const today = getToday();
    const holidays = getBayramKunlari();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowMuhandis = row[cols.MUHANDIS - 1].toString().trim();
      
      if (rowMuhandis === muhandis.trim()) {
        stats.jami++;
        
        const holati = row[cols.HOLATI - 1].toString();
        
        if (holati === holatlar.JARAYONDA) {
          stats.jarayonda++;
          
          // Qolgan kunni hisoblash
          const tugashSanasi = row[cols.TUGASH_SANASI - 1];
          if (tugashSanasi instanceof Date) {
            const qolganKun = getRemainingWorkingDays(today, tugashSanasi);
            
            if (qolganKun === 0) {
              stats.bugunTugaydi++;
            } else if (qolganKun < 0) {
              stats.muddatiOtgan++;
            }
          }
        } else if (holati === holatlar.YAKUNLANDI) {
          stats.yakunlangan++;
        } else if (holati === holatlar.RAD_ETILDI) {
          stats.radEtilgan++;
        }
      }
    }
    
    return successResponse(stats, 'Statistika muvaffaqiyatli');
    
  } catch (error) {
    Logger.log('getEngineerStats xatosi: ' + error.message);
    return errorResponse('Statistikani olishda xatolik', error);
  }
}

/**
 * Ariza raqamini tekshirish (unikal ekanligini)
 * @param {string} arizaRaqami - Ariza raqami
 * @returns {Object} {success, data: {unique: boolean}}
 */
function checkArizaRaqami(arizaRaqami) {
  try {
    const unique = isArizaRaqamiUnique(arizaRaqami, null);
    return successResponse({unique: unique}, unique ? 'Ariza raqami unikal' : 'Bu ariza raqami allaqachon mavjud');
  } catch (error) {
    Logger.log('checkArizaRaqami xatosi: ' + error.message);
    return errorResponse('Tekshirishda xatolik', error);
  }
}

/**
 * Ariza qatorini ID bo'yicha topish
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Sheet
 * @param {number} arizaId - Ariza ID
 * @returns {number} Qator indeksi (1-based) yoki -1
 */
function findArizaRowById(sheet, arizaId) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] == arizaId) {
      return i + 2; // 1-based + header
    }
  }
  
  return -1;
}
