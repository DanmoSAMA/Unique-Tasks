# router.js

Router 的 stack 数组存放每个路由对应的 Layer 实例对象

```
引入依赖的模块

function Router {
	methods 数组：存放允许使用的 HTTP 方法名, 会在 Router.prototype.allowedMethods 方法中使用, 在创建 Router 实例的时候可以进行配置, 允许使用哪些方法
	params 对象：存储键为参数名与值为对应的参数校验函数, 这样是为了通过在全局存储参数的校验函数, 方便在注册路由的时候为路由的中间件函数数组添加校验函数
	stack 数组：存储每一个路由, 每一个路由都相当于一个 Layer 实例对象
}

```



# layer.js

Layer 实例对象里面的 stack 数组是存储每个路由的处理函数中间件的，一个路由可以添加多个处理函数

```js
引入依赖的模块

function Layer {
	设置属性：
		- 配置
		- 路由命名
		- 路由方法
		- 路由参数名数组
		- 路由处理中间件数组
	存储路由方法（如果有GET则在数组首部添加HEAD）
	确保middleware类型为函数
	path
	regexp（将 path 转化为正则表达式用于匹配请求的路由）
	// 了解pathToRegexp
}

// 向Layer的原型对象添加方法
match：判断path能否匹配路由，返回boolean
params：返回同名对象，该对象存储键为参数名与值为对应的参数校验函数
captures：?
url：使用给定的params，为路由产生URL
```



# 调试

```js
从 const Router = require('koa-router') 开始
进入router.js
	- setMethodVerb
	  method数组内的每个成员（即每种方法），在Router的原型对象上绑一个函数
	  通过传入的参数，获取中间件
	  注册
	- use
	- prefix
	- routes
	- allowedMethods
	- all
	- redirect
	- register
	- route
	- url
	- match
	- param
	- url
	
执行 const router = new Router()
进入router.js
	- function Router()，初始化一个Router
	
执行 .get('/', (ctx, next) => {...}
	- 刚刚已经为每个method绑定了函数，现在进入setMethodVerb，执行函数
		一开始，name为url，path为执行的函数(f)，middleware为中间件(main)
    之后，path在赋值后变为url，name为null，middleware变为数组[f, main]
		/*
      const main = ctx => {
        ctx.body = 'Hello world!'
        console.log('main')
      }
      router
        .get(['/', '/news'], (ctx, next) => {
          ctx.body = 'Index page'
          next()
          console.log('router')
        }, main)
		*/
register：F11单步执行
	- path：url，methods：方法，middleware：中间件，opts：配置
  	['/', '/news']，'get', [f, main], {name: null}
  - 当path为一个数组时，获得其中的每一个url，分别注册
  	- 调用register()，处理'/'
      - route = new Layer，进入layer.js
        function Layer {
          - path, methods, middleware, opts 和刚才类似，opts多了很多配置，大多都有默认值
          - 将全部中间件存入layer实例对象的stack属性，现在stack属性是一个数组
          - 将全部方法转为大写，存入layer实例对象的methods属性，如果遇到'GET'则在前边加入'HEAD'
          - for循环，确保每个中间件的类型都为函数
          - 将path存入layer实例对象的path属性
          - 执行pathToRegexp，得到正则表达式，赋值给layer实例对象的regexp属性
        }
       - setPrefix，由于prefix为空字符串，没有执行   
       - 添加参数中间件，由于router实例对象的params属性为空对象，没有执行
       - 将route加入stack
       - return route，目的是链式调用
     - 再次调用register()，处理'/news'，步骤相同
   /*
   route内容如下：
      {
        opts: {
          end: true,
          name: null,
          sensitive: false,
          strict: false,
          prefix: "",
          ignoreCaptures: undefined,
        },
        name: null,
        methods: [
          "HEAD",
          "GET",
        ],
        paramNames: [
        ],
        stack: [
          (ctx, next) => {
            ctx.body = 'Index page'
              next()
              console.log('router')
          },
          ctx => {
            ctx.body = 'Hello world!'
             console.log('main')
          },
        ],
        path: "/",
        regexp: ...
      }
   */
  - 返回router实例对象，便于链式调用

执行 app.use(router.routes())
Router.prototype.routes：
	- 定义了dispatch函数，并将其赋值给变量dispatch
  - 设置dispatch的router属性                          
	- 返回dispatch，这个对象应是对外暴露的中间件
app将该中间件加入middleware数组...
```

疑问：

* params？
* regexp？
* captures？
* 命名空间
* 嵌套路由



# 总结

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/11/26/16ea34d7fbd1ed08~tplv-t2oaga2asx-watermark.awebp)



Router 和 Layer

* router = new Router()，可以认为该router上携带了所有的路由信息

* router.stack存放每一个Layer实例对象layer

* layer携带了路由至某个特定path的路由信息，一个path对应一个layer

* layer.stack存放该特定路由的中间件信息，在传入的参数中，path之后的部分都是中间件



Router.routes()：返回路由器中间件，它分派与请求匹配的路由

