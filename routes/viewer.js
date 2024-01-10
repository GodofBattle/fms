const express = require(`express`);
const router = express.Router();

const path = require('path');
const fs = require('fs');

// by shkoh 20210129: fms 고객사 커스터마이즈 적용을 위한 설정파일
const fms_config = require(`../config/fms.config`);

const db_ac_user = require(`../database/ac_user`);
const db_cn_equipment = require(`../database/cn_equipment`);
const db_cn_sensor = require(`../database/cn_sensor`);

router.get(`/`, (req, res, next) => {
    return res.render(`index`, {
        title: fms_config.title,
        grade: req.session.user.grade,
        url: fms_config.start_url,
        middle_text: fms_config.middle_text,
        end_text: fms_config.end_text,
        site: fms_config.site,
        dashboard_host: fms_config.dashboard_host,
        sub_site: fms_config.sub_site
    });
});

router.get(`/monitoring`, (req, res, next) => {
    const { equipId } = req.query;
    return res.render(`monitoring/monitoring`, {
        title: `${fms_config.title} - 모니터링`,
        site: fms_config.site,
        is_asset: fms_config.is_asset,
        is_link_id: equipId ? equipId : null
    });
});

router.get(`/alarm/dashboard`, (req, res, next) => {
    return res.render(`alarm/dashboard/fault`, { title: `${fms_config.title} - 장애관리 | 장애현황` });
});

router.get(`/alarm/history`, (req, res, next) => {
    return res.render(`alarm/history/alarm`, { title: `${fms_config.title} - 장애관리 | 장애이력` });
});

router.get(`/data/statistics`, (req, res, next) => {
    return res.render(`reports/statistics/data`, { title: `${fms_config.title} - 통계/정보 | 데이터 통계` });
});

router.get(`/data/report`, (req, res, next) => {
    return res.render(`reports/data/data`, { title: `${fms_config.title} - 통계/정보 | 데이터 보고서` });
});

router.get(`/data/asset`, (req, res, next) => {
    return res.render(`reports/asset/asset`, { title: `${fms_config.title} - 통계/정보 | 설비정보` });
});

router.get(`/data/worklog`, async (req, res, next) => {
    return res.render(`reports/worklog`, { title: `${fms_config.title} - 통계/정보 | 작업이력` });
});

router.get(`/inventory/:type`, (req, res, next) => {
    switch(req.params.type) {
        case `info`: {
            return res.render(`inventory/info`, { title: `${fms_config.title} - 자산 | 정보관리` });
        }
        case `asset`: {
            return res.render(`inventory/asset`, { title: `${fms_config.title} - 자산 | 자산관리` });
        }
        case `history`: {
            return res.render(`inventory/history`, { title: `${fms_config.title} - 자산 | 내역관리` });
        }
    }
});

router.get(`/user`, (req, res, next) => {
    return res.render(`setting/user`, {
        title: `${fms_config.title} - 사용자설정`,
        site: fms_config.site
    });
});

router.get(`/sensor`, (req, res, next) => {
    return res.render(`setting/sensor`, { title: `${fms_config.title} - 임계치 설정` });
});

router.get(`/predefine/:type`, (req, res, next) => {
    switch(req.params.type) {
        case `code`: return res.render(`setting/pd_code`, { title: `${fms_config.title} - 코드 사전설정` });
        case `equipment`: return res.render(`setting/pd_equipment`, { title: `${fms_config.title} - 설비 사전설정` });
        case `inventory`: return res.render(`setting/in_code`, { title: `${fms_config.title} - 자산코드 사전설정` });
    }
});

router.get(`/popup/set/:id`, (req, res, next) => {
    return res.render(`monitoring/popup/setting`, { title: `${fms_config.title} - 그룹/설비 설정`, id: req.params.id, is_asset: fms_config.is_asset });
});

router.get(`/popup/workhistory/:equipId`, async (req, res, next) => {
    const { equipId } = req.params;
    
    if(fms_config.is_asset) {
        const results = await db_cn_equipment.getPopupInfo(equipId);
        
        if(results === undefined) {
            return next();
        } else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError') {
            return next(results);
        } else {
            return res.render(`monitoring/popup/work_history`, {
                title: `${fms_config.title} - 설비자산 작업이력`,
                equipId: equipId,
                equipName: results.name,
                name: results.name2,
            });
        }        
    } else {
        return next();
    }
});

router.get(`/popup/fault`, async (req, res, next) => {
    const { equip_id, sensor_id, occur_date, alarm_level } = req.query;

    const results = await db_cn_equipment.getPopupInfo(equip_id);
    if(results === undefined) {
        next();
    } else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.render(`monitoring/fault/fault`, {
            title: `${fms_config.title} - 장애이력`,
            data: results,
            sensorId: sensor_id,
            occurDate: occur_date,
            alarmLevel: alarm_level
        });
    }
});

router.get(`/popup/log`, async (req, res, next) => {
    const { equip_id } = req.query;

    const results = await db_cn_equipment.getPopupInfo(equip_id);
    if(results === undefined) {
        next();
    } else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.render(`monitoring/log/log`, {
            data: results
        });
    }
});

router.get(`/popup/chart`, async (req, res, next) => {
    const { sensor_id } = req.query;
    if(sensor_id === undefined || sensor_id === '') {
        return res.end();
    }

    const info = await db_cn_sensor.getInfo(sensor_id);
    return res.render(`monitoring/popup/sensor_chart`, {
        title: `${fms_config.title} - [${info.equip_name}] ${info.sensor_name} 데이터 추이`,
        info: {
            equipId: info.equip_id,
            equipName: info.equip_name,
            sensorId: sensor_id,
            sensorName: info.sensor_name,
            sensorType: info.sensor_type
        }
    });
});

router.get(`/popup/camera/:equipId`, async (req, res, next) => {
    const { equipId } = req.params;

    const results = await db_cn_equipment.getPopupInfo(equipId);
    if(results === undefined) next();
    else if(results.constructor.name === 'SqlError' || results.constructor.name === 'TypeError') {
        return next(results);
    } else {
        return res.render(`popup/camera/index`, {
            title: `${fms_config.title} - Camera Viewer`,
            info: {
                equipId: equipId,
                name: results.name2,
                ip: results.ip
            }
        });
    }
});

router.post(`/`, (req, res, next) => {
    if(req.session.user !== undefined) return res.send(req.session.user);
    else res.status(404).redirect(`/login`);
});

router.post(`/logout`, async (req, res, next) => {
    await db_ac_user.updateLoginHistory(req.session.id);

    req.session.user = undefined;
    res.redirect(`/`);
});

/**
 * Test View
 */
router.get(`/test/icon`, (req, res, next) => {
    let file_name = '';
    const type = 'ICON';

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/tester`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/tester`, type, files[0]) : ``;
    } catch(err) {}

    return res.render(`customizing/tester/icon/index`, {
        title: `${fms_config.title} - ICON 테스트`,
        grade: req.session.user.grade,
        type: type,
        image: file_name.replace(/\\/g, `/`)
    });
});

/**
 * 우리FIS Costomizing View
 */
router.get(`/wrfis`, (req, res, next) => {
    return res.render(`customizing/wrfis/index`, { title: `${fms_config.title} - 우리에프아이에스` });
});

router.get(`/wrfis/wemb`, (req, res, next) => {
    return res.render(`customizing/wrfis/wemb/index`, { title: `${fms_config.title} - 우리에프아이에스 WEMB 설정` });
});

router.get(`/wrfis/icomer`, (req, res, next) => {
    return res.render(`customizing/wrfis/icomer/index`, { title: `${fms_config.title} - 우리에프아이에스 ICOMER 설정` });
});

router.get(`/wrfis/pue`, (req, res, next) => {
    return res.render(`customizing/wrfis/pue/index`, { title: `${fms_config.title} - 모니터링 | PUE 모니터링(냉수제외)`, extra: '' });
});

router.get(`/wrfis/pueextra`, (req, res, next) => {
    return res.render(`customizing/wrfis/pue/index`, { title: `${fms_config.title} - 모니터링 | PUE 모니터링(냉수포함)`, extra: 'extra' });
});

router.get(`/wrfis/pms/:type`, (req, res, next) => {
    switch(req.params.type) {
        case `main`:
            return res.render(`customizing/wrfis/pms/index`, { title: `${fms_config.title} - 우리에프아이에스 PMS 메인` });
        case `4f`: {
            let file_name = '';
            const type = 'PMS04';

            try {
                const file_path = path.join(__dirname, `../public/img/diagram/wrfis`, type);
                const files = fs.readdirSync(file_path);
                file_name = files && files[0] ? path.join(`/img/diagram/wrfis`, type, files[0]) : ``;
            } catch(err) {}

            return res.render(`customizing/wrfis/diagram/index`, {
                title: `${fms_config.title} - PMS 4층`,
                grade: req.session.user.grade,
                type: type,
                mapName: 'PMS',
                floorName: '4층',
                image: file_name.replace(/\\/g, `/`)
            });
        }
        case `7f`: {
            let file_name = '';
            const type = 'PMS07';

            try {
                const file_path = path.join(__dirname, `../public/img/diagram/wrfis`, type);
                const files = fs.readdirSync(file_path);
                file_name = files && files[0] ? path.join(`/img/diagram/wrfis`, type, files[0]) : ``;
            } catch(err) {}

            return res.render(`customizing/wrfis/diagram/index`, {
                title: `${fms_config.title} - PMS 7층`,
                grade: req.session.user.grade,
                type: type,
                mapName: 'PMS',
                floorName: '7층',
                image: file_name.replace(/\\/g, `/`)
            });
        }
        case `popup`: {
            return res.render(`customizing/wrfis/pms/popup`, {
                title: `${fms_config.title} - PMS`,
                id: req.query.id
            });
        }
    }
});

router.get(`/wrfis/bms/:type`, (req, res, next) => {
    switch(req.params.type) {
        case `main`:
            return res.render(`customizing/wrfis/bms/index`, { title: `${fms_config.title} - 우리에프아이에스 BMS 메인` });
        case `lead`: {
            let file_name = '';
            const type = 'BMS01';

            try {
                const file_path = path.join(__dirname, `../public/img/diagram/wrfis`, type);
                const files = fs.readdirSync(file_path);
                file_name = files && files[0] ? path.join(`/img/diagram/wrfis`, type, files[0]) : ``;
            } catch(err) {}

            return res.render(`customizing/wrfis/diagram/index`, {
                title: `${fms_config.title} - BMS(납)`,
                grade: req.session.user.grade,
                type: type,
                mapName: 'BMS',
                typeName: '납축전지',
                image: file_name.replace(/\\/g, `/`)
            });
        }
        case `lithium`: {
            let file_name = '';
            const type = 'BMS02';

            try {
                const file_path = path.join(__dirname, `../public/img/diagram/wrfis`, type);
                const files = fs.readdirSync(file_path);
                file_name = files && files[0] ? path.join(`/img/diagram/wrfis`, type, files[0]) : ``;
            } catch(err) {}

            return res.render(`customizing/wrfis/diagram/index`, {
                title: `${fms_config.title} - BMS(리튬)`,
                grade: req.session.user.grade,
                type: type,
                mapName: 'BMS',
                typeName: '리튬전지',
                image: file_name.replace(/\\/g, `/`)
            });
        }
        case `popup`: {
            return res.render(`customizing/wrfis/bms/popup`, {
                title: `${fms_config.title} - BMS`,
                id: req.query.id
            });
        }
    }
});

router.get(`/wrfis/cfd/:type`, (req, res, next) => {
    switch(req.params.type) {
        case `8f`: {
            let file_name = '';
            const type = 'CFD08';

            try {
                const file_path = path.join(__dirname, `../public/img/diagram/wrfis`, type);
                const files = fs.readdirSync(file_path);
                file_name = files && files[0] ? path.join(`/img/diagram/wrfis`, type, files[0]) : ``;
            } catch(err) {}

            return res.render(`customizing/wrfis/diagram/index`, {
                title: `${fms_config.title} - 온도분포도 8층`,
                grade: req.session.user.grade,
                type: type,
                mapName: '온도분포도',
                typeName: '8층',
                image: file_name.replace(/\\/g, `/`)
            });
        }
    }
});

router.get(`/reports/wrfis/:content`, (req, res, next) => {
    switch(req.params.content) {
        case `upsdaily`:
            return res.render(`reports/wrfis/ups_daily`, { title: `${fms_config.title} - 통계/정보 | UPS 일지` });
        case `temphumi`:
            return res.render(`reports/wrfis/temphumi_statistics`, { title: `${fms_config.title} - 통계/정보 | 온습도 보고서` });
        case `temphumiavg`:
            return res.render(`reports/wrfis/temphumi_statistics_avg`, { title: `${fms_config.title} - 통계/정보 | 온습도 가동현황 보고서` });
        case `upsusage`:
            return res.render(`reports/wrfis/ups_usage`, { title: `${fms_config.title} - 통계/정보 | UPS 전력 사용현황` });
        case `hvac`:
            return res.render(`reports/wrfis/hvac`, { title: `${fms_config.title} - 통계/정보 | 항온항습기 가동현황` });
        case `pms`:
            return res.render(`reports/wrfis/pms`, { title: `${fms_config.title} - 통계/정보 | PMS 사용현황` });
        case `pue`:
            return res.render(`reports/wrfis/pue`, { title: `${fms_config.title} - 통계/정보 | PUE 보고서(냉수제외)`, extra: '' });
        case `pueextra`:
            return res.render(`reports/wrfis/pue`, { title: `${fms_config.title} - 통계/정보 | PUE 보고서(냉수포함)`, extra: 'extra' });
        case `datadaily`:
            return res.render(`reports/wrfis/data_daily`, { title: `${fms_config.title} - 통계/정보 | DATA 운영관리일지` });
        case `equipdaily`:
            return res.render(`reports/wrfis/equipment_daily`, { title: `${fms_config.title} - 통계/정보 | 설비 일일 점검일지` });
        case `saftycheckdaily`:
            return res.render(`reports/wrfis/safty_check_daily`, { title: `${fms_config.title} - 통계/정보 | 위험물 일일 점검표` });
        case `electriccheckdaily`:
            return res.render(`reports/wrfis/electric_check_daily`, { title: `${fms_config.title} - 통계/정보 | 전기 일일 점검일지` });
        case `electricspec`:
            return res.render(`reports/wrfis/electric_spec`, { title: `${fms_config.title} - 통계/정보 | 전기 확인명세서` });
        case `hvacdiagram`:
            return res.render(`customizing/wrfis/hvac/index`, { title: `${fms_config.title} - 모니터링 | 항온항습기 가동현황` });
        case `thdiagram`:
            return res.render(`customizing/wrfis/th/index`, { title: `${fms_config.title} - 모니터링 | 온습도 가동현황` });
        case `asset`:
            return res.render(`reports/wrfis/asset`, { title: `${fms_config.title} - 자산 | 자산정보 보고서` });
        case `assetrepair`:
            return res.render(`reports/wrfis/asset_repair`, { title: `${fms_config.title} - 자산 | 자산 수리내역 보고서` });
        case `assetchange`:
            return res.render(`reports/wrfis/asset_change`, { title: `${fms_config.title} - 자산 | 자산 변경내역 보고서` });
    }
});

/**********************************************************************************************************************************************/
/* by shkoh 20211202: KEPCO DAEGEON ICT - Router Start                                                                                        */
/**********************************************************************************************************************************************/
router.get(`/kepco`, (req, res, next) => {
    let file_name = '';
    const type = 'kdashboard';

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/tester`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/tester`, type, files[0]) : ``;
    } catch(err) {}

    return res.render(`customizing/kepco/sample/index`, {
        title: `${fms_config.title} - 대시보드`,
        grade: req.session.user.grade,
        type: type,
        image: file_name.replace(/\\/g, `/`)
    });
});

router.get(`/kepco/diagram/popup`, async (req, res, next) => {
    const { id } = req.query;

    return res.render(`customizing/kepco/diagram/setting`, {
        title: `${fms_config.title} - 설정(id: ${id})`,
        grade: req.session.user.grade,
        id: id
    });
});

router.get(`/kepco/diagram/temperature/:mode`, (req, res, next) => {
    let file_name = '';
    const type = 'temp_' + req.params.mode;

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/kepco`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/kepco`, type, files[0]) : ``;
    } catch(err) {}

    let sub_title = '';
    switch(req.params.mode) {
        case `1f_1`: sub_title = ' 1F ICT 서버실 1'; break;
        case `1f_2`: sub_title = ' 1F ICT 서버실 2'; break;
        case `2f_1`: sub_title = ' 2F ICT 서버실 1'; break;
        case `2f_2`: sub_title = ' 2F ICT 서버실 2'; break;
        case `3f_1`: sub_title = ' 3F ICT 서버실 1'; break;
        case `3f_2`: sub_title = ' 3F ICT 서버실 2'; break;
        case `4f_1`: sub_title = ' 4F ICT 서버실 1'; break;
        case `4f_2`: sub_title = ' 4F ICT 서버실 2'; break;
    }

    return res.render(`customizing/kepco/diagram/index`, {
        title: `${fms_config.title} - 온도분포도`,
        typeName: `온도분포도${sub_title}`,
        grade: req.session.user.grade,
        type: type,
        is_heatmap: true,
        image: file_name.replace(/\\/g, `/`)
    });
});

router.get(`/kepco/airview`, (req, res, next) => {
    let file_name = '';
    const type = 'airview';

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/tester`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/tester`, type, files[0]) : ``;
    } catch(err) {}

    return res.render(`customizing/kepco/sample/index`, {
        title: `${fms_config.title} - 조감도`,
        grade: req.session.user.grade,
        type: type,
        image: file_name.replace(/\\/g, `/`)
    });
});

router.get(`/kepco/pue`, (req, res, next) => {
    return res.render(`customizing/kepco/pue/index`, { title: `${fms_config.title} - 모니터링 | PUE 모니터링`, extra: '' });
});

router.get(`/kepco/power`, (req, res, next) => {
    const type = 'power';
    let file_name = '';

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/kepco/`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/kepco`, type, files[0]) : ``;
    } catch(err) {}

    let sub_title = '전력계통도';

    return res.render(`customizing/kepco/diagram/index`, {
        title: `${fms_config.title} - 전력계통도`,
        typeName: sub_title,
        grade: req.session.user.grade,
        type: type,
        is_heatmap: false,
        image: file_name.replace(/\\/g, '/')
    });
});

router.get(`/kepco/rack`, (req, res, next) => {
    let file_name = '';
    const type = 'rack';

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/tester`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/tester`, type, files[0]) : ``;
    } catch(err) {}

    return res.render(`customizing/kepco/sample/index`, {
        title: `${fms_config.title} - 랙 배치도`,
        grade: req.session.user.grade,
        type: type,
        image: file_name.replace(/\\/g, `/`)
    });
});

router.get(`/kepco/diagram/light/:mode`, (req, res, next) => {
    let file_name = '';
    const type = 'light_' + req.params.mode;

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/kepco`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/kepco`, type, files[0]) : ``;
    } catch(err) {}

    let sub_title = '';
    switch(req.params.mode) {
        case `b1f`: sub_title = ' B1F'; break;
        case `1f`: sub_title = ' 1F'; break;
        case `2f`: sub_title = ' 2F'; break;
        case `3f`: sub_title = ' 3F'; break;
        case `4f`: sub_title = ' 4F'; break;
    }

    return res.render(`customizing/kepco/diagram/index`, {
        title: `${fms_config.title} - 조명관리`,
        typeName: `조명${sub_title}`,
        grade: req.session.user.grade,
        type: type,
        is_heatmap: false,
        image: file_name.replace(/\\/g, `/`)
    });
});

router.get(`/kepco/diagram/security/:mode`, (req, res, next) => {
    let file_name = '';
    const type = 'security_' + req.params.mode;

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/kepco`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/kepco`, type, files[0]) : ``;
    } catch(err) {}

    let sub_title = '';
    switch(req.params.mode) {
        case `b1f`: sub_title = ' B1F'; break;
        case `1f`: sub_title = ' 1F'; break;
        case `2f`: sub_title = ' 2F'; break;
        case `3f`: sub_title = ' 3F'; break;
        case `4f`: sub_title = ' 4F'; break;
    }

    return res.render(`customizing/kepco/diagram/index`, {
        title: `${fms_config.title} - 보안`,
        typeName: `보안${sub_title}`,
        grade: req.session.user.grade,
        type: type,
        is_heatmap: false,
        image: file_name.replace(/\\/g, `/`)
    });
});

router.get(`/kepco/asset/info`, (req, res, next) => {
    return res.render(`customizing/kepco/asset/info`, { title: `${fms_config.title} - 기반설비정보` });
});

router.get(`/kepco/asset/history`, (req, res, next) => {
    return res.render(`customizing/kepco/work/history`, { title: `${fms_config.title} - 기반설비 작업이력` });
});

router.get(`/kepco/icomer`, (req, res, next) => {
    return res.render(`customizing/kepco/icomer/index`, { title: `${fms_config.title} - KEPCO ICOMER 설정` });
});
/**********************************************************************************************************************************************/
/* by shkoh 20211202: KEPCO DAEGEON ICT - Router End                                                                                          */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20220720: PREGIDENT SECURITY SERVICE - Router Start                                                                               */
/**********************************************************************************************************************************************/
router.get(`/pss/dashboard`, (req, res, next) => {
    return res.render(`customizing/pss/dashboard`, {
        title: `${fms_config.title} - 대시보드`,
        grade: req.session.user.grade,
        type: 'pss_ds'
    });
});

router.get(`/pss/icomer`, (req, res, next) => {
    return res.render(`customizing/pss/icomer`, { title: `${fms_config.title} - PSS ICOMER 설정` });
});
/**********************************************************************************************************************************************/
/* by shkoh 20220720: PREGIDENT SECURITY SERVICE - Router End                                                                                 */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20230504: Defense Integrated Data Center SERVICE - Router Start                                                                   */
/**********************************************************************************************************************************************/
router.get(`/didc/dashboard`, (req, res, next) => {
    return res.render(`customizing/didc/dashboard`, {
        title: `${fms_config.title} - 대시보드`,
        grade: req.session.user.grade,
        type: `didc_ds`,
        site: fms_config.sub_site
    });
});

router.get(`/didc/diagram/popup`, async (req, res, next) => {
    const { id } = req.query;

    return res.render(`customizing/didc/diagram/setting`, {
        title: `${fms_config.title} - 설정(id: ${id})`,
        grade: req.session.user.grade,
        id: id
    });
});

router.get(`/didc/rackDiagram/popup`, async (req, res, next) => {
    const { id } = req.query;

    return res.render(`customizing/didc/rack/setting`, {
        title: `${fms_config.title} - 설정(id: ${id})`,
        grade: req.session.user.grade,
        id: id
    });
});

router.get(`/didc/powerDiagram/popup`, async (req, res, next) => {
    const { id } = req.query;

    return res.render(`customizing/didc/power/setting`, {
        title: `${fms_config.title} - 설정(id: ${id})`,
        grade: req.session.user.grade,
        id: id
    });
});

router.get(`/didc/airDiagram/popup`, async (req, res, next) => {
    const { id } = req.query;

    return res.render(`customizing/didc/air/setting`, {
        title: `${fms_config.title} - 설정(id: ${id})`,
        grade: req.session.user.grade,
        id: id
    });
});

router.get(`/didc/diagram/containment`, (req, res, next) => {
    let file_name = '';
    const { name } = req.query;

    let type = `containment`;
    if(name) {
        type = type.concat(`_`, name);
    }

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/didc`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/didc`, type, files[0]) : ``;
    } catch {}

    let sub_title = name ? name : '컨테인먼트 모니터링';

    return res.render(`customizing/didc/rack/index`, {
        title: `${fms_config.title} - ${sub_title}`,
        typeName: sub_title,
        grade: req.session.user.grade,
        type: type,
        is_heatmap: false,
        is_navigation: name ? false : true,
        image: file_name.replace(/\\/g, '/')
    });
});

router.get(`/didc/diagram/:mode`, (req, res, next) => {
    let file_name = '';
    const type = `${req.params.mode}`;

    try {
        const file_path = path.join(__dirname, `../public/img/diagram/didc`, type);
        const files = fs.readdirSync(file_path);
        file_name = files && files[0] ? path.join(`/img/diagram/didc`, type, files[0]) : ``;
    } catch {}

    let sub_title = '';
    let view_name = `customizing/didc/diagram/index`;
    switch(req.params.mode) {
        case 'hvac':
            sub_title = '냉동기 냉수 흐름도';
            view_name = `customizing/didc/air/index`;
        break;
        case 'ahu': {
            sub_title = '공조기 계통도';
            view_name = `customizing/didc/air/index`;
            break;
        }
        case 'power': {
            sub_title = '전기 계통도';
            view_name = `customizing/didc/power/index`;
            break;
        }
    }

    return res.render(view_name, {
        title: `${fms_config.title} - ${sub_title}`,
        typeName: sub_title,
        grade: req.session.user.grade,
        type: type,
        is_heatmap: false,
        image: file_name.replace(/\\/g, '/')
    });
});

router.get(`/didc/pue`, (req, res, next) => {
    return res.render(`customizing/didc/pue/index`, { title: `${fms_config.title} - 모니터링 | PUE 모니터링`, extra: '' });
});

router.get(`/didc/icomer`, (req, res, next) => {
    return res.render(`customizing/didc/icomer/index`, { title: `${fms_config.title} - 국방통합데이터센터 ICOMER 설정` });
});

router.get(`/didc/popup/dashboard`, async (req, res, next) => {
    const { id, type } = req.query;

    return res.render(`customizing/didc/dashboard/popup`, { title: `대시보드 설비정보`, id, type });
});

router.get(`/didc/popup/containmentset`, async (req, res, next) => {
    return res.render(`customizing/didc/dashboard/popupcontainmentset`, { title: `대시보드 컨테인먼트 설정` });
});

//by MJ 2023.08.30 : 자산 클릭시 팝업창
router.get(`/didc/popup/rack`, async (req, res, next) => {
    const { id } = req.query;

    return res.render(`customizing/didc/rack/popup`, { title: `설비세부정보`, id});
})

router.get(`/didc/popup/alertlist`, async (req, res, next) => {
    const { lvl } = req.query;

    return res.render(`customizing/didc/dashboard/alertlist`, { title: `장애현황`, lvl });
});
/**********************************************************************************************************************************************/
/* by shkoh 20230504: Defense Integrated Data Center SERVICE - Router End                                                                     */
/**********************************************************************************************************************************************/

module.exports = router;