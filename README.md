## Feature

* **create and join public/private room**

* **user entered/left room notice**

* **send text or image**

* **origin image mode**

  * *move*
  * *pinch to zoom*
  * *MD5 check*


## Usage

**install dependencies**

```shell
yarn install
```

and build project

```shell
yarn build
```

**open firewall**

```shell
# default port: 8080
iptables -A INPUT -p tcp --dport <port> -j ACCEPT
```

**run server**

```shell
node server
```

**run client**

open browser and input URL:

```
http://<network address>:<port>/
```

example:

```
http://192.168.0.123:8080/
```

## License

[MIT](https://github.com/asahiP/vue-chat-room/blob/master/LICENSE)

