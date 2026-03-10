import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سياسة الخصوصية – KOM",
  description: "سياسة الخصوصية لتطبيق KOM لبيع وشراء السيارات في البحرين.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-black text-gold mb-4 pb-2 border-b border-gold/20">{title}</h2>
      <div className="text-slate-300 leading-loose space-y-3 text-sm">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen font-cairo" dir="rtl">
      {/* Navbar */}
      <header className="bg-navy/80 backdrop-blur border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-black">
            <span className="text-gold">K</span>
            <span className="text-white">O</span>
            <span className="text-gold">M</span>
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-gold transition-colors">← العودة للرئيسية</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white">سياسة الخصوصية</h1>
          <p className="text-slate-500 text-sm mt-2">آخر تحديث: فبراير 2026</p>
        </div>

        <div className="bg-gold/5 border border-gold/20 rounded-2xl p-5 mb-10 text-sm text-slate-300 leading-relaxed">
          مرحباً بك في تطبيق <strong className="text-gold">KOM</strong>. نحن نلتزم بحماية خصوصيتك وأمان بياناتك الشخصية.
          تصف هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها عند استخدامك لتطبيق KOM ومنصتنا الإلكترونية.
        </div>

        <Section title="١. المعلومات التي نجمعها">
          <p><strong className="text-white">أ. البيانات التي تقدمها مباشرةً:</strong></p>
          <ul className="list-disc list-inside space-y-1 pr-4">
            <li>الاسم الكامل ورقم الهاتف وعنوان البريد الإلكتروني عند إنشاء الحساب</li>
            <li>صور السيارات والمركبات التي ترفعها مع الإعلانات</li>
            <li>معلومات المعرض (اسم المعرض، الموقع، نوع النشاط) للمستخدمين التجاريين</li>
            <li>صور إثبات الدفعات البنكية عند الاشتراك عبر خدمة Benefit</li>
            <li>الرسائل المُرسلة عبر خاصية الدردشة في التطبيق</li>
          </ul>
          <p className="mt-3"><strong className="text-white">ب. البيانات التي نجمعها تلقائياً:</strong></p>
          <ul className="list-disc list-inside space-y-1 pr-4">
            <li>معلومات الجهاز (نوع الجهاز، نظام التشغيل، معرّف الجهاز)</li>
            <li>بيانات الاستخدام (الصفحات التي تزورها، مدة الاستخدام)</li>
            <li>الموقع الجغرافي التقريبي (إذا منحت الإذن) لعرض الإعلانات القريبة</li>
            <li>رموز الإشعارات (Push Notification Tokens) لإرسال التنبيهات</li>
          </ul>
        </Section>

        <Section title="٢. كيفية استخدام بياناتك">
          <ul className="list-disc list-inside space-y-2 pr-4">
            <li>تشغيل التطبيق وتقديم خدماته الأساسية (نشر الإعلانات، التواصل بين البائعين والمشترين)</li>
            <li>معالجة مدفوعات الاشتراكات والتحقق منها</li>
            <li>إرسال إشعارات فورية بالرسائل الجديدة والعروض ذات الصلة</li>
            <li>تحسين جودة التطبيق وتطوير الميزات من خلال تحليل بيانات الاستخدام</li>
            <li>حل النزاعات ومنع الاحتيال والتحقق من صحة الإعلانات</li>
            <li>الامتثال للمتطلبات القانونية في مملكة البحرين</li>
          </ul>
        </Section>

        <Section title="٣. مشاركة البيانات مع الأطراف الثالثة">
          <p>لا نبيع بياناتك الشخصية إطلاقاً. قد نشارك بياناتك في الحالات التالية فقط:</p>
          <ul className="list-disc list-inside space-y-2 pr-4 mt-3">
            <li><strong className="text-white">مزودو الخدمات التقنية:</strong> خوادم التخزين السحابي ومعالجة الصور (بغرض تشغيل الخدمة فقط)</li>
            <li><strong className="text-white">الجهات القانونية:</strong> عند صدور أمر قانوني أو حكم قضائي من جهات البحرين المختصة</li>
            <li><strong className="text-white">حماية الحقوق:</strong> للتحقيق في عمليات الاحتيال أو حماية حقوق المستخدمين</li>
          </ul>
        </Section>

        <Section title="٤. سلامة البيانات وحمايتها">
          <ul className="list-disc list-inside space-y-2 pr-4">
            <li>نستخدم تشفير HTTPS/TLS لجميع الاتصالات بين التطبيق والخوادم</li>
            <li>يتم تخزين كلمات المرور بصيغة مشفّرة (bcrypt) ولا يمكن لأحد الاطلاع عليها</li>
            <li>صور الإثبات البنكية يطلع عليها مسؤولو المراجعة المرخصون فقط</li>
            <li>يتم مراجعة إجراءات الأمان بانتظام وتحديثها</li>
          </ul>
        </Section>

        <Section title="٥. صور إثبات الدفع (Benefit)">
          <p>
            عند الاشتراك عبر خدمة Benefit البنكية، ترفع صورة لإثبات التحويل. هذه الصورة:
          </p>
          <ul className="list-disc list-inside space-y-1 pr-4 mt-2">
            <li>لا يطلع عليها إلا مسؤولو المراجعة في KOM</li>
            <li>تُستخدم حصراً للتحقق من صحة الدفعة</li>
            <li>يتم الاحتفاظ بها لمدة لا تتجاوز 90 يوماً بعد معالجة الطلب</li>
          </ul>
        </Section>

        <Section title="٦. حقوقك">
          <p>وفقاً لقانون حماية البيانات الشخصية في البحرين، يحق لك:</p>
          <ul className="list-disc list-inside space-y-2 pr-4 mt-3">
            <li><strong className="text-white">الاطلاع:</strong> طلب نسخة من بياناتك الشخصية المخزنة لدينا</li>
            <li><strong className="text-white">التصحيح:</strong> تعديل أي بيانات غير دقيقة من خلال إعدادات الحساب</li>
            <li><strong className="text-white">الحذف:</strong> طلب حذف حسابك وجميع بياناتك المرتبطة به</li>
            <li><strong className="text-white">الاعتراض:</strong> الاعتراض على استخدام بياناتك لأغراض التسويق</li>
          </ul>
          <p className="mt-3">
            لممارسة أي من هذه الحقوق، تواصل معنا على:{" "}
            <a href="mailto:info@kotm.app" className="text-gold hover:underline font-semibold">info@kotm.app</a>
          </p>
        </Section>

        <Section title="٧. الكاميرا والصور">
          <p>
            يطلب التطبيق إذن الوصول إلى الكاميرا ومعرض الصور لتمكينك من التقاط وإرفاق صور سيارتك مع إعلانك.
            لن يتم الوصول إلى الكاميرا أو المعرض إلا عند طلبك ذلك صراحةً.
            يمكنك إلغاء هذا الإذن في أي وقت من إعدادات الجهاز.
          </p>
        </Section>

        <Section title="٨. الإشعارات">
          <p>
            يطلب التطبيق إذن إرسال الإشعارات لإعلامك بالرسائل الجديدة وحالة إعلاناتك.
            هذا الإذن اختياري ويمكنك إلغاؤه في أي وقت من إعدادات الجهاز.
          </p>
        </Section>

        <Section title="٩. الاحتفاظ بالبيانات">
          <ul className="list-disc list-inside space-y-2 pr-4">
            <li>بيانات الحساب النشط: محتفظ بها طوال مدة نشاط الحساب</li>
            <li>الإعلانات المحذوفة: يتم حذفها نهائياً خلال 30 يوماً</li>
            <li>سجلات الدفع: محتفظ بها لمدة سنتين لغرض المحاسبة</li>
            <li>بعد حذف الحساب: تُحذف جميع البيانات الشخصية خلال 30 يوماً</li>
          </ul>
        </Section>

        <Section title="١٠. الأطفال">
          <p>
            تطبيق KOM مخصص للمستخدمين الذين تجاوزوا سن الثامنة عشرة (18).
            لا نجمع بيانات الأطفال عن قصد. إذا اكتشفنا أن مستخدماً دون السن القانوني قد سجّل، سيتم حذف حسابه.
          </p>
        </Section>

        <Section title="١١. التحديثات على هذه السياسة">
          <p>
            قد نُحدّث هذه السياسة من وقت لآخر. سيتم إعلامك بأي تغييرات جوهرية عبر إشعار داخل التطبيق أو عبر البريد الإلكتروني.
            استمرارك في استخدام التطبيق بعد التحديث يعني موافقتك على السياسة الجديدة.
          </p>
        </Section>

        <Section title="١٢. التواصل معنا">
          <p>لأي استفسار يتعلق بخصوصيتك أو بياناتك الشخصية:</p>
          <ul className="list-none space-y-2 mt-3 pr-4">
            <li>📧 البريد الإلكتروني: <a href="mailto:info@kotm.app" className="text-gold hover:underline">info@kotm.app</a></li>
            <li>🌐 الموقع الإلكتروني: <a href="https://kotm.app" className="text-gold hover:underline">kotm.app</a></li>
          </ul>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-sm text-slate-500">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-3">
          <Link href="/"        className="hover:text-gold transition-colors">الرئيسية</Link>
          <Link href="/terms"   className="hover:text-gold transition-colors">الشروط والأحكام</Link>
          <Link href="/support" className="hover:text-gold transition-colors">الدعم</Link>
        </div>
        © {new Date().getFullYear()} KOM – جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
