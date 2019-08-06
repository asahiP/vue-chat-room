import * as Koa from 'koa2'
import * as KoaStatic from 'koa-static'
import * as Bodyparser from 'koa-bodyparser'
import * as Router from 'koa-router'
import * as http from 'http'
import * as SocketIO from 'socket.io'
import { join } from 'path'
import { readFileSync, existsSync, mkdirSync, rmdir, writeFileSync, readdirSync, statSync, unlinkSync } from 'fs'
import { networkInterfaces } from 'os'

const app = new Koa()
const router = new Router()
const staticPath = './dist'
const tmpPath = join(__dirname, staticPath, 'tmp')
const port = 8080
const IMG_MAX_SIZE = 1 * 1024 * 1024

// Map<roomName, activities>
const activeUser: Map<string, number> = new Map()
// Map<socketID, userUniqID>
const userMap: Map<string, IuserMap> = new Map()
// Map<roomName, roomData>
const roomList: IroomList = {}
// Map<userUniqID, roomName[]>
const userList: Map<string, string[]> = new Map()
// Map<roomName, roomPass>
const roomMap: Map<string, string> = new Map()

router.get('/', async (ctx, next) => {
  let html = await readFileSync(join(staticPath ,'index.html'), 'binary')
  ctx.body = html
  await next()
})

router.post('/createRoom', async (ctx, next) => {
  let room: Iroom = ctx.request.body
  let { pass, ...profile } = room
  let { name } = room
  roomList[name] = profile

  lobby.emit('newLobby', Object.values(roomList))
  
  if (typeof pass === 'string') {
    roomMap.set(name, pass)
  }

  ctx.status = 201
  await next()
})

router.post('/joinPrivateRoom', async (ctx, next) => {
  let { token, roomName } = ctx.request.body
  let result = ''

  if (token === roomMap.get(roomName)) {
    result = 'correct'
  } else {
    result = 'incorrect'
  }

  ctx.status = 200
  ctx.body = result
  await next()
})

app.use(Bodyparser())
app.use(KoaStatic(
  join(__dirname, staticPath)
))
app.use(router.routes())

const server = http.createServer(app.callback())
const lobby = SocketIO(server, { path: '/lobby' })
const chat = SocketIO(server, { path: '/chat' })

lobby.on('connection', socket => {
  socket.on('update', () => {
    socket.emit('newLobby', Object.values(roomList))
  })
})

chat.on('connection', socket => {
  socket.on('join', ({ uid, roomName, userName }) => {
    userMap.set(socket.id, { uid, name: userName })

    let active = activeUser.get(roomName) || 0
    activeUser.set(roomName, active + 1)

    let roomlist: string[] = userList.get(uid) || []
    userList.set(uid, [...roomlist, roomName])

    socket.join(roomName)
    chat.in(roomName).emit('onMessage', {
      uid,
      name: userName,
      date: Date.now(),
      type: 'notice',
      msg: `${userName} entered room. Active: ${active} => ${active + 1}.`,
      roomName
    })
  })

  socket.on('leave', async ({ uid, roomName, userName }) => {
    let active = activeUser.get(roomName) || 0
    activeUser.set(roomName, active - 1)

    let roomlist: string[] = userList.get(uid) || []
    userList.set(uid, roomlist.filter(i => i !== roomName))

    socket.leave(roomName)
    chat.in(roomName).emit('onMessage', {
      uid,
      name: userName,
      date: Date.now(),
      type: 'notice',
      msg: `${userName} left room. Active: ${active} => ${active - 1}.`,
      roomName
    })

        
    if (active - 1 === 0) {
      delete roomList[roomName]
      lobby.emit('newLobby', Object.values(roomList))

      let roomPath = join(tmpPath, roomName)
      await removeDir(roomPath)
    }
  })

  socket.on('send', async (data: Ihistory) => {
    let { type, roomName } = data
    let msg: Ihistory
    switch (type) {
      case 'msg':
        msg = Object.assign({}, data, { date: Date.now() })
        break
      case 'img':
        let { MD5, src } = data
        let roomPath = join(tmpPath, roomName)
        let imgPath = join(roomPath, MD5)
        let
          fileHead8Byte = src.slice(0, 8).toString('hex').toUpperCase(),
          fileHead4Byte = fileHead8Byte.slice(0, 4 * 2),
          fileHead2Byte = fileHead8Byte.slice(0, 2 * 2),
          jpegFileHeadArr = [
            'FFD8FFE0',
            'FFD8FFE1',
            'FFD8FFE2',
            'FFD8FFE3',
            'FFD8FFE8',
          ],
          pngFileHead = '89504E470D0A1A0A',
          gifFileHead = '47494638',
          webpFileHead = '52494646',
          bmpFileHead = '424D',
          MIMEType = ''

        switch(true) {
          case fileHead8Byte === pngFileHead:
            MIMEType = 'image/png'
            break
          case jpegFileHeadArr.includes(fileHead4Byte):
            MIMEType = 'image/jpeg'
            break
          case fileHead4Byte === gifFileHead:
            MIMEType = 'image/gif'
            break
          case fileHead4Byte === webpFileHead:
            MIMEType = 'image/webp'
            break
          case fileHead2Byte === bmpFileHead:
            MIMEType = 'image/bmp'
        }

        if (src.length > IMG_MAX_SIZE || MIMEType === '') return
        
        if (!await existsSync(roomPath)) {
          try {
            await mkdirSync(roomPath)
            console.log(`can not find folder: ${roomPath}, created now.`)
          } catch (e) {
            console.log(e)
          }
        }

        if (!await existsSync(imgPath)) {
          try {
            await writeFileSync(imgPath, src, { encoding: 'binary' })
            console.log(`created img: ${imgPath}.`)
          } catch (e) {
            console.log(e)
          }
        }

        msg = Object.assign({}, data, { date: Date.now(), src: `/tmp/${roomName}/${MD5}` })
    }
    
    socket.to(roomName).emit('onMessage', msg)
  })

  socket.on('disconnect', () => {
    let map = userMap.get(socket.id)
    if (map) {
      let { name: userName, uid } = map
  
      userList.get(uid).forEach(async roomName => {
        let active = activeUser.get(roomName) || 0
        activeUser.set(roomName, active - 1)
    
        socket.leave(roomName)
        chat.in(roomName).emit('onMessage', {
          uid,
          name: userName,
          date: Date.now(),
          type: 'notice',
          msg: `${userName} left room. Active: ${active} => ${active - 1}.`,
          roomName
        })
        
        if (active - 1 === 0) {
          delete roomList[roomName]
          lobby.emit('newLobby', Object.values(roomList))
    
          let roomPath = join(tmpPath, roomName)
          await removeDir(roomPath)
        }
      })
  
      userList.delete(userName)
      userMap.delete(socket.id)
    }
  })
})

server.listen(port)

;(() => {
  if (!existsSync(tmpPath)) {
    try {
      mkdirSync(tmpPath)
      console.log(`can not find folder: ${tmpPath}, created now.`)
    } catch (e) {
      console.log(e)
    }
  }
  
  let iFace = networkInterfaces()

  Object.keys(iFace)
    .filter(key => key !== 'lo')
    .forEach(key => {
      let local = iFace[key][0]
      if (local.family === 'IPv4' && local.internal === false) {
        console.log(`Server running at http://${local.address}:${port}/`)
      }
    })
})();

async function removeDir (path: string): Promise<boolean> {
  return new Promise(async (res, rej) => {
    if (existsSync(path)) {
      let list = await readdirSync(path)

      console.log(`\nstart remove: ${path}.`)
      list.forEach((filename: string) => {
        let file = join(path, filename)

        if (statSync(file).isDirectory()) {
          console.log(`${file} is a directory, start traversing.`)
          removeDir(file)
        } else {
          unlinkSync(file)
          console.log(`  - removed ${file}.`)
        }
      })

      rmdir(path, e => {
        if (e) {
          rej(e)
        } else {
          console.log(`- removed ${path}.`)
          res(true)
        }
      })
    } else {
      res(false)
    }
  })
}

interface IroomList {
  [key: string]: Iroom
}

interface IuserMap {
  uid: string,
  name: string
}

/**
 * @param {string} name - Room uniqID
 * @param {string} title - Room Title
 * @param {string} host - Room Host name
 * @param {string} hostID - Host uniqID
 * @param {string} icon - Host Avatar
 * @param {string} isLock - is Private Room
 * @param {boolean} hasUnread - has unread msg
 * @param {array} history - chat history
 * @param {string} pass Room password
 */
interface Iroom {
  name: string,
  title: string,
  host: string,
  hostID: string,
  icon: string,
  isLock: boolean,
  hasUnread: boolean,
  history: Ihistory[],
  pass?: string | boolean,
}

/**
 * @param {string} uid - user uniqID
 * @param {string} name - user name
 * @param {string} avatar - user avatar
 * @param {string} msg - message
 * @param {number} date - send time
 * @param {string} type - message type { msg | notice | img }
 * @param {string} src - img blob url
 * @param {string} MD5 - img MD5
 * @param {string} roomName - room uniqID
 */
interface Ihistory {
  uid: string,
  name: string,
  avatar: string,
  msg: string,
  date: number,
  type: string,
  src?: Buffer,
  MD5?: string,
  roomName: string,
}