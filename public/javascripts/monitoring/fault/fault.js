/// <reference path='../../../../typings/jquery/jquery.d.ts'/>
/// <reference path='../../../../typings/kendo-ui/kendo.all.d.ts'/>

let g_grid = undefined;
let g_data_source = undefined;

let g_s_date_inst = undefined;
let g_e_date_inst = undefined;

let g_action_date_inst = undefined;
let g_action_user_inst = undefined;
let g_action_content_inst = undefined;

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    resizeWindow();
    
    // by shkoh 20210525: datetimepicker 재설정
    initDateTimePicker();
    // by shkoh 20210525: '기간 재설정' 버튼 재설정
    initButton();
    
    // by shkoh 20210525: popover dateinput
    initPopoverInput();

    initAlarmGrid();
    initAlarmDataSource();

    $('#search-button').on('click', function() {
        if(g_equipId === undefined || g_equipId === null || g_equipId === '') {
            alert('조회항목이 존재하지 않습니다');
            return;
        }

        const start_date = g_s_date_inst.GetDate();
        const end_date = g_e_date_inst.GetDate();
        if(start_date - end_date > 0) {
            alert('조회 시작시간이 종료 시간보다 우선일 순 없습니다');
            return;
        }

        setTimeout(function() {
            g_data_source.read().then(function() {
                $('#popoverEdit').trigger('blur');
            });
        });
    });

    $('#btn-popover-delete').on('click', function() {
        const is_confirm = confirm('조치내역을 삭제하시겠습니까?');
        if(is_confirm) {
            g_action_date_inst.value(new Date());
            g_action_user_inst.value('');
            g_action_content_inst.value('');

            const id = $('#popoverEdit').attr('data-id');
            if(id === undefined) {
                alert('삭제를 위한 ID가 존재하지 않습니다');
                return;
            }

            $.ajax({
                async: true,
                type: 'DELETE',
                dataType: 'json',
                url: '/api/popup/fault/action',
                data: { id: id }
            }).done(function(xhr) {
                alert('삭제가 완료됐습니다');
                g_data_source.read().then(function() {
                    $('#popoverEdit').trigger('blur');
                }); 
            }).fail(function(err) {
                console.error(err);
            });
        }
    });
    
    $('#btn-popover-save').on('click', function() {
        const set = {
            alarmActionHistoryId: undefined,
            alarmHistoryId: $('#popoverEdit').attr('data-id'),
            action_date: g_action_date_inst.value(),
            action_user_name: g_action_user_inst.value(),
            action_content: g_action_content_inst.value()
        }

        $.ajax({
            async: true,
            type: 'POST',
            dataType: 'json',
            url: '/api/popup/fault/action',
            data: set
        }).done(function(xhr) {
            alert('장애조치 내역 저장 완료');
            g_data_source.read().then(function() {
                $('#popoverEdit').trigger('blur');
            }); 
        }).fail(function(err) {
            console.error(err);
        });
    });

    $('#btn-popover-close').on('click', function() {
        $('#popoverEdit').trigger('blur');
    });

    // by shkoh 20210527: popover의 focus를 잃을 때는 popover를 자연스럽게 숨김
    $('#popoverEdit').on('blur', function() {
        $('#popoverEdit').css('display', 'none');
        $('#popoverEdit').removeAttr('data-id');
    });

    // by shkoh 20210527: 조회기간에 포커스가 들어갈 때 blur 처리
    $('.custom-date').on('focus', function() {
        $('#popoverEdit').trigger('blur');
    });

    // by shkoh 20210527: 장애리스트에서 스크롤이 발생할 경우에 숨김
    $('.k-auto-scrollable').on('scroll', function() {
        $('#popoverEdit').trigger('blur');
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20210525: resize window start                                                                                                     */
/**********************************************************************************************************************************************/
function resizeWindow() {
    $('#report-page').height(calculateHeight());

    if(g_grid) g_grid.resize();
}

function calculateHeight() {
    // by shkoh 20200810: body에서 padding-top과 padding-bottom의 크기 16을 뺀 report grid의 높이
    const viewer_h = parseFloat($('body').height()) - 12;
    
    // by shkoh 20200810: '검색조건'의 높이를 계산하여 해당 부분도 뺌
    const search_h = parseFloat($('#search').height());

    // by shkoh 20200810: '검색결과'의 header의 높이를 계산하여 해당 부분을 뺌
    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_border_h = 6;
    const panel_heading_padding_h = 8;

    return viewer_h - search_h - panel_heading_h - panel_heading_border_h - panel_heading_padding_h;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210525: resize window end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210525: datetimepicker start                                                                                                    */
/**********************************************************************************************************************************************/
function getDefaultDateTime(_period, _date) {
    const date = new Date(_date);

    let _start = undefined;
    let _end = undefined;

    const m = date.getMinutes();
    const new_m = (parseInt(m / 5) + 1) * 5;

    switch(_period) {
        case '5minute': {
            _end = new Date(date.setMinutes(new_m));

            const hour = date.getHours();
            _start = new Date(date.setHours(hour - 1));
            break;
        }
        case 'hour': {
            // by shkoh 202105256: 장애 발생 시간을 기준으로 전후 24시간을 기본으로 지정함
            const hour = date.getHours();
            _end = new Date(date.setHours(hour + 24, 0));

            const day = date.getDate();
            _start = new Date(date.setDate(day - 2));
            break;
        }
        case 'day': {
            _end = new Date(date.setMinutes(new_m));
            
            const month = date.getMonth();
            // by shkoh 20210419: 다른 보고서와는 다르게 자산정보는 1년 단위 기준을 기본으로 설정하도록 수정함
            _start = new Date(date.setMonth(month - 12));
            break;
        }
        case 'month': {
            _end = new Date(date.setMinutes(new_m));
            const year = date.getFullYear();
            _start = new Date(date.setFullYear(year - 1));
            break;
        }
    }

    return {
        startDate: _start,
        endDate: _end
    }
}

function initDateTimePicker() {
    const period = 'hour';
    const init_date = getDefaultDateTime(period, g_occurDate ? g_occurDate : new Date());

    g_s_date_inst = new DatePicker('#start-date', {
        period: period,
        startDate: init_date.startDate
    });
    g_s_date_inst.CreateDatePicker();

    g_e_date_inst = new DatePicker('#end-date', {
        period: period,
        startDate: init_date.endDate
    });
    g_e_date_inst.CreateDatePicker();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210525: datetimepicker end                                                                                                      */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210525: period reset button start                                                                                               */
/**********************************************************************************************************************************************/
function initButton() {
    $('#init-date').kendoButton({
        icon: 'refresh',
        click: function(e) {
            // by shkoh 20210527: 시간에 대한 갱신이 이루어질 때 popover는 자연스럽게 닫음
            $('#popoverEdit').trigger('blur');

            const period = 'hour';
            const init_date = getDefaultDateTime(period, g_occurDate ? g_occurDate : new Date());

            g_s_date_inst.ResetDate(init_date.startDate);
            g_e_date_inst.ResetDate(init_date.endDate);
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210525: period reset button end                                                                                                 */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210526: popover date input button start                                                                                         */
/**********************************************************************************************************************************************/
function initPopoverInput() {
    g_action_date_inst = $('#actionDate').kendoDateInput({
        format: 'yyyy/MM/dd HH:mm',
        messages: {
            year: '년',
            month: '월',
            day: '일',
            hour: '시',
            minute: '분',
            second: '초'
        },
        value: new Date()
    }).data('kendoDateInput');

    g_action_user_inst = $('#actionUser').kendoTextBox({}).data('kendoTextBox');

    g_action_content_inst = $('#actionContent').kendoTextArea({
        rows: 3,
        maxLength: 256,
        resizable: 'none'
    }).data('kendoTextArea');
}
/**********************************************************************************************************************************************/
/* by shkoh 20210526: popover date input button end                                                                                           */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210525: alarm grid start                                                                                                        */
/**********************************************************************************************************************************************/
function initAlarmGrid() {
    g_grid = $('#report-page').kendoGrid({
        autoBind: true,
        noRecords: {
            template:
            '<div style="display:table; width: 100%; height: 100%;">\
                <h3 style="margin: 0px; display: table-cell; vertical-align: middle;">\
                    <span class="label label-default" style="border-radius: 0px;>\
                        해당 조건에 맞는 장애이력이 존재하지 않습니다\
                    </span>\
                </h3>\
            </div>'
        },
        selectable: 'row',
        pageable: {
            numeric: false,
            previousNext: false,
            messages: {
                empty: '검색결과 없음',
                display: '기간 내 장애건수: {2:n0}'
            }
        },
        sortable: true,
        groupable: false,
        navigatable: false,
        columns: [
            {
                field: 'alarm_level',
                title: ' ',
                width: 10,
                template: '<div class="level-img" style="background-image:url(/img/monitoring/L#:data.alarm_level#.png);"></div>',
                sortable: false
            },
            { field: 'alarm_msg', title: '장애내용', width: 80, sortable: false },
            { field: 'occur_date', title: '발생시간', width: 22 },
            { field: 'recovery_date', title: '복구시간', width: 22 },
            { field: 'sensor_name', title: '센서명', width: 25 },
            { field: 'sensor_kind', title: '센서종류', width: 25 },
            {
                field: 'action_content',
                title: '조치',
                width: 100,
                sortable: false,
                template: kendo.template($('#action-template').html())
            }
        ],
        dataBound: function(e) {
            if(g_data_source === undefined) return;

            let alarm_data = g_data_source.at(0);
            if(g_sensorId === -1) {
                alarm_data = g_data_source.data().filter(function(d) {
                    return d.occur_date === g_occurDate && d.alarm_level === g_alarmLevel;
                })[0];
            } else {
                alarm_data = g_data_source.data().filter(function(d) {
                    return d.sensor_id === g_sensorId && d.occur_date === g_occurDate;
                })[0];
            }

            if(alarm_data !== undefined) {
                const alarm_row = g_data_source.get(alarm_data.alarmHistoryId);

                g_grid.current('tr[data-uid="' + alarm_row.uid + '"]');
                g_grid.select('tr[data-uid="' + alarm_row.uid + '"]');
                g_grid.table.focus();
            }
        },
        change: function() {
            $('#popoverEdit').trigger('blur');
        }
    }).data('kendoGrid');
}

function initAlarmDataSource() {
    g_data_source = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function(options) {
                    if(!g_equipId) return;
                    else return '/api/popup/fault/info?equip_id=' + g_equipId + '&start_date=' + $('#start-date').val() + '&end_date=' + $('#end-date').val();
                }
            },
            parameterMap: function(data, type) {
                if(type == 'read') {
                    return data;
                }
            }
        },
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: 'alarmHistoryId',
                fields: {
                    alarm_level: { type: 'string', editable: false },
                    alarm_msg: { type: 'string', editable: false },
                    occur_date: { type: 'datetime', editable: false },
                    recovery_date: { type: 'datetime', editable: false },
                    equip_id: { validation: { required: true } },
                    sensor_id: { validation: { required: true } },
                    sensor_name: { type: 'string', editable: false },
                    sensor_kind: { type: 'string', editable: false },
                    action_date: { type: 'datetime', editable: true, nullable: false },
                    action_user_name: { type: 'string', editable: true, nullable: false },
                    action_content: { type: 'string', editable: true, nullable: false },
                    alarm_level_num: { validation: { required: true } }
                }
            }
        }
    });

    g_grid.setDataSource(g_data_source);
}

function showEditPopover(event) {
    const boundingbox = event.target.getBoundingClientRect();
    const report_page = $('#report-page').height();
    
    let arrow = document.getElementById('arrow');
    
    let pos_x = boundingbox.left - $('#popoverEdit').width() + boundingbox.width;
    let pos_y = boundingbox.top + boundingbox.height + 5;

    if(boundingbox.top > report_page - 130) {
        pos_y = pos_y - $('#popoverEdit').height() - boundingbox.height - 5;
        arrow.style.borderBottomColor = '';
        arrow.style.borderTopColor = 'rgba(84,84,84,0.9)';
        $('#arrow').css('top', '100%');
    } else {
        arrow.style.borderBottomColor = 'rgba(84,84,84,0.9)';
        arrow.style.borderTopColor = '';
        $('#arrow').css('top', '-12%');
    }
    
    $('#popoverEdit').css({
        display: 'block',
        left: pos_x + 'px',
        top: pos_y + 'px'
    });

    const row_element = $(event.target).parents('tr');
    const info = g_grid.dataItem(row_element);
    g_action_date_inst.value(info.action_date === null ? new Date() : info.action_date);
    g_action_user_inst.value(info.action_user_name === null ? '' : info.action_user_name);
    g_action_content_inst.value(info.action_content === null ? '' : info.action_content);

    $("#popoverEdit").attr('data-id', info.alarmHistoryId);
}
/**********************************************************************************************************************************************/
/* by shkoh 20210525: alarm grid end                                                                                                          */
/**********************************************************************************************************************************************/