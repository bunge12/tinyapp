// App Functions
const generateRandomString = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * 62));
  }
  return result;
};

const emailLookup = (email, database) => {
  for (let user of Object.keys(database)) {
    if (email === database[user].email) {
      return true;
    }
  }
};

const urlsForUser = (userID, database) => {
  let result = {};
  for (let [key, value] of Object.entries(database)) {
    if (value['userID'] === userID) {
      result[key] = value['longURL'];
    }
  }
  return result;
};

const errorPage = (res, error, message) => {
  let templateVars = {
    error: error,
    message: message
  };
  res.status(error).render("error", templateVars);
};

const inList = (visitor_id, shortURL, db) => {
  let uniques = db[shortURL].visitors;
  if (!uniques.includes(visitor_id)) {
    uniques.push(visitor_id);
  }
};

const visitorID = (req, res) => {
  if (!req.cookies['visitor_id']) {
    res.cookie('visitor_id', generateRandomString());
  }
};

/// Not using getUserByEmail, so used/tested other functions
/* const getUserByEmail = function (email, database) {
  for (let user of Object.keys(database)) {
    if (email === users[user].email) {
      return user;
    }
  };
}; */

module.exports = { generateRandomString, emailLookup, urlsForUser, errorPage, inList, visitorID };