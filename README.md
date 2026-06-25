# Davlat kadastrlari palatasi — Arizalar nazorati tizimi

Google Apps Script Web App yordamida yaratilgan zamonaviy ichki axborot tizimi.
Kadastr arizalarini kiritish, muddatlarni ish kunlari bo'yicha nazorat qilish,
muhandislar samaradorligini kuzatish va hisobotlar tayyorlash uchun mo'ljallangan.

Google Sheets faqat ma'lumotlar bazasi sifatida ishlatiladi — foydalanuvchilar
bevosita jadvallar bilan ishlamaydi, barcha amallar zamonaviy dashboard orqali bajariladi.

---

## Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Backend | Google Apps Script (ES5/ES6) |
| Frontend | HTML5, Bootstrap 5, CSS3, JavaScript |
| Diagrammalar | Google Charts |
| JPG eksport | html2canvas |
| Ma'lumotlar bazasi | Google Sheets |

---

## Loyiha tuzilishi

### Backend (.gs fayllar)

| Fayl | Vazifasi |
|------|----------|
| `Code.gs` | Asosiy entry point (`doGet`), sahifa routing, `getWebAppUrl`, barcha API endpointlar |
| `Config.gs` | Konfiguratsiya: sheet nomlari, ustun indekslari, muddatlar, ranglar, holatlar |
| `Utils.gs` | Yordamchi funksiyalar: sana formatlash, validatsiya, ID generatsiya, javob obyektlari |
| `WorkingDays.gs` | Ish kunlari hisoblash (shanba/yakshanba/bayramsiz), muddat hisoblash, keshlash |
| `Engineer.gs` | Muhandis operatsiyalari: ariza kiritish, yakunlash, rad etish, statistika |
| `Chief.gs` | Bosh muhandis: umumiy statistika, muhandislar jadvali, oylik hisobot, filtrlar, diagrammalar |
| `Report.gs` | Batafsil hisobotlar, muhandis samaradorligi, muddati o'tgan arizalar |
| `Archive.gs` | Oylik arxivlash (yakunlangan/rad etilgan arizalar), arxiv hisoboti, trigger |
| `Log.gs` | Barcha amallar jurnali (kim, qachon, nima qildi) |

### Frontend (.html fayllar)

| Fayl | Vazifasi |
|------|----------|
| `index.html` | Asosiy sahifa — muhandis tanlash va ariza kiritish formasi |
| `engineer.html` | Muhandis dashboard — statistika kartochkalari va arizalar jadvali |
| `chief.html` | Bosh muhandis — to'liq monitoring, hisobotlar, diagrammalar, arxiv (mustaqil sahifa) |
| `style.html` | CSS stillari (Bootstrap 5 ustiga, animatsiyalar, ranglar, satr ajratish) |
| `script.html` | JavaScript modullari: `App`, `API`, `Loading`, `Toast`, `UI`, `EngineerPage`, `ChiefPage` |

> Eslatma: `chief.html` mustaqil (self-contained) — `include('script')` ishlatmaydi,
> chunki Google Charts loader `google.script.run` bilan to'qnashishi mumkin.

---

## Google Sheets tuzilishi

Quyidagi sheetlar bo'lishi kerak (Arxiv avtomatik yaratiladi):

| Sheet | Tavsif |
|-------|--------|
| **Arizalar** | Barcha faol arizalar (15 ustun) |
| **Xodimlar** | ID va F.I.Sh (2 ustun) |
| **Sozlamalar** | Muddatlar (Obyekt turi, Xizmat turi, Muddat) |
| **Bayram kunlari** | Bayram sanalari (A ustun, Date formatida) |
| **Log** | Amallar jurnali |
| **Statistika** | Kunlik statistika (ixtiyoriy) |
| **Dashboard** | Umumiy statistika (ixtiyoriy) |
| **Arxiv** | Arxivlangan arizalar (16 ustun) — avtomatik yaratiladi |

### Arizalar sheet ustunlari (tartibida)

`ID | Muhandis | Ariza raqami | Kelgan sana | Obyekt turi | Xizmat turi | Muddat | Tugash sanasi | Qolgan ish kuni | Holati | Yakunlangan sana | Rad etilgan sana | Rad sababi | Kiritilgan vaqt | Oxirgi tahrir`

### Xodimlar sheet

Faqat ikkita ustun: `ID | F.I.Sh`. Lavozim yoki faol ustuni saqlanmaydi.

### Sozlamalar sheet formati

| Obyekt turi | Xizmat turi | Muddat (ish kuni) |
|-------------|-------------|-------------------|
| Noturar | Tolovli | 10 |
| Noturar | Bepul | 5 |
| Turar | Tolovli | 8 |
| Turar | Bepul | 5 |

> Muddatlar kod ichiga yozilmagan — faqat shu sheetdan o'qiladi.

### Bayram kunlari sheet

A ustuniga bayram sanalarini **Date** formatida kiriting (1-qator sarlavha, sanalar 2-qatordan).
Bo'sh bo'lsa, faqat shanba/yakshanba hisobga olinadi.

---

## Asosiy xususiyatlar

### Muhandis paneli
- Sahifa ochilganda faqat muhandis tanlash dropdowni ko'rinadi
- Muhandis tanlangach forma va dashboard animatsiya bilan ochiladi
- Ariza kiritish: ariza raqami, kelgan sana ("Bugun" checkbox bilan), obyekt turi, xizmat turi
- Ariza raqami takrorlanishini real vaqtda tekshirish
- Arizani yakunlash va rad etish (sabab bilan, modal oyna orqali)

### Bosh muhandis hisoboti
- **Umumiy statistika** kartochkalari (Jami, Jarayonda, Yakunlangan, Rad etilgan, Bugun tugaydi, 1/2/3/4+ kun, Muddati o'tgan)
- **Muhandislar bo'yicha** jadval: Bugun muddati, Muddati o'tgan, Jarayonda, Yakunlangan, Rad etilgan, Jami
- Jadvalni **JPG ko'rinishida yuklab olish** (chiroyli sarlavha va sana bilan)
- **Oylik hisobot** (oy/yil tanlash, bajarilish foizi)
- **Filtrlar**: muhandis, holat, sana oralig'i, qidiruv
- **Diagrammalar** (Google Charts): Pie (muddat), Column (muhandislar), Line (oylik)
- **Arxiv bo'limi**: arxivlangan arizalar jadvali, filtrlar, statistika, qo'lda arxivlash tugmasi

### Ish kunlari hisobi
- Muddat **faqat ish kunlari** bo'yicha hisoblanadi
- Shanba, yakshanba va bayram kunlari hisobga olinmaydi
- "Qolgan kun" real vaqtda qayta hisoblanadi

### Arxivlash
- Har oyning 1-sanasida yakunlangan va rad etilgan arizalar avtomatik **Arxiv** sheetga ko'chiriladi
- Arizalar ro'yxatidan o'chiriladi, statistika yangilanadi
- Bosh muhandis hisobotida arxiv alohida bo'limda saqlanadi
- `createMonthlyArchiveTrigger()` orqali avtomatik oylik trigger o'rnatiladi

### Ranglar va vizual ajratish
| Holat | Rang |
|-------|------|
| 4+ kun qolgan | Yashil |
| 3 kun qolgan | Ko'k |
| 2 kun qolgan | Sariq |
| 1 kun qolgan | To'q sariq (satr foni och sariq) |
| Bugun tugaydi (0 kun) | Qizil "Muddati bugun" (satr foni och qizil) |
| Muddati o'tgan | To'q qizil |
| Yakunlangan | Yashil |
| Rad etilgan | Kulrang |

### Boshqa
- Responsive dizayn (mobil qurilmalarga moslangan)
- AJAX orqali real vaqt yangilanish (sahifa qayta yuklanmaydi)
- Toast xabarnomalari va Loading animatsiyalari
- Bootstrap modal oynalar
- Bayram kunlari keshi (sheet bir ijroda faqat 1 marta o'qiladi — tezkor)

---

## O'rnatish

1. Google Sheets yarating va yuqoridagi sheetlarni qo'shing (Arizalar, Xodimlar, Sozlamalar, Bayram kunlari, Log)
2. **Sozlamalar** sheetiga muddatlarni kiriting
3. **Xodimlar** sheetiga muhandislarni kiriting (ID, F.I.Sh)
4. **Bayram kunlari** sheetiga bayram sanalarini kiriting (ixtiyoriy)
5. `Extensions → Apps Script` oching
6. Barcha `.gs` fayllarni script editorga nusxalang
7. Barcha `.html` fayllarni qo'shing (nomi `.html` siz: `index`, `engineer`, `chief`, `style`, `script`)
8. `Deploy → New deployment → Web app`
   - Execute as: **Me**
   - Who has access: **Anyone within organization** (yoki kerakli ruxsat)
9. (Ixtiyoriy) `createMonthlyArchiveTrigger()` funksiyasini **bir marta** qo'lda ishga tushiring — oylik avtomatik arxivlash uchun

> **Muhim:** Web app'ga faqat haqiqiy `/exec` URL orqali kiring
> (`script.google.com/macros/s/.../exec`), `googleusercontent.com` sandbox URL orqali emas.
> Sahifalar orasidagi o'tish tugmalari haqiqiy URL'ni server'dan oladi (`getWebAppUrl`).

---

## Holatlar

Ariza uch holatda bo'lishi mumkin:
- **Jarayonda** — yangi kiritilgan, ko'rib chiqilmoqda
- **Yakunlandi** — ijobiy yakunlangan
- **Rad etildi** — rad etilgan (sabab bilan)

---

## Texnik eslatmalar

- Kod modul ko'rinishida yozilgan, har bir funksiya izohlangan
- Barcha operatsiyalar `try/catch` bilan himoyalangan
- Backend JSON formatida `{success, data, message}` qaytaradi
- Kod boshqa tumanlar uchun qayta foydalanishga mo'ljallangan (sheet ID avtomatik olinadi)
