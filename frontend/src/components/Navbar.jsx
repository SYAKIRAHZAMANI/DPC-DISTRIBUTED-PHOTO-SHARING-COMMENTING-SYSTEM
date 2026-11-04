import React from 'react';
import { Camera, Compass, LogOut, Plus, UserRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Navbar() { const { user, logout } = useAuth(); const navigate = useNavigate(); const signOut = () => { logout(); navigate('/login'); };
return <header className="topbar"><NavLink to="/" className="brand"><span className="brand-icon"><Camera size={19}/></span><span>moments<span className="brand-dot">.</span></span></NavLink><nav className="nav-links"><NavLink to="/" end><Compass size={17}/> Feed</NavLink><NavLink to="/upload"><Plus size={17}/> Share a photo</NavLink></nav><div className="nav-user"><span className="avatar">{user?.name?.[0]?.toUpperCase()}</span><span className="nav-name">{user?.name}</span><button className="icon-button" onClick={signOut} title="Log out"><LogOut size={18}/></button></div></header> }
