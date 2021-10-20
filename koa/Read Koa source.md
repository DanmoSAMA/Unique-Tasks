# 读代码

## application.js

入口文件，也是核心

### 分析

```js
引入依赖的模块

Application（继承自Emitter）{
	constructor{
		super：在子类中想要获取父类的属性，使用super()，其相当于父类的constructor
		初始化middleware数组（重要）
	}
	listen：调用http.createServer，传入回调函数，然后监听特定端口
	toJSON：使用only模块，使得加工后的对象只拥有指定的属性?
	inspect：将Application对象转化为JSON并返回?
	use：使用中间件函数
		- 传入的参数必须为函数，否则抛出错误
		- isGeneratorFunction：判断是否为生成器函数，如果是则输出deprecate信息（Koa v1.x的中间件使用生成器函数，而Koa v2.x的中间件要求返回promise，不再使用this，新增context，详见https://github.com/koajs/koa/blob/master/docs/migration.md），并使用koa-convert完成中间件转化
		- 将该中间件加入middleware数组（重要）
	callback：返回一个请求处理函数回调，用于node的本地HTTP服务器
		- 使用koa-compose，传入middleware数组，合成所有中间件
		- emitter.listenerCount(eventName)：先判断此时有无监听error事件的监视器，如果没有则添加监视器
		- handleRequest：一个位于callback内部的函数，个人将其理解为回调，执行callback可间接执行下边的handleRequest函数
			- 创建ctx
			- 将ctx和合成中间件传入handleRequest函数（见下方）
	handleRequest：处理请求
		- 获取res，并把状态码设置为404?
		- 调用onerror和respond函数
		- onFinished：当HTTP请求关闭、结束或出错时，执行回调。第一个参数是res，第二个参数是监听器
		- 执行中间件，然后处理res
	createContext：创建并初始化ctx，设置属性，返回ctx
	onerror：监听并处理错误
	respond：处理响应，将内容呈现在页面上
		- statuses.empty[code]：当状态码期待的body为空时，返回true，页面上无内容
		- 当方法为HEAD时，页面上无内容
		...
}
```

### 中间件的实现机制

已知信息：

* 中间件数组`middleware`
* use一个中间件，会将其加入middleware数组
* callback()的调用时机：`http.createServer`传入的函数被调用时，调用app.callback()，然后执行其中的handleRequest()，该函数进而调用app.handleRequest()
* app.handleRequest()可以执行中间件函数，不过执行它只能靠app.callback()，先执行所有的中间件函数，再处理res，因此中间件是处于req和res之间的
* 如何体现中间件的洋葱模型——`koa-compose`



### koa-compose与洋葱模型

```js
function compose (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }
  return function (context, next) { // 此处的next是undefined，个人认为没有用
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      // i小于index，证明在中间件内调用了不止一次的next()，抛出错误
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next // 最后一个中间件，fn = undefined
      if (!fn) return Promise.resolve() // 不再执行下一个patch函数，而是直接返回
      try {
        // 调用fn，将下一个dispatch函数作为中间件的next传入，然后执行该中间件
        // 如果该中间件执行了next()，就递归地执行dispatch()
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
```

Q1：为什么if (i <= index) return Promise.reject(new Error('next() called multiple times')) 可以判断next()是否多次调用？

A1：index由于闭包，会保留在内存中。每次刚进入dispatch函数的时候，i是新绑定的值，而index还是刚刚旧的值，所以始终有i = index + 1。由于next本质上是绑定了新的i值的dispatch函数，如果连续执行两次next()，第二次执行的时候，i还和第一次时的一样，而index已经被更新过，所以此时i = index，就会抛出错误



Q2：为什么返回值时要套Promise？

A2：尽管我把Promise去掉后也可以正常运行，下边记录一些感性认识（可能不准确）：

经过koa-compose加工后的函数会以形参`fnMiddleware`传入app.handleRequest，在该函数的末尾，有return fnMiddleware(ctx).then(handleResponse).catch(onerror)，因此中间件函数需要成为Promise对象

## context.js

### 分析

```js
引入依赖的模块
proto {
	inspect：调用toJSON，将proto转化为JSON
	toJSON：将各属性转化为JSON
	throw：抛出错误
	onerror：监听错误
	处理cookies
	delegate：委托模式
}
```

### 委托模式

```js
delegate(proto, 'response')
  .method('attachment')
  .method('redirect')
  .method('remove')
  .method('vary')
  .method('has')
  .method('set')
  .method('append')
  .method('flushHeaders')
  .access('status')
  .access('message')
  .access('body')
  .access('length')
  .access('type')
  .access('lastModified')
  .access('etag')
  .getter('headerSent')
  .getter('writable');

delegate(proto, 'request')
  .method('acceptsLanguages')
  .method('acceptsEncodings')
  .method('acceptsCharsets')
  .method('accepts')
  .method('get')
  .method('is')
  .access('querystring')
  .access('idempotent')
  .access('socket')
  .access('search')
  .access('method')
  .access('query')
  .access('path')
  .access('url')
  .access('accept')
  .getter('origin')
  .getter('href')
  .getter('subdomains')
  .getter('protocol')
  .getter('host')
  .getter('hostname')
  .getter('URL')
  .getter('header')
  .getter('headers')
  .getter('secure')
  .getter('stale')
  .getter('fresh')
  .getter('ips')
  .getter('ip');
```

这里的proto，就是在application中使用的context

我们在使用诸如ctx.body时，ctx将它们委托给request和response，而这两者分别对req、res作了一定程度的封装，进而间接访问原生的属性和方法

比如说，在访问ctx.header时，ctx会将其委托给request.header，而request又会将其委托给req.headers，最终我们拿到了header值



### this.createContext

```js
createContext(req, res) {
  const context = Object.create(this.context);
  const request = context.request = Object.create(this.request);
  const response = context.response = Object.create(this.response);
  context.app = request.app = response.app = this;
  context.req = request.req = response.req = req;
  context.res = request.res = response.res = res;
  request.ctx = response.ctx = context;
  request.response = response;
  response.request = request;
  context.originalUrl = request.originalUrl = req.url;
  context.state = {};
  return context;
}
```

这个函数是在application.js中的，有了它，我们可以在context上访问到request和response，response、request和context可以共享app、res、req这些属性，并且可以互相访问

在这里谈到它，是因为这个函数和上边的委托模式的作用容易混淆，举个例子：

```js
// 一个koa中间件函数
const main = async (ctx, next) => {
  ctx.body = 'Hello World'
  await next();
  console.log(ctx)
  console.log(ctx.body)
  console.log(ctx.response)
  console.log(ctx.response.body)
}
```

输出：

```js
{
  request: {
    method: 'GET',
    url: '/',
    header: {
      host: '127.0.0.1:3000',
      connection: 'keep-alive',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Google Chrome";v="93", " Not;A Brand";v="99", "Chromium";v="93"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'sec-fetch-site': 'none',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '?1',
      'sec-fetch-dest': 'document',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en,zh;q=0.9,zh-CN;q=0.8'
    }
  },
  response: {
    status: 200,
    message: 'OK',
    header: [Object: null prototype] {
      'content-type': 'text/plain; charset=utf-8',
      'content-length': '11'
    }
  },
  app: { subdomainOffset: 2, proxy: false, env: 'development' },
  originalUrl: '/',
  req: '<original node req>',
  res: '<original node res>',
  socket: '<original node socket>'
} // ctx
Hello World // ctx.body
{
  status: 200,
  message: 'OK',
  header: [Object: null prototype] {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': '11'
  },
  body: 'Hello World'
} // ctx.response
Hello World // ctx.response.body
```

可见，ctx上并没有body属性，而ctx.body不是undefined，说明此处ctx将getter委托给了response，获取ctx.body转化为获取ctx.response.body

而ctx拥有response属性，response拥有body属性，则分别是this.createContext和response.js的功劳

## request.js

几乎都是getter和setter，将原生req作封装，使得调用request.js时间接调用req

```js
引入依赖的模块

{
	// get、set
	header/headers：获取/设置 req.headers
	url: 获取/设置 req.url
	...
	origin
	href
	method
	path
	query
	querystring
	search
	host
	hostname
	URL
	fresh
	stale
	idempotent
	socket
	charset
	length
	protocol
	secure
	ips
	ip
	subdomains
	accept
	type
	
	// 方法
	accepts
	acceptsEncodings
	acceptsCharsets
	acceptsLanguages
	is
	get
	inspect
	toJSON
}
```



## response.js

将原生res作封装，使得调用reponse.js时间接调用res

```js
引入依赖的模块

{
	// get、set
	socket
	header/headers
	status
	message
	body
	length
	headerSent
	type
	lastModified
	etag
	type
	writable
	
	// 方法
	vary
	redirect
	attachment
	is
	get
	has
	set
	append
	remove
	inspect
	toJSON
	flushHeaders
}
```



# 调试

调试server.js，执行的步骤：

```js
引入Koa => 引入依赖的模块
new Koa() => 执行构造函数
声明中间件 => 直接跳过去
app.use => 将中间件加入数组
执行listen()
执行回调函数console.log()

如果此时浏览器在访问127.0.0.1:3000，继续向下执行：

进入callback()，进而执行handleRequst() （此处切换为F11调试）
执行return fnMiddleware(ctx).then(handleResponse).catch(onerror) => 进入compose() return的函数
return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))，执行了其中的fn，跳转至main中间件
执行next()，由于刚刚传入的第二个参数是dispatch函数，因此再次跳转至dispatch
下一个中间件同理...

执行完所有中间件，回到handleRequest
const handleResponse = () => respond(ctx)，之后进入listen()?，再回到handleRequest，反复几次结束
```

Q1：最后的listen()是什么？

A1：

