import { pathToRegexp } from 'path-to-regexp';
export class Layer {
    constructor(path, method, middleware) {
        this.path = path;
        this.method = method;
        this.stack = middleware;
        this.regexp = pathToRegexp(path);
    }
    match(path) {
        return this.regexp.test(path);
    }
}
//# sourceMappingURL=layer.js.map