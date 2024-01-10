/**
 * by shkoh 20200520
 * Popup 로그 페이지에서 사용할 데이터 Route 부분
 * 
 * /api/popup/log/...
 */
const express = require(`express`);
const router = express.Router();

const exec = require(`child_process`).exec;

const db_cn_equipement = require(`../../database/cn_equipment`);

router.get(`/info`, async (req, res, next) => {
    const { equip_id } = req.query;
    const results = await db_cn_equipement.getPopupInfo(equip_id);

    if(results === undefined) {
        return next();
    } else if(results.constructor.name === `SqlError` || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.send(results);
    }
});

router.get(`/data`, (req, res, next) => {
    // by shkoh 20200520: logdata는 callback 형식으로 구성되어야 동작함으로 해당 부분은 따로 처리하도록 별도 router를 구성함
    const { equip_id, log_mod, ip, port, d_id } = req.query;
    if(equip_id === '') {
        res.send([]);
        return;
    }

    let log_path = `~icomer/FMS6/log/`;
    let log_file = ``;
    let grep_options = ``;
    let shell = `~icomer/FMS6/shell/logtail.awk`;

    switch(log_mod) {
        case 'MODBUS_TCP':          log_file = `modbid${port % 5}`; grep_options = `'${ip}:${port} ${equip_id}-${d_id}'`; break;
        case 'MODBUS_RTU':          log_file = `modbid${port % 5}`; grep_options = `'${ip}:${port} ${equip_id}-${d_id}'`; break;
        case 'TCP_IP':              log_file = `tcpid`;             grep_options = `'${ip}:${port} ${equip_id}-${d_id}'`; break;
        case 'REMOTE_DB':           log_file = `odbcid`;            grep_options = `'${equip_id}-${d_id}'`; break;
        case 'SNMP':                log_file = `snmpid`;            grep_options = `'EquipId:${equip_id}' | grep 'ip:${ip}, port:${port}'`; break;
        case 'VIRTUAL':             log_file = `virid`;             grep_options = `'Equip[ID:${equip_id}]'`; break;
        case 'BACNET':              log_file = `bacnid`;            grep_options = `'(EquipId=${equip_id})'`; break;
        case 'PEER_CHECK_TCPIP':    log_file = `pscid`;             grep_options = `'${ip}:${port}'`; break;
        case 'PEER_CHECK_HTTP':     log_file = `pscid`;             grep_options = `'${ip}:${port}'`; break;
        case 'HTTP':                log_file = `httpid`;            grep_options = `'${ip}:${port}'`; break;
        case 'OPCUA':               log_file = `opcid`;             grep_options = `'${ip}:${port}'`; break;
    }

    let command = log_file ? `cat ${log_path}${log_file}.01, ${log_path}${log_file}.00 | grep ${grep_options} | tail -1000 | awk -f ${shell}` : ``;
    exec(command, { maxBuffer: Infinity }, (err, stdout, stderr) => {
        const results = { logData: stdout, error: err, stderr: stderr };
        res.send(results);
    });
});

module.exports = router;