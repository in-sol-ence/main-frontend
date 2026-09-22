# Local preview of dist/ that never lets the browser keep a stale copy.
# Usage: python scripts/serve.py [port]   (default 4176)
import functools
import http.server
import pathlib
import sys


class _NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4176
root = pathlib.Path(__file__).resolve().parent.parent / 'dist'
handler = functools.partial(_NoCache, directory=str(root))
print(f'Serving {root} at http://localhost:{port}')
http.server.ThreadingHTTPServer(('', port), handler).serve_forever()
