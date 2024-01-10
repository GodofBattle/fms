const { pool, queries } = require(`../config/mariadb.config`);

const getMapNodes = async (parent_id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_map_link.map.nodes, [ parent_id ]);
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

        const delete_set = [];
        delete_set.push({ group_id: connection.escape(group_id) });
        delete_set.push({ src: `G_${group_id}` });
        delete_set.push({ dst: `G_${group_id}` });
        
        const rows = await connection.query(query.cn_map_link.delete, delete_set);
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