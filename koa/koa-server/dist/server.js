const Koa = require('koa');
const router = require('koa-router')();
const app = new Koa();
router
    .get('/', (ctx, next) => {
    ctx.body = 'Index page';
})
    .get('/news', (ctx, next) => {
    ctx.body = 'news';
    next();
})
    .get('/news/China', (ctx, next) => {
    ctx.body = 'Chinese news';
    console.log(ctx.query);
})
    .get('/news/:country', (ctx, next) => {
    ctx.body = 'News in a certain country';
    console.log(ctx.params);
})
    .get('/news/:country/:state', (ctx, next) => {
    ctx.body = 'News in a certain state';
    console.log(ctx.params);
});
const after = (ctx, next) => {
    ctx.response.body = 'Middleware after router';
};
const main = (ctx, next) => {
    ctx.response.body = 'Hello world';
    next();
};
app.use(main);
app.use(router.routes());
app.use(after);
app.listen(3000, () => {
    console.log('Server is running at 127.0.0.1:3000');
});
