// ...
(function(){

$ma.view(function(){ return {
	Page: {

		tagName: 'div',
		pageName: '',
		rended_views : false,
		transition : 'slide',

		_configure : function(options) {
			$bb.View.prototype._configure.call(this, options);
			this.pageId = options['pageId'];
		},

		initialize: function(options) {
			this.bind('beforeshow', this.show_views, this);
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

		show_views: function(){},

		make : function(tagName, attributes, content) {
			var el = document.createElement(tagName);
			var $el = $(el);
			$el.addClass('ui-page');
			attributes['id'] = this.page_id;
			if (attributes) $el.attr(attributes);
			if (content) $el.html(content);

			//layout views
			var views = this.make_views();
			_.each(views, function(v){
				$el.append(v.el);
			});

			this.views = views;
			this.$el = $el;
			return el;
		}
	}
}});

var PageRoute = $bb.Router.extend({
	initialize : function(options){
		this.page = options.page;
	},
	route : function(route, name, callback) {
		Backbone.history || (Backbone.history = new Backbone.History);
		if (!_.isRegExp(route)) route = this._routeToRegExp(route);
		Backbone.history.route(route, _.bind(function(fragment) {
			var args = this._extractParameters(route, fragment);
			var pageId = (typeof(this.page.pageId) == 'function') ? this.page.pageId.apply(this.page, args) : this.page.pageId;
			
			var page = $ma.pm.current_pages[pageId];
			if(page == undefined){
				page = new this.page({'pageId': pageId});
				$ma.pm.container.append(page.el);
				$ma.pm.current_pages[pageId] = page;
			}

			page[name].apply(page, args);

			$ma.pm.to(page);
		}, this));
    }
})

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
		_.each(_.values($views), function(v){
			if(v['pageId'] && v['routes']){
				new PageRoute({
					page: v,
					routes: v.routes
				});
			}
		});
	},

	to : function(toPage, options){

		if( this.isTransitioning ) {
			this.transitionQueue.unshift( arguments );
			return;
		}
		options = options || {};

		// Make sure we have a fromPage.
		fromPage = options.fromPage || this.activePage;
		if(toPage == fromPage) return;

		// Let listeners know we're about to change the current page.
		this.trigger('pagebeforechange', toPage, fromPage, options);

		// If the default behavior is prevented, stop here!
		if( options.prevented ){return;}

		this.isTransitioning = true;

		// The caller passed us a real page DOM element. Update our
		// internal state and then trigger a transition to the page.
		var initialPage = this.history.len() === 0;

	    historyDir = false;
	    if (toPage.pageId === this.history.peek()) {
	        this.history.pop(); historyDir = true;
	    } else this.history.push(toPage.pageId);
    

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

$ma.bind('initialize', _.bind($ma.pm.initialize, $ma.pm));

})(this);