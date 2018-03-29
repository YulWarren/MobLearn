
var Api = require('../../utils/api.js');
var util = require('../../utils/util.js');
var WxParse = require('../../wxParse/wxParse.js');
var wxApi = require('../../utils/wxApi.js')
var wxRequest = require('../../utils/wxRequest.js')

import config from '../../utils/config.js'

Page({
  data: {
    title: '文章列表',
    postsList: {category_name:[]},
    pagesList: {},
    categoriesList: {},
    postsShowSwiperList: {},
    isLastPage: false,
    page: 1,
    search: '',
    categories: 0,
    category_name:[],
    categoriesImage:"",
    showerror:"none",
    isCategoryPage:"none",
    isSearchPage:"none",
    showallDisplay: "block",
    displaySwiper: "block",
    floatDisplay: "none",
    searchKey:"",
    topBarItems: [
      // id name selected 选中状态
      { id: '1', name: '评论数', selected: true },
      { id: '2', name: '浏览数', selected: false },  
      { id: '3', name: '点赞数', selected: false },
    ],
    tab: '1',
  },
  onShareAppMessage: function () {
    var title = "分享“"+ config.getWebsiteName +"”的文章排行。";
    var path ="pages/hot/hot";
    return {
      title: title,
      path: path,
      success: function (res) {
        wx.showToast({
          title: '转发成功',
          icon:'success',
          duration: 900
        })
      },
      fail: function (res) {
        wx.showToast({
          title: '转发失败',
          icon:'none',
        })
      }
    }
  },
  reload:function(e){
    var self = this;   
    self.fetchPostsData(self.data);
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
  onLoad: function (options) {
    var self = this;
    this.fetchPostsData("1");
    
    wx.setNavigationBarTitle({
      title: '热门排行',
      success: function (res) {
        // success
      }
    }); 
  },
  //获取文章列表数据
  fetchPostsData: function (tab) {
    var self = this;  
    self.setData({
        postsList: []
    });   
    wx.showLoading({
      title: '正在加载',
      mask:true
    });
    setTimeout(function () {
      wx.hideLoading()
    }, 500)
    var getTopHotPostsRequest = wxRequest.getRequest(Api.getTopHotPosts(tab));
    getTopHotPostsRequest.then(response =>{
      if (response.statusCode === 200) {
        self.setData({
          showallDisplay: "block",
          floatDisplay: "block",
        })
        response.data.map(function(item) {
          wx.request({
            url: 'https://www.moblearn.club/wp-json/wp/v2/posts/' + item.post_id,
            success:function(res) {
              var name = res.data.category_name
              item.category_name = name 
              var strdate = item.post_date
              if (item.post_thumbnail_image == null || item.post_thumbnail_image == '') {
                item.post_thumbnail_image = '../../images/logo7000.png';
              }
              item.post_date = util.cutstr(strdate, 10, 1); 

              
              self.setData({
                postsList: self.data.postsList.concat(item)
              })
              if (tab = '1') {
                self.data.postsList.sort(self.compare('comment_total'))
              }
              if (tab = '2') {
                self.data.postsList.sort(self.compare('pageviews'))
              }
              if (tab = '3') {
                self.data.postsList.sort(self.compare('like_count'))
              }
              self.setData({
                postsList: self.data.postsList
              })
              console.log(self.data.postsList)
            }
          })
          
        })
        
      } else if (response.statusCode === 404) { 
        console.log('加载数据失败,可能缺少相应的数据'); 
      } 
    })
    .catch(function () {
      wx.hideLoading();
        if (data.page == 1) {
          self.setData({
            showerror: "block",
            floatDisplay: "block"
          });
        }
    })
    .finally(function () {
      setTimeout(function () {
        wx.hideLoading();
        }, 1500);
        });    
  },
  compare:function(propertyName) {
    return function(obj1,obj2) {
      var value1 = obj1[propertyName];
      var value2 = obj2[propertyName];
      if (value1 < value2) {
        return 1;
      } else if( value1 > value2) {
        return -1;
      } else {
        return 0;
      }
    }
  },
  // 跳转至查看文章详情
  redictDetail: function (e) {
    var id = e.currentTarget.id,
      url = '../detail/detail?id=' + id;
    wx.navigateTo({
      url: url
    })
  },
})