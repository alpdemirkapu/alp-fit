# ALP FIT v1.1 · iPhone 16 Pro Max uyumlu sürüm

## Neler değişti?

- iPhone 16 Pro Max için Dynamic Island / üst durum çubuğu / alt gezinme güvenli alanları ayarlandı.
- 3 yerine 5 düzenlenebilir antrenman günü var. Gün 1–3, kaydedilmiş hareketler ve geçmiş aynı kalır. Gün 4 ve 5 boş şablon olarak eklenir.
- Kalori ve protein her gün için iki ayrı hedef kartında gösterilir. Öğün başlıklarında kalori **ve protein** alt toplamı vardır; besin satırlarında protein zaten gösteriliyordu.
- **Ayarlar → Vücut analizim**: boy (cm), kilo (kg), yaş, hesaplamada kullanılan cinsiyet, aktivite seviyesi, hedef (yağ kaybı/koruma/kas kazanımı).
- Form kaydedilince **VKİ**, **dinlenme enerji ihtiyacı (Mifflin–St Jeor)**, **tahmini günlük enerji ihtiyacı**, **hedef kalori ve protein** gösterilir.
- **Önerilen hedefleri beslenmeye uygula** düğmesiyle rakamlar onay sonrası beslenme hedeflerine aktarılır. Kilo kaydında değişiklik olursa hesaplamanın yenilenmesi gerektiği belirtilir.
- JSON yedek/geri yükleme önceki sürüm ile uyumludur. Veri anahtarı `alpfit-app-data-v1` ve yedek sürümü `1` değişmedi.

## Hesaplama varsayımları

- Mifflin–St Jeor (yetişkinler): **erkek** = `10×kg + 6.25×cm − 5×yaş + 5`, **kadın** = `10×kg + 6.25×cm − 5×yaş − 161`.
- Aktivite katsayısı: düşük `1.2`; hafif `1.375`; orta `1.55`; yüksek `1.725`.
- Enerji hedefi: yağ kaybında tahmini ihtiyacın `%85`i, korumada `%100`ü, kazanımda `%108`i. Kalori en yakın 10 kcal'a yuvarlanır.
- Protein: yağ kaybında `2.0 g/kg`, korumada `1.6 g/kg`, kas kazanımında `1.8 g/kg`. En yakın 5 grama yuvarlanır.
- İlk alanlarda **173 cm, 78 kg, 31 yaş** önceki kişisel bilgilerden örnek olarak yazılıdır; **değiştirilebilir**. Profil kaydedilmeden günlük hedefler kendiliğinden değişmez.
- Tahmini değerlerdir; egzersiz yoğunluğu, vücut yağ oranı ve günlük hareketlilik sonucu değiştirir. VKİ kas kütlesini ayırmaz. Tıbbi tavsiye değildir.

Kaynaklar: Mifflin MD ve ark., *American Journal of Clinical Nutrition* 1990, doi:10.1093/ajcn/51.2.241; Jäger ve ark., *J Int Soc Sports Nutr* 2017, doi:10.1186/s12970-017-0177-8.

## Mevcut GitHub deposunu güncelleme (ikonları yeniden yüklemeye gerek yok)

1. **ÖNCE** iPhone'daki ALP FIT → **Ayarlar → Yedek indir** ile özel JSON yedek al. Yedeği herkese açık GitHub deposuna yükleme.
2. `alp-fit` depo sayfanda **Add file → Upload files** seç. ZIP'ten çıkardığın şu **beş** dosyayı repo **kök dizinine** yükle: `index.html`, `styles.css`, `app.js`, `sw.js`, `README.md`.
3. **Commit changes** ile onayla. `icons/`, `.nojekyll`, `manifest.webmanifest` dosyaları değişmedi; bunlara dokunma.
4. GitHub'da **Actions** veya **Settings → Pages** ekranından yayın işlemini kontrol et.
5. iPhone'da ALP FIT'i **silmeden**, tamamen kapatıp tekrar aç. Gerekirse Pages adresini Safari'de bir kez açıp yeni dosyaların gelmesine izin ver, sonra ana ekran uygulamasını aç.
6. **Ayarlar → Hakkında** bölümünde **ALP FIT v1.1** yazısını gör; birinci üç antrenman, beslenme ve kilo kayıtlarını kontrol et.
7. **Ayarlar → Vücut analizim** bölümünden ölçülerini/hareket düzeyini kontrol et, **Hesapla** ve istersen **Hedefleri beslenmeye uygula**.

> Uygulamayı iPhone'dan silme, site verilerini temizleme. Yerel depolama Safari sekmesiyle ana ekran PWA'sı arasında farklı olabilir. JSON yedeğini kişisel ve güvenli bir yerde tut.

## Sıfırdan kurulum

Public GitHub deposunda tüm dosyalar kökte olmalı. **Settings → Pages → Deploy from a branch → main → /(root) → Save**; ardından `https://KULLANICIADIN.github.io/alp-fit/` adresini iPhone Safari'den aç, **Paylaş → Ana Ekrana Ekle**.

Servis çalışanı yeni sürümde `alp-fit-shell-v1.1-20261116` önbelleğini kullanır. İnternetsiz kullanım önce çevrimiçi yükleme gerektirir.
