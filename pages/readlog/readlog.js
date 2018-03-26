
import config from '../../utils/config.js'
var Api = require('../../utils/api.js');
var util = require('../../utils/util.js');
var auth = require('../../utils/auth.js');
var WxParse = require('../../wxParse/wxParse.js');
var wxApi = require('../../utils/wxApi.js')
var wxRequest = require('../../utils/wxRequest.js');
var app = getApp();
Page({
  data: {
    userInfo: {},
    readLogs: [],
    topBarItems: [
      { id: '1', name: '浏览', selected: true },
      { id: '2', name: '评论', selected: false},
      { id: '3', name: '点赞', selected: false },
      { id: '4', name: '订阅', selected: false }
    ],
    tab: '1',
    showerror: "none",
    shownodata:"none",
    subscription:""  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {  
    var self = this;
    if (!app.globalData.isGetOpenid) {
        self.getUserInfo();        
    }else{
      self.setData({
        userInfo: app.globalData.userInfo
      });
    } 
    self.fetchPostsData('1'); 
    wx.setNavigationBarTitle({
      title: '我的记录',
      success: function (res) {
        // success
      }
    });
  },
  gotoAbout: function () {
    wx.redirectTo({
      url: '../about/about'
    })
  },

  // 跳转至查看文章详情
  redictDetail: function (e) {
    var id = e.currentTarget.id;
    var itemtype = e.currentTarget.dataset.itemtype;
    var url ="";
    if (itemtype=="1"){
      url = '../list/list?categoryID=' + id;
    }else{
      url = '../detail/detail?id=' + id;
    }     
    wx.navigateTo({
      url: url
    })
  },
  onTapTag: function (e) {
    var self = this;
    var tab = e.currentTarget.id;
    var topBarItems = self.data.topBarItems;
      // 切换topBarItem 
    for (var i = 0; i < topBarItems.length; i++) {
      if (tab == topBarItems[i].id) {
        topBarItems[i].selected = true;
      } else {
        topBarItems[i].selected = false;
      }
    }
    self.setData({
      topBarItems: topBarItems,
      tab: tab
    })
    if (tab !== 0) {
      this.fetchPostsData(tab);
    } else {
      this.fetchPostsData("1");
    }
  },
  onShareAppMessage: function () {
    var title = "分享我在“" + config.getWebsiteName + "浏览、评论、点赞的文章";
    var path = "pages/readlog/readlog";
    return {
      title: title,
      path: path,
      success: function (res) {
        wx.showToast({
          title: '分享成功',
          icon:'success',
          duration: 900
        })
      },
      fail: function (res) {
        wx.showToast({
          title: '分享失败',
          icon:'none',
        })
      }
    }
  },
  fetchPostsData: function (tab) {
    self = this;
    self.setData({
      showerror: 'none',
      shownodata:'none'
    }); 
    var count =0;
    if (tab == '1'){
      self.setData({
        readLogs: (wx.getStorageSync('readLogs') || []).map(function (log) {
          count++;
          return log;
        })
      });
      self.setData({
        userInfo: app.globalData.userInfo
      }); 
      if (count == 0) {
        self.setData({
          shownodata: 'block'
        });
      }     
    }else if (tab == '2'){
      self.setData({
        readLogs: []
      });
      if (app.globalData.isGetOpenid) {
        var openid = app.globalData.openid;
        var getMyCommentsPosts = wxRequest.getRequest(Api.getWeixinComment(openid));
        getMyCommentsPosts.then(response => {
          if (response.statusCode == 200) {
            self.setData({
              readLogs: self.data.readLogs.concat(response.data.data.map(function (item) {
                count++;
                item[0] = item.post_id;
                item[1] = item.post_title;
                return item;
              }))
            });
            self.setData({
              userInfo: app.globalData.userInfo
            });
            if (count == 0) {
              self.setData({
                shownodata: 'block'
              });
            }
          }else {
            self.setData({
              showerror: 'block'
            });
          }
        })
      }else{
        wxApi.userAuthorization();
      }          
    } else if (tab == '3') {
      this.setData({
        readLogs: []
      });
      if (app.globalData.isGetOpenid) {
        var openid = app.globalData.openid;
        var getMylikePosts = wxRequest.getRequest(Api.getMyLikeUrl(openid));
        getMylikePosts.then(response => {
          if (response.statusCode == 200) {
            this.setData({
              readLogs: self.data.readLogs.concat(response.data.data.map(function (item) {
                count++;
                item[0] = item.post_id;
                item[1] = item.post_title;
                item[2] = "0";
                return item;
              }))
            });
            self.setData({
              userInfo: app.globalData.userInfo
            }); 
            if (count == 0) {
              self.setData({
                shownodata: 'block'
              });
            } 
          }else {
            this.setData({
              showerror: 'block'
            });
          }
        })
      }else {
        wxApi.userAuthorization();
      }
    }else if (tab == '4') {
      self.setData({
        readLogs: []
      });
      if (app.globalData.isGetOpenid) {
        var openid = app.globalData.openid;
        var url = Api.getSubscription() + '?openid=' + app.globalData.openid;
        var getMysubPost = wxRequest.getRequest(url);
        var count=0;
        getMysubPost.then(response => {
          if (response.statusCode == 200) {
            var usermetaList = response.data.usermetaList;
            if (usermetaList){
              this.setData({
                readLogs: self.data.readLogs.concat(usermetaList.map(function (item) {
                  count++;
                  item[0] = item.ID;
                  item[1] = item.post_title;
                  item[2] = "0";
                  return item;
                }))
              });
            }        
            self.setData({
              userInfo: app.globalData.userInfo
            });
            if (count == 0) {
              self.setData({
                shownodata: 'block'
              });
            }
          }else {
            this.setData({
              showerror: 'block'
            });
          }
        })
      }else{
        wxApi.userAuthorization();
      } 
    }
  },
  confirm: function () {
    this.setData({
      'dialog.hidden': true,
      'dialog.title': '',
      'dialog.content': ''
    })
  },
  getUserInfo: function () {
    var self = this;
    var wxLogin = wxApi.wxLogin();
    var jscode = '';
    wxLogin().then(response => {
      jscode = response.code
      var wxGetUserInfo = wxApi.wxGetUserInfo()
      return wxGetUserInfo()
    })
            //获取用户信息
    .then(response => {
      console.log(response.userInfo);
      console.log("成功获取用户信息(公开信息)");
      app.globalData.userInfo = response.userInfo;
      app.globalData.isGetUserInfo = true;
      self.setData({
        userInfo: response.userInfo
      });
      var url = Api.getOpenidUrl();
      var data = {
        js_code: jscode,
        encryptedData: response.encryptedData,
        iv: response.iv,
        avatarUrl: response.userInfo.avatarUrl
      }
      var postOpenidRequest = wxRequest.postRequest(url, data);
      //获取openid
      postOpenidRequest.then(response => {
        if (response.data.status == '200') {
          app.globalData.openid = response.data.openid;
          app.globalData.isGetOpenid = true;
        }else {
          console.log(response.data.message);
        }
      })                
    }).catch(function (error) {
      console.log('error: ' + error.errMsg);
      wxApi.userAuthorization();
    })
  },
  getSubscription: function () {
    if (app.globalData.isGetOpenid) {
      var openid = app.globalData.openid;
      var url = Api.getSubscription() + '?openid=' + app.globalData.openid;
      var getMysub = wxRequest.getRequest(url);
      getMysub.then(response => {
        if (response.statusCode == 200 && response.data.status == '200') {
          var _subscription = response.data.substr;
          self.setData({
            subscription: _subscription
          });
        }                
      })
    }else {
      wxApi.userAuthorization();
    }
  } 
})