/*
* "init" - Initialize the framework
*/
(function(){

	// Initial Setup
	// -------------
	var root = this;

	var previousMiwa = root.Miwa;

	var $ma = Miwa = {};

	// Current version of the library. Keep in sync with `package.json`.
	Miwa.VERSION = '0.0.1';

	if (typeof exports !== 'undefined') {
		$ma = exports;
	} else {
		$ma = root.$ma = {};
	}
	$app = root.$app = {};

	// Require Underscore, if we're on the server, and it's not already present.
	var _ = root._;
	if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;
	var $ = root.Zepto || root.jQuery;
	var $bb = root.$bb = root.Backbone;
	if (!$bb && (typeof require !== 'undefined')) $bb = require('backbone').Backbone;

	// initialize underscore
	_.templateSettings = {
        evaluate: /\{%([\s\S]+?)%\}/g,
        interpolate: /\$\{([\s\S]+?)\}/g,
	    escape      : /#\{([\s\S]+?)\}/g
	};

	// _.template = function(str, data) {
	// 	var c  = _.templateSettings;
	// 	var tmpl = 'var __p=[];' +
	// 	  'with(obj||{}){__p.push(\'' +
	// 	  str.replace(/\\/g, '\\\\')
	// 	     .replace(/'/g, "\\'")
	// 	     .replace(c.escape, function(match, code) {
	// 	       return "',_.escape(" + code.replace(/\\'/g, "'") + "),'";
	// 	     })
	// 	     .replace(c.interpolate, function(match, code) {
	// 	       return "',_.attr(this, " + code.replace(/\\'/g, "'") + "),'";
	// 	       var attr = code.replace(/\\'/g, "'");
	// 	       return "',_.attr(attr) ? attr() : (attr || get(attr)),'";
	// 	     })
	// 	     .replace(c.evaluate || null, function(match, code) {
	// 	       return "');" + code.replace(/\\'/g, "'")
	// 	                          .replace(/[\r\n\t]/g, ' ') + ";__p.push('";
	// 	     })
	// 	     .replace(/\r/g, '\\r')
	// 	     .replace(/\n/g, '\\n')
	// 	     .replace(/\t/g, '\\t')
	// 	     + "');}return __p.join('');";
	// 	var func = new Function('obj', '_', '$', tmpl);
	// 	if (data) return func(data, _, $);
	// 	return function(data) {
	// 	  return func.call(this, data, _);
	// 	};
	// };

	var	$html = $( "html" ),
		$head = $( "head" ),
		$window = $( root );

	$( window.document ).trigger( "miwainit" );

	$html.addClass( "ui-mobile ui-mobile-rendering" );
	//App mvc models
	root.$tmpls= {}, root.$views= {}, root.$models= {}, root.$colls= {};

	_.extend($ma, $bb.Events, {

		controllers: [],

		// turn on/off page loading message.
		showPageLoadingMsg: function() {
			if ( $.mobile.loadingMessage ) {
				var activeBtn = $( "." + $.mobile.activeBtnClass ).first();

				$loader
					.find( "h1" )
						.text( $.mobile.loadingMessage )
						.end()
					.appendTo( $.mobile.pageContainer )
					// position at y center (if scrollTop supported), above the activeBtn (if defined), or just 100px from top
					.css({
						top: $.support.scrollTop && $window.scrollTop() + $window.height() / 2 ||
						activeBtn.length && activeBtn.offset().top || 100
					});
			}

			$html.addClass( "ui-loading" );
		},

		hidePageLoadingMsg: function() {
			$html.removeClass( "ui-loading" );
		},

		log: function(o){ console.log(o); },

		controller: function(properties, classProperties){
			this.controllers.push($bb.Router.extend(properties, classProperties));
		},

		initializeApp: function() {
			//create classes
			var ma = this;
			_.each(['model', 'coll', 'view'], function(m){
				for (var i = ma[m+'_cbs'].length - 1; i >= 0; i--) {
					var models = ma[m+'_cbs'][i](ma);
					for(key in models){
						key.replace(/\s/g, '');
						if(key.indexOf('$')>0){
							var name=key.split('$')[0], base=key.split('$')[1];}
						else{var name=key, base='Base';}

						if(name != 'Base'){
							var ps = models[key];
							ma.bind('new:'+m+'.'+base, (function(name, ps){return function(cls){
								if(typeof(ps) == 'function'){ var newCls = ps(cls); }
								else{ 
									var clsPs = {};
									for(key in ps){
										if(key.indexOf('$') == 0){
											clsPs[key.substr(1)] = ps[key];
											delete ps[key];
										}
									}
									ps['_sup'] = cls.prototype;
									var newCls = cls.extend(ps, clsPs);}
								
								root['$'+m+'s'][name] = newCls;
								ma.trigger('new:'+m+'.'+name, newCls);
							}})(name, ps), ma);
						}
					}
				};
				ma.trigger('new:'+m+'.Base', root['$'+m+'s'].Base);
			});
			this.trigger('initialize', this);
			$('#app-init').remove();

			if($bb.history != undefined){$bb.history.start();}
			else{this.log('no route defined!!')}
		}
	});
	_.each(['model', 'coll', 'view'], function(m){
		$ma[m+'_cbs'] = [];
		$ma[m] = function(callback){$ma[m+'_cbs'].push(callback);}
	});

	$models.Base = $bb.Model.extend({
		fields: {},
		toData: function(){
			var data = {};
			var model = this;
			_.map(this.attributes, function(v,k){
				if(_.isFunction(model['get_' + k + '_display'])){
					data[k] = model['get_' + k + '_display'](v);
				}else{
					data[k] = model.fields[k] != undefined && _.isFunction(model['f_' + model.fields[k].type || 'char' + '_display']) 
						? model['f_' + model.fields[k].type || 'char' + '_display'](v) : v;
				}
			});
			return data;
		}
	});
	$colls.Base = $bb.Collection.extend({});
	$views.Base = $bb.View.extend({
		show: function(){ $(this.el).show(); },
		hide: function(){ $(this.el).hide(); }
	});

	// check which scrollTop value should be used by scrolling to 1 immediately at domready
	// then check what the scroll top is. Android will report 0... others 1
	// note that this initial scroll won't hide the address bar. It's just for the check.
	$(function() {

		var cont = "user-scalable=no",
			meta = $( "meta[name='viewport']" );
		if( meta.length ){meta.attr( "content", meta.attr( "content" ) + ", " + cont );}
		else{$( "head" ).prepend( "<meta>", { "name": "viewport", "content": cont } );}

		window.scrollTo( 0, 1 );
		
		$ma.initializeApp();
	});

}).call(this);
