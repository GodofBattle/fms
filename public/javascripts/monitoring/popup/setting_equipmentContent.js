const EquipmentContent = function(_id) {
    const content_id = _id;
    let m_modal_tree = undefined;

    function createEquipmentContent(selected_id) {
        $(content_id).html('');

        const innerHtml =
        '<table id="detail" class="table" cellspacing="0" cellpadding="0">' +
            '<colgroup>' +
                '<col width="30%"/>' +
                '<col width="70%"/>' +
            '</colgroup>' +
            '<tbody>' +
                '<tr>' +
                    '<td colspan="2">' +
                        '<div class="checkbox">' +
                            '<label>' +
                                '<input type="checkbox" id="equipmentUse" style="margin-top: 2px;">설비 사용여부' +
                            '</label>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">설비명*</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="equipmentName" class="form-control" style="box-sizing:border-box;" placeholder="해당 설비의 명칭입니다" maxLength="64"/>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">상위그룹*</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<div class="input-group input-group-sm">' +
                                '<input id="equipmentParentName" type="text" class="form-control" placeholder="해당 설비의 상위 그룹을 선택합니다" readonly style="user-select: none;">' +
                                '<span class="input-group-btn">' +
                                    '<button id="userSelectButtonForParentGroup" class="btn btn-default" type="button">...</button>' +
                                '</span>' +
                            '</div>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">설명</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<textarea class="form-control" rows="3" maxlength="200" style="resize:none; box-sizing:border-box;" id="equipmentDescription" placeholder="해당 설비에 대한 설명이 필요한 경우에 작성합니다\n띄어쓰기 포함 200자 이내"></textarea>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">설비모델*</th>' +
                    '<td>' +
                        '<div class="col-xs-6" style="padding-left: 0px; padding-right: 2px;">' +
                            '<div id="equipmentType" style="text-align: left;"></div>' +
                        '</div>' +
                        '<div class="col-xs-6" style="padding-left: 2px; padding-right: 0px;">' +
                            '<div id="equipmentModel" style="text-align: left;"></div>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">IP / Port / Device ID</th>' +
                    '<td>' +
                        '<div class="form-horizontal">' +
                            '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                                '<div class="col-xs-6" style="padding-left: 0px; padding-right: 2px;">' +
                                    '<input type="text" id="equipmentIp" class="form-control" style="box-sizing:border-box;" placeholder="IPv4 Address" maxLength="32"/>' +
                                '</div>' +
                                '<div class="col-xs-3" style="padding-left: 2px; padding-right: 2px;">' +
                                    '<input type="number" id="equipmentPort" class="form-control" min="0" max="65535" style="box-sizing:border-box;" placeholder="Port" />' +
                                '</div>' +
                                '<div class="col-xs-3" style="padding-left: 2px; padding-right: 0px;">' +
                                    '<input type="number" id="equipmentDeviceId" class="form-control" min="0" max="99999" style="box-sizing:border-box;" placeholder="Device Id" />' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">Community</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="equipmentCommunity" class="form-control" style="box-sizing:border-box;" placeholder="설비 접속 정보" maxLength="32"/>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">수집주기(초)*</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="number" id="equipmentInterval" class="form-control" min="0" max="3600" style="box-sizing:border-box;" placeholder="설비의 통신 시도 주기(초)" />' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">응답대기시간(초)*</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="number" id="equipmentTimeout" class="form-control" min="1" max="1200" style="box-sizing:border-box;" placeholder="1회 최대 설비 통신 대기시간(초)" />' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">재시도횟수*</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="number" id="equipmentRetry" class="form-control" min="2" max="100" style="box-sizing:border-box;" placeholder="통신대기 재시도 횟수" />' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">사용자정의</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<textarea class="form-control" rows="6" maxlength="1200" style="resize:none; box-sizing:border-box;" id="equipmentUserDefine" placeholder="해당 설비에 필요한 사용자 정의 항목을 작성합니다\n띄어쓰기 포함 1200자 이내"></textarea>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td colspan="2">' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<p class="form-control-static">' +
                                '<span id="equipmentCreateTime" style="padding-right: 8px;">생성시간:</span>' +
                                '<span id="equipmentUpdateTime" style="padding-left: 8px;">갱신시간:</span>' +
                            '</p>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
            '</tbody>' +
        '</table>';

        $(content_id).html(innerHtml);
        
        $('#userSelectButtonForParentGroup').off('click');
        $('#userSelectButtonForParentGroup').on('click', function() {
            if($('#groupParentName').val() == 'ROOT') {
                alert('최상위 그룹은 "상위그룹" 설정이 불가능합니다');
                return;
            }

            $("#modalDialogTree").modal({ keyboard: false, show: true });
        });

        $('#modalDialogTree').off('show.bs.modal');
        $('#modalDialogTree').on('show.bs.modal', function(e) {
            const parent_group_id = $('#userSelectButtonForParentGroup').attr('data');
            
            m_modal_tree = new GroupTreeView('#modal-tree', parent_group_id);
            m_modal_tree.CreateGroupTree();
        });
        
        $('#modalDialogTree').off('hide.bs.modal');
        $('#modalDialogTree').on('hide.bs.modal', function(e) {
            if(m_modal_tree != undefined) {
                m_modal_tree.Destroy();
                m_modal_tree = undefined;
            }
        });

        $('#btn-modal-tree-link').off('click');
        $('#btn-modal-tree-link').on('click', function() {            
            const modal_tree_node = m_modal_tree.GetSelectedTreeNode();
            if(modal_tree_node == undefined) {
                alert('상위 그룹 설정에 문제가 발생하였습니다. 다시 시도해 주세요');
                return;
            };
            
            const parent_group_id = modal_tree_node.id.substr(2);
            const parent_group_name = modal_tree_node.name;
            $('#userSelectButtonForParentGroup').attr('data', parent_group_id);
            $('#equipmentParentName').val(parent_group_name);
    
            $("#modalDialogTree").modal('hide');
        });

        // by shkoh 20180824: input[type="name"] 항목들은 키보드 입력 시 min과 max의 영향을 받지 않음으로 강제로 값을 지정함
        $('input[type="number"]').keydown(function(e) {
            // by shkoh 20180824: 좌우방향키(37, 39), Backspace(8), delete(46)키에 대한 예외
            // by shkoh 20181025: 키패드 숫자 허용(96 ~ 105)
            // by shkoh 20181025: Tab 키(9)
            if(e.keyCode == 8 || e.keyCode == 37 || e.keyCode == 39 || e.keyCode == 46 ||
               (e.keyCode >= 96 && e.keyCode <= 105) ||
               e.keyCode == 9
            ) return true;
            else if(e.keyCode < 48 || e.keyCode > 57) return false;
        });

        // kdh 20191115 input[type="number"]에 숫자 입력 시 모두 가능, focus out시에 min/max 조건 판단
        $('input[type="number"]').focusout(function(e) {
            const min = parseInt($(this).attr('min'));
            const max = parseInt($(this).attr('max'));
            const current_value = parseInt(this.value);

            if(current_value > max) {
                alert('최대값 ' + max + '을 초과하여 ' + max + '으로 자동 설정됩니다.');
                this.value = max;
            } else if(current_value < min) {
                alert('최소값 ' + min + '보다 작기 때문에 ' + min + '(으)로 자동 설정됩니다.');
                this.value = min;
            } else if(isNaN(current_value)) {
                alert('입력 형식이 올바르지 않아 최소값인 ' + min + '(으)로 자동 설정됩니다.');
                this.value = min;
            }

            if(current_value < 10 && this.value.length > 1) this.value = current_value;
        });

        // by shkoh 20180824: 설비페이지를 구성하는 설비종류 리스트를 우선하여 로드한 후에 설비정보를 불러옴
        // by shkoh 20180824: 로드하는 순서가 중요!
        loadEquipmentType().then(function() {
            loadEquipmentInfo(selected_id);
        });

        $('#modalDialogTree .modal-dialog .modal-content .modal-body').mCustomScrollbar({
            theme: 'minimal',
            axis: 'y',
            scrollbarPosition: 'outside'
        });
    }

    function loadEquipmentType() {
        return new Promise(function(resolve, reject) {
            kendo.destroy($('#equipmentType'));
            
            $('#equipmentType').kendoDropDownList({
                noDataTemplate: '사전 등록된 설비종류가 존재하지 않습니다',
                dataTextField: 'code_string',
                dataValueField: 'code_id',
                optionLabel: {
                    code_string: '설비종류 선택안함',
                    code_id: ''
                },
                height: 300,
                dataSource: {
                    transport: {
                        read: {
                            cache: false,
                            type: 'GET',
                            dataType: 'json',
                            url: '/api/monitoring/equiptype'
                        }
                    }
                },
                dataBound: function() {
                    resolve();    
                },
                change: function(e) {
                    // by shkoh 20211204: 설비종류가 변경되면, 설비코드와 사전에 미리 등록된 model_id를 지정
                    const value = this.value();
                    loadEquipmentModel(value, e.model_id);
                }
            });
        });
    }

    function loadEquipmentModel(equip_code, model_id) {
        kendo.destroy($('#equipmentModel'));
        
        $('#equipmentModel').kendoDropDownList({
            noDataTemplate: '사전 등록된 설비모델이 존재하지 않습니다',
            dataTextField: 'equip_name',
            dataValueField: 'pd_equip_id',
            optionLabel: {
                equip_name: '설비모델 선택안함',
                pd_equip_id: 0
            },
            height: 300,
            dataSource: {
                transport: {
                    read: {
                        cache: false,
                        type: 'GET',
                        dataType: 'json',
                        url: '/api/popup/set/model?equipcode=' + equip_code
                    }
                },
                sort: { field: 'equip_name', dir: 'asc' }
            },
            dataBound: function() {
                this.value(model_id);
            }
        });
    }

    function loadEquipmentInfo(selected_id, is_pasted = false) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/popup/set/equipment?id=' + selected_id
        }).done(function(info) {
            fillEquipmentInfo(info, is_pasted);
        }).fail(function(err_msg) {
            console.error(xhr.responseText);
        });
    }

    function fillEquipmentInfo(info, is_pasted) {
        // by shkoh 20180823: 설비 사용여부
        if(info.b_use == 'Y') $('#equipmentUse').attr('checked', 'checked');
        else $('#equipmentUse').removeAttr('checked');

        // by shkoh 20211221: 설비 복사 명령어로 수행할 경우에는 [설비명], [상위그룹]은 복사하지 않는다
        if(!is_pasted) {
            // by shkoh 20180823: 설비명
            $('#equipmentName').val(info.name);
            // by shkoh 20180823: 설비 상위그룹
            $('#userSelectButtonForParentGroup').attr('data', info.pid);
            $('#equipmentParentName').val(info.p_name);
        }
        
        // by shkoh 20180823: 설비 설명
        $('#equipmentDescription').val(info.description);
        // by shkoh 20180823: 설비모델은 설비종류 설정 -> 설비모델 설정 순서로 반드시 구성되어야 함
        $('#equipmentType').data('kendoDropDownList').value(info.equip_code == null ? '' : info.equip_code);
        $('#equipmentType').data('kendoDropDownList').trigger('change', { model_id: info.pd_equip_id });
        // by shkoh 20180824: IP / Port / Device ID
        $('#equipmentIp').val(info.ip);
        $('#equipmentPort').val(info.port);
        $('#equipmentDeviceId').val(info.device_id);
        // by shkoh 20180824: Community
        $('#equipmentCommunity').val(info.community);
        // by shkoh 20180824: Polling Interval
        $('#equipmentInterval').val(info.poll_interval);
        // by shkoh 20180824: Timeout / Retry
        $('#equipmentTimeout').val(info.timeout);
        $('#equipmentRetry').val(info.retry);
        // by shkoh 20180824: User Define
        $('#equipmentUserDefine').val(info.user_define);
        // by shkoh 20180824: Create DateTime / Update DateTime
        $('#equipmentCreateTime').text('생성시간: ' + info.create_time);
        $('#equipmentUpdateTime').text('갱신시간: ' + info.update_time);
    }

    return {
        CreateEquipmentContent: function(selected_id) { createEquipmentContent(selected_id); },
        PasteEquipmentInfo: function(selected_id) { loadEquipmentInfo(selected_id, true); }
    }
}