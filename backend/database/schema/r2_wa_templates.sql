-- R2: WhatsApp Templates Table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS wa_templates (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  industry text DEFAULT 'general',
  channel text DEFAULT 'whatsapp',
  body text NOT NULL,
  category text DEFAULT 'outreach',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed with the existing hardcoded templates
INSERT INTO wa_templates (name, industry, channel, body, category) VALUES
('Cold Intro - No Website', 'general', 'whatsapp', 'Hey {{business_name}}! 👋 I came across your business in {{city}} and noticed you don''t have a website yet. In 2025, 80%% of customers search online before visiting. I help local businesses like yours get found online. Would you be open to a quick chat about getting your brand online? — GrowthAI', 'outreach'),
('Review Booster', 'general', 'whatsapp', 'Hi {{business_name}}! I saw your Google listing in {{city}} — you have potential but your reviews could use a boost. Businesses with 50+ reviews get 3x more calls. I can help you set up an automated review system. Interested? — GrowthAI', 'outreach'),
('Social Media Gap', 'general', 'whatsapp', 'Hey {{business_name}} 👋 I noticed your social media presence in {{city}} could be stronger. I help businesses like yours grow their Instagram and Facebook to attract local customers. Want to hear how? — GrowthAI', 'outreach'),
('GMB Optimization', 'general', 'whatsapp', 'Hi {{business_name}}! Your Google Maps listing in {{city}} isn''t fully optimized. Businesses with complete profiles get 7x more clicks. I can optimize yours for free as a demo. Want me to show you what I''d fix? — GrowthAI', 'outreach'),
('Follow-Up Gentle', 'general', 'whatsapp', 'Hi {{business_name}}, just following up on my earlier message! I know you''re busy running things in {{city}} 🏃 Just wanted to check if you got a chance to think about boosting your online presence? No pressure at all — GrowthAI', 'followup'),
('Follow-Up Value', 'general', 'whatsapp', 'Hey {{business_name}} — I just helped a {{industry}} business in {{city}} increase their Google calls by 40%%. Thought you might want similar results. Happy to share how — no strings attached! — GrowthAI', 'followup'),
('Follow-Up Final', 'general', 'whatsapp', 'Hi {{business_name}}, this is my last follow-up 🙏 I genuinely think your business in {{city}} has amazing growth potential online. If you ever want to chat about it, my door is always open. Wishing you success! — GrowthAI', 'followup'),
-- Salon specific
('Salon Growth', 'salon', 'whatsapp', 'Hey {{business_name}}! 💇 I help salons in {{city}} get more bookings through Google and Instagram. Your competitors are doing it — want to see how? Quick 5 min chat? — GrowthAI', 'outreach'),
-- Gym specific
('Gym Membership Boost', 'gym', 'whatsapp', 'Hi {{business_name}}! 💪 Noticed your gym in {{city}}. Most gyms lose members in March — I can help you build a retention system that keeps them coming back. Interested? — GrowthAI', 'outreach'),
-- Restaurant specific
('Restaurant Orders', 'restaurant', 'whatsapp', 'Hey {{business_name}}! 🍽️ I help restaurants in {{city}} get more orders without paying Zomato/Swiggy commissions. Want to know how? — GrowthAI', 'outreach'),
-- Clinic specific
('Clinic Patients', 'clinic', 'whatsapp', 'Hi {{business_name}}! 🏥 Patients in {{city}} are searching for doctors on Google before booking. I can help you appear at the top. Quick chat? — GrowthAI', 'outreach'),
-- Real Estate specific
('Real Estate Leads', 'real estate', 'whatsapp', 'Hey {{business_name}}! 🏠 I help real estate businesses in {{city}} generate qualified buyer leads through Google Ads and SEO. Currently getting 3x ROI for similar clients. Want to hear how? — GrowthAI', 'outreach')
ON CONFLICT DO NOTHING;

SELECT COUNT(*) as templates_created FROM wa_templates;
