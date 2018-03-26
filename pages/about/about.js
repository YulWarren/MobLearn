
var Api = require('../../utils/api.js');
var util = require('../../utils/util.js');
var WxParse = require('../../wxParse/wxParse.js');
var wxApi = require('../../utils/wxApi.js');
var wxRequest = require('../../utils/wxRequest.js');
var auth = require('../../utils/auth.js');
import config from '../../utils/config.js';
var app = getApp();

Page({
  data: {
    title: '页面内容',
    pageData: {},
    pagesList: {},
    display: 'none',
    wxParseData: [],
    dialog: {
      title: '',
      content: '',
      hidden: true
    }
  },
  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: '关于MobLearn',
      success: function(res) {
        // success
      }
    });
    this.fetchData(config.getAboutId);
  },
  onPullDownRefresh: function() {
    var self = this;
    self.setData({
      display: 'none',
      pageData: {},
      wxParseData: {},
    });
    this.fetchData(config.getAboutId);
        //消除下刷新出现空白矩形的问题。
    wx.stopPullDownRefresh()
  },
  onShareAppMessage: function() {
    return {
      title: '关于“' + config.getWebsiteName + '”官方小程序',
      path: 'pages/about/about',
      success: function(res) {
        wx.showToast({
          title: '转发成功',
          icon: 'success',
          duration: 900,
        })
      },
      fail: function(res) {
        wx.showToast({
          title: ' 转发失败',
          icon:'none'
        })
      }
    }
  },
  gotoMy: function () {
    wx.switchTab({
      url: '../readlog/readlog',
    })
  },
  fetchData: function(id) {
    var self = this;
    var getPageRequest = wxRequest.getRequest(Api.getPageByID(id));
    getPageRequest.then(response => {
      WxParse.wxParse('article', 'html', response.data.content.rendered, self, 5);
      self.setData({
        pageData: response.data,
      });
      self.setData({
        display: 'block'
      });
    }).then(res => {
      (response => {
        if (response.data.status == '200') {
          var _avatarurls = response.data.avatarurls;
          var avatarurls = [];
          for (var i = 0; i < _avatarurls.length; i++) {
            var avatarurl = "../../images/gravatar.png";
            if (_avatarurls[i].avatarurl.indexOf('wx.qlogo.cn') != -1) {
              avatarurl = _avatarurls[i].avatarurl;
            }
            avatarurls[i] = avatarurl;
          }
          self.setData({
            praiseList: avatarurls
          });
        } else {
          // console.log(response);
        }
      })
    })
    .then(res => {
      if (!app.globalData.isGetOpenid) {
        auth.getUsreInfo();
      }
    })
  }
})