import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    this.resend = new Resend(apiKey);
    this.from = this.configService.get<string>('resend.from') || 'KOM – ملك السوق <info@kotm.app>';
    this.appUrl = this.configService.get<string>('resend.appUrl') || 'https://kotm.app';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Password Reset
  // ─────────────────────────────────────────────────────────────────────────
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;

    const html = this.wrapLayout(`
      <div style="text-align:center; margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#0E1830,#162444);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:28px;">🔐</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0E1830;">إعادة تعيين كلمة المرور</h1>
        <p style="margin:8px 0 0;color:#6B7280;font-size:15px;">Reset Password</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:12px;">
        مرحباً،<br>
        تلقّينا طلباً لإعادة تعيين كلمة مرور حسابك في تطبيق <strong>King of the Market – ملك السوق</strong>.
      </p>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:28px;">
        انقر على الزر أدناه لإعادة تعيين كلمة مرورك. هذا الرابط صالح لمدة <strong>ساعة واحدة</strong> فقط.
      </p>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${resetUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8960C);color:#0E1830;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
          إعادة تعيين كلمة المرور
        </a>
      </div>

      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">أو انسخ الرابط التالي</p>
        <p style="margin:0;font-size:13px;color:#0E1830;word-break:break-all;">${resetUrl}</p>
      </div>

      <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:0;">
        إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان — لن يتم إجراء أي تغييرات على حسابك.
      </p>
    `);

    await this.send({
      to: email,
      subject: 'إعادة تعيين كلمة المرور | KOM – ملك السوق',
      html,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Approved
  // ─────────────────────────────────────────────────────────────────────────
  async sendAccountApproved(email: string, fullName: string): Promise<void> {
    const html = this.wrapLayout(`
      <div style="text-align:center; margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#059669,#047857);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:28px;">✅</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0E1830;">تمت الموافقة على حسابك!</h1>
        <p style="margin:8px 0 0;color:#6B7280;font-size:15px;">Your account has been approved</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:12px;">
        مرحباً ${fullName}،<br>
        يسعدنا إخبارك بأن حسابك في تطبيق <strong>King of the Market – ملك السوق</strong> قد تمت الموافقة عليه بنجاح!
      </p>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:28px;">
        يمكنك الآن تسجيل الدخول والبدء في نشر إعلاناتك والاستمتاع بجميع مزايا التطبيق.
      </p>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${this.appUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8960C);color:#0E1830;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
          فتح التطبيق
        </a>
      </div>

      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px;margin-bottom:8px;">
        <p style="margin:0;font-size:14px;color:#15803D;line-height:1.6;">
          🎉 مرحباً بك في مجتمع ملك السوق! نتطلع إلى تقديم أفضل تجربة لك.
        </p>
      </div>
    `);

    await this.send({
      to: email,
      subject: 'تمت الموافقة على حسابك في KOM – ملك السوق 🎉',
      html,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Rejected
  // ─────────────────────────────────────────────────────────────────────────
  async sendAccountRejected(email: string, fullName: string, reason?: string): Promise<void> {
    const html = this.wrapLayout(`
      <div style="text-align:center; margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#DC2626,#B91C1C);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:28px;">❌</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0E1830;">تعذّرت الموافقة على حسابك</h1>
        <p style="margin:8px 0 0;color:#6B7280;font-size:15px;">Account registration not approved</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:12px;">
        مرحباً ${fullName}،<br>
        نأسف لإعلامك بأنه لم يتم الموافقة على طلب تسجيل حسابك في تطبيق <strong>King of the Market – ملك السوق</strong>.
      </p>

      ${
        reason
          ? `
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;color:#DC2626;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">السبب</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${reason}</p>
      </div>
      `
          : ''
      }

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:28px;">
        إذا كنت تعتقد أن هذا القرار خاطئ أو تريد مزيداً من التوضيح، يرجى التواصل مع فريق الدعم.
      </p>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="mailto:info@kotm.app?subject=استفسار بشأن رفض الحساب"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8960C);color:#0E1830;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
          التواصل مع الدعم
        </a>
      </div>
    `);

    await this.send({
      to: email,
      subject: 'تحديث حول طلب تسجيلك في KOM – ملك السوق',
      html,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Listing Approved
  // ─────────────────────────────────────────────────────────────────────────
  async sendListingApproved(email: string, listingTitle: string, listingId: string): Promise<void> {
    const listingUrl = `${this.appUrl}/listing/${listingId}`;

    const html = this.wrapLayout(`
      <div style="text-align:center; margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#059669,#047857);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:28px;">🚗</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0E1830;">تمت الموافقة على إعلانك!</h1>
        <p style="margin:8px 0 0;color:#6B7280;font-size:15px;">Your listing has been approved</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:12px;">
        رائع! إعلانك <strong>"${listingTitle}"</strong> تمت الموافقة عليه وهو الآن ظاهر للمشترين.
      </p>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${listingUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8960C);color:#0E1830;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
          عرض الإعلان
        </a>
      </div>
    `);

    await this.send({
      to: email,
      subject: `تمت الموافقة على إعلانك "${listingTitle}" ✅`,
      html,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Listing Rejected
  // ─────────────────────────────────────────────────────────────────────────
  async sendListingRejected(email: string, listingTitle: string, reason?: string): Promise<void> {
    const html = this.wrapLayout(`
      <div style="text-align:center; margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#DC2626,#B91C1C);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:28px;">🚗</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0E1830;">تعذّرت الموافقة على إعلانك</h1>
        <p style="margin:8px 0 0;color:#6B7280;font-size:15px;">Listing not approved</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:12px;">
        نأسف، إعلانك <strong>"${listingTitle}"</strong> لم يحظَ بالموافقة.
      </p>

      ${
        reason
          ? `
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;color:#DC2626;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">السبب</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${reason}</p>
      </div>
      `
          : ''
      }

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:28px;">
        يمكنك تعديل الإعلان وإعادة تقديمه، أو التواصل مع فريق الدعم لمزيد من المعلومات.
      </p>
    `);

    await this.send({
      to: email,
      subject: `تحديث بشأن إعلانك "${listingTitle}"`,
      html,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Payment Confirmed
  // ─────────────────────────────────────────────────────────────────────────
  async sendPaymentConfirmed(email: string, packageName: string, amount: number): Promise<void> {
    const html = this.wrapLayout(`
      <div style="text-align:center; margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#059669,#047857);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:28px;">💳</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0E1830;">تم تأكيد دفعتك!</h1>
        <p style="margin:8px 0 0;color:#6B7280;font-size:15px;">Payment Confirmed</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:24px;">
        شكراً لك! تم تأكيد دفعتك وتفعيل باقتك بنجاح.
      </p>

      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:20px;margin-bottom:28px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#6B7280;font-size:14px;">الباقة</span>
          <span style="color:#0E1830;font-size:14px;font-weight:600;">${packageName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid #E5E7EB;padding-top:12px;">
          <span style="color:#6B7280;font-size:14px;">المبلغ المدفوع</span>
          <span style="color:#059669;font-size:16px;font-weight:700;">${amount.toFixed(3)} د.ب</span>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${this.appUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8960C);color:#0E1830;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
          افتح التطبيق
        </a>
      </div>
    `);

    await this.send({
      to: email,
      subject: 'تم تأكيد دفعتك في KOM – ملك السوق ✅',
      html,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Payment Rejected
  // ─────────────────────────────────────────────────────────────────────────
  async sendPaymentRejected(email: string, amount: number, reason?: string): Promise<void> {
    const html = this.wrapLayout(`
      <div style="text-align:center; margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#DC2626,#B91C1C);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:28px;">💳</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0E1830;">تم رفض إثبات الدفع</h1>
        <p style="margin:8px 0 0;color:#6B7280;font-size:15px;">Payment Proof Rejected</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:24px;">
        نأسف، لم يتمكن فريقنا من التحقق من إثبات التحويل البنكي بمبلغ <strong>${amount.toFixed(3)} د.ب</strong>.
      </p>

      ${
        reason
          ? `
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;color:#DC2626;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">السبب</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${reason}</p>
      </div>
      `
          : ''
      }

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:28px;">
        يرجى إعادة رفع إثبات التحويل الصحيح يشتمل على تاريخ ومبلغ العملية، أو تواصل مع فريق الدعم.
      </p>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${this.appUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8960C);color:#0E1830;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
          إعادة المحاولة
        </a>
      </div>
    `);

    await this.send({
      to: email,
      subject: 'تحديث بشأن إثبات الدفع في KOM – ملك السوق',
      html,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Subscription Expiry Warning
  // ─────────────────────────────────────────────────────────────────────────
  async sendSubscriptionExpiryWarning(
    email: string,
    fullName: string,
    daysLeft: number,
    endDate: Date,
  ): Promise<void> {
    const formattedDate = endDate.toLocaleDateString('ar-BH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const html = this.wrapLayout(`
      <div style="text-align:center; margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#D97706,#B45309);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:28px;">⏳</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0E1830;">اشتراكك سينتهي قريباً</h1>
        <p style="margin:8px 0 0;color:#6B7280;font-size:15px;">Subscription Expiring Soon</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:12px;">
        مرحباً ${fullName}،
      </p>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:24px;">
        نود تنبيهك بأن اشتراكك في <strong>King of the Market – ملك السوق</strong> سينتهي خلال
        <strong>${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'}</strong>
        بتاريخ <strong>${formattedDate}</strong>.
      </p>

      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:16px;margin-bottom:28px;">
        <p style="margin:0;font-size:14px;color:#92400E;line-height:1.6;">
          ⚠️ بعد انتهاء الاشتراك لن تتمكن من نشر إعلانات جديدة. جدّد اشتراكك الآن لمواصلة بيع سياراتك بسهولة.
        </p>
      </div>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${this.appUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8960C);color:#0E1830;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
          تجديد الاشتراك الآن
        </a>
      </div>
    `);

    await this.send({
      to: email,
      subject: `اشتراكك في KOM سينتهي خلال ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'} ⏳`,
      html,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Subscription Expired
  // ─────────────────────────────────────────────────────────────────────────
  async sendSubscriptionExpired(email: string, fullName: string): Promise<void> {
    const html = this.wrapLayout(`
      <div style="text-align:center; margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#DC2626,#B91C1C);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:28px;">📅</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0E1830;">انتهى اشتراكك</h1>
        <p style="margin:8px 0 0;color:#6B7280;font-size:15px;">Subscription Expired</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:12px;">
        مرحباً ${fullName}،
      </p>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:24px;">
        انتهت مدة اشتراكك في <strong>King of the Market – ملك السوق</strong>. لن تتمكن من نشر إعلانات جديدة حتى تجدّد اشتراكك.
      </p>

      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin-bottom:28px;">
        <p style="margin:0;font-size:14px;color:#DC2626;line-height:1.6;">
          إعلاناتك الحالية ستبقى ظاهرة حتى تنتهي مدتها الطبيعية. قم بتجديد الاشتراك للحفاظ على إعلاناتك ونشر إعلانات جديدة.
        </p>
      </div>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${this.appUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8960C);color:#0E1830;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
          تجديد الاشتراك
        </a>
      </div>
    `);

    await this.send({
      to: email,
      subject: 'انتهى اشتراكك في KOM – ملك السوق 📅',
      html,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal: send + layout
  // ─────────────────────────────────────────────────────────────────────────
  private async send(opts: { to: string; subject: string; html: string }): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });

      if (error) {
        this.logger.error(`Failed to send email to ${opts.to}: ${error.message}`);
      } else {
        this.logger.log(`Email sent to ${opts.to} — id: ${data?.id}`);
      }
    } catch (err) {
      this.logger.error(`Exception sending email to ${opts.to}:`, err);
    }
  }

  private wrapLayout(content: string): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOM – ملك السوق</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0E1830,#162444);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <img src="https://res.cloudinary.com/dusyeyipu/image/upload/v1772134340/kom-platform/kom-logo.png"
                   alt="KOM – ملك السوق"
                   width="80" height="80"
                   style="width:80px;height:80px;border-radius:40px;object-fit:cover;display:block;margin:0 auto 12px;border:2px solid rgba(212,175,55,0.3);" />
              <p style="margin:4px 0 0;color:#94A3B8;font-size:13px;">ملك السوق – King of the Market</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:36px 32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#9CA3AF;">
                © 2025 King of the Market. جميع الحقوق محفوظة.
              </p>
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                <a href="https://kotm.app" style="color:#D4AF37;text-decoration:none;">kotm.app</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@kotm.app" style="color:#D4AF37;text-decoration:none;">info@kotm.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
