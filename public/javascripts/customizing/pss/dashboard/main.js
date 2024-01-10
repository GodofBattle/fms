const g_series_color = [ '#2f6c9e', '#3f9cae', '#b01908', '#a3944e' ];

const g_hvac_name = [
    '"hvac_1"', '"hvac_2"', '"hvac_3"', '"hvac_4"', '"hvac_5"', '"hvac_6"'
];

const g_th_name = [
    '"th_1"', '"th_2"', '"th_3"', '"th_4"', '"th_5"', '"th_6"', '"th_7"', '"th_8"'
];

const g_threshold_name = [
    '"threshold_t"', '"threshold_h"'
];

const g_panel_name = [
    '"panel_1"', '"panel_2"', '"panel_3"', '"panel_4"', '"panel_5"', '"panel_6"', '"panel_7"', '"panel_8"'
];

const g_power_name = [
    '"kw_it"', '"kw_hvac"'
];

const g_gauge = [
    { id: 'th_server', temp: undefined, humi: undefined },
    { id: 'th_ups', temp: undefined, humi: undefined },
    { id: 'th_did', temp: undefined, humi: undefined },
];

const g_ups = [
    '"ups1_battery"', '"ups1_r"', '"ups1_s"', '"ups1_t"', '"ups1_mode"', '"ups1_r_load"', '"ups1_s_load"', '"ups1_t_load"',
    '"ups2_battery"', '"ups2_r"', '"ups2_s"', '"ups2_t"', '"ups2_mode"', '"ups2_r_load"', '"ups2_s_load"', '"ups2_t_load"'
];

const g_liquid_guage_config = liquidFillGaugeDefaultSettings();

$(function() {
    initGauge();
    initPowerChart();

    loadItems();

    initAlarmList();
});

function initGauge() {
    g_liquid_guage_config.circleColor = "url(#gaugeBarColor)";
    g_liquid_guage_config.textColor = "#ffffff";
    g_liquid_guage_config.textSize = 0.65;
    g_liquid_guage_config.waveTextColor = "#efefef";
    g_liquid_guage_config.waveColor = "url(#waveColorBlue)";
    g_liquid_guage_config.circleThickness = 0.04;
    g_liquid_guage_config.textVertPosition = 0.15;
    g_liquid_guage_config.maxValue = 110;
    
    g_liquid_guage_config.waveAnimateTime = 1000;
    g_liquid_guage_config.waveHeight = 0.09;
    g_liquid_guage_config.waveAnimate = true;
    g_liquid_guage_config.waveRise = false;
    g_liquid_guage_config.waveHeightScaling = false;

    g_gauge.forEach(function(g) {
        g.temp = $('#' + g.id + ' > .temp-gauge').kendoArcGauge({
            centerTemplate: '<span class="i-temp-value">#: value #℃</span>',
            scale: {
                rangeSize: 15,
                rangeLineCap: 0,
                rangePlaceholderColor: '#c5d1ed61',
                max: 50,
                min: 0
            },
            color: 'url(#arcBarColor)'
        }).data('kendoArcGauge');

        g.humi = loadLiquidFillGauge(g.id + '_humi-gauge', 0, g_liquid_guage_config);
    });
}

function initPowerChart() {
    $('#power_chart_kw').kendoChart({
        dataSource: {
            transport: {
                read: {
                    url: '/api/pss/icomer/powerChart?pagename=i_dashboard',
                    dataType: 'json'
                }
            }
        },
        chartArea: {
            background: '',
            margin: {
                left: 5,
                right: 5,
                top: 0,
                bottom: 1
            }
        },
        legend: {
            visible: true,
            position: 'bottom',
            offsetX: 0,
            offsetY: 0,
            labels: {
                font: '1.4rem Malgun Gothic',
                color: '#ffffff'
            }
        },
        series: [{
            name: 'IT전력(UPS, MWh)',
            field: 'kwh_it',
            categoryField: 'month',
        }, {
            name: '항온전력(한전, MWh)',
            field: 'kwh_hvac',
            categoryField: 'month'
        }],
        seriesColors: g_series_color,
        seriesDefaults: {
            type: 'column',
            stack: true,
            labels: {
                visible: true,
                font: '1.2rem Malgun Gothic;text-shadow:1px 1px #111111;transform:translate(-3px,0px)',
                position: 'center',
                color: '#ffffff',
                template: function(data) {
                    if(data.value < 10) return '';
                    else return kendo.toString(data.value, '#,##.0');
                }
            }
        },
        valueAxis: {
            crosshair: {
                dashType: 'dot',
                tooltip: {
                    visible: true,
                    format: '{0:#,##.0}MWh'
                },
                visible: true
            },
            line: {
                visible: true
            },
            majorTicks: {
                visible: false
            },
            majorGridLines: {
                visible: false,
                step: 2
            },
            minorGridLines: {
                visible: false
            },
            visible: false
        },
        categoryAxis: {
            majorTicks: {
                visible: false
            },
            majorGridLines: {
                visible: false
            },
            minorGridLines: {
                visible: false,
                step: 2,
                skip: 1
            },
            color: '#fefefe',
            labels: {
                template: function(data) {
                    return data.value.replace('.', '\n');
                },
                font: '0.9rem Malgun Gothic'
            }
        },
        theme: 'uniform'
    })
}

function initAlarmList() {
    loadAlarmList();
}

function setServerTime(datetime) {
    const t = new Date(datetime);

    const MM = ('0' + (t.getMonth() + 1)).slice(-2);
    const dd = ('0' + t.getDate()).slice(-2);
    const HH = ('0' + t.getHours()).slice(-2);
    const mm = ('0' + t.getMinutes()).slice(-2);
    const column = t.getSeconds() % 2 == 0 ? ':' : ' ';
    const date = t.getFullYear().toString() + '-' + MM + '-' + dd;

    $('#server_time .i-text.date').text(date);
    $('#server_time .i-text.hour').text(HH);
    $('#server_time .i-text.column').text(column);
    $('#server_time .i-text.minute').text(mm);
}

function loadAlarmList() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: true,
        url: '/api/pss/icomer/alarmlist',
        dataType: 'json',
    }).done(function(data) {
        setAlarmList(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function setAlarmList(data) {
    const ele = $('#alarm_list');

    if(ele.length === 1) {
        const alarmListEle = ele.find('.i-alarm-list').empty()
        
        if(data.length === 0) {
            const html = '<div class="i-alarm-no-item">환경설비가 정상 가동 중입니다</div>';
            alarmListEle.append(html).css({ 'left': '0px', 'justify-content': 'center'});
            setTimeout(function() {
                loadAlarmList();
            }, 10000);
        } else {
            alarmListEle.css('left', '1330px');
            const alarm_template = kendo.template($('#alarm-template').html());
            
            // by shkoh 20220726: Step 01. 현재 장애 알람리스트 목록을 한줄로 표현한다
            data.forEach(function(d, index) {
                const { equip_name, lvl, lvl_text } = d;                
                const html = alarm_template({ lvl: 'lvl' + lvl.toString(), name: equip_name, alarm: lvl_text });
                alarmListEle.append(html);
            });
    
            // by shkoh 20220726: Step 02. 알람리스트의 항목의 크기를 계산하여 전체 길이를 구한다
            let alarms_total_width = 0;
            alarmListEle.find('.i-alarm-item').each(function() {
                const item = $(this);
                let item_w = item.outerWidth(true);
                alarms_total_width += item_w;
            });
    
            // by shkoh 20220726: Step 03. 알람리스트에 마우스오버되는 경우에 애니메이션을 멈추는 동작을 추가
            alarmListEle.hover(function() {
                $(this).clearQueue();
                $(this).stop();
            }, function() {
                runAlarmAnimation(alarms_total_width);
            });
            
            // by shkoh 20220726: Step 04. 애니메이션 동작 정의, 완료 후에는 알람리스트를 다시 불러와서 시작
            runAlarmAnimation(alarms_total_width);
        }
    }
}

function runAlarmAnimation(total_width) {
    const animate_list = $('#alarm_list').find('.i-alarm-list');
    
    const animate_list_left = parseFloat(animate_list.css('left'));
    const moving_time_per_px = 10000 / 1310;
    
    const move_distance = '-' + total_width + 'px';
    const duration = (total_width + animate_list_left) * moving_time_per_px;
    
    $('#alarm_list').find('.i-alarm-list')
        .stop()
        .animate({
            left: move_distance
        }, {
            duration: duration,
            easing: 'linear',
            done: function() {
                $(this).css('left', '1330px');
            },
            complete: function() {
                loadAlarmList();
            }
        });
}

function loadItems() {
    loadHVACData();
    loadTHData();
    loadGaugeData();
    loadPanelData();
    loadPowerData();
    loadUpsData();
    loadThresholdData();

    $('#power_chart_kw').data('kendoChart').dataSource.read();
}

function loadThresholdData() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/pss/icomer/threshold?pagename=i_dashboard&objectname=' + g_threshold_name.toString(),
        dataType: 'json'
    }).done(function(data) {
        setThresholdData(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function setThresholdData(data) {
    data.forEach(function(datum) {
        const { object_name, w_min, w_max } = datum;
        const ele = $('#' + object_name);

        if(ele.length === 1 && ele.hasClass('i-title-threshold')) {
            const min = w_min ? w_min.toFixed(0) : ' - ';
            ele.find('.i-threshold-min').text(min);

            const max = w_max ? w_max.toFixed(0) : ' - ';
            ele.find('.i-threshold-max').text(max);
        }
    });
}

function loadUpsData() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/pss/icomer/ups?pagename=i_dashboard&objectname=' + g_ups.toString(),
        dataType: 'json'
    }).done(function(data) {
        setUpsData(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function setUpsData(data) {
    data.forEach(function(datum) {
        const { object_name, val, lvl, equip_lvl, mode } = datum;
        const ele = $('#' + object_name);
        
        // by shkoh 20220725: 배터리 충전률 표현
        if(ele.length === 1 && ele.hasClass('i-ups-battery')) {
            const battey_val = equip_lvl < 4 ? val.toFixed(0) : ' - ';
            ele.find('.i-battery-value')
                .text(battey_val)
                .removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                .addClass('lvl' + lvl);

            ele.find('.i-battery-img').removeClass('c20 c40 c60 c80 c100')
            
            if(val < 40) {
                ele.find('.i-battery-img').addClass('c20');
            } else if(val < 60) {
                ele.find('.i-battery-img').addClass('c40');
            } else if(val < 80) {
                ele.find('.i-battery-img').addClass('c60');
            } else if(val < 100) {
                ele.find('.i-battery-img').addClass('c80');
            } else if(val === 100) {
                ele.find('.i-battery-img').addClass('c100');
            }
        }

        // by by shkoh 20220725: 일반 UPS 출력 표시
        if(ele.length === 1 && ele.hasClass('i-ups-text') && mode === null) {
            const _val = equip_lvl < 4 ? val.toFixed(1) : ' - ';
            ele.find('span').text(_val)
                .removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                .addClass('lvl' + lvl);
        }

        // by shkoh 20220725: UPS 상태 표시
        if(ele.length === 1 && ele.hasClass('i-ups-text-mode')) {
            const _mode = equip_lvl < 4 || mode !== null ? mode : ' - ';
            ele.find('span').text(_mode)
                .removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                .addClass('lvl' + lvl);
        }

        if(ele.length === 1 && ele.hasClass('i-load-factor')) {
            const load_value = equip_lvl < 4 ? val.toFixed(1) : ' - ';
            ele.find('.i-load-text .i-load-value').text(load_value);

            if(load_value !== ' - ')  {
                const move_px = 170.0 * parseFloat(load_value) / 100.0;
                ele.find('.i-load-gauge')
                    .css({ 'background-position-x': '-170px' })
                    .animate({ 'background-position-x': '+=' + move_px + 'px' }, 1500);
            }
        }
    });
}

function loadPowerData() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/pss/icomer/power?pagename=i_dashboard&objectname=' + g_power_name.toString(),
        dataType: 'json'
    }).done(function(data) {
        setPowerData(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function setPowerData(data) {
    const it = data.find(function(d) { return d.object_name === 'kw_it' });
    const hvac = data.find(function(d) { return d.object_name === 'kw_hvac' });
    
    let it_val = it && it.val ? it.val.toFixed(1) : ' - ';
    let hvac_val = hvac && hvac.val ? hvac.val.toFixed(1) : ' - ';
    let kw_val = it && hvac && it.val && hvac.val ? (it.val + hvac.val).toFixed(1) : ' - ';

    const it_ele = $('#kw_it');
    if(it_ele.length === 1) {
        it_ele.find('span').text(it_val);
    }

    const hvac_ele = $('#kw_hvac');
    if(hvac_ele.length === 1) {
        hvac_ele.find('span').text(hvac_val);
    }

    const kw_ele = $('#kw');
    if(kw_ele.length === 1) {
        kw_ele.find('span').text(kw_val);
    }
}

function loadPanelData() {    
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/pss/icomer/panel?pagename=i_dashboard&objectname=' + g_panel_name.toString(),
        dataType: 'json'
    }).done(function(data) {
        setPanelData(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function setPanelData(data) {
    data.forEach(function(datum) {
        const { object_name, sensor_name, code, val, lvl, equip_lvl } = datum;
        const ele = $('#' + object_name);
        
        if(ele.length === 1) {
            if(code === 'S0005' && sensor_name.includes('R')) {
                let r_val = equip_lvl > 3 ? ' - ' : val.toFixed(1);
                ele.find('.panel-r').text(r_val);
            } else if(code === 'S0005' && sensor_name.includes('S')) {
                let s_val = equip_lvl > 3 ? ' - ' : val.toFixed(1);
                ele.find('.panel-s').text(s_val);
            } else if(code === 'S0005' && sensor_name.includes('T')) {
                let s_val = equip_lvl > 3 ? ' - ' : val.toFixed(1);
                ele.find('.panel-t').text(s_val);
            } else if(code === 'S0009') {
                let kw_val = equip_lvl > 3 ? ' - ' : val.toFixed(1);
                ele.find('.panel-kw').text(kw_val);
            }
        }
    });
}

function loadGaugeData() {
    const g_gauge_id = g_gauge.map(function(g) { return g.id });
    
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/pss/icomer/gauge?pagename=i_dashboard&objectname=' + g_gauge_id.toString(),
        dataType: 'json'
    }).done(function(data) {
        setGaugeData(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function setGaugeData(data) {
    data.forEach(function(datum) {
        const { object_name, temp, humi, max_temp, max_humi, lvl_temp, lvl_humi } = datum;

        const ele = $('#' + object_name);
        const gauge_inst = g_gauge.find(function(g) { return g.id === object_name });

        // by shkoh 20220725: 최대 온도 / 습도 등록
        if(ele.length === 1) {
            $('#' + object_name + ' .i-max-temp-value').text(max_temp !== null ? max_temp : ' - ');
            $('#' + object_name + ' .i-max-humi-value').text(max_humi !== null ? max_humi : ' - ');
        }

        // by shkoh 20220725: 습도의 값 등록
        if(gauge_inst.humi) {
            gauge_inst.humi.update(humi !== null ? humi.toFixed(1) : 0);

            $('#' + object_name + ' .liquidFillGaugeText')
                .removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                .addClass('lvl' + lvl_humi);
        }

        // by shkoh 20220725: 온도값 등록
        if(gauge_inst.temp) {
            gauge_inst.temp.value(temp !== null ? temp.toFixed(1) : 0);

            $('#' + object_name + ' .i-temp-value')
                .removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                .addClass('lvl' + lvl_temp);
        }
    });
}

function loadTHData() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/pss/icomer/th?pagename=i_dashboard&objectname=' + g_th_name.toString(),
        dataType: 'json'
    }).done(function(data) {
        setTHData(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function setTHData(data) {
    data.forEach(function(datum) {
        const ele = $('#' + datum.object_name);

        if(ele.length === 1) {
            const { sensor_code, equip_lvl, lvl, val } = datum;

            switch(sensor_code) {
                case 'S0001': {
                    // by shkoh 20220722: 온도
                    let text_temp = equip_lvl > 3 ? ' - ' : val.toFixed(1);
                    ele.find('.i-th-icon-text.temp > span.temp')
                        .text(text_temp);
                    
                    ele.find('.i-th-icon-text.temp > span')
                        .removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                        .addClass('lvl' + lvl);
                    break;
                }
                case 'S0002': {
                    // by shkoh 20220722: 습도
                    let text_humi = equip_lvl > 3 ? ' - ' : val.toFixed(1);
                    ele.find('.i-th-icon-text.humi > span.humi')
                        .text(text_humi)
                    
                    ele.find('.i-th-icon-text.humi > span')
                        .removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                        .addClass('lvl' + lvl);
                    break;
                }
            }            
        }
    });
}

function loadHVACData() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/pss/icomer/hvac?pagename=i_dashboard&objectname=' + g_hvac_name.toString(),
        dataType: 'json'
    }).done(function(data) {
        setHVACData(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function setHVACData(data) {
    data.forEach(function(datum) {
        const ele = $('#' + datum.object_name);

        if(ele.length === 1) {
            const { sensor_code, equip_lvl, lvl, val } = datum;

            switch(sensor_code) {
                case 'S0001': {
                    // by shkoh 20220722: 항온항습기 온도
                    let text_temp = equip_lvl > 3 ? ' - ' : val.toFixed(1);
                    ele.find('.i-value > span.temp')
                        .text(text_temp)
                        .removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                        .addClass('lvl' + lvl);
                    break;
                }
                case 'S0002': {
                    // by shkoh 20220722: 항온항습기 습도
                    let text_humi = equip_lvl > 3 ? ' - ' : val.toFixed(1);
                    ele.find('.i-value > span.humi')
                        .text(text_humi)
                        .removeClass('lvl0 lvl1 lvl2 lvl3 lvl4 lvl5 lvl6')
                        .addClass('lvl' + lvl);
                    break;
                }
                case 'S0019': {
                    // by shkoh 20220722: 항온항습기 가동상태
                    if(equip_lvl > 3) {
                        ele.find('.i-run-state').removeClass('on off');
                    } else {
                        if(val === 0) {
                            ele.find('.i-run-state').addClass('off');
                        } else if(val === 1) {
                            ele.find('.i-run-state').addClass('on');
                        }
                    }
                    break;
                }
            }            
        }
    });
}