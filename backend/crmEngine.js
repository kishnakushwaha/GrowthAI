import supabase from './supabaseClient.js';

// ==================== PIPELINE STAGES ====================

export const STAGES = [
  { id: 'new', label: 'New Lead', color: '#6366f1', icon: '🆕' },
  { id: 'contacted', label: 'Contacted', color: '#f59e0b', icon: '📞' },
  { id: 'audit_sent', label: 'Audit Sent', color: '#8b5cf6', icon: '📋' },
  { id: 'call_scheduled', label: 'Call Scheduled', color: '#0ea5e9', icon: '📅' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: '#ec4899', icon: '📄' },
  { id: 'won', label: 'Won ✅', color: '#22c55e', icon: '🏆' },
  { id: 'lost', label: 'Lost', color: '#ef4444', icon: '❌' }
];

// ==================== CRUD OPERATIONS ====================

// Get all leads with optional filters
export async function getLeads(filters = {}) {
  let query = supabase.from('pipeline_leads').select('*');

  if (filters.stage) query = query.eq('stage', filters.stage);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.industry) query = query.eq('industry', filters.industry);
  if (filters.search) {
    query = query.or(`business_name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  query = query.order('updated_at', { ascending: false });

  const { data: leads, error } = await query;
  if (error) {
    console.error('Leads query error:', error.message);
    return { leads: [], stats: {} };
  }

  // Calculate stats from the full pipeline (unfiltered)
  const { data: allLeads, error: statsError } = await supabase.from('pipeline_leads').select('*');
  
  let stats = {};
  if (!statsError && allLeads) {
    const now = new Date();
    stats = {
      total: allLeads.length,
      new_count: allLeads.filter(l => l.stage === 'new').length,
      contacted_count: allLeads.filter(l => l.stage === 'contacted').length,
      audit_sent_count: allLeads.filter(l => l.stage === 'audit_sent').length,
      call_scheduled_count: allLeads.filter(l => l.stage === 'call_scheduled').length,
      proposal_sent_count: allLeads.filter(l => l.stage === 'proposal_sent').length,
      won_count: allLeads.filter(l => l.stage === 'won').length,
      lost_count: allLeads.filter(l => l.stage === 'lost').length,
      total_revenue: allLeads.filter(l => l.stage === 'won').reduce((sum, l) => sum + (l.deal_value || 0), 0),
      pipeline_value: allLeads.filter(l => !['won', 'lost'].includes(l.stage)).reduce((sum, l) => sum + (l.deal_value || 0), 0),
      overdue_followups: allLeads.filter(l => l.next_followup && new Date(l.next_followup) <= now && !['won', 'lost'].includes(l.stage)).length
    };
  }

  return { leads: leads || [], stats };
}

// Create a new lead
export async function createLead(data) {
  const { data: result, error } = await supabase.from('pipeline_leads').insert({
    business_name: data.business_name,
    contact_name: data.contact_name || '',
    email: data.email || '',
    phone: data.phone || '',
    website: data.website || '',
    address: data.address || '',
    industry: data.industry || '',
    source: data.source || 'manual',
    stage: data.stage || 'new',
    priority: data.priority || 'medium',
    deal_value: data.deal_value || 0,
    notes: data.notes || '',
    next_followup: data.next_followup || null
  }).select('id').single();

  if (error) throw new Error(error.message);

  // Log activity
  await supabase.from('activities').insert({
    lead_id: result.id,
    type: 'created',
    title: 'Lead created',
    description: `Source: ${data.source || 'manual'}`
  });

  return result.id;
}

// Update a lead
export async function updateLead(id, data) {
  // Get current lead for change tracking
  const { data: current, error: fetchError } = await supabase
    .from('pipeline_leads').select('*').eq('id', id).single();
  
  if (fetchError || !current) return null;

  const updateData = {};
  const trackChanges = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue;
    updateData[key] = value;
    if (current[key] !== value) {
      trackChanges.push(`${key}: "${current[key]}" → "${value}"`);
    }
  }
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase.from('pipeline_leads').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);

  // Log stage changes as activities
  if (data.stage && data.stage !== current.stage) {
    const stageLabel = STAGES.find(s => s.id === data.stage)?.label || data.stage;
    await supabase.from('activities').insert({
      lead_id: id,
      type: 'stage_change',
      title: `Moved to "${stageLabel}"`,
      description: trackChanges.join(', ')
    });
  }

  return true;
}

// Delete a lead
export async function deleteLead(id) {
  await supabase.from('activities').delete().eq('lead_id', id);
  await supabase.from('pipeline_leads').delete().eq('id', id);
  return true;
}

// ==================== ACTIVITIES ====================

export async function getActivities(leadId) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data || [];
}

export async function addActivity(leadId, data) {
  const { data: result, error } = await supabase.from('activities').insert({
    lead_id: leadId,
    type: data.type,
    title: data.title,
    description: data.description || ''
  }).select('id').single();

  if (error) throw new Error(error.message);

  // Update lead's updated_at
  await supabase.from('pipeline_leads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', leadId);

  return result.id;
}

// ==================== IMPORT FROM SCRAPER ====================

export async function importFromScraper() {
  // Read from Supabase businesses table (scraper now writes there too)
  const { data: businesses, error: fetchError } = await supabase
    .from('businesses').select('*');
  
  if (fetchError) throw new Error(fetchError.message);
  if (!businesses || businesses.length === 0) return 0;

  // Get existing pipeline leads to avoid duplicates
  const { data: existing } = await supabase
    .from('pipeline_leads').select('business_name, phone');

  const existingSet = new Set((existing || []).map(e => `${e.business_name}||${e.phone || ''}`));

  let imported = 0;
  const toInsert = [];

  for (const lead of businesses) {
    const key = `${lead.place_name}||${lead.phone || ''}`;
    if (existingSet.has(key)) continue;

    const isHot = !lead.website || (lead.reviews && lead.reviews < 15);
    toInsert.push({
      business_name: lead.place_name,
      phone: lead.phone || '',
      website: lead.website || '',
      address: lead.address || '',
      industry: lead.industry || '',
      source: 'scraper',
      priority: isHot ? 'high' : 'medium',
      notes: `Rating: ${lead.rating || 'N/A'} | Reviews: ${lead.reviews || 0} | Hot Lead: ${lead.is_hot_lead ? 'Yes' : 'No'}`
    });
  }

  if (toInsert.length > 0) {
    // Supabase batch insert (chunks of 500)
    for (let i = 0; i < toInsert.length; i += 500) {
      const chunk = toInsert.slice(i, i + 500);
      const { error } = await supabase.from('pipeline_leads').insert(chunk);
      if (error) console.error('Batch insert error:', error.message);
      else imported += chunk.length;
    }
  }

  return imported;
}

// ==================== ANALYTICS ====================

export async function getAnalytics() {
  // Pipeline stages
  const { data: allLeads } = await supabase.from('pipeline_leads').select('*');
  const leads = allLeads || [];

  // Conversion by stage
  const stageCounts = {};
  leads.forEach(l => {
    if (!stageCounts[l.stage]) stageCounts[l.stage] = { count: 0, total_value: 0 };
    stageCounts[l.stage].count++;
    stageCounts[l.stage].total_value += (l.deal_value || 0);
  });
  const conversionByStage = Object.entries(stageCounts).map(([stage, data]) => ({ stage, ...data }));

  // By source
  const sourceCounts = {};
  leads.forEach(l => {
    const src = l.source || 'unknown';
    if (!sourceCounts[src]) sourceCounts[src] = 0;
    sourceCounts[src]++;
  });
  const bySource = Object.entries(sourceCounts).map(([source, count]) => ({ source, count }));

  // By industry
  const industryCounts = {};
  leads.filter(l => l.industry).forEach(l => {
    if (!industryCounts[l.industry]) industryCounts[l.industry] = { count: 0, won: 0 };
    industryCounts[l.industry].count++;
    if (l.stage === 'won') industryCounts[l.industry].won++;
  });
  const byIndustry = Object.entries(industryCounts).map(([industry, data]) => ({ industry, ...data }));

  // Recent activities (with business name join)
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('*, pipeline_leads(business_name)')
    .order('created_at', { ascending: false })
    .limit(20);

  // Flatten the join
  const activities = (recentActivities || []).map(a => ({
    ...a,
    business_name: a.pipeline_leads?.business_name || 'Unknown'
  }));

  // Overdue follow-ups
  const now = new Date().toISOString().split('T')[0];
  const overdueLeads = leads.filter(l => 
    l.next_followup && l.next_followup <= now && !['won', 'lost'].includes(l.stage)
  );

  return { conversionByStage, bySource, byIndustry, recentActivities: activities, overdueLeads };
}
