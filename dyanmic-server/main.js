var fs = require('fs')

// 读数据 read
const string = fs.readFileSync('./db/user.json').toString()
const array = JSON.parse(string)

// 写数据 write
const user = {id:3,name:'alan',password:'321'}
array.push(user)
const addString = JSON.stringify(array)
fs.writeFileSync('./db/user.json',addString)