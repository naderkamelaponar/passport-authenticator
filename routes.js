const passport = require('passport');
const bcrypt = require('bcrypt');
module.exports = function (app, myDataBase) {

    app.route("/").get((req, res) => {
        res.render("index", {
          title: "Connected to Database",
          message: "Please log in",
          showLogin: true,
          showRegistration: true,
          showSocialAuth: true
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
      function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
          return next();
        }
        res.redirect("/");
      }
}