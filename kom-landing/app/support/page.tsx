import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "الدعم والمساعدة – KOM",
  description: "تواصل مع فريق دعم تطبيق KOM. نحن هنا لمساعدتك في أي استفسار.",
};

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <h3 className="font-bold text-white text-sm mb-2">{q}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
    </div>
  );
}

export default function SupportPage() {
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
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-white">الدعم والمساعدة</h1>
          <p className="text-slate-400 mt-2">نحن هنا لمساعدتك. تواصل معنا في أي وقت.</p>
        </div>

        {/* Contact cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-14">
          <a
            href="mailto:info@kotm.app"
            className="flex items-center gap-4 bg-gold/10 border border-gold/30 rounded-2xl p-5 hover:bg-gold/20 transition-colors"
          >
            <div className="text-3xl">📧</div>
            <div>
              <div className="font-bold text-white text-base">البريد الإلكتروني</div>
              <div className="text-gold text-sm font-semibold">info@kotm.app</div>
              <div className="text-slate-500 text-xs mt-1">نرد خلال 24 ساعة</div>
            </div>
          </a>
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-3xl">⏰</div>
            <div>
              <div className="font-bold text-white text-base">ساعات العمل</div>
              <div className="text-slate-300 text-sm">الأحد – الخميس</div>
              <div className="text-slate-500 text-xs mt-1">9 صباحاً – 6 مساءً (بتوقيت البحرين)</div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-white mb-6">الأسئلة الشائعة</h2>
          <div className="flex flex-col gap-4">
            <FaqItem
              q="كيف أنشر إعلاناً؟"
              a="بعد تسجيل الدخول، انقر على أيقونة الإضافة (+) في الشريط السفلي واتبع الخطوات: أدخل المعلومات، أضف الصور، انشر الإعلان. يستغرق الإنشاء أقل من 3 دقائق."
            />
            <FaqItem
              q="كيف أشترك في إحدى الباقات؟"
              a="اذهب إلى ملفك الشخصي ← الباقة ← اختر الباقة ← قم بالدفع عبر خدمة Benefit ← ثم ارفع صورة إثبات التحويل. يتم تفعيل الباقة خلال 24 ساعة بعد مراجعة الدفعة."
            />
            <FaqItem
              q="لم تُفعَّل باقتي رغم الدفع، ماذا أفعل؟"
              a="تواصل معنا عبر البريد الإلكتروني info@kotm.app مع ذكر رقم الطلب وصورة إثبات التحويل البنكي. سيقوم فريقنا بمعالجة طلبك في أسرع وقت."
            />
            <FaqItem
              q="كيف أحذف إعلاني؟"
              a="في قائمة إعلاناتي، اختر الإعلان الذي تريد حذفه ثم انقر على أيقونة الحذف. يُنصح بحذف الإعلان فور بيع السيارة."
            />
            <FaqItem
              q="كيف أتواصل مع البائع؟"
              a="في صفحة أي إعلان، انقر على زر 'تواصل' لبدء محادثة مباشرة مع البائع داخل التطبيق."
            />
            <FaqItem
              q="هل يمكن استرداد رسوم الاشتراك؟"
              a="لا يمكن استرداد رسوم الاشتراك بعد التفعيل إلا في حالة وجود خطأ موثّق في المبلغ. تواصل معنا خلال 48 ساعة من التفعيل."
            />
            <FaqItem
              q="كيف أبلّغ عن إعلان مزوّر؟"
              a="افتح الإعلان المشبوه وانقر على قائمة الخيارات (···) ثم 'إبلاغ'. يمكنك أيضاً مراسلتنا مباشرة على info@kotm.app."
            />
            <FaqItem
              q="كيف أحذف حسابي؟"
              a="اذهب إلى الإعدادات ← حسابي ← حذف الحساب. سيتم حذف جميع بياناتك خلال 30 يوماً. لمزيد من المساعدة تواصل معنا عبر البريد الإلكتروني."
            />
          </div>
        </div>

        {/* Delete account section (required by Apple) */}
        <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6 mb-12">
          <h2 className="text-xl font-black text-white mb-3">🗑️ طلب حذف الحساب والبيانات</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            وفقاً لسياستنا وقوانين حماية البيانات، يحق لك طلب حذف حسابك وجميع بياناتك الشخصية من أنظمتنا.
            سيتم معالجة طلبك خلال <strong className="text-white">30 يوماً</strong> من تقديمه.
          </p>
          <p className="text-slate-400 text-sm mb-4">
            <strong className="text-white">ما يتم حذفه:</strong> جميع بياناتك الشخصية، إعلاناتك، محادثاتك، وصور الملف الشخصي.
            <br />
            <strong className="text-white">ما يُحتفظ به:</strong> سجلات المعاملات المالية لمدة سنتين (متطلب قانوني).
          </p>
          <a
            href="mailto:info@kotm.app?subject=طلب حذف الحساب&body=أطلب حذف حسابي وجميع بياناتي من تطبيق KOM.%0A%0Aالبريد الإلكتروني المرتبط بالحساب: [أدخل بريدك هنا]"
            className="inline-block bg-red-500/80 hover:bg-red-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            إرسال طلب حذف الحساب
          </a>
        </div>

        {/* Contact form note */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-slate-300 text-sm leading-relaxed">
            لم تجد إجابة على سؤالك؟ راسلنا مباشرة على{" "}
            <a href="mailto:info@kotm.app" className="text-gold font-bold hover:underline">info@kotm.app</a>{" "}
            وسيتواصل معك فريقنا في أقرب وقت.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-sm text-slate-500">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-3">
          <Link href="/"        className="hover:text-gold transition-colors">الرئيسية</Link>
          <Link href="/privacy" className="hover:text-gold transition-colors">سياسة الخصوصية</Link>
          <Link href="/terms"   className="hover:text-gold transition-colors">الشروط والأحكام</Link>
        </div>
        © {new Date().getFullYear()} KOM – جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
