const g_series_color = [ '#60c160', '#68b9f3' ];

let g_resize_timeout_inst = undefined;

let g_popup_inst = undefined;
let g_popup_alert_inst = undefined;
let g_containment_popup_inst = undefined;

let g_alert_msg_interval = undefined;
let g_notify_inst = undefined;

let g_chart = undefined;
let g_pue_inst = undefined;

let g_containment_interval = undefined;
let g_containment_info = [];
let g_containment_index = 0;

let g_ds_info = [
    {
        type: 'temphumi',
        ids: [
            '"i-temphumi-1"', '"i-temphumi-2"', '"i-temphumi-3"', '"i-temphumi-4"', '"i-temphumi-5"'
        ]
    },
    {
        type: 'icon',
        ids: [
            '"i-icon-ac"',
            '"i-icon-distribute"',
            '"i-icon-elec"',
            '"i-icon-fire-b1f"', '"i-icon-fire-b2f"',
            '"i-icon-hvac"',
            '"i-icon-rack"',
            '"i-icon-temphumi"'
        ]
    },
    {
        type: 'alert',
        ids: [
            '"i-leak-b1f-1"', '"i-leak-b1f-2"', '"i-leak-b1f-3"',
            '"i-leak-b2f-1"', '"i-leak-b2f-2"', '"i-leak-b2f-3"', '"i-leak-b2f-4"',
            '"i-ups-aa-1"', '"i-ups-aa-2"', '"i-ups-aa-3"', '"i-ups-aa-4"', '"i-ups-aa-5"',
            '"i-ups-bb-1"', '"i-ups-bb-2"', '"i-ups-bb-3"', '"i-ups-bb-4"',
            '"i-battery-aa-1"', '"i-battery-aa-2"', '"i-battery-aa-3"', '"i-battery-aa-4"', '"i-battery-aa-5"',
            '"i-battery-bb-1"', '"i-battery-bb-2"', '"i-battery-bb-3"', '"i-battery-bb-4"'
        ]
    },
    {
        type: 'hvacrun',
        ids: [
            '"i-hvac-run-1"', '"i-hvac-run-2"', '"i-hvac-run-3"'
        ]
    },
    {
        type: 'power',
        ids: [
            '"i-power-it"',
            '"i-power-hvac"',
            '"i-power-loss"'
        ]
    },
    {
        type: 'wind',
        ids: [
            '"i-icon-wind"'
        ]
    },
    {
        type: 'pue',
        ids: [
            '"i-pue"'
        ]
    }
];

$(window).on('resize', function(e) {
    clearTimeout(g_resize_timeout_inst);
    g_resize_timeout_inst = setTimeout(resizeWindow, 500);
});

function resizeWindow() {
    if(g_chart) {
        g_chart.resize();
        g_chart.refresh();
    }

    if(g_pue_inst) {
        g_pue_inst.resize();
    }
}

$(function() {
    resizeWindow();

    initTempHumi();
    initContainmentChart();
    initHVACRun();
    initPower();
    initPUE();
    initIcon();
    initAlert();

    loadDataValue();
    loadDataAlert();
    loadAlertCount();
    loadContainment();
    
    initAlertMessage();
    initAlertInterval();
});

/***********************************************************************************************************************/
/* by shkoh 20230904: Parent Web Socket Call Start                                                                     */
/***********************************************************************************************************************/
// by shkoh 20230829: WEB Socket을 통한 Noti message를 처리
function redrawViewer(msg) {
    if(g_popup_inst) {
        g_popup_inst.redrawViewer(msg);
    }

    if(!g_notify_inst) {
        g_notify_inst = setTimeout(function() {
            if(msg.command === 'notify' && msg.type === 'equipment') {
                loadDataAlert();
            } else if(msg.command === 'notify' && msg.type === 'sensor') {
                initAlertMessage();
            }

            clearTimeout(g_notify_inst);
            g_notify_inst = undefined;
        }, 0);
    }
}

function setServerTime(dt) {
    const now = new Date(dt);

    const MM = ('0' + (now.getMonth() + 1)).slice(-2);
    const dd = ('0' + now.getDate()).slice(-2);
    const HH = ('0' + now.getHours()).slice(-2);
    const mm = ('0' + now.getMinutes()).slice(-2);
    const column = now.getSeconds() % 2 === 0 ? ':' : ' ';
    const date = now.getFullYear().toString() + '년 ' + MM + '월 ' + dd + '일';

    $('#didc-server-time .i-clock-date').text(date);
    $('#didc-server-time .i-clock-time .i-hour').text(HH);
    $('#didc-server-time .i-clock-time .i-minute').text(mm);
    $('#didc-server-time .i-clock-time .i-seperator').text(column);
}
/***********************************************************************************************************************/
/* by shkoh 20230904: Parent Web Socket Call End                                                                       */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230904: Data Load Start                                                                                  */
/***********************************************************************************************************************/
function loadDataValue() {
    // by shkoh 20230906: 주기적인 데이터 로드
    g_ds_info.forEach(function(info) {
        switch(info.type) {
            case 'temphumi': {
                loadTempHumi(info.ids.toString());
                break;
            }
            case 'hvacrun': {
                loadHVACRun(info.ids.toString());
                break;
            }
            case 'power': {
                loadPower(info.ids.toString());
                break;
            }
            case 'pue': {
                loadPUE(info.ids.toString());
                break;
            }
            case 'wind': {
                loadWind(info.ids.toString());
                break;
            }
        }
    });
}

function loadDataAlert() {
    // by shkoh 20230906: Notify 이벤트시 수행
    g_ds_info.forEach(function(info) {
        switch(info.type) {
            case 'icon': {
                loadIcon(info.ids.toString());
                break;
            }
            case 'alert': {
                loadAlert(info.ids.toString());
                break;
            }
        }
    });
}

function loadTempHumi(ids) {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/didc/icomer/ds/temphumi?ids=' + ids
    }).done(function(data) {
        data.forEach(function(d) {
            viewingTempHumi(d); 
        });
    });
}

function loadIcon(ids) {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/didc/icomer/ds/icon?ids=' + ids
    }).done(function(data) {
        data.forEach(function(d) {
            viewingIcon(d);
        });
    });
}

function loadAlert(ids) {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/didc/icomer/ds/alert?ids=' + ids
    }).done(function(data) {
        data.forEach(function(d) {
            viewingAlert(d);
        });
    });
}

function loadHVACRun(ids) {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/didc/icomer/ds/hvacrun?ids=' + ids
    }).done(function(data) {
        data.forEach(function(d) {
            viewingHVACRun(d);
        });
    });
}

function loadPower(ids) {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/didc/icomer/ds/power?ids=' + ids
    }).done(function(data) {
        data.forEach(function(d) {
            viewingPower(d);
        });
    });
}

function loadPUE(ids) {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/didc/icomer/ds/pue?ids=' + ids
    }).done(function(data) {
        data.forEach(function(d) {
            viewingPUE(d);
        });
    });
}

function loadWind(ids) {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/didc/icomer/ds/wind?ids=' + ids
    }).done(function(data) {
        data.forEach(function(d) {
            viewingWind(d);
        });
    });
}

function loadContainment() {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/didc/icomer/ds/containmentlist?pagename=i_dashboard'
    }).done(function(data) {
        g_containment_info = data;

        if(data.length === 0) {
            clearTimeout(g_containment_interval);
        } else if(g_containment_interval === undefined) {
            viewingContainment(g_containment_info[g_containment_index]);
            startInterval();
        }
    });
}

function startInterval() {
    const interval = localStorage.getItem('rotationInterval');
    g_containment_interval = setTimeout(rotateContainment, interval ? interval * 1000 : 10000);
}

function rotateContainment() {
    // by shkoh 20230922: 컨테인먼트 정보가 없는 경우에는 어떠한 일도 수행하지 않는다.
    if(g_containment_info.length === 0) {
        clearTimeout(g_containment_interval);
        return;
    }

    if(g_containment_index >= g_containment_info.length - 1) g_containment_index = 0;
    else g_containment_index++;

    // by shkoh 20230922: Info가 존재하는 경우에만 수행
    const info = g_containment_info[g_containment_index];
    if(info) {
        viewingContainment(info);
    }

    const interval = localStorage.getItem('rotationInterval');
    g_containment_interval = setTimeout(rotateContainment, interval ? interval * 1000 : 10000);
}
/***********************************************************************************************************************/
/* by shkoh 20230904: Data Load End                                                                                    */
/***********************************************************************************************************************/
function popupSetWindow(type, id) {
    const size = {
        w: 600,
        h: 600
    };

    const pos = {
        left: (window.screenLeft + (window.innerWidth / 2)) - (size.w / 2),
        top: (window.screenTop + (window.innerHeight / 2)) - (size.h / 2)
    };
    
    if(type && id) {
        g_popup_inst = window.open('/didc/popup/dashboard?type=' + type + '&id=' + id, 'Equipment List', 'scrollbars=1, menubar=no, resizable=yes, location=no, titlebar=no, toolbar=no, status=no, top=' + pos.top + ', left=' + pos.left + ', width=' + size.w + ', height=' + size.h);
    }
}

function popupSetContainment(e) {
    const size = { w: 400, h: 600 };
    const pos = {
        left: (window.screenLeft + (window.innerWidth / 2)) - (size.w / 2),
        top: (window.screenTop + (window.innerHeight / 2)) - (size.h / 2)
    };

    if(e) {
        g_containment_popup_inst = window.open('/didc/popup/containmentset', 'Containment Setting',  'scrollbars=1, menubar=no, resizable=yes, location=no, titlebar=no, toolbar=no, status=no, top=' + pos.top + ', left=' + pos.left + ', width=' + size.w + ', height=' + size.h);
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230802: Temperature Humidity Controll Start                                                              */
/***********************************************************************************************************************/
function initTempHumi() {
    $('.i-temphumi-content').on('click', function(e) {
        popupSetWindow('temphumi', e.currentTarget.id);
    });
}

function viewingTempHumi(data) {
    const ele = $('#' + data.id);

    if(ele.length === 1) {
        const { title, temp, humi } = data;

        if(title !== undefined) ele.find('.i-title').text(title);
        if(temp !== undefined) ele.find('.i-val.i-temp').text(temp.toFixed(1));
        if(humi !== undefined) ele.find('.i-val.i-humi').text(humi.toFixed(1));
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230802: Temperature Humidity Controll End                                                                */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230904: Icon Controll Start                                                                              */
/***********************************************************************************************************************/
function initIcon() {
    $('.i-icon > .i-panel').on('click', function(e) {
        popupSetWindow('icon', e.currentTarget.id);
    });
}

function viewingIcon(data) {
    const ele = $('#' + data.id);

    if(ele.length === 1) {
        const mask = ele.find('.i-img-mask');
        mask.removeClass('i-lvl-0 i-lvl-1 i-lvl-2 i-lvl-3 i-lvl-4 i-lvl-5 i-lvl-6 i-twinkling');

        const { lvl } = data;
        if(lvl) {
            mask.addClass('i-lvl-' + lvl);

            if(lvl === 3) {
                mask.addClass('i-twinkling');
            }
        }
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230904: Icon Controll End                                                                                */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230904: Leak Icon Start                                                                                  */
/***********************************************************************************************************************/
function initAlert() {
    $('.i-alert-items .i-item').on('click', function(e) {
        popupSetWindow('alert', e.currentTarget.id);
    });
}

function viewingAlert(data) {
    const ele = $('#' + data.id);

    if(ele.length === 1) {
        const mark = ele.find('.i-mark > .i-block');
        mark.removeClass('i-lvl-0 i-lvl-1 i-lvl-2 i-lvl-3 i-lvl-4 i-lvl-5 i-lvl-6');

        const { lvl, title } = data;
        if(lvl !== undefined) {
            mark.addClass('i-lvl-' + lvl);
        }

        if(title !== undefined) ele.find('.i-mark-name').text(title);
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230904: Leak Icon End                                                                                    */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230904: HVAC Run Count Start                                                                             */
/***********************************************************************************************************************/
function initHVACRun() {
    $('.i-hvac-run-state .i-panel').on('click', function(e) {
        popupSetWindow('hvacrun', e.currentTarget.id);
    });
}

function viewingHVACRun(data) {
    const ele = $('#' + data.id);

    if(ele.length === 1) {
        const { title, run_count, total } = data;

        if(title) ele.find('.i-panel-title').text(title);
        if(run_count !== undefined) ele.find('.i-hvac-run').text(run_count);
        if(total !== undefined) ele.find('.i-hvac-total').text('/ ' + total);
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230904: HVAC Run Count End                                                                               */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230905: Power Value Start                                                                                */
/***********************************************************************************************************************/
function initPower() {
    $('.i-power .i-panel').on('click', function(e) {
        popupSetWindow('power', e.currentTarget.id);
    });
}

function viewingPower(data) {
    const ele = $('#' + data.id);

    if(ele.length === 1) {
        const { title, kw, kw_unit } = data;

        if(title) ele.find('.i-panel-title').text(title);
        
        if(kw === undefined || kw === null) {
            ele.find('.i-value').text('-');
        } else {
            ele.find('.i-value').text(kw.toFixed(1));
            if(kw_unit) ele.find('.i-unit').text(kw_unit);
        }
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230905: Power Value End                                                                                  */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230802: Rack Containment Controll Start                                                                  */
/***********************************************************************************************************************/
function initContainmentChart() {
    $('#i-containment-set-button').kendoButton({
        icon: 'cog',
        click: function(e) {
            popupSetContainment(e);
        }
    });

    $('#i-containment-set-control').kendoButton({
        icon: 'pause',
        click: function(e) {
            togglePlayContainment(e);
        }
    });

    $('.i-containment > .i-containment-content > .i-containment-title > .i-title').on('click', function(e) {
        // by shkoh 2030922: 컨테인먼트의 설비 연계를 위한 팝업창을 띄울 경우에는 로테이션을 멈춤
        pauseRotateToContainment();

        popupSetWindow('containment', e.currentTarget.id);
    });

    $('.i-step > .i-step-button').on('click', function(e) {
        // by shkoh 20230922: 컨테인먼트 좌우 선택 버튼을 클릭하는 경우에 내부 항목에 참고하는 데이터를 변경함
        clearTimeout(g_containment_interval);

        const p_ele = $(e.target).parent();
        if(p_ele.hasClass('i-step-disabled')) return;

        p_ele.addClass('i-step-disabled');

        const ele = $(e.target);
        if(ele.hasClass('i-left')) g_containment_index--;
        else if(ele.hasClass('i-right')) g_containment_index++;

        if(g_containment_index < 0) g_containment_index = g_containment_info.length - 1;
        else if(g_containment_index === g_containment_info.length) g_containment_index = 0;

        const info = g_containment_info[g_containment_index];
        if(info) viewingContainment(info);

        setTimeout(function() {
            p_ele.removeClass('i-step-disabled');
            playRotateToContainment();
        }, 500);

        e.preventDefault();
    });

    g_chart = $('.i-containment-chart').kendoChart({
        autoBind: false,
        dataSource: [],
        chartArea: {
            background: '',
            margin: {
                left: 8,
                right: 8,
                top: 6,
                bottom: 6
            }
        },
        persistSeriesVisibility: true,
        legend: {
            visible: false
        },
        seriesDefaults: {
            type: 'line',
            tooltip: {
                visible: true,
                template: function(s) {
                    let unit = ' \\\℃';                    
                    return s.series.name + ': ' + kendo.toString(s.value, '##,#.0' + unit);
                }
            }
        },
        series: [
            { name: '평균온도', style: 'smooth', field: 'val', missingValues: 'gap' },
            { name: '최대온도', style: 'smooth', field: 'max_val', missingValues: 'gap' }
        ],
        seriesColors: g_series_color,
        categoryAxis: {
            type: 'date',
            field: 'stat_date',
            justified: false,
            crosshair: {
                visible: false
            },
            baseUnit: 'hours',
            baseUnitStep: 1,
            labels: {
                dateFormats: {
                    hours: 'MM/dd\nHH:mm'
                },
                color: '#ffffff',
                font: '9px Malgun Gothic'
            },
            majorTicks: {
                visible: false
            },
            majorGridLines: {
                visible: false
            }
        },
        valueAxis: {
            majorUnit: 2,
            crosshair: {
                visible: false
            },
            labels: {
                color: '#ffffff',
                skip: 1,
                step: 2,
                format: "{0:n1}"
            },
            majorTicks: {
                visible: false
            },
            majorGridLines: {
                visible: false
            }
        },
        theme: 'flat'
    }).data('kendoChart');
}

function viewingContainment(c_info) {
    const ele = $('.i-widget.i-containment');

    if(ele.length === 1) {
        const { name, object_name, max_equip_name, max_val, avg_val, data } = c_info;

        ele.find('.i-title').attr('id', object_name ? object_name : '');
        ele.find('.i-containment-name').text(name ? name : '');
        ele.find('.i-rack-name-max').text(max_equip_name ? max_equip_name : '');
        
        if(max_val !== null && !Number.isNaN(max_val)) {
            ele.find('.i-max .i-value-content .i-value').text(max_val.toFixed(1));
        } else {
            ele.find('.i-max .i-value-content .i-value').text('');
        }
        
        if(avg_val !== null && !Number.isNaN(avg_val)) {
            ele.find('.i-avg .i-value-content .i-value').text(avg_val.toFixed(1));
        } else {
            ele.find('.i-avg .i-value-content .i-value').text('');
        }
        
        if(data && Array.isArray(data)) {
            setChartMinMax(data);
            
            g_chart.dataSource.data(data);
        } else {
            g_chart.dataSource.data([]);
        }
    }
}

function setChartMinMax(data) {
    const minmax = {
        min: 100,
        max: -100
    }
    
    data.reduce(function(init_val, current) {
        if(init_val.min > current.val) init_val.min = current.val;
        if(init_val.max < current.max_val) init_val.max = current.max_val;
        return init_val;
    }, minmax);
    
    const majorUnit = (minmax.max - minmax.min) / 5;

    g_chart.options.valueAxis.majorUnit = majorUnit;
    g_chart.options.valueAxis.min = minmax.min - majorUnit;
    g_chart.options.valueAxis.max = minmax.max + majorUnit;
    g_chart.options.valueAxis.labels.format = majorUnit > 2 ? '{0:n0}' : '{0:n1}';
    
    g_chart.redraw();
}

function togglePlayContainment(e) {
    if(g_containment_interval === undefined) {
        playRotateToContainment();
    } else {
        pauseRotateToContainment();
    }
}

function playRotateToContainment() {
    // by shkoh 20230922: 컨테인먼트의 변경을 시작함. 시작 시 PAUSE 아이콘으로 변경함
    startInterval();

    const ctrl_btn = $('#i-containment-set-control').children('.k-icon');
    ctrl_btn.removeClass('k-i-play');
    ctrl_btn.addClass('k-i-pause');
}

function pauseRotateToContainment() {
    // by shkoh 20230922: 컨테인먼트의 변경을 멈춤. 멈출 때 PLAY 아이콘으로 변경함
    clearTimeout(g_containment_interval);
    g_containment_interval = undefined;

    const ctrl_btn = $('#i-containment-set-control').children('.k-icon');    
    ctrl_btn.removeClass('k-i-pause');
    ctrl_btn.addClass('k-i-play');
}
/***********************************************************************************************************************/
/* by shkoh 20230802: Rack Containment Controll End                                                                    */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230802: PUE Controll Start                                                                               */
/***********************************************************************************************************************/
function initPUE() {
    $('#i-pue').on('click', function(e) {
        popupSetWindow('pue', e.currentTarget.id);
    });

    g_pue_inst = $('#didc-pue').kendoArcGauge({
        value: 1,
        centerTemplate: '#: value #',
        scale: {
            min: 0,
            max: 3,
            labels: {
                visible: true,
                color: '#aaaaaa'
            },
            majorUnit: 1,
            rangeSize: 30,
            rangeLineCap: 'butt',
            rangePlaceholderColor: '#88888888'
        },
        colors: [
            { color: '#0161b8', to: 2 },
            { color: '#ff9c01', from: 2, to: 2.5 },
            { color: '#de0303', from: 2.5 }
        ],
        theme: 'uniform'
    }).data('kendoArcGauge');
}

function viewingPUE(data) {
    const { pue } = data;

    if(pue && g_pue_inst) {
        g_pue_inst.value(pue);
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230802: PUE Controll End                                                                                 */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230918: Wind Controll Start                                                                              */
/***********************************************************************************************************************/
function viewingWind(data) {
    const ele = $('#' + data.id);

    if(ele.length === 1) {
        const mask = ele.find('.i-img-mask');
        mask.removeClass('i-lvl-0 i-lvl-1 i-lvl-2 i-lvl-3 i-lvl-4 i-lvl-5 i-lvl-6 i-twinkling');
        
        const { lvl, max_val, avg_val, min_val } = data;
        if(lvl) {
            mask.addClass('i-lvl-' + lvl);

            if(lvl >= 3) {
                mask.addClass('i-twinkling');
            }
        }

        if(max_val !== undefined) {
            const max_ele = ele.find('#i-max');
            max_ele.find('.i-row-value').text(max_val);
        }

        if(avg_val !== undefined) {
            const avg_ele = ele.find('#i-avg');
            avg_ele.find('.i-row-value').text(avg_val);
        }

        if(min_val !== undefined) {
            const min_ele = ele.find('#i-min');
            min_ele.find('.i-row-value').text(min_val);
        }
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230918: Wind Controll End                                                                                */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230802: Alert Count Controll Start                                                                       */
/***********************************************************************************************************************/
function loadAlertCount() {
    $('#didc-alert .i-legend > .i-mark').on('click', function(e) {
        let lvl = 0;
        if(e.currentTarget.classList.contains('i-lvl-1')) {
            lvl = 1;
        } else if(e.currentTarget.classList.contains('i-lvl-2')) {
            lvl = 2;
        } else if(e.currentTarget.classList.contains('i-lvl-3')) {
            lvl = 3;
        } else if(e.currentTarget.classList.contains('i-lvl-4')) {
            lvl = 4;
        } else if(e.currentTarget.classList.contains('i-lvl-5')) {
            lvl = 5;
        }
        
        popupAlert(lvl);
    });

    $.ajax({
        async: true,
        type: 'GET',
        cache: true,
        url: '/api/didc/icomer/statisticsAlarmList',
        dataType: 'json',
    }).done(function(data) {
        setAlertCount(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function setAlertCount(data) {
    const ele = $('#didc-alert');

    if(ele.length === 1) {
        for(let lvl = 1; lvl < 7; lvl++) {
            const marker = ele.find('.i-legend > .i-mark.i-lvl-' + lvl);

            let counter = 0;
            const d = data.find(function(d) { return d.idx === lvl });

            if(d) {
                counter = d.alarm_cnt;
            }

            if(marker.length === 1) {
                if(lvl > 4) {
                    let pre_val = parseInt(marker.find('.i-mark-value').text());
                    counter += (pre_val ? pre_val : 0);
                }
                
                marker.find('.i-mark-value').text(counter);
            }
        }
    }
}

function popupAlert(lvl) {
    const size = {
        w: 1200,
        h: 700
    };

    const pos = {
        left: (window.screenLeft + (window.innerWidth / 2)) - (size.w / 2),
        top: (window.screenTop + (window.innerHeight / 2)) - (size.h / 2)
    };
    
    
    g_popup_alert_inst = window.open('/didc/popup/alertlist?lvl=' + lvl, 'Alert List', 'scrollbars=1, menubar=no, resizable=yes, location=no, titlebar=no, toolbar=no, status=no, top=' + pos.top + ', left=' + pos.left + ', width=' + size.w + ', height=' + size.h);
}
/***********************************************************************************************************************/
/* by shkoh 20230802: Alert Count Controll End                                                                         */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230802: Alert Message Controll Start                                                                     */
/***********************************************************************************************************************/
function initAlertMessage() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: true,
        url: '/api/didc/icomer/alarmList',
        dataType: 'json',
    }).done(function(data) {
        setAlertMessage(data);
    }).fail(function(err) {
        console.error(err);
    });
}

function initAlertInterval() {
    g_alert_msg_interval = setInterval(() => {
        const m_e = $('#didc-alert .i-contents').get(0);
        const moving_value = m_e.offsetHeight;

        if(!m_e) {
            clearInterval(g_alert_msg_interval);
        }

        // by shkoh 20230906: scroll-snap-align의 기준은 가운데 정렬임으로 보여지는 부분의 절반을 함께 더해서 계산함
        if((m_e.scrollTop + moving_value + moving_value / 2) > m_e.scrollHeight) {
            m_e.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            m_e.scrollBy({ top: moving_value, behavior: 'smooth' });
        }
    }, 5000);
}

function setAlertMessage(data) {
    const ele = $('#didc-alert');

    if(ele.length === 1) {
        const msg_ele = ele.find('.i-contents').empty();

        if(data.length === 0) {
            const html = '<div class="i-alert-no-item">정상 가동 중입니다</div>';
            msg_ele.append(html);
        } else {
            const alert_template = kendo.template($('#alert-template').html());

            data.forEach(function(d) {
                const { alarm_msg, alarm_level, level_text, equip_name, occur_date } = d;

                let msg = alarm_msg.split(':')[1];
                const html = alert_template({ lvl: alarm_level > 3 ? 5 : alarm_level, lvl_text: level_text, name: equip_name, msg: msg ? msg : '', occur: occur_date });
                msg_ele.append(html);
            });
        }
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230802: Alert Message Controll End                                                                       */
/***********************************************************************************************************************/