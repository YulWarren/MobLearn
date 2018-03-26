
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
    text: "Page topic",
    categoriesList: {},
    floatDisplay: "none"
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '专题学习',
      success: function (res) {
        // success
      }
    });
    wx.showLoading({
      title: '正在加载',
      mask: true,
    });
    setTimeout(function () {
      wx.hideLoading()
    }, 500)
    this.fetchCategoriesData();
  },
    //获取分类列表
  fetchCategoriesData: function () {
    var self = this;
    self.setData({
      categoriesList: []
    });
    var getCategoriesRequest = wxRequest.getRequest(Api.getCategories());
      getCategoriesRequest.then(response => {
        if (response.statusCode === 200) {
          self.setData({
            floatDisplay: "block",
            categoriesList: self.data.categoriesList.concat(response.data.map(function (item) {
              if (typeof (item.category_thumbnail_image) == "undefined" || item.category_thumbnail_image == "") {
                item.category_thumbnail_image = "../../images/website.png";
              }
              item.subimg = "subscription.png";
              return item;
            })),
          });
        }
        else {
          console.log(response);
        }
      })
      .then(res=>{
        if (!app.globalData.isGetOpenid) {
          self.getUserInfo();
        }
        else{
          setTimeout(function () {
            self.getSubscription();
          }, 500);
        }
      })
      .catch(function (response) {
        console.log(response);
      }).finally(function () {
      })
  },
  onShareAppMessage: function () {
    return {
      title: '分享“' + config.getWebsiteName + '”的专题栏目.',
      path: 'pages/topic/topic',
      success: function (res) {
        wx.showToast({
          title: ' 分享成功',
          icon: 'success',
          duration: 900,
        })
      },
      fail: function (res) {
        wx.showToast({
          title: ' 分享失败',
          icon: 'none'
        })
      }
    }
  },    
  getUserInfo: function () {
    var self = this;
    var wxLogin = wxApi.wxLogin();
    var jscode = '';
    wxLogin().then(response => {
      jscode = response.code
        var wxGetUserInfo = wxApi.wxGetUserInfo();
          return wxGetUserInfo()
        })
        .then(response => {
          app.globalData.userInfo = response.userInfo;
          app.globalData.isGetUserInfo = true;
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
              setTimeout(function () {                            
                self.getSubscription();
              }, 500);        
            }
            else {
              console.log(response.data.message);
            }
          })
        })
        .catch(function (error) {
          console.log('error: ' + error.errMsg);                
        })
  },
  getSubscription: function () {
    var self= this;
    if (app.globalData.isGetOpenid) {
      var url = Api.getSubscription() + '?openid=' + app.globalData.openid;
      var getSubscriptionRequest = wxRequest.getRequest(url);
      getSubscriptionRequest.then(res => {
        if (res.data.status == '200'){
          var catList = res.data.subscription;
          var categoriesList = self.data.categoriesList;
          var newCategoriesList = [];
          if (catList && categoriesList) {
            for (var i = 0; i < categoriesList.length; i++) {
              var subimg = "subscription.png";
              var subflag = "0";
              for (var j = 0; j < catList.length; j++) {
                if (categoriesList[i].id == catList[j]) {
                  subimg = "subscription-on.png";
                  subflag = "1";
                }
                var category_thumbnail_image = "";
                if (typeof (categoriesList[i].category_thumbnail_image) == "undefined" || categoriesList[i].category_thumbnail_image == "") {
                  category_thumbnail_image = "../../images/website.png";
                }
                else {
                  category_thumbnail_image = categoriesList[i].category_thumbnail_image;
                }
              }
              var cat = {
                "category_thumbnail_image": category_thumbnail_image,
                "description": categoriesList[i].description,
                "name": categoriesList[i].name,
                "id": categoriesList[i].id,
                "subimg": subimg,
                "subflag": subflag
              }
              newCategoriesList.push(cat);
            }
            if (newCategoriesList.length > 0) {
              self.setData({
                floatDisplay: "block",
                categoriesList: newCategoriesList
              });
            }
          }
        }
        else{
          console.log(res);
        }
      }).finally(function () {
        setTimeout(function () {
          wx.hideLoading();
        }, 500)
        wx.hideNavigationBarLoading();
      })
    }
  },
  postsub: function (e) {
    var self = this;
    if (!app.globalData.isGetOpenid) {
      wxApi.userAuthorization();
    }
    else {
      var categoryid = e.currentTarget.dataset.id;
      var openid = app.globalData.openid;
      var url = Api.postSubscription();
      var subflag = e.currentTarget.dataset.subflag;
      var data = {
        categoryid: categoryid,
        openid: openid
      };
      var postSubscriptionRequest = wxRequest.postRequest(url, data);
      postSubscriptionRequest.then(response => {
        if (response.statusCode === 200) {
          if (response.data.status == '200') {
            setTimeout(function () {
              wx.showToast({
                title: '订阅成功',
                icon: 'success',
                duration: 900,
                success: function () {
                  }
              });
            }, 900);
            var subimg = "";
            if (subflag == "0") {
              subflag = "1";
              subimg = "subscription-on.png"
            }
            else {
              subflag = "0";
              subimg = "subscription.png"
            }
            self.reloadData(categoryid, subflag, subimg);
          }
          else if (response.data.status == '201') {
            setTimeout(function () {
              wx.showToast({
                title: '取消订阅成功',
                icon: 'success',
                duration: 900,
                success: function () {
                }
              });
            }, 900);
            var subimg = "";
            if (subflag == "0") {
              subflag = "1";
                subimg = "subscription-on.png"
            }
            else {
              subflag = "0";
              subimg = "subscription.png"
            }
            self.reloadData(categoryid, subflag, subimg);
          }
          else if (response.data.status == '501' || response.data.status == '501') {
            console.log(response);
          }
        }
        else {
          setTimeout(function () {
            wx.showToast({
              title: '操作失败,请稍后重试',
              icon: 'success',
              duration: 900,
              success: function () {
              }
            });
          }, 900);
          console.log(response);
        }
      }).catch(function (response) {
        setTimeout(function () {
          wx.showToast({
            title: '操作失败,请稍后重试',
            icon: 'success',
            duration: 900,
            success: function () {
            }
          });
        }, 900);
      console.log(response);
      })
    }
  },
  reloadData: function (id, subflag, subimg) {
    var self = this;
    var newCategoriesList = [];
    var categoriesList = self.data.categoriesList;
    for (var i = 0; i < categoriesList.length; i++) {
      if (categoriesList[i].id == id) {
        categoriesList[i].subflag = subflag;
        categoriesList[i].subimg = subimg;
      }
      newCategoriesList.push(categoriesList[i]);
    }
    if (newCategoriesList.length > 0) {
      self.setData({
        categoriesList: newCategoriesList
      });
    }
  },

    //跳转至某分类下的文章列表
  redictIndex: function (e) {
    //console.log('查看某类别下的文章');  
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.item;
    var url = '../list/list?categoryID=' + id;
    wx.navigateTo({
      url: url
    });
  },
  confirm: function () {
    this.setData({
      'dialog.hidden': true,
      'dialog.title': '',
      'dialog.content': ''
    })
    } 

})