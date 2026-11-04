import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Upload from './pages/Upload';
import './styles.css';
function AppRoutes(){return <Routes><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/signup" element={<AuthPage mode="signup"/>}/><Route path="/" element={<ProtectedRoute><Home/></ProtectedRoute>}/><Route path="/upload" element={<ProtectedRoute><Upload/></ProtectedRoute>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
export default function App(){return <AuthProvider><BrowserRouter><AppRoutes/></BrowserRouter></AuthProvider>}
