import compose from 'koa-compose'
import { Middleware, Router as IRouter } from './interface.js'
import { Layer } from './layer.js' // must add ".js"
import { Matched as IMatched } from './interface.js'
import { Middleware as IMiddleware } from './interface.js'

const methods = ['get', 'post', 'put', 'delete']

class Router implements IRouter {
	methods: string[]
	stack: Layer[]
	register(path: string, method: string, middleware: IMiddleware[]): void {
		const route = new Layer(path, method, middleware)
		this.stack.push(route)
	}
	match(path: string, method: string): IMatched {
		const layers = this.stack
		const matched: IMatched = {
			path: [],
			route: false,
		}
		for (let i = 0; i < layers.length; i++) {
			const layer = layers[i]
			if (
				layer.match(path) &&
				(layer.method === method || layer.method === '')
			) {
				matched.path.push(layer)
				matched.route = true
			} else if (layer.path === '') {
				matched.path.push(layer)
			}
		}
		return matched
	}
	routes() {
		const router = this
		const dispatch = function dispatch(ctx, next) {
			const path = ctx.path
			const method = ctx.method.toLowerCase()
			const matched = router.match(path, method)
			const layerChain = matched.path
			let middleware: IMiddleware[] = []
			for (let i = 0; i < layerChain.length; i++) {
				const layer = layerChain[i]
				middleware = <Middleware[]>(
					Array.prototype.concat(middleware, layer.stack)
				)
			}
			return compose(middleware)(ctx, next)
		}
		return dispatch
	}
	use(): IRouter {
		const middleware = [...arguments]
		let path: string = ''
		if (typeof middleware[0] === 'string') {
			path = middleware[0]
			middleware.shift()
			this.register(path, '', middleware)
		} else {
			this.register('', '', middleware)
		}
		return this
	}
	constructor() {
		this.methods = ['HEAD', 'OPTIONS', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE']
		this.stack = []
	}
}

for (let i = 0; i < methods.length; i++) {
	function setMethodVerb(method): void {
		Router.prototype[method] = function (
			path: string,
			...middleware: object[]
		): Router {
			this.register(path, method, middleware)
			return this
		}
	}
	setMethodVerb(methods[i])
}

export default Router // must use "default"
