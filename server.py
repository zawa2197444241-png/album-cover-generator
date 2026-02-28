import http.server
import socketserver
import json
import base64
import subprocess
import sys
import os

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/generate_cover.py':
            # 读取请求数据
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # 提取参数
            album_title = data.get('album_title', '专辑名称')
            artist_name = data.get('artist_name', '歌手名')
            user_image = data.get('user_image', '')
            
            # 移除base64前缀
            if user_image.startswith('data:image/'):
                user_image = user_image.split(',')[1]
            
            # 调用generate_cover.py脚本
            try:
                result = subprocess.run(
                    [sys.executable, 'generate_cover.py', album_title, artist_name, user_image],
                    capture_output=True,
                    text=True,
                    cwd=os.path.dirname(os.path.abspath(__file__))
                )
                
                if result.returncode == 0:
                    # 发送响应
                    self.send_response(200)
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(result.stdout.encode('utf-8'))
                else:
                    # 发送错误响应
                    self.send_response(500)
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(result.stderr.encode('utf-8'))
            except Exception as e:
                # 发送错误响应
                self.send_response(500)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
        else:
            # 处理其他请求
            super().do_GET()

# 启动服务器
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"服务器运行在 http://localhost:{PORT}")
    httpd.serve_forever()
