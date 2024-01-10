/**
 * by shkoh 2021.01.29
 * 
 * UbiGuard FMS 5.6 사이트에서 특정 고객사에 대한 커스텀 화면이 구현될 수 있음으로 관련 config 파일을 관리할 수 있도록 함
 * 
 * title: FMS에서 사용할 제목. UbiGuard FMS 5.0 등으로 제품명과 버전을 미리 정의함. 제목에 표기할 내용
 * site: 고객사 영문 약칭
 * start_url: 시작 페이지 ID, index.ejs 파일의 메뉴의 data 속성에서 정의됨
 * middle_text: 시작 페이지의 중간 메뉴 명칭, index.ejs 파일의 middle_text 속성에서 정의됨
 * end_text: 시작 페이지의 마지막 메뉴 명칭, 메뉴가 2단계인 경우에 사용, index.ejs 파일의 end_text 속성에서 정의됨
 * is_asset: 설비 설정 페이지에서 자산항목의 표시 여부. true / false로 구분
 * dashboard_host: 외부 대시보드 연동 시에 사용할 host 명(보통은 host ip)
 * is_encryption: 사용자 계정 및 데이터베이스 계정과 패스워드를 암호화하여 사용할지 여부. true, false
 * 
 * (예시)
 * 일반 --> site: undefined
 * 우리FIS --> site: 'wrfis'
 * 
 */

// by shkoh 20210129: default setting
// module.exports = {
//     title: `UbiGuard FMS 5.0`,
//     site: undefined,
//     start_url: `monitoring`,
//     middle_text: `모니터링`,
//     end_text: ``,
//     is_asset: false,
//     dashboard_host: '',
//     sub_site: ''
// };

// by shkoh 20210129: 우리FIS setting
// module.exports = {
//     title: `UbiGuard FMS 5.6`,
//     site: `wrfis`,
//     start_url: `wrfis`,
//     middle_text: `메인`,
//     end_text: ``,
//     is_asset: false,
//     dashboard_host: ''
//     sub_site: ''
// };

// by shkoh 20211201: 한국전력 대전 ICT센터 setting
// module.exports = {
//     title: `UbiGuard FMS 5.0`,
//     site: `kepco`,
//     start_url: `kepco`,
//     middle_text: `메인`,
//     end_text: ``,
//     is_asset: true,
//     dashboard_host: '150.218.10.3'
//     sub_site: ''
// };

// by shkoh 20220720: 대통령경호처 setting
// module.exports = {
//     title: `UbiGuard FMS 5.0`,
//     site: `pss`,
//     start_url: `pss_dashboard`,
//     middle_text: `대시보드`,
//     end_text: ``,
//     is_asset: false,
//     dashboard_host: ''
//     sub_site: ''
// };

// by shkoh 20221118: KISA 118 청사(가락) setting
// module.exports = {
//     title: `UbiGuard FMS 5.0`,
//     site: `kisa118`,
//     start_url: `monitoring`,
//     middle_text: `모니터링`,
//     end_text: ``,
//     is_asset: false,
//     dashboard_host: ''
//     sub_site: ''
// };

// by shkoh 20230116: 국가정보통신망 setting
// module.exports = {
//     title: `UbiGuard FMS 5.0`,
//     site: `knet`,
//     start_url: `monitoring`,
//     middle_text: `모니터링`,
//     end_text: ``,
//     is_asset: false,
//     dashboard_host: ''
//     sub_site: ''
// };

// by shkoh 20230504: 국방부통합데이터센터 setting
module.exports = {
    title: `UbiGuard FMS 5.0`,
    site: `didc`,
    start_url: `didc_dashboard`,
    middle_text: `모니터링`,
    end_text: `대시보드`,
    is_asset: false,
    dashboard_host: '',
    is_encryption: true,
    sub_site: 'didc2'
};