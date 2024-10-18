import "./App.scss";
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://runescape-party-chat-backend.onrender.com/");
//const socket = io('localhost:3001');

function CentralChatDisplay() {
  const [messages, setMessages] = useState([]);

  const processing = useRef(false);
  const messageBuffer = useRef([]);
  const chatBoxRef = useRef(null); // Reference to the chat box

  useEffect(() => {
    socket.on("load-messages", (loadedMessages) => {
      setMessages(loadedMessages);
    });

    socket.off("chat-message");
    socket.on("chat-message", (newMessage) => {
      console.log(newMessage.message + " " + newMessage.textEffect + " " + newMessage.colorEffect);
      // Check if the message with the same id exists in the array
      const index = messageBuffer.current.findIndex(
        (msg) => msg.id === newMessage.id
      );

      if (index !== -1) {
        // Update the existing message by creating a new array with the updated message
        const updatedMessages = [...messageBuffer.current];
        updatedMessages[index] = newMessage;
        messageBuffer.current = updatedMessages;
      } else {
        // If message doesn't exist, add it to the array
        messageBuffer.current = [...messageBuffer.current, newMessage];
      }
    });


    const interval = setInterval(() => {
      !processing.current && onProcessingMessage();
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Automatically process buffer when there's a new message
  const onProcessingMessage = () => {
    if (messageBuffer.current.length > 0) {
      const [currentMessage, ...rest] = messageBuffer.current;
      messageBuffer.current = rest;

      if (currentMessage.username ==="admin") {
          document.getElementById("input-badge").removeAttribute("src");
          document.getElementById("input-badge").style.display = "none";
          document.getElementById("input-username").style.display = "none";
          document.getElementById("input-message").classList.add("system-text");
      } else {
        if (currentMessage.badge) {
          document.getElementById("input-badge").setAttribute("src", currentMessage.badge);
          document.getElementById("input-badge").style.display = "inline";
        }
        document.getElementById("input-username").innerHTML = currentMessage.username + ": ";
      }

      typeWriter(0, currentMessage);
      processing.current = true;
    }
  };

  const typeWriter = (index, currentMessage) => {
    if (index < currentMessage.message.length) {
      document.getElementById("input-message").innerHTML +=
        currentMessage.message.charAt(index);

      setTimeout(() => {
        typeWriter(index + 1, currentMessage);
      }, 75);
    } else {
      processing.current = false;


      document.getElementById("input-username").innerHTML = "Username: ";
      document.getElementById("input-username").style.display = "block";
      document.getElementById("input-badge").style.display = "none";
      document.getElementById("input-badge").setAttribute("src", "");
      document.getElementById("input-message").innerHTML = "";
      document.getElementById("input-message").classList.remove("system-text");

      setMessages((prevMessages) => {
        // Check if the message with the same id exists in the array
        const index = prevMessages.findIndex(
          (msg) => msg.id === currentMessage.id
        );

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
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const renderMessageContent = (msg) => {
    // If the text effect is 'wave', split the message into individual characters
    if (msg.textEffect === 'wave') {
        return (
          <span className={msg.colorEffect}>
            <span className={msg.textEffect}>
              {
                msg.message.split('').map((char, index) => (
                  <span key={index} className={`char${index + 1}`}>
                      {char}
                  </span>
                ))
              }
            </span>
          </span>
        );

    }
    // Otherwise, just return the message as normal text with animation classes
    return (
      <span className={msg.colorEffect}>
        <span className={msg.textEffect}>
          {msg.message}
        </span>
      </span>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-top"/>
      <div className="chat-messages" id="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            {msg.username !== "admin" && (
              <span className="system-text">
                {msg.badge && (
                  <img
                    src={msg.badge}
                    alt=""
                    className="chat-badge"
                  />
                )}
                <span className="username">{msg.username}: </span>
              </span>
            )}
            <span className={msg.username === "admin" ? `system-text` : `message`}>
              {renderMessageContent(msg)}
            </span>
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <div id="input-message-container">
          <span className="system-text">
            <img id="input-badge" style={{display : "none"}} alt="" className="chat-badge"/>
            <span id="input-username" className="username">Username: </span>
          </span>
          <div id="input-message"></div>
        </div>
      </div>
    </div>
  );
}

export default CentralChatDisplay;
