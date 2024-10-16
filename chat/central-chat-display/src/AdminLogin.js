import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
    console.log('AdminLogin Component Rendered');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        // Hardcoded admin username and password (you can replace this with a real authentication system later)
        const adminUsername = 'admin';
        const adminPassword = 'RSBoit30Pass';

        if (username === adminUsername && password === adminPassword) {
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin');
        } else {
            setError('Invalid credentials.');
        }
    };

    return (
        <div>
        <h3>Admin Login</h3>
        <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
        />
        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default AdminLogin;
