let g_voltage_rst_data = [{ r: 0, s: 0, t: 0 }];
let g_voltage_rssttr_data = [{ rs: 0, st: 0, tr: 0 }];

let g_loop = undefined;
let g_interval_cnt = 9;

let g_tree = undefined;
let g_breaker_id = undefined;
let g_selected_linker_name = undefined;

$(window).on('resize', function() {
    resizingChart();
});

$(function() {
    window.resizeTo(1024, 960);

    loadPMSInfo();

    createVoltageAvgChart();
    createVoltageRSTChart();
    createVoltageRSSTTRChart();

    createPanelInfoLeft();
    createPanelInfoRight();

    loopInit();

    DefineEvents();

    $('body').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'y',
        scrollbarPostion: 'outside'
    });
});

/******************************************************************************************************************************/
/* by shkoh 20210223: inline function start                                                                                   */
/******************************************************************************************************************************/
function DefineEvents() {
    $('.panel_setting').off('click');
    $('.panel_setting').on('click', panelSettingEvent);

    // by shkoh 20170726: 사용과 사용안함은 Radio 버튼 형식으로 체크하며, 동작은 체크될 때 정의함
    // by shkoh 20210224: 차단기의 사용과 사용안함을 체크
    $("input[name='usingOption']").off('change');
    $("input[name='usingOption']").on('change', function(e) {
        if($(this).val() == "Y") {
            $("#use_breaker").parent().addClass("active");
            $("#use_breaker").attr("checked", "checked");
            enableModalForm();
        } else {
            $("#no_use_breaker").parent().addClass("active");
            $("#no_use_breaker").attr("checked", "checked");
            disableModalForm();
        }
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    // by shkoh 20170726: 연결센서를 누를 때 팝업이 뜨고 해당 센서목록을 가져옴 시작
    $("#find-current-total").off('click');
    $("#find-current-total").on('click', function(e) {
        onClickFindSensor('%25전류%25', '#selected-item-current-total');
    });

    $("#find-current-r").off('click');
    $("#find-current-r").on('click', function(e) {
        onClickFindSensor('%25전류 R%25', '#selected-item-current-r');
    });

    $("#find-current-s").off('click');
    $("#find-current-s").on('click', function(e) {
        onClickFindSensor('%25전류 S%25', '#selected-item-current-s');
    });

    $("#find-current-t").off('click');
    $("#find-current-t").on('click', function(e) {
        onClickFindSensor('%25전류 T%25', '#selected-item-current-t');
    });

    $("#find-factor").off('click');
    $("#find-factor").on('click', function(e) {
        onClickFindSensor('%25역률%25', '#selected-item-factor');
    });

    $("#find-kw").off('click');
    $("#find-kw").on('click', function(e) {
        onClickFindSensor('%25유효전력%25', '#selected-item-kw');
    });

    $("#find-kwh").off('click');
    $("#find-kwh").on('click', function(e) {
        onClickFindSensor('%25유효전력량%25', '#selected-item-kwh');
    });
    // by shkoh 20170726: 연결센서를 누를 때 팝업이 뜨고 해당 센서목록을 가져옴 끝
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    // by shkoh 20170726: 연결삭제를 누를 때 관련된 항목들을 모두 지움
    $("#remove-current-total").off('click');
    $("#remove-current-total").on('click', function(e) {
        ClearModalSensorValue('current-total');
    });

    $("#remove-current-r").off('click');
    $("#remove-current-r").on('click', function(e) {
        ClearModalSensorValue('current-r');
    });

    $("#remove-current-s").off('click');
    $("#remove-current-s").on('click', function(e) {
        ClearModalSensorValue('current-s');
    });

    $("#remove-current-t").off('click');
    $("#remove-current-t").on('click', function(e) {
        ClearModalSensorValue('current-t');
    });

    $("#remove-factor").off('click');
    $("#remove-factor").on('click', function(e) {
        ClearModalSensorValue('factor');
    });

    $("#remove-kw").off('click');
    $("#remove-kw").on('click', function(e) {
        ClearModalSensorValue('kw');
    });

    $("#remove-kwh").off('click');
    $("#remove-kwh").on('click', function(e) {
        ClearModalSensorValue('kwh');
    });

    // by shkoh 20210224: 사전에 정의된 버튼들의 포커스가 사라지지 않아서, 강제로 .find-button 클래스를 가진 모든 버튼에 대해서 blur를 수행
    $('.find-button').on('click', function() {
        $(this).blur();
    });

    // by shkoh 20170726: Modal 설정 페이지가 닫힐 때
    $("#modalDialogIcon").on("hide.bs.modal", function(e) {
        g_breaker_id = undefined;
        ClearModalSensorValue('all');
    });

    // by shkoh 20170726: Modal 페이지의 Tree Modal 페이지가 닫힐 때
    $("#modalDialogTree").on("hide.bs.modal", function(e) {
        if(g_tree != undefined) {
            g_tree.DestroyTree();
            g_tree = undefined;
        }

        g_selected_linker_name = undefined;
    });

    // by shkoh 20170522: Modal 페이지의 설비Tree 페이지에서 찾은 설비를 등록하기 위한 [연결]버튼을 클릭했을 때
    $("#btn-modal-tree-link").click(function() {
        const selectedTreeItem = g_tree.GetCurrentTreeNode();

        if(selectedTreeItem != undefined) {
            $(g_selected_linker_name).attr("value", selectedTreeItem.id);
            $(g_selected_linker_name).text("*" + selectedTreeItem.name);
        }

        $("#modalDialogTree").modal('hide');
    });

    // by shkoh 20170726: Modal 페이지의 설비Tree에서 스크롤바 추가
    $("#modalDialogTree .modal-dialog .modal-content .modal-body").mCustomScrollbar({
        theme: 'minimal',
        axis: "y",
        scrollbarPosition: "outside"
    });

    // by shkoh 20170725: PMS 아이콘 Modal에서 [추가] 혹은 [수정] 버튼을 클릭했을 때
    $("#btn-modal-footer-confirm").click(function() {
        if($("#using_breaker").find("[checked]").val() === "Y" && $("input[name='phaseOption']:checked").val() === undefined) {
            alert("해당 차단기가 단상인지 3상인지 반드시 선택해야 합니다");
            return;
        }

        // by shkoh 20210224: 3상으로 설정한 경우에는 아래 차단기에 설정이 되어 있는지 체크
        const using = $('#using_breaker').find('.active').find('input').val();
        const phase = $("input[name='phaseOption']:checked").val();
        const next_b_id = parseInt(g_breaker_id) + 2;
        const next_next_b_id = parseInt(g_breaker_id) + 4;
        
        if(using === 'Y' && phase === 'Y' && $('#p_' + next_b_id + ', #p_' + next_next_b_id).parent().hasClass('panel-use')) {
            alert('3상 설정 시, 바로 아래 차단기에 설정을 해제해야 합니다');
            return;
        }

        SavePmsInfo();

        $("#modalDialogIcon").modal('hide');
    });
}
/******************************************************************************************************************************/
/* by shkoh 20210223: inline function end                                                                                     */
/******************************************************************************************************************************/

/******************************************************************************************************************************/
/* by shkoh 20210222: resizing function start                                                                                 */
/******************************************************************************************************************************/
function resizingChart() {
    $('#voltage-avg').data('kendoChart').resize();
    $('#voltage-rst').data('kendoChart').resize();
    $('#voltage-rssttr').data('kendoChart').resize();
}
/******************************************************************************************************************************/
/* by shkoh 20210222: resizing function end                                                                                   */
/******************************************************************************************************************************/

/******************************************************************************************************************************/
/* by shkoh 20210222: loop function start                                                                                     */
/******************************************************************************************************************************/
function loopInit() {
    g_loop = setTimeout(loop, 1000);
}

function loop() {
    if(g_interval_cnt < 10) g_interval_cnt++;
    else {
        g_interval_cnt = 0;
        loadPMSInfo();
        loadPMSChartData();
        loadLeftPanelInfo();
        loadRightPanelInfo();
    }

    clearTimeout(g_loop);
    g_loop = undefined;
    loopInit();
}
/******************************************************************************************************************************/
/* by shkoh 20210222: loop function end                                                                                       */
/******************************************************************************************************************************/

/******************************************************************************************************************************/
/* by shkoh 20210222: voltage avg function start                                                                              */
/******************************************************************************************************************************/
function createVoltageAvgChart() {
    $('#voltage-avg').kendoChart({
        dataSource: {
            data: [{ av_v: 0, avl_v: 0 }]
        },
        theme: 'metro',
        legend: {
            position: 'bottom',
            margin: 0,
            padding: { top: 3, right: 0, bottom: 0, left: 0 },
            visible: true
        },
        seriesDefaults: {
            gap: 1,
            spacing: 0.1,
            type: 'bar',
            labels: {
                visible: true,
                margin: 0,
                template: '#: value #V',
                position: 'center'
            }
        },
        series: [{
            name: '평균전압',
            field: 'av_v',
            labels: { color: '#ffffff' }
        }, {
            name: '평균선간전압',
            field: 'avl_v',
            labels: { color: '#ffffff' }
        }],
        seriesColors: [ '#1f77b4', '#ff7f0e' ],
        categoryAxis: {
            visible: true,
            line: { width: 1 },
            majorTicks: { visible: false },
            majorGridLines: { visible: false }
        },
        valueAxis: {
            visible: false,
            majorGridLines: { visible: false },
            min: 0
        },
        tooltip: {
            visible: true,
            shared: true,
            template: '#: value #V'
        },
        chartArea: {
            height: 80,
            margin: {
                right: 15,
                left: 0
            }
        }
    });
}

function updateVoltageAvgChart(item) {
    const data = $('#voltage-avg').data('kendoChart').dataSource.at(0);
    data.set('av_v', item[0].current_value);
    data.set('avl_v', item[1].current_value);

    $('#voltage-avg').data('kendoChart').refresh();
}
/******************************************************************************************************************************/
/* by shkoh 20210222: voltage avg function end                                                                                */
/******************************************************************************************************************************/

/******************************************************************************************************************************/
/* by shkoh 20210222: voltage rst function start                                                                              */
/******************************************************************************************************************************/
function createVoltageRSTChart() {
    $('#voltage-rst').kendoChart({
        dataSource: {
            autoBind: true,
            data: g_voltage_rst_data
        },
        theme: 'metro',
        legend: {
            position: 'bottom',
            margin: 0,
            padding: { top: 1, right: 0, bottom: 0, left: 0 },
            visible: true
        },
        seriesDefaults: {
            gap: 2,
            spacing: 0,
            type: 'column',
            labels: {
                visible: true,
                margin: 0,
                template: '#: value #V'
            }
        },
        series: [{
            name: 'R',
            field: 'r',
            labels: { color: '#1f77b4' }
        }, {
            name: 'S',
            field: 's',
            labels: { color: '#ff7f0e' }
        }, {
            name: 'T',
            field: 't',
            labels: { color: '#2ca02c' }
        }],
        seriesColors: [ '#1f77b4', '#ff7f0e', '#2ca02c' ],
        categoryAxis: {
            visible: true,
            line: { width: 1 },
            majorTicks: { visible: false },
            majorGridLines: { visible: false }
        },
        valueAxis: {
            visible: false,
            majorGridLines: { visible: false }
        },
        tooltip: {
            visible: true,
            shared: true,
            template: '#: value #V'
        },
        chartArea: {
            height: 80,
            margin: {
                top: 15,
                bottom: 0
            }
        }
    });
}

function updateVoltageRSTChart(item) {
    const data = $('#voltage-rst').data('kendoChart').dataSource.at(0);
    data.set('r', item[0].current_value);
    data.set('s', item[1].current_value);
    data.set('t', item[2].current_value);

    $('#voltage-rst').data('kendoChart').refresh();
}
/******************************************************************************************************************************/
/* by shkoh 20210222: voltage rst function end                                                                                */
/******************************************************************************************************************************/

/******************************************************************************************************************************/
/* by shkoh 20210222: voltage rssttr function start                                                                           */
/******************************************************************************************************************************/
function createVoltageRSSTTRChart() {
    $('#voltage-rssttr').kendoChart({
        dataSource: {
            data: g_voltage_rssttr_data
        },
        theme: 'metro',
        legend: {
            position: 'bottom',
            margin: 0,
            padding: { top: 1, right: 0, bottom: 0, left: 0 },
            visible: true
        },
        seriesDefaults: {
            gap: 2,
            spacing: 0,
            type: 'column',
            labels: {
                visible: true,
                margin: 0,
                template: '#: value #V'
            }
        },
        series: [{
            name: 'R-S',
            field: 'rs',
            labels: { color: '#1f77b4' }
        }, {
            name: 'S-T',
            field: 'st',
            labels: { color: '#ff7f0e' }
        }, {
            name: 'T-R',
            field: 'tr',
            labels: { color: '#2ca02c' }
        }],
        seriesColors: [ '#1f77b4', '#ff7f0e', '#2ca02c' ],
        categoryAxis: {
            visible: true,
            line: { width: 1 },
            majorTicks: { visible: false },
            majorGridLines: { visible: false }
        },
        valueAxis: {
            visible: false,
            majorGridLines: { visible: false }
        },
        tooltip: {
            visible: true,
            shared: true,
            template: '#: value #V'
        },
        chartArea: {
            height: 80,
            margin: {
                top: 15,
                bottom: 0
            }
        }
    });
}

function updateVoltageRSSTTRChart(item) {
    const data = $('#voltage-rssttr').data('kendoChart').dataSource.at(0);
    data.set('rs', item[0].current_value);
    data.set('st', item[1].current_value);
    data.set('tr', item[2].current_value);

    $('#voltage-rssttr').data('kendoChart').refresh();
}
/******************************************************************************************************************************/
/* by shkoh 20210222: voltage rssttr function end                                                                             */
/******************************************************************************************************************************/

/******************************************************************************************************************************/
/* by shkoh 20210222: break panel function start                                                                              */
/******************************************************************************************************************************/
function createPanelInfoLeft() {
    for(var idx = 1; idx < 96; idx = idx + 2) {
        var innerhtml = "<tr id='tr_p_" + idx + "'>";            

        innerhtml += "<td><span id='p_" + idx + "_kwh'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_kw'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_pf'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_ra'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_sa'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_ta'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_a'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_pn'></span></td>";
        innerhtml += "<td class='panel_setting panel-non-use' style='color:#f0f0f0;' value=" + idx + "><span id='p_" + idx +"'>X</span></td>";

        innerhtml += "</tr>";

        $("#table-left").find("tbody").append(innerhtml);
    }    
}

function createPanelInfoRight() {
    for(var idx = 2; idx < 97; idx = idx + 2) {
        var innerhtml = "<tr id='tr_p_" + idx + "'>";

        innerhtml += "<td class='panel_setting panel-non-use' style='color:#f0f0f0;' value=" + idx + "><span id='p_" + idx +"'>X</span></td>";
        innerhtml += "<td><span id='p_" + idx + "_pn'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_a'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_ta'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_sa'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_ra'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_pf'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_kw'></span></td>";
        innerhtml += "<td><span id='p_" + idx + "_kwh'></span></td>";

        innerhtml += "</tr>";

        $("#table-right").find("tbody").append(innerhtml);
    }    
}

function updatePanelInfo(info) {
    if(info.b_use == 'Y') {
        $("#p_" + info.breaker_id).parent().addClass("panel-use");
        $("#p_" + info.breaker_id).text(info.breaker_id);
        $("#p_" + info.breaker_id + "_pn").text(info.pms_number);
        $("#p_" + info.breaker_id + "_a").text(isNaN(parseFloat(info.current_total)) == true ? "" : parseFloat(info.current_total).toFixed(2));
        $("#p_" + info.breaker_id + "_ra").text(isNaN(parseFloat(info.current_r)) == true ? "" : parseFloat(info.current_r).toFixed(2));
        $("#p_" + info.breaker_id + "_sa").text(isNaN(parseFloat(info.current_s)) == true ? "" : parseFloat(info.current_s).toFixed(2));
        $("#p_" + info.breaker_id + "_ta").text(isNaN(parseFloat(info.current_t)) == true ? "" : parseFloat(info.current_t).toFixed(2));
        $("#p_" + info.breaker_id + "_pf").text(isNaN(parseFloat(info.power_factor)) == true ? "" : parseFloat(info.power_factor).toFixed(2));
        $("#p_" + info.breaker_id + "_kw").text(isNaN(parseFloat(info.power)) == true ? "" : parseFloat(info.power).toFixed(2));
        $("#p_" + info.breaker_id + "_kwh").text(isNaN(parseFloat(info.amount_power)) == true ? "" : parseFloat(info.amount_power).toFixed(2));

        $("#p_" + info.breaker_id + "_a").attr("value", "S_" + info.current_total_id);
        $("#p_" + info.breaker_id + "_ta").attr("value", "S_" + info.current_r_id);
        $("#p_" + info.breaker_id + "_sa").attr("value", "S_" + info.current_s_id);
        $("#p_" + info.breaker_id + "_ra").attr("value", "S_" + info.current_t_id);
        $("#p_" + info.breaker_id + "_pf").attr("value", "S_" + info.power_factor_id);
        $("#p_" + info.breaker_id + "_kw").attr("value", "S_" + info.power_id);
        $("#p_" + info.breaker_id + "_kwh").attr("value", "S_" + info.amount_power_id);
    } else {
        $("#p_" + info.breaker_id).parent().removeClass("panel-use");
        $("#p_" + info.breaker_id).text("X");
        $("#p_" + info.breaker_id + "_pn").text("");
        $("#p_" + info.breaker_id + "_a").text("");
        $("#p_" + info.breaker_id + "_ta").text("");
        $("#p_" + info.breaker_id + "_sa").text("");
        $("#p_" + info.breaker_id + "_ra").text("");
        $("#p_" + info.breaker_id + "_pf").text("");
        $("#p_" + info.breaker_id + "_kw").text("");
        $("#p_" + info.breaker_id + "_kwh").text("");

        $("#p_" + info.breaker_id + "_a").removeAttr("value");
        $("#p_" + info.breaker_id + "_ta").removeAttr("value");
        $("#p_" + info.breaker_id + "_sa").removeAttr("value");
        $("#p_" + info.breaker_id + "_ra").removeAttr("value");
        $("#p_" + info.breaker_id + "_pf").removeAttr("value");
        $("#p_" + info.breaker_id + "_kw").removeAttr("value");
        $("#p_" + info.breaker_id + "_kwh").removeAttr("value");
    }

    if(info.b_three_phase == 'Y') {
        $("#p_" + info.breaker_id + "_pn").parent().attr("rowspan", 3);
        $("#p_" + info.breaker_id + "_a").parent().attr("rowspan", 3);
        $("#p_" + info.breaker_id + "_ta").parent().attr("rowspan", 3);
        $("#p_" + info.breaker_id + "_sa").parent().attr("rowspan", 3);
        $("#p_" + info.breaker_id + "_ra").parent().attr("rowspan", 3);
        $("#p_" + info.breaker_id + "_pf").parent().attr("rowspan", 3);
        $("#p_" + info.breaker_id + "_kw").parent().attr("rowspan", 3);
        $("#p_" + info.breaker_id + "_kwh").parent().attr("rowspan", 3);

        resetTableRow(parseInt(info.breaker_id) + 2, true);
        resetTableRow(parseInt(info.breaker_id) + 4, true);
    } else {
        $("#p_" + info.breaker_id + "_pn").parent().attr("rowspan", 1);
        $("#p_" + info.breaker_id + "_a").parent().attr("rowspan", 1);
        $("#p_" + info.breaker_id + "_ta").parent().attr("rowspan", 1);
        $("#p_" + info.breaker_id + "_sa").parent().attr("rowspan", 1);
        $("#p_" + info.breaker_id + "_ra").parent().attr("rowspan", 1);
        $("#p_" + info.breaker_id + "_pf").parent().attr("rowspan", 1);
        $("#p_" + info.breaker_id + "_kw").parent().attr("rowspan", 1);
        $("#p_" + info.breaker_id + "_kwh").parent().attr("rowspan", 1);

        resetTableRow(parseInt(info.breaker_id) + 2, false, info.which);
        resetTableRow(parseInt(info.breaker_id) + 4, false, info.which);
    }
}

function resetTableRow(id, isThreePhase, which) {
    $("#tr_p_" + id).empty();
    var innerhtml = "";
    
    if(isThreePhase == true) {
        innerhtml = "<td class='panel_setting panel-non-use panel-use' style='color:#f0f0f0;' value=" + id + "><span id='p_" + id +"'>" + id + "</span></td>";
    } else {
        if(which == "L") {
            innerhtml += "<td><span id='p_" + id + "_kwh'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_kw'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_pf'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_ra'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_sa'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_ta'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_a'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_pn'></span></td>";
            innerhtml += "<td class='panel_setting panel-non-use' style='color:#f0f0f0;' value=" + id + "><span id='p_" + id +"'>X</span></td>";
        } else if(which == "R") {
            innerhtml += "<td class='panel_setting panel-non-use' style='color:#f0f0f0;' value=" + id + "><span id='p_" + id +"'>X</span></td>";
            innerhtml += "<td><span id='p_" + id + "_pn'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_a'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_ta'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_sa'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_ra'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_pf'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_kw'></span></td>";
            innerhtml += "<td><span id='p_" + id + "_kwh'></span></td>";
        }
    }

    $("#tr_p_" + id).append(innerhtml);

    if(isThreePhase == true) {
        $("#p_" + id).parent().off('click');
    } else {
        $("#p_" + id).parent().on('click', panelSettingEvent);
    }
}

function panelSettingEvent(e) {
    $("#modal-dialog-icon-title").text("분전반 차단기(" + $(this).attr('value') + ") 연결");
    $("#modalDialogIcon").modal({ keyboard: false, show: true });

    g_breaker_id = $(this).attr('value');

    // by shkoh 20170726: 화면이 나타나는 순간 설정값들을 읽은 후에 처리
    // by skhoh 20170726: 클릭한 차단기가 사용함으로 저장되어 있다면 panel-use 클래스를 가지고 있을 것이다.
    $("#no_use_breaker").parent().removeClass("active");
    $("#no_use_breaker").removeAttr("checked");
    
    $("#use_breaker").parent().removeClass("active");
    $("#use_breaker").removeAttr("checked");
    
    if($(this).hasClass("panel-use") == true) {
        $("#use_breaker").parent().addClass("active");
        $('#use_breaker').attr('checked', 'checked');
        enableModalForm();

        setModalForm(g_breaker_id);
    } else {
        $("#no_use_breaker").parent().addClass("active");
        $('#no_use_breaker').attr('checked', 'checked');
        disableModalForm();
    }
}
/******************************************************************************************************************************/
/* by shkoh 20210222: break panel function end                                                                                */
/******************************************************************************************************************************/

/******************************************************************************************************************************/
/* by shkoh 20210223: modal function start                                                                                    */
/******************************************************************************************************************************/
function onClickFindSensor(filter, target) {
    $("#modalDialogTree").modal({ keyboard: false, show: true });

    g_selected_linker_name = target;
    const s_id = $(g_selected_linker_name).attr('value');
    
    g_tree = new Tree('#modal-tree', {
        treeNodeId: s_id
    });
    g_tree.CreateFilterTree($('#pms').attr('pms-id'), filter);
}

function ClearModalSensorValue(mode) {
    if(mode == 'all' || mode == 'current-total') {
        $("#selected-item-current-total").text("");
        $("#selected-item-current-total").removeAttr("value");
    }
    if(mode == 'all' || mode == 'current-r') {
        $("#selected-item-current-r").text("");
        $("#selected-item-current-r").removeAttr("value");
    }
    if(mode == 'all' || mode == 'current-s') {
        $("#selected-item-current-s").text("");
        $("#selected-item-current-s").removeAttr("value");
    }
    if(mode == 'all' || mode == 'current-t') {
        $("#selected-item-current-t").text("");
        $("#selected-item-current-t").removeAttr("value");
    }
    if(mode == 'all' || mode == 'factor') {
        $("#selected-item-factor").text("");
        $("#selected-item-factor").removeAttr("value");
    }
    if(mode == 'all' || mode == 'kw') {
        $("#selected-item-kw").text("");
        $("#selected-item-kw").removeAttr("value");
    }
    if(mode == 'all' || mode == 'kwh') {
        $("#selected-item-kwh").text("");
        $("#selected-item-kwh").removeAttr("value");
    }
}

function enableModalForm() {
    $("fieldset").removeAttr("disabled");
}

function disableModalForm() {
    $("fieldset").attr("disabled", "true");
}
/******************************************************************************************************************************/
/* by shkoh 20210223: modal function end                                                                                      */
/******************************************************************************************************************************/

/******************************************************************************************************************************/
/* by shkoh 20210222: data exchange function start                                                                            */
/******************************************************************************************************************************/
function loadPMSInfo() {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/diagram/wrfis/pms/info?id=' + $('#pms').attr('pms-id')
    }).done(function(item) {
        $('.panel-title').text(item.title);
    }).fail(function(err) {
        console.error(err);
    });
}

function loadPMSChartData() {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/diagram/wrfis/pms/chartdata?id=' + $('#pms').attr('pms-id')
    }).done(function(item) {
        if(item.length === 0) {
            updateVoltageAvgChart([{ current_value: 0 }, { current_value: 0 }]);
            updateVoltageRSTChart([{ current_value: 0 }, { current_value: 0 }, { current_value: 0 }]);
            updateVoltageRSSTTRChart([{ current_value: 0 }, { current_value: 0 }, { current_value: 0 }]);
        }

        updateVoltageAvgChart([item[0], item[1]]);
        updateVoltageRSTChart([item[2], item[3], item[4]]);
        updateVoltageRSSTTRChart([item[5], item[6], item[7]]);
        
    }).fail(function(err) {
        console.error(err);
    });
}

function loadLeftPanelInfo() {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/diagram/wrfis/pms/griddata?id=' + $('#pms').attr('pms-id') + '&type=L'
    }).done(function(item) {
        item.forEach(function(datum) {
            updatePanelInfo(datum);
        });
    }).fail(function(err) {
        console.error(err);
    });
}

function loadRightPanelInfo() {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/diagram/wrfis/pms/griddata?id=' + $('#pms').attr('pms-id') + '&type=R'
    }).done(function(item) {
        item.forEach(function(datum) {
            updatePanelInfo(datum);
        });
    }).fail(function(err) {
        console.error(err);
    });
}

function setModalForm(breaker_id) {
    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/diagram/wrfis/pms/breaker?e_id=' + $('#pms').attr('pms-id') + '&b_id=' + breaker_id
    }).done(function(data) {
        Object.keys(data[0]).forEach(function(key) {
            const val = data[0][key];

            if(val !== null) {
                switch(key) {
                    case 'pms_number': $('#pms_number').val(val); break;
                    case 'b_three_phase': {
                        if(val === 'Y') $('#phase_three').prop('checked', true);
                        else $('#phase_one').prop('checked', true);
                        break;
                    }
                    case 'current_total_name': $('#selected-item-current-total').text(val); break;
                    case 'current_total': $('#selected-item-current-total').attr('value', 'S_' + val); break;
                    
                    case 'current_r_name': $('#selected-item-current-r').text(val); break;
                    case 'current_r': $('#selected-item-current-r').attr('value', 'S_' + val); break;
                    
                    case 'current_s_name': $('#selected-item-current-s').text(val); break;
                    case 'current_s': $('#selected-item-current-s').attr('value', 'S_' + val); break;
                    
                    case 'current_t_name': $('#selected-item-current-t').text(val); break;
                    case 'current_t': $('#selected-item-current-t').attr('value', 'S_' + val); break;
                    
                    case 'power_factor_name': $('#selected-item-factor').text(val); break;
                    case 'power_factor': $('#selected-item-factor').attr('value', 'S_' + val); break;
                    
                    case 'power_name': $('#selected-item-kw').text(val); break;
                    case 'power': $('#selected-item-kw').attr('value', 'S_' + val); break;
                    
                    case 'amount_power_name': $('#selected-item-kwh').text(val); break;
                    case 'amount_power': $('#selected-item-kwh').attr('value', 'S_' + val); break;
                }
            }
        });
    }).fail(function(err) {
        console.error(err);
    });
}

function SavePmsInfo() {
    // by shkoh 20170727: 사용여부는 bootstrap 버튼 형식으로 해당 값을 가져오는 jQuery문이 일반 Radio 버튼형식으로 체크하는 것과는 다르다
    const using = $('#using_breaker').find('.active').find('input').val();
    const phase = $("input[name='phaseOption']:checked").val();
    const which = g_breaker_id % 2 == 0 ? "R" : "L";
    const pms_number = $("#pms_number").val();
    const id1 = $("#selected-item-current-total").attr("value") == undefined ? undefined : $("#selected-item-current-total").attr("value").substr(2);
    const id2 = $("#selected-item-current-r").attr("value") == undefined ? undefined : $("#selected-item-current-r").attr("value").substr(2);
    const id3 = $("#selected-item-current-s").attr("value") == undefined ? undefined : $("#selected-item-current-s").attr("value").substr(2);
    const id4 = $("#selected-item-current-t").attr("value") == undefined ? undefined : $("#selected-item-current-t").attr("value").substr(2);
    const id5 = $("#selected-item-factor").attr("value") == undefined ? undefined : $("#selected-item-factor").attr("value").substr(2);
    const id6 = $("#selected-item-kw").attr("value") == undefined ? undefined : $("#selected-item-kw").attr("value").substr(2);
    const id7 = $("#selected-item-kwh").attr("value") == undefined ? undefined : $("#selected-item-kwh").attr("value").substr(2);

    const pms_data = {
        equip_id: $('#pms').attr('pms-id'),
        which: which,
        breaker_id: g_breaker_id,
        b_use: using,
        b_three_phase: using == 'N' ? 'N' : phase,
        pms_number: pms_number,
        current_total: using == 'N' ? undefined : id1,
        current_r: using == 'N' ? undefined : id2,
        current_s: using == 'N' ? undefined : id3,
        current_t: using == 'N' ? undefined : id4,
        power_factor: using == 'N' ? undefined : id5,
        power: using == 'N' ? undefined : id6,
        amount_power: using == 'N' ? undefined : id7
    }

    $.ajax({
        async: true,
        type: "POST",
        url: "/api/diagram/wrfis/pms/breaker",
        dataType: "json",
        data: pms_data
    }).done(function(xhr) {
        pms_data.current_total = undefined;
        pms_data.current_r = undefined;
        pms_data.current_s = undefined;
        pms_data.current_t = undefined;
        pms_data.power_factor = undefined;
        pms_data.power = undefined;
        pms_data.amount_power = undefined;
        
        updatePanelInfo(pms_data);
    }).fail(function(err) {
        console.error(err);
    }).always(function() {
        // by shkoh 20210224: 변경이 된 후에는 화면을 곧바로 업데이트 하여 갱신 속도를 높임
        g_interval_cnt = 9;
    });
}
/******************************************************************************************************************************/
/* by shkoh 20210222: data exchange function end                                                                              */
/******************************************************************************************************************************/