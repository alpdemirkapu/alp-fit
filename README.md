# ALP FIT v1.0 · Ücretsiz iPhone antrenman + beslenme uygulaması

Statik, dış servise bağlanmayan, tamamen ücretsiz **PWA**. Kodda reklam, analitik, sunucu veya üçüncü taraf kütüphane yok.

## Özellikler

- 3 düzenlenebilir antrenman günü; gün adı/odak alanı
- Hareket oluşturma, set/tekrar ve başlangıç ağırlığı, dinlenme süresi
- Gerçek set/ağırlık/tekrar kaydı; antrenman tamamlama; geçmiş
- Dinlenme sayacı (ekran açık olduğu sürece)
- Tarih bazlı beslenme kaydı, kalori/protein/karbonhidrat/yağ toplamları
- Hazır 50 g yulaf + 50 g Nesquik gevrek + 200 ml az yağlı süt öğünü
- Yumurta beyazı ve diğer besinler; özelleştirilebilir yeni besin
- Kilo grafiği ve 14 günlük kalori grafiği
- Günlük hedefleri kullanıcı girer (başlangıçta boş)
- Tema rengi seçimi, JSON yedekleme ve geri yükleme
- Service worker ile ziyaret edildikten sonra çevrimdışı açılabilme

**Önemli:** Önceki antrenman programının tüm hareket/set listesi aktarılmadı; günler özellikle boş bırakıldı. Besin değerleri yaklaşık, ürün etiketlerini kontrol ediniz.

## Ücretsiz GitHub Pages kurulumu

1. [github.com](https://github.com/) üzerinde ücretsiz hesap aç / giriş yap.
2. `alp-fit` adlı **Public** repository oluştur. GitHub Free'de Pages kullanmak için repo public olmalı.
3. Bu ZIP içindeki **bütün dosya ve klasörleri** (ZIP'in iç klasörünü değil; doğrudan `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, `icons/`) repository köküne yükle.
4. Repository > **Settings > Pages**: Source `Deploy from a branch`, Branch `main`, Folder `/(root)`, **Save**.
5. Yayın adresin genelde `https://KULLANICI_ADIN.github.io/alp-fit/` olur. GitHub'ın *Visit site* düğmesinden kesin adresi gör.
6. iPhone Safari'de adresi aç. **Paylaş > Ana Ekrana Ekle > Web Uygulaması Olarak Aç > Ekle** yolunu izle.
7. Bir kez çevrimiçi açtıktan sonra, uygulama dosyaları önbelleğe alındığında çevrimdışı çalışabilir.

## Bilgisayarda ön izleme

Klasörde terminalden:

```bash
python -m http.server 8080
```

Sonra `http://localhost:8080/` adresini aç. Sadece `index.html` dosyasına çift tıklarsan sayfa kısmen çalışabilir ama Service Worker / offline mod çalışmaz.

## Gizlilik ve yedekleme

- Uygulama verileri **yalnızca telefonundaki** tarayıcı/ana ekran web uygulamasının yerel depolamasında bulunur. Bulut senkronizasyonu veya kullanıcı hesabı yoktur.
- GitHub'da herkese açık olan kısım uygulama *kodu*dur; kişisel kayıtlar GitHub'a aktarılmaz. Asla JSON yedeğini veya özel kişisel bilgileri public repository'ye yükleme.
- iPhone'da Safari site verilerini silmek, web uygulamasını kaldırmak veya depolama temizliği kayıtları silebilir. **Ayarlar > Yedek indir** işlevini düzenli kullan. Yedek dosyasını özel, güvenli bir yere sakla.
- PWA verilerinin Safari sekmesi ve ana ekran uygulamasında her iOS sürümünde aynı depolama alanını paylaşacağı varsayılmamalıdır. Kayıtları öncelikle ana ekrana eklediğin uygulamada yap.
- Uygulama internet üzerinden HTTPS ile açılmalıdır; GitHub Pages bunu sağlar.

## Güncelleme

Yeni sürümü GitHub'daki aynı dosyaların üzerine yükleyip yayımlayabilirsin. Veriler aynı site adresi ve depolama alanı kaldığı sürece korunacak şekilde tasarlandı; yine de **güncellemeden önce yedek al.**

## Lisans

Kişisel kullanım için serbest. Buradaki kaynak dosyaları dilediğin gibi düzenleyebilirsin.
