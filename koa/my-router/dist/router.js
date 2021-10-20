import compose from 'koa-compose';
import { Layer } from './layer.js';
const methods = ['get', 'post', 'put', 'delete'];
class Router {
    constructor() {
        this.methods = ['HEAD', 'OPTIONS', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE'];
        this.stack = [];
    }
    register(path, method, middleware) {
        const route = new Layer(path, method, middleware);
        this.stack.push(route);
    }
    match(path, method) {
        const layers = this.stack;
        const matched = {
            path: [],
            route: false,
        };
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.match(path) &&
                (layer.method === method || layer.method === '')) {
                matched.path.push(layer);
                matched.route = true;
            }
            else if (layer.path === '') {
                matched.path.push(layer);
            }
        }
        return matched;
    }
    routes() {
        const router = this;
        const dispatch = function dispatch(ctx, next) {
            const path = ctx.path;
            const method = ctx.method.toLowerCase();
            const matched = router.match(path, method);
            const layerChain = matched.path;
            let middleware = [];
            for (let i = 0; i < layerChain.length; i++) {
                const layer = layerChain[i];
                middleware = (Array.prototype.concat(middleware, layer.stack));
            }
            return compose(middleware)(ctx, next);
        };
        return dispatch;
    }
    use() {
        const middleware = [...arguments];
        let path = '';
        if (typeof middleware[0] === 'string') {
            path = middleware[0];
            middleware.shift();
            this.register(path, '', middleware);
        }
        else {
            this.register('', '', middleware);
        }
        return this;
    }
}
for (let i = 0; i < methods.length; i++) {
    function setMethodVerb(method) {
        Router.prototype[method] = function (path, ...middleware) {
            this.register(path, method, middleware);
            return this;
        };
    }
    setMethodVerb(methods[i]);
}
export default Router;
//# sourceMappingURL=router.js.map