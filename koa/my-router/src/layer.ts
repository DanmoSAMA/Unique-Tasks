import { pathToRegexp } from 'path-to-regexp'
import { Layer as ILayer } from './interface.js'
import { Middleware as IMiddleware } from './interface.js'
import { ParamsName as IParamsName } from './interface.js'

export class Layer implements ILayer {
	path: string
	methods: string[]
	stack: IMiddleware[]
	paramNames: IParamsName[]
	regexp: RegExp
	check: boolean
	match(path: string) {
		return this.regexp.test(path)
	}
  captures(path: string) {
    // return value is an array which contains the value of paramsName
    // Because 'layer.captures()' will be executed before each of middleware,
    // we should write in this way, either null.slice() will trigger an error
    return path.match(this.regexp) !== null ? path.match(this.regexp).slice(1) : []
  }
  params(captures: string[]) {
    const params = {}
    for (let i = 0; i < captures.length; i++) {
      const key = this.paramNames[i]
      const value = captures[i]
      params[key.name] = value
    }
    // return an object contains key and value, or we can call it a map
    return params
  }
	constructor(path, methods, middleware, check) {
		this.path = path
		this.methods = []
		this.stack = middleware
		this.paramNames = []
    // This line will automatically assign value to this.paramNames
		this.regexp = pathToRegexp(path, this.paramNames)
		this.check = check

    for (let i = 0; i < methods.length; i++) {
      const l = this.methods.push(methods[i].toUpperCase())
      if (this.methods[l - 1] === 'GET') this.methods.unshift('HEAD')
    }
	}
}
