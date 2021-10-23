import compose from 'koa-compose';
import { Layer } from './layer.js';
const methods = ['get', 'post', 'put', 'delete'];
class Router {
    constructor() {
        this.methods = ['HEAD', 'OPTIONS', 'GET', 'PUT', 'POST', 'DELETE'];
        this.stack = [];
    }
    register(path, methods, middleware, check) {
        if (Array.isArray(path)) {
            for (let i = 0; i < path.length; i++) {
                this.register(path[i], methods, middleware, check);
            }
        }
        if (!Array.isArray(path)) {
            const route = new Layer(path, methods, middleware, check);
            this.stack.push(route);
        }
    }
    match(path, method) {
        const layers = this.stack;
        const matched = {
            path: [],
            pathAndMethod: [],
            route: false,
        };
        method = method.toUpperCase();
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.match(path) || layer.path === '') {
                matched.path.push(layer);
                if (~layer.methods.indexOf(method) ||
                    (!layer.methods.length && layer.check)) {
                    matched.pathAndMethod.push(layer);
                    matched.route = true;
                }
                else if (!layer.methods.length && !layer.check) {
                    matched.pathAndMethod.push(layer);
                }
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
            ctx.matched = matched.path;
            if (matched.route) {
                const layerChain = matched.pathAndMethod;
                let middleware;
                middleware = layerChain.reduce((memo, layer) => {
                    memo.push((ctx, next) => {
                        ctx.captures = layer.captures(path);
                        ctx.params = layer.params(ctx.captures);
                        next();
                    });
                    return memo.concat(layer.stack);
                }, []);
                return compose(middleware)(ctx, next);
            }
            else
                next();
        };
        return dispatch;
    }
    use() {
        const middleware = [...arguments];
        let path;
        if (typeof middleware[0] === 'string' || Array.isArray(middleware[0])) {
            path = middleware[0];
            middleware.shift();
            this.register(path, [], middleware, false);
        }
        else {
            this.register('', [], middleware, false);
        }
        return this;
    }
    all(path, ...middleware) {
        this.register(path, [], middleware, true);
        return this;
    }
    allowedMethods() {
        const router = this;
        return function allowedMethods(ctx, next) {
            const implemented = router.methods;
            const allowed = {};
            if (ctx.status === 404) {
                const matched = ctx.matched;
                for (let i = 0; i < matched.length; i++) {
                    const layer = matched[i];
                    for (let j = 0; j < layer.methods.length; j++) {
                        const method = layer.methods[j];
                        allowed[method] = method;
                    }
                }
                const allowedArr = Object.values(allowed);
                if (!~implemented.indexOf(ctx.method)) {
                    ctx.status = 501;
                    ctx.set('Allow', allowedArr.join(', '));
                }
                else if (allowedArr.length) {
                    if (ctx.method === 'OPTIONS') {
                        ctx.status = 200;
                        ctx.body = '';
                        ctx.set('Allow', allowedArr.join(', '));
                    }
                    else if (!allowed[ctx.method]) {
                        ctx.status = 405;
                        ctx.set('Allow', allowedArr.join(', '));
                    }
                }
            }
        };
    }
}
for (let i = 0; i < methods.length; i++) {
    function setMethodVerb(method) {
        Router.prototype[method] = function (path, ...middleware) {
            this.register(path, [method], middleware, true);
            return this;
        };
    }
    setMethodVerb(methods[i]);
}
export default Router;
//# sourceMappingURL=router.js.map