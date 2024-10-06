import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');  // Connect to backend

// TODO Make sure you can't log in with empty name
function App() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loggedIn, setLoggedIn] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    const chatBoxRef = useRef(null);  // Reference to the chat box

    useEffect(() => {
        socket.on('load-messages', (loadedMessages) => {
            setMessages(loadedMessages);

            // Scroll to the bottom after messages are loaded
            setTimeout(() => {
              if (chatBoxRef.current) {
                  chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
              }
            }, 3000); // Small delay to ensure the DOM is updated
        });

        socket.off('chat-message');
        socket.on('chat-message', (newMessage) => {
            setMessages((prevMessages) => {
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

            if (messageSent) {
              setMessageSent(false);
              /*const chatBox = document.getElementById('chat-box');
              chatBox.scrollTop = chatBox.scrollHeight;*/
            }
        });
    }, []);

    // Scroll to the bottom whenever a new message is added
    useEffect(() => {
      if (chatBoxRef.current) {
          chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, [messages]);

    const sendMessage = () => {
        if (message.trim()) {
          const chatMessage = { username, message };
          socket.emit('chat-message', chatMessage);
          setMessage('');  // Clear the input after sending

          setMessageSent(true);
          // Scroll to the bottom
          setTimeout(() => {
            if (chatBoxRef.current) {
                chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
            }
          }, 500); // Small delay to ensure the DOM is updated
        }
    };

    return (
        <div className="App">
            {!loggedIn ? (
                <div>
                    <h2>Enter Your Username</h2>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyUp={(e) => {
                          if (e.key === 'Enter') setLoggedIn(true);
                        }}
                    />
                    <button onClick={() => setLoggedIn(true)}>Join Chat</button>
                </div>
            ) : (
                <div class="chat-container">
                    <div class="chat-messages" id="chat-box" ref={chatBoxRef}>
                        {messages.map((msg, index) => (
                            <div key={index} class="chat-message">
                                <span id='system-text'>{msg.username}:</span> {msg.message}
                            </div>
                        ))}
                    </div>
                    <div class="chat-input-container">
                      <input
                          id="message-input"
                          placeholder="Type your message"
                          maxLength="80"
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyUp={(e) => {
                              if (e.key === 'Enter') sendMessage();
                          }}
                      />
                      <button id="send-button" onClick={sendMessage}>Send</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;