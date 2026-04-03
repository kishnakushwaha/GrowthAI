const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const AUTH_FOLDER = path.join(__dirname, '.wwebjs_auth');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Ensure the folder exists
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

// Retrieve the session from Supabase Storage or Database
// For simplicity, we use a single table:
// CREATE TABLE whatsapp_sessions (id string primary key, data text);
async function pullLocalAuth() {
  if (!supabase) return;
  console.log('[SupabaseAuth] Attempting to pull session from database...');
  try {
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('data')
      .eq('id', 'primary')
      .single();

    if (error || !data || !data.data) {
      console.log('[SupabaseAuth] No existing remote session found.');
      return;
    }

    console.log('[SupabaseAuth] Found remote session. Inflating...');
    const buffer = Buffer.from(data.data, 'base64');
    
    // Write buffer to temp zip
    const tmpZipPath = path.join(__dirname, 'session.zip');
    fs.writeFileSync(tmpZipPath, buffer);
    
    // Extract
    const zip = new AdmZip(tmpZipPath);
    zip.extractAllTo(AUTH_FOLDER, true);
    
    // Cleanup
    fs.unlinkSync(tmpZipPath);
    console.log('[SupabaseAuth] Successfully restored local auth layer from Supabase.');
  } catch (err) {
    console.error('[SupabaseAuth] Pull Failed:', err.message);
  }
}

// Zip the session folder and push it to Supabase
async function pushLocalAuth() {
  if (!supabase) return;
  console.log('[SupabaseAuth] Pushing local auth layer to Supabase...');
  try {
    if (!fs.existsSync(AUTH_FOLDER)) return;

    const zip = new AdmZip();
    zip.addLocalFolder(AUTH_FOLDER);
    const buffer = zip.toBuffer();
    const base64Data = buffer.toString('base64');

    const { error } = await supabase
      .from('whatsapp_sessions')
      .upsert([{ id: 'primary', data: base64Data }], { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseAuth] Upload error:', error.message);
    } else {
      console.log('[SupabaseAuth] Successfully pushed session to Supabase.');
    }
  } catch (err) {
    console.error('[SupabaseAuth] Push Failed:', err.message);
  }
}

module.exports = { pullLocalAuth, pushLocalAuth };
