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
  // router.use()
	// .use(main, minecraft)
	// .use('/', minecraft)
	.use(['/news', '/news/china'], (ctx, next) => {
		ctx.body = 'All about news'
		console.log('All about news')
		next()
	})
  .use('/hello', (ctx, next) => {
    ctx.body = '/hello with router.use'
    console.log('/hello with router.use')
    next()
  })
  // router.verb()
	.get('/', (ctx, next) => {
		ctx.body = 'Index page'
		console.log('Index page')
	})
  .get('/hello', (ctx, next) => {
    ctx.body = '/hello with router.verb'
    console.log('/hello with router.verb')
    next()
  })
	.get('/news', (ctx, next) => {
		ctx.body = 'news'
		console.log('news')
    next()
	})
	.get('/news/china', (ctx, next) => {
		ctx.body = 'China-news'
		console.log('China-news')
	})
  // params
	.get('/news/china/:category', (ctx, next) => {
		ctx.body = `${ctx.params.category} news in China  /news/china/:category`
		console.log(`${ctx.params.category} news in China  /news/china/:category`)
    next()
	})
  .get('/news/:country/education', (ctx, next) => {
    ctx.body = `education news in ${ctx.params.country}  /news/:country/education`
		console.log(`education news in ${ctx.params.country}  /news/:country/education`)
  })
  // 'path' passed in array
	.get(['/a', '/b'], (ctx, next) => {
		ctx.body = '/a or /b'
		console.log('/a or /b')
	})
  // router.all()
  .all(['/c', '/d'], (ctx, next) => {
    ctx.body = 'router.all'
    console.log('router.all')
  })

// router.routes()
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(3000, () => {
	console.log('Server is running at 127.0.0.1:3000')
})
