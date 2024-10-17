import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import AdminLogin from './AdminLogin';
import Admin from './Admin';

function Main() {
    console.log('Main Component Rendered');
    return (
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
        </Routes>
    );
}

export default Main;
