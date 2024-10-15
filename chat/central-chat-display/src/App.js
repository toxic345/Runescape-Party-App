import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://runescape-party-chat-backend.onrender.com/");

function CentralChatDisplay() {
  const [messages, setMessages] = useState([]);
  //const [processingMessage, setProcessingMessage] = useState("");

  const processing = useRef(false);
  const messageBuffer = useRef([]);
  const chatBoxRef = useRef(null); // Reference to the chat box

  useEffect(() => {
    socket.on("load-messages", (loadedMessages) => {
      setMessages(loadedMessages);
    });

    socket.off("chat-message");
    socket.on("chat-message", (newMessage) => {
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

      document.getElementById("userName").innerHTML =
        currentMessage.username + ": ";
      document.getElementById("message").style = { color: "red" };

      typeWriter(0, currentMessage);
      processing.current = true;
    }
  };

  const typeWriter = (index, currentMessage) => {
    if (index < currentMessage.message.length) {
      document.getElementById("message").innerHTML +=
        currentMessage.message.charAt(index);

      setTimeout(() => {
        typeWriter(index + 1, currentMessage);
      }, 50);
    } else {
      processing.current = false;

      document.getElementById("userName").innerHTML = "Username: ";
      document.getElementById("message").innerHTML = "";

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

  return (
    <div className="chat-container">
      <div className="chat-top"/>
      <div className="chat-messages" id="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <div className="system-text">{msg.username}: </div>
            <div>{msg.message}</div>
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <div id="input-message">
          <div className="system-text" id="userName">
            Username:{" "}
          </div>
          <div id="message"></div>
        </div>
      </div>
    </div>
  );
}

export default CentralChatDisplay;
