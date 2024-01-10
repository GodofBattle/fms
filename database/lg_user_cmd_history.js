const { pool, queries } = require(`../config/mariadb.config`);

const insertUserCommand = async (inserted_items) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.lg_user_cmd_history.insert, [ inserted_items ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    insertUserCommand
}