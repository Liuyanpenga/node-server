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

  const session = JSON.parse(fs.readFileSync('./session.json').toString())
  console.log('请求发过来了 路径（带查询参数）为：' + pathWithQuery)

  response.statusCode = 200
  if (path === '/login' && method === 'POST') {
    response.setHeader('Content-type', 'text/html,charset=UTF-8')
    // 读数据库数据
    const userArr = JSON.parse(fs.readFileSync('./db/user.json'))
    const arr = []
    // 获取请求的数据 data
    request.on("data", chunk => {
      arr.push(chunk)
    })
    // 请求结束后做的事 end
    request.on('end', () => {
      // 将数组中多个buf依次拼接得到一个新buf
      const string = Buffer.concat(arr).toString()
      const obj = JSON.parse(string)
      const lastUser = userArr[userArr.length - 1]
      const addUser = {
        id: lastUser ? lastUser.id + 1 : 1,
        name: obj.name,
        password: obj.password
      }
      userArr.push(addUser)
      // 写入数据库
      fs.writeFileSync('./db/user.json', JSON.stringify(userArr))
    })
    response.end()
  } else if (path === '/sign_in' && method === 'POST') {
    response.setHeader('Content-type', 'text/html,charset=UTF-8')
    const userArr = JSON.parse(fs.readFileSync('./db/user.json'))
    const arr = []
    request.on("data", chunk => {
      arr.push(chunk)
    })
    request.on('end', () => {
      const string = Buffer.concat(arr).toString()
      const obj = JSON.parse(string)
      const user = userArr.find(user => user.name === obj.name && user.password === obj.password)
      if (user === undefined) {
        response.statusCode = 400
        response.setHeader('Content-type', 'text/json,charset=UTF-8')
        response.end(`{ "errorCode": 4001 }`)
      } else {
        response.statusCode = 200
        const random = Math.random()
        session[random] = {user_id:user.id}
        fs.writeFileSync('./session.json',JSON.stringify(session))
        // 用cookie来记录 ID
        response.setHeader('Set-Cookie', `session_id=${random};HttpOnly`)
        response.end()
      }
    })
  } else if (path === '/index.html') {
    const cookie = request.headers.cookie
    let sessionId
    try {
      sessionId = cookie.split(',').filter(string => string.indexOf('session_id') >= 0)[0].split('=')[1]
    } catch (error) { }
    if (sessionId && session[sessionId]) {
      const userId = session[sessionId].user_id
      const userArr = JSON.parse(fs.readFileSync('./db/user.json'))
      const user = userArr.find(user => user.id === userId)
      const string = fs.readFileSync('./public/index.html').toString()
      let newString
      if (user) {
        newString = string.replace('{{userStatus}}', '已登录').replace('{{userName}}', user.name)
      } else {
        newString = string.replace('{{userStatus}}', '未登录').replace('{{userName}}', '')
      }
      response.write(newString)
    } 
    response.end()
  } else {
    const filePath = path === '/' ? '/index.html' : path
    const index = filePath.lastIndexOf('.')
    const suffix = filePath.substring(index)
    const fileTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.png': 'text/png'
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
  }
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请打开 http://localhost:' + port)