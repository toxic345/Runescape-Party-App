import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function CentralChatDisplay() {
    const [messages, setMessages] = useState([]);
    const chatBoxRef = useRef(null);  // Reference to the chat box

    useEffect(() => {
        socket.on('load-messages', (loadedMessages) => {
            setMessages(loadedMessages);
        });

        socket.off('chat-message');
        socket.on('chat-message', (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        });
    }, []);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div class="chat-container">
            <div class="chat-messages" id="chat-box" ref={chatBoxRef}>
                {messages.map((msg, index) => (
                    <div key={index} class="chat-message">
                        <span id='system-text'>{msg.username}:</span> {msg.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CentralChatDisplay;
