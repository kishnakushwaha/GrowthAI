import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// ==================== SEO ANALYZER ====================

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });
    clearTimeout(timeout);
    const html = await response.text();
    const finalUrl = response.url;
    const statusCode = response.status;
    const headers = Object.fromEntries(response.headers.entries());
    return { html, finalUrl, statusCode, headers, error: null };
  } catch (err) {
    clearTimeout(timeout);
    return { html: null, finalUrl: url, statusCode: 0, headers: {}, error: err.message };
  }
}

function analyzeSEO(html, url) {
  const $ = cheerio.load(html);
  const checks = [];
  let score = 0;
  let maxScore = 0;

  // --- TITLE TAG ---
  maxScore += 10;
  const title = $('title').text().trim();
  if (!title) {
    checks.push({ category: 'SEO', item: 'Title Tag', status: 'fail', severity: 'critical', message: 'Missing <title> tag. Search engines need this to rank your page.' });
  } else if (title.length < 30) {
    checks.push({ category: 'SEO', item: 'Title Tag', status: 'warning', severity: 'warning', message: `Title too short (${title.length} chars). Aim for 50-60 characters.`, value: title });
    score += 5;
  } else if (title.length > 70) {
    checks.push({ category: 'SEO', item: 'Title Tag', status: 'warning', severity: 'warning', message: `Title too long (${title.length} chars). Keep under 60 characters.`, value: title });
    score += 6;
  } else {
    checks.push({ category: 'SEO', item: 'Title Tag', status: 'pass', severity: 'good', message: `Good title tag (${title.length} chars)`, value: title });
    score += 10;
  }

  // --- META DESCRIPTION ---
  maxScore += 10;
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  if (!metaDesc) {
    checks.push({ category: 'SEO', item: 'Meta Description', status: 'fail', severity: 'critical', message: 'Missing meta description. This is shown in Google search results.' });
  } else if (metaDesc.length < 70) {
    checks.push({ category: 'SEO', item: 'Meta Description', status: 'warning', severity: 'warning', message: `Description too short (${metaDesc.length} chars). Aim for 150-160.`, value: metaDesc.substring(0, 80) + '...' });
    score += 5;
  } else if (metaDesc.length > 170) {
    checks.push({ category: 'SEO', item: 'Meta Description', status: 'warning', severity: 'warning', message: `Description too long (${metaDesc.length} chars). Keep under 160.`, value: metaDesc.substring(0, 80) + '...' });
    score += 6;
  } else {
    checks.push({ category: 'SEO', item: 'Meta Description', status: 'pass', severity: 'good', message: `Good meta description (${metaDesc.length} chars)` });
    score += 10;
  }

  // --- H1 TAG ---
  maxScore += 8;
  const h1s = $('h1');
  if (h1s.length === 0) {
    checks.push({ category: 'SEO', item: 'H1 Heading', status: 'fail', severity: 'critical', message: 'No H1 heading found. Every page needs exactly one H1.' });
  } else if (h1s.length > 1) {
    checks.push({ category: 'SEO', item: 'H1 Heading', status: 'warning', severity: 'warning', message: `${h1s.length} H1 tags found. Use exactly one H1 per page.` });
    score += 4;
  } else {
    checks.push({ category: 'SEO', item: 'H1 Heading', status: 'pass', severity: 'good', message: 'Single H1 heading found — correct structure.' });
    score += 8;
  }

  // --- HEADING HIERARCHY ---
  maxScore += 5;
  const h2s = $('h2').length;
  const h3s = $('h3').length;
  if (h2s === 0) {
    checks.push({ category: 'SEO', item: 'Heading Structure', status: 'warning', severity: 'warning', message: 'No H2 headings. Use H2/H3 subheadings to structure content.' });
    score += 1;
  } else {
    checks.push({ category: 'SEO', item: 'Heading Structure', status: 'pass', severity: 'good', message: `Good structure: ${h2s} H2 and ${h3s} H3 headings found.` });
    score += 5;
  }

  // --- IMAGE ALT TAGS ---
  maxScore += 8;
  const images = $('img');
  const totalImages = images.length;
  const imagesWithAlt = images.filter((_, el) => $(el).attr('alt') && $(el).attr('alt').trim()).length;
  if (totalImages === 0) {
    checks.push({ category: 'SEO', item: 'Image Alt Tags', status: 'warning', severity: 'warning', message: 'No images found on the page.' });
    score += 4;
  } else if (imagesWithAlt === totalImages) {
    checks.push({ category: 'SEO', item: 'Image Alt Tags', status: 'pass', severity: 'good', message: `All ${totalImages} images have alt text — great for accessibility & SEO.` });
    score += 8;
  } else {
    const missing = totalImages - imagesWithAlt;
    checks.push({ category: 'SEO', item: 'Image Alt Tags', status: 'fail', severity: 'critical', message: `${missing} of ${totalImages} images missing alt text. Hurts SEO and accessibility.` });
    score += Math.round((imagesWithAlt / totalImages) * 8);
  }

  // --- CANONICAL TAG ---
  maxScore += 4;
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    checks.push({ category: 'SEO', item: 'Canonical Tag', status: 'warning', severity: 'warning', message: 'No canonical tag. Helps prevent duplicate content issues.' });
  } else {
    checks.push({ category: 'SEO', item: 'Canonical Tag', status: 'pass', severity: 'good', message: 'Canonical tag present.' });
    score += 4;
  }

  // --- META VIEWPORT ---
  maxScore += 5;
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  if (!viewport) {
    checks.push({ category: 'Mobile', item: 'Viewport Meta', status: 'fail', severity: 'critical', message: 'Missing viewport meta tag — site may not be mobile-friendly!' });
  } else {
    checks.push({ category: 'Mobile', item: 'Viewport Meta', status: 'pass', severity: 'good', message: 'Viewport tag found — mobile-optimized.' });
    score += 5;
  }

  // --- OPEN GRAPH ---
  maxScore += 5;
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
  if (ogCount === 0) {
    checks.push({ category: 'Social', item: 'Open Graph Tags', status: 'fail', severity: 'warning', message: 'No Open Graph tags. Your page won\'t look good when shared on social media.' });
  } else if (ogCount < 3) {
    checks.push({ category: 'Social', item: 'Open Graph Tags', status: 'warning', severity: 'warning', message: `Only ${ogCount}/3 Open Graph tags (title, description, image). Add all three.` });
    score += 2;
  } else {
    checks.push({ category: 'Social', item: 'Open Graph Tags', status: 'pass', severity: 'good', message: 'All Open Graph tags present — great for social sharing.' });
    score += 5;
  }

  // --- SOCIAL MEDIA LINKS ---
  maxScore += 4;
  const links = $('a[href]').map((_, el) => $(el).attr('href')).get();
  const socials = {
    facebook: links.some(l => l.includes('facebook.com')),
    instagram: links.some(l => l.includes('instagram.com')),
    twitter: links.some(l => l.includes('twitter.com') || l.includes('x.com')),
    linkedin: links.some(l => l.includes('linkedin.com')),
    youtube: links.some(l => l.includes('youtube.com'))
  };
  const socialCount = Object.values(socials).filter(Boolean).length;
  if (socialCount === 0) {
    checks.push({ category: 'Social', item: 'Social Media Links', status: 'fail', severity: 'warning', message: 'No social media links found. Add links to your business profiles.' });
  } else {
    const found = Object.entries(socials).filter(([, v]) => v).map(([k]) => k).join(', ');
    checks.push({ category: 'Social', item: 'Social Media Links', status: 'pass', severity: 'good', message: `Found ${socialCount} social links: ${found}` });
    score += Math.min(4, socialCount);
  }

  // --- STRUCTURED DATA ---
  maxScore += 5;
  const jsonLd = $('script[type="application/ld+json"]');
  if (jsonLd.length === 0) {
    checks.push({ category: 'SEO', item: 'Structured Data', status: 'fail', severity: 'warning', message: 'No structured data (JSON-LD) found. Helps Google understand your business.' });
  } else {
    checks.push({ category: 'SEO', item: 'Structured Data', status: 'pass', severity: 'good', message: `${jsonLd.length} structured data block(s) found.` });
    score += 5;
  }

  // --- INTERNAL / EXTERNAL LINKS ---
  maxScore += 4;
  const parsedUrl = new URL(url);
  const allLinks = $('a[href]').map((_, el) => $(el).attr('href')).get();
  const internal = allLinks.filter(l => { try { return new URL(l, url).hostname === parsedUrl.hostname; } catch { return false; } });
  const external = allLinks.filter(l => { try { return new URL(l, url).hostname !== parsedUrl.hostname; } catch { return false; } });
  if (internal.length < 3) {
    checks.push({ category: 'SEO', item: 'Internal Links', status: 'warning', severity: 'warning', message: `Only ${internal.length} internal links. Add more to improve site navigation.` });
    score += 1;
  } else {
    checks.push({ category: 'SEO', item: 'Internal Links', status: 'pass', severity: 'good', message: `${internal.length} internal links and ${external.length} external links.` });
    score += 4;
  }

  // --- ROBOTS META ---
  maxScore += 3;
  const robots = $('meta[name="robots"]').attr('content') || '';
  if (robots.includes('noindex')) {
    checks.push({ category: 'SEO', item: 'Robots Meta', status: 'fail', severity: 'critical', message: 'Page is set to NOINDEX — Google will NOT index this page!' });
  } else {
    checks.push({ category: 'SEO', item: 'Robots Meta', status: 'pass', severity: 'good', message: 'Page is indexable by search engines.' });
    score += 3;
  }

  // --- FAVICON ---
  maxScore += 2;
  const favicon = $('link[rel="icon"], link[rel="shortcut icon"]');
  if (favicon.length === 0) {
    checks.push({ category: 'UX', item: 'Favicon', status: 'warning', severity: 'warning', message: 'No favicon found. Adds professionalism and brand recognition.' });
  } else {
    checks.push({ category: 'UX', item: 'Favicon', status: 'pass', severity: 'good', message: 'Favicon found.' });
    score += 2;
  }

  // --- LANGUAGE TAG ---
  maxScore += 2;
  const lang = $('html').attr('lang');
  if (!lang) {
    checks.push({ category: 'SEO', item: 'Language Tag', status: 'warning', severity: 'warning', message: 'No lang attribute on <html>. Helps search engines understand page language.' });
  } else {
    checks.push({ category: 'SEO', item: 'Language Tag', status: 'pass', severity: 'good', message: `Language set to "${lang}".` });
    score += 2;
  }

  // --- WORD COUNT ---
  maxScore += 5;
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter(w => w.length > 0).length;
  if (wordCount < 300) {
    checks.push({ category: 'Content', item: 'Word Count', status: 'fail', severity: 'critical', message: `Only ${wordCount} words. Google prefers pages with 300+ words of content.` });
    score += 1;
  } else if (wordCount < 600) {
    checks.push({ category: 'Content', item: 'Word Count', status: 'warning', severity: 'warning', message: `${wordCount} words. Good, but aim for 600+ for better ranking.` });
    score += 3;
  } else {
    checks.push({ category: 'Content', item: 'Word Count', status: 'pass', severity: 'good', message: `${wordCount} words — strong content depth.` });
    score += 5;
  }

  const finalScore = Math.round((score / maxScore) * 100);

  return { checks, score: finalScore, wordCount, title: title || 'Untitled', socials };
}

// ==================== SSL CHECK ====================

function checkSSL(url) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'https:') {
        resolve({ status: 'fail', severity: 'critical', message: 'Site does NOT use HTTPS. This is a major security and SEO issue.' });
        return;
      }

      const req = https.request({ hostname: parsedUrl.hostname, port: 443, method: 'HEAD' }, (res) => {
        const cert = res.socket.getPeerCertificate();
        if (cert && cert.valid_to) {
          const expiry = new Date(cert.valid_to);
          const daysLeft = Math.round((expiry - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) {
            resolve({ status: 'fail', severity: 'critical', message: `SSL certificate EXPIRED ${Math.abs(daysLeft)} days ago!` });
          } else if (daysLeft < 30) {
            resolve({ status: 'warning', severity: 'warning', message: `SSL expires in ${daysLeft} days — renew soon.`, daysLeft });
          } else {
            resolve({ status: 'pass', severity: 'good', message: `SSL valid. Expires in ${daysLeft} days.`, daysLeft });
          }
        } else {
          resolve({ status: 'pass', severity: 'good', message: 'HTTPS enabled with valid certificate.' });
        }
      });
      req.on('error', () => {
        resolve({ status: 'warning', severity: 'warning', message: 'Could not verify SSL certificate details.' });
      });
      req.setTimeout(5000, () => { req.destroy(); resolve({ status: 'warning', severity: 'warning', message: 'SSL check timed out.' }); });
      req.end();
    } catch {
      resolve({ status: 'fail', severity: 'critical', message: 'Invalid URL or SSL check failed.' });
    }
  });
}

// ==================== PAGESPEED API ====================

async function getPageSpeedScore(url) {
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    
    if (data.error) {
      return { error: data.error.message };
    }

    const categories = data.lighthouseResult?.categories || {};
    return {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      fcp: data.lighthouseResult?.audits?.['first-contentful-paint']?.displayValue || 'N/A',
      lcp: data.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue || 'N/A',
      cls: data.lighthouseResult?.audits?.['cumulative-layout-shift']?.displayValue || 'N/A',
      speedIndex: data.lighthouseResult?.audits?.['speed-index']?.displayValue || 'N/A',
    };
  } catch (err) {
    return { error: 'PageSpeed API request failed: ' + err.message };
  }
}

// ==================== MAIN AUDIT FUNCTION ====================

export async function runAudit(url) {
  // Normalize URL
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  
  const startTime = Date.now();
  
  // Run all checks in parallel
  const [pageData, sslResult, pageSpeed] = await Promise.all([
    fetchPage(url),
    checkSSL(url),
    getPageSpeedScore(url)
  ]);
  
  if (pageData.error) {
    return {
      url,
      error: `Could not fetch the website: ${pageData.error}`,
      overallScore: 0,
      checks: [],
      pageSpeed: null,
      ssl: { status: 'fail', severity: 'critical', message: 'Site unreachable' },
      duration: Date.now() - startTime
    };
  }
  
  // Run SEO analysis
  const seoResult = analyzeSEO(pageData.html, pageData.finalUrl);
  
  // Add SSL to checks
  seoResult.checks.push({
    category: 'Security',
    item: 'SSL Certificate',
    status: sslResult.status,
    severity: sslResult.severity,
    message: sslResult.message
  });

  // Add PageSpeed checks
  if (!pageSpeed.error) {
    if (pageSpeed.performance < 50) {
      seoResult.checks.push({ category: 'Performance', item: 'Page Speed Score', status: 'fail', severity: 'critical', message: `Performance score: ${pageSpeed.performance}/100 — Very slow! Losing customers.` });
    } else if (pageSpeed.performance < 80) {
      seoResult.checks.push({ category: 'Performance', item: 'Page Speed Score', status: 'warning', severity: 'warning', message: `Performance score: ${pageSpeed.performance}/100 — Needs improvement.` });
    } else {
      seoResult.checks.push({ category: 'Performance', item: 'Page Speed Score', status: 'pass', severity: 'good', message: `Performance score: ${pageSpeed.performance}/100 — Fast!` });
    }

    if (pageSpeed.seo < 80) {
      seoResult.checks.push({ category: 'SEO', item: 'Google SEO Score', status: 'warning', severity: 'warning', message: `Google Lighthouse SEO: ${pageSpeed.seo}/100` });
    } else {
      seoResult.checks.push({ category: 'SEO', item: 'Google SEO Score', status: 'pass', severity: 'good', message: `Google Lighthouse SEO: ${pageSpeed.seo}/100` });
    }
  }

  // Calculate overall score (weighted blend)
  let overallScore = seoResult.score;
  if (!pageSpeed.error) {
    overallScore = Math.round(
      (seoResult.score * 0.4) + 
      (pageSpeed.performance * 0.25) + 
      (pageSpeed.seo * 0.2) + 
      (pageSpeed.accessibility * 0.15)
    );
  }

  // Count by severity
  const critical = seoResult.checks.filter(c => c.severity === 'critical').length;
  const warnings = seoResult.checks.filter(c => c.severity === 'warning').length;
  const passed = seoResult.checks.filter(c => c.severity === 'good').length;

  return {
    url: pageData.finalUrl,
    title: seoResult.title,
    statusCode: pageData.statusCode,
    overallScore,
    grade: overallScore >= 80 ? 'A' : overallScore >= 60 ? 'B' : overallScore >= 40 ? 'C' : overallScore >= 20 ? 'D' : 'F',
    checks: seoResult.checks,
    summary: { critical, warnings, passed, total: seoResult.checks.length },
    pageSpeed: pageSpeed.error ? null : pageSpeed,
    ssl: sslResult,
    socials: seoResult.socials,
    wordCount: seoResult.wordCount,
    duration: Date.now() - startTime,
    analyzedAt: new Date().toISOString()
  };
}
