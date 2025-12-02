require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("./config/db");
const passport = require("passport");
const http = require("http");
const { Server } = require("socket.io");

// express
const app = express();
const server = http.createServer(app);

// socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});
global._io = io;

// middleware
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// passport
app.use(passport.initialize());
require("./config/passport")(passport);

// ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/upload", require("./routes/upload"));

// socket.io logic
io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("join_conversation", convId => {
    socket.join(`conv_${convId}`);
  });

  socket.on("join_user", userId => {
    socket.join(`user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running on port", PORT));
