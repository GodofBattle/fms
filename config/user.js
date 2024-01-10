/**
 * by shkoh 20200512
 * 1. 현재 접속한 사용자에 대한 정보 클래스
 * 2. 웹 세션(req.session)에 해당 객체를 등록하여 사용              
 * 
 * @param {Boolean} isAuth 로그인 성공여부
 * @param {String} id 사용자 아이디
 * @param {Date} loginDateTime 로그인이 성공한 시점
 */

const CurrentUser = function(isAuth, id, loginDateTime) {
    this.isAuth = isAuth;
    this.id = id;
    this.loginDateTime = (loginDateTime === undefined || loginDateTime === null) ? new Date() : loginDateTime;
    this.currentRequestTime = new Date();
    this.user_name = '';
    this.grade = '';
    this.basic_group_id = undefined;
}

CurrentUser.users = [];

module.exports = CurrentUser;