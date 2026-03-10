import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "الشروط والأحكام – KOM",
  description: "شروط وأحكام استخدام تطبيق KOM لبيع وشراء السيارات في البحرين.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-black text-gold mb-4 pb-2 border-b border-gold/20">{title}</h2>
      <div className="text-slate-300 leading-loose space-y-3 text-sm">{children}</div>
    </div>
  );
}

export default function TermsPage() {
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
          <h1 className="text-3xl font-black text-white">الشروط والأحكام</h1>
          <p className="text-slate-500 text-sm mt-2">آخر تحديث: فبراير 2026</p>
        </div>

        <div className="bg-gold/5 border border-gold/20 rounded-2xl p-5 mb-10 text-sm text-slate-300 leading-relaxed">
          باستخدامك لتطبيق <strong className="text-gold">KOM</strong> أو التسجيل فيه، فأنت توافق على الالتزام بهذه الشروط والأحكام.
          يُرجى قراءتها بعناية قبل البدء في استخدام التطبيق.
        </div>

        <Section title="١. القبول والموافقة">
          <p>
            يُعدّ استخدامك لتطبيق KOM أو تسجيلك فيه قبولاً منك لهذه الشروط والأحكام وسياسة الخصوصية.
            إذا كنت لا توافق على أي من هذه الشروط، يُرجى التوقف عن استخدام التطبيق فوراً.
          </p>
        </Section>

        <Section title="٢. أهلية الاستخدام">
          <ul className="list-disc list-inside space-y-2 pr-4">
            <li>يجب أن يكون المستخدم قد تجاوز سن الثامنة عشرة (18) من عمره</li>
            <li>يجب أن يكون المستخدم مقيماً أو يمارس نشاطه في مملكة البحرين</li>
            <li>يجب تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
            <li>لا يُسمح بإنشاء أكثر من حساب واحد لكل شخص أو كيان تجاري</li>
          </ul>
        </Section>

        <Section title="٣. إنشاء الحساب والمسؤولية">
          <ul className="list-disc list-inside space-y-2 pr-4">
            <li>أنت مسؤول عن الحفاظ على سرية كلمة مرور حسابك</li>
            <li>أنت مسؤول عن جميع الأنشطة التي تتم تحت حسابك</li>
            <li>يجب إبلاغنا فوراً في حال الاشتباه بأي استخدام غير مصرح لحسابك</li>
            <li>للمعارض التجارية: يجب التحقق من هوية المعرض وتقديم وثائق الترخيص التجاري</li>
          </ul>
        </Section>

        <Section title="٤. نشر الإعلانات">
          <p><strong className="text-white">يُلزم البائع بما يلي:</strong></p>
          <ul className="list-disc list-inside space-y-2 pr-4 mt-2">
            <li>تقديم معلومات دقيقة وصادقة عن السيارة المُعلنة (السنة، الكيلومترات، الحالة)</li>
            <li>استخدام صور حقيقية للسيارة المعروضة وليس صوراً من الإنترنت</li>
            <li>تحديد سعر حقيقي وغير مضلل</li>
            <li>حذف الإعلان فور بيع السيارة</li>
          </ul>
          <p className="mt-4"><strong className="text-white">يُحظر نشر:</strong></p>
          <ul className="list-disc list-inside space-y-2 pr-4 mt-2">
            <li>إعلانات لسيارات مسروقة أو تالفة دون الإفصاح</li>
            <li>إعلانات وهمية أو احتيالية بأي شكل</li>
            <li>سيارات ذات مخالفات مرورية جسيمة دون الإفصاح</li>
            <li>أي محتوى مسيء أو مخالف للقوانين البحرينية</li>
          </ul>
        </Section>

        <Section title="٥. باقات الاشتراك والمدفوعات">
          <ul className="list-disc list-inside space-y-2 pr-4">
            <li>تتوفر باقات اشتراك متعددة تتيح للمستخدمين نشر عدد أكبر من الإعلانات</li>
            <li>يتم الدفع عبر خدمة Benefit البنكية فقط (تحويل بنكي)</li>
            <li>تُفعَّل الباقة بعد مراجعة فريق KOM وتأكيد استلام الدفعة (خلال 24 ساعة)</li>
            <li><strong className="text-white">لا يمكن استرداد رسوم الاشتراك</strong> بعد تفعيل الباقة إلا في حالات الخطأ السعري المُثبت</li>
            <li>في حال رفض الدفعة، يحق للمستخدم إعادة تقديم الإثبات أو التواصل مع الدعم</li>
            <li>تنتهي الباقة في تاريخها المحدد بغض النظر عن عدد الإعلانات المستخدمة</li>
          </ul>
        </Section>

        <Section title="٦. قواعد استخدام خاصية الدردشة">
          <ul className="list-disc list-inside space-y-2 pr-4">
            <li>يُحظر مشاركة معلومات مالية حساسة كأرقام البطاقات البنكية عبر الدردشة</li>
            <li>يُحظر إرسال رسائل مسيئة أو تهديدية أو مزعجة</li>
            <li>يُحظر الترويج لمنصات منافسة أو الدعاية داخل المحادثات</li>
            <li>يمكن للمستخدمين الإبلاغ عن أي مخالفات للدعم الفني</li>
          </ul>
        </Section>

        <Section title="٧. حقوق الملكية الفكرية">
          <ul className="list-disc list-inside space-y-2 pr-4">
            <li>جميع حقوق التطبيق وتصميمه وشعاره وبرمجته محفوظة لشركة KOM</li>
            <li>عند رفعك صوراً على التطبيق، فأنت تمنح KOM ترخيصاً لعرضها في الإعلانات</li>
            <li>لا يُسمح بنسخ أو توزيع أو تعديل تطبيق KOM دون إذن كتابي مسبق</li>
          </ul>
        </Section>

        <Section title="٨. إخلاء المسؤولية">
          <ul className="list-disc list-inside space-y-2 pr-4">
            <li>KOM منصة وسيطة ولا يتحمل مسؤولية النزاعات التي تنشأ بين البائعين والمشترين</li>
            <li>KOM لا يضمن دقة جميع المعلومات المدرجة في الإعلانات من قِبل المستخدمين</li>
            <li>يستقع على المستخدم التحقق من حالة السيارة قبل إتمام أي صفقة</li>
            <li>KOM غير مسؤول عن أي خسائر مالية ناجمة عن صفقات بين المستخدمين</li>
          </ul>
        </Section>

        <Section title="٩. تعليق الحساب وإنهاؤه">
          <p>يحق لإدارة KOM تعليق أي حساب أو إنهاؤه في الحالات التالية:</p>
          <ul className="list-disc list-inside space-y-2 pr-4 mt-3">
            <li>انتهاك أي من هذه الشروط والأحكام</li>
            <li>نشر محتوى مزوّر أو إعلانات احتيالية</li>
            <li>تلقّي تقارير متعددة ضد الحساب من مستخدمين آخرين</li>
            <li>استخدام التطبيق في غرض مخالف للقانون البحريني</li>
          </ul>
        </Section>

        <Section title="١٠. الإشعارات والتحديثات">
          <p>
            نحتفظ بحق تحديث هذه الشروط في أي وقت. سيتم إعلامك بالتغييرات الجوهرية عبر
            إشعار داخل التطبيق. استمرارك في استخدام التطبيق بعد التحديث يعني قبولك للشروط الجديدة.
          </p>
        </Section>

        <Section title="١١. الإطار القانوني والاختصاص القضائي">
          <p>
            تخضع هذه الشروط والأحكام لقوانين مملكة البحرين.
            في حال نشوء أي نزاع، يكون الاختصاص القضائي للمحاكم البحرينية المختصة.
          </p>
        </Section>

        <Section title="١٢. التواصل معنا">
          <p>لأي استفسار يتعلق بهذه الشروط:</p>
          <ul className="list-none space-y-2 mt-3 pr-4">
            <li>📧 البريد الإلكتروني: <a href="mailto:info@kotm.app" className="text-gold hover:underline">info@kotm.app</a></li>
            <li>🌐 الموقع الإلكتروني: <a href="https://kotm.app" className="text-gold hover:underline">kotm.app</a></li>
          </ul>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-sm text-slate-500">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-3">
          <Link href="/"         className="hover:text-gold transition-colors">الرئيسية</Link>
          <Link href="/privacy"  className="hover:text-gold transition-colors">سياسة الخصوصية</Link>
          <Link href="/support"  className="hover:text-gold transition-colors">الدعم</Link>
        </div>
        © {new Date().getFullYear()} KOM – جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
