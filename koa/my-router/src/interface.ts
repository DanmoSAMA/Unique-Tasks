interface Router {
	methods: string[]
	stack: Layer[]
	register(path: string, method: string, middleware: Middleware[]): void
	match(path: string, method: string): Matched
	routes(): (ctx, next) => void
	use(): Router
}

interface Layer {
	path: string
	method: string
	stack: Middleware[]
	regexp: RegExp
	match(path: string): boolean
}

interface Middleware {
	(ctx?, next?: () => {}): void
}

interface Matched {
	path: Layer[]
	route: boolean
}

export { Router, Layer, Middleware, Matched }
