require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
require('./config/passport'); // Passport strategy

// -------------------- INIT APP --------------------
const app = express();
connectDB();

// -------------------- SERVER + SOCKET --------------------
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});
require('./socket')(io);

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
app.use('/api/friends', require('./routes/friends'));   // ✔ BẠN YÊU CẦU THÊM Ở ĐÂY
app.use('/api/chat', require('./routes/chat'));
app.use('/api/upload', require('./routes/upload'));

// -------------------- BASE ROUTE --------------------
app.get("/", (req, res) => {
    res.send("Chat App API is running...");
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
