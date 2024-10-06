const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Initialize SQLite connection using Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './chatdb.sqlite', // This file will store the chat data
});

// Define a Message model
const Message = sequelize.define('Message', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    createdAt: {  // Timestamp when the message was created
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,  // Automatically use the current time
    }
}, {
    timestamps: false  // Disable 'updatedAt' field, but keep 'createdAt'
});

// Sync database
sequelize.sync().then(() => {
    console.log('Database synchronized');
});

const PORT = process.env.PORT || 3001;

io.on('connection', async (socket) => {
    console.log('A user connected');

    // Fetch existing messages from the database, ordered by createdAt in ascending order
    const messages = await Message.findAll({
        order: [['createdAt', 'ASC']]  // Order by timestamp (oldest first)
    });

    // Send the messages to the connected client
    socket.emit('load-messages', messages);

    socket.on('chat-message', async (data) => {
        console.log('Received a chat message: ', data.message);
        // Store the new message in the database with the current timestamp
        const newMessage = await Message.create({
            username: data.username,
            message: data.message,
        });

        // Broadcast the new message to all connected clients
        io.emit('chat-message', newMessage);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
