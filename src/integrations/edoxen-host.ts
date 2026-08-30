import type { AstroIntegration } from 'astro'
import browserDefault from '@edoxen/browser/integration'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const edoxenRoot = dirname(require.resolve('@edoxen/browser/package.json'))
const pagesRootDir = resolve(edoxenRoot, 'src/astro/pages')

const routes: Array<[string, string]> = [
  ['/decisions', 'decisions/index.astro'],
  ['/decisions/[urn]', 'decisions/[urn].astro'],
  ['/meetings', 'meetings/index.astro'],
  ['/meetings/[urn]', 'meetings/[urn].astro'],
]

// Theme bridge: the site toggles `.dark` on <html> with localStorage key
// 'theme'; edoxen toggles data-theme with key 'edoxen-theme'. Without
// bridging, the two halves of the site remember different themes. This
// inline script keeps both keys equal at every write and reconciles the
// live attributes on load.
const themeBridge = `(function(){try{
var raw=Storage.prototype.setItem;
var read=function(k){try{return localStorage.getItem(k)}catch(e){return null}};
var eff=read('edoxen-theme')||read('theme');
var dark=eff==='dark'||(eff!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var v=dark?'dark':'light';
try{raw.call(localStorage,'theme',v);raw.call(localStorage,'edoxen-theme',v)}catch(e){}
Storage.prototype.setItem=function(k,val){try{raw.call(this,k,val)}catch(e){}
if(k==='theme'||k==='edoxen-theme'){try{raw.call(this,'theme',val);raw.call(this,'edoxen-theme',val)}catch(e){}}};
var de=document.documentElement;
if(de.hasAttribute('data-theme'))de.setAttribute('data-theme',v);
de.classList.toggle('dark',dark);
}catch(e){}})()`

// Host wrapper: the underlying @edoxen/browser integration runs with
// injectRoutes:false so it doesn't collide with the site's own /, /about,
// /404 routes. This wrapper then re-injects only the routes the site
// actually wants from edoxen — decisions and meetings.
export default function edoxenHost(config: unknown): AstroIntegration {
  const underlying = browserDefault({ config, injectRoutes: false })

  return {
    name: 'edoxen-host',
    hooks: {
      ...underlying.hooks,
      'astro:config:setup': async (ctx) => {
        await underlying.hooks['astro:config:setup']?.(ctx as never)
        ctx.injectScript('head-inline', themeBridge)
        for (const [pattern, file] of routes) {
          ctx.injectRoute({
            pattern,
            entrypoint: pathToFileURL(resolve(pagesRootDir, file)),
          })
        }
      },
    },
  }
}
