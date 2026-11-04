import React from 'react';
import { useEffect, useState } from 'react';
import { Copy, LogOut, Trash2, UserPlus, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api('/groups').then(d => { setGroups(d.groups); setError(''); }).catch(e => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const run = async (fn, message) => { setBusy(true); setError(''); setNotice(''); try { await fn(); await load(); if (message) setNotice(message); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const create = e => { e.preventDefault(); run(async () => { await api('/groups', { method: 'POST', body: JSON.stringify(newGroup) }); setNewGroup({ name: '', description: '' }); }, 'Group created. Share its invite code with your friends.'); };
  const join = e => { e.preventDefault(); run(async () => { const d = await api('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode: code }) }); setCode(''); setNotice(`You joined ${d.group.name}.`); }); };
  const leave = g => confirm(`Leave ${g.name}?`) && run(() => api(`/groups/${g._id}/leave`, { method: 'POST' }), 'You left the group.');
  const remove = g => confirm(`Delete ${g.name} for everyone? Photos stay with their owners.`) && run(() => api(`/groups/${g._id}`, { method: 'DELETE' }), 'Group deleted.');
  const copy = async c => { try { await navigator.clipboard.writeText(c); setNotice(`Invite code ${c} copied.`); } catch { setNotice(`Invite code: ${c}`); } };

  return <><Navbar /><main className="page-shell">
    <section className="welcome-row"><div><span className="eyebrow"><Users size={14} /> YOUR CIRCLES</span><h1>Friend <em>groups.</em></h1><p>You see photos from everyone who shares a group with you.</p></div></section>
    <div className="group-forms">
      <form className="upload-card group-form" onSubmit={create}>
        <div className="upload-label">Create a group</div>
        <input value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Group name, e.g. Uni Friends" maxLength={60} required />
        <input value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} placeholder="Short description (optional)" maxLength={200} />
        <button className="primary-button" disabled={busy || !newGroup.name.trim()}><Users size={16} /> Create group</button>
      </form>
      <form className="upload-card group-form" onSubmit={join}>
        <div className="upload-label">Join with an invite code</div>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. a3f9c21b" maxLength={20} required />
        <button className="primary-button" disabled={busy || !code.trim()}><UserPlus size={16} /> Join group</button>
      </form>
    </div>
    {notice && <p className="group-notice">{notice}</p>}
    {error && <p className="form-error">{error}</p>}
    <div className="feed-heading"><div><span className="eyebrow">MEMBERSHIPS</span><h2>My groups</h2></div><span className="result-count">{groups.length} {groups.length === 1 ? 'group' : 'groups'}</span></div>
    {loading ? <div className="empty-state"><div className="spinner" />Loading groups…</div>
      : groups.length === 0 ? <div className="empty-state"><div className="empty-icon"><Users size={25} /></div><h3>You're not in any group yet</h3><p>Create one above, or ask a friend for their invite code.</p></div>
      : <div className="photo-grid">{groups.map(g => {
          const isOwner = String(g.owner?._id) === String(user?.id);
          return <article className="photo-card group-card" key={g._id}>
            <div className="group-card-head"><div><strong>{g.name}</strong><span>{isOwner ? 'You own this group' : `Owner: ${g.owner?.name}`}</span></div>
              {isOwner ? <button className="icon-button" title="Delete group" onClick={() => remove(g)}><Trash2 size={17} /></button> : <button className="icon-button" title="Leave group" onClick={() => leave(g)}><LogOut size={17} /></button>}</div>
            {g.description && <p className="caption">{g.description}</p>}
            <button className="invite-code" onClick={() => copy(g.inviteCode)} title="Copy invite code"><span>Invite code</span><strong>{g.inviteCode}</strong><Copy size={14} /></button>
            <div className="comment-heading"><Users size={16} /><strong>{g.members.length} {g.members.length === 1 ? 'member' : 'members'}</strong></div>
            <div className="member-list">{g.members.map(m => <span key={m._id} className="member-chip">{m.name}</span>)}</div>
          </article>;
        })}</div>}
    <footer className="page-footer">Made for the moments that matter <span>✳</span></footer>
  </main></>;
}
