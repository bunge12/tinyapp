function generateRandomString() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * 62));
  }
  return result;
}

const emailLookup = (email) => {
  for (let user of Object.keys(users)) {
    if (email === users[user].email) { return true; }
  }
};

const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    res.status(404).send("Sorry, this short URL doesn't exist! <a href='/'>Go to home page.</a>");
  }
  else { res.redirect(longURL); }
});

app.get(["/urls", "/"], (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
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

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect('/urls/' + req.params.shortURL);
});
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect('/urls/' + randomString);
});
app.post("/register", (req, res) => {
  let randomString = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Sorry, password or email cannot be empty! <a href='/'>Go to home page.</a>");
  } else if (emailLookup(req.body.email)) {
    res.status(400).send("Sorry, an account withbthis email exists! <a href='/'>Go to home page.</a>");
  }
  else {
    users[randomString] = {
      id: randomString,
      email: req.body.email,
      password: req.body.password
    };
    console.log(users);
    res.cookie('user_id', randomString);
    res.redirect('/urls');
  }
});
app.post("/login", (req, res) => {
  if (emailLookup(req.body.email)) {
    for (let user of Object.keys(users)) {
      if (req.body.email === users[user].email) {
        if (req.body.password === users[user].password) {
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
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
