const { pool, queries } = require(`../config/mariadb.config`);

const setNodesPosition = async (nodes) => {
    let connection;

    try {
        const query = queries();
        
        connection = await pool.getConnection();

        const node_info = JSON.parse(nodes.info);
        let update_set = [];
        let query_set = '';

        node_info.forEach((info) => {
            switch(info.id.substr(0, 1)) {
                case 'E': query_set += query.cn_equipment.map.position; break;
                case 'D': query_set += query.cn_dummy.map.position; break;
                case 'G': query_set += query.cn_group.map.position; break;
            }

            update_set.push({ xPosition: parseFloat(info.x), yPosition: parseFloat(info.y), zoom: parseFloat(info.zoom) });
            update_set.push(info.id.substr(2));
            update_set.push(nodes.group_id);
        });

        const rows = await connection.query(query_set, update_set);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    setNodesPosition
}