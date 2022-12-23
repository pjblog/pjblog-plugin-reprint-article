import type { Context, Next } from 'koa';
import { readdirSync, existsSync, statSync, createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'node:url';

interface IAssets {
  js: {
    matcher: string,
    filename: string,
  },
  css: {
    matcher: string,
    filename: string,
  }
}

const advanceDictionary = resolve(__dirname, '../../dist/advance');
const assets: IAssets = {
  js: {
    matcher: null,
    filename: null,
  },
  css: {
    matcher: null,
    filename: null,
  }
}

if (existsSync(advanceDictionary)) {
  const files = readdirSync(advanceDictionary);
  files.forEach(file => {
    const filename = resolve(advanceDictionary, file);
    const stat = statSync(filename);
    if (stat.isFile()) {
      if (file.endsWith('.js') && !assets.js.filename) {
        assets.js.matcher = '/' + file;
        assets.js.filename = filename;
      } else if (file.endsWith('.css') && !assets.css.filename) {
        assets.css.matcher = '/' + file;
        assets.css.filename = filename;
      }
    }
  })
}

export default (namespace: string, url?: string) => {
  return async (ctx: Context, next: Next) => {
    if (!url || url === '/index.html') {
      ctx.type = '.html';
      ctx.body = createIndexHTML(namespace, assets.js.matcher, assets.css.matcher);
    } else {
      const location = parse(url);
      const pathname = location.pathname;
      if (pathname === assets.js.matcher) {
        ctx.type = '.js';
        ctx.body = createReadStream(assets.js.filename);
      } else if (pathname === assets.css.matcher) {
        ctx.type = '.css';
        ctx.body = createReadStream(assets.css.filename);
      } else {
        await next();
      }
    }
  }
}

function createIndexHTML(namespace: string, js: string, css: string) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <script type="module" crossorigin src="/~/plugin/${namespace}${js}" entry></script>
      <link rel="stylesheet" href="/~/plugin/${namespace}${css}">
    </head>
    <body>
      <div id="app"></div>
    </body>
  </html>`
}