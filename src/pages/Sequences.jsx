import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, MessageCircle, Play, ChevronRight, Save, X, Layers } from 'lucide-react';
import API from '../config';

const Sequences = () => {
  const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [steps, setSteps] = useState([]);
  
  // New Campaign Form
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', industry: '', description: '' });

  useEffect(() => {
    fetchCampaigns();
  }, [token]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/sequences/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCampaigns(data || []);
    } catch (err) {
      console.error('Fetch campaigns error', err);
    }
    setLoading(false);
  };

  const fetchSteps = async (campaignId) => {
    try {
      const res = await fetch(`${API}/api/sequences/campaigns/${campaignId}/steps`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSteps(data || []);
    } catch (err) {
      console.error('Fetch steps error', err);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.name) return;
    try {
      const res = await fetch(`${API}/api/sequences/campaigns`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCampaign)
      });
      const data = await res.json();
      if (res.ok) {
        fetchCampaigns();
        setShowNewModal(false);
        setNewCampaign({ name: '', industry: '', description: '' });
      } else {
        alert('Failed to create sequence: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Create campaign error', err);
      alert('Network error while creating sequence.');
    }
  };

  const addStep = async () => {
    if (!activeCampaign) return;
    const nextDay = steps.length > 0 ? steps[steps.length - 1].day_offset + 2 : 0;
    const newStep = {
      day_offset: nextDay,
      channel: 'whatsapp',
      template_body: "Hi {{contact_name}}, noticed your business in {{city}}..."
    };
    
    try {
      const res = await fetch(`${API}/api/sequences/campaigns/${activeCampaign.id}/steps`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStep)
      });
      const data = await res.json();
      if (res.ok) {
        fetchSteps(activeCampaign.id);
      } else {
        alert('Failed to add step: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Add step error', err);
      alert('Network error while adding step.');
    }
  };

  const selectCampaign = (campaign) => {
    setActiveCampaign(campaign);
    fetchSteps(campaign.id);
  };

  const deleteCampaign = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure? This will delete the sequence and stop all active enrollments.")) return;
    try {
      const res = await fetch(`${API}/api/sequences/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        fetchCampaigns();
        if (activeCampaign?.id === id) setActiveCampaign(null);
      } else {
        alert(data.error || 'Failed to delete sequence');
      }
    } catch (err) { 
      console.error('Delete error', err);
      alert('Network error during deletion');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1><Layers size={28} color="var(--primary)" /> Automation <span className="text-gradient">Drip Engine</span></h1>
          <p className="text-muted">Create multi-step sequences. Leads enrolled here will receive messages at programmed intervals.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNewModal(true)}>
          <Plus size={18} /> New Sequence
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Sequence List */}
        <div className="admin-card glass-panel" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Active Sequences</h2>
          {loading ? (
             <div className="text-muted text-center" style={{padding: '2rem'}}>Loading...</div>
          ) : campaigns.length === 0 ? (
             <div className="text-muted text-center" style={{padding: '2rem'}}>No sequences yet.</div>
          ) : (
            campaigns.map(c => (
              <div 
                key={c.id} 
                className={`sidebar-item ${activeCampaign?.id === c.id ? 'active' : ''}`}
                style={{ padding: '15px', marginBottom: '10px', borderRadius: '12px', border: activeCampaign?.id === c.id ? '1px solid var(--primary)' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => selectCampaign(c)}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block' }}>{c.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.industry || 'All Industries'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    onClick={(e) => deleteCampaign(c.id, e)}
                    style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.4)', padding: '4px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
                    className="delete-item-btn"
                    title="Delete Sequence"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} className="item-chevron" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Builder View */}
        <div className="admin-card glass-panel" style={{ minHeight: '60vh' }}>
          {activeCampaign ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{activeCampaign.name}</h2>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>{activeCampaign.description || 'No description provided.'}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                   <button className="btn-secondary" style={{ padding: '8px 15px' }} onClick={addStep}>
                     <Plus size={18} /> Add Step
                   </button>
                </div>
              </div>

              {steps.length === 0 ? (
                <div className="text-center" style={{ padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                  <Calendar size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p className="text-muted">This sequence is empty. Add your first step to begin.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                         <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{idx + 1}</div>
                         {idx < steps.length - 1 && <div style={{ width: '2px', height: '40px', background: 'linear-gradient(to bottom, var(--primary), transparent)' }}></div>}
                      </div>
                      <div className="admin-card" style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.03)', marginTop: 0 }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                              DAY {step.day_offset === 0 ? '1 (Immediately)' : step.day_offset + 1}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>via {step.channel.toUpperCase()}</span>
                         </div>
                         <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {step.template_body}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center" style={{ padding: '6rem' }}>
              <Layers size={64} className="text-muted" style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
              <h3>Select a Sequence to view builder</h3>
              <p className="text-muted">Or create a new one to start your automation.</p>
            </div>
          )}
        </div>
      </div>

      {/* NEW CAMPAIGN MODAL */}
      {showNewModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
          <div className="admin-card glass-panel" style={{ width: '500px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setShowNewModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New <span className="text-gradient">Sequence</span></h2>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>Sequence Name</label>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="e.g. Local Dentist Outreach v1" 
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>Target Industry (Optional)</label>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="e.g. Dentist, Hospital"
                value={newCampaign.industry}
                onChange={(e) => setNewCampaign({ ...newCampaign, industry: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Internal Description</label>
              <textarea 
                className="admin-input" 
                style={{ height: '80px', resize: 'none' }}
                placeholder="What is the goal of this sequence?"
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
              ></textarea>
            </div>

            <button className="btn-primary w-full" style={{ padding: '12px' }} onClick={createCampaign}>
              Create Sequence
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sequences;
