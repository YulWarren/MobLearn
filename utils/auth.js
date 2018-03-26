
var util = require('util.js');
var wxApi = require('wxApi.js')
var wxRequest = require('wxRequest.js')
var Api = require('api.js');
var app = getApp();
module.exports = {
    //获取用户信息和openid
  getUserInfo: function () {       
    var wxLogin = wxApi.wxLogin();
    var jscode = '';
    wxLogin().then(response => {
      jscode = response.code
      var wxGetUserInfo = wxApi.wxGetUserInfo()
      return wxGetUserInfo()
    })
            //获取用户信息
    .then(response => {
      app.globalData.userInfo = response.userInfo;
      app.globalData.isGetUserInfo = true;
      var url = Api.getOpenidUrl();
      var data = {
        js_code: jscode,
        encryptedData: response.encryptedData,
        iv: response.iv,
        avatarUrl: response.userInfo.avatarUrl,
        nickname: response.userInfo.nickName
      }
      var postOpenidRequest = wxRequest.postRequest(url, data);
                //获取openid
      postOpenidRequest.then(response => {
        if (response.data.status == '200') {
          app.globalData.openid = response.data.openid;
          app.globalData.isGetOpenid = true; 
        }
        else {
          console.log(response);
        }
      })               
    }).catch(function (error) {
      console.log('error: ' + error.errMsg);
    })
  }
}