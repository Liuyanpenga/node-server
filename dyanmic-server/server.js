var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号 \nnode server.js xxxx')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  console.log('请求发过来了 路径（带查询参数）为：' + pathWithQuery)

  response.statusCode = 200
  const filePath = path === '/' ? '/index.html' : path
  const index = filePath.lastIndexOf('.')
  const suffix = filePath.substring(index)
  const fileTypes = {
    '.html':'text/html',
    '.css':'text/css',
    '.js':'text/javascript',
    '.png':'text/png'
  }
  response.setHeader('Content-Type', `${fileTypes[suffix] || 'text/html'};charset=utf-8`)
  let content
  try {
    content = fs.readFileSync(`./public${filePath}`)
  } catch (error) {
    content = "文件不存在"
    response.statusCode = 200
  }
  response.write(content)
  response.end()
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请打开 http://localhost:' + port)