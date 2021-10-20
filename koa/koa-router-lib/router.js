const debug = require('debug')('koa-router');
const compose = require('koa-compose');
const HttpError = require('http-errors');
const methods = require('methods');
const Layer = require('./layer');
const { pathToRegexp } = require('path-to-regexp');

module.exports = Router;

// router对路由信息作了整合
function Router(opts) {
  if (!(this instanceof Router)) return new Router(opts);

  this.opts = opts || {};
  this.methods = this.opts.methods || [
    'HEAD',
    'OPTIONS',
    'GET',
    'PUT',
    'PATCH',
    'POST',
    'DELETE'
  ];

  this.params = {};
  this.stack = []; // 存放route(Layer实例对象)
};

// 初始化，绑定Verb方法
for (let i = 0; i < methods.length; i++) {
  function setMethodVerb(method) {
    Router.prototype[method] = function(name, path, middleware) {
      if (typeof path === "string" || path instanceof RegExp) {
        middleware = Array.prototype.slice.call(arguments, 2);
      } else {
        middleware = Array.prototype.slice.call(arguments, 1);  // 没有传name，走这里
        path = name;
        name = null;
      }

      this.register(path, [method], middleware, { // 注册
        name: name
      });
      return this;  // 返回router，便于链式调用（此处链式调用比较明显）
    };
  }
  setMethodVerb(methods[i]);
}

// Alias for `router.delete()` because delete is a reserved word
Router.prototype.del = Router.prototype['delete'];

// router.use是和router.verb并列的方法
// 如果没传path，无论访问什么path，都会先执行指定的中间件，然后再匹配路由
// 如果传了path，则仅当path匹配的时候才执行指定中间件，然后再执行下面的
Router.prototype.use = function () {
  const router = this;
  const middleware = Array.prototype.slice.call(arguments);
  let path;

  // support array of paths
  if (Array.isArray(middleware[0]) && typeof middleware[0][0] === 'string') {
    let arrPaths = middleware[0];
    for (let i = 0; i < arrPaths.length; i++) {
      const p = arrPaths[i];
      router.use.apply(router, [p].concat(middleware.slice(1)));
    }

    return this;
  }

  const hasPath = typeof middleware[0] === 'string';
  if (hasPath) path = middleware.shift();   // 得到path，使得middleware数组只有中间件

  for (let i = 0; i < middleware.length; i++) {
    const m = middleware[i];
    if (m.router) {
      // 嵌套路由，略过
      const cloneRouter = Object.assign(Object.create(Router.prototype), m.router, {
        stack: m.router.stack.slice(0)
      });

      for (let j = 0; j < cloneRouter.stack.length; j++) {
        const nestedLayer = cloneRouter.stack[j];
        const cloneLayer = Object.assign(
          Object.create(Layer.prototype),
          nestedLayer
        );

        if (path) cloneLayer.setPrefix(path);
        if (router.opts.prefix) cloneLayer.setPrefix(router.opts.prefix);
        router.stack.push(cloneLayer);
        cloneRouter.stack[j] = cloneLayer;
      }

      if (router.params) {
        function setRouterParams(paramArr) {
          const routerParams = paramArr;
          for (let j = 0; j < routerParams.length; j++) {
            const key = routerParams[j];
            cloneRouter.param(key, router.params[key]);
          }
        }
        setRouterParams(Object.keys(router.params));
      }
    } else {
      // 正常路由(非嵌套)
      const keys = [];
      pathToRegexp(router.opts.prefix || '', keys);
      const routerPrefixHasParam = router.opts.prefix && keys.length;
      // 简化：router.register(path, [], m);
      // register的本质，就是把route加入stack，由于router.use的作用就是先执行一批中间件，所以把这些route先加入stack
      // 并且这些中间件的执行，和methods无关，所以methods传入空数组，router.match()有考虑该情况
      router.register(path || '([^\/]*)', [], m, { end: false, ignoreCaptures: !hasPath && !routerPrefixHasParam });
    }
  }

  return this;
};

Router.prototype.prefix = function (prefix) {
  prefix = prefix.replace(/\/$/, '');

  this.opts.prefix = prefix;

  for (let i = 0; i < this.stack.length; i++) {
    const route = this.stack[i];
    route.setPrefix(prefix);
  }

  return this;
};

// 核心函数
Router.prototype.routes = Router.prototype.middleware = function () {
  const router = this;

  let dispatch = function dispatch(ctx, next) {
    debug('%s %s', ctx.method, ctx.path);

    const path = router.opts.routerPath || ctx.routerPath || ctx.path;
    const matched = router.match(path, ctx.method); // 获取路由匹配对象
    let layerChain;

    if (ctx.matched) {
      ctx.matched.push.apply(ctx.matched, matched.path);
    } else {
      ctx.matched = matched.path; // 设置ctx的matched属性
    }

    ctx.router = router;

    // 如果没有匹配到对应的路由模块, 那么就直接跳过下面
    if (!matched.route) return next();

    const matchedLayers = matched.pathAndMethod // 最终匹配到的路由(数组)
    // 不考虑动态路由，matchedLayers内只含一个字符串，没有"最具体的路由"之说
    const mostSpecificLayer = matchedLayers[matchedLayers.length - 1]
    ctx._matchedRoute = mostSpecificLayer.path; // 提取出path，作为ctx的一个属性
    if (mostSpecificLayer.name) {
      ctx._matchedRouteName = mostSpecificLayer.name;
    }

    layerChain = matchedLayers.reduce(function(memo, layer) { // 将几个layer串起来
      memo.push(function(ctx, next) {
        ctx.captures = layer.captures(path, ctx.captures); // captures是存储路由参数的数组，此处略
        ctx.params = ctx.request.params = layer.params(path, ctx.captures, ctx.params);
        ctx.routerPath = layer.path;
        ctx.routerName = layer.name;
        ctx._matchedRoute = layer.path;
        if (layer.name) {                        
          ctx._matchedRouteName = layer.name;
        }
        return next();
      });
      return memo.concat(layer.stack);
    }, []);

    return compose(layerChain)(ctx, next);
  };

  dispatch.router = this;

  return dispatch;  // 暴露dispatch函数
};

Router.prototype.allowedMethods = function (options) {
  options = options || {};
  const implemented = this.methods;

  return function allowedMethods(ctx, next) {
    return next().then(function() {
      const allowed = {};

      if (!ctx.status || ctx.status === 404) {
        for (let i = 0; i < ctx.matched.length; i++) {
          const route = ctx.matched[i];
          for (let j = 0; j < route.methods.length; j++) {
            const method = route.methods[j];
            allowed[method] = method;
          }
        }

        const allowedArr = Object.keys(allowed);

        if (!~implemented.indexOf(ctx.method)) {
          if (options.throw) {
            let notImplementedThrowable = (typeof options.notImplemented === 'function')
            ? options.notImplemented()  // set whatever the user returns from their function
            : new HttpError.NotImplemented();

            throw notImplementedThrowable;
          } else {
            ctx.status = 501;
            ctx.set('Allow', allowedArr.join(', '));
          }
        } else if (allowedArr.length) {
          if (ctx.method === 'OPTIONS') {
            ctx.status = 200;
            ctx.body = '';
            ctx.set('Allow', allowedArr.join(', '));
          } else if (!allowed[ctx.method]) {
            if (options.throw) {
              let notAllowedThrowable = (typeof options.methodNotAllowed === 'function')
              ? options.methodNotAllowed() // set whatever the user returns from their function
              : new HttpError.MethodNotAllowed();

              throw notAllowedThrowable;
            } else {
              ctx.status = 405;
              ctx.set('Allow', allowedArr.join(', '));
            }
          }
        }
      }
    });
  };
};

Router.prototype.all = function (name, path, middleware) {
  if (typeof path === 'string') {
    middleware = Array.prototype.slice.call(arguments, 2);
  } else {
    middleware = Array.prototype.slice.call(arguments, 1);
    path = name;
    name = null;
  }

  this.register(path, methods, middleware, { name });

  return this;
};

Router.prototype.redirect = function (source, destination, code) {
  // lookup source route by name
  if (source[0] !== '/') source = this.url(source);

  // lookup destination route by name
  if (destination[0] !== '/' && !destination.includes('://')) destination = this.url(destination);

  return this.all(source, ctx => {
    ctx.redirect(destination);
    ctx.status = code || 301;
  });
};

// 注册路由：建立URL规则和处理函数之间的关联(来自互联网)
// 此处的register函数，主要作用是处理path(path为数组时可以递归)，创建route并将其添加至stack
Router.prototype.register = function (path, methods, middleware, opts) {
  opts = opts || {};

  const router = this;
  const stack = this.stack; 

  // support array of paths
  if (Array.isArray(path)) {
    for (let i = 0; i < path.length; i++) {
      const curPath = path[i];
      router.register.call(router, curPath, methods, middleware, opts);
    }

    return this;
  }

  // create route
  const route = new Layer(path, methods, middleware, {  // 创建路由信息
    end: opts.end === false ? opts.end : true,
    name: opts.name,
    sensitive: opts.sensitive || this.opts.sensitive || false,
    strict: opts.strict || this.opts.strict || false,
    prefix: opts.prefix || this.opts.prefix || "",
    ignoreCaptures: opts.ignoreCaptures
  });

  if (this.opts.prefix) {
    route.setPrefix(this.opts.prefix);
  }

  // add parameter middleware
  for (let i = 0; i < Object.keys(this.params).length; i++) {
    const param = Object.keys(this.params)[i];
    route.param(param, this.params[param]);
  }

  stack.push(route);  // 将route加入router.stack

  debug('defined route %s %s', route.methods, route.path);

  return route;   // 便于链式调用
};

Router.prototype.route = function (name) {
  const routes = this.stack;

  for (let len = routes.length, i=0; i<len; i++) {
    if (routes[i].name && routes[i].name === name) return routes[i];
  }

  return false;
};

Router.prototype.url = function (name, params) {
  const route = this.route(name);

  if (route) {
    const args = Array.prototype.slice.call(arguments, 1);
    return route.url.apply(route, args);
  }

  return new Error(`No route found for name: ${name}`);
};

// 匹配路由信息
Router.prototype.match = function (path, method) {
  const layers = this.stack;
  let layer;
  // 创建路由匹配对象
  const matched = {
    path: [],
    pathAndMethod: [],
    route: false
  };

  for (let len = layers.length, i = 0; i < len; i++) {
    layer = layers[i];

    debug('test %s %s', layer.path, layer.regexp);

    if (layer.match(path)) {
      // 匹配到了path，但不一定存在对应的method，暂时存入path属性
      matched.path.push(layer);
      if (layer.methods.length === 0 || ~layer.methods.indexOf(method)) {
        // 如果route的methods数组为空(对应router.use()的情况)，或者数组中找到对应的方法(如果没找到，则~-1 === 0，条件不成立)
        matched.pathAndMethod.push(layer);  // pathAndMethod属性表示path和method都能匹配，为最终匹配结果
        if (layer.methods.length) matched.route = true; // 如果不是router.use()的情况，设置route属性为true
      }
    }
    // 匹配失败，所有route中都不含该path，matched.route === false
  }
  return matched;
};

Router.prototype.param = function(param, middleware) {
  this.params[param] = middleware;
  for (let i = 0; i < this.stack.length; i++) {
    const route = this.stack[i];
    route.param(param, middleware);
  }

  return this;
};

Router.url = function (path) {
  const args = Array.prototype.slice.call(arguments, 1);
  return Layer.prototype.url.apply({ path }, args);
};
