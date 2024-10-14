import './App.css';
import React, { useState, useEffect, useRef, Component } from 'react';
import io from 'socket.io-client';

const socket = io('https://runescape-party-chat-backend.onrender.com/');  // Connect to backend

// TODO Chat badges & colors?
function App() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loggedIn, setLoggedIn] = useState(false);
    const [error, setError] = useState('');
    const chatBoxRef = useRef(null);  // Reference to the chat box
    const messageRef = useRef(null);

    const usernameRegex = /^[a-zA-Z0-9- ]{1,12}$/;

    useEffect(() => {
        socket.on('load-messages', (loadedMessages) => {
            setMessages(loadedMessages);
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

            setTimeout(() => {
              if (chatBoxRef.current && messageRef.current) {
                chatBoxRef.current.scrollTop = Math.min(chatBoxRef.current.scrollHeight, chatBoxRef.current.scrollTop + getChatElementHeight());
              }
            }, 100); // Small delay to ensure the DOM is updated
        });
    }, []);

    const sendMessage = () => {
        if (message.trim()) {
          const chatMessage = { username, message };
          socket.emit('chat-message', chatMessage);
          setMessage('');  // Clear the input after sending
        }
    };

    const handleLogin = () => {
      if (validateUsername()) {

        setLoggedIn(true);
        
        setTimeout(() => {
          scrollDown();
        }, 500); // Small delay to ensure the DOM is updated
      }
    };

    const validateUsername = () => {
      if (!usernameRegex.test(username) || !username.trim()) {
          setError('Username must be 1-12 characters long and contain only letters, numbers, dashes (-), or spaces.');
          return false;
      }
      setError('');
      return true;
    };

    const scrollDown = () => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    };

    const getChatElementHeight = () => {
      
      var totalHeight = 0;
      
      if (messageRef.current) {
        const style = window.getComputedStyle(messageRef.current);
        const marginTop = parseFloat(style.marginTop);
        const marginBottom = parseFloat(style.marginBottom);
        totalHeight = messageRef.current.offsetHeight + marginTop + marginBottom;
      }
      
      return totalHeight;
    };

    return (
        <div className="App">
            {!loggedIn ? (
                <div>
                    <h2>Enter Your Username</h2>
                    <input
                        type="text"
                        maxLength="12"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyUp={(e) => {
                          if (e.key === 'Enter') handleLogin(true);
                        }}
                    />
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <button onClick={handleLogin}>Join Chat</button>
                </div>
            ) : (
                <div class="chat-container">
                    <div class="chat-messages" id="chat-box" ref={chatBoxRef}>
                        {messages.map((msg, index) => (
                            <div key={index} class="chat-message" ref={index === messages.length - 1 ? messageRef : null}>
                                <span class='system-text'>{msg.username}:</span> {msg.message}
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