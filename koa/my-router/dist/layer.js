import { pathToRegexp } from 'path-to-regexp';
export class Layer {
    constructor(path, methods, middleware, check) {
        this.path = path;
        this.methods = [];
        this.stack = middleware;
        this.paramNames = [];
        this.regexp = pathToRegexp(path, this.paramNames);
        this.check = check;
        for (let i = 0; i < methods.length; i++) {
            const l = this.methods.push(methods[i].toUpperCase());
            if (this.methods[l - 1] === 'GET')
                this.methods.unshift('HEAD');
        }
    }
    match(path) {
        return this.regexp.test(path);
    }
    captures(path) {
        return path.match(this.regexp) !== null ? path.match(this.regexp).slice(1) : [];
    }
    params(captures) {
        const params = {};
        for (let i = 0; i < captures.length; i++) {
            const key = this.paramNames[i];
            const value = captures[i];
            params[key.name] = value;
        }
        return params;
    }
}
//# sourceMappingURL=layer.js.map