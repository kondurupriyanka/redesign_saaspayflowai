const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8080;

const publicDir = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  let fullPath = path.join(publicDir, filePath);
  
  // If file doesn't exist, try src/index.html
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(__dirname, 'src/index.html');
  }
  
  const ext = path.extname(fullPath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
