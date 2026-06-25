/**
 * Chief.gs - Bosh muhandis operatsiyalari moduli
 * Davlat kadastrlari palatasi - Arizalar nazorati tizimi
 * 
 * Umumiy statistika, muhandislar bo'yicha hisobot,
 * filtrlar va bosh muhandis dashboardi uchun funksiyalar.
 */

/**
 * Umumiy statistika (Bosh muhandis kartochkalari uchun)
 * @returns {Object} Kengaytirilgan statistika
 */
function getChiefStats() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    const stats = {
      jami: 0,
      jarayonda: 0,
      yakunlangan: 0,
      radEtilgan: 0,
      bugunTugaydi: 0,
      kun1Qolgan: 0,
      kun2Qolgan: 0,
      kun3Qolgan: 0,
      kun4PlusQolgan: 0,
      muddatiOtgan: 0
    };
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse(stats, 'Statistika');
    }
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const today = getToday();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();


    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const holati = row[cols.HOLATI - 1].toString();
      stats.jami++;
      
      if (holati === holatlar.JARAYONDA) {
        stats.jarayonda++;
        
        const tugashSanasi = row[cols.TUGASH_SANASI - 1];
        if (tugashSanasi instanceof Date) {
          const qolganKun = getRemainingWorkingDays(today, tugashSanasi);
          
          if (qolganKun < 0) {
            stats.muddatiOtgan++;
          } else if (qolganKun === 0) {
            stats.bugunTugaydi++;
          } else if (qolganKun === 1) {
            stats.kun1Qolgan++;
          } else if (qolganKun === 2) {
            stats.kun2Qolgan++;
          } else if (qolganKun === 3) {
            stats.kun3Qolgan++;
          } else {
            stats.kun4PlusQolgan++;
          }
        }
      } else if (holati === holatlar.YAKUNLANDI) {
        stats.yakunlangan++;
      } else if (holati === holatlar.RAD_ETILDI) {
        stats.radEtilgan++;
      }
    }
    
    return successResponse(stats, 'Statistika muvaffaqiyatli');
    
  } catch (error) {
    Logger.log('getChiefStats xatosi: ' + error.message);
    return errorResponse('Statistikani olishda xatolik', error);
  }
}


/**
 * Muhandislar bo'yicha statistika jadvali
 * @returns {Object} Har bir muhandis uchun statistika
 */
function getEngineersSummary() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse([], 'Ma\'lumot yo\'q');
    }
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const today = getToday();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
    const engineerMap = {};
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const muhandis = row[cols.MUHANDIS - 1].toString().trim();
      const holati = row[cols.HOLATI - 1].toString();
      
      if (!muhandis) continue;
      
      if (!engineerMap[muhandis]) {
        engineerMap[muhandis] = {
          muhandis: muhandis,
          bugunTugaydi: 0,
          muddatiOtgan: 0,
          jarayonda: 0,
          yakunlangan: 0,
          radEtilgan: 0,
          jami: 0
        };
      }
      
      engineerMap[muhandis].jami++;
      
      if (holati === holatlar.JARAYONDA) {
        engineerMap[muhandis].jarayonda++;
        
        const tugashSanasi = row[cols.TUGASH_SANASI - 1];
        if (tugashSanasi instanceof Date) {
          const qolganKun = getRemainingWorkingDays(today, tugashSanasi);
          if (qolganKun < 0) {
            engineerMap[muhandis].muddatiOtgan++;
          } else if (qolganKun === 0) {
            engineerMap[muhandis].bugunTugaydi++;
          }
        }
      } else if (holati === holatlar.YAKUNLANDI) {
        engineerMap[muhandis].yakunlangan++;
      } else if (holati === holatlar.RAD_ETILDI) {
        engineerMap[muhandis].radEtilgan++;
      }
    }
    
    const result = Object.values(engineerMap);
    return successResponse(result, 'Muvaffaqiyatli');
    
  } catch (error) {
    Logger.log('getEngineersSummary xatosi: ' + error.message);
    return errorResponse('Ma\'lumotlarni olishda xatolik', error);
  }
}


/**
 * Oylik hisobot (tanlangan oy uchun)
 * @param {number} year - Yil
 * @param {number} month - Oy (1-12)
 * @returns {Object} Oylik statistika
 */
function getMonthlyReport(year, month) {
  try {
    if (!year || !month) {
      const today = getToday();
      year = year || today.getFullYear();
      month = month || (today.getMonth() + 1);
    }
    
    const startDate = getFirstDayOfMonth(year, month - 1);
    const endDate = getLastDayOfMonth(year, month - 1);
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse({engineers: [], totals: {}}, 'Ma\'lumot yo\'q');
    }
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
    const engineerMap = {};
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const muhandis = row[cols.MUHANDIS - 1].toString().trim();
      const kelganSana = row[cols.KELGAN_SANA - 1];
      const holati = row[cols.HOLATI - 1].toString();
      
      if (!muhandis) continue;
      
      // Faqat tanlangan oydagi arizalar
      if (!(kelganSana instanceof Date)) continue;
      if (!isDateInRange(kelganSana, startDate, endDate)) continue;
      
      if (!engineerMap[muhandis]) {
        engineerMap[muhandis] = {
          muhandis: muhandis,
          kelgan: 0,
          yakunlangan: 0,
          radEtilgan: 0,
          jarayonda: 0,
          foiz: 0
        };
      }
      
      engineerMap[muhandis].kelgan++;
      
      if (holati === holatlar.YAKUNLANDI) {
        engineerMap[muhandis].yakunlangan++;
      } else if (holati === holatlar.RAD_ETILDI) {
        engineerMap[muhandis].radEtilgan++;
      } else if (holati === holatlar.JARAYONDA) {
        engineerMap[muhandis].jarayonda++;
      }
    }
    
    // Bajarilish foizini hisoblash
    const engineers = Object.values(engineerMap);
    let totalKelgan = 0, totalYakunlangan = 0, totalRad = 0, totalJarayonda = 0;
    
    for (let i = 0; i < engineers.length; i++) {
      const eng = engineers[i];
      if (eng.kelgan > 0) {
        eng.foiz = Math.round(((eng.yakunlangan + eng.radEtilgan) / eng.kelgan) * 100);
      }
      totalKelgan += eng.kelgan;
      totalYakunlangan += eng.yakunlangan;
      totalRad += eng.radEtilgan;
      totalJarayonda += eng.jarayonda;
    }
    
    const totals = {
      kelgan: totalKelgan,
      yakunlangan: totalYakunlangan,
      radEtilgan: totalRad,
      jarayonda: totalJarayonda,
      foiz: totalKelgan > 0 ? Math.round(((totalYakunlangan + totalRad) / totalKelgan) * 100) : 0
    };
    
    return successResponse({
      engineers: engineers,
      totals: totals,
      year: year,
      month: month
    }, 'Oylik hisobot');
    
  } catch (error) {
    Logger.log('getMonthlyReport xatosi: ' + error.message);
    return errorResponse('Oylik hisobotni olishda xatolik', error);
  }
}


/**
 * Barcha arizalarni olish (filtrlar bilan)
 * @param {Object} filters - Filtrlar {muhandis, holati, oy, sanaFrom, sanaTo, qidiruv}
 * @returns {Object} Filtrlangan arizalar ro'yxati
 */
function getAllArizalar(filters) {
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
    let arizalar = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const muhandis = row[cols.MUHANDIS - 1].toString().trim();
      const holati = row[cols.HOLATI - 1].toString();
      const kelganSana = row[cols.KELGAN_SANA - 1];
      const arizaRaqami = row[cols.ARIZA_RAQAMI - 1].toString();
      
      // Filtrlarni qo'llash
      if (filters) {
        // Muhandis filtri
        if (filters.muhandis && filters.muhandis.trim() !== '' && muhandis !== filters.muhandis.trim()) {
          continue;
        }
        
        // Holat filtri
        if (filters.holati && filters.holati.trim() !== '' && holati !== filters.holati.trim()) {
          continue;
        }
        
        // Oy filtri
        if (filters.oy && kelganSana instanceof Date) {
          const filterMonth = parseInt(filters.oy);
          if (kelganSana.getMonth() + 1 !== filterMonth) {
            continue;
          }
        }
        
        // Sana oralig'i filtri
        if (filters.sanaFrom && kelganSana instanceof Date) {
          const fromDate = parseDate(filters.sanaFrom);
          if (fromDate && kelganSana.getTime() < fromDate.getTime()) {
            continue;
          }
        }
        if (filters.sanaTo && kelganSana instanceof Date) {
          const toDate = parseDate(filters.sanaTo);
          if (toDate && kelganSana.getTime() > toDate.getTime()) {
            continue;
          }
        }
        
        // Qidiruv filtri (ariza raqami bo'yicha)
        if (filters.qidiruv && filters.qidiruv.trim() !== '') {
          const searchTerm = filters.qidiruv.trim().toLowerCase();
          if (!arizaRaqami.toLowerCase().includes(searchTerm) && 
              !muhandis.toLowerCase().includes(searchTerm)) {
            continue;
          }
        }
      }
      
      // Qolgan kunni hisoblash
      let qolganKun = row[cols.QOLGAN_ISH_KUNI - 1];
      if (holati === holatlar.JARAYONDA && row[cols.TUGASH_SANASI - 1] instanceof Date) {
        qolganKun = getRemainingWorkingDays(today, row[cols.TUGASH_SANASI - 1]);
      }
      
      arizalar.push({
        id: row[cols.ID - 1],
        muhandis: muhandis,
        arizaRaqami: arizaRaqami,
        kelganSana: kelganSana instanceof Date ? formatDate(kelganSana) : '',
        obyektTuri: row[cols.OBYEKT_TURI - 1].toString(),
        xizmatTuri: row[cols.XIZMAT_TURI - 1].toString(),
        muddat: row[cols.MUDDAT - 1],
        tugashSanasi: row[cols.TUGASH_SANASI - 1] instanceof Date ? formatDate(row[cols.TUGASH_SANASI - 1]) : '',
        qolganKun: qolganKun,
        holati: holati,
        yakunlanganSana: row[cols.YAKUNLANGAN_SANA - 1] instanceof Date ? formatDate(row[cols.YAKUNLANGAN_SANA - 1]) : '',
        radEtilganSana: row[cols.RAD_ETILGAN_SANA - 1] instanceof Date ? formatDate(row[cols.RAD_ETILGAN_SANA - 1]) : '',
        radSababi: row[cols.RAD_SABABI - 1] ? row[cols.RAD_SABABI - 1].toString() : ''
      });
    }
    
    return successResponse(arizalar, 'Muvaffaqiyatli');
    
  } catch (error) {
    Logger.log('getAllArizalar xatosi: ' + error.message);
    return errorResponse('Arizalarni olishda xatolik', error);
  }
}


/**
 * Diagrammalar uchun ma'lumotlar
 * @returns {Object} Charts data
 */
function getChartsData() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse({pie: [], column: [], line: []}, 'Ma\'lumot yo\'q');
    }
    
    const cols = getArizalarColumns();
    const holatlar = getHolatlar();
    const today = getToday();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
    
    // Pie Chart - Muddat bo'yicha taqsimot
    const pieData = {
      bugunTugaydi: 0,
      kun1: 0,
      kun2: 0,
      kun3: 0,
      kun4Plus: 0,
      muddatiOtgan: 0
    };
    
    // Column Chart - Muhandislar bo'yicha
    const columnData = {};
    
    // Line Chart - Oylik statistika
    const lineData = {};
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const muhandis = row[cols.MUHANDIS - 1].toString().trim();
      const holati = row[cols.HOLATI - 1].toString();
      const kelganSana = row[cols.KELGAN_SANA - 1];
      
      if (!muhandis) continue;
      
      // Column data
      if (!columnData[muhandis]) {
        columnData[muhandis] = {jarayonda: 0, yakunlangan: 0, radEtilgan: 0};
      }
      
      // Line data (oylik)
      if (kelganSana instanceof Date) {
        const monthKey = kelganSana.getFullYear() + '-' + String(kelganSana.getMonth() + 1).padStart(2, '0');
        if (!lineData[monthKey]) {
          lineData[monthKey] = {kelgan: 0, yakunlangan: 0, radEtilgan: 0};
        }
        lineData[monthKey].kelgan++;
      }
      
      if (holati === holatlar.JARAYONDA) {
        columnData[muhandis].jarayonda++;
        
        const tugashSanasi = row[cols.TUGASH_SANASI - 1];
        if (tugashSanasi instanceof Date) {
          const qolganKun = getRemainingWorkingDays(today, tugashSanasi);
          if (qolganKun < 0) pieData.muddatiOtgan++;
          else if (qolganKun === 0) pieData.bugunTugaydi++;
          else if (qolganKun === 1) pieData.kun1++;
          else if (qolganKun === 2) pieData.kun2++;
          else if (qolganKun === 3) pieData.kun3++;
          else pieData.kun4Plus++;
        }
      } else if (holati === holatlar.YAKUNLANDI) {
        columnData[muhandis].yakunlangan++;
        if (kelganSana instanceof Date) {
          const mk = kelganSana.getFullYear() + '-' + String(kelganSana.getMonth() + 1).padStart(2, '0');
          if (lineData[mk]) lineData[mk].yakunlangan++;
        }
      } else if (holati === holatlar.RAD_ETILDI) {
        columnData[muhandis].radEtilgan++;
        if (kelganSana instanceof Date) {
          const mk = kelganSana.getFullYear() + '-' + String(kelganSana.getMonth() + 1).padStart(2, '0');
          if (lineData[mk]) lineData[mk].radEtilgan++;
        }
      }
    }
    
    // Format for charts
    const pieFormatted = [
      ['Kategoriya', 'Soni'],
      ['4+ kun qolgan', pieData.kun4Plus],
      ['3 kun qolgan', pieData.kun3],
      ['2 kun qolgan', pieData.kun2],
      ['1 kun qolgan', pieData.kun1],
      ['Bugun tugaydi', pieData.bugunTugaydi],
      ['Muddati o\'tgan', pieData.muddatiOtgan]
    ];
    
    const columnFormatted = [['Muhandis', 'Jarayonda', 'Yakunlangan', 'Rad etilgan']];
    for (const [name, vals] of Object.entries(columnData)) {
      columnFormatted.push([name, vals.jarayonda, vals.yakunlangan, vals.radEtilgan]);
    }
    
    const sortedMonths = Object.keys(lineData).sort();
    const lineFormatted = [['Oy', 'Kelgan', 'Yakunlangan', 'Rad etilgan']];
    for (const month of sortedMonths) {
      lineFormatted.push([month, lineData[month].kelgan, lineData[month].yakunlangan, lineData[month].radEtilgan]);
    }
    
    return successResponse({
      pie: pieFormatted,
      column: columnFormatted,
      line: lineFormatted
    }, 'Diagramma ma\'lumotlari');
    
  } catch (error) {
    Logger.log('getChartsData xatosi: ' + error.message);
    return errorResponse('Diagramma ma\'lumotlarini olishda xatolik', error);
  }
}
