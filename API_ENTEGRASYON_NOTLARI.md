# API Entegrasyon Notlari

Gercek servisler ARTIK BAGLI. Anahtar eklersen calisir, eklemezsen demo modunda
calismaya devam eder (hicbir sey bozulmaz). Anahtarlar sadece `server.js` uzerinden
kullanilir, tarayiciya sizmaz.

## Kurulum (3 adim)

1. `kade.config.example.json` dosyasini kopyalayip adini `kade.config.json` yap.
2. Icine anahtarlarini yapistir (asagida nereden alinacagi yaziyor).
3. `BASLAT.bat` ile uygulamayi tekrar baslat. Acilis ekraninda hangi API'lerin
   "acik" oldugunu gorursun.

`kade.config.json` gitignore'ludur, kimseyle paylasilmaz / commit'lenmez.

## Anahtarlar nereden alinir

- **Gemini (asistan + gorsel):** https://aistudio.google.com/apikey
  Tek tikla, bedava katmani var. `geminiKey` alanina yapistir.
- **YouTube (yorum cekme):** https://console.cloud.google.com
  -> "YouTube Data API v3" etkinlestir -> Credentials -> API Key. Ucretsiz kota.
  `youtubeKey` alanina yapistir.
- **OpenAI (alternatif):** https://platform.openai.com/api-keys
  Sadece `provider: "openai"` kullanacaksan gerekir (kredi karti ister).

## Hangi modul nereye bagli

| Modul | Sunucu ucu | Saglayici |
|---|---|---|
| AI Asistan | `POST /api/assistant` | Gemini (varsayilan) / OpenAI |
| YouTube Yorum Analizi | `GET /api/youtube/comments` | YouTube Data API v3 |
| Gorsel Uretimi (Banana) | `POST /api/image` | Gemini Imagen / OpenAI gpt-image-1 |

- Asistan: ekip verisi (butce, produksiyon, gorev, envanter, fikir) modele context
  olarak gonderilir; cevap `assistantAnswer` alaninda gosterilir.
- Yorumlar: video linki verince "YouTube'dan yorumlari cek" butonu yorumlari ceker,
  `commentsInput` alanini doldurur ve mevcut analiz motoruna verir.
- Gorsel: `imageForm` gonderiminde gercek model cagrilir; donus base64 gorsel
  galeriye eklenir. Anahtar yoksa demo SVG (`makeThumb`) uretilir.

## Notlar

- Gemini Imagen gorsel uretimi icin Google tarafinda faturalandirma gerekebilir;
  asistan ve YouTube yorumlari bedava katmanda calisir.
- Video uretimi henuz baglanmadi (pahali + bekleme listeli API'ler). `videoForm`
  hala demo uretir; ileride `POST /api/video` eklenebilir.

## Veritabani (gelecek)

Su an veriler tarayicinin `localStorage` alaninda tutulur. Kalici / cok cihazli
kullanim icin `saveState()` ve `loadState()` bir backend'e (Supabase / Firebase)
baglanabilir.
