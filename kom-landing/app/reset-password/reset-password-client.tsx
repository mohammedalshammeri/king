'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = 'https://api.kotm.app/api/v1/auth/reset-password';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validationMessage = useMemo(() => {
    if (!token) return 'رابط إعادة التعيين غير صالح أو ناقص.';
    if (password.length === 0 && confirmPassword.length === 0) return '';
    if (password.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';
    if (password !== confirmPassword) return 'كلمتا المرور غير متطابقتين.';
    return '';
  }, [confirmPassword, password, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload?.message || payload?.error || 'تعذر إعادة تعيين كلمة المرور.';
        throw new Error(message);
      }

      setSuccess(true);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'حدث خطأ غير متوقع.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.22),_transparent_35%),linear-gradient(135deg,#0e1830,#162444)] px-8 py-12 lg:px-12">
            <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl" />
            <div className="absolute bottom-0 right-0 h-52 w-52 translate-x-1/4 translate-y-1/4 rounded-full bg-white/10 blur-3xl" />
            <p className="mb-4 inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-1 text-sm font-bold text-gold">استعادة الوصول للحساب</p>
            <h1 className="max-w-md text-3xl font-black leading-tight text-white lg:text-5xl">تغيير كلمة المرور من رابط البريد مباشرة</h1>
            <p className="mt-5 max-w-lg text-sm leading-8 text-slate-300 lg:text-base">
              هذه الصفحة مخصصة لإكمال إعادة تعيين كلمة المرور بدل تحويلك إلى الصفحة الرئيسية. أدخل كلمة المرور الجديدة ثم ارجع لتسجيل الدخول في التطبيق.
            </p>
          </section>

          <section className="bg-slate-900/70 px-8 py-12 lg:px-12">
            <div className="mx-auto max-w-md">
              <h2 className="text-2xl font-black text-white">إعادة تعيين كلمة المرور</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">أدخل كلمة المرور الجديدة للحساب المرتبط بهذا الرابط.</p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="password">كلمة المرور الجديدة</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-gold"
                    placeholder="8 أحرف أو أكثر"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="confirmPassword">تأكيد كلمة المرور</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-gold"
                    placeholder="أعد إدخال كلمة المرور"
                  />
                </div>

                {(error || validationMessage) && !success ? (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error || validationMessage}
                  </div>
                ) : null}

                {success ? (
                  <div className="space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
                    <p className="font-bold">تم تغيير كلمة المرور بنجاح.</p>
                    <button
                      type="button"
                      onClick={() => router.push('/')}
                      className="rounded-2xl bg-gold px-5 py-3 font-bold text-slate-950 transition hover:brightness-110"
                    >
                      العودة إلى الموقع
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || !token}
                    className="w-full rounded-2xl bg-gold px-5 py-3 font-black text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
                  </button>
                )}
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}