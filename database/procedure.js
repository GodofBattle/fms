const { pool, queries } = require(`../config/mariadb.config`);

const spGetGroupListByUserId = async (user_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.procedure.spGetGroupListByUserId, [ user_id ]);
        return row[0][0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const spGetSubGroupList = async (group_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.procedure.spGetSubGroupList, [ group_id ]);
        return row[0][0];
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    spGetGroupListByUserId,
    spGetSubGroupList
}