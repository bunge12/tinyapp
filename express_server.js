// App Requires
const { generateRandomString, emailLookup, urlsForUser, errorPage } = require('./helpers');
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override')

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.set("view engine", "ejs");
app.use(methodOverride('_method'))


// App Data
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "dkfjwbejhf": {
    id: "dkfjwbejhf",
    email: "user@email.com",
    password: "1111"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};



// Routing

/// Short Links: redirect for everyone if exists
app.get("/u/:shortURL", (req, res) => {
  if (typeof urlDatabase[req.params.shortURL] !== 'undefined') {
    if (urlDatabase[req.params.shortURL].longURL) {
      res.redirect(urlDatabase[req.params.shortURL].longURL);
    }
  } else {
    errorPage(res, 404, 'This link does not exist! Please update your bookmark.');
  }
});

/// Home, Register, Login
app.get("/", (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});
app.get("/urls", (req, res) => {
  if (req.session.userID) {
    let templateVars = {
      user: users[req.session.userID],
      urls: urlsForUser(req.session.userID, urlDatabase)
    };
    res.render("urls_index", templateVars);
  } else {
    errorPage(res, 403, 'You need to be logged in to view this page.');
  }
});

app.get("/register", (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.userID]
    };
    res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.userID]
    };
    res.render("login", templateVars);
  }
});

/// New URL, only if authorised
app.get("/urls/new", (req, res) => {
  if (req.session.userID) {
    let templateVars = {
      user: users[req.session.userID]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

/// Display short URL, only if exists and created by user
app.get("/urls/:shortURL", (req, res) => {
  if (typeof urlDatabase[req.params.shortURL] === 'undefined') {
    errorPage(res, 404, 'This link does not exist! Please update your bookmark.');
  } else if (!req.session.userID) {
    errorPage(res, 403, 'You need to be logged in to view this page.');
  } else if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    errorPage(res, 403, "This record was created by another user, you don't have permission to edit it.");
  } else {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.userID]
    };
    res.render("urls_show", templateVars);
  }
});

/// Delete, only if created by user
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.userID !== urlDatabase[req.params.shortURL].userID) {
    errorPage(res, 403, 'You need to be logged in to view this page.');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

/// Update, only if created by user
app.put("/urls/:shortURL", (req, res) => {
  if (req.session.userID !== urlDatabase[req.params.shortURL].userID) {
    errorPage(res, 403, 'You need to be logged in to view this page.');
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
    res.redirect('/urls/' + req.params.shortURL);
  }
});

/// Process new URL
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.session.userID
  };
  res.redirect('/urls/' + randomString);
});

/// Process new registration
app.post("/register", (req, res) => {
  let randomString = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    errorPage(res, 400, 'Sorry, the password cannot be empty.');

  } else if (emailLookup(req.body.email, users)) {
    errorPage(res, 403, 'Sorry, an account with that email already exists.');
  } else {
    users[randomString] = {
      id: randomString,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.userID = randomString;
    res.redirect('/urls');
  }
});

/// Process login request
app.post("/login", (req, res) => {
  if (emailLookup(req.body.email, users)) {
    for (let user of Object.keys(users)) {
      if (req.body.email === users[user].email) {
        if (bcrypt.compareSync(req.body.password, users[user].password)) {
          req.session.userID = users[user].id;
          res.redirect('/urls');
        } else {
          errorPage(res, 403, 'The password provided was wrong.');
        }
      }
    }
  } else {
    errorPage(res, 403, 'We cannot find an account with that email.');
  }
});

/// Logout
app.post("/logout", (req, res) => {
  req.session.userID = null;
  res.redirect('/urls');
});

// Server Up:
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
