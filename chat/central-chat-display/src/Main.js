import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminLogin from './AdminLogin';
import Admin from './Admin';

function Main() {
    console.log('Main Component Rendered');
    return (
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </Router>
    );
}

export default Main;