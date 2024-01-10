const { pool, queries } = require(`../config/mariadb.config`);
const db_pd_code = require(`./pd_code`);
const db_cn_group = require(`../database/cn_group`);
const db_cn_icomer_mapping = require('../database/cn_icomer_mapping');

const insertWorkHistory = async (work_infos) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();
        
        let insert_query = '';
        for(let idx = 0; idx < work_infos.length; idx++) {
            insert_query += query.lg_work_history2.insert;
        }

        const result = await connection.query(insert_query, work_infos);
        return result;
    } catch (err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const getWorkHistory = async (info) => {
    let connection;

    try {
        const query = queries();
        connection = await pool.getConnection();

        const { startDate, endDate } = info;

        const q = query.lg_work_history2.get
                    .replace(/\$\$1/, startDate)
                    .replace(/\$\$2/, endDate);
        
        const rows = await connection.query(q);
        return rows;
    } catch (err) {
        if(connection) connection.end();
        return err;
    } finally {
        if(connection) connection.release();
    }
}

const addGroup = async (user_info, ip, add_info) => {
    const { id, user_name } = user_info;
    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '그룹추가',
        target_name: add_info.name,
        content: `* 그룹이 추가됐습니다`
    }];

    await insertWorkHistory(insert_data);
}

const deleteGroup = async (user_info, ip, delete_info) => {
    const { id, user_name } = user_info;
    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '그룹삭제',
        target_name: delete_info.name,
        content: `* 그룹이 삭제됐습니다`
    }];

    await insertWorkHistory(insert_data);
}

const updateGroup = async (user_info, ip, previous_info, info) => {
    let content = '';
    
    for(const key of [ 'pid', 'name', 'description', 'imageName' ]) {
        if(previous_info[key] !== info[key]) {
            if(content.length > 0) {
                content += '\n';
            }

            switch(key) {
                case 'pid': {
                    content += `* 상위그룹: ${info.p_group_name}`;
                    break;
                }
                case 'name': {
                    content += `* 그룹명: ${info[key]}`;
                    break;
                }
                case 'description': {
                    content += `* 설명: ${info[key]}`;
                    break;
                }
                case 'imageName': {
                    content += `* 이미지 파일: ${info[key]}`;
                    break;
                }
            }
        }
    }

    if(content.length > 0) {
        content += `\n(으)로 변경되었습니다`;
        
        const { id, user_name } = user_info;
        const insert_data = [{
            user_id: id,
            user_name: user_name,
            user_ip: ip,
            work_date: new Date(),
            worker_place: '그룹수정',
            target_name: info.name,
            content: content
        }];
        
        await insertWorkHistory(insert_data);
    }
}

const addEquipment = async (user_info, ip, add_info) => {
    const { id, user_name } = user_info;
    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '설비추가',
        target_name: add_info.name,
        content: `* 설비가 추가됐습니다`
    }];

    await insertWorkHistory(insert_data);
}

const deleteEquipment = async (user_info, ip, delete_info) => {
    const { id, user_name } = user_info;
    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '설비삭제',
        target_name: delete_info.name,
        content: `* 설비가 삭제됐습니다`
    }];

    await insertWorkHistory(insert_data);
}

const updateEquipment = async (user_info, ip, previous_info, info) => {
    let content = '';
    
    for(const key of [ 'b_use', 'name', 'pid', 'description', 'equip_code', 'model_name', 'ip', 'port', 'device_id', 'community', 'poll_interval', 'timeout', 'retry', 'user_define' ]) {
        if(previous_info[key] !== info[key]) {
            if(content.length > 0) {
                content += '\n';
            }

            switch(key) {
                case 'b_use': {
                    content += info[key] === 'Y' ? `* 설비를 사용합니다` : `* 설비를 사용하지 않습니다`;
                    break;
                }
                case 'name': {
                    content += `* 설비명: ${info[key]}`;
                    break;
                }
                case 'pid': {
                    content += `* 상위그룹: ${info.p_name}`;
                    break;
                }
                case 'description': {
                    content += `* 설명: ${info[key]}`;
                    break;
                }
                case 'equip_code': {
                    const code = await db_pd_code.getEquipCodeForMap(info[key]);
                    content += `* 설비타입: ${code.name}`
                    break;
                }
                case 'model_name': {
                    content += `* 설비모델: ${info[key]}`;
                    break;
                }
                case 'ip': {
                    content += `* IP: ${info[key]}`;
                    break;
                }
                case 'port': {
                    content += `* Port: ${info[key]}`;
                    break;
                }
                case 'device_id': {
                    content += `* Device ID: ${info[key]}`;
                    break;
                }
                case 'community': {
                    content += `* Community: ${info[key]}`;
                    break;
                }
                case 'poll_interval': {
                    content += `* 수집주기(초): ${info[key]}`;
                    break;
                }
                case 'timeout': {
                    content += `* 응답대기시간(초): ${info[key]}`;
                    break;
                }
                case 'retry': {
                    content += `* 재시도횟수: ${info[key]}`;
                    break;
                }
                case 'user_define': {
                    content += `* 사용자정의: ${info[key]}`;
                    break;
                }
             }
        }
    }

    if(content.length > 0) {
        content += `\n(으)로 변경되었습니다`;
        
        const { id, user_name } = user_info;
        const insert_data = [{
            user_id: id,
            user_name: user_name,
            user_ip: ip,
            work_date: new Date(),
            worker_place: '설비수정',
            target_name: info.name,
            content: content
        }];
        
        await insertWorkHistory(insert_data);
    }
}

const updateSensor = async (user_info, ip, previous_infos, infos) => {
    for(let idx = 0; idx < infos.length; idx++) {
        const p_info = previous_infos[idx];
        const info = infos[idx];
        
        let content = '';

        for(const key of [ 'sensor_name', 'node_id', 'sensor_type', 'sensor_code', 'div_value', 'user_define', 'oid', 'mc_id', 'b_display', 'b_event', 'b_use' ]) {
            if(p_info[key] !== info[key]) {
                if(content.length > 0) {
                    content += '\n';
                }
    
                switch(key) {
                    case 'sensor_name': {
                        content += `* 설비명: ${info[key]}`;
                        break;
                    }
                    case 'node_id': {
                        content += `* 노드: ${info[key]}`;
                        break;
                    }
                    case 'sensor_type': {
                        content += info[key] === 'AI' ? `* AI센서로 변경` : `* DI센서로 변경`;
                        break;
                    }
                    case 'sensor_code': {
                        content += `* 종류: ${info[key]}`;
                        break;
                    }
                    case 'div_value': {
                        content += `* 표현식: ${info[key]}`
                        break;
                    }
                    case 'user_define': {
                        content += `* 사용자정의: ${info[key]}`;
                        break;
                    }
                    case 'oid': {
                        content += `* ADDRESS: ${info[key]}`;
                        break;
                    }
                    case 'mc_id': {
                        content += `* MODBUS ID: ${info[key]}`;
                        break;
                    }
                    case 'b_display': {
                        content += `* 표시여부: ${info[key] === 'Y' ? 'Yes' : 'No'}`;
                        break;
                    }
                    case 'b_event': {
                        content += `* 알람여부: ${info[key] === 'Y' ? 'Yes' : 'No'}`;
                        break;
                    }
                    case 'b_use': {
                        content += `* 사용여부: ${info[key] === 'Y' ? 'Yes' : 'No'}`;
                        break;
                    }
                 }
            }
        }
    
        if(content.length > 0) {
            content += `\n(으)로 변경되었습니다`;
            
            const { id, user_name } = user_info;
            const insert_data = [{
                user_id: id,
                user_name: user_name,
                user_ip: ip,
                work_date: new Date(),
                worker_place: '센서 기본정보수정',
                target_name: `[${info.equip_name}] ${info.sensor_name}`,
                content: content
            }];
            
            await insertWorkHistory(insert_data);
        }
    }
}

const updateThreshold = async (user_info, ip, previous_sensor, previous_threshold, sensor_info, threshold_info) => {
    for(let idx = 0; idx < threshold_info.length; idx++) {
        const p_sensor = previous_sensor[idx];
        const p_threshold = previous_threshold[idx];
        const sensor = sensor_info[idx];
        const threshold = threshold_info[idx];
        
        let content = '';

        for(let idx = 0; idx < 3; idx++) {
            const p_flag = p_sensor.event_mode.charAt(idx);
            const flag = sensor.event_mode.charAt(idx);

            if(p_flag !== flag) {
                if(content.length > 0) {
                    content += '\n';
                }

                const type = '';
                switch(idx) {
                    case 0: { type = '팝업'; break; }
                    case 1: { type = 'SMS'; break; }
                    case 2: { type = 'Email'; break; }
                }
                content += `* ${type}: ${flag === 'Y' ? 'Yes' : 'No'}`
            }
        }

        const threhold_key = [
            'a_critical_min',
            'a_major_min',
            'a_warning_min',
            'a_warning_max',
            'a_critical_max',
            'a_major_max',
            'd_value_0_level', 'd_value_0_label',
            'd_value_1_level', 'd_value_1_label',
            'd_value_2_level', 'd_value_2_label',
            'd_value_3_level', 'd_value_3_label',
            'd_value_4_level', 'd_value_4_label',
            'd_value_5_level', 'd_value_5_label',
            'd_value_6_level', 'd_value_6_label',
            'd_value_7_level', 'd_value_7_label',
            'holding_time'
        ];
        
        for(const key of threhold_key) {
            if(p_threshold[key] !== threshold[key]) {
                if(content.length > 0) {
                    content += '\n';
                }
    
                switch(key) {
                    case 'holding_time': {
                        content += `* 지연시간(초): ${threshold[key]}`;
                        break;
                    }
                    case 'a_warning_min': {
                        content += `* 하한 주의: ${threshold[key]}`;
                        break;
                    }
                    case 'a_warning_max': {
                        content += `* 상한 주의: ${threshold[key]}`;
                        break;
                    }
                    case 'a_major_min': {
                        content += `* 하한 경고: ${threshold[key]}`;
                        break;
                    }
                    case 'a_major_max': {
                        content += `* 상한 경고: ${threshold[key]}`;
                        break;
                    }
                    case 'a_critical_min': {
                        content += `* 하한 위험: ${threshold[key]}`;
                        break;
                    }
                    case 'a_critical_max': {
                        content += `* 상한 위험: ${threshold[key]}`;
                        break;
                    }
                    case 'd_value_0_level': {
                        if(threshold.level_0) {
                            content += `* 0:등급: ${threshold.level_0}`;
                        } else {
                            content += `* 0:등급: 선택안함`
                        }
                        break;
                    }
                    case 'd_value_0_label': {
                        content += `* 0:표기: ${threshold[key]}`;
                        break;
                    }
                    case 'd_value_1_level': {
                        if(threshold.level_1) {
                            content += `* 1:등급: ${threshold.level_1}`;
                        } else {
                            content += `* 1:등급: 선택안함`
                        }
                        break;
                    }
                    case 'd_value_1_label': {
                        content += `* 1:표기: ${threshold[key]}`;
                        break;
                    }
                    case 'd_value_2_level': {
                        if(threshold.level_2) {
                            content += `* 2:등급: ${threshold.level_2}`;
                        } else {
                            content += `* 2:등급: 선택안함`
                        }
                        break;
                    }
                    case 'd_value_2_label': {
                        content += `* 2:표기: ${threshold[key]}`;
                        break;
                    }
                    case 'd_value_3_level': {
                        if(threshold.level_3) {
                            content += `* 3:등급: ${threshold.level_3}`;
                        } else {
                            content += `* 3:등급: 선택안함`
                        }
                        break;
                    }
                    case 'd_value_3_label': {
                        content += `* 3:표기: ${threshold[key]}`;
                        break;
                    }
                    case 'd_value_4_level': {
                        if(threshold.level_4) {
                            content += `* 4:등급: ${threshold.level_4}`;
                        } else {
                            content += `* 4:등급: 선택안함`
                        }
                        break;
                    }
                    case 'd_value_4_label': {
                        content += `* 4:표기: ${threshold[key]}`;
                        break;
                    }
                    case 'd_value_5_level': {
                        if(threshold.level_5) {
                            content += `* 5:등급: ${threshold.level_5}`;
                        } else {
                            content += `* 5:등급: 선택안함`
                        }
                        break;
                    }
                    case 'd_value_5_label': {
                        content += `* 5:표기: ${threshold[key]}`;
                        break;
                    }
                    case 'd_value_6_level': {
                        if(threshold.level_6) {
                            content += `* 6:등급: ${threshold.level_6}`;
                        } else {
                            content += `* 6:등급: 선택안함`
                        }
                        break;
                    }
                    case 'd_value_6_label': {
                        content += `* 6:표기: ${threshold[key]}`;
                        break;
                    }
                    case 'd_value_7_level': {
                        if(threshold.level_7) {
                            content += `* 7:등급: ${threshold.level_7}`;
                        } else {
                            content += `* 7:등급: 선택안함`
                        }
                        break;
                    }
                    case 'd_value_7_label': {
                        content += `* 7:표기: ${threshold[key]}`;
                        break;
                    }
                 }
            }
        }
    
        if(content.length > 0) {
            content += `\n(으)로 변경되었습니다`;
            
            const { id, user_name } = user_info;
            const insert_data = [{
                user_id: id,
                user_name: user_name,
                user_ip: ip,
                work_date: new Date(),
                worker_place: '센서 임계값 수정',
                target_name: `[${sensor.equip_name}] ${sensor.sensor_name}`,
                content: content
            }];
            
            await insertWorkHistory(insert_data);
        }
    }
}

const addUser = async (user_info, ip, add_user) => {
    const { id, user_name } = user_info;
    
    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '사용자 계정 추가',
        target_name: `${add_user.user_id}: ${add_user.name}`,
        content: `* 사용자 계정이 추가됐습니다`
    }];

    await insertWorkHistory(insert_data);
}

const updateUser = async (user_info, ip, previous_user, user) => {
    const update_key = [
        'password',
        'name',
        'user_level_code',
        'basic_group_id',
        'mobile',
        'email',
        'department_code',
        'memo',
        'alarm_type_enable',
        'event_enable',
        'week_enable',
        'hour_enable'
    ];

    let content = '';
    for(const key of update_key) {
        if(previous_user[key] !== user[key]) {
            if(content.length > 0) {
                content += '\n';
            }

            switch(key) {
                case 'password': {
                    content += `* 패스워드를 변경했습니다`;
                    break;
                }
                case 'name': {
                    content += `* 사용자명: ${user[key]}`;
                    break;
                }
                case 'user_level_code': {
                    content += `* 사용자권한: ${user.user_level_code_name}`
                    break;
                }
                case 'basic_group_id': {
                    const group = await db_cn_group.getGroupInfo(user.user_id, user[key]);
                    content += `* 시작그룹: ${group.name}`;
                    break;
                }
                case 'mobile': {
                    content += `* 모바일: ${user[key]}`
                    break;
                }
                case 'email': {
                    content += `* 이메일: ${user[key]}`
                    break;
                }
                case 'deparment_code': {
                    content += `* 부서: ${user[key]}`
                    break;
                }
                case 'memo': {
                    const memo_size = user[key].length;
                    const desc = memo_size > 20 ? `${user[key].substring(0, 20)}...` : user[key];
                    content += `* 메모: ${desc}`;
                    break;
                }
                case 'alarm_type_enable': {
                    const type = user[key];
                    content += `* 알람타입: Popup(${type.charAt(0)}), SMS(${type.charAt(1)}), E-mail(${type.charAt(2)})`;
                    break;
                }
                case 'event_enable': {
                    const alert = user[key].charAt(0);
                    const comm = user[key].charAt(1);

                    const alert_text = (alert === '9') ? '알람 발생안함' : (alert === '1') ? '주의, 경고, 위험' : (alert === '2') ? '경고, 위험' : (alert === '3') ? '위험' : '';
                    const comm_text = (comm === '9') ? '통신장애 발생안함' : (comm === '4') ? '응답없음, 통신불량' : (comm === '5') ? '통신불량' : '';

                    content += `* 알람요건: ${alert_text}${alert_text.length > 0 ? ', ' : ''}${comm_text}`;
                    break;
                }
                case 'week_enable': {
                    const week = user[key];
                    content += `* 알람요일: 월(${week.charAt(0)}), 화(${week.charAt(1)}), 수(${week.charAt(2)}), 목(${week.charAt(3)}), 금(${week.charAt(4)}), 토(${week.charAt(5)}), 일(${week.charAt(6)})`;
                    break;
                }
                case 'hour_enable': {
                    const hour = user[key];
                    content += `* 알람시간\n`;
                    for(let idx = 0; idx < 24; idx++) {
                        const h = `${('00' + idx.toString()).slice(-2)}시(${hour.charAt(idx)})`;
                        content += h;
                        
                        if((idx + 1) % 8 === 0) {
                            content += '\n';
                        } else {
                            content += ' ';
                        }
                    }
                    break;
                }
            }
        }
    }

    if(content.length > 0) {
        content += `\n(으)로 변경되었습니다`;

        const { id, user_name } = user_info;
        const insert_data = [{
            user_id: id,
            user_name: user_name,
            user_ip: ip,
            work_date: new Date(),
            worker_place: '사용자 계정 정보 수정',
            target_name: `${user.user_id}: ${user.name}`,
            content: content
        }];
        
        await insertWorkHistory(insert_data);
    }
}

const updateUserByAlarmEquipments = async (user_info, ip, user, equip_ids) => {
    const { id, user_name } = user_info;

    let content = `* 알람발생설비: ${equip_ids.length}개 적용`;
    if(equip_ids.length > 0) {
        content += `\n    설비ID: ${equip_ids}`;
    }
        
    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '사용자 계정 알람 발생설비 설정',
        target_name: `${user.user_id}: ${user.name}`,
        content: content
    }];
    
    await insertWorkHistory(insert_data);
}

const deleteUser = async (user_info, ip, user) => {
    const { id, user_name } = user_info;
        
    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '사용자 계정 삭제',
        target_name: `${user.user_id}: ${user.name}`,
        content: `* 계정ID: ${user.user_id} 가 삭제되었습니다`
    }];
    
    await insertWorkHistory(insert_data);
}

const updateDashboard = async (user_info, ip, obj_name, title, equip_ids) => {
    const { id, user_name } = user_info;
    
    let target_name = '';
    let content = '';
    
    if(title) {
        content = `* 명칭변경: ${title}`;
    }

    if(equip_ids) {
        const ids = equip_ids.split(',');

        content += `* 연계설비 변경: ${ids.length}개 적용`;
        if(ids.length > 0) {
            content += `\n    설비ID: ${equip_ids}`;
        }
    }

    switch(obj_name) {
        case 'i-temphumi-1': target_name = '온습도 1'; break;
        case 'i-temphumi-2': target_name = '온습도 2'; break;
        case 'i-temphumi-3': target_name = '온습도 3'; break;
        case 'i-temphumi-4': target_name = '온습도 4'; break;
        case 'i-temphumi-5': target_name = '온습도 5'; break;
        case 'i-icon-ac': target_name = '공조'; break;
        case 'i-icon-distribute': target_name = '분전반'; break;
        case 'i-icon-elec': target_name = '전력'; break;
        case 'i-icon-fire-b1f': target_name = '소방 B1F'; break;
        case 'i-icon-fire-b2f': target_name = '소방 B2F'; break;
        case 'i-icon-hvac': target_name = '항온항습기'; break;
        case 'i-icon-rack': target_name = '랙'; break;
        case 'i-icon-temphumi': target_name = '온습도'; break;
        case 'i-leak-b1f-1': target_name = '누수 B1F - 1'; break;
        case 'i-leak-b1f-2': target_name = '누수 B1F - 2'; break;
        case 'i-leak-b1f-3': target_name = '누수 B1F - 3'; break;
        case 'i-leak-b2f-1': target_name = '누수 B2F - 1'; break;
        case 'i-leak-b2f-2': target_name = '누수 B2F - 2'; break;
        case 'i-leak-b2f-3': target_name = '누수 B2F - 3'; break;
        case 'i-leak-b2f-4': target_name = '누수 B2F - 4'; break;
        case 'i-ups-aa-1': target_name = 'UPS AA1'; break;
        case 'i-ups-aa-2': target_name = 'UPS AA2'; break;
        case 'i-ups-aa-3': target_name = 'UPS AA3'; break;
        case 'i-ups-aa-4': target_name = 'UPS AA4'; break;
        case 'i-ups-aa-5': target_name = 'UPS AA5'; break;
        case 'i-ups-bb-1': target_name = 'UPS BB1'; break;
        case 'i-ups-bb-2': target_name = 'UPS BB2'; break;
        case 'i-ups-bb-3': target_name = 'UPS BB3'; break;
        case 'i-ups-bb-4': target_name = 'UPS BB4'; break;
        case 'i-ups-bb-5': target_name = 'UPS BB5'; break;
        case 'i-battery-aa-1': target_name = '배터리 AA1'; break;
        case 'i-battery-aa-2': target_name = '배터리 AA2'; break;
        case 'i-battery-aa-3': target_name = '배터리 AA3'; break;
        case 'i-battery-aa-4': target_name = '배터리 AA4'; break;
        case 'i-battery-aa-5': target_name = '배터리 AA5'; break;
        case 'i-battery-bb-1': target_name = '배터리 BB1'; break;
        case 'i-battery-bb-2': target_name = '배터리 BB2'; break;
        case 'i-battery-bb-3': target_name = '배터리 BB3'; break;
        case 'i-battery-bb-4': target_name = '배터리 BB4'; break;
        case 'i-battery-bb-5': target_name = '배터리 BB5'; break;
        case 'i-hvac-run-1': target_name = '항온항습기 가동현황 - 1'; break;
        case 'i-hvac-run-2': target_name = '항온항습기 가동현황 - 2'; break;
        case 'i-hvac-run-3': target_name = '항온항습기 가동현황 - 3'; break;
        case 'i-power-it': target_name = '전력 사용현황 - 1'; break;
        case 'i-power-hvac': target_name = '전력 사용현황 - 2'; break;
        case 'i-power-loss': target_name = '전력 사용현황 - 3'; break;
        case 'i-icon-wind': target_name = '풍속'; break;
        case 'i-pue': target_name = 'PUE'; break;
    }

    // by shkoh 20231116: containment는 복수로 데이터를 받아내기 때문에 해당 항목만 따로 처리함
    if(target_name.length === 0 && obj_name.includes('i-containment-')) {
        const containments = await db_cn_icomer_mapping.getDidcContainmentList('i_dashboard');
        const c = containments.find((ct) => ct.object_name === obj_name);
        if(c) {
            target_name = c.name;
        }
    }

    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '종합 대시보드 설정',
        target_name: target_name,
        content: content
    }];

    await insertWorkHistory(insert_data);
}

const addContainmentToDashboard = async (user_info, ip, insert_id) => {
    const { id, user_name } = user_info;

    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '종합 대시보드 설정',
        target_name: `Containment ID: ${insert_id}`,
        content: `* 대시보드에서 사용할 컨테인먼트 항목을 추가했습니다`
    }];

    await insertWorkHistory(insert_data);
}

const updateContainmentToDashboard = async (user_info, ip, update_id, name) => {
    const { id, user_name } = user_info;

    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '종합 대시보드 설정',
        target_name: `Containment ID: ${update_id}`,
        content: `* 컨테인먼트명 변경: ${name}`
    }];

    await insertWorkHistory(insert_data);
}

const deleteContainmentToDashboard = async (user_info, ip, delete_id, name) => {
    const { id, user_name } = user_info;

    const insert_data = [{
        user_id: id,
        user_name: user_name,
        user_ip: ip,
        work_date: new Date(),
        worker_place: '종합 대시보드 설정',
        target_name: `Containment ID: ${delete_id}`,
        content: `* [${name}] 컨테인먼트 항목을 삭제했습니다`
    }];

    await insertWorkHistory(insert_data);
}

module.exports = {
    insertWorkHistory,
    getWorkHistory,
    addGroup,
    deleteGroup,
    updateGroup,
    addEquipment,
    deleteEquipment,
    updateEquipment,
    updateSensor,
    updateThreshold,
    addUser,
    updateUser,
    updateUserByAlarmEquipments,
    deleteUser,
    updateDashboard,
    addContainmentToDashboard,
    updateContainmentToDashboard,
    deleteContainmentToDashboard
}