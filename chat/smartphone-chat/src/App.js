import './App.scss';
import React, { useState, useEffect, useRef, Component } from 'react';
import io from 'socket.io-client';

const socket = io('https://runescape-party-chat-backend.onrender.com/');  // Connect to backend
//const socket = io('localhost:3001');

// TODO Chat badges?
function App() {
  const [username, setUsername] = useState('');
  const [ironmanType, setIronmanType] = useState('normal'); // 'normal' , 'iron', or 'hardcore'
  const [badge, setBadge] = useState('');
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

      socket.on('log-in', (user) => {
        setUsername(user.username);
        setBadge(user.badge);
        setLoggedIn(true);
      });

      socket.on('log-in-failed', () => {
        setError('Username ' + username + ' already taken.');
      });

      socket.off('chat-message');
      socket.on('chat-message', (newMessage) => {
        console.log(newMessage.message + " " + newMessage.textEffect + " " + newMessage.colorEffect);
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

  useEffect(() => {
    scrollDown();
  }, [loggedIn]);

  const sendMessage = () => {
      if (message.trim()) {
        var messageWithoutEffects = message;
        const colorEffect = checkColorEffect(messageWithoutEffects);
        if (colorEffect !== "none") {
          messageWithoutEffects = messageWithoutEffects.substring(colorEffect.length + 1);
        }
        const textEffect = checkTextEffect(messageWithoutEffects);
        if (textEffect !== "none") {
          messageWithoutEffects = messageWithoutEffects.substring(textEffect.length + 1);
        }
        const chatMessage = { username, messageWithoutEffects, colorEffect, textEffect, badge };
        socket.emit('chat-message', chatMessage);
        setMessage('');  // Clear the input after sending
      }
  };

  const checkColorEffect = (message) => {

    message = message.toLowerCase();
    var effect = "None";
    if (message.startsWith("red:")) {
      effect = "red";
    } else if (message.startsWith("yellow:")) {
      effect = "yellow";
    } else if (message.startsWith("green:")) {
      effect = "green";
    } else if (message.startsWith("cyan:")) {
      effect = "cyan";
    } else if (message.startsWith("purple:")) {
      effect = "purple";
    } else if (message.startsWith("white:")) {
      effect = "white";
    } else if (message.startsWith("flash1:")) {
      effect = "flash1";
    } else if (message.startsWith("flash2:")) {
      effect = "flash2";
    } else if (message.startsWith("flash3:")) {
      effect = "flash3";
    } else if (message.startsWith("glow1:")) {
      effect = "glow1";
    } else if (message.startsWith("glow2:")) {
      effect = "glow2";
    } else if (message.startsWith("glow3:")) {
      effect = "glow3";
    } else {
      effect = "none";
    }

    return effect;
  };

  const checkTextEffect = (message) => {

    message = message.toLowerCase();
    var effect;
    if (message.startsWith("wave:")) {
      effect = "wave";
    } else if (message.startsWith("wave2:")) {
      effect = "wave2";
    } else if (message.startsWith("shake:")) {
      effect = "shake";
    } else if (message.startsWith("slide:")) {
      effect = "slide";
    } else if (message.startsWith("scroll:")) {
      effect = "scroll";
    } else {
      effect = "none";
    }

    return effect;
  }

  const handleLogin = () => {
    if (validateUsername()) {

      

      const badgeValue = checkBadge();
      console.log("User " + username + " logged in with badge: " + badgeValue);
      const user = { username, badge: badgeValue };
      socket.emit('log-in', user);
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

  const checkBadge = () => {
    
    const admins = ["Epic Toxic", "Zezima", "I Trolled U2", "Fonsken1", "Nozmas", "GroteSpeler94", "Mod Proske", "Bram352"]
    
    if (admins.includes(username)) {
      return "/assets/Jagex_moderator_emblem.png";
    }

    const djs = ["GgEzSakkeEzGg", "Bifi"];
    if (djs.includes(username)) {
      return "/assets/Dj_chat_badge.png";
    }

    // Assign badge based on Ironman selection
    if (ironmanType === 'iron') {
      return "/assets/Ironman_chat_badge.png";
    } else if (ironmanType === 'hardcore') {
      return "/assets/Hardcore_ironman_chat_badge.png";
    }
    return null;
  }

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

  const renderMessageContent = (msg) => {
    // If the text effect is 'wave', split the message into individual characters
    if (msg.textEffect === 'wave') {
      return msg.message.split('').map((char, index) => (
        <span key={index} className={`char${index + 1}`}>
          {char}
        </span>
      ));
    }
    // Otherwise, just return the message as normal text
    return msg.message;
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

                  <div className="ironman-selection">
                    <label>
                      <input
                        type="radio"
                        value="normal"
                        checked={ironmanType === 'normal'}
                        onChange={() => setIronmanType('normal')}
                      />
                      Normal
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="iron"
                        checked={ironmanType === 'iron'}
                        onChange={() => setIronmanType('iron')}
                      />
                      Ironman
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="hardcore"
                        checked={ironmanType === 'hardcore'}
                        onChange={() => setIronmanType('hardcore')}
                      />
                      Hardcore Ironman
                    </label>
                  </div>

                  <button onClick={handleLogin}>Join Chat</button>
              </div>
          ) : (
              <div className="chat-container">
                  <div className="chat-messages" id="chat-box" ref={chatBoxRef}>
                      {messages.map((msg, index) => (
                          <div key={index} className="chat-message" ref={index === messages.length - 1 ? messageRef : null}>
                              <div className="system-text">
                                {msg.badge && (
                                  <img
                                    src={msg.badge}
                                    className="chat-badge"
                                  />
                                )}
                                <span className="username">{msg.username}: </span>
                              </div>
                              <div className={`message ${msg.colorEffect} ${msg.textEffect}`}>{renderMessageContent(msg)}</div>
                          </div>
                      ))}
                  </div>
                  <div className="chat-input-container">
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
