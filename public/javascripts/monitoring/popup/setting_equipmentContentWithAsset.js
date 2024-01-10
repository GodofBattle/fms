const EquipmentContent = function(_id) {
    const content_id = _id;
    let m_modal_tree = undefined;
    let m_image_dropdown = undefined;
    let m_image_list = undefined;
    let m_install_date_controller = undefined;

    kendo.ui.progress.messages = {
        loading: ``
    }

    function createEquipmentContent(selected_id) {
        $(content_id).html('');

        const innerHtml =
        '<table id="detail1" class="table" cellspacing="0" cellpadding="0">' +
            '<colgroup>' +
                '<col width="100%"/>' +
            '</colgroup>' +
            '<tbody>' +
                '<tr>' +
                    '<td colspan="4">' +
                        '<div class="checkbox">' +
                            '<label>' +
                                '<input type="checkbox" id="equipmentUse" style="margin-top: 2px;">설비 사용여부' +
                            '</label>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
            '</tbody>' +
        '</table>' +
        '<table id="detail2" class="table" cellspacing="0" cellpadding="0">' +
            '<colgroup>' +
                '<col width="10%"/>' +
                '<col width="40%"/>' +
                '<col width="50%"/>' +
            '</colgroup>' +
            '<tbody>' +
                '<tr>' +
                    '<th scope="row">설비명*</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="equipmentName" class="form-control" style="box-sizing:border-box;" placeholder="해당 설비의 명칭입니다" maxLength="64"/>' +
                        '</div>' +
                    '</td>' +
                    '<td rowspan="4" id="assetImgWin" class="imageViewer">' +
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
                    '<th scope="row">설비타입*</th>' +
                    '<td>' +
                        '<div class="col-xs-6" style="padding-left: 0px; padding-right: 2px;">' +
                            '<div id="equipmentType" style="text-align: left;"></div>' +
                        '</div>' +
                        '<div class="col-xs-6" style="padding-left: 2px; padding-right: 0px;">' +
                            '<div id="equipmentModel" style="text-align: left;"></div>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr style="height: 30px;">' +
                '</tr>' +
            '</tbody>' +
        '</table>' +
        '<hr/>' +
        '<table id="detail3" class="table" cellspacing="0" cellpadding="0">' +
            '<colgroup>' +
                '<col width="12%"/>' +
                '<col width="32%"/>' +
                '<col width="18%"/>' +
                '<col width="38%"/>' +
            '</colgroup>' +
            '<tbody>' +
                '<tr>' +
                    '<th scope="row">제품모델명</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="assetModel" class="form-control" style="box-sizing:border-box;" placeholder="기반 설비 모델명" maxLength="32"/>' +
                        '</div>' +
                    '</td>' +
                    '<th scope="row" class="i-community">IP / Port / Device ID</th>' +
                    '<td class="i-community">' +
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
                    '<th scope="row">시리얼정보</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="assetSerial" class="form-control" style="box-sizing:border-box;" placeholder="제품 시리얼 정보" maxLength="32"/>' +
                        '</div>' +
                    '</td>' +
                    '<th scope="row" class="i-community">Community</th>' +
                    '<td class="i-community">' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="equipmentCommunity" class="form-control" style="box-sizing:border-box;" placeholder="설비 접속 정보" maxLength="32"/>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">자산 도입일</th>' +
                    '<td>' +
                        '<input id="install-date" class="custom-date" type="text" style="width: 100%"/>' +
                    '</td>' +
                    '<th scope="row" class="i-community">수집주기(초)</th>' +
                    '<td class="i-community">' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="number" id="equipmentInterval" class="form-control" min="0" max="3600" style="box-sizing:border-box;" placeholder="설비의 통신 시도 주기(초)" />' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">관리자명</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="assetManagerName" class="form-control" style="box-sizing:border-box;" placeholder="기반 설비 관리자 정보" maxLength="32"/>' +
                        '</div>' +
                    '</td>' +
                    '<th scope="row" class="i-community">응답대기시간(초)</th>' +
                    '<td class="i-community">' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="number" id="equipmentTimeout" class="form-control" min="1" max="1200" style="box-sizing:border-box;" placeholder="1회 최대 설비 통신 대기시간(초)" />' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">운영자명</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="assetOperatorName" class="form-control" style="box-sizing:border-box;" placeholder="기반 설비 운영자 정보" maxLength="32"/>' +
                        '</div>' +
                    '</td>' +
                    '<th scope="row" class="i-community">재시도횟수</th>' +
                    '<td class="i-community">' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="number" id="equipmentRetry" class="form-control" min="2" max="100" style="box-sizing:border-box;" placeholder="통신대기 재시도 횟수" />' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">유지보수 정보</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="assetMaintenance" class="form-control" style="box-sizing:border-box;" placeholder="유지보수 업체/담당자 정보" maxLength="32"/>' +
                        '</div>' +
                    '</td>' +
                    '<th scope="row" class="i-community" rowspan="2">기타 통신정보</th>' +
                    '<td class="i-community" rowspan="2">' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<textarea class="form-control" rows="6" maxlength="1200" style="resize:none; box-sizing:border-box;" id="equipmentUserDefine" placeholder="통신에 필요한 기타 정보를 입력합니다\n띄어쓰기 포함 1200자 이내"></textarea>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">기타정보</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<textarea class="form-control" rows="4" maxlength="200" style="resize:none; box-sizing:border-box;" id="equipmentDescription" placeholder="해당 설비에 대한 추가정보가 필요한 경우에 작성합니다\n띄어쓰기 포함 200자 이내"></textarea>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">제품이미지</th>' +
                    '<td>' +
                        '<div class="custom-form-group">' +
                            '<input id="assetImageDropdownList"/>' +
                            '<input id="assetImageUploader" type="file" title="제품이미지 추가" style="padding-top:3px;"/>' +
                        '</div>' +
                    '</td>' +
                    '<td colspan="2">' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<p class="form-control-static">' +
                                '<span id="equipmentCreateTime" style="padding-right: 8px;">자산 등록시간:</span>' +
                                '<span id="equipmentUpdateTime" style="padding-left: 8px;">자산 갱신시간:</span>' +
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

        // by shkoh 20211216: 제품 이미지 관련 처리
        $('#assetImgWin').hide();

        createAssetImageDropdownList();
        createAssetImageFileUploader();
        createDateTimePicker();

        // by shkoh 20180824: 설비페이지를 구성하는 설비종류 리스트를 우선하여 로드한 후에 설비정보를 불러옴
        // by shkoh 20180824: 로드하는 순서가 중요!
        loadEquipmentType().then(function() {
            loadEquipmentInfo(selected_id);
            loadEquipmentAddInfo(selected_id);
        });

        $('#modalDialogTree .modal-dialog .modal-content .modal-body').mCustomScrollbar({
            theme: 'minimal',
            axis: 'y',
            scrollbarPosition: 'outside'
        });
    }

    function createAssetImageDropdownList() {
        m_image_dropdown = $('#assetImageDropdownList').kendoDropDownList({
            dataSource: {
                transport: {
                    read: {
                        async: true,
                        type: 'GET',
                        dataType: 'json',
                        url: '/api/popup/set/bgassetimage'
                    }
                },
                requestEnd: function(e) {
                    if(e.type === 'read') {
                        // by shkoh 20211216: File Upload 시, 파일 중복 체크에 사용
                        m_image_list = e.response;
                    }
                }
            },
            optionLabel: {
                name: '선택안함',
                path: ''
            },
            dataTextField: 'name',
            dataValueField: 'path',
            noDataTemplate: '서버에 등록된 이미지가 존재하지 않습니다',
            height: 300,
            template:
                '<div class="custom-dropdown-template">\
                    <img src="#: path #" alt="#: name #" class="custom-dropdown-image"></img>\
                    <span class="custom-dropdown-text">#: name #</span>\
                    <span class="custom-dropdown-icon"><i class="custom-close-icon" title="#: name # 이미지 삭제하기" data-name="#: name #"></i></span>\
                </div>',
            change: function(e) {
                const path = this.value();
                setAssetImage(path);
            },
            dataBound: function(e) {
                $('.custom-close-icon').on('click', deleteAssetImage);
            }
        }).data('kendoDropDownList');
    }

    function createAssetImageFileUploader() {
        $('#assetImageUploader').kendoUpload({
            multiple: false,
            showFileList: false,
            localization: {
                select: '+'
            },
            autoUpload: true,
            validation: {
                maxFileSize: 100000000
            },
            async: {
                saveUrl: '/api/popup/set/assetimageupload',
                saveField: 'assetimage'
            },
            select: function(e) {
                displayLoading();

                const upload_file = e.files[0];
                
                if(m_image_list.length > 0) {
                    const same_image_file = m_image_list.filter(function(img) { return img.name.normalize('NFC') === upload_file.name.normalize('NFC'); });
                    if(same_image_file.length !== 0 && !confirm(upload_file.name + '와 동일한 파일명을 가진 이미지가 이미 존재합니다\n계속 진행 시, 동일한 파일명을 가진 이미지는 새로 추가한 이미지로 변경됩니다\n계속 진행하시겠습니까?')) {
                        undisplayLoading();
                        e.preventDefault();
                    }
                }

                // by shkoh 20211216: image 파일만 업로드
                if(!upload_file.rawFile.type.includes('image')) {
                    alert(upload_file.name + ' 파일은 이미지 파일이 아닙니다\n이미지 파일만 추가 가능합니다');
                    undisplayLoading();
                    e.preventDefault();
                }

                if(upload_file.name.length > 64) {
                    alert('파일명의 길이가 64개를 초과할 수 없습니다');
                    undisplayLoading();
                    e.preventDefault();
                }

                // by shkoh 20211216: 100MB 이하의 파일만 업로드
                if(upload_file.size > 100000000) {
                    alert('최대 100MB 이하의 파일만 업로드 할 수 있습니다');
                    undisplayLoading();
                    e.preventDefault();
                }
            },
            progress: function(e) {
                $('.k-loading-text').text(e.percentComplete + '%');
            },
            success: function(e) {
                if(e.operation === 'upload') {
                    alert(e.response.msg);
                    m_image_dropdown.dataSource.read().then(function() {
                        m_image_dropdown.trigger('change');
                    });
                }
            },
            error: function(e) {
                console.error(e);
                if(e.operation === 'upload') {
                    alert('설비 이미지 파일 ' + e.files[0].name + ' 파일 업로드 중에 에러가 발생했습니다: ' + e.XMLHttpRequest.statusText);
                }
            },
            complete: function(e) {
                undisplayLoading();
            }
        });
    }

    function createDateTimePicker() {
        m_install_date_controller = new DatePicker('#install-date', {
            period: 'day',
            startDate: new Date()
        });
        m_install_date_controller.CreateDatePicker();
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
                height: 400,
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
            height: 400,
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
            dataBound: function(e) {
                this.value(model_id);

                ctrlComInputElement({ is_disabled: e.sender.dataItem().io_type_name === 'ASSET' });
            },
            change: function(e) {
                // by shkoh 20211221: 통신타입이 자산인 경우에는 통신설정을 할 필요가 없음으로 비활성화 진행
                ctrlComInputElement({ is_disabled: e.sender.dataItem().io_type_name === 'ASSET' });
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
        }).fail(function(err) {
            console.error(err.responseText);
        });
    }

    function loadEquipmentAddInfo(selected_id) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/popup/set/equipmentaddinfo?id=' + selected_id
        }).done(function(info) {
            fillEquipmentAddInfo(info);
        }).fail(function(err) {
            console.error(err.responseText);
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
        $('#equipmentCreateTime').text('자산 생성시간: ' + info.create_time);
        $('#equipmentUpdateTime').text('자산 갱신시간: ' + info.update_time);
    }

    function fillEquipmentAddInfo(info) {
        $('#assetManagerName').val(info.mgr_name);
        $('#assetOperatorName').val(info.op_name);
        $('#assetModel').val(info.model_name);
        $('#assetSerial').val(info.serial_info);
        $('#assetMaintenance').val(info.ma_phone);

        // by shkoh 20211221: 제품이미지 선택 시 진행
        $('#assetImageDropdownList').data('kendoDropDownList').text(info.image_file);
        $('#assetImageDropdownList').data('kendoDropDownList').trigger('change');
        
        // by shkoh 20211221: 자산 도입일이 지정되지 않았다면, 오늘 날짜를 기본으로 정함
        if(info.install_date !== undefined) {
            m_install_date_controller.ResetDate(new Date(info.install_date));
        }
    }

    function ctrlComInputElement({ is_disabled }) {
        $('.i-community, .i-community *').attr('disabled', is_disabled).attr('readonly', is_disabled);
        if(is_disabled) {
            $('#equipmentCreateTime').hide();
            $('#equipmentUpdateTime').hide();
        } else {
            $('#equipmentCreateTime').show();
            $('#equipmentUpdateTime').show();
        }
    }

    function setAssetImage(path) {
        $('#assetImgWin').off('click');

        if(path === undefined || path === '') {
            $('#assetImgWin').hide().css({ 'background-image': 'none' });
        } else {
            $('#assetImgWin').show().css({
                'background-image': 'url(' + path.replace(/ /g, '%20') + ')'
            });

            $('#assetImgWin').on('click', function() {
                $('#modalImage').attr('src', path);

                $('#modalDialogImageViewer').modal({ keyboard: true, show: true });
            });
        }
    }

    function deleteAssetImage() {
        const src_name = m_image_dropdown.text();
        const name = this.dataset.name;

        const isConfirm = confirm('설비 이미지 ' + name + ' 파일을 삭제하시겠습니까?\n삭제할 경우 해당 이미지를 사용하는 설비에 설정된 이미지는 모두 초기화됩니다');
        if(isConfirm) {
            $.ajax({
                async: true,
                type: 'DELETE',
                dataType: 'json',
                url: '/api/popup/set/assetImage',
                data: {
                    image_file: name
                }
            }).done(function() {
                m_image_dropdown.dataSource.read().then(function() {
                    m_image_dropdown.select(function(dataItem) { return dataItem.name === src_name; });
                    m_image_dropdown.trigger('change');
                });
            }).fail(function(err) {
                alert(name + ' 이미지 파일 삭제 도중 에러가 발생했습니다. 브라우저 로그를 확인하시기 바랍니다');
                console.error(err);
            });
        }
    }

    function displayLoading() {
        kendo.ui.progress($(document.body), true);
    }

    function undisplayLoading() {
        kendo.ui.progress($(document.body), false);
    }

    return {
        CreateEquipmentContent: function(selected_id) { createEquipmentContent(selected_id); },
        PasteEquipmentInfo: function(selected_id) {
            loadEquipmentInfo(selected_id, true);
            loadEquipmentAddInfo(selected_id);
        }
    }
}