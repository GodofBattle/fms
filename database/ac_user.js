const { pool, queries } = require(`../config/mariadb.config`);

const getUser = async (id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ac_user.get, [ id ]);
        return row[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getUserInfo = async (grade, user_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ac_user.info, [ grade, user_id ]);
        return row[0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getAllUserList = async (grade, user_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ac_user.allUsers, [ grade, user_id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const setUser = async (info) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ac_user.set, [ info, { create_time: new Date() }, info ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateUser = async (set, where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ac_user.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const insertLoginHistory = async (id, ip, login_datetime, session_id, user_agent) => {
    let connection;

    try {
        const inserted_value = {
            login_datetime: new Date(login_datetime),
            user_id: id,
            client_ip: ip === '1' ? '127.0.0.1' : ip,
            session_id: session_id,
            user_agent: user_agent
        }

        const query = queries();

        connection = await pool.getConnection();        
        let row = await connection.query(query.lg_login_history.insert, [ inserted_value ]);
        row = await connection.query(query.ac_user.loginCount, [ id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const updateLoginHistory = async (session_id) => {
    let connection;

    try {
        const set = { logout_datetime: new Date() };
        const where = { session_id: session_id };

        const query = queries();

        connection = await pool.getConnection();        
        let row = await connection.query(query.lg_login_history.update, [ set, where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getUser,
    getUserInfo,
    getAllUserList,
    setUser,
    updateUser,
    insertLoginHistory,
    updateLoginHistory
}