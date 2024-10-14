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

// Initialize PostgreSQL connection using Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false, // Disable logging, remove or set to true to debug SQL queries
    dialectOptions: {
        ssl: {
            require: true, // Enforce SSL connection if using Render/Postgres
            rejectUnauthorized: false, // Disable rejecting self-signed certificates
        },
    },
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
}).catch((err) => {
    console.error('Error synchronizing the database:', err);
});

const PORT = process.env.PORT || 3001;

io.on('connection', async (socket) => {
    console.log('A user connected');

    try {
        // Fetch existing messages from the database, ordered by createdAt in ascending order
        const messages = await Message.findAll({
            order: [['createdAt', 'ASC']],  // Order by timestamp (oldest first)
        });

        // Send the messages to the connected client
        socket.emit('load-messages', messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }

    socket.on('chat-message', async (data) => {
        console.log('Received a chat message: ', data.message);
        try {
            // Store the new message in the database with the current timestamp
            const newMessage = await Message.create({
                username: data.username,
                message: data.message,
            });

            // Broadcast the new message to all connected clients
            io.emit('chat-message', newMessage);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
