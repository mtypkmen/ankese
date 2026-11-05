'use strict';
const mysql = require('mysql2/promise');
const { db } = require('./config');

// multipleStatements kapali: zincirlenmis SQL calistirilamaz
const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 8,
  queueLimit: 50,
  connectTimeout: 5000,
  multipleStatements: false,
  timezone: 'Z',
});

module.exports = pool;
