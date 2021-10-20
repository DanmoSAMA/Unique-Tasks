const Koa = require('koa')
const Router = require('koa-router')
const router = new Router()
const app = new Koa()

router
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

app.use(router.routes())

app.listen(3000, () => {
	console.log('Server is running at 127.0.0.1:3000')
})
