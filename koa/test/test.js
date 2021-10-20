// only
const only = require('only')

var obj = {
	name: 'tobi',
	last: 'holowaychuk',
	email: 'tobi@learnboost.com',
	_id: '12345',
}

var user = only(obj, 'last email')
console.log(user)

// is-generator-function
const isGeneratorFunction = require('is-generator-function')
const assert = require('assert')
assert(!isGeneratorFunction(function () {}))
assert(!isGeneratorFunction(null))
// assert(undefined) // 抛出错误
assert(
	isGeneratorFunction(function* () {
		yield 42
		return Infinity
	})
)

// deprecate
const deprecate = require('depd')('my-module')
// deprecate(
// 	'Support for generators will be removed in v3. ' +
// 		'See the documentation for examples of how to convert old middleware ' +
// 		'https://github.com/koajs/koa/blob/master/docs/migration.md'
// )

