import './Admin.scss';
import React, { useState, useEffect } from 'react';
import io from "socket.io-client";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

//const url = "http://localhost:3001";
const url = "https://runescape-party-chat-backend.onrender.com/";

//const socket = io("localhost:3001");
const socket = io("https://runescape-party-chat-backend.onrender.com/");

function Admin() {
    console.log('Admin Component Rendered');
    const [systemMessage, setSystemMessage] = useState('');
    const [usernameToDelete, setUsernameToDelete] = useState('');
    const [usernameToDeleteBadge, setUsernameToDeleteBadge] = useState('');
    const [feedback, setFeedback] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Check if the user is logged in as an admin
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            navigate('/admin-login');  // Redirect to login page if not an admin
        }
    }, [navigate]);

    // Function to clear users
    const clearUsers = async () => {
        try {
            const response = await fetch(url + '/clear-users', { method: 'DELETE' });
        if (response.ok) {
            setFeedback('All users cleared successfully.');
        } else {
            setFeedback('Failed to clear users.');
        }
        } catch (error) {
            setFeedback('Error: ' + error.message);
        }
    };

    // Function to clear messages
    const clearMessages = async () => {
        try {
        const response = await fetch(url + '/clear-messages', { method: 'DELETE' });
        if (response.ok) {
            setFeedback('All messages cleared successfully.');
        } else {
            setFeedback('Failed to clear messages.');
        }
        } catch (error) {
            setFeedback('Error: ' + error.message);
        }
    };

    // Function to delete a user by username
    const deleteUserByUsername = async () => {
        if (!usernameToDelete) {
            setFeedback('Please enter a username.');
            return;
        }
        try {
            const response = await fetch(url + `/delete-user/${usernameToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                setFeedback(`User ${usernameToDelete} deleted successfully.`);
            } else {
                setFeedback(`Failed to delete user ${usernameToDelete}.`);
            }
        } catch (error) {
        setFeedback('Error: ' + error.message);
        }
    };

    // Function to remove a badge from a user
    const removeBadgeFromUser = async () => {
        if (!usernameToDeleteBadge) {
            setFeedback('Please enter a username.');
            return;
        }
        try {
            // Using axios for the PUT request
            const response = await axios.put(url + '/remove-badge', {
                usernameToDeleteBadge
            });
            setFeedback(response.data); // Set success message
        } catch (error) {
            if (error.response) {
                // Handle server response errors
                setFeedback(error.response.data);
            } else {
                // Handle network or other errors
                setFeedback('Error updating badge.');
            }
        }
    };

    // Function to send a system message
    const sendSystemMessage = () => {
        if (!systemMessage.trim()) {
            setFeedback('Please enter a message.');
            return;
        }
        socket.emit('system-message', { text: systemMessage });
        setFeedback('System message sent!');
    };

    // Function to download chat logs
    const downloadChatLogs = async () => {
        try {
            const response = await fetch(url + '/chat-logs');
            if (!response.ok) {
                throw new Error('Failed to fetch chat logs');
            }

            const chatLogs = await response.json();
            const csvContent = convertToCSV(chatLogs); // Convert to CSV
            downloadCSV(csvContent, 'chat_logs.csv'); // Download CSV file
            setFeedback('Chat logs downloaded successfully.');
        } catch (error) {
            setFeedback('Error: ' + error.message);
        }
    };

    // Convert chat logs to CSV format
    const convertToCSV = (logs) => {
        const header = ['Timestamp', 'Username', 'Message', 'colorEffect', 'textEffect', 'badge'];
        const rows = logs.map(log => [log.timestamp, log.username, log.content, log.colorEffect, log.textEffect, log.badge]);
        return [header, ...rows].map(e => e.join(",")).join("\n");
    };

    // Function to download CSV file
    const downloadCSV = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="admin-page">
            <h2 className="admin-title">Admin Page</h2>
            
            <div className="message-section">
                <h3 className="section-title">Send System Message</h3>
                <input
                    type="text"
                    value={systemMessage}
                    maxLength="80" 
                    onChange={(e) => setSystemMessage(e.target.value)}
                    placeholder="Enter message"
                    className="input-message"
                />
                <button onClick={sendSystemMessage} className="button-send">Send</button>
            </div>
    
            <div className="action-section">
                <h3 className="section-title">Clear DB tables</h3>
                <button onClick={clearMessages} className="button-action">Clear Messages</button>
                <button onClick={clearUsers} className="button-action">Clear Users</button>
            </div>
    
            <div className="delete-user-section">
                <h3 className="section-title">Delete User by Username</h3>
                <input
                    type="text"
                    value={usernameToDelete}
                    onChange={(e) => setUsernameToDelete(e.target.value)}
                    placeholder="Enter username"
                    className="input-username"
                />
                <button onClick={deleteUserByUsername} className="button-delete">Delete User</button>
            </div>
    
            <div className="remove-badge-section">
                <h3 className="section-title">Remove Badge from User</h3>
                <input
                    type="text"
                    value={usernameToDeleteBadge}
                    onChange={(e) => setUsernameToDeleteBadge(e.target.value)}
                    placeholder="Enter username"
                    className="input-username"
                />
                <button onClick={removeBadgeFromUser} className="button-remove-badge">Remove Badge</button>
            </div>
    
            <div className="download-section">
                <button onClick={downloadChatLogs} className="button-download">Download Chat Logs</button>
            </div>
    
            {feedback && <p className="feedback-message">{feedback}</p>}
        </div>
    );
}

export default Admin;
