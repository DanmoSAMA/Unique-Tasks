const Koa = require('koa')
const Router = require('koa-router')
const router = new Router()
const app = new Koa()

router
  .use('/hello', (ctx, next) => {
    ctx.body = 'Hello router.use'
    console.log('Hello router.use')
    next();
  }) 
  // .use((ctx, next) => {
  //   ctx.body = 'no path with router.use'
  //   console.log('no path with router.use')
  // })
	.get('/', (ctx, next) => {
		ctx.body = 'Hello World!'
		console.log('test /')
	})
	.get('/users', (ctx, next) => {
		ctx.body = 'users'
		console.log('test /users')
	})
	.get('/users/:id', (ctx, next) => {
		ctx.body = 'Dynamic users'
		console.log('test /users/:id')
		console.log(ctx.query)
		console.log(ctx.params)
	})
  .get('/hello', (ctx, next) => {
    console.log('get /hello')
    // next()
    ctx.redirect('/hi')
    ctx.status = 301
  })

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000, () => {
	console.log('Server is running at 127.0.0.1:3000')
})
