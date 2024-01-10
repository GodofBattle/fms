/// <reference path="../../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../../typings/kendo-ui/kendo.all.d.ts"/>

// by shkoh 20181115: Init User Grade
let g_user_grade = parent.$.session.get('user-grade');
// by shkoh 20181115: 사용자 리스트에서 선택 정보를 저장하는 Object
let g_selector = undefined;

let g_list_view_dataSource = undefined;

let g_tree = undefined;

let g_isInsertMode = false;

let g_thresholdAlarmCount = 0;
let g_communicationAlarmCount = 0;

$(function() {
	// by shkoh 20181115: UserList Control
	initUserList();
	
	// by shkoh 20181115: UserInfo Control
	initUserInfo();
	
	// by shkoh 20181115: AlarmCondition Control
	initAlarmCondition();

	// by shkoh 20181115: User CRUD Button Control
	initUserControlButton();

	// by wchoi 20190125: User AlarmRequirementColor Control
	setAlarmRequirementColor();
});

/***************************************************************************************************************/
/* by shkoh 20181115: User List Start                                                                          */
/***************************************************************************************************************/
/**
 * 사용자 리스트 초기화
 */
function initUserList() {
	createUserList();

	$('#insertUser').on('click', function() {
		userListInsert();
		userInfoInsert();
		// loadTreeView();
		alarmConditionSet();
		userControlButtonInsert();

		g_isInsertMode = true;

		// by wchoi 20190125: 유저 생성 시 기본 알람값에 대한 설정
		g_thresholdAlarmCount = 9;
		g_communicationAlarmCount = 9;
	});

	$('#deleteUser').on('click', function() {
		const modal = confirm('선택한 사용자 계정을 정말 삭제하시겠습니까?');
		if(modal == false) return;

		deleteUser();
	});

	$('#saveUserConfig').on('click', function() {
		const modal = confirm('선택한 사용자 정보를 저장하시겠습니까?');
		if(modal == false) return;

		saveUserInfo();
	});

	$('#cancelUserConfig').on('click', function() {
		const modal = confirm('현재까지 설정한 내용을 모두 취소하시겠습니까?');
		if(modal == false) return;
		
		userListReady();
		userInfoReady();
		unloadTreeView();
		alarmConditionReady();
		userControlButtonReady();

		g_isInsertMode = false;
		g_selector = undefined;
		g_thresholdAlarmCount = 0;
		g_communicationAlarmCount = 0;
	});
}

/**
 * 사용자 리스트 생성
 */
function createUserList() {
	const kendo_list_view_template = kendo.template(
		'<label class="btn btn-userList" id="userListOptions">' +
			// '<input type="radio" name="options" id="option" autocomplete="off"/>' +
			'<strong>#:id#</strong>: #:name# <b><font color="darkGray">(#:grade#)</font></b>' +
		'</label>'
	);

	g_list_view_dataSource = new kendo.data.DataSource({
		transport: {
			read: {
				url: '/api/user/all',
				dataType: 'json',
				complete: function(e) {
					if(g_selector) {
						let user_list = $('#userList').data('kendoListView');
						user_list.items().map(function(idx, child) {
							const item = user_list.dataItem(child);
							if(g_selector == item.id) {
								user_list.select(child);
							}
						});
					}
				}
			}
		}
	});

	$('#userList').kendoListView({
		dataSource: g_list_view_dataSource,
		selectable: true,
		navigatable: false,
		change: onUserListChange,
		template: kendo_list_view_template
	});
}

/**
 * 사용자 리스트에서 사용자 정보가 변경될 때 이벤트
 */
function onUserListChange(e) {
	// by shkoh 20181115: 사용자 리스트에 대한 변경 이벤트가 발생하는 경우에 무조건 TreeView를 삭제함
	unloadTreeView();

	if(this.select().length == 0) return;
	
	const selected_item = this.dataItem(e.sender.select());
	if(selected_item == undefined) return;

	g_selector = {
		id: selected_item.id,
		grade: selected_item.user_level
	}

	userInfoSelect();
	userControlButtonSelect();
	alarmConditionSet();
	
	// by shkoh 20181115: 선택한 user_id의 정보를 로드하여 필요한 내역들을 채움
	loadUserInfo(g_selector.id).then(function(user_info) {
		fillUserInfo(user_info);
		fillAlarmCondition(user_info);
		loadTreeView(user_info.userId, user_info.startGroupId);
	}).catch(function(err_code) {
		alert('[' + err_code.responseText + '] ' + g_selector.id + ' 의 사용자 정보를 로드할 수 없습니다');
	});
}

/**
 * parameter id와 동일한 사용자 정보를 로드하여 입력 
 * 
 * @param {String} id 조회할 User Id
 */
function loadUserInfo(id) {
	return new Promise(function(resolve, reject) {
		$.ajax({
			async: true,
			type: 'GET',
			dataType: 'json',
			url: `/api/user/info?id=${id}`
		}).done(function(user) {
			resolve(user);
		}).fail(function(err_code) {
			reject(err_code);
		});
	});
}

/**
 * 기본 상황 시 사용자 리스트 정의
 * 사용자 리스트를 사용 가능한 상태로 변경
 */
function userListReady() {
	let userList = $('#userList').data('kendoListView');
	userList.setOptions({ selectable: true });
	userList.clearSelection();
	userList.refresh();
}

/**
 * 사용자 추가 상황에서의 사용자 리스트 정의
 * 사용자 리스트에서 사용을 할 수 없도록 변경
 */
function userListInsert() {
	let userList = $('#userList').data('kendoListView');
	userList.setOptions({ selectable: false });
}

/**
 * 사용자 삭제 수행
 */
function deleteUser() {
	const userId = $('#userId').val();

	$.ajax({
		async: true,
		type: 'DELETE',
		url: `/api/user`,
		data: { 'user': userId }
	}).done(function() {
		alert('사용자 ' + userId +  '를 삭제했습니다');

		if(userId == parent.$.session.get('user-id')) {
			alert('현재 로그인한 ID가 삭제되었습니다. 자동 로그아웃됩니다');
			$.ajax({
				async: false,
				type: 'POST',
				url: '/logout'
			}).always(function() {
				$.session.clear();
				parent.location.reload(true);
			});
		}
	}).fail(function(xhr) {
		alert('[' + xhr.responseText + '] 사용자 삭제에 실패했습니다');
	}).always(function() {
		userListReady();
		userInfoReady();
		unloadTreeView();
		alarmConditionReady();
		userControlButtonReady();

		g_list_view_dataSource.read();
	});
}

/**
 * 사용자 정보 저장
 * by shkoh 20180416: g_isInsertMode 플래그에 따라서 추가 / 수정 여부 판단
 */
function saveUserInfo() {
	const user_info = ExportUserInfo();

	if(user_info.userId == '') { alert('사용자 ID는 필수 항목 입니다.'); return; }
	if(user_info.userName == '') { alert('사용자명은 필수 항목 입니다.'); return; }
	if(user_info.userLevel == null || user_info.userLevel == '') { alert('사용자 권한은 반드시 선택되어야 합니다.'); return; }
	if(user_info.userPw == '') { alert('사용자 패스워드는 필수 항목 입니다.'); return; }
	// by shkoh 20231106: 시작그룹도 필수항목으로 지정한다
	if(user_info.userStartGroupId === undefined) {
		alert('시작그룹은 필수 항목입니다. 반드시 지정해주세요');
		return;
	}

	$.ajax({
		async: true,
		type: 'POST',
		dataType: 'json',
		url: '/api/user/set',
		data: {
			mode: g_isInsertMode ? 'insert' : 'update',
			data: JSON.stringify(user_info)
		}
	}).fail(function(xhr) {
		alert('[' + xhr.responseText + '] 계정 ' + user_info.userId + (g_isInsertMode ? ' 추가' : ' 수정') + '에  실패했습니다');
	}).done(function() {
		// by shkoh 20180417: 사용자 정보 저장에 성공한 후에 then 명령어 수행
		// by shkoh 20180417: 사용자 정보 저장 후에는 알람 발생 설비 내용을 저장함
		saveUserAlarmEquipmentInfo();
	});
}
/***************************************************************************************************************/
/* by shkoh 20181115: User List End                                                                            */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181115: User Info UI Start                                                                       */
/***************************************************************************************************************/
/**
 * 사용자 기본정보 내역 초기화
 */
function initUserInfo() {
	userInfoReady();

	$('#userSelectButtonForStartGroup').on('click', function() {
		$("#modalDialogTree").modal({ keyboard: false, show: true });
	});

	$('#modalDialogTree').on('show.bs.modal', function(e) {
		const start_group_id = $('#userStartGroup').attr('data');

        g_modal_tree = new GroupTreeView('#modal-tree', start_group_id);
		g_modal_tree.CreateGroupTree();
	});
	
	$('#modalDialogTree').on('hide.bs.modal', function(e) {
        if(g_modal_tree != undefined) {
            g_modal_tree.Destroy();
            g_modal_tree = undefined;
		}
	});

	$('#btn-modal-tree-link').on('click', function() {
		const modal_tree_node = g_modal_tree.GetCurrentNode();
		if(modal_tree_node == undefined) {
			alert('시작 그룹 선택 설정과정에서 문제가 발생되었습니다. 재시도 바랍니다');
			return;
		};

		const start_group_id = modal_tree_node.id.substr(2);
		const start_group_name = modal_tree_node.name;

		if($('#userStartGroup').attr('data') != start_group_id) {
			$('#userStartGroup').attr('data', start_group_id);
			$('#userStartGroup').val(start_group_name);

			if(!g_isInsertMode) {
				alert('시작 그룹이 변경되었습니다. 변경된 시작 그룹 알람 발생 설비를 새로 설정해야 합니다');
			}

			if(g_tree) {
				unloadTreeView();
			}

			loadTreeView($('#userId').val(), start_group_id);
		}

		$("#modalDialogTree").modal('hide');
	});
	
	// by shkoh 20180423: Modal 페이지의 설비Tree에서 스크롤바 추가
    $('#modalDialogTree .modal-dialog .modal-content .modal-body').mCustomScrollbar({
        theme: 'minimal',
        axis: 'y',
        scrollbarPosition: 'outside'
    });
}

/**
 * 기본 상황 시 사용자 기본정보 정의
 */
function userInfoReady() {
	// by shkoh 20181115: 해제 시에는 작성된 기본정보들을 모두 공란으로 만듬
	$('input:not(:checkbox)[id*="user"]').val('');
	$('select[id*="user"]').val('');
	$('textarea[id*="user"]').val('');

	// by shkoh 20181115: 시작 그룹 정보도 초기화
	$('#userStartGroup').removeAttr('data');

	$('#userId').attr('disabled', 'disabled');
	$('#userPw').attr('disabled', 'disabled');
	$('#userName').attr('disabled', 'disabled');
	$('#userLevel').attr('disabled', 'disabled');
	$('#userStartGroup').attr('disabled', 'disabled');
	$('#userSelectButtonForStartGroup').attr('disabled', 'disabled');
	$('#userMobile').attr('disabled', 'disabled');
	$('#userEmail').attr('disabled', 'disabled');
	$('#userDept').attr('disabled', 'disabled');
	$('#userMemo').attr('disabled', 'disabled');
}

/**
 * 사용자 추가 상황에서의 기본정보 정의
 */
function userInfoInsert() {
	loadUserLevel().then(function() {
		// by shkoh 20181115: Insert 상황에서는 본인 등급의 권한은 제외함
		$('#userLevel > [value="' + g_user_grade + '"]').remove();
		
		// by shkoh 20181115: Admin에서 사용자 추가 시 권한은 무조건 USER로 설정함
		if(g_user_grade == 'USR00') {
			$('#userLevel').removeAttr('disabled');
		} else if(g_user_grade == 'USR01') {
			$('#userLevel').val('USR02');
		}
	});

	$('#userId').removeAttr('disabled');
	$('#userPw').removeAttr('disabled');
	$('#userName').removeAttr('disabled');
	
	$('#userStartGroup').removeAttr('disabled');
	$('#userSelectButtonForStartGroup').removeAttr('disabled');
	$('#userMobile').removeAttr('disabled');
	$('#userEmail').removeAttr('disabled');
	$('#userDept').removeAttr('disabled');
	$('#userMemo').removeAttr('disabled');
}

/**
 * 사용자 선택 상황에서의 기본정보 정의
 */
function userInfoSelect() {
	$('#userPw').removeAttr('disabled');
	$('#userName').removeAttr('disabled');

	// by shkoh 20181115: 로그인 사용자가 SUPER ADMIN 등급이며, 선택한 등급이 ADMIN 이하인 경우에만 등급조정이 가능함. 그 외의 경우는 등급조정 할 필요가 없음
	if(g_user_grade == 'USR00' && g_selector.grade > 'USR00') {
		$('#userLevel').removeAttr('disabled');
	} else {
		$('#userLevel').attr('disabled', 'disabeld');
	}

	if(g_user_grade < 'USR02') {
		$('#userStartGroup').removeAttr('disabled');
		$('#userSelectButtonForStartGroup').removeAttr('disabled');
	} else {
		$('#userStartGroup').attr('disabled', 'disabeld');
		$('#userSelectButtonForStartGroup').attr('disabled', 'disabeld');
	}
	
	$('#userMobile').removeAttr('disabled');
	$('#userEmail').removeAttr('disabled');
	$('#userDept').removeAttr('disabled');
	$('#userMemo').removeAttr('disabled');
}

/**
 * 사용자권한 등급 콤보박스 생성
 */
function loadUserLevel() {
	return new Promise(function(resovle, reject) {
		$("#userLevel").empty();
		$("#userLevel").append("<option value=''>...</option>");

		$.ajax({
			async: true,
			type: 'GET',
			dataType: 'json',
			url: `/api/user/grade`
		}).done(function(grades) {
			grades.forEach(function(item) {
				$("#userLevel").append("<option value='" + item.id + "'>" + item.name + "</option>");
			});
		}).fail(function(err_code) {
			console.error(err_code);
			alert('설정 가능한 사용자 등급을 가져오는데 실패했습니다');
		}).always(function() {
			resovle();
		});
	});
}

/**
 * 사용자 정보 입력
 * 
 * @param {JSON} user_info 사용자 정보
 */
function fillUserInfo(user_info) {
	$('#userId').val(user_info.userId);
	$('#userPw').val(user_info.userPw);
	$('#userName').val(user_info.userName);
	
	// by shkoh 20181115: 사용자권한은 선택한 계정마다 리스트를 새로 불어와야함으로 새로 불러온 후에 해당 값을 적용함
	loadUserLevel().then(function() {
		// by shkoh 20181115: SUPER ADMIN으로 운영 중에는 선택한 사용자의 권한에서 해당 권한을 볼 수 없도록 함
		if(g_user_grade < user_info.userLevel) {
			$('#userLevel > [value="' + g_user_grade + '"]').remove();
		}
		$('#userLevel').val(user_info.userLevel);
	});
	
	$('#userPhone').val(user_info.userPhone);
	$('#userMobile').val(user_info.userMobile);
	$('#userEmail').val(user_info.userEmail);
	$('#userDept').val(user_info.userDept);
	$('#userMemo').val(user_info.userMemo);
	$('#userStartGroup').attr('data', user_info.startGroupId);
	$('#userStartGroup').val(user_info.startGroupName);
}

/**
 * 사용자 정보를 내보냄
 * 
 * @return {JSON}
 */
function ExportUserInfo() {
	const userId = $("#userId").val();
	const userName = $("#userName").val();
	const userPw = $("#userPw").val();
	const userLevel = $("#userLevel").val();
	const userMobile = $("#userMobile").val();
	const userEmail = $("#userEmail").val();
	const userDept = $("#userDept").val();
	const userMemo = $("#userMemo").val();
	const userStartGroupId = $('#userStartGroup').attr('data');
	let thresholdAlarmVal = String(g_thresholdAlarmCount);
	let communicationAlarmVal = String(g_communicationAlarmCount);

	const alarmType =
	($('#AlarmTypePopup').hasClass('active') ? 'Y' : 'N') +
	($('#AlarmTypeSMS').hasClass('active') ? 'Y' : 'N') +
	($('#AlarmTypeEmail').hasClass('active') ? 'Y' : 'N');
	
	const alarmRequirement = thresholdAlarmVal + communicationAlarmVal;

	const alarmWeek =
	($('#AlarmWeekMon').hasClass('active') ? 'Y' : 'N') +
	($('#AlarmWeekTue').hasClass('active') ? 'Y' : 'N') +
	($('#AlarmWeekWed').hasClass('active') ? 'Y' : 'N') +
	($('#AlarmWeekThu').hasClass('active') ? 'Y' : 'N') +
	($('#AlarmWeekFri').hasClass('active') ? 'Y' : 'N') +
	($('#AlarmWeekSat').hasClass('active') ? 'Y' : 'N') +
	($('#AlarmWeekSun').hasClass('active') ? 'Y' : 'N');

	let alarmHour = '';
	for(let idx = 0; idx < 24; idx++) {
		alarmHour += ($('#AlarmHour' + idx.toString()).hasClass('active') ? 'Y' : 'N');
	}

	return {
		userId: userId,
		userName: userName,
		userPw: userPw,
		userLevel: userLevel,				
		userMobile: userMobile,
		userEmail: userEmail,
		userDept: userDept,
		userMemo: userMemo,
		alarmType: alarmType,
		alarmRequirement: alarmRequirement,
		alarmWeek: alarmWeek,
		alarmHour: alarmHour,
		userStartGroupId: userStartGroupId
	}
}
/***************************************************************************************************************/
/* by shkoh 20181115: User Info UI End                                                                         */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181115: Alarm Tree UI Start                                                                      */
/***************************************************************************************************************/
/**
 * 해당 계정이 적용된 Tree View를 생성
 * by shkoh 20180424: 사용자 계정이 변경될 때마다 TreeView를 생성
 * 
 * @param {String} user_id 사용자 ID
 * @param {Number} start_group_id 시작 그룹 ID
 */
// function loadTreeView(user_id) {
// 	if(g_tree !== undefined) return;
// 	g_tree = new TreeView('#group-equip-tree', user_id);
// 	g_tree.Create();
// }
function loadTreeView(user_id, start_group_id) {
	if(g_tree !== undefined) return;
	g_tree = new TreeView('#group-equip-tree', { user_id, start_group_id });
	g_tree.Create();
}

/**
 * 생성된 트리 해제
 */
function unloadTreeView() {
	if(g_tree != undefined) {
		g_tree.Destroy();
		g_tree = undefined;
	}
}

/**
 * 사용자별 알람 발생설비 저장
 */
function saveUserAlarmEquipmentInfo() {
	if(g_tree == undefined) return;
	let equip_ids = [];

	g_tree.GetCheckedNodes().forEach(function(node) {
		if(node.id.substr(0, 1) == 'E') {
			equip_ids.push(node.id.substr(2));
		}
	});

	$.ajax({
		async: true,
		type: 'POST',
		dataType: 'json',
		url: `/api/user/alarmequipments`,
		data: {
			user_id: $("#userId").val(),
			ids: JSON.stringify(equip_ids)
		}
	}).fail(function(xhr) {
		alert('[' + xhr.responseText + '] 사용자 알람 발생설비 저장에 실패했습니다');
	}).done(function() {
		// by shkoh 20180423: saveUserInfo(), saveUserAlarmEquipmentInfo() 모두 성공하였다면,
		alert('User ID: ' + $("#userId").val() + ' 정보 저장이 완료됐습니다');

		if($("#userId").val() == parent.$.session.get('user-id')) {
			const current_grade = parent.$.session.get('user-grade');
			const changed_grade = $('#userLevel').val();
			if(current_grade < changed_grade) {
				alert('로그인 된 ID의 권한이 낮은 단계로 변경되어 자동 로그아웃 됩니다');
				$.ajax({
					async: false,
					type: 'POST',
					url: '/logout'
				}).always(function() {
					$.session.clear();
					parent.location.reload(true);
				});
			}

			parent.getSessionInfoAndLoadViewer(false);
		}

		userListReady();
		userInfoReady();
		unloadTreeView();
		alarmConditionReady();
		userControlButtonReady();		
	}).always(function() {
		g_isInsertMode = false;
		g_list_view_dataSource.read();
	});
}
/***************************************************************************************************************/
/* by shkoh 20181115: Alarm Tree UI End                                                                        */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181115: Alarm Condition UI Start                                                                 */
/***************************************************************************************************************/
/**
 * 알람 발생조건을 초기화함
 */
function initAlarmCondition() {
	// by shkoh 20181115: 알람 발생조건의 툴팁 사용 정의
	$('[data-toggle="tooltip"]').tooltip({
		container: 'body'
	});

	alarmConditionReady();

	$('#alarm_type').on('click', function() { alarmOnOff('.alarmType') });
	$('#alarm_requirement').on('click', function() { alarmOnOff('.alarmRequirement') });
	$('#alarm_week').on('click', function() { alarmOnOff('.alarmWeek') });
	$('#alarm_hour').on('click', function() { alarmOnOff('.alarmHour') });
}

/**
 * 기본 상황에서의 알람 발생조건 UI 설정
 */
function alarmConditionReady() {
	$('.alarmType').attr('disabled', 'disabled');
	$('.alarm-legend').attr('disabled', 'disabled');
	$('.alarm-legend').css('color','#666666');
	$("#alarm-minor").css('backgroundColor', 'transparent');
	$("#alarm-major").css('backgroundColor', 'transparent');
	$("#alarm-critical").css('backgroundColor', 'transparent');
	$("#alarm-noresponse").css('backgroundColor', 'transparent');
	$("#alarm-badcommunication").css('backgroundColor', 'transparent');
	$('.btn-backmove').attr('disabled', 'disabled');
	$('.btn-nextmove').attr('disabled', 'disabled');
	$('.alarmWeek').attr('disabled', 'disabled');
	$('.alarmHour').attr('disabled', 'disabled');

	$('input:checkbox').parent().removeClass('active');
}

/**
 * 설정 시 알람 발생조건 UI 설정
 */
function alarmConditionSet() {
	$('.alarmType').removeAttr('disabled');
	$('.alarm-legend').removeAttr('disabled');
	$('.alarm-legend').css('color','#f3f3f3');
	$('.btn-backmove').removeAttr('disabled');
	$('.btn-nextmove').removeAttr('disabled');
	$('.alarmWeek').removeAttr('disabled');
	$('.alarmHour').removeAttr('disabled');
}

/**
 * 알람 발생조건 입력
 * 
 * @param {JSON} user_info 사용자 정보
 */
function fillAlarmCondition(user_info) {
	setAlarmRequirement(user_info.ThresholdAlarmRequirement, user_info.CommunicationAlarmRequirement);

	user_info.AlarmTypePopup == 'Y' ? $('#AlarmTypePopup').addClass('active') : $('#AlarmTypePopup').removeClass('active');
	user_info.AlarmTypeSMS == 'Y' ? $('#AlarmTypeSMS').addClass('active') : $('#AlarmTypeSMS').removeClass('active');
	user_info.AlarmTypeEmail == 'Y' ? $('#AlarmTypeEmail').addClass('active') : $('#AlarmTypeEmail').removeClass('active');
	
	user_info.AlarmWeekMon == 'Y' ? $('#AlarmWeekMon').addClass('active') : $('#AlarmWeekMon').removeClass('active');
	user_info.AlarmWeekTue == 'Y' ? $('#AlarmWeekTue').addClass('active') : $('#AlarmWeekTue').removeClass('active');
	user_info.AlarmWeekWed == 'Y' ? $('#AlarmWeekWed').addClass('active') : $('#AlarmWeekWed').removeClass('active');
	user_info.AlarmWeekThu == 'Y' ? $('#AlarmWeekThu').addClass('active') : $('#AlarmWeekThu').removeClass('active');
	user_info.AlarmWeekFri == 'Y' ? $('#AlarmWeekFri').addClass('active') : $('#AlarmWeekFri').removeClass('active');
	user_info.AlarmWeekSat == 'Y' ? $('#AlarmWeekSat').addClass('active') : $('#AlarmWeekSat').removeClass('active');
	user_info.AlarmWeekSun == 'Y' ? $('#AlarmWeekSun').addClass('active') : $('#AlarmWeekSun').removeClass('active');
	
	for(var idx = 0; idx < 24; idx++) {
		user_info['AlarmHour' + idx.toString()] == 'Y' ? $('#AlarmHour' + idx.toString()).addClass('active') : $("#AlarmHour" + idx.toString()).removeClass('active');
	}
}

/**
 * 알람 on/off 개수를 체크하여 해당 클래스명과 동일한 element들을 전체선택하거나 해제를 수행하는 함수
 * 
 * @param {String} mode JQuery Selector. 클래스명
 */
function alarmOnOff(mode) {
	// by shkoh 20181114: mode명을 가진 클래스 element가 사용 중이 아니라면 더 이상 진행하지 않음
	if($(mode + '[disabled]').length > 0) return;

	// by shkoh 20181115: mode 클래스명을 가진 전체 element 개수와 active(on, 활성화)된 element 개수 검색
	const total_cnt = $(mode).length;
	const active_cnt = $(mode + '.active').length;

	// by wchoi 20190129: 알람요건 이동 아이콘의 disabled 상태
	let backmoveStatus = $('.btn-backmove').attr('disabled');
	let nextmoveStatus = $('.btn-nextmove').attr('disabled');

	// by shkoh 20181115: mode 클래스명을 가진 전체 수와 active의 수가 동일하면 전체 선택된 상황임으로 모두 비활성화함
	// by shkoh 20181115: 그 외의 경우에는 전체 선택함
	if(total_cnt == active_cnt) {
		$(mode).removeClass('active');
		// by wchoi 20190129: 알람요건의 전체 선택하거나 해제를 수행
		if(mode == '.alarmRequirement' && backmoveStatus == undefined && nextmoveStatus == undefined) {
			$('.btn-backmove').removeAttr('disabled');
			$('.btn-nextmove').removeAttr('disabled');
			$("#alarm-minor").css('backgroundColor', 'transparent');
			$("#alarm-major").css('backgroundColor', 'transparent');
			$("#alarm-critical").css('backgroundColor', 'transparent');
			$("#alarm-noresponse").css('backgroundColor', 'transparent');
			$("#alarm-badcommunication").css('backgroundColor', 'transparent');

			g_thresholdAlarmCount = 9;
			g_communicationAlarmCount = 9;
		}
	} else {
		$(mode).addClass('active');
		// by wchoi 20190129: 알람요건의 전체 선택하거나 해제를 수행
		if(mode == '.alarmRequirement' && backmoveStatus == undefined && nextmoveStatus == undefined) {
			$('.btn-backmove').removeAttr('disabled');
			$('.btn-nextmove').removeAttr('disabled');
			$("#alarm-minor").css('backgroundColor', '#ff9c01');
			$("#alarm-major").css('backgroundColor', '#fe6102');
			$("#alarm-critical").css('backgroundColor', '#de0303');
			$("#alarm-noresponse").css('backgroundColor', '#511a81');
			$("#alarm-badcommunication").css('backgroundColor', '#000000');
			
			g_thresholdAlarmCount = 1;
			g_communicationAlarmCount = 4;
		}
	}
}
/***************************************************************************************************************/
/* by shkoh 20181115: Alarm Condition UI End                                                                   */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181115: User CRUD Button Control Start                                                           */
/***************************************************************************************************************/
/**
 * 사용자 추가/삭제/저장/취소 버튼을 초기화
 */
function initUserControlButton() {
	userControlButtonReady();
}

/**
 * 기본 상황에서의 사용자 추가/삭제/저장/취소 버튼의 사용 여부 정의
 */
function userControlButtonReady() {
	if(g_user_grade < 'USR02') {
		$('#insertUser').removeAttr('disabled');
	} else {
		$('#insertUser').attr('disabled', 'disabled');
	}

	$('#deleteUser').attr('disabled', 'disabled');
	$('#saveUserConfig').attr('disabled', 'disabled');
	$('#cancelUserConfig').attr('disabled', 'disabled');
}

/**
 * 사용자 추가 상황에서의 사용자 추가/삭제/저장/취소 버튼의 사용 여부 정의
 */
function userControlButtonInsert() {
	$('#insertUser').attr('disabled', 'disabled');
	$('#deleteUser').attr('disabled', 'disabled');
	$('#saveUserConfig').removeAttr('disabled');
	$('#cancelUserConfig').removeAttr('disabled');
}

/**
 * 사용자 선택 상황에서의 사용자 추가/삭제/저장/취소 버튼의 사용 여부 정의
 */
function userControlButtonSelect() {
	$('#insertUser').attr('disabled', 'disabled');

	if(g_user_grade < g_selector.grade) {
		$('#deleteUser').removeAttr('disabled');
	} else {
		$('#deleteUser').attr('disabled', 'disabled');
	}
	
	$('#saveUserConfig').removeAttr('disabled');
	$('#cancelUserConfig').removeAttr('disabled');
}
/***************************************************************************************************************/
/* by shkoh 20181115: User CRUD Button Control End                                                             */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by wchoi 20191128: AlarmRequirement setting start                                                     	   */
/***************************************************************************************************************/
/**
 * 각 user의 db로부터 알람요건 설정 상태값을 받아 알람요건의 상태를 설정해주는 함수
 * 
 * @param {String} ThresholdAlarm 임계치 알람 설정 상태
 * @param {String} CommunicationAlarm 통신상태 알람 설정 상태
 */
function setAlarmRequirement(ThresholdAlarm, CommunicationAlarm) {
	let ThresholdalarmVal = parseInt(ThresholdAlarm);
	let CommunicationAlarmVal = parseInt(CommunicationAlarm);

	switch(ThresholdalarmVal) {
		case 1:
			$("#alarm-minor").css('backgroundColor', '#ff9c01');
			$("#alarm-major").css('backgroundColor', '#fe6102');
			$("#alarm-critical").css('backgroundColor', '#de0303');
			g_thresholdAlarmCount = 1;
			break;
		case 2:
			$("#alarm-minor").css('backgroundColor', 'transparent');
			$("#alarm-major").css('backgroundColor', '#fe6102');
			$("#alarm-critical").css('backgroundColor', '#de0303');
			g_thresholdAlarmCount = 2;
			break;
		case 3:
			$("#alarm-minor").css('backgroundColor', 'transparent');
			$("#alarm-major").css('backgroundColor', 'transparent');
			$("#alarm-critical").css('backgroundColor', '#de0303');
			g_thresholdAlarmCount = 3;
			break;
		case 9:
			$("#alarm-minor").css('backgroundColor', 'transparent');
			$("#alarm-major").css('backgroundColor', 'transparent');
			$("#alarm-critical").css('backgroundColor', 'transparent');
			g_thresholdAlarmCount = 9;
			break;
	}

	switch(CommunicationAlarmVal) {
		case 4:
			$("#alarm-noresponse").css('backgroundColor', '#511a81');
			$("#alarm-badcommunication").css('backgroundColor', '#000000');
			g_communicationAlarmCount = 4;
			break;
		case 5:
			$("#alarm-noresponse").css('backgroundColor', 'transparent');
			$("#alarm-badcommunication").css('backgroundColor', '#000000');
			g_communicationAlarmCount = 5;
			break;
		case 9:
			$("#alarm-noresponse").css('backgroundColor', 'transparent');
			$("#alarm-badcommunication").css('backgroundColor', 'transparent');
			g_communicationAlarmCount = 9;
		break;
	}
}

/**
 * 알람요건 설정 화살표 버튼 클릭 시 알람요건의 색을 설정해주는 이벤트 함수
 */
function setAlarmRequirementColor() {
	$('#ThresholdBackMove').on('click', function() {
		let backmoveStatus = $('.btn-backmove').attr('disabled');

		if(backmoveStatus == undefined) {
			if(g_thresholdAlarmCount == 1) {
				$("#alarm-minor").css('backgroundColor', 'transparent');
				$("#alarm-major").css('backgroundColor', 'transparent');
				$("#alarm-critical").css('backgroundColor', 'transparent');
				g_thresholdAlarmCount = 9;
			} else if(g_thresholdAlarmCount == 2) {
				$("#alarm-minor").css('backgroundColor', '#ff9c01');
				g_thresholdAlarmCount = 1;
			} else if(g_thresholdAlarmCount == 3) {
				$("#alarm-major").css('backgroundColor', '#fe6102');
				g_thresholdAlarmCount = 2;
			} else if(g_thresholdAlarmCount == 9) {
				$("#alarm-critical").css('backgroundColor', '#de0303');
				g_thresholdAlarmCount = 3;
			} if(g_thresholdAlarmCount == 0) {
				$("#alarm-critical").css('backgroundColor', '#de0303');
				g_thresholdAlarmCount = 3;
			}
		}
	});

	$('#ThresholdNextMove').on('click', function() {
		let nextmoveStatus = $('.btn-nextmove').attr('disabled');

		if(nextmoveStatus == undefined) {
			if(g_thresholdAlarmCount == 1) {
				$("#alarm-minor").css('backgroundColor', 'transparent');
				g_thresholdAlarmCount = 2;
			} else if(g_thresholdAlarmCount == 2) {
				$("#alarm-major").css('backgroundColor', 'transparent');
				g_thresholdAlarmCount = 3;
			} else if(g_thresholdAlarmCount == 3) {
				$("#alarm-critical").css('backgroundColor', 'transparent');
				g_thresholdAlarmCount = 9;
			} else if(g_thresholdAlarmCount == 9) {
				$("#alarm-minor").css('backgroundColor', '#ff9c01');
				$("#alarm-major").css('backgroundColor', '#fe6102');
				$("#alarm-critical").css('backgroundColor', '#de0303');
				g_thresholdAlarmCount = 1;
			} else if(g_thresholdAlarmCount == 0) {
				$("#alarm-minor").css('backgroundColor', '#ff9c01');
				$("#alarm-major").css('backgroundColor', '#fe6102');
				$("#alarm-critical").css('backgroundColor', '#de0303');
				g_thresholdAlarmCount = 1;
			}
		}
	});

	$('#CommunicationBackMove').on('click', function() {
		let backmoveStatus = $('.btn-backmove').attr('disabled');

		if(backmoveStatus == undefined) {
			if(g_communicationAlarmCount == 4) {
				$("#alarm-noresponse").css('backgroundColor', 'transparent');
				$("#alarm-badcommunication").css('backgroundColor', 'transparent');
				g_communicationAlarmCount = 9;
			} else if(g_communicationAlarmCount == 5) {
				$("#alarm-noresponse").css('backgroundColor', '#511a81');
				g_communicationAlarmCount = 4;
			} else if(g_communicationAlarmCount == 9) {
				$("#alarm-badcommunication").css('backgroundColor', '#000000');
				g_communicationAlarmCount = 5;
			} else if(g_communicationAlarmCount == 0) {
				$("#alarm-badcommunication").css('backgroundColor', '#000000');
				g_communicationAlarmCount = 5;
			}
		}
	});

	$('#CommunicationNextMove').on('click', function() {
		let nextmoveStatus = $('.btn-nextmove').attr('disabled');

		if(nextmoveStatus == undefined) {
			if(g_communicationAlarmCount == 4) {
				$("#alarm-noresponse").css('backgroundColor', 'transparent');
				g_communicationAlarmCount = 5;
			} else if(g_communicationAlarmCount == 5) {
				$("#alarm-badcommunication").css('backgroundColor', 'transparent');
				g_communicationAlarmCount = 9;
			} else if(g_communicationAlarmCount == 9) {
				$("#alarm-noresponse").css('backgroundColor', '#511a81');
				$("#alarm-badcommunication").css('backgroundColor', '#000000');
				g_communicationAlarmCount = 4;
			} else if(g_communicationAlarmCount == 0) {
				$("#alarm-noresponse").css('backgroundColor', '#511a81');
				$("#alarm-badcommunication").css('backgroundColor', '#000000');
				g_communicationAlarmCount = 4;
			}
		}
	});
}

/***************************************************************************************************************/
/* by wchoi 20191128: AlarmRequirement setting end                                                  	   	   */
/***************************************************************************************************************/