// App Functions
const generateRandomString = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * 62));
  }
  return result;
};

const emailLookup = (email) => {
  for (let user of Object.keys(users)) {
    if (email === users[user].email) {
      return true;
    }
  }
};

const urlsForUser = (userID) => {
  let result = {};
  for (let [key, value] of Object.entries(urlDatabase)) {
    if (value['userID'] === userID) {
      result[key] = value['longURL'];
    }
  }
  return result;
};

// App Requires
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
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
    const longURL = urlDatabase[req.params.shortURL].longURL;
    if (!longURL) {
      res.status(404).send("Sorry, this short URL doesn't exist! <a href='/'>Go to home page.</a>");
    } else {
      res.redirect(longURL);
    }
  } else {
    res.status(404).send("Sorry, this short URL doesn't exist! <a href='/'>Go to home page.</a>");
  }
});

/// Home, Register, Login
app.get(["/urls", "/"], (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlsForUser(req.cookies["user_id"])
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars);
});

/// New URL, only if authorised
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    let templateVars = {
      user: users[req.cookies["user_id"]]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

/// Display short URL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

/// Delete, only if created by user
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"] !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("Sorry, you don't have permission! <a href='/'>Go to home page.</a>");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

/// Update, only if created by user
app.post("/urls/:shortURL", (req, res) => {
  if (req.cookies["user_id"] !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send("Sorry, you don't have permission! <a href='/'>Go to home page.</a>");
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
    userID: req.cookies["user_id"]
  };
  res.redirect('/urls/' + randomString);
});

/// Process new registration
app.post("/register", (req, res) => {
  let randomString = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Sorry, password or email cannot be empty! <a href='/'>Go to home page.</a>");
  } else if (emailLookup(req.body.email)) {
    res.status(400).send("Sorry, an account withbthis email exists! <a href='/'>Go to home page.</a>");
  } else {
    users[randomString] = {
      id: randomString,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    console.log(users);
    res.cookie('user_id', randomString);
    res.redirect('/urls');
  }
});

/// Process login request
app.post("/login", (req, res) => {
  if (emailLookup(req.body.email)) {
    for (let user of Object.keys(users)) {
      if (req.body.email === users[user].email) {
        if (bcrypt.compareSync(req.body.password, users[user].password)) {
          res.cookie('user_id', users[user].id);
          res.redirect('/urls');
        } else {
          res.status(403).send("Sorry, wrong password! <a href='/'>Go to home page.</a>");
        }
      }
    }
  } else {
    res.status(403).send("Sorry, we cannot find an account with that email! <a href='/'>Go to home page.</a>");
  }
});

/// Logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Server Up:
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
