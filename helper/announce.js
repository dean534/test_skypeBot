const axios = require('axios');
const {
  storageUrl
} = require('./db');

let database = {};

database.Announce = axios.create({
  baseURL: `https://ancient-journey-32544.herokuapp.com/api/announce`
});

module.exports = database;