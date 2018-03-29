import config from '../../utils/config.js'
var Api = require('../../utils/api.js');
var util = require('../../utils/util.js');
var auth = require('../../utils/auth.js');
var WxParse = require('../../wxParse/wxParse.js');
var wxApi = require('../../utils/wxApi.js')
var wxRequest = require('../../utils/wxRequest.js')
var app = getApp();
let isFocusing = false

Page({
    data: {
        detail: {},
        title: '文章内容',
        commentsList: [],
        ChildrenCommentsList: [],
        commentCount: '',
        detailDate: '',
        commentValue: '',
        wxParseData: [],
        display: 'none',
        page: 1,
        isLastPage: false,
        parentID: "0",
        focus: false,
        placeholder: "输入评论",
        postID: null,
        scrollHeight: 0,
        postList: [],
        link: '',
        dialog: {
            title: '',
            content: '',
            hidden: true
        },
        content: '',
        isShow: false, //控制menubox是否显示
        isLoad: true, //解决menubox执行一次  
        menuBackgroup: false,
        likeImag: "like.png",
        likeList: [],
        likeCount: 0,
        displayLike: 'none',
        replayTemplateId: config.getReplayTemplateId,
        userid: "",
        toFromId: "",
        commentdate: "",
        flag: 1,
        isVideo: false,
        videoSrc: "",
        isFile: false,
        url: null
    },
    onLoad: function(options) {
      wx.showLoading({
        title: '正在加载',
        mask: true,
      });
      setTimeout(function () {
        wx.hideLoading()
      }, 2000)
      this.fetchDetailData(options.id);
    },
    onPullDownRefresh: function() {
        wx.startPullDownRefresh()
    },
    showLikeImg: function() {
        var self = this;
        var flag = false;
        var _likes = self.data.detail.avatarurls;
        var likes = [];
        for (var i = 0; i < _likes.length; i++) {
            var avatarurl = "../../images/gravatar.png";
            if (_likes[i].avatarurl.indexOf('wx.qlogo.cn') != -1) {
                avatarurl = _likes[i].avatarurl;
            }
            likes[i] = avatarurl;
        }
        var temp = likes;
        self.setData({
            likeList: likes
        });
    },
    onShareAppMessage: function(res) {
        this.ShowHideMenu();
        return {
            title: '分享"' + config.getWebsiteName + '"的文章：' + this.data.detail.title.rendered,
            path: 'pages/detail/detail?id=' + this.data.detail.id,
            imageUrl: this.data.detail.post_thumbnail_image,
            success: function(res) {
                wx.showToast({
                    title: '转发成功',
                    icon: 'success',
                    duration: 900,
                })
            },
            fail: function(res) {
                wx.showToast({
                    title: '转发失败',
                    icon: 'none'
                })
            }
        }
    },
    clickLike: function(e) {
        var id = e.target.id;
        var self = this;
        if (id == 'likebottom') {
            this.ShowHideMenu();
        }
        if (app.globalData.isGetOpenid) {
            var data = {
                openid: app.globalData.openid,
                postid: self.data.postID
            };
            var url = Api.postLikeUrl();
            var postLikeRequest = wxRequest.postRequest(url, data);
            postLikeRequest
                .then(response => {
                    if (response.data.status == '200') {
                        var _likeList = []
                        var _like = app.globalData.userInfo.avatarUrl;
                        _likeList.push(_like);
                        var tempLikeList = _likeList.concat(self.data.likeList);
                        var _likeCount = parseInt(self.data.likeCount) + 1;
                        self.setData({
                            likeList: tempLikeList,
                            likeCount: _likeCount,
                            displayLike: 'block'
                        });
                        wx.showToast({
                            title: '谢谢点赞',
                            icon: 'success',
                            duration: 900,
                            success: function() {}
                        })
                    } else if (response.data.status == '501') {
                        wx.showToast({
                            title: '谢谢，已赞过',
                            icon: 'success',
                            duration: 900,
                            success: function() {}
                        })
                    } else {

                    }
                    self.setData({
                        likeImag: "like-on.png"
                    });
                })
        } else {
            wxApi.userAuthorization();
        }
    },
    getIslike: function() { //判断当前用户是否点赞
        var self = this;
        if (app.globalData.isGetOpenid) {
            var data = {
                openid: app.globalData.openid,
                postid: self.data.postID
            };
            var url = Api.postIsLikeUrl();
            var postIsLikeRequest = wxRequest.postRequest(url, data);
            postIsLikeRequest
                .then(response => {
                    if (response.data.status == '200') {
                        self.setData({
                            likeImag: "like-on.png"
                        });
                    }
                })
        }
    },
    goHome: function() {
        wx.switchTab({
            url: '../index/index'
        })
    },
    //获取文章内容
    fetchDetailData: function(id) {
        
        var self = this;
        var getPostDetailRequest = wxRequest.getRequest(Api.getPostByID(id));
        var res;
        var _displayLike = 'none';
        getPostDetailRequest
            .then(response => {
                res = response;
                if (response.data.total_comments != null && response.data.total_comments != '') {
                    self.setData({
                        commentCount: "有" + response.data.total_comments + "条评论"
                    });
                };
                var _likeCount = response.data.like_count;
                if (response.data.like_count != '0') {
                    _displayLike = "block"
                }
                WxParse.wxParse('article', 'html', response.data.content.rendered, self, 5);
                // 如果是链接，判断是什么文件,并将链接设置为 src
                var renderedContent = response.data.content.rendered
                var strRegex = 'https://[A-Za-z0-9-_]+\\.[A-Za-z0-9-_%&\?\/.=]+';
                var link = renderedContent.match(strRegex)[0];
                if (link.indexOf(".pdf") > -1 || link.indexOf(".doc") > -1 || link.indexOf(".docx") > -1 || link.indexOf(".xls") > -1 || link.indexOf(".xlsx") > -1 || link.indexOf(".ppt") > -1 || link.indexOf(".pptx") > -1) {
                    self.setData({
                        isFile: true,
                        url: link
                    })
                }
                if (link.indexOf('.mp4') > -1) {
                    self.setData({
                        isVideo: true,
                        videoSrc: link
                    })
                }
                self.setData({
                    detail: response.data,
                    likeCount: _likeCount,
                    postID: id,
                    link: response.data.link,
                    detailDate: util.cutstr(response.data.date, 10, 1),
                    display: 'block',
                    displayLike: _displayLike
                });
                // 调用API从本地缓存中获取阅读记录并记录
                var logs = wx.getStorageSync('readLogs') || [];
                // 过滤重复值
                if (logs.length > 0) {
                    logs = logs.filter(function(log) {
                        return log[0] !== id;
                    });
                }
                // 如果超过指定数量
                if (logs.length > 19) {
                    logs.pop(); //去除最后一个
                }
                logs.unshift([id, response.data.title.rendered]);
                wx.setStorageSync('readLogs', logs);
                //end 
            })
            .then(response => {
                wx.setNavigationBarTitle({
                    title: res.data.title.rendered
                });
            })
            .then(response => {
                var tagsArr = [];
                tagsArr = res.data.tags
                var tags = "";
                for (var i = 0; i < tagsArr.length; i++) {
                    if (i == 0) {
                        tags += tagsArr[i];
                    } else {
                        tags += "," + tagsArr[i];
                    }
                }
                if (tags != "") {
                    var getPostTagsRequest = wxRequest.getRequest(Api.getPostsByTags(id, tags));
                    getPostTagsRequest
                        .then(response => {
                            self.setData({
                                postList: response.data
                            });
                        })
                }
            })
            .then(response => {
                var updatePageviewsRequest = wxRequest.getRequest(Api.updatePageviews(id));
                updatePageviewsRequest
                    .then(result => {})
            })
            .then(response => { //获取点赞记录
                self.showLikeImg();
            })
            .then(response => { //获取评论
                self.fetchCommentData(self.data, '0');
            })
            .then(resonse => {
                if (!app.globalData.isGetOpenid) {
                    auth.getUserInfo();
                }
            })
            .then(response => { //获取是否已经点赞
                if (app.globalData.isGetOpenid) {
                    self.getIslike();
                }
            })
            .catch(function(response) {}).finally(function(response) {});
    },
    showAttachment: function() {
        wx.showLoading({
            title: '下载中，请稍后...',
        });
        wx.downloadFile({
            url: this.data.url,
            success: function(res) {
                wx.hideLoading()
                wx.showLoading({
                    title: '正在打开',
                })
                var filePath = res.tempFilePath
                wx.openDocument({
                    filePath: filePath,
                    success: function(res) {
                        wx.hideLoading()
                    }
                })
            }
        })
    },
    //获取评论
    fetchCommentData: function(data, flag) {
        var self = this;
        if (!data) data = {};
        if (!data.page) data.page = 1;
        self.setData({
            commentsList: [],
        });
        var getCommentsRequest = wxRequest.getRequest(Api.getComments(data));
        getCommentsRequest
            .then(response => {
                if (response.statusCode == 200) {
                    if (response.data.length < 100) {
                        self.setData({
                            isLastPage: true
                        });
                    }
                    if (response.data) {
                        self.setData({
                            //commentsList: response.data, 
                            commentsList: self.data.commentsList.concat(response.data.map(function(item) {
                                var strSummary = util.removeHTML(item.content.rendered);
                                var dateStr = item.date;
                                dateStr = dateStr.replace("T", " ");
                                var strdate = util.getDateDiff(dateStr);
                                item.date = strdate;
                                item.dateStr = dateStr;
                                item.summary = strSummary;
                                if (item.author_url.indexOf('wx.qlogo.cn') != -1) {
                                    if (item.author_url.indexOf('https') == -1) {
                                        item.author_url = item.author_url.replace("http", "https");
                                    }
                                } else {
                                    item.author_url = "../../images/gravatar.png";
                                }
                                return item;
                            }))
                        });
                    }

                }
            })
            .catch(response => {})
    },
    //获取回复
    fetchChildrenCommentData: function(data, flag) {
        var self = this;
        var getChildrenCommentsRequest = wxRequest.getRequest(Api.getChildrenComments(data));
        getChildrenCommentsRequest
            .then(response => {
                if (response.data) {
                    self.setData({
                        ChildrenCommentsList: self.data.ChildrenCommentsList.concat(response.data.map(function(item) {
                            var strSummary = util.removeHTML(item.content.rendered);
                            var strdate = item.date;
                            item.summary = strSummary;
                            item.date = util.formatDateTime(strdate);
                            if (item.author_url.indexOf('wx.qlogo.cn') != -1) {
                                if (item.author_url.indexOf('https') == -1) {
                                    item.author_url = item.author_url.replace("http", "https");
                                }
                            } else {
                                item.author_url = "../../images/gravatar.png";
                            }
                            return item;
                        }))
                    });
                }
                setTimeout(function() {
                    if (flag == '1') {
                        wx.showToast({
                            title: '评论发布成功。',
                            icon: 'success',
                            duration: 900,
                            success: function() {}
                        })
                    }
                }, 900);
            })
    },
    //显示或隐藏功能菜单
    ShowHideMenu: function() {
        this.setData({
            isShow: !this.data.isShow,
            isLoad: false,
            menuBackgroup: !this.data.false
        })
    },
    //点击非评论区隐藏功能菜单
    hiddenMenubox: function() {
        this.setData({
            isShow: false,
            menuBackgroup: false
        })
    },
    //底部刷新
    loadMore: function(e) {
        var self = this;
        if (!self.data.isLastPage) {
            self.setData({
                page: self.data.page + 1
            });
            this.fetchCommentData(self.data, '0');
        } else {
            wx.showToast({
                title: '没有更多内容',
                mask: false,
                duration: 1000
            });
        }
    },
    replay: function(e) {
        var self = this;
        var id = e.target.dataset.id;
        var name = e.target.dataset.name;
        var userid = e.target.dataset.userid;
        var toFromId = e.target.dataset.formid;
        var commentdate = e.target.dataset.commentdate;
        isFocusing = true;
        self.setData({
            parentID: id,
            placeholder: "回复" + name + ":",
            focus: true,
            userid: userid,
            toFromId: toFromId,
            commentdate: commentdate
        });
    },
    onReplyBlur: function(e) {
        var self = this;
        if (!isFocusing) {
            const text = e.detail.value.trim();
            if (text === '') {
                self.setData({
                    parentID: "0",
                    placeholder: "输入评论",
                    userid: "",
                    toFromId: "",
                    commentdate: ""
                });
            }
        }
    },
    onRepleyFocus: function(e) {
        var self = this;
        isFocusing = false;
        if (!self.data.focus) {
            self.setData({ focus: true })
        }
    },
    //提交评论
    formSubmit: function(e) {
        var self = this;
        var comment = e.detail.value.inputComment;
        var parent = self.data.parentID;
        var postID = e.detail.value.inputPostID;
        var formId = e.detail.formId;
        var userid = self.data.userid;
        var toFromId = self.data.toFromId;
        var commentdate = self.data.commentdate;
        if (comment.length === 0) {
            self.setData({
                'dialog.hidden': false,
                'dialog.title': '提示',
                'dialog.content': '没有填写评论内容。'
            });
        } else {
            if (app.globalData.isGetOpenid) {
                var name = app.globalData.userInfo.nickName;
                var author_url = app.globalData.userInfo.avatarUrl;
                var email = app.globalData.openid + "@qq.com";
                var openid = app.globalData.openid;
                var fromUser = app.globalData.userInfo.nickName;
                var data = {
                    post: postID,
                    author_name: name,
                    author_email: email,
                    content: comment,
                    author_url: author_url,
                    parent: parent,
                    openid: openid,
                    userid: userid,
                    formId: formId
                };
                var url = Api.postWeixinComment();
                var postCommentRequest = wxRequest.postRequest(url, data);
                postCommentRequest
                    .then(res => {
                        if (res.statusCode == 200) {
                            if (res.data.status == '200') {
                                self.setData({
                                    content: '',
                                    parent: "0",
                                    userid: 0,
                                    placeholder: "输入评论",
                                    focus: false,
                                    commentsList: []
                                });
                                setTimeout(function() {
                                    wx.showToast({
                                        title: '评论发布成功。',
                                        icon: 'success',
                                        duration: 900,
                                        success: function() {}
                                    })
                                }, 900);
                                if (parent != "0" && !util.getDateOut(commentdate) && toFromId != "")
                                    var useropenid = res.data.useropenid;
                                var data = {
                                    openid: useropenid,
                                    postid: postID,
                                    template_id: self.data.replayTemplateId,
                                    form_id: toFromId,
                                    total_fee: comment,
                                    fromUser: fromUser,
                                    flag: 3,
                                    parent: parent
                                };
                                url = Api.sendMessagesUrl();
                                var sendMessageRequest = wxRequest.postRequest(url, data);
                                sendMessageRequest.then(response => {
                                    if (response.data.status == '200') {} else {}
                                });
                                self.fetchCommentData(self.data, '1');
                            } else if (res.data.status == '500') {
                                self.setData({
                                    'dialog.hidden': false,
                                    'dialog.title': '提示',
                                    'dialog.content': '评论失败，请稍后重试。'
                                });
                            }
                        } else {
                            if (res.data.code == 'rest_comment_login_required') {
                                self.setData({
                                    'dialog.hidden': false,
                                    'dialog.title': '提示',
                                    'dialog.content': '需要开启在WordPress rest api 的匿名评论功能！'
                                });
                            } else if (res.data.code == 'rest_invalid_param' && res.data.message.indexOf('author_email') > 0) {
                                self.setData({
                                    'dialog.hidden': false,
                                    'dialog.title': '提示',
                                    'dialog.content': 'email填写错误！'
                                });
                            } else {
                                self.setData({
                                    'dialog.hidden': false,
                                    'dialog.title': '提示',
                                    'dialog.content': '评论失败,' + res.data.message
                                });
                            }
                        }
                    })
                    .catch(response => {
                        self.setData({
                            'dialog.hidden': false,
                            'dialog.title': '提示',
                            'dialog.content': '评论失败,' + response
                        });
                    })
            } else {
                wxApi.userAuthorization();
            }
        }
    },
    confirm: function() {
        this.setData({
            'dialog.hidden': true,
            'dialog.title': '',
            'dialog.content': ''
        })
    },
    creatPoster: function() {
        var self = this;
        self.ShowHideMenu();
        if (self.data.posterImageUrl) {
            url = '../poster/poster?posterImageUrl=' + posterImageUrl;
            wx.navigateTo({
                url: url
            })
            return true;
        }
        var postid = self.data.detail.id;
        var title = self.data.detail.title.rendered;
        var path = "pages/detail/detail?id=" + postid;
        var postImageUrl = "";
        if (self.data.detail.content_first_image) {
            postImageUrl = self.data.detail.content_first_image;
        }
        wx.showLoading({
            title: "正在生成图片",
            mask: false,
        });
        if (app.globalData.isGetOpenid) {
            var openid = app.globalData.openid;
            var data = {
                postid: postid,
                title: title,
                path: path,
                postImageUrl: postImageUrl,
                openid: openid
            };
            var url = Api.creatPoster();
            var posterImageUrl = Api.getPosterUrl() + "poster-" + postid + ".jpg";
            var creatPosterRequest = wxRequest.postRequest(url, data);
            creatPosterRequest.then(response => {
                if (response.statusCode == 200) {
                    if (response.data.status == '200') {
                        url = '../poster/poster?posterImageUrl=' + posterImageUrl;
                        wx.navigateTo({
                            url: url
                        })
                    } else {
                        console.log(response);
                    }
                } else {
                    console.log(response);
                }
            }).catch(response => {
                console.log(response);
            }).finally(function(response) {
                wx.hideLoading();
            });
        }
    },
})