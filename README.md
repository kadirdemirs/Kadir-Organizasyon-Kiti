# Kade Organizasyon Kiti

Bu klasor, paylastigin videodaki araclarin tek bir yerel web uygulamasi olarak olusturulmus halidir.

## Acma

`BASLAT.bat` dosyasina cift tikla. Bu dosya uygulamayi `http://127.0.0.1:4173` uzerinden acar; boylece dosya yukleme, yerel kayit ve indirme akislari tarayicida daha guvenilir calisir.

Node.js bulunamazsa `BASLAT.bat` otomatik olarak `index.html` dosyasini dogrudan acar.

Ana dosya:

- `index.html`

Destek dosyalari:

- `styles.css`
- `app.js`
- `server.js`
- `VIDEO_OZETI.md`
- `API_ENTEGRASYON_NOTLARI.md`
- `BASLAT.bat`

## Moduller

- Yorum Analizi
- Video ve transkript ice aktarma
- Prodüksiyon CRM
- Banana Studio
- Vibe Coding Rehberi
- AI Kaynak Radari

## Notlar

Bu surum yerelde calisan bir prototiptir. YouTube yorumlarini otomatik cekmek, gercek gorsel/video uretmek veya Gemini/OpenAI gibi modellerden canli cevap almak icin ilgili API anahtarlarini eklemek gerekir.

Yerel veriler tarayicinin `localStorage` alaninda tutulur. Uygulamadaki degisiklikler ayni tarayicida kalir.
