require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
require('./config/passport');

const app = express();
connectDB();

// ---------------- SERVER + SOCKET.IO ----------------
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// ======== SOCKET.IO JWT AUTH MIDDLEWARE ==========
io.use((socket, next) => {
    try {
        // token client gửi:
        // io(SERVER_URL, { auth: { token: "JWT_TOKEN" } })
        const token = socket.handshake.auth?.token;

        if (!token) return next(); // cho phép kết nối như guest

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        socket.userId = decoded.id;

        // join phòng cá nhân để nhận tin nhắn & thông báo
        socket.join(`user_${decoded.id}`);

        return next();

    } catch (err) {
        console.warn("Socket auth failed:", err.message);
        return next(); // không chặn connect
    }
});

// =============== SOCKET.IO MAIN ===============
io.on('connection', (socket) => {
    console.log("Client connected:", socket.userId || "Guest");

    socket.on("sendMessage", (data) => {
        const { receiverId, content, messageId } = data;

        io.to(`user_${receiverId}`).emit("receiveMessage", {
            senderId: socket.userId,
            content,
            messageId,
            createdAt: Date.now()
        });
    });

    socket.on("typing", (receiverId) => {
        io.to(`user_${receiverId}`).emit("typing", socket.userId);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.userId || "Guest");
    });
});

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "secret",
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

// -------------------- ROUTES --------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/upload', require('./routes/upload'));

app.get("/", (req, res) => {
    res.send("Chat App API is running.");
});

// -------------------- RUN SERVER --------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
