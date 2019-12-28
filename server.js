"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var Koa = require("koa2");
var KoaStatic = require("koa-static");
var Bodyparser = require("koa-bodyparser");
var Router = require("koa-router");
var http = require("http");
var SocketIO = require("socket.io");
var path_1 = require("path");
var fs_1 = require("fs");
var os_1 = require("os");
var app = new Koa();
var router = new Router();
var staticPath = './dist';
var tmpPath = path_1.join(__dirname, staticPath, 'tmp');
var port = 8080;
var IMG_MAX_SIZE = 1 * 1024 * 1024;
// Map<roomName, activities>
var activeUser = new Map();
// Map<socketID, userUniqID>
var userMap = new Map();
// Map<roomName, roomData>
var roomList = {};
// Map<userUniqID, roomName[]>
var userList = new Map();
// Map<roomName, roomPass>
var roomMap = new Map();
router.get('/', function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var html;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.readFileSync(path_1.join(staticPath, 'index.html'), 'binary')];
            case 1:
                html = _a.sent();
                ctx.body = html;
                return [4 /*yield*/, next()];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
router.post('/createRoom', function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var room, pass, profile, name;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                room = ctx.request.body;
                pass = room.pass, profile = __rest(room, ["pass"]);
                name = room.name;
                roomList[name] = profile;
                lobby.emit('newLobby', Object.values(roomList));
                if (typeof pass === 'string') {
                    roomMap.set(name, pass);
                }
                ctx.status = 201;
                return [4 /*yield*/, next()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
router.post('/joinPrivateRoom', function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, token, roomName, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = ctx.request.body, token = _a.token, roomName = _a.roomName;
                result = '';
                if (token === roomMap.get(roomName)) {
                    result = 'correct';
                }
                else {
                    result = 'incorrect';
                }
                ctx.status = 200;
                ctx.body = result;
                return [4 /*yield*/, next()];
            case 1:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
app.use(Bodyparser());
app.use(KoaStatic(path_1.join(__dirname, staticPath)));
app.use(router.routes());
var server = http.createServer(app.callback());
var lobby = SocketIO(server, { path: '/lobby' });
var chat = SocketIO(server, { path: '/chat' });
lobby.on('connection', function (socket) {
    socket.on('update', function () {
        socket.emit('newLobby', Object.values(roomList));
    });
});
chat.on('connection', function (socket) {
    socket.on('join', function (_a) {
        var uid = _a.uid, roomName = _a.roomName, userName = _a.userName;
        userMap.set(socket.id, { uid: uid, name: userName });
        var active = activeUser.get(roomName) || 0;
        activeUser.set(roomName, active + 1);
        var roomlist = userList.get(uid) || [];
        userList.set(uid, __spreadArrays(roomlist, [roomName]));
        socket.join(roomName);
        chat["in"](roomName).emit('onMessage', {
            uid: uid,
            name: userName,
            date: Date.now(),
            type: 'notice',
            msg: userName + " entered room",
            roomName: roomName
        });
    });
    socket.on('leave', function (_a) {
        var uid = _a.uid, roomName = _a.roomName, userName = _a.userName;
        return __awaiter(void 0, void 0, void 0, function () {
            var active, roomlist, roomPath;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        active = activeUser.get(roomName) || 0;
                        activeUser.set(roomName, active - 1);
                        roomlist = userList.get(uid) || [];
                        userList.set(uid, roomlist.filter(function (i) { return i !== roomName; }));
                        socket.leave(roomName);
                        chat["in"](roomName).emit('onMessage', {
                            uid: uid,
                            name: userName,
                            date: Date.now(),
                            type: 'notice',
                            msg: userName + " left room",
                            roomName: roomName
                        });
                        if (!(active - 1 === 0)) return [3 /*break*/, 2];
                        delete roomList[roomName];
                        lobby.emit('newLobby', Object.values(roomList));
                        roomPath = path_1.join(tmpPath, roomName);
                        return [4 /*yield*/, removeDir(roomPath)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    });
    socket.on('send', function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var type, roomName, msg, _a, MD5, src, roomPath, imgPath, fileHead8Byte, fileHead4Byte, fileHead2Byte, jpegFileHeadArr, pngFileHead, gifFileHead, webpFileHead, bmpFileHead, MIMEType, e_1, e_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    type = data.type, roomName = data.roomName;
                    _a = type;
                    switch (_a) {
                        case 'msg': return [3 /*break*/, 1];
                        case 'img': return [3 /*break*/, 2];
                    }
                    return [3 /*break*/, 13];
                case 1:
                    msg = Object.assign({}, data, { date: Date.now() });
                    return [3 /*break*/, 13];
                case 2:
                    MD5 = data.MD5, src = data.src;
                    roomPath = path_1.join(tmpPath, roomName);
                    imgPath = path_1.join(roomPath, MD5);
                    fileHead8Byte = src.slice(0, 8).toString('hex').toUpperCase(), fileHead4Byte = fileHead8Byte.slice(0, 4 * 2), fileHead2Byte = fileHead8Byte.slice(0, 2 * 2), jpegFileHeadArr = [
                        'FFD8FFE0',
                        'FFD8FFE1',
                        'FFD8FFE2',
                        'FFD8FFE3',
                        'FFD8FFE8',
                    ], pngFileHead = '89504E470D0A1A0A', gifFileHead = '47494638', webpFileHead = '52494646', bmpFileHead = '424D', MIMEType = '';
                    switch (true) {
                        case fileHead8Byte === pngFileHead:
                            MIMEType = 'image/png';
                            break;
                        case jpegFileHeadArr.includes(fileHead4Byte):
                            MIMEType = 'image/jpeg';
                            break;
                        case fileHead4Byte === gifFileHead:
                            MIMEType = 'image/gif';
                            break;
                        case fileHead4Byte === webpFileHead:
                            MIMEType = 'image/webp';
                            break;
                        case fileHead2Byte === bmpFileHead:
                            MIMEType = 'image/bmp';
                    }
                    if (src.length > IMG_MAX_SIZE || MIMEType === '')
                        return [2 /*return*/];
                    return [4 /*yield*/, fs_1.existsSync(roomPath)];
                case 3:
                    if (!!(_b.sent())) return [3 /*break*/, 7];
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, fs_1.mkdirSync(roomPath)];
                case 5:
                    _b.sent();
                    console.log("can not find folder: " + roomPath + ", created now.");
                    return [3 /*break*/, 7];
                case 6:
                    e_1 = _b.sent();
                    console.log(e_1);
                    return [3 /*break*/, 7];
                case 7: return [4 /*yield*/, fs_1.existsSync(imgPath)];
                case 8:
                    if (!!(_b.sent())) return [3 /*break*/, 12];
                    _b.label = 9;
                case 9:
                    _b.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, fs_1.writeFileSync(imgPath, src, { encoding: 'binary' })];
                case 10:
                    _b.sent();
                    console.log("created img: " + imgPath + ".");
                    return [3 /*break*/, 12];
                case 11:
                    e_2 = _b.sent();
                    console.log(e_2);
                    return [3 /*break*/, 12];
                case 12:
                    msg = Object.assign({}, data, { date: Date.now(), src: "/tmp/" + roomName + "/" + MD5 });
                    _b.label = 13;
                case 13:
                    socket.to(roomName).emit('onMessage', msg);
                    return [2 /*return*/];
            }
        });
    }); });
    socket.on('disconnect', function () {
        var map = userMap.get(socket.id);
        if (map) {
            var userName_1 = map.name, uid_1 = map.uid;
            userList.get(uid_1).forEach(function (roomName) { return __awaiter(void 0, void 0, void 0, function () {
                var active, roomPath;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            active = activeUser.get(roomName) || 0;
                            activeUser.set(roomName, active - 1);
                            socket.leave(roomName);
                            chat["in"](roomName).emit('onMessage', {
                                uid: uid_1,
                                name: userName_1,
                                date: Date.now(),
                                type: 'notice',
                                msg: userName_1 + " left room",
                                roomName: roomName
                            });
                            if (!(active - 1 === 0)) return [3 /*break*/, 2];
                            delete roomList[roomName];
                            lobby.emit('newLobby', Object.values(roomList));
                            roomPath = path_1.join(tmpPath, roomName);
                            return [4 /*yield*/, removeDir(roomPath)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            }); });
            userList["delete"](userName_1);
            userMap["delete"](socket.id);
        }
    });
});
server.listen(port);
(function () {
    if (!fs_1.existsSync(tmpPath)) {
        try {
            fs_1.mkdirSync(tmpPath);
            console.log("can not find folder: " + tmpPath + ", created now.");
        }
        catch (e) {
            console.log(e);
        }
    }
    var iFace = os_1.networkInterfaces();
    Object.keys(iFace)
        .filter(function (key) { return key !== 'lo'; })
        .forEach(function (key) {
        var local = iFace[key][0];
        if (local.family === 'IPv4' && local.internal === false) {
            console.log("Server running at http://" + local.address + ":" + port + "/");
        }
    });
})();
function removeDir(path) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (res, rej) { return __awaiter(_this, void 0, void 0, function () {
                    var list;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!fs_1.existsSync(path)) return [3 /*break*/, 2];
                                return [4 /*yield*/, fs_1.readdirSync(path)];
                            case 1:
                                list = _a.sent();
                                console.log("\nstart remove: " + path + ".");
                                list.forEach(function (filename) {
                                    var file = path_1.join(path, filename);
                                    if (fs_1.statSync(file).isDirectory()) {
                                        console.log(file + " is a directory, start traversing.");
                                        removeDir(file);
                                    }
                                    else {
                                        fs_1.unlinkSync(file);
                                        console.log("  - removed " + file + ".");
                                    }
                                });
                                fs_1.rmdir(path, function (e) {
                                    if (e) {
                                        rej(e);
                                    }
                                    else {
                                        console.log("- removed " + path + ".");
                                        res(true);
                                    }
                                });
                                return [3 /*break*/, 3];
                            case 2:
                                res(false);
                                _a.label = 3;
                            case 3: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
