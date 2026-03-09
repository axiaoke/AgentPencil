/**
 * 数据库连接池（单例）
 */
const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool(config.db);

module.exports = pool;
