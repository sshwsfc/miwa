// ...
(function(){

  Backbone.Page = function(options) {
    this.cid = _.uniqueId('page');
    this._configure(options || {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  _.extend(Backbone.Page.prototype, Backbone.Events, Backbone.Router, {
  	views: {},
	rended : false,

	make : function() {
		var el = document.createElement('div');
		var $el = $(el);
		$el.addClass('ui-page');
		attributes['id'] = this.cid;
		this.$el = $el;
		return el;
	},

	render_views: function(){
		
	},
	
	show: function(fromPage){
		if(!this.rended){
			this.make();
			this.render_views();
    		this.delegateEvents();
			this.rended = true;
		}


	},
  });

var Page = $bb.View.extend({

	tagName: 'div',
	pageName: '',
	rended : false,
	transition : 'slide',

	_configure : function(options) {
		$bb.View.prototype._configure.call(this, options);
		this.make_page_id(options);
	},

	make_page_id: function(options){
		this.page_id = this.type;
	},

	initialize: function(options) {
		this.bind('beforeshow', this.render_page, this);
		this.bind('show', function(){
			if(this.lastScroll){
				var lastScroll = this.lastScroll;
				setTimeout(function() {
					window.scrollTo( 0, lastScroll );
				}, 20 );
			}
			$("html").removeClass("ui-mobile-rendering");
		}, this);
		this.bind('beforehide', function(){ this.lastScroll = $('body')[0].scrollTop;}, this);
	},

	render_page: function(fromPage){
		if(!this.rended){
			this.render();
			this.rended = true;
		}
	},

	make : function(tagName, attributes, content) {
		var el = document.createElement(tagName);
		var $el = $(el);
		$el.addClass('ui-page');
		attributes['id'] = this.page_id;
		if (attributes) $el.attr(attributes);
		if (content) $el.html(content);
		this.$el = $el;
		return el;
	},

}, {
	gen_page: function($pm, hash, options){
		if($pm.current_pages[hash] == undefined){
			var page = new this(options);
			$pm.container.append(page.el);
			$pm.current_pages[hash] = page;
		}
		return $pm.current_pages[hash];
	}
});

//default non-animation transition handler
var noneTransitionHandler = function( name, reverse, toPage, fromPage, done ) {
	if ( fromPage ) {
		fromPage.$el.removeClass( "ui-page-active active-page" );
	}
	toPage.$el.addClass( "ui-page-active active-page" );

	return done();
};

var css3TransitionHandler = function( name, reverse, to, from, done ) {
	var reverseClass = reverse ? " reverse" : "",
		$to = to.$el, $from = from?from.$el:undefined,
		activePageClass = "ui-page-active active-page",
		viewportClass = "ui-mobile-viewport-transitioning viewport-" + name,
		doneFunc = function() {
			$to.add( $from ).removeClass( "out in reverse " + name );

			if ( $from && $from[ 0 ] !== $to[ 0 ] ) {
				$from.removeClass( activePageClass );
			}

			$to.parent().removeClass( viewportClass );
			done();
		};

	$to.one( 'webkitAnimationEnd', doneFunc );
	$to.parent().addClass( viewportClass );

	if ( $from ) {
		$from.addClass( name + " out" + reverseClass );
	}
	$to.addClass( activePageClass + " " + name + " in" + reverseClass );
};

// Miwa Page Management
$ma.pm = {};

_.extend($ma.pm, $bb.Events, {

	pages: {},
	activePage : null,
	current_pages: {},
	isTransitioning: false,
	transitionQueue: [],
	container: $('#app_view'),
	defaultTransitionHandler : css3TransitionHandler,
	transitionHandlers : {
		none: noneTransitionHandler
	},

	history: {
		_stack: [],
		push: function(c) {
		    this._stack.push(c)
		},
		pop: function() {
		    return this._stack.pop()
		},
		peek: function() {
		    return this._stack[this._stack.length - 2]
		}, 
		len: function(){return this._stack.length;}
	},

	initialize: function(){
	},

	page: function(ps, cps){
		var page_cls = Page.extend(ps, cps);
		var page = new page_cls;
		this.pages[page.cid] = page;
	},

	to : function(page, options){

		if( this.isTransitioning ) {
			this.transitionQueue.unshift( arguments );
			return;
		}
		options = options || {};

		var hash = window.location.hash;
		toPage = this.pages[page].gen_page.call(this.pages[page], this, hash, options)

		// Make sure we have a fromPage.
		fromPage = options.fromPage || this.activePage;

		// Let listeners know we're about to change the current page.
		this.trigger('pagebeforechange', toPage, fromPage, options)

		// If the default behavior is prevented, stop here!
		if( options.prevented ){return;}

		this.isTransitioning = true;

		// The caller passed us a real page DOM element. Update our
		// internal state and then trigger a transition to the page.
		var initialPage = this.history.len() === 0;

    historyDir = false;
    if (window.location.hash === this.history.peek()) {
        this.history.pop(); historyDir = true
    } else this.history.push(window.location.hash);
    

		// Kill the keyboard.
		// XXX_jblas: We need to stop crawling the entire document to kill focus. Instead,
		//            we should be tracking focus with a delegate() handler so we already have
		//            the element in hand at this point.
		// Wrap this in a try/catch block since IE9 throw "Unspecified error" if document.activeElement
		// is undefined when we are in an IFrame.
		try {
			if(document.activeElement && document.activeElement.nodeName.toLowerCase() != 'body') {
				$(document.activeElement).blur();
			} else {
				$( "input:focus, textarea:focus, select:focus" ).blur();
			}
		} catch(e) {}

		// Make sure we have a transition defined.
		options.transition = options.transition
			|| ( !initialPage ? ((historyDir && fromPage)?fromPage.transition:toPage.transition) : undefined )
			|| this.defaultPageTransition;

		//set "toPage" as activePage
		this.activePage = toPage;

		// If we're navigating back in the URL history, set reverse accordingly.
		options.reverse = options.reverse || historyDir;

		this.transitionPages( toPage, fromPage, options.transition, options.reverse, function() {
				//removeActiveLinkClass();

				//if there's a duplicateCachedPage, remove it from the DOM now that it's hidden
				if ( options.duplicateCachedPage ) {
					options.duplicateCachedPage.remove();
				}

				$ma.pm.isTransitioning = false;

				// Let listeners know we're all done changing the current page.
				$ma.pm.trigger( "pagechange", toPage, fromPage, options );
		});
	},
	transitionPages: function( toPage, fromPage, transition, reverse, done ) {

		//get current scroll distance
		var toScroll = toPage.lastScroll || 1;

		if( fromPage ) {
			fromPage.trigger( "beforehide", toPage );
		}

		// Scroll to top, hide addr bar
		//window.scrollTo( 0, 1 );

		//toPage.height( screenHeight + toScroll );
		toPage.trigger( "beforeshow",  fromPage || $( "" ) );

		//clear page loader
		this.trigger( "beforeshow" );

		//find the transition handler for the specified transition. If there
		//isn't one in our transitionHandlers dictionary, use the default one.
		//call the handler immediately to kick-off the transition.
		var th = this.transitionHandlers[transition || "none"] || this.defaultTransitionHandler;		
		th(transition, reverse, toPage, fromPage, function() {
			toPage.$el.height( "" );

			//$ma.silentScroll( toScroll );

			//trigger show/hide events
			if( fromPage ) {
				fromPage.$el.height( "" );
				fromPage.trigger( "hide", toPage);
			}

			if(toPage.title){(document.title = (typeof toPage.title == "string")?toPage.title:toPage.title(options));}
			//trigger pageshow, define prevPage as either fromPage or empty jQuery obj
			toPage.trigger( "show", fromPage || $( "" ) );
			done();
		});
	},
});

$ma.page = function(){$ma.pm.page.apply($ma.pm, arguments)};
$ma.bind('initialize', _.bind($ma.pm.initialize, $ma.pm));

})(this);