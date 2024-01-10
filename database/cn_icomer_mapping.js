const { pool, queries } = require(`../config/mariadb.config`);

const getIcomerMapping = async (where_page, where_obj) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_icomer_mapping.get, [ where_page, where_obj ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getIcomerMappingDataToPage = async (page_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_icomer_mapping.page.get, [ page_name ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const setIcomerMapping = async (info) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_icomer_mapping.set, [ info, info ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const deleteIcomeMapping = async (id) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_icomer_mapping.delete, [ id ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getIcomerFloorData = async (page_name, floor_object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();

        const floor_query = query.cn_icomer_mapping.floor.replace(/\$\$1/, floor_object_name);
        const rows = await connection.query(floor_query, [ page_name ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getHVACDataToMapper = async (page_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_icomer_mapping.hvac.get, [ page_name ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getHVACObjectData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_icomer_mapping.hvac.object, [ page_name, object_name ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getTHDataToMapper = async (page_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_icomer_mapping.th.get, [ page_name ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getTHObjectData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_icomer_mapping.th.object, [ page_name, object_name ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPUEDataToMapper = async (page_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const row = await connection.query(query.cn_icomer_mapping.pue.get, [ page_name, page_name ]);
        return row;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPUEChartDataToMapper = async (page_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = [];
        for(let idx = 11; idx >= 0; idx--) {
            const row = await connection.query(query.cn_icomer_mapping.pue.history, [ idx, idx, page_name ]);
            rows.push(row[0]);
        }
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPssHvacData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const hvac_query = query.cn_icomer_mapping.pss.hvac.replace(/\$\$1/, object_name);
        const rows = await connection.query(hvac_query, [ page_name ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPssThData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const th_query = query.cn_icomer_mapping.pss.th.replace(/\$\$1/, object_name);
        const rows = await connection.query(th_query, [ page_name ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPssGaugeData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.pss.gauge, [ page_name, object_name ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPssPanelData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const panel_query = query.cn_icomer_mapping.pss.panel.replace(/\$\$1/, object_name);
        const rows = await connection.query(panel_query, [ page_name ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPssPowerData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const power_query = query.cn_icomer_mapping.pss.power.replace(/\$\$1/, object_name);
        const rows = await connection.query(power_query, [ page_name ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPssPowerChartData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = [];
        for(let idx = 5; idx >= 0; idx--) {
            const row = await connection.query(query.cn_icomer_mapping.pss.powerChart, [ idx, idx, page_name ]);
            rows.push(row[0]);
        }
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPssPowerUpsData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const ups_query = query.cn_icomer_mapping.pss.ups.replace(/\$\$1/, object_name);
        const rows = await connection.query(ups_query, [ page_name ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getPssThresholdData = async (page_name, object_name) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const threshold_query = query.cn_icomer_mapping.pss.threshold.replace(/\$\$1/, object_name);
        const rows = await connection.query(threshold_query, [ page_name ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcEquipmentList = async (pagename, objectname) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.equipmentlist, [ pagename, objectname ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcContainmentList = async (pagename) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.containmentlist, [ pagename ]);
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcContainmentChart = async (equip_ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.containmentchart.replace('$$1', equip_ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcTempHumi = async (ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.temphumi.replace('$$1', ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcIcon = async (ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.icon.replace('$$1', ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcAlert = async (ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.alert.replace('$$1', ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcHVACRun = async (ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.hvacrun.replace('$$1', ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcPower = async (ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.power.replace('$$1', ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcPUE = async (ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.pue.replace('$$1', ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getDidcWind = async (ids) => {
    let connection;

    try {
        const query = queries();

        connection = await pool.getConnection();
        const rows = await connection.query(query.cn_icomer_mapping.didc.wind.replace('$$1', ids));
        return rows;
    } catch(err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {
    getIcomerMapping,
    getIcomerMappingDataToPage,
    setIcomerMapping,
    deleteIcomeMapping,
    getIcomerFloorData,
    getHVACDataToMapper,
    getHVACObjectData,
    getTHDataToMapper,
    getTHObjectData,
    getPUEDataToMapper,
    getPUEChartDataToMapper,
    getPssHvacData,
    getPssThData,
    getPssGaugeData,
    getPssPanelData,
    getPssPowerData,
    getPssPowerChartData,
    getPssPowerUpsData,
    getPssThresholdData,
    getDidcEquipmentList,
    getDidcContainmentList,
    getDidcContainmentChart,
    getDidcTempHumi,
    getDidcIcon,
    getDidcAlert,
    getDidcHVACRun,
    getDidcPower,
    getDidcPUE,
    getDidcWind
}