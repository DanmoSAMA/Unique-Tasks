const Koa = require('koa')
const app = new Koa()

const one = async (ctx, next) => {
  ctx.body = 'one'
  console.log('>> one');
  await next();
  console.log('<< one');
}

const two = async (ctx, next) => {
  ctx.body = 'two'
  console.log('>> two');
  await next(); 
  console.log('<< two');
}

const three = async (ctx, next) => {
  ctx.body = 'three'
  ctx.body = 'Hello World'
  console.log('>> three');
  await next();
  console.log('<< three');
  // console.log(ctx)
  // console.log(ctx.body)
  // console.log(ctx.response)
  // console.log(ctx.response.body)
}

app.use(one);
app.use(two);
app.use(three);
app.listen(3000, () => {
	console.log('Server is running at 127.0.0.1:3000')
})
