const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Sequelize, DataTypes, Op } = require('sequelize');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Initialize PostgreSQL connection using Sequelize
const sequelize = new Sequelize(/*process.env.DATABASE_URL*/"postgresql://runescape_party_chat_db_user:1j7rvnCJfIgBVw8hgwnlpjEfy3M4av3O@dpg-cs6qd408fa8c7390j37g-a.frankfurt-postgres.render.com/runescape_party_chat_db", {
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
    colorEffect: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    textEffect: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    badge: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    createdAt: {  // Timestamp when the message was created
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,  // Automatically use the current time
    }
}, {
    timestamps: false  // Disable 'updatedAt' field, but keep 'createdAt'
});

const User = sequelize.define('User', {
    username : {
        type: DataTypes.STRING,
        allowNull: false,
    },
    badge: {
        type: DataTypes.STRING,
        allowNull: true,
    }
});

sequelize.sync({ alter: true }).then(() => {
    console.log('Database schema updated successfully.');
}).catch((err) => {
    console.error('Error syncing database:', err);
});

// Clear Messages Endpoint
app.delete('/clear-messages', async (req, res) => {
    try {
        // Destroys all records in the Message table
        await Message.destroy({ where: {}, truncate: true });
        res.status(200).send('All messages cleared successfully.');
    } catch (error) {
        console.error('Error clearing messages:', error);
        res.status(500).send('Error clearing messages.');
    }
});

// Clear Messages Endpoint
app.delete('/clear-users', async (req, res) => {
    try {
        // Destroys all records in the User table
        await User.destroy({ where: {}, truncate: true });
        res.status(200).send('All users cleared successfully.');
    } catch (error) {
        console.error('Error clearing users:', error);
        res.status(500).send('Error clearing users.');
    }
});

const PORT = process.env.PORT || 3001;

io.on('connection', async (socket) => {
    console.log('A user connected');
    try {
        // Fetch existing messages from the database, ordered by createdAt in ascending order
        const messages = await Message.findAll({
            order: [['createdAt', 'ASC']],  // Order by timestamp (oldest first)
        });

        console.log(messages.length);
        // Send the messages to the connected client
        socket.emit('load-messages', messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }

    socket.on('log-in', async (data) => {
        console.log('New user logging in: ', data.username);

        await sequelize.transaction(async (t) => {

            await User.findOrCreate({
                where: {
                    username: {
                        [Op.iLike]: data.username  // Case-insensitive search for PostgreSQL
                    }
                },
                defaults: {
                    username: data.username,
                    badge: data.badge
                },
                transaction: t
            }).then(([userResult, created]) => {
                if (created) {
                    console.log('New user created: ', userResult.username + ' with badge: ' + userResult.badge);
                    socket.emit('log-in', userResult);
                } else {
                    console.log('User already exists ', userResult.username + ' with badge: ' + userResult.badge);
                    socket.emit('log-in-failed');
                }
            });
        });
    });

    socket.on('chat-message', async (data) => {
        console.log('Received a chat message: ' + data.messageWithoutEffects + ' with effects: ' + data.colorEffect + ',' + data.textEffect + ' and badge: ' + data.badge);
        try {
            // Store the new message in the database with the current timestamp
            const newMessage = await Message.create({
                username: data.username,
                message: data.messageWithoutEffects,
                colorEffect: data.colorEffect,
                textEffect: data.textEffect,
                badge: data.badge
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
