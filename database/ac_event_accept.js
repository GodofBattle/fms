const { pool, queries } = require(`../config/mariadb.config`);

const getAcceptedEventByUser = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ac_event_accept.read, [ where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const insertAcceptedEvent = async (array_set) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        // by shkoh 20200522: 복수의 아이템을 insert 할 수 있음으로 batch 명령어로 실행
        const rows = await connection.batch(query.ac_event_accept.insert, array_set);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteAcceptedEvent = async (where) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.ac_event_accept.delete, [ where ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getAcceptedEventByUser,
    insertAcceptedEvent,
    deleteAcceptedEvent
}