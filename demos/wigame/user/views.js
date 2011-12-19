//pages
$ma.page({
	type: 'user_home',
	title: '用户主页',

	render: function() {
	    $(this.el).html($ma.tmpls.user_info({username:"小明", level: 2, "avatar":''}));
	    return this;
	},
});

$ma.page({
	type: 'user_info',
	title: '用户信息',
	transition : 'slideup',

	render: function() {
	    $(this.el).html($ma.tmpls.users_item({username:"小李", level: 2, "avatar":''}));
	    return this;
	},
});