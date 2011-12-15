#!/usr/bin/env python
import os,sys
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

class HtmlHandler(tornado.web.RequestHandler):
    
    def get_html_string(self, path, context):
        try:
            return self.render_string(path+ ".html", **context)
        except Exception, err:
            logging.error(err)
            raise tornado.web.HTTPError(404)
    
    def get(self, path='index'):
        if path == '':
            path = 'index'
        path  = path.replace('.', '/')
                    
        settings = self.application.settings

        header_scripts = """
        <script src="libs/zepto.js"></script>
        <script src="libs/underscore.js"></script>
        <script src="libs/backbone.js"></script>
        <script src="libs/backbone-localstorage.js"></script>
        <script src="app.js"></script>
        """

        context = {'settings':settings, 'header_scripts': header_scripts, \
            'debug':settings.get('debug'), 'lang': self.locale.code}
        
        self.finish(self.get_html_string(path, context))

class AppJsHandler(tornado.web.RequestHandler):
    
    app_dirs = ('models', 'collection', 'templates', 'views', 'controllers')

    def append_code(self, code):
        self.js.append(code)

    def get_templates_content(self, d):
        self.append_code('window.TPS = {};')

        root = os.path.join(self.application.settings.get('app_root'), d)
        for fp in os.listdir(root):
            filepath = os.path.join(root, fp)
            if fp.endswith('.html'):
                tmpl = file(filepath).read()
                tmpl = tmpl.replace("'", "\\'").replace('\r', "").replace('\n', "")
                self.append_code("window.TPS.%s = _.template('%s');" % (fp.split('.')[0], tmpl))

    def get_code(self, d, ext='js'):
        root = os.path.join(self.application.settings.get('app_root'), d)
        for fp in os.listdir(root):
            filepath = os.path.join(root, fp)
            if fp.endswith('.%s' % ext):
                self.append_code(file(filepath).read())

    def get(self):
        self.js = ['$(function(){']
        for d in self.app_dirs:
            (hasattr(self, 'get_%s_content' % d) and getattr(self, 'get_%s_content' % d) or self.get_code)(d)
        self.append_code('window.App = new AppView;});')

        self.set_header("Content-Type", "text/javascript; charset=UTF-8")
        self.finish('\n'.join(self.js))

def main():
    root = options.root
    if root and root[0] != '/':
        root = os.path.join(PROJECT_ROOT, root)

    app_settings = {
        "app_root": root,
        "template_path": os.path.join(root, "htmls"),
        "debug": True,
        "autoescape":None,
    }
    handlers = [
        (r"/app.js", AppJsHandler),
        (r"/(.*).html", HtmlHandler),
        (r"/libs/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(PROJECT_ROOT, "libs")}),
    ]
    application = tornado.web.Application(handlers, **app_settings)

    application.listen(options.port, no_keep_alive=True, xheaders=True)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    parse_command_line()
    main()
