/**
 * Code.gs - Asosiy modul va API yo'naltiruvchi
 * Davlat kadastrlari palatasi - Arizalar nazorati tizimi
 * 
 * doGet - Web App bosh sahifasi
 * include - HTML fayllarni qo'shish
 * API endpoints - Frontend dan AJAX so'rovlar uchun
 */

/**
 * Web App bosh sahifasi
 * @param {Object} e - Request parametrlari
 * @returns {HtmlOutput} HTML sahifa
 */
function doGet(e) {
  try {
    const page = e && e.parameter && e.parameter.page ? e.parameter.page : 'index';
    const config = getSystemConfig();
    
    let template;
    
    switch (page) {
      case 'engineer':
        template = HtmlService.createTemplateFromFile('engineer');
        break;
      case 'chief':
        template = HtmlService.createTemplateFromFile('chief');
        break;
      default:
        template = HtmlService.createTemplateFromFile('index');
    }
    
    const htmlOutput = template.evaluate();
    htmlOutput.setTitle(config.APP_NAME + ' - ' + config.APP_SUBTITLE);
    htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');
    
    return htmlOutput;
    
  } catch (error) {
    Logger.log('doGet xatosi: ' + error.message);
    return HtmlService.createHtmlOutput('<h2>Xatolik yuz berdi</h2><p>' + error.message + '</p>');
  }
}

/**
 * HTML faylni qo'shish (include pattern)
 * @param {string} filename - Fayl nomi
 * @returns {string} HTML content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


// ============================================================
// API ENDPOINTS - Frontend AJAX so'rovlari uchun
// Barcha funksiyalar JSON formatida javob qaytaradi
// ============================================================

/**
 * Xodimlar ro'yxatini olish
 * @returns {string} JSON response
 */
function apiGetXodimlar() {
  return JSON.stringify(getXodimlarList());
}

/**
 * Ariza kiritish
 * @param {Object} formData - Forma ma'lumotlari
 * @returns {string} JSON response
 */
function apiSubmitAriza(formData) {
  return JSON.stringify(submitAriza(formData));
}

/**
 * Ariza raqamini tekshirish
 * @param {string} arizaRaqami - Ariza raqami
 * @returns {string} JSON response
 */
function apiCheckArizaRaqami(arizaRaqami) {
  return JSON.stringify(checkArizaRaqami(arizaRaqami));
}

/**
 * Muhandis arizalarini olish
 * @param {string} muhandis - Muhandis ismi
 * @returns {string} JSON response
 */
function apiGetEngineerArizalar(muhandis) {
  return JSON.stringify(getEngineerArizalar(muhandis));
}

/**
 * Muhandis statistikasini olish
 * @param {string} muhandis - Muhandis ismi
 * @returns {string} JSON response
 */
function apiGetEngineerStats(muhandis) {
  return JSON.stringify(getEngineerStats(muhandis));
}

/**
 * Arizani yakunlash
 * @param {number} arizaId - Ariza ID
 * @param {string} muhandis - Muhandis ismi
 * @returns {string} JSON response
 */
function apiYakunlash(arizaId, muhandis) {
  return JSON.stringify(yakunlashAriza(arizaId, muhandis));
}

/**
 * Arizani rad etish
 * @param {number} arizaId - Ariza ID
 * @param {string} muhandis - Muhandis ismi
 * @param {string} sabab - Rad sababi
 * @returns {string} JSON response
 */
function apiRadEtish(arizaId, muhandis, sabab) {
  return JSON.stringify(radEtishAriza(arizaId, muhandis, sabab));
}

/**
 * Bosh muhandis statistikasini olish
 * @returns {string} JSON response
 */
function apiGetChiefStats() {
  return JSON.stringify(getChiefStats());
}

/**
 * Muhandislar umumiy jadvali
 * @returns {string} JSON response
 */
function apiGetEngineersSummary() {
  return JSON.stringify(getEngineersSummary());
}

/**
 * Oylik hisobot
 * @param {number} year - Yil
 * @param {number} month - Oy
 * @returns {string} JSON response
 */
function apiGetMonthlyReport(year, month) {
  return JSON.stringify(getMonthlyReport(year, month));
}

/**
 * Barcha arizalar (filtrlar bilan)
 * @param {Object} filters - Filtrlar
 * @returns {string} JSON response
 */
function apiGetAllArizalar(filters) {
  return JSON.stringify(getAllArizalar(filters));
}

/**
 * Diagrammalar uchun ma'lumotlar
 * @returns {string} JSON response
 */
function apiGetChartsData() {
  return JSON.stringify(getChartsData());
}

/**
 * Batafsil hisobot
 * @param {string} sanaFrom - Boshlanish
 * @param {string} sanaTo - Tugash
 * @returns {string} JSON response
 */
function apiGetDetailedReport(sanaFrom, sanaTo) {
  return JSON.stringify(getDetailedReport(sanaFrom, sanaTo));
}

/**
 * Log yozuvlari
 * @param {number} limit - Limit
 * @returns {string} JSON response
 */
function apiGetLog(limit) {
  return JSON.stringify(getLogEntries(limit));
}

/**
 * Muddati o'tgan arizalar
 * @returns {string} JSON response
 */
function apiGetOverdueArizalar() {
  return JSON.stringify(getOverdueArizalar());
}

/**
 * Konfiguratsiya ma'lumotlarini frontend ga uzatish
 * @returns {string} JSON response
 */
function apiGetConfig() {
  return JSON.stringify(successResponse({
    appName: getSystemConfig().APP_NAME,
    appSubtitle: getSystemConfig().APP_SUBTITLE,
    version: getSystemConfig().VERSION,
    ranglar: getRanglar(),
    holatlar: getHolatlar(),
    obyektTurlari: getObyektTurlari(),
    xizmatTurlari: getXizmatTurlari()
  }, 'Konfiguratsiya'));
}
