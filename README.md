# Davlat kadastrlari palatasi - Arizalar nazorati tizimi

Google Apps Script Web App yordamida yaratilgan zamonaviy ichki axborot tizimi.

## Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Backend | Google Apps Script |
| Frontend | HTML5, Bootstrap 5, CSS3, JavaScript ES6 |
| Charts | Google Charts |
| Database | Google Sheets |

## Loyiha tuzilishi

### Backend (.gs fayllar)

| Fayl | Vazifasi |
|------|----------|
| `Code.gs` | Asosiy entry point, doGet, routing, API endpoints |
| `Config.gs` | Konfiguratsiya, sheet nomlari, ustunlar, muddatlar |
| `Utils.gs` | Yordamchi funksiyalar (sana formatlash, validatsiya, ID) |
| `WorkingDays.gs` | Ish kunlari hisoblash (bayram/dam olish kunlarsiz) |
| `Engineer.gs` | Muhandis CRUD operatsiyalari |
| `Chief.gs` | Bosh muhandis statistika va hisobotlari |
| `Report.gs` | Batafsil hisobotlar, samaradorlik tahlili |
| `Log.gs` | Barcha amallar jurnali |

### Frontend (.html fayllar)

| Fayl | Vazifasi |
|------|----------|
| `index.html` | Asosiy sahifa - muhandis tanlash va ariza kiritish |
| `engineer.html` | Muhandis dashboard - statistika va arizalar jadvali |
| `chief.html` | Bosh muhandis - umumiy monitoring, hisobotlar, diagrammalar |
| `style.html` | CSS stillari (Bootstrap 5 overrides, animatsiyalar) |
| `script.html` | JavaScript modullari (API, UI, Loading, Toast) |

## Google Sheets tuzilishi

Quyidagi sheetlar yaratilishi kerak:

1. **Dashboard** - Umumiy statistika
2. **Arizalar** - Barcha arizalar (15 ustun)
3. **Xodimlar** - ID va F.I.Sh (2 ustun)
4. **Sozlamalar** - Muddatlar (Obyekt turi, Xizmat turi, Muddat)
5. **Bayram kunlari** - Bayram sanalari
6. **Log** - Amallar jurnali
7. **Statistika** - Kunlik statistika

## O'rnatish

1. Google Sheets yarating va yuqoridagi sheetlarni qo'shing
2. Extensions > Apps Script oching
3. Barcha .gs fayllarni script editorga nusxalang
4. Barcha .html fayllarni qo'shing
5. Deploy > New deployment > Web app
6. Execute as: Me, Who has access: Anyone within organization

## Sozlamalar sheet formati

| Obyekt turi | Xizmat turi | Muddat (ish kuni) |
|-------------|-------------|-------------------|
| Noturar | Tolovli | 10 |
| Noturar | Bepul | 5 |
| Turar | Tolovli | 8 |
| Turar | Bepul | 5 |

## Xususiyatlar

- Responsive dizayn (mobil qurilmalar uchun moslangan)
- Real vaqt statistika kartochkalari
- Ish kunlari hisobida bayram/dam olish kunlari istisno
- Ariza raqami takrorlanishini tekshirish
- Toast xabarnomalari
- Loading animatsiyalari
- Google Charts diagrammalari (Pie, Column, Line)
- Oylik hisobotlar va bajarilish foizi
- Filtrlar (muhandis, holat, oy, sana oralig'i, qidiruv)
- Amallar jurnali (log)
