const passport = require("passport");
const bcrypt = require("bcrypt");
module.exports = function (app, myDataBase) {
  app.route("/").get((req, res) => {
    res.render("index", {
      title: "Connected to Database",
      message: "Please log in",
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
    });
  });
  app.route("/chat").get(ensureAuthenticated,(req,res)=>{
    res.render("chat.pug",{ user: req.user })

  })
  app.route("/login").post(
    /**middleware */
    passport.authenticate("local", { failureRedirect: "/" }),
    /** when pass */
    (req, res) => {
      console.log(req)
      res.redirect("/profile");
      //res.json({user:req.user});
    }
  );
  app.route("/logout").get((req, res) => {
    console.log("logout",req)
    req.logout();
    res.redirect("/");
  });
  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    console.log(req)
    res.render("profile", { username: req.user.name });
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
              username: req.body.name,
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
  app.route("/auth/github").get(passport.authenticate("github"))
  app.route("/auth/github/callback").get(
    /**middleware */
    passport.authenticate("github", { failureRedirect: "/" }),
    /** when pass */
    (req, res) => {
      req.session.user_id = req.user.id
      res.redirect("/chat");
      //res.json({user:req.user});
    }
  );

  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });
};

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}
