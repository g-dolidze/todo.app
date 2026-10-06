import type { Plugin, Rolldown } from 'vite';

type OutputBundle = Rolldown.OutputBundle;
type OutputChunk = Rolldown.OutputChunk;

/**
 * Lazy routes normally load in a waterfall: main chunk → (runs) → page chunk. On a slow
 * phone that second round trip delays the first paint. This plugin writes a tiny inline
 * script into index.html that, for the URL being opened, starts downloading that page's
 * chunks immediately, in parallel with the main chunk (TDD §14.6 performance budget).
 *
 * `routes` maps a URL path to the page module that renders it.
 */
export function routePreload(routes: Record<string, string>): Plugin {
  return {
    name: 'progress:route-preload',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle as OutputBundle | undefined;
        if (!bundle) return html;
        const chunks = Object.values(bundle).filter(
          (item): item is OutputChunk => item.type === 'chunk',
        );
        const byModule = (suffix: string) =>
          chunks.find((chunk) => chunk.facadeModuleId?.endsWith(suffix));

        // Files a page needs: its own chunk plus every chunk it imports statically.
        const filesFor = (entry: OutputChunk) => {
          const seen = new Set<string>();
          const visit = (fileName: string) => {
            if (seen.has(fileName)) return;
            seen.add(fileName);
            const chunk = bundle[fileName];
            if (chunk?.type === 'chunk') chunk.imports.forEach(visit);
          };
          visit(entry.fileName);
          return [...seen];
        };

        const map: Record<string, string[]> = {};
        for (const [path, module] of Object.entries(routes)) {
          const entry = byModule(module);
          if (!entry) throw new Error(`routePreload: no chunk for ${module}`);
          map[path] = filesFor(entry).map((file) => `/${file}`);
        }

        const script = `(function(){var m=${JSON.stringify(map)};var p=location.pathname.replace(/\\/+$/,'')||'/';(m[p]||[]).forEach(function(h){var l=document.createElement('link');l.rel='modulepreload';l.href=h;document.head.appendChild(l);});})();`;
        // Before the first stylesheet or module script: an inline script placed after a
        // stylesheet waits for it to load. (After the <meta> tags, so charset stays first.)
        const tag = `<script>${script}</script>\n    `;
        const anchor = html.search(/<link[^>]+rel="stylesheet"|<script type="module"/);
        if (anchor === -1)
          throw new Error('routePreload: no stylesheet or module script in index.html');
        return html.slice(0, anchor) + tag + html.slice(anchor);
      },
    },
  };
}
