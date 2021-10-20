const Koa = require('koa')
const Router = require('koa-router')
const router = new Router()
const app = new Koa()

const main = (ctx, next) => {
	// ctx.body = 'Hello world!'
  console.log('main')
  // next()
}
const one = (ctx, next) => {
  ctx.body = 'one'
  console.log('middleware one')
  next()
  console.log('one')
}
const two = (ctx, next) => {
  ctx.body = 'two'
  console.log('middleware two')
  next()
  console.log('two')
}

const routerMain = (ctx, next) => {
  console.log('routerMain')
  next()
  console.log('routerMain-next')
}

router
  // 会在执行指定中间件之前执行
  .use(one, two) 
	.get(['myname', '/', '/news'], (ctx, next) => {
		ctx.body = 'Index page'
    console.log('router')
    next()
    console.log('router-next')
	}, routerMain)
  .get('/test', (ctx, next) => {
    console.log('test')
  })
  .get('/test/detailed', (ctx, next) => {
    console.log('more detailed')
  })

app.use(router.routes())
app.use(main)

app.listen(3000, () => {
	console.log('Server is running at 127.0.0.1:3000')
})
