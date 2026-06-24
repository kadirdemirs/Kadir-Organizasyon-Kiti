# API Entegrasyon Notlari

Bu prototip su an tamamen yerelde calisir. Gercek servisleri baglamak icin asagidaki parcalar eklenebilir.

## YouTube Yorum Analizi

Gerekli:

- YouTube Data API key
- Video ID ayrıştırma
- `commentThreads.list` ile yorum cekme

Baglanacak yer:

- `app.js` icinde `runCommentAnalysis()`
- `commentsInput` alanina elle yorum koymak yerine API'den gelen yorumlar `analyzeComments()` fonksiyonuna verilir.

## Gemini / OpenAI Asistan

Gerekli:

- Model API key
- Guvenli backend endpoint

Baglanacak yer:

- `answerAssistant(question)`
- Su an yerel kurallarla cevap veriyor. Gercek model icin soru, prodüksiyonlar, butce ve gorev datasi modele context olarak gonderilir.

## Gorsel Uretimi

Gerekli:

- Secilen gorsel modelinin API keyi
- Referans gorselleri icin dosya yukleme
- Uretim sonucunda image URL veya base64 donusu

Baglanacak yer:

- `imageForm` submit handler
- Su an `makeThumb()` demo gorsel uretir. Gercek entegrasyonda bu fonksiyon yerine API sonucu galeriye eklenir.

## Video Uretimi

Gerekli:

- Video model API keyi
- Job baslatma ve job durumunu periyodik kontrol etme
- Video dosya URL'sini gecmise kaydetme

Baglanacak yer:

- `videoForm` submit handler
- `continueVideo` ve `enhanceVideoPrompt` akisi korunabilir.

## Veritabani

Basit secenekler:

- Supabase: ekip, prodüksiyon, gorev, harcama ve envanter tabloları
- Firebase: hizli auth + dokuman tabanli veri

Su an:

- Veriler `localStorage` icinde tutulur.
- Kalici ekip kullanimi icin `saveState()` ve `loadState()` backend'e baglanir.

