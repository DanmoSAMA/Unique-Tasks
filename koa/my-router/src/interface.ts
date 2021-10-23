interface Router {
	methods: string[]
	stack: Layer[]
	register(path: string, methods: string[], middleware: Middleware[], flag: boolean): void
	match(path: string, method: string): Matched
	routes(): (ctx, next) => void
	use(): Router
	all(path: string | string[], ...middleware: Middleware[]): Router
  allowedMethods(): (ctx, next) => void
}

interface Layer {
	path: string
	methods: string[]
	stack: Middleware[]
  paramNames: object[]
	regexp: RegExp
  check: boolean  // use 'check' to identify router.all() between router.use()
	match(path: string): boolean
  captures(path: string): string[]
  params(captures: string[]): object
}

interface Middleware {
	(ctx?, next?: () => {}): void
}

interface Matched {
	path: Layer[],
  pathAndMethod: Layer[],
	route: boolean
}

interface ParamsName {
  name: string
  prefix: string
  suffix: string
  pattern: string
  modifier: string
}

export { Router, Layer, Middleware, Matched, ParamsName }
