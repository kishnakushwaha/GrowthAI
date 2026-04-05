import nodemailer from 'nodemailer';
import supabase from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

// ==================== TEMPLATE ENGINE ====================

export function renderTemplate(template, variables) {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  return rendered;
}

// ==================== SEED DEFAULT TEMPLATES ====================

async function seedTemplates() {
  try {
    const templates = [
      {
        name: 'Website Audit Intro',
        subject: "Quick question about {{business_name}}'s online presence",
        body: `Hi {{contact_name}},\n\nI came across {{business_name}} while researching businesses in {{city}} and noticed a few things about your online presence that could be costing you customers.\n\nI ran a quick free audit on your website and found some issues:\n• Your site scores {{audit_score}}/100 on our SEO analysis\n• {{critical_count}} critical issues were found\n• There are quick wins that could dramatically improve your Google ranking\n\nYou can see the full report here: {{audit_link}}\n\nI help businesses like yours get 20-50 new leads per month through AI-powered Google ranking and targeted ads. Would a quick 10-minute call be helpful?\n\nBest regards,\nGrowthAI Engine Team\n📞 +91 87439 33258`
      },
      {
        name: 'Follow-Up (Day 3)',
        subject: "Re: Your website audit results for {{business_name}}",
        body: `Hi {{contact_name}},\n\nJust following up on the website audit I sent earlier for {{business_name}}.\n\nI noticed your competitors in {{city}} are already investing in their online presence. Here's what they're doing differently:\n✅ Proper SEO optimization (showing up on Google page 1)\n✅ Mobile-friendly, fast-loading websites\n✅ Active Google Business Profile with reviews\n\nThe good news? Most of these fixes are straightforward — and we can handle everything for you.\n\nOur Starter package begins at just ₹8,000/month and includes:\n→ Google Business Profile optimization\n→ Basic local SEO\n→ Monthly performance report\n\nWant to chat for 10 minutes this week? I'm happy to walk you through our approach.\n\nBest,\nGrowthAI Engine Team`
      },
      {
        name: 'Social Proof (Day 7)',
        subject: "{{business_name}} — Last thought from us",
        body: `Hi {{contact_name}},\n\nThis is my last follow-up, so I'll keep it brief.\n\nWe recently helped a {{industry}} business in Delhi go from 0 to 30+ leads per month in just 60 days. Their Google ranking went from page 5 to page 1 for their main keywords.\n\nIf growing {{business_name}}'s online presence is a priority for you this year, I'd love to show you exactly how we'd do it — no obligation.\n\nBook a free strategy call: https://wa.me/918743933258\n\nIf the timing isn't right, no worries at all. Wishing {{business_name}} all the best!\n\nCheers,\nGrowthAI Engine Team`
      }
    ];

    for (const t of templates) {
      const { data } = await supabase.from('email_templates').select('id').eq('name', t.name).limit(1);
      if (!data || data.length === 0) {
        await supabase.from('email_templates').insert(t);
        console.log(`✅ Seeded template: ${t.name}`);
      }
    }
  } catch (err) {
    console.error('Template seeding failed:', err.message);
  }
}

// Seed on startup
seedTemplates();

// ==================== SMTP TRANSPORT ====================

let transporter = null;
let smtpEmail = null;

export async function configureSmtp(config) {
  try {
    const t = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: config.email,
        pass: config.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await t.verify();
    
    transporter = t;
    smtpEmail = config.email;

    // Persist to Supabase settings table
    const { error: saveError } = await supabase.from('settings').upsert({
      key: 'smtp_config',
      value: { email: config.email, password: config.password },
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

    if (saveError) {
      console.error('SMTP persistence failed:', saveError.message);
    }

    return { success: true, email: config.email };
  } catch (err) {
    console.error('SMTP configuration failed:', err.message);
    throw err;
  }
}

export async function loadSmtpConfig() {
  try {
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'smtp_config').single();
    if (error || !data) return null;

    const config = data.value;
    const t = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: config.email,
        pass: config.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await t.verify();
    transporter = t;
    smtpEmail = config.email;
    console.log(`✅ SMTP initialized from database (${smtpEmail})`);
    return transporter;
  } catch (err) {
    console.warn('⚠️ SMTP settings found but could not be initialized (invalid password or network issue).');
    return null;
  }
}

export function getTransporter() {
  return transporter;
}

export function getSmtpEmail() {
  return smtpEmail;
}

// ==================== TRACKING UTILITIES ====================

function wrapUrls(text, trackingId, trackingBaseUrl) {
  if (!trackingBaseUrl || !trackingId) return text;
  
  // Regex to find URLs not already inside an href or src attribute
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  
  return text.replace(urlRegex, (url) => {
    // Avoid double-wrapping
    if (url.includes('/api/track/click/')) return url;
    
    const encodedUrl = encodeURIComponent(url);
    return `${trackingBaseUrl}/api/track/click/${trackingId}?url=${encodedUrl}`;
  });
}

// ==================== SEND SINGLE EMAIL ====================

export async function sendEmail({ to, toName, businessName, subject, body, campaignId, trackingBaseUrl }) {
  if (!transporter) {
    throw new Error('SMTP not configured. Set up your email credentials first.');
  }

  const trackingId = uuidv4();
  const baseUrl = trackingBaseUrl || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3001';

  // 1. Wrap all links in the main body text BEFORE HTML processing
  const trackedBody = wrapUrls(body, trackingId, baseUrl);

  // 2. Add tracking pixel for OPEN tracking
  const trackingPixel = `\n\n<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none" />`;

  // 3. Build professional HTML email using the tracked body
  const processedBody = trackedBody
    .replace(/\n/g, '<br>')
    .replace(/•/g, '&bull;')
    .replace(/→/g, '&rarr;')
    .replace(/✅/g, '&#9989;')
    .replace(/(\d+\/100)/g, '<span style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:2px 8px;border-radius:4px;font-weight:700;font-size:15px;">$1</span>')
    .replace(/(\d+)\s+(critical issues)/gi, '<span style="background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:4px;font-weight:700;">$1 $2</span>')
    // We already wrapped links in `trackedBody`, so let's just make sure they look good as <a> tags!
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#6366f1;font-weight:600;text-decoration:none;border-bottom:2px solid #6366f1;">Link</a>')
    .replace(/(20-50 new leads)/gi, '<span style="color:#059669;font-weight:700;">$1</span>')
    .replace(/(page 1)/gi, '<span style="background:#ecfdf5;color:#059669;padding:2px 6px;border-radius:4px;font-weight:600;">$1</span>')
    .replace(/(30\+ leads)/gi, '<span style="color:#059669;font-weight:700;">$1</span>')
    .replace(/(₹[\d,]+\/month)/g, '<span style="background:#eef2ff;color:#4f46e5;padding:2px 8px;border-radius:4px;font-weight:700;">$1</span>')
    .replace(/(quick wins)/gi, '<strong style="color:#4f46e5;">$1</strong>');

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header with gradient -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#6366f1 100%);padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                    🎯 GrowthAI Engine
                  </div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px;letter-spacing:0.5px;">
                    AI-POWERED LEAD GENERATION & SEO
                  </div>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px;">
                    <span style="color:#fff;font-size:11px;font-weight:600;">FREE AUDIT REPORT</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Body content -->
        <tr>
          <td style="padding:36px 40px;font-size:15px;color:#1a1a2e;line-height:1.75;">
            ${processedBody}
          </td>
        </tr>
        
        <!-- CTA Button (Wrap this too!) -->
        <tr>
          <td align="center" style="padding:0 40px 32px;">
            <a href="${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent('https://wa.me/918743933258?text=Hi%2C%20I%27m%20interested%20in%20improving%20my%20online%20presence')}" 
               style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(99,102,241,0.4);">
              📞 Book Free Strategy Call →
            </a>
            <div style="margin-top:8px;font-size:12px;color:#9ca3af;">No obligation • 10 minutes • 100% free</div>
          </td>
        </tr>
        
        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <div style="border-top:1px solid #e5e7eb;"></div>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:13px;font-weight:700;color:#1a1a2e;">GrowthAI Engine</div>
                  <div style="font-size:12px;color:#6b7280;margin-top:2px;">AI-Powered Digital Marketing Agency</div>
                  <div style="font-size:12px;color:#6b7280;margin-top:4px;">📞 +91 87439 33258 &nbsp;|&nbsp; 📧 team@growthai.in</div>
                </td>
                <td align="right" style="vertical-align:top;">
                  <div style="font-size:11px;color:#9ca3af;">Delhi, India</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <!-- Unsubscribe -->
      <div style="text-align:center;margin-top:16px;font-size:11px;color:#9ca3af;">
        You received this because we analyzed your business's online presence.
      </div>
    </td></tr>
  </table>
  ${trackingPixel}
</body>
</html>
  `;

  // Log to Supabase
  const { data: logEntry, error: logError } = await supabase.from('email_logs').insert({
    campaign_id: campaignId || null,
    tracking_id: trackingId,
    recipient_email: to,
    status: 'sending'
  }).select('id').single();

  if (logError) console.error('Email log insert error:', logError.message);

  try {
    await transporter.sendMail({
      from: transporter.options.auth?.user,
      to,
      subject,
      text: trackedBody,
      html: htmlBody
    });

    // Update log to sent
    await supabase.from('email_logs')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('tracking_id', trackingId);

    if (campaignId) {
      // Increment sent_count using RPC or two-step update
      const { data: campaign } = await supabase.from('campaigns').select('sent_count').eq('id', campaignId).single();
      if (campaign) {
        await supabase.from('campaigns').update({ sent_count: (campaign.sent_count || 0) + 1 }).eq('id', campaignId);
      }
    }

    return { success: true, trackingId, logId: logEntry?.id };
  } catch (err) {
    await supabase.from('email_logs')
      .update({ status: 'failed', error_message: err.message })
      .eq('tracking_id', trackingId);
    throw err;
  }
}

// ==================== TRACKING ====================

export async function trackOpen(trackingId) {
  try {
    // Update email_logs
    await supabase.from('email_logs')
      .update({ opened_at: new Date().toISOString() })
      .eq('tracking_id', trackingId)
      .is('opened_at', null);

    // Update campaign opened count
    const { data: log } = await supabase.from('email_logs')
      .select('campaign_id').eq('tracking_id', trackingId).single();

    if (log?.campaign_id) {
      const { data: openedLogs } = await supabase.from('email_logs')
        .select('id')
        .eq('campaign_id', log.campaign_id)
        .not('opened_at', 'is', null);
      
      await supabase.from('campaigns')
        .update({ opened_count: openedLogs?.length || 0 })
        .eq('id', log.campaign_id);
    }
  } catch (err) {
    console.error('Track open error:', err);
  }
}

export async function trackClick(trackingId) {
  try {
    // 1. Try updating email_logs
    const { data: emailLog, error: emailError } = await supabase.from('email_logs')
      .update({ clicked_at: new Date().toISOString() })
      .eq('tracking_id', trackingId)
      .is('clicked_at', null)
      .select('campaign_id').single();

    if (!emailError && emailLog?.campaign_id) {
      const { data: clickedLogs } = await supabase.from('email_logs')
        .select('id')
        .eq('campaign_id', emailLog.campaign_id)
        .not('clicked_at', 'is', null);
      
      await supabase.from('campaigns')
        .update({ clicked_count: clickedLogs?.length || 0 })
        .eq('id', emailLog.campaign_id);
      return;
    }

    // 2. If not found in email_logs, try updating wa_logs
    await supabase.from('wa_logs')
      .update({ clicked_at: new Date().toISOString() }) // Assuming we added this column
      .eq('tracking_id', trackingId)
      .is('clicked_at', null);

  } catch (err) {
    console.error('Track click error:', err);
  }
}
