//by MJ 2023.08.30 : URL 파라미터 가져오기
let rack_id = new URLSearchParams(location.search).get('id');
let rack_timer = undefined;

//by MJ 2023.09.11 : 배열로 처리(0 = equip_id, 1 = data_name )
let rack_id_data = rack_id.split(',');

//by MJ 2023.08.30 : 페이지 초기화 및 설정을 수행하는 함수들 호출
$(function() {
  getRackDetaInfo(rack_id_data);

  //by MJ 2023.11.23 : Promise가 성공된 후 setInterval() 메소드 5초마다 데이터 갱신
  loadSettingData(rack_id_data).then(function() {
    rack_timer = setInterval(function() {
      m_sensor_data_source.read();
      getRackDetaInfo(rack_id_data);
    }, 5000);
  })
  .catch((error) => {
    console.log('error:', error);
    alert('설비 세부정보를 조회하는데 에러가 발생했습니다.');
  });
});

//by MJ 2023.11.23 : 사용자가 팝업창 닫을때 타이머함수 작동 중지
$(window).on('unload', function() {
  if(rack_timer){
    clearInterval(rack_timer);
  }
})

//by MJ 2023.09.11 : rack info data
function getRackDetaInfo() {
    $.ajax({
      async: true,
      type: 'GET',
      dataType: 'json',
      cache: false,
      url: '/api/monitoring/equipment?id=' + rack_id_data[0]
    }).done(function(info) {
        $('#i-rack-data-name').text(rack_id_data[1] + ' - 설비 세부정보');
        $('#i-rack-equip-name').text(info.name);
        $('#i-rack-equip-updatetime').text(info.update_time);
    }).fail(function(err) {
        console.log(err);
    });
}

//by MJ 2023.08.30 :  load Data Start
function loadSettingData() {
  return new Promise(function(resovle, reject) {
    m_sensor_data_source = new kendo.data.DataSource ({
      transport: {
        read: {
          type: 'GET',
          dataType: 'json',
          cache: true,
          url: '/api/monitoring/sensor?parent=' + rack_id_data[0]
        }
      },
      //by MJ 2023.11.23 : 변경된 데이터에 대한 서버 동기화 설정
      autoSync: true,
      //by MJ 2023.11.23 : 서버에 전달시, 여러 개의 데이터 변경사항을 개별(false) or 그룹(true) 형태인 전달 설정
      batch: true,
      schema: {
        model: {
          id: 'id',
          fields: {
            id: { type: 'number', editable: false, nullable: true },
            sensor_id: { type: 'number', editable: false, nullable: true },
            name: { type: 'string', editable: false },
            sensor_type: { type: 'string', editable: false },
            value: { type: 'string', editable: false },
            unit: { editable: false },
            event: { editable: false },
            level: { type: 'number', editable: false },
            sensor_comm_status: { type: 'number', editable: false },
            equipAvailable: { editable: false },
            equipLevel: { editable: false }
          }
        }
      }
    });

    $('#detail-rack-container-table').kendoGrid ({
        dataSource: m_sensor_data_source,
        noRecords: {
          template: 
            '<div style="display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; text-align: center;">' +
              '<div style="display: table-cell; text-align: center; vertical-align: middle;">' +
                  '<h4 style="text-align: center; font-weight: bold;">센서가 존재하지 않습니다</h4>' +
              '</div>' +
            '</div>'
        },
        scrollable: true,
        columns: [
          { field: 'id', width: 45, title: '순번', filterable: false, format: '{0:0}', attributes: { style:'text-align:center;' }},
          { field: 'name',
            title: '수집항목명',
            filterable: false,
            format: '{0:0}',
            attributes: { style:'text-align:center' },
          },
          {
            field: 'value',
            title: '값',
            filterable: false,
            sortable: false,
            attributes: { style: 'text-align:center' },
            template: function(e) {
              let star = '';
              if(e.sensor_comm_status == 4) star ='* ';
              return '<span class="sensor-detail-level_' + e.level + ' sensor-detail-level_' + e.event + '">' + star + e.value + '<span class="detail-unit">' + e.unit + '</span></span>';
            }
          }
        ],
      });
      resovle();
    });
  }