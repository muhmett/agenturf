# 🏇 AgenTurf — دليل التنصيب على Hostinger (WordPress)

## الطريقة الموصى بها: **الثيم** `agenturf-theme.zip` ⭐

الثيم كيدير كولشي بوحدو — **ما تحتاج لا صفحة لا شورطكود لا إعدادات**:

- أي زائر كيدخل للموقع → كيلقا **البوابة**: فيديو خيول كيجريو (Pexels، مجاني) بأنيماسيون سكرول (الفيديو كيتزوم ويتظلم مع النزول، العنوان كيطلع بارالاكس)، بطاقات الأدوات، عدادات متحركة، 3 خطوات، وزر **Continuer avec Google**
- ملي يتسجل ويدخل → كيلقا **السيميلاتور كامل**: السيناريوهات، الكورس المتحركة (كونط أ روبور، photo-finish، كونفيتي)، الترتيب المباشر، التعليق، وفيشات الخيول
- **كل صباح**: منيو **"Quinté du jour"** فلوحة الإدارة → تحط **ملف JSON** ديال كورس الجديد → Enregistrer → الموقع كيتبدل فالحين. **حتى سطر كود ما كيتقاس.**

### التنصيب (5 دقائق)

1. **WordPress فـ Hostinger**: hPanel → Websites → Add Website → WordPress (Auto Installer).
2. **الثيم**: WP Admin → **Apparence → Thèmes → Ajouter → Téléverser un thème** → `agenturf-theme.zip` → Installer → **Activer**. سالات — الصفحة الرئيسية خدامة دغيا.
3. **التسجيل بـ Google**:
   - Extensions → Ajouter → نصّب **Nextend Social Login** (مجاني) → Activer.
   - **Réglages → Général** → فعّل ✅ "Tout le monde peut s'inscrire" (وحط "Rôle par défaut" = Abonné).
   - سير لـ [console.cloud.google.com](https://console.cloud.google.com) → مشروع جديد → APIs & Services → Credentials → **OAuth client ID** (Web application) → خود Client ID + Secret وحطهم فإعدادات Nextend → Google. الـ redirect URI كيعطيهولك Nextend نفسو (عادة `https://tondomaine.com/wp-login.php?loginSocial=google`).
   - دابا زر "Continuer avec Google" كيدير الدخول بضغطة وحدة.

### الاستعمال اليومي

- **Quinté du jour** (فالمنيو الرئيسي ديال الإدارة، بأيقونة 🏆):
  - **الخيار 1**: téléverse ملف `.json` ديال الكورس (نفس الفورما ديال `agenturf-theme/data/default-race.json`: `meta` + `horses` + `scenarios`)
  - **الخيار 2**: لصق الـ JSON فالـ textarea
  - تقدر تبدل حتى **الفيديو ديال الصفحة الرئيسية** (URL ديال mp4 — من Pexels ولا فيديو ديالك من Médias)
- نصيحة: عطي JSON القديم + برنامج كورس الغد لأي IA وقول ليها "نفس الفورما" — دقيقتين وواجد.

### الإشهارات (من بعد)

نصّب **Ad Inserter** (مجاني) وحط كود AdSense فين بغيتي (قبل الفوتر، بين السيكسيون...) — الثيم عادي متوافق معاه.

---

## البديل: الـ **plugin** `quinte-simulator.zip`

إلا بغيتي تخدم بثيم آخر وتحط السيميلاتور فوسط صفحة، كاين الـ plugin القديم بالشورطكود `[quinte_simulator]` (فيه نظام محاولة وحدة مجانية قبل التسجيل). التفاصيل فالتاريخ ديال الريبو.

---

## ملفات الريبو

| الملف | شنو هو |
|---|---|
| `agenturf-theme.zip` | ⭐ الثيم — نصّبو وصافي |
| `agenturf-theme/` | كود الثيم |
| `agenturf-theme/data/default-race.json` | نموذج ملف الكورس اليومي |
| `demo/index.html` | ديمو مستقل: البوابة + زر Google تجريبي كيحل السيميلاتور |
| `quinte-simulator.zip` / `quinte-simulator/` | الـ plugin (بديل) |

## ملاحظات

- الفيديو الافتراضي: سباق خيول من Pexels (ترخيص حر، مسموح تجارياً، بلا كريدي). إلا بغيتي فيديو آخر: نزلو من pexels.com، حطو فـ Médias، ولصق الرابط فـ "Quinté du jour".
- الديمو `demo/index.html`: زر Google فيه **تجريبي** (كيحاكي الدخول باش تشوف التجربة كاملة) — فـ WordPress الدخول حقيقي عبر Nextend.
