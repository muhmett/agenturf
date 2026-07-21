# 🏇 Quinté+ Simulator Pro — دليل التنصيب على Hostinger (WordPress)

سيتويب ناضي، بلا ما تخسر حتى كريدي. كولشي كود خالص (HTML/CSS/JS/PHP).

## شنو كاين فهاد الريبو

| الملف | شنو هو |
|---|---|
| `quinte-simulator.zip` | الـ plugin ناضي — هو لي غادي تنصب فـ WordPress |
| `quinte-simulator/` | الكود ديال الـ plugin (نفس المحتوى ديال الزيب) |
| `demo/index.html` | ديمو مستقل — حلو فأي متصفح باش تشوف الموقع قبل التنصيب |

## كيفاش خدام النظام (Freemium)

1. أي زائر كيدخل → كيلقا **التحليل كامل** (السيناريوهات، الـ 15 خيول، الملاحظات) مباشرة.
2. عندو الحق فـ **سيميلاسيون وحدة مجانية** (السيناريو ① غير هو المحلول).
3. ملي يحاول يعاود أو يكليكي على سيناريو مقفول 🔒 → كتطلع ليه بوابة **"Continuer avec Google"**.
4. ملي يتسجل ويدخل → **كولشي كيتحل**: سيميلاسيون بلا حدود + الـ 6 سيناريوهات.

## التنصيب خطوة بخطوة

### 1) نصّب WordPress فـ Hostinger
- hPanel → **Websites** → **Add Website** → **WordPress** (Auto Installer).
- اختار الدومين، دير user/password ديال الأدمين، وكمّل.

### 2) نصّب الـ plugin
- WordPress Admin → **Extensions (Plugins)** → **Ajouter (Add New)** → **Téléverser (Upload Plugin)**.
- اختار `quinte-simulator.zip` → **Installer** → **Activer**.

### 3) دير الصفحة الرئيسية
- **Pages → Ajouter** → سميها مثلاً "Quinté du jour".
- فالمحتوى حط غير هاد الشورطكود:

```
[quinte_simulator]
```

- **Réglages → Lecture (Settings → Reading)** → "La page d'accueil affiche" → **Une page statique** → اختار الصفحة لي درتي.
- ⚠️ من الأفضل تختار فالصفحة قالب **"Pleine largeur / Full width"** إلا كان متوفر فالثيم، باش الواجهة تاخد العرض كامل.

### 4) فعّل التسجيل بـ Google
- نصّب plugin مجاني: **Nextend Social Login** (Extensions → Add New → قلب على "Nextend Social Login").
- سير لـ [console.cloud.google.com](https://console.cloud.google.com) → دير مشروع جديد → **APIs & Services → Credentials → OAuth client ID** (نوع: Web application).
- فـ "Authorized redirect URIs" حط الرابط لي غادي يعطيك Nextend فصفحة الإعدادات ديالو (عادة `https://tondomaine.com/wp-login.php?loginSocial=google`).
- خود **Client ID** و **Client Secret** وحطهم فـ Nextend → **Google** → فعّل.
- فـ **Réglages → Général** تأكد أن ✅ "Tout le monde peut s'inscrire" (Anyone can register) مفعلة.
- دابا زر "Continuer avec Google" فالبوابة كيدي الزائر لصفحة الدخول وفيها زر Google.

### 5) بدّل الكورس كل نهار (باش تبقى à jour)
- WordPress Admin → **Réglages → Quinté Simulator**.
- كاين textarea فيها JSON ديال الكورس: بدّل `meta` (السمية، التاريخ، المسافة)، `horses` (الخيول، الجوكيات، الأوزان، الكوط، الملاحظات)، و `scenarios`.
- **Enregistrer** → الموقع كيتحدث فالحين.
- نصيحة: عطي الـ JSON القديم + برنامج الكورس الجديد لـ Claude وقول ليه يعمّر ليك JSON جديد بنفس الفورما — دقيقتين وكولشي واجد.

### 6) الإشهارات (من بعد)
- الـ plugin فيه جوج بلايص واجدين للإعلانات (فوق وتحت فيشات الخيول) عبر الفلاتر `quinte_sim_ad_top` و `quinte_sim_ad_bottom`.
- أسهل طريقة: نصّب **Ad Inserter** (مجاني) وحط كود AdSense فين بغيتي، أو زيد فـ `functions.php` ديال الثيم:

```php
add_filter( 'quinte_sim_ad_top', function () {
    return '<!-- كود AdSense هنا -->';
} );
```

## ملاحظات تقنية

- المحاولة المجانية كتسجل فـ `localStorage` ديال المتصفح (كافية كبداية؛ إلا مسح الزائر الكوكيز كيرجع ياخد محاولة — عادي فهاد النوع ديال المواقع).
- الفونطات كيتحملو من Google Fonts.
- الـ plugin خفيف: ما كيحمّل الأصول ديالو غير فالصفحة لي فيها الشورطكود.
- عيب الديمو `demo/index.html` فالمتصفح باش تشوف تجربة الزائر (البوابة كتطلع من بعد أول سيميلاسيون).
