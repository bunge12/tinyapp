// App Requires
const { generateRandomString, emailLookup, urlsForUser } = require('./helpers');
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.set("view engine", "ejs");

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

/// Short Links: unauth OK
app.get("/u/:shortURL", (req, res) => {
  if (typeof urlDatabase[req.params.shortURL] !== 'undefined') {
    if (urlDatabase[req.params.shortURL].longURL) {
      res.redirect(urlDatabase[req.params.shortURL].longURL);
    }
  } else {
    let templateVars = {
      error: 404,
      message: "Sorry, this short URL doesn't exist!"
    }
    res.status(404).render("error", templateVars);
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
    let templateVars = {
      error: 403,
      message: "You need to be logged in to view this page."
    }
    res.status(403).render("error", templateVars);
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

/// Display short URL
app.get("/urls/:shortURL", (req, res) => {
  if (typeof urlDatabase[req.params.shortURL] === 'undefined') {
    let templateVars = {
      error: 404,
      message: "This link does not exist!."
    }
    res.status(404).render("error", templateVars);
  } else if (!req.session.userID) {
    let templateVars = {
      error: 403,
      message: "You need to be logged in to view this page."
    }
    res.status(403).render("error", templateVars);
  } else if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    let templateVars = {
      error: 403,
      message: "This record was created by another user, you don't have permission to edit it."
    }
    res.status(403).render("error", templateVars);
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
    let templateVars = {
      error: 403,
      message: "You need to be logged in to view this page."
    }
    res.status(403).render("error", templateVars);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

/// Update, only if created by user
app.post("/urls/:shortURL", (req, res) => {
  if (req.session.userID !== urlDatabase[req.params.shortURL].userID) {
    let templateVars = {
      error: 403,
      message: "You need to be logged in to view this page."
    }
    res.status(403).render("error", templateVars);
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
    let templateVars = {
      error: 400,
      message: "Sorry, password or email can't be empty!"
    }
    res.status(403).render("error", templateVars);
  } else if (emailLookup(req.body.email, users)) {
    let templateVars = {
      error: 400,
      message: "Sorry, an account with this email already exists."
    }
    res.status(403).render("error", templateVars);
  } else {
    users[randomString] = {
      id: randomString,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    console.log(users);
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
          let templateVars = {
            error: 403,
            message: "The password provided was wrong."
          }
          res.status(403).render("error", templateVars);
        }
      }
    }
  } else {
    let templateVars = {
      error: 403,
      message: "We can't find an account with that email."
    }
    res.status(403).render("error", templateVars);
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
