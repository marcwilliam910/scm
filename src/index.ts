import "dotenv/config";
import express from "express";
import {connectDB} from "./db";
import "./cloud";
import authRouter from "./routes/auth";
import productRouter from "./routes/products";
import conversationRouter from "./routes/conversation";
import {isAuth} from "./middlewares/auth";
import cors from "cors";
import http from "http";
import {Server} from "socket.io";
import {TokenExpiredError, verify} from "jsonwebtoken";
import ConversationModel from "./models/conversation";

type MessageProfile = {
  id: string;
  name: string;
  avatar?: string;
};

type IncomingMessage = {
  message: {
    id: string;
    createdAt: string;
    text: string;
    user: MessageProfile;
  };
  to: string;
  conversationId: string;
};

type OutgoingMessageResponse = {
  message: {
    id: string;
    createdAt: string;
    text: string;
    user: MessageProfile;
  };
  from: MessageProfile;
  conversationId: string;
};

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket-message",
  cors: {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"],
  },
});

// Allow all origins for testing
app.use(
  cors({
    origin: "*", // Allow all origins for testing
    credentials: false, // Set to false when allowing all origins
  })
);

app.use(express.static("src/public"));
app.use(express.json());

// Health check endpoint for Render
app.get("/", (req, res) => {
  res.json({
    message: "Server is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRouter);
app.use("/product", isAuth, productRouter);
app.use("/conversation", isAuth, conversationRouter);

// Socket
io.use((socket, next) => {
  const socketReq = socket.handshake.auth;

  if (!socketReq?.token) return next(new Error("Unauthorized request"));

  try {
    socket.data.jwtDecode = verify(
      socketReq.token,
      process.env.JWT_SECRET as string
    );
  } catch (error) {
    if (error instanceof TokenExpiredError)
      return next(new Error("Token expired"));

    return next(new Error("Invalid token"));
  }

  next();
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const socketData = socket.data as {jwtDecode: {id: string}};
  const userId = socketData.jwtDecode.id;

  socket.join(userId);

  socket.on("chat:new", async (data: {newMessage: IncomingMessage}) => {
    const {conversationId, message, to: receiver} = data.newMessage;

    await ConversationModel.findByIdAndUpdate(conversationId, {
      $push: {
        chats: {
          sentBy: message.user.id,
          text: message.text,
          createdAt: message.createdAt,
        },
      },
    });

    const messageResponse: OutgoingMessageResponse = {
      message: message,
      from: message.user,
      conversationId: conversationId,
    };

    socket.to(receiver).emit("chat:message", {message: messageResponse});
  });

  socket.on("chat:typing", (typeData: {to: string; isTyping: boolean}) => {
    socket.to(typeData.to).emit("chat:typing", {typing: typeData.isTyping});
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(function (err, req, res, next) {
  res.status(500).json({
    message: err.message,
  });
} as express.ErrorRequestHandler);

// Use environment variable for port (Render provides this)
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
