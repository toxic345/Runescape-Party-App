import './App.css';
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function CentralChatDisplay() {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socket.on('load-messages', (loadedMessages) => {
            setMessages(loadedMessages);
        });

        socket.off('chat-message');
        socket.on('chat-message', (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        });
    }, []);

    return (
        <div className="central-chat-display">
            <h1>Party Chat Display</h1>
            <div className="chat-box">
                {messages.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.username}:</strong> {msg.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CentralChatDisplay;
