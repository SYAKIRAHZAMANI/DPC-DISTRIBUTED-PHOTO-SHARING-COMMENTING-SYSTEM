import React from 'react';
import { useState } from 'react';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
export default function PhotoCard({ photo, onUpdate, onDelete }) {
 const { user } = useAuth(); const [comment, setComment] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const submit = async e => { e.preventDefault(); if (!comment.trim()) return; setBusy(true); setError(''); try { const d = await api(`/photos/${photo._id}/comments`, { method:'POST', body:JSON.stringify({text:comment}) }); onUpdate(d.photo); setComment(''); } catch(err) { setError(err.message); } finally { setBusy(false); } };
 const date = new Date(photo.createdAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
 return <article className="photo-card"><div className="photo-author"><div className="avatar">{photo.uploader?.name?.[0]?.toUpperCase() || '?'}</div><div className="author-info"><strong>{photo.uploader?.name || 'Unknown user'}</strong><span>{date}</span></div>{String(photo.uploader?._id) === String(user?.id) && <button className="icon-button delete-button" title="Delete photo" onClick={()=>onDelete(photo._id)}><Trash2 size={17}/></button>}</div><img className="photo-image" src={photo.imageUrl} alt={photo.caption || 'Shared photo'} /><div className="photo-content">{photo.caption && <p className="caption">{photo.caption}</p>}<div className="comment-heading"><MessageCircle size={16}/><strong>{photo.comments?.length || 0} comments</strong></div><div className="comments-list">{(photo.comments || []).map(c=><div className="comment" key={c._id}><strong>{c.user?.name || 'User'}</strong><span>{c.text}</span></div>)}</div><form className="comment-form" onSubmit={submit}><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Write a kind comment…" maxLength={500}/><button disabled={busy || !comment.trim()} aria-label="Post comment"><Send size={17}/></button></form>{error && <p className="inline-error">{error}</p>}</div></article>
}
