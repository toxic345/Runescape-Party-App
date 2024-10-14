import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function CentralChatDisplay() {
    const [messages, setMessages] = useState([]);
    const [messageBuffer, setMessageBuffer] = useState([]);
    const [processingMessage, setProcessingMessage] = useState('');
    const chatBoxRef = useRef(null);  // Reference to the chat box

    useEffect(() => {
        socket.on('load-messages', (loadedMessages) => {
            setMessages(loadedMessages);
        });

        socket.off('chat-message');
        socket.on('chat-message', (newMessage) => {
            setMessageBuffer((prevMessages) => {
                // Check if the message with the same id exists in the array
                const index = prevMessages.findIndex((msg) => msg.id === newMessage.id);
                    
                if (index !== -1) {
                    // Update the existing message by creating a new array with the updated message
                    const updatedMessages = [...prevMessages];
                    updatedMessages[index] = newMessage;
                    return updatedMessages;
                } else {
                    // If message doesn't exist, add it to the array
                    return [...prevMessages, newMessage];
                }
            });
        });
    }, []);

    // Automatically process buffer when there's a new message
    useEffect(() => {
        if (messageBuffer.length > 0 && !processingMessage) {
            const [currentMessage, ...rest] = messageBuffer;
            setProcessingMessage(String(currentMessage.message));
            setMessageBuffer(rest);

            var userNameElement = document.createElement('span');
            userNameElement.className = 'system-text';
            userNameElement.innerHTML = currentMessage.username + ': ';

            var inputElement = document.getElementById('input-message');
            inputElement.replaceChild(userNameElement, inputElement.firstChild);

            typeWriter(0);

            setProcessingMessage(null);

            setMessages((prevMessages) => {
                // Check if the message with the same id exists in the array
                const index = prevMessages.findIndex((msg) => msg.id === currentMessage.id);
        
                if (index !== -1) {
                    // Update the existing message by creating a new array with the updated message
                    const updatedMessages = [...prevMessages];
                    updatedMessages[index] = currentMessage;
                    return updatedMessages;
                } else {
                    // If message doesn't exist, add it to the array
                    return [...prevMessages, currentMessage];
                }
            });
        }
    }, [messageBuffer, processingMessage]);

    const typeWriter = (index) => {
        if (index < processingMessage.length) {
            document.getElementById('input-message').innerHTML += processingMessage.charAt(index);
            setTimeout(() => {
                typeWriter(index + 1);
            }, 50);
        }
    };

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
                        <span class='system-text'>{msg.username}:</span> {msg.message}
                    </div>
                ))}
            </div>
            <div class="chat-input-container">
                <p id='input-message'><span class='system-text'>Username: </span></p>
            </div>
        </div>
    );
}

export default CentralChatDisplay;
