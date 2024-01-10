const { pool, queries } = require(`../config/mariadb.config`);

const getMapNodes = async (parent_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_map_dummy.map.nodes, [ parent_id ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteMapNodes = async (group_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();        
        const rows = await connection.query(query.cn_map_dummy.delete, [{ group_id: connection.escape(group_id) }]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getMapNodes,
    deleteMapNodes
}