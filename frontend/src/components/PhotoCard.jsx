import React from 'react';
import { useState } from 'react';
import { Check, CornerDownRight, MessageCircle, Pencil, Send, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
export default function PhotoCard({ photo, onUpdate, onDelete }) {
 const { user } = useAuth(); const [comment, setComment] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const [editingId, setEditingId] = useState(null); const [editText, setEditText] = useState('');
 const [replyTo, setReplyTo] = useState(null); const [replyText, setReplyText] = useState('');
 const isPhotoOwner = String(photo.uploader?._id) === String(user?.id);
 const comments = photo.comments || [];
 const threads = comments.filter(c => !c.parent);
 const repliesOf = id => comments.filter(c => String(c.parent) === String(id));
 const call = async (fn) => { setBusy(true); setError(''); try { const d = await fn(); onUpdate(d.photo); return true; } catch(err) { setError(err.message); return false; } finally { setBusy(false); } };
 const post = (text, parentId) => api(`/photos/${photo._id}/comments`, { method:'POST', body:JSON.stringify(parentId ? { text, parentId } : { text }) });
 const submit = async e => { e.preventDefault(); if (!comment.trim()) return; if (await call(() => post(comment))) setComment(''); };
 const submitReply = async e => { e.preventDefault(); if (!replyText.trim()) return; if (await call(() => post(replyText, replyTo.threadId))) { setReplyTo(null); setReplyText(''); } };
 const startReply = (c, threadId) => { const name = c.user?.name || 'User'; setEditingId(null); setReplyTo({ threadId, name }); setReplyText(c.parent ? `@${name} ` : ''); };
 const saveEdit = async e => { e.preventDefault(); if (!editText.trim()) return; if (await call(() => api(`/photos/${photo._id}/comments/${editingId}`, { method:'PUT', body:JSON.stringify({text:editText}) }))) setEditingId(null); };
 const removeComment = c => { const msg = !c.parent && repliesOf(c._id).length ? 'Delete this comment and its replies?' : 'Delete this comment?'; if (confirm(msg)) call(() => api(`/photos/${photo._id}/comments/${c._id}`, { method:'DELETE' })); };
 const date = new Date(photo.createdAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
 const renderComment = (c, threadId) => { const mine = String(c.user?._id) === String(user?.id);
  if (editingId === c._id) return <form className="comment comment-edit" key={c._id} onSubmit={saveEdit}><input value={editText} onChange={e=>setEditText(e.target.value)} maxLength={500} autoFocus/><button className="icon-button" disabled={busy || !editText.trim()} title="Save"><Check size={14}/></button><button type="button" className="icon-button" onClick={()=>setEditingId(null)} title="Cancel"><X size={14}/></button></form>;
  return <div className="comment-block" key={c._id}><div className="comment"><strong>{c.user?.name || 'User'}</strong><span>{c.text}{c.edited && <em className="edited-tag"> (edited)</em>}</span>
   {(mine || isPhotoOwner) && <span className="comment-actions">{mine && <button className="icon-button" title="Edit comment" onClick={()=>{setReplyTo(null); setEditingId(c._id); setEditText(c.text);}}><Pencil size={12}/></button>}<button className="icon-button" title="Delete comment" onClick={()=>removeComment(c)}><Trash2 size={12}/></button></span>}</div>
   <button type="button" className="reply-button" onClick={()=>startReply(c, threadId)}>Reply</button></div>; };
 return <article className="photo-card"><div className="photo-author"><div className="avatar">{photo.uploader?.name?.[0]?.toUpperCase() || '?'}</div><div className="author-info"><strong>{photo.uploader?.name || 'Unknown user'}</strong><span>{date}</span></div>{isPhotoOwner && <button className="icon-button delete-button" title="Delete photo" onClick={()=>onDelete(photo._id)}><Trash2 size={17}/></button>}</div><img className="photo-image" src={photo.imageUrl} alt={photo.caption || 'Shared photo'} /><div className="photo-content">{photo.caption && <p className="caption">{photo.caption}</p>}<div className="comment-heading"><MessageCircle size={16}/><strong>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</strong></div>
 <div className="comments-list">{threads.map(t => { const replies = repliesOf(t._id); return <div className="comment-thread" key={t._id}>
  {renderComment(t, t._id)}
  {replies.length > 0 && <div className="replies">{replies.map(r => renderComment(r, t._id))}</div>}
  {replyTo?.threadId === t._id && <form className="comment comment-edit reply-form" onSubmit={submitReply}><CornerDownRight size={13}/><input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder={`Reply to ${replyTo.name}…`} maxLength={500} autoFocus/><button className="icon-button" disabled={busy || !replyText.trim()} title="Send reply"><Send size={13}/></button><button type="button" className="icon-button" onClick={()=>setReplyTo(null)} title="Cancel"><X size={13}/></button></form>}
 </div>; })}</div>
 <form className="comment-form" onSubmit={submit}><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Write a kind comment…" maxLength={500}/><button disabled={busy || !comment.trim()} aria-label="Post comment"><Send size={17}/></button></form>{error && <p className="inline-error">{error}</p>}</div></article>
}
