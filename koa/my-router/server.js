import Koa from 'koa'
import Router from './dist/router.js'

const router = new Router()
const app = new Koa()

const main = (ctx, next) => {
  ctx.body = 'main'
	console.log('Hello world!')
  next()
  console.log('after main')
}
const minecraft = (ctx, next) => {
  ctx.body = 'minecraft is interesting!'
  console.log('minecraft is interesting!')
  next()
  console.log('after minecraft')
}

router
  .use(main, minecraft)
	// .use('/', minecraft)
	.get('/', (ctx, next) => {
		ctx.body = 'Index page'
		console.log('Index page')
	})
	.get('/news', (ctx, next) => {
    ctx.body = 'news'
		console.log('news')
	})
  .get('/news/China', (ctx, next) => {
    ctx.body = 'China-news'
		console.log('China-news')
	})

app.use(router.routes())
app.listen(3000, () => {
	console.log('Server is running at 127.0.0.1:3000')
})
