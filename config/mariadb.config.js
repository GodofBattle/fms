const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');

// by shkoh 20230517: Base64.sh 명령어 사용 후 파악
const e_id = 'aWNvbWVy';
const e_pw = 'aWNvbWVy';

const userId = () => {
    return Buffer.from(e_id, 'base64').toString('utf8');
};

const userPassword = () => {
    return Buffer.from(e_pw, 'base64').toString('utf8');
}

const pool = mariadb.createPool({
    connectionLimit: 10,
    host: '211.53.225.69',
    port: 3306,
    user: userId(),
    password: userPassword(),
    database: 'ug56_db',
    multipleStatements: true,
    permitSetMultiParamEntries: true,
    charset: 'utf8'
});

const queries = () => {
    const query_raw = fs.readFileSync(path.resolve(__dirname, '..', 'database', 'queries.json'));
    return JSON.parse(query_raw);
}

module.exports = {
    pool,
    queries
}