// Learn more https://docs.expo.dev/router/reference/static-rendering/#root-html

import { ScrollViewStyleReset } from "expo-router/html";

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <style
          dangerouslySetInnerHTML={{
            __html: `@media (max-width: 768px) {
              html {
                -webkit-text-size-adjust: 100%;
                text-size-adjust: 100%;
              }

              input,
              textarea,
              select {
                font-size: 16px !important;
              }
            }`,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              var uaData = navigator.userAgentData;
              var isMobileByUAData = !!(uaData && uaData.mobile);
              var isMobileByUA = /Mobi|Android|iPhone|iPod|iPad/i.test(navigator.userAgent);
              if (!isMobileByUAData && !isMobileByUA) {
                return;
              }

              var viewport = document.querySelector('meta[name="viewport"]');
              if (!viewport) {
                return;
              }

              viewport.setAttribute(
                'content',
                'width=device-width, initial-scale=0.70, minimum-scale=0.70, maximum-scale=0.70, user-scalable=no, viewport-fit=cover',
              );
            })();`,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `(function (m, a, z, e) {
              var s, t, u, v;
              try {
                t = m.sessionStorage.getItem('maze-us');
              } catch (err) {}
              if (!t) {
                t = new Date().getTime();
                try {
                  m.sessionStorage.setItem('maze-us', t);
                } catch (err) {}
              }
              u = document.currentScript || (function () {
                var w = document.getElementsByTagName('script');
                return w[w.length - 1];
              })();
              v = u && u.nonce;
              s = a.createElement('script');
              s.src = z + '?apiKey=' + e;
              s.async = true;
              if (v) s.setAttribute('nonce', v);
              a.getElementsByTagName('head')[0].appendChild(s);
              m.mazeUniversalSnippetApiKey = e;
            })(window, document, 'https://snippet.maze.co/maze-universal-loader.js', '506db8ca-0170-4634-9863-2cd86df960ba');`,
          }}
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
