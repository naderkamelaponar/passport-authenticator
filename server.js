/** بسم الله الرحمن الرحيم */
"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const app = express();
fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/** start coding point */
app.set("view engine", "pug");
app.set("views", "./views/pug");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { ObjectID } = require("mongodb");
const session = require("express-session");
var morgan = require("morgan");
app.use(morgan("combined"));
const bcrypt = require("bcrypt");
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
  const passLocal = new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false);
      }
      return done(null, user);
    });
  });
  const myDataBase = await client.db("database").collection("users");
  app.route("/").get((req, res) => {
    res.render("index", {
      title: "Connected to Database",
      message: "Please log in",
      showLogin: true,
      showRegistration: true,
    });
  });

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  app.route("/login").post(
    /**middleware */
    passport.authenticate("local", { failureRedirect: "/" }),
    /** when pass */
    (req, res) => {
      res.redirect("/profile");
    }
  );
  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });
  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    res.render("profile", { username: req.user.username });
  });
  app.route("/register").post(
    (req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        const hash = bcrypt.hashSync(req.body.password, 12);
        if (err) {
          next(err);
        } else if (user) {
          res.redirect("/");
        } else {
          /** insert new */
          myDataBase.insertOne(
            {
              username: req.body.username,
              password: hash,
            },
            (err, doc) => {
              if (err) {
                res.redirect("/");
              } else {
                next(null, doc.ops[0]);
              }
            }
          );
        }
      });
    },
    passport.authenticate("local", { failureRedirect: "/" }),
    /** when pass */
    (req, res) => {
      res.redirect("/profile");
    }
  );
  passport.use(passLocal);
  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });
});
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

/** change above here */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Go to http://localhost:" + PORT);
});
