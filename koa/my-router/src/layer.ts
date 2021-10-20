import { pathToRegexp } from 'path-to-regexp'
import { Layer as ILayer } from './interface.js'
import { Middleware as IMiddleware } from './interface.js'

export class Layer implements ILayer {
	path: string
	method: string
	stack: IMiddleware[]
	regexp: RegExp
	match(path: string) {
		return this.regexp.test(path)
	}
	constructor(path, method, middleware) {
		this.path = path
		this.method = method
		this.stack = middleware
		this.regexp = pathToRegexp(path)
	}
}
