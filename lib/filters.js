
/*!
 * Jade - filters
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var fs = require('fs'),
    execSync = require('exec-sync');

module.exports = {

  /**
   * Wrap text with CDATA block.
   */

  cdata: function(str){
    return '<![CDATA[\\n' + str + '\\n]]>';
  },

  /**
   * Transform sass to css, wrapped in style tags.
   */

  sass: function(str){
    str = str.replace(/\\n/g, '\n');
    var sass = require('sass').render(str).replace(/\n/g, '\\n');
    return '<style type="text/css">' + sass + '</style>';
  },

  /**
   * Transform stylus to css, wrapped in style tags.
   */

  stylus: function(str, options){
    var ret;
    str = str.replace(/\\n/g, '\n');
    var stylus = require('stylus');
    stylus(str, options).render(function(err, css){
      if (err) throw err;
      ret = css.replace(/\n/g, '\\n');
    });
    return '<style type="text/css">' + ret + '</style>';
  },

  /**
   * Transform less to css, wrapped in style tags.
   */

  less: function(str){
    var ret;
    str = str.replace(/\\n/g, '\n');
    require('less').render(str, function(err, css){
      if (err) throw err;
      ret = '<style type="text/css">' + css.replace(/\n/g, '\\n') + '</style>';
    });
    return ret;
  },

  /**
   * Transform markdown to html.
   */

  markdown: function(str){
    var md;

    // support markdown / discount
    try {
      md = require('markdown');
    } catch (err){
      try {
        md = require('discount');
      } catch (err) {
        try {
          md = require('markdown-js');
        } catch (err) {
          try {
            md = require('marked');
          } catch (err) {
            throw new
              Error('Cannot find markdown library, install markdown, discount, or marked.');
          }
        }
      }
    }

    str = str.replace(/\\n/g, '\n');
    return md.parse(str).replace(/\n/g, '\\n').replace(/'/g,'&#39;');
  },

  /**
   * Transform coffeescript to javascript.
   */

  coffeescript: function(str){
    str = str.replace(/\\n/g, '\n');
    var js = require('coffee-script').compile(str).replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
    return '<script type="text/javascript">\\n' + js + '</script>';
  },

  /**
  * Transform [PlantUml](http://plantuml.sourceforge.net/) to svg
  */
  plantuml: function (str) {
      var out  = '/tmp/',
          stamp= Date.now(),
          name = 'jade-plantuml-' + stamp + '.svg',
          svg  = out + '/' + name,
          buf  = new Buffer(
                  "@startuml " + name + "\n" +
                  str.replace(/\\n/g, '\n') + "\n" +
                  '@enduml\n'
              ),
          uml  = '/tmp/jade-plantuml-' + stamp + '.plantuml',
          fd   = fs.openSync(uml, "w"),
          wr   = fs.writeSync(fd, buf, 0, buf.length, 0),
          cl   = fs.closeSync(fd),
          cmd  = 'java -jar ' + (process.env.PLANTUML ||
              (process.env.HOME + '/lib/java/plantuml.jar')) +
              ' -tsvg -o /tmp ' + uml,
          run = execSync(cmd),
          data = fs.readFileSync(svg),
          i,
          datstr = data.toString().replace(/\\/g, '\\\\'),
          lines = datstr.split(/[\n\r]+/);

      fs.unlinkSync(uml);
      fs.unlinkSync(svg);

      collect = 0
      collected = []
      for (i = 0; i < lines.length; i += 1) {
          var line = lines[i];
          if (!collect && /^<svg/.test(line)) {
              i += 1;
              collect = 1
              collected.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">');
              continue;
          }
          if (/^\s*<!--.*-->\s*$/.test(line)) {
              continue;
          }
          if (collect) {
              collected.push(line);
          }

      }
      return '<div class="svg">' + collected.join('\\n') + '</div>';
  },

  /**
  * Transform a set of scripts
  *
  * :exec
  *    perl -pe s/food/Chop Suey/g $@
  */
  exec: function (str) {
      var lines = str.split(/[\r\n]+/),
          dir = '/tmp',
          filename = 'jade-exec-' + Date.now() + '.lines',
          tmpfile = dir + '/' + filename,
          cmd = lines.shift().replace(/^\s+|\s+$/g, '');

      if (/\$@/.test(cmd) && ! /-\s*$/.test(cmd)) {
          cmd = cmd.replace('$@', tmpfile);
      } else {
          cmd = cmd + ' ' + tmpfile;
      }

      var buf = new Buffer(lines.join('\n')),
          fd   = fs.openSync(tmpfile, "w"),
          wr   = fs.writeSync(fd, buf, 0, buf.length, 0),
          cl   = fs.closeSync(fd),
          data = execSync(cmd).toString()
                              .replace(/\\/g, '\\\\')
                              .replace(/\n/g, '\\n');
      fs.unlinkSync(tmpfile);
      return data;
  }

};
