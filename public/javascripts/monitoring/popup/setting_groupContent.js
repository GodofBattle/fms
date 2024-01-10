const GroupContent = function(_id) {
    const content_id = _id;
    let m_modal_tree = undefined;
    let m_image_dropdown = undefined;
    let m_image_list = undefined;

    kendo.ui.progress.messages = {
        loading: ``
    }

    function createGroupContent(selected_id) {
        $(content_id).html('');

        const innerHtml =
        '<table id="detail" class="table" cellspacing="0" cellpadding="0">' +
            '<colgroup>' +
                '<col width="20%"/>' +
                '<col width="80%"/>' +
            '</colgroup>' +
            '<tbody>' +
                '<tr>' +
                    '<th scope="row">그룹명*</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<input type="text" id="groupName" class="form-control" style="box-sizing:border-box;" placeholder="해당 그룹의 명칭입니다" maxLength="50"/>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">상위그룹*</th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<div class="input-group input-group-sm">' +
                                '<input id="groupParentName" type="text" class="form-control" placeholder="해당 그룹의 상위 그룹을 선택합니다" readonly style="user-select: none;">' +
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
                            '<textarea class="form-control" rows="4" maxlength="200" style="resize:none; box-sizing:border-box;" id="groupDescription" placeholder="해당 그룹에 대한 설명이 필요한 경우에 작성합니다\n띄어쓰기 포함 200자 이내"></textarea>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row">이미지</th>' +
                    '<td>' +
                        '<div class="custom-form-group">' +
                            '<input id="groupImageDropdownList"/>' +
                            '<input id="groupImageUploader" type="file" title="그룹이미지 추가"/>' +
                        '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<th scope="row"></th>' +
                    '<td>' +
                        '<div class="form-group form-group-sm" style="margin-bottom:0px;">' +
                            '<img class="img-responsive" id="grpImgWin" alt="map image" style="box-sizing:border-box;"/>' +
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
            const parent_depth = modal_tree_node.depth;

            if(parent_group_id == selected_id) {
                alert('"상위그룹"과 "설정하려는 그룹"이 동일할 수 없습니다');
                return;
            }
            
            $('#userSelectButtonForParentGroup').attr('data', parent_group_id);
            $('#userSelectButtonForParentGroup').attr('data_depth', parent_depth);
            $('#groupParentName').val(parent_group_name);
    
            $("#modalDialogTree").modal('hide');
        });

        $('#grpImgWin').hide();

        createGroupImageDropDownList();
        createGroupImageFileUploader();

        loadGroupInfo(selected_id);

        $('#modalDialogTree .modal-dialog .modal-content .modal-body').mCustomScrollbar({
            theme: 'minimal',
            axis: 'y',
            scrollbarPosition: 'outside'
        });
    }

    function createGroupImageDropDownList() {
        m_image_dropdown = $('#groupImageDropdownList').kendoDropDownList({
            dataSource: {
                transport: {
                    read: {
                        async: true,
                        type: 'GET',
                        dataType: 'json',
                        url: '/api/popup/set/bgimage'
                    }
                },
                requestEnd: function(e) {
                    if(e.type === 'read') {
                        // by shkoh 20200620: File Upload 시, 파일 중복 체크에 사용
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
                setGroupImage(path);
            },
            dataBound: function(e) {
                $('.custom-close-icon').on('click', deleteGroupImage);
            }
        }).data('kendoDropDownList');
    }

    function createGroupImageFileUploader() {
        $('#groupImageUploader').kendoUpload({
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
                saveUrl: '/api/popup/set/imageupload',
                saveField: 'groupimage'
            },
            select: function(e) {
                displayLoading();
                
                const upload_file = e.files[0];
                if(m_image_list.length > 0) {
                    const same_image_file = m_image_list.filter(function(img) { return img.name.normalize('NFC') === upload_file.name.normalize('NFC'); });
                    if(same_image_file.length !== 0 && !confirm(upload_file.name + '와 동일한 파일명을 가진 이미지가 이미 존재합니다.\n계속 진행 시, 동일한 파일명을 가진 이미지는 새로 추가한 이미지로 변경됩니다\n계속 진행하시겠습니까?')) {
                        undisplayLoading();
                        e.preventDefault();
                    }
                }

                // by shkoh 20200622: image 파일만 업로드
                if(!upload_file.rawFile.type.includes('image')) {
                    alert(upload_file.name + '파일은 이미지 파일이 아닙니다\n이미지 파일만 추가 가능합니다');
                    undisplayLoading();
                    e.preventDefault();
                }

                if(upload_file.name.length > 64) {
                    alert('파일명의 길이가 64개를 초과할 수 없습니다');
                    undisplayLoading();
                    e.preventDefault();
                }

                // by shkoh 20200622: 100MB 이하의 파일만 업로드
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
                    alert('그룹 이미지 파일 ' + e.files[0].name + ' 파일 업로드 중에 에러가 발생했습니다: ' + e.XMLHttpRequest.statusText);
                }
            },
            complete: function(e) {
                undisplayLoading();
            }
        });
    }

    function loadGroupInfo(selected_id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/popup/set/group?id=' + selected_id
            }).done(function(info) {
                fillGroupInfo(info);
            }).fail(function(err_msg) {
                console.error(err_msg);
                reject();
            }).always(function() {
                resolve();
            });
        });
    }

    function fillGroupInfo(info) {
        $('#groupName').val(info.name);

        $('#userSelectButtonForParentGroup').attr('data', info.pid);
        $('#userSelectButtonForParentGroup').attr('data_depth', info.p_group_depth);
        
        $('#groupParentName').val(info.p_group_name);
        
        $('#groupDescription').val(info.description);

        m_image_dropdown.select(function(dataItem) { return dataItem.name === info.imageName });
        m_image_dropdown.trigger('change');
    }

    function setGroupImage(path) {
        if(path === undefined || path === '') {
            // by shkoh 20200619: 그룹 이미지를 선택안함 했을 경우
            $('#grpImgWin').hide().attr({ src: '' });
        } else {
            // by shkoh 20200619: 그룹 이미지를 선택 했을 경우
            $('#grpImgWin').show().attr({
                src: path + '?' + (new Date().getTime()),
                style: 'width: 100%; height: 100%;'
            });
        }
    }

    function deleteGroupImage() {
        const src_name = m_image_dropdown.text();
        const name = this.dataset.name;
        
        const isConfirm = confirm('그룹 이미지 ' + name + ' 파일을 삭제하시겠습니까?\n삭제할 경우 해당 이미지를 사용하는 그룹에 설정된 이미지는 모두 초기화됩니다');
        if(isConfirm) {
            $.ajax({
                async: true,
                type: 'DELETE',
                dataType: 'json',
                url: '/api/popup/set/groupimage',
                data: {
                    image_name: name
                }
            }).done(function() {
                // by shkoh 20200619: 정상적으로 삭제된 된 후에는 현재 선택된 값을 기록한 후에, 다시 그룹이미지 리스트를 새로 읽고, 기존에 선택된 값을 다시 선택
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

    function getGroupImageName() {
        const image_name = m_image_dropdown.value() === '' ? 0 : m_image_dropdown.text();
        return image_name;
    }

    function displayLoading() {
        kendo.ui.progress($(document.body), true);
    }

    function undisplayLoading() {
        kendo.ui.progress($(document.body), false);
    }

    return {
        CreateGroupContent: function(selected_id) { createGroupContent(selected_id); },
        PasteGroupInfo: function(selected_id) { loadGroupInfo(selected_id); },
        GetGroupImageName: function() { return getGroupImageName(); }
    }
}