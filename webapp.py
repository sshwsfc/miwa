#!/usr/bin/env python
import os,sys,re
import os.path
import logging
import codecs
from tornado.options import options, define, parse_command_line
import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.locale

PROJECT_ROOT = os.path.realpath(os.path.dirname(__file__))

define('port', type=int, default=8000)
define('root', type=str, default=PROJECT_ROOT)

class AppPageHandler(tornado.web.RequestHandler):
        
    def get(self):                    
        settings = self.application.settings

        header_scripts = """
        <script src="libs/zepto.js"></script>
        <script src="libs/zepto.windowname.js"></script>
        <script src="libs/underscore.js"></script>
        <script src="libs/backbone.js"></script>
        <!--script src="libs/backbone-localstorage.js"></script-->
        <script src="miwa.js"></script>
        <script src="app.js"></script>
        """

        context = {'settings':settings, 'header_scripts': header_scripts, \
            'debug':settings.get('debug'), 'lang': self.locale.code}
        
        self.finish(self.render_string("app.html", **context))

class AppJsHandler(tornado.web.RequestHandler):
    
    comps = ('models', 'collections', 'templates', 'views', 'controllers', 'utils')
    models_method = {'models': 'model', 'collections': 'coll', 'views': 'view'}
    tmpl_re = re.compile(r'<\!---tmpl:(\S+)-->')

    def append_code(self, code):
        self.js.append(code)

    def get_templates_content(self, app_path, comp='templates'):
        tmpls = {}
        root = os.path.join(app_path, comp)
        if os.path.isdir(root):
            for fp in os.listdir(root):
                filepath = os.path.join(root, fp)
                if fp.endswith('.html'):
                    tmpls[fp.split('.')[0]] = file(filepath).read()
        
        tmpl_file = '%s.html' % root
        if os.path.exists(tmpl_file):
            tf = file(tmpl_file)
            content = tf.read()
            cache_tmpl = ''
            cache_key = ''
            end_pos = 0

            for match in self.tmpl_re.finditer(content):
                cache_tmpl = content[end_pos:match.start()]
                if cache_tmpl and cache_key:  tmpls[cache_key] = cache_tmpl
                cache_key = match.groups()[0]
                end_pos = match.end()

            cache_tmpl = content[end_pos:]
            if cache_tmpl and cache_key:  tmpls[cache_key] = cache_tmpl

            tf.close()
            
        for key, tmpl in tmpls.items():
            tmpl = tmpl.replace("'", "\\'").replace('\r', "").replace('\n', "")
            self.append_code("$tmpls.%s = _.template('%s');" % (key, tmpl))

    def get_code(self, app_path, comp, ext='js'):
        filepath = os.path.join(app_path, '%s.%s' % (comp, ext))
        if os.path.exists(filepath):
            content = file(filepath).read()
            if self.models_method.has_key(comp):
                self.append_code('$ma.%s(function(){ return {\n%s\n}})' % (self.models_method[comp], content))
            else:
                self.append_code(content)

    def get(self):
        self.js = ['(function(){']

        root = os.path.join(self.application.settings.get('app_root'), 'src')
        for app in os.listdir(root):
            app_path = os.path.join(root, app)
            for comp in self.comps:
                (hasattr(self, 'get_%s_content' % comp) and getattr(self, 'get_%s_content' % comp) or self.get_code)(app_path, comp)

        self.append_code('})();')

        self.set_header("Content-Type", "text/javascript; charset=UTF-8")
        self.finish('\n'.join(self.js))

class MiwaJsHandler(tornado.web.RequestHandler):
    
    miwa_packages = ('core', 'cache', 'ui', 'page', 'support')
    src_root = os.path.join(PROJECT_ROOT, "js")

    def get(self):
        self.js = []
        for p in self.miwa_packages:
            self.js.append(file(os.path.join(self.src_root, 'miwa.%s.js' % p)).read())

        self.set_header("Content-Type", "text/javascript; charset=UTF-8")
        self.finish('\n'.join(self.js))

class MiwaCssHandler(tornado.web.RequestHandler):
    
    src_root = os.path.join(PROJECT_ROOT, "css")

    def get(self):
        css = file(os.path.join(self.src_root, 'miwa.css')).read()
        self.set_header("Content-Type", "text/css; charset=UTF-8")
        self.finish(css)

def main():
    root = options.root
    if root and root[0] != '/':
        root = os.path.join(PROJECT_ROOT, root)

    app_settings = {
        "app_root": root,
        "template_path": root,
        "debug": True,
        "autoescape":None,
        "static_path": os.path.join(root, "static"),
        "static_url_prefix": "/static/",
    }
    handlers = [
        (r"/$", AppPageHandler),
        (r"/app.js", AppJsHandler),
        (r"/miwa.js", MiwaJsHandler),
        (r"/miwa.css", MiwaCssHandler),
        (r"/libs/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(PROJECT_ROOT, "libs")}),
        (r"/js/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(PROJECT_ROOT, "js")}),
    ]
    application = tornado.web.Application(handlers, **app_settings)

    application.listen(options.port, no_keep_alive=True, xheaders=True)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    parse_command_line()
    main()
