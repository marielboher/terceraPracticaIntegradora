import express from "express";
import Handlebars from "handlebars";
import expressHandlebars from "express-handlebars";
import __dirname from "./utils.js";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cartsRouter from "./src/routes/cart.routes.js";
import productsRouter from "./src/routes/product.routes.js";
import viewsRouter from "./src/routes/views.routes.js";
import { messageModel } from "./src/models/message.model.js";
import ProductManager from "./src/dao/ProductManager.js";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import sessionsRouter from "./src/routes/sessions.routes.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import initializePassport from "./src/config/passport.config.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import DBManager from './src/mongo/ds.js';
import { ENV_CONFIG } from "./src/config/config.js";
import emailRouter from "./src/routes/email.routes.js";
import smsRouter from "./src/routes/sms.routes.js";
import mockingRouter from "./src/mocking/mock.router.js";
import { addLogger, devLogger  } from "./src/config/logger.js";
import loggerRouter from "./src/routes/logger.routes.js";

const app = express();
const port = ENV_CONFIG.port || 8000;

const httpServer = app.listen(port, () => {
  devLogger.info("Servidor escuchando en puerto " + port);
});
export const socketServer = new Server(httpServer);

app.set("socketServer", socketServer);

app.engine(
  "handlebars",
  expressHandlebars.engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
  })
);
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");
app.use(express.static(__dirname));
app.use(
  cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"], 
  })
);

app.use(addLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SECRET_KEY_SESSION,
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: false,  
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_CNX_STR,
      collectionName: "sessions"
    }),
  })
);
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
initializePassport();

app.use("/api/products/", productsRouter);
app.use("/api/carts/", cartsRouter);
app.use("/", viewsRouter);
app.use("/api/sessions/", sessionsRouter);
app.use('/email', emailRouter);
app.use('/sms', smsRouter);
app.use('/mockingproducts', mockingRouter);
app.use("/loggerTest", loggerRouter)


const PM = new ProductManager();

socketServer.on("connection", async (socket) => {
  console.log("Un cliente se ha conectado");

  const allProducts = await PM.getProducts();
socket.emit("initial_products", allProducts.payload);


  const previousMessages = await messageModel.find().sort({ timestamp: 1 });
  socket.emit("previous messages", previousMessages);

  socket.on("message", (data) => {
    console.log("Mensaje recibido del cliente:", data);
  });

  socket.on("socket_individual", (data) => {
    console.log("Evento 'socket_individual' recibido:", data);
  });

  socket.on("chat message", async (message) => {
    console.log("Received message object:", JSON.stringify(message, null, 2));

    const newMessage = new messageModel({
      user: message.user,
      message: message.text,
      timestamp: new Date(),
    });
    await newMessage.save();

    socketServer.emit("chat message", {
      user: message.user,
      message: message.text,
    });
  });
});
