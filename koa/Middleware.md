# 什么是中间件

Github： https://github.com/koajs/koa/blob/master/docs/guide.md

阮一峰博客：http://www.ruanyifeng.com/blog/2017/08/koa.html



>Koa middleware are simple functions which return a `MiddlewareFunction` with signature (ctx, next). When the middleware is run, it must manually invoke `next()` to run the "downstream" middleware.

* 中间件是函数，它可以实现某些功能，并通过调用next()，执行它的下游中间件（或者说，将执行权转交给下一个中间件）

* 之所以它被称作"中间件"，是因为它处在 HTTP Request 和 HTTP Response 中间

* 中间件使用`app.use`加载

# 洋葱模型

多个中间件会形成一个栈结构，以"先进后出"的顺序执行，在一个中间件中，只要遇到next()，就会从此处跳转至下一个中间件，不断地深入，执行完某一个中间件的代码后，又会回到上一次执行next()的地方。这类似于"洋葱表皮→洋葱中心→洋葱表皮"的过程

```js
const one = (ctx, next) => {
  console.log('>> one');
  next();
  console.log('<< one');
}

const two = (ctx, next) => {
  console.log('>> two');
  next(); 
  console.log('<< two');
}

const three = (ctx, next) => {
  console.log('>> three');
  next();
  console.log('<< three');
}

app.use(one);
app.use(two);
app.use(three);
```

控制台输出：

```
>> one
>> two
>> three
<< three
<< two
<< one
```

# 异步中间件

中间件中可以执行一些异步操作，此时中间件必须写成async函数，异步操作前边加await



# 合成中间件

`koa-compose`模块可以将多个中间件合成

```js
const compose = require('koa-compose');

const logger = (ctx, next) => {
  console.log(`${Date.now()} ${ctx.request.method} ${ctx.request.url}`);
  next();
}

const main = ctx => {
  ctx.response.body = 'Hello World';
};

const middlewares = compose([logger, main]);
app.use(middlewares);
```

