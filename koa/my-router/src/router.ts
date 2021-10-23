import compose from 'koa-compose'
import { Middleware, Router as IRouter } from './interface.js'
import { Layer } from './layer.js' // must add ".js"
import { Matched as IMatched } from './interface.js'
import { Middleware as IMiddleware } from './interface.js'

const methods = ['get', 'post', 'put', 'delete']

class Router implements IRouter {
	methods: string[]
	stack: Layer[]
	register(
		path: string | string[],
		methods: string[],
		middleware: IMiddleware[],
		check: boolean
	): void {
		// Tackle with the situation where "path" is an array
		if (Array.isArray(path)) {
			for (let i = 0; i < path.length; i++) {
				this.register(path[i], methods, middleware, check)
			}
		}
    if (!Array.isArray(path)) {
      const route = new Layer(path, methods, middleware, check)
      this.stack.push(route)
    }
	}
	match(path: string, method: string): IMatched {
		const layers = this.stack
		// In order to meet the command of 'allowedMethods',
		// we set attribute 'path' and 'pathAndMethod'
		const matched: IMatched = {
			path: [],
			pathAndMethod: [],
			route: false,
		}
		method = method.toUpperCase()
		// If only router.use() matches, it shouldn't function
		// But if router.verb() matches, router.use() could function
		for (let i = 0; i < layers.length; i++) {
			const layer = layers[i]
			if (layer.match(path) || layer.path === '') {
				// router.verb() or router.all()
				matched.path.push(layer)
				if (
					~layer.methods.indexOf(method) ||
					(!layer.methods.length && layer.check)
				) {
					matched.pathAndMethod.push(layer)
					matched.route = true
				}
				// router.use()
        // If you want to check that the array is empty, use the 'length' attribute
        // don't use 'if (array === [])'
				else if (!layer.methods.length && !layer.check) {
					matched.pathAndMethod.push(layer)
				}
			}
		}
		return matched
	}
	routes(): (ctx, next) => void {
		const router = this
		const dispatch = function dispatch(ctx, next) {
			const path = ctx.path
			const method = ctx.method.toLowerCase()
			const matched = router.match(path, method)
			// To meet the command of 'allowedMethods',
			// we assign 'matched.path' to ctx.matched, rather than 'matched.pathAndMethod'
			ctx.matched = matched.path
			if (matched.route) {
				const layerChain = matched.pathAndMethod
				let middleware: IMiddleware[]
				// Imagine this situation: several layers are matched
				// and some of them use params, with different paramsName
				// if you don't update ctx.params, it will be wrong
				middleware = layerChain.reduce((memo: IMiddleware[], layer: Layer) => {
					memo.push((ctx, next) => {
						ctx.captures = layer.captures(path)
						ctx.params = layer.params(ctx.captures)
						next()
					})
					return memo.concat(layer.stack)
				}, [])
				return compose(middleware)(ctx, next)
			} else next()
		}
		return dispatch
	}
	use(): IRouter {
		const middleware = [...arguments]
		let path: string | string[]
		if (typeof middleware[0] === 'string' || Array.isArray(middleware[0])) {
			path = middleware[0]
			middleware.shift()
			this.register(path, [], middleware, false)
		} else {
			this.register('', [], middleware, false)
		}
		return this
	}
	all(path: string | string[], ...middleware: Middleware[]): Router {
		this.register(path, [], middleware, true)
		return this
	}
	allowedMethods(): (ctx, next) => void {
		const router = this
		return function allowedMethods(ctx, next) {
			const implemented = router.methods
			const allowed = {}
			if (ctx.status === 404) {
				const matched = ctx.matched
				for (let i = 0; i < matched.length; i++) {
					const layer = matched[i]
					for (let j = 0; j < layer.methods.length; j++) {
						const method = layer.methods[j]
						allowed[method] = method
					}
				}
				const allowedArr = Object.values(allowed)
				if (!~implemented.indexOf(ctx.method)) {
					ctx.status = 501
					ctx.set('Allow', allowedArr.join(', '))
				} else if (allowedArr.length) {
					if (ctx.method === 'OPTIONS') {
						ctx.status = 200
						ctx.body = ''
						ctx.set('Allow', allowedArr.join(', '))
					} else if (!allowed[ctx.method]) {
						ctx.status = 405
						ctx.set('Allow', allowedArr.join(', '))
					}
				}
			}
		}
	}
	constructor() {
		this.methods = ['HEAD', 'OPTIONS', 'GET', 'PUT', 'POST', 'DELETE']
		this.stack = []
	}
}

for (let i = 0; i < methods.length; i++) {
	function setMethodVerb(method: string): void {
		Router.prototype[method] = function (
			path: string | string[],
			...middleware: object[]
		): Router {
			this.register(path, [method], middleware, true)
			return this
		}
	}
	setMethodVerb(methods[i])
}

export default Router // must use "default"
