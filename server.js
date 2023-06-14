/** بسم الله الرحمن الرحيم */
"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/** start coding point */
app.set("view engine", "pug");
app.set("views", "./views/pug");
const passport = require("passport");
const session = require("express-session");
var morgan = require("morgan");
app.use(morgan("combined"));
const routes = require("./routes");
const auth = require("./auth");
/** change below here */
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());
myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");
  
  routes(app, myDataBase);
  auth(app,myDataBase);
  let currentUsers = 0;
  io.on('connection', (socket) => {
    ++currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has connected',currentUsers);
  });
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

/** change above here */
const PORT = process.env.PORT || 3000;
const URL = process.env.APP_URL || "http://localhost:" + PORT
http.listen(PORT, () => {
  console.log("App is live @ " +  URL );
});
