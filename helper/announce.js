const axios = require('axios');
const {
  storageUrl
} = require('./db');

let database = {};

database.Announce = axios.create({
  baseURL: `http://localhost:3001/api/announce`
});

module.exports = database;