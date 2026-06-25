/**
 * Archive.gs - Arxiv moduli
 * Davlat kadastrlari palatasi - Arizalar nazorati tizimi
 * 
 * Har oyning 1-sanasida yakunlangan va rad etilgan arizalarni
 * Arizalar sheetidan olib, Arxiv sheetga ko'chirish.
 * Bosh muhandis hisobotida arxiv ma'lumotlarini ko'rsatish.
 */

/**
 * Arxiv sheetini yaratish (agar mavjud bo'lmasa)
 * Ustunlari Arizalar sheet bilan bir xil + Arxivlangan sana
 */
function ensureArxivSheet() {
  var ss = getSpreadsheet();
  var sheetName = getSheetNames().ARXIV;
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = [
      'ID', 'Muhandis', 'Ariza raqami', 'Kelgan sana',
      'Obyekt turi', 'Xizmat turi', 'Muddat', 'Tugash sanasi',
      'Qolgan ish kuni', 'Holati', 'Yakunlangan sana',
      'Rad etilgan sana', 'Rad sababi', 'Kiritilgan vaqt',
      'Oxirgi tahrir', 'Arxivlangan sana'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  return sheet;
}

/**
 * Yakunlangan va rad etilgan arizalarni arxivga ko'chirish
 * Har oyning 1-sanasida trigger orqali ishga tushiriladi
 * @returns {Object} Natija
 */
function archiveCompletedArizalar() {
  try {
    var ss = getSpreadsheet();
    var arizalarSheet = ss.getSheetByName(getSheetNames().ARIZALAR);
    var arxivSheet = ensureArxivSheet();
    
    if (!arizalarSheet || arizalarSheet.getLastRow() <= 1) {
      return successResponse({archived: 0}, 'Arxivlanadigan ariza yo\'q');
    }
    
    var cols = getArizalarColumns();
    var holatlar = getHolatlar();
    var lastRow = arizalarSheet.getLastRow();
    var data = arizalarSheet.getRange(2, 1, lastRow - 1, 15).getValues();
    var now = getNow();
    
    var rowsToArchive = [];
    var rowIndicesToDelete = [];
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var holati = row[cols.HOLATI - 1].toString();
      
      if (holati === holatlar.YAKUNLANDI || holati === holatlar.RAD_ETILDI) {
        // Arxivga qo'shish uchun ma'lumotni tayyorlash (+ arxivlangan sana)
        var arxivRow = row.slice();
        arxivRow.push(now); // 16-ustun: Arxivlangan sana
        rowsToArchive.push(arxivRow);
        rowIndicesToDelete.push(i + 2); // 1-based + header
      }
    }
    
    if (rowsToArchive.length === 0) {
      return successResponse({archived: 0}, 'Arxivlanadigan ariza yo\'q');
    }
    
    // Arxiv sheetga yozish
    var arxivLastRow = arxivSheet.getLastRow();
    arxivSheet.getRange(arxivLastRow + 1, 1, rowsToArchive.length, 16).setValues(rowsToArchive);
    
    // Arizalar sheetidan o'chirish (pastdan yuqoriga - indekslar buzilmasligi uchun)
    rowIndicesToDelete.sort(function(a, b) { return b - a; });
    for (var j = 0; j < rowIndicesToDelete.length; j++) {
      arizalarSheet.deleteRow(rowIndicesToDelete[j]);
    }
    
    // Log yozish
    writeLog('Tizim', 'Arxivlash bajarildi', '', rowsToArchive.length + ' ta ariza arxivlandi');
    
    return successResponse({archived: rowsToArchive.length}, rowsToArchive.length + ' ta ariza arxivlandi');
    
  } catch (error) {
    Logger.log('archiveCompletedArizalar xatosi: ' + error.message);
    return errorResponse('Arxivlashda xatolik', error);
  }
}

/**
 * Arxivdan arizalarni olish (Bosh muhandis hisoboti uchun)
 * @param {Object} filters - Filtrlar {muhandis, holati, sanaFrom, sanaTo, qidiruv}
 * @returns {Object} Arxiv arizalari
 */
function getArxivArizalar(filters) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(getSheetNames().ARXIV);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse([], 'Arxiv bo\'sh');
    }
    
    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
    var cols = getArizalarColumns();
    var arizalar = [];
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var muhandis = row[cols.MUHANDIS - 1].toString().trim();
      var holati = row[cols.HOLATI - 1].toString();
      var kelganSana = row[cols.KELGAN_SANA - 1];
      var arizaRaqami = row[cols.ARIZA_RAQAMI - 1].toString();
      
      // Filtrlar
      if (filters) {
        if (filters.muhandis && filters.muhandis.trim() !== '' && muhandis !== filters.muhandis.trim()) continue;
        if (filters.holati && filters.holati.trim() !== '' && holati !== filters.holati.trim()) continue;
        if (filters.sanaFrom && kelganSana instanceof Date) {
          var fromDate = parseDate(filters.sanaFrom);
          if (fromDate && kelganSana.getTime() < fromDate.getTime()) continue;
        }
        if (filters.sanaTo && kelganSana instanceof Date) {
          var toDate = parseDate(filters.sanaTo);
          if (toDate && kelganSana.getTime() > toDate.getTime()) continue;
        }
        if (filters.qidiruv && filters.qidiruv.trim() !== '') {
          var searchTerm = filters.qidiruv.trim().toLowerCase();
          if (arizaRaqami.toLowerCase().indexOf(searchTerm) === -1 && muhandis.toLowerCase().indexOf(searchTerm) === -1) continue;
        }
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
        qolganKun: row[cols.QOLGAN_ISH_KUNI - 1],
        holati: holati,
        yakunlanganSana: row[cols.YAKUNLANGAN_SANA - 1] instanceof Date ? formatDate(row[cols.YAKUNLANGAN_SANA - 1]) : '',
        radEtilganSana: row[cols.RAD_ETILGAN_SANA - 1] instanceof Date ? formatDate(row[cols.RAD_ETILGAN_SANA - 1]) : '',
        radSababi: row[cols.RAD_SABABI - 1] ? row[cols.RAD_SABABI - 1].toString() : '',
        arxivlanganSana: row[15] instanceof Date ? formatDate(row[15]) : ''
      });
    }
    
    return successResponse(arizalar, 'Arxiv arizalari');
    
  } catch (error) {
    Logger.log('getArxivArizalar xatosi: ' + error.message);
    return errorResponse('Arxiv ma\'lumotlarini olishda xatolik', error);
  }
}

/**
 * Arxiv statistikasi
 * @returns {Object} Arxivdagi arizalar soni va taqsimoti
 */
function getArxivStats() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(getSheetNames().ARXIV);
    
    var stats = {
      jami: 0,
      yakunlangan: 0,
      radEtilgan: 0
    };
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return successResponse(stats, 'Arxiv statistikasi');
    }
    
    var cols = getArizalarColumns();
    var holatlar = getHolatlar();
    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    
    for (var i = 0; i < data.length; i++) {
      var holati = data[i][cols.HOLATI - 1].toString();
      stats.jami++;
      if (holati === holatlar.YAKUNLANDI) stats.yakunlangan++;
      else if (holati === holatlar.RAD_ETILDI) stats.radEtilgan++;
    }
    
    return successResponse(stats, 'Arxiv statistikasi');
    
  } catch (error) {
    Logger.log('getArxivStats xatosi: ' + error.message);
    return errorResponse('Arxiv statistikasini olishda xatolik', error);
  }
}

/**
 * Trigger yaratish - har oyning 1-sanasida arxivlash
 * Bu funksiyani bir marta qo'lda ishga tushiring
 */
function createMonthlyArchiveTrigger() {
  // Eski triggerlarni o'chirish
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'archiveCompletedArizalar') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Yangi trigger - har oyning 1-kuni soat 02:00
  ScriptApp.newTrigger('archiveCompletedArizalar')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();
    
  Logger.log('Oylik arxivlash triggeri yaratildi');
}
