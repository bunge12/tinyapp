const { assert } = require('chai');

const { generateRandomString, emailLookup, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

describe('emailLookup:', function () {
  it('should return true if user with email exists', function () {
    const user = emailLookup("user@example.com", testUsers);
    const expectedOutput = true;
    assert.equal(user, expectedOutput);
  });
  it('should return false if user with email doesnt exist', function () {
    const user = emailLookup("user2@example.com", testUsers);
    const expectedOutput = true;
    assert.equal(user, expectedOutput);
  });
  it('should return undefined if passed empty string', function () {
    const user = emailLookup("", testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
});

describe('generateRandomString:', function () {
  it('should generate 6-char long string', function () {
    const string = generateRandomString();
    const expectedOutput = 6;
    assert.equal(string.length, expectedOutput);
  });
});

describe('urlsForUser:', function () {
  it('should retrieve records based on user ID', function () {
    const result = urlsForUser('aJ48lW', urlDatabase);
    const expectedOutput = aJ48lW = { b6UTxQ: 'https://www.tsn.ca', i3BoGr: 'https://www.google.ca' };
    assert.deepEqual(result, expectedOutput);
  });
  it('should empty object for wrong username', function () {
    const result = urlsForUser('kkk', urlDatabase);
    const expectedOutput = {};
    assert.deepEqual(result, expectedOutput);
  });
  it('should empty object for empty username', function () {
    const result = urlsForUser('', urlDatabase);
    const expectedOutput = {};
    assert.deepEqual(result, expectedOutput);
  });
});