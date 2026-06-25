/**
 * Report.gs - Hisobot moduli
 * Davlat kadastrlari palatasi - Arizalar nazorati tizimi
 * 
 * Oylik hisobotlar, muhandis samaradorligi,
 * eksport funksiyalari va statistik tahlillar.
 */

/**
 * Tanlangan davr uchun batafsil hisobot
 * @param {string} sanaFrom - Boshlanish sanasi (dd.MM.yyyy)
 * @param {string} sanaTo - Tugash sanasi (dd.MM.yyyy)
 * @returns {Object} Batafsil hisobot
 */
function getDetailedReport(sanaFrom, sanaTo) {
  try {
    let startDate, endDate;
    
    if (sanaFrom && sanaTo) {
      startDate = parseDate(sanaFrom);
      endDate = parseDate(sanaTo);
    } else {
      // Default: joriy oy
      const today = getToday();
      startDate = getFirstDayOfMonth(today.getFullYear(), today.getMonth());
      endDate = getLastDayOfMonth(today.getFullYear(), today.getMonth());
    }
    
    if (!startDate || !endDate) {
      return errorResponse('Sana formati noto\'g\'ri');
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse({
        summary: getEmptyReportSummary(),
        engineers: [],
        daily: []
      }, 'Ma\'lumot yo\'q');
    }
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
    
    const engineerStats = {};
    const dailyStats = {};
    let totalKelgan = 0, totalYakunlangan = 0, totalRad = 0, totalJarayonda = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const muhandis = row[cols.MUHANDIS - 1].toString().trim();
      const kelganSana = row[cols.KELGAN_SANA - 1];
      const holati = row[cols.HOLATI - 1].toString();
      
      if (!muhandis || !(kelganSana instanceof Date)) continue;
      if (!isDateInRange(kelganSana, startDate, endDate)) continue;
      
      // Muhandis statistikasi
      if (!engineerStats[muhandis]) {
        engineerStats[muhandis] = {
          muhandis: muhandis,
          kelgan: 0,
          yakunlangan: 0,
          radEtilgan: 0,
          jarayonda: 0,
          ortachaMuddat: 0,
          totalDays: 0
        };
      }
      
      engineerStats[muhandis].kelgan++;
      totalKelgan++;
      
      // Kunlik statistika
      const dayKey = formatDate(kelganSana);
      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = {sana: dayKey, kelgan: 0, yakunlangan: 0, radEtilgan: 0};
      }
      dailyStats[dayKey].kelgan++;
      
      if (holati === holatlar.YAKUNLANDI) {
        engineerStats[muhandis].yakunlangan++;
        totalYakunlangan++;
        dailyStats[dayKey].yakunlangan++;
        
        // O'rtacha bajarish muddati
        const yakunSana = row[cols.YAKUNLANGAN_SANA - 1];
        if (yakunSana instanceof Date) {
          const days = Math.ceil((yakunSana.getTime() - kelganSana.getTime()) / (1000 * 60 * 60 * 24));
          engineerStats[muhandis].totalDays += days;
        }
      } else if (holati === holatlar.RAD_ETILDI) {
        engineerStats[muhandis].radEtilgan++;
        totalRad++;
        dailyStats[dayKey].radEtilgan++;
      } else if (holati === holatlar.JARAYONDA) {
        engineerStats[muhandis].jarayonda++;
        totalJarayonda++;
      }
    }


    // Muhandislar uchun foiz va o'rtacha muddatni hisoblash
    const engineers = Object.values(engineerStats);
    for (let i = 0; i < engineers.length; i++) {
      const eng = engineers[i];
      if (eng.kelgan > 0) {
        eng.foiz = Math.round(((eng.yakunlangan + eng.radEtilgan) / eng.kelgan) * 100);
      } else {
        eng.foiz = 0;
      }
      if (eng.yakunlangan > 0) {
        eng.ortachaMuddat = Math.round(eng.totalDays / eng.yakunlangan);
      }
      delete eng.totalDays;
    }
    
    // Kunlik statistikani massivga aylantirish
    const daily = Object.values(dailyStats).sort(function(a, b) {
      return a.sana.localeCompare(b.sana);
    });
    
    const summary = {
      davr: formatDate(startDate) + ' - ' + formatDate(endDate),
      kelgan: totalKelgan,
      yakunlangan: totalYakunlangan,
      radEtilgan: totalRad,
      jarayonda: totalJarayonda,
      umumiyFoiz: totalKelgan > 0 ? Math.round(((totalYakunlangan + totalRad) / totalKelgan) * 100) : 0
    };
    
    return successResponse({
      summary: summary,
      engineers: engineers,
      daily: daily
    }, 'Hisobot muvaffaqiyatli');
    
  } catch (error) {
    Logger.log('getDetailedReport xatosi: ' + error.message);
    return errorResponse('Hisobotni olishda xatolik', error);
  }
}

/**
 * Bo'sh hisobot summary
 * @returns {Object}
 */
function getEmptyReportSummary() {
  return {
    davr: '',
    kelgan: 0,
    yakunlangan: 0,
    radEtilgan: 0,
    jarayonda: 0,
    umumiyFoiz: 0
  };
}


/**
 * Muhandis samaradorlik hisoboti
 * @param {string} muhandis - Muhandis ismi
 * @param {number} year - Yil
 * @returns {Object} Yillik samaradorlik
 */
function getEngineerPerformance(muhandis, year) {
  try {
    if (!muhandis) {
      return errorResponse('Muhandis tanlanmagan');
    }
    
    const currentYear = year || getToday().getFullYear();
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse({months: [], total: {}}, 'Ma\'lumot yo\'q');
    }
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
    
    // 12 oy uchun statistika
    const months = [];
    for (let m = 0; m < 12; m++) {
      months.push({
        oy: m + 1,
        oyNomi: getMonthName(m),
        kelgan: 0,
        yakunlangan: 0,
        radEtilgan: 0,
        jarayonda: 0,
        foiz: 0
      });
    }
    
    let totalKelgan = 0, totalYakunlangan = 0, totalRad = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowMuhandis = row[cols.MUHANDIS - 1].toString().trim();
      const kelganSana = row[cols.KELGAN_SANA - 1];
      const holati = row[cols.HOLATI - 1].toString();
      
      if (rowMuhandis !== muhandis.trim()) continue;
      if (!(kelganSana instanceof Date)) continue;
      if (kelganSana.getFullYear() !== currentYear) continue;
      
      const monthIndex = kelganSana.getMonth();
      months[monthIndex].kelgan++;
      totalKelgan++;
      
      if (holati === holatlar.YAKUNLANDI) {
        months[monthIndex].yakunlangan++;
        totalYakunlangan++;
      } else if (holati === holatlar.RAD_ETILDI) {
        months[monthIndex].radEtilgan++;
        totalRad++;
      } else if (holati === holatlar.JARAYONDA) {
        months[monthIndex].jarayonda++;
      }
    }
    
    // Foizlarni hisoblash
    for (let i = 0; i < months.length; i++) {
      if (months[i].kelgan > 0) {
        months[i].foiz = Math.round(((months[i].yakunlangan + months[i].radEtilgan) / months[i].kelgan) * 100);
      }
    }
    
    return successResponse({
      muhandis: muhandis,
      year: currentYear,
      months: months,
      total: {
        kelgan: totalKelgan,
        yakunlangan: totalYakunlangan,
        radEtilgan: totalRad,
        foiz: totalKelgan > 0 ? Math.round(((totalYakunlangan + totalRad) / totalKelgan) * 100) : 0
      }
    }, 'Samaradorlik hisoboti');
    
  } catch (error) {
    Logger.log('getEngineerPerformance xatosi: ' + error.message);
    return errorResponse('Hisobotni olishda xatolik', error);
  }
}

/**
 * Oy nomini qaytarish
 * @param {number} monthIndex - Oy indeksi (0-11)
 * @returns {string} Oy nomi
 */
function getMonthName(monthIndex) {
  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];
  return months[monthIndex] || '';
}


/**
 * Dashboard sheetiga statistikani yozish (avtomatik yangilash)
 * @returns {Object} Natija
 */
function updateDashboardSheet() {
  try {
    const ss = getSpreadsheet();
    const dashSheet = ss.getSheetByName(getSheetNames().DASHBOARD);
    const statSheet = ss.getSheetByName(getSheetNames().STATISTIKA);
    
    if (!dashSheet && !statSheet) {
      return successResponse(null, 'Dashboard/Statistika sheet topilmadi');
    }
    
    // Umumiy statistikani olish
    const chiefStats = getChiefStats();
    if (!chiefStats.success) return chiefStats;
    
    const stats = chiefStats.data;
    const today = getToday();
    
    // Statistika sheetiga yozish
    if (statSheet) {
      const lastRow = statSheet.getLastRow();
      const newRow = [
        today,
        stats.jami,
        stats.jarayonda,
        stats.yakunlangan,
        stats.radEtilgan,
        stats.muddatiOtgan,
        getNow()
      ];
      statSheet.appendRow(newRow);
    }
    
    return successResponse(null, 'Dashboard yangilandi');
    
  } catch (error) {
    Logger.log('updateDashboardSheet xatosi: ' + error.message);
    return errorResponse('Dashboardni yangilashda xatolik', error);
  }
}

/**
 * Muddati o'tgan arizalar ro'yxati
 * @returns {Object} Muddati o'tgan arizalar
 */
function getOverdueArizalar() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse([], 'Arizalar topilmadi');
    }
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const today = getToday();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
    const overdue = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const holati = row[cols.HOLATI - 1].toString();
      
      if (holati !== holatlar.JARAYONDA) continue;
      
      const tugashSanasi = row[cols.TUGASH_SANASI - 1];
      if (!(tugashSanasi instanceof Date)) continue;
      
      const qolganKun = getRemainingWorkingDays(today, tugashSanasi);
      if (qolganKun < 0) {
        overdue.push({
          id: row[cols.ID - 1],
          muhandis: row[cols.MUHANDIS - 1].toString().trim(),
          arizaRaqami: row[cols.ARIZA_RAQAMI - 1].toString(),
          kelganSana: formatDate(row[cols.KELGAN_SANA - 1]),
          tugashSanasi: formatDate(tugashSanasi),
          qolganKun: qolganKun,
          kechikish: Math.abs(qolganKun)
        });
      }
    }
    
    // Eng ko'p kechikkanlari birinchi
    overdue.sort(function(a, b) {
      return a.qolganKun - b.qolganKun;
    });
    
    return successResponse(overdue, 'Muddati o\'tgan arizalar');
    
  } catch (error) {
    Logger.log('getOverdueArizalar xatosi: ' + error.message);
    return errorResponse('Ma\'lumotlarni olishda xatolik', error);
  }
}
