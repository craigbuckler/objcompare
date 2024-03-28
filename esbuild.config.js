// esbuild CSS and JS bundling
import esbuild from 'esbuild';
import pkg from './package.json' assert {type: 'json'};

const cfg = {
  dev         : (process.env.NODE_ENV === 'development'),
  version     : pkg.version,
  srcDir      : process.env.SOURCE_DIR || './src/',
  buildDir    : process.env.BUILD_DIR || './build/',
  servePort   : Number(process.env.SERVE_PORT) || 8000,
  target      : (process.env.BROWSER_TARGET || '').split(',')
};

console.log(`${ cfg.dev ? 'development' : 'production' } build`);


// CMS data import
const
  banner = { js: '// by Craig Buckler, craigbuckler.com', css: '/* by Craig Buckler, craigbuckler.com */' },
  footer = { js: '', css: '' },
  define = {
    '__DEV__': String(cfg.dev),
    '__VERSION__': `'${ cfg.version }'`
  };


// minify production code
if (!cfg.dev) {
  banner.css = minify(banner.css);
  banner.js = minify(banner.js);
  footer.css = minify(footer.css);
  footer.js = minify(footer.js);
}


// copy HTML
const buildHTML = await esbuild.context({

  entryPoints: [ `${ cfg.srcDir }html/*.html` ],
  bundle: false,
  loader: {
    '.html': 'copy'
  },
  logLevel: cfg.dev ? 'info' : 'error',
  outdir: `${ cfg.buildDir }`

});


// bundle CSS
const buildCSS = await esbuild.context({

  entryPoints: [ `${ cfg.srcDir }css/main.css` ],
  bundle: true,
  target: cfg.target,
  external: ['../media/*'],
  loader: {
    '.woff2': 'copy',
    '.png': 'copy',
    '.jpg': 'copy',
    '.svg': 'dataurl'
  },
  banner,
  footer,
  logLevel: cfg.dev ? 'info' : 'error',
  minify: !cfg.dev,
  sourcemap: cfg.dev && 'linked',
  outdir: `${ cfg.buildDir }css/`

});


// bundle JS
const buildJS = await esbuild.context({

  entryPoints: [ `${ cfg.srcDir }js/main.js` ],
  format: 'esm',
  bundle: true,
  external: [],
  target: cfg.target,
  define,
  banner,
  footer,
  drop: cfg.dev ? [] : ['debugger', 'console'],
  logLevel: cfg.dev ? 'info' : 'error',
  minify: !cfg.dev,
  sourcemap: cfg.dev && 'linked',
  outdir: `${ cfg.buildDir }js/`

});


if (cfg.dev) {

  // watch for file changes
  await buildHTML.watch();
  await buildCSS.watch();
  await buildJS.watch();

  // development server
  await buildCSS.serve({
    port: cfg.servePort,
    servedir: cfg.buildDir
  });

}
else {

  // single build
  await buildHTML.rebuild();
  buildHTML.dispose();

  await buildCSS.rebuild();
  buildCSS.dispose();

  await buildJS.rebuild();
  buildJS.dispose();

}


// minify code
function minify(code) {

  return code
    .replace(/\n+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*(\{|:|;|,)\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

}
