#!/usr/bin/env python3
"""Static server with no-cache headers for development."""
import http.server
import socketserver
import mimetypes

PORT = 8080

mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving on http://localhost:{PORT}")
    httpd.serve_forever()
