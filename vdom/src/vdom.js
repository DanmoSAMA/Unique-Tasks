const regExp = /^on/ // 'startsWith()' can't work in IE
// create vdom
function h(tag, props, children) {
	return {
		tag,
		props,
		children,
	}
}
// mount
function mount(vnode, container, mark = 1, refNode = null) {
	// 使用vnode.el存储根据vdom生成的真实dom
	const el = (vnode.el =
		typeof vnode !== 'string'
			? document.createElement(vnode.tag)
			: (vnode.el = document.createTextNode(vnode + ' ')))
	if (vnode.props) {
		for (key in vnode.props) {
			const value = vnode.props[key]
			if (regExp.test(key)) {
				el.addEventListener(key.slice(2).toLowerCase(), value)
			} else {
				el.setAttribute(key, value)
			}
		}
	}
	if (vnode.children) {
		if (typeof vnode.children === 'string') {
			const text = document.createTextNode(vnode.children + ' ')
			el.appendChild(text)
		} else {
			vnode.children.forEach(child => {
				// child是字符串
				if (typeof child === 'string') {
					const text = document.createTextNode(child + ' ')
					child.el = text
					el.appendChild(text)
				}
				// child是vdom
				else {
					mount(child, el)
				}
			})
		}
	}
	if (mark) {
		container.appendChild(el)
	} else {
		container.insertBefore(el, refNode)
	}
}
// origin vdom
const vdom = h(
	'div',
	{
		class: 'wrapper',
		onclick: event => {
			event.target.style.backgroundColor = '#33CCFF'
		},
	},
	[
		h('div', { class: 'left' }, [
			h('ul', { class: 'mylist' }, [
				h(
					'li',
					{
						onclick: event => {
							event.target.style.backgroundColor = 'Chocolate'
							event.stopPropagation()
						},
					},
					[
						'apple',
						'grape',
						h('a', { href: 'javascript:;' }, 'test-a'),
						h('a', { href: 'javascript:;' }, 'test-b'),
						'pear',
					]
				),
				h('li', null, 'banana'),
				h('li', null, [h('a', { href: 'javascript:;' }, 'test-c')]),
			]),
		]),
		h('div', { class: 'right' }, [
			h('span', null, 'Hello'),
			h('em', null, 'Hi'),
			h('b', null, 'How'),
			h('i', null, 'Are'),
			h('br', null, ''),
			'You?',
		]),
	]
)
mount(vdom, document.getElementById('app'))

// diff, and patch
function patch(n1, n2) {
	if (n1.tag === n2.tag) {
		const el = (n2.el = n1.el)
		// diff props
		const oldProps = n1.props || {}
		const newProps = n2.props || {}
		for (const key in newProps) {
			const oldValue = oldProps[key]
			const newValue = newProps[key]
			if (regExp.test(key)) {
				if (newValue !== oldValue) {
					el.removeEventListener(key.slice(2).toLowerCase(), oldValue)
					el.addEventListener(key.slice(2).toLowerCase(), newValue)
				}
				for (const key in oldProps) {
					if (!(key in newProps)) {
						el.removeEventListener(key.slice(2).toLowerCase(), oldValue)
					}
				}
			} else {
				if (newValue !== oldValue) {
					el.setAttribute(key, newValue)
				}
				for (const key in oldProps) {
					if (!(key in newProps)) {
						el.removeAttribute(key)
					}
				}
			}
		}

		// diff children
		const oldChildren = n1.children
		const newChildren = n2.children

		if (typeof newChildren === 'string') {
			// 当原孩子是字符串，新孩子也是字符串时，比较替换
			if (typeof oldChildren === 'string') {
				if (newChildren !== oldChildren) {
					el.innerHTML = newChildren
				}
			} else {
				// 当原孩子是数组，新孩子是字符串时，无需比较直接替换
				el.innerHTML = newChildren
			}
		} else {
			// 当原孩子是字符串，新孩子是数组时，清除原来的innerHTML，然后mount即可
			if (typeof oldChildren === 'string') {
				el.innerHTML = ''
				newChildren.forEach(child => {
					mount(child, el)
				})
			} else {
				// 数组内的元素个数(包括vdom或字符串)
				const commonLength = Math.min(oldChildren.length, newChildren.length)

				for (let i = 0; i < commonLength; i++) {
					if (
						typeof oldChildren[i] !== 'string' &&
						typeof newChildren[i] !== 'string'
					) {
						patch(oldChildren[i], newChildren[i])
					}
				}
				// 当孩子是数组，而数组内有字符串时无法解析，故在父结点中遍历其子结点，并修改结点的nodeValue
				for (let i = 0; i < commonLength; i++) {
					if (
						typeof oldChildren[i] === 'string' ||
						typeof newChildren[i] === 'string'
					) {
						// 原位置处的孩子是文本
						if (n1.el.childNodes[i].nodeType === 3) {
							// 新位置处的孩子也是文本
							if (typeof newChildren[i] === 'string') {
								n1.el.childNodes[i].nodeValue = newChildren[i] + ' '
							}
							// 新位置处的孩子不是文本
							else {
								// n1.el.childNodes[i].remove() // 'remove()' can't work in IE
								n1.el.childNodes[i].parentNode.removeChild(n1.el.childNodes[i])
								mount(newChildren[i], el, 0, n1.el.childNodes[i])
							}
						}
						// 原位置处的孩子不是文本
						else if (n1.el.childNodes[i].nodeType === 1) {
							// 新位置处的孩子是文本
							if (typeof newChildren[i] === 'string') {
								// n1.el.childNodes[i].remove()
								n1.el.childNodes[i].parentNode.removeChild(n1.el.childNodes[i])
								mount(newChildren[i], el, 0, n1.el.childNodes[i])
							} else {
								patch(oldChildren[i], newChildren[i])
							}
						}
					}
				}
				if (newChildren.length > oldChildren.length) {
					newChildren.slice(oldChildren.length).forEach(child => {
						mount(child, el)
					})
				} else {
					;[...n1.el.childNodes].slice(newChildren.length).forEach(child => {
						el.removeChild(child)
					})
				}
			}
		}
	} else {
		n2.el =
			typeof n2 !== 'string'
				? document.createElement(n2.tag)
				: document.createTextNode(n2 + ' ')
		const nextNode = n1.el.nextSibling
		const parentNode = n1.el.parentNode
		// n1.el.remove()
		n1.el.parentNode.removeChild(n1.el)
		mount(n2, parentNode, 0, nextNode)
	}
}
// new vdom
const vdom1 = h(
	'div',
	{
		class: 'wrapper',
		onclick: event => {
			event.target.style.backgroundColor = 'Gold'
		},
	},
	[
		h('div', { class: 'left' }, [
			h('ul', { class: 'mylist' }, [
				h(
					'li',
					{
						onclick: event => {
							event.target.style.backgroundColor = 'DeepPink'
							event.stopPropagation()
						},
					},
					[
						'orange',
						h('a', { href: 'javascript:;' }, 'test-A'),
						'pear',
						'pineapple',
						'coconut',
						h('a', { href: 'javascript:;' }, 'test-B'),
						h('a', { href: 'javascript:;' }, 'test-C'),
					]
				),
				h('li', null, 'banana'),
				h('li', null, [h('a', { href: 'javascript:;' }, 'test-d')]),
				h('li', null, [h('a', { href: 'javascript:;' }, 'test-e')]),
			]),
		]),
		h('div', { class: 'right' }, [
			'Good game!',
			h('span', null, 'Fuck you'),
			'Go die!',
			h('nav', null, 'Lmao'),
			h('span', null, '233333'),
			h('span', null, '233333'),
		]),
		h(
			'div',
			{
				class: 'other',
				ondblclick: () => {
					console.log('dblclick!')
				},
				onclick: event => {
					event.target.style.backgroundColor = 'cornflowerblue'
					event.stopPropagation()
				},
			},
			['Hello', h('div', null, 'This is a new node!'), 'Hi']
		),
	]
)
patch(vdom, vdom1)

// component
function Demo(props) {
	// return vdom
	return h('nav', props, [
		h('nav', { class: 'my-nav' }, 'This is my nav 0'),
		h('nav', { class: 'my-nav' }, [
			'This is my nav 1',
			h('nav', { class: 'my-nav' }, 'This is my nav 2'),
			h('nav', { class: 'my-nav' }, 'This is my nav 3'),
			h('nav', { class: 'my-nav' }, 'This is my nav 4'),
		]),
	])
}
mount(
	Demo({
		class: 'demo',
		onclick: () => {
			console.log('Component Demo is clicked!')
		},
	}),
	document.getElementById('demo')
)
