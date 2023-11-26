"use strict";

function variableView(variable) {
	const that = this;

	const varName = document.querySelector('#' + variable.id + ' #var_name');
	const varVal = document.querySelector('#' + variable.id + ' #var_value');

	let verX = 200;
	const _rw = window.getComputedStyle(document.body).getPropertyValue('--resize-with');
	let rw = parseInt(_rw.replace(/[^0-9]/g, ''));
	const ua = user_agent.get();
	if (ua.isiOS || ua.isAndroid) {
		rw = 20;
	}

	this.clear = function() {
		varName.innerHTML = `<div class="var_header">${runMsg.VARIABLE_NAME}</div>`;
		varVal.innerHTML = `<div class="var_header">${runMsg.VARIABLE_VALUE}</div>`;
	};
	this.clear();

	this.set = function(ei) {
		initVar();
		setVar(ei);
		finalizeVar();
	};

	let touchstart = 'mousedown';
	let touchmove = 'mousemove';
	let touchend = ['mouseup', 'mouseleave'];
	if ('ontouchstart' in window) {
		touchstart = 'touchstart';
		touchmove = 'touchmove';
		touchend = ['touchend'];
	}
	let resizeFunc = null;

	document.querySelector('#' + variable.id + ' #var_resizer').addEventListener(touchstart, function(e) {
		if (e.cancelable) {
			e.preventDefault();
		}
		let x = e.x ? e.x : e.touches[0].clientX;
		resizeFunc = function(e) {
			const ex = e.x ? e.x : e.touches[0].clientX;
			verX -= x - ex;
			if (verX < 50) {
				verX = 50;
			} else {
				x = ex;
			}
			variable.style.gridTemplateColumns = `${verX}px ${rw}px max-content`;
		};
		document.addEventListener(touchmove, resizeFunc, false);
	}, false);
	touchend.forEach(function(e) {
		document.addEventListener(e, function() {
			if (resizeFunc) {
				document.removeEventListener(touchmove, resizeFunc, false);
				resizeFunc = null;
			}
		}, false);
	});

	variable.addEventListener('click', function(e) {
		if (e.target.parentNode !== variable) {
			return;
		}
		unselect();
	});

	function setItemEvent(target) {
		target.addEventListener('click', function(e) {
			if (e.target.classList.contains('open_icon')) {
				return;
			}
			const index = getIndex(e.target);
			const nameNode = varName.childNodes[index + 1];
			const valNode = varVal.childNodes[index + 1];
			if (nameNode.classList.contains('var_select')) {
				unselect();
				return;
			}
			unselect();
			nameNode.classList.add('var_select');
			valNode.classList.add('var_select');
		});
		target.addEventListener('dblclick', function(e) {
			const index = getIndex(e.target);
			const nameNode = varName.childNodes[index + 1];
			const valNode = varVal.childNodes[index + 1];
			unselect();
			nameNode.classList.add('var_select');
			valNode.classList.add('var_select');
			const str = nameNode.textContent + ' = ' + valNode.textContent;
			if (navigator.clipboard) {
				return navigator.clipboard.writeText(str);
			}
		});
	}
	function setOpenEvent(target) {
		target.addEventListener('click', function(e) {
			e.preventDefault();
			openTree(getIndex(e.target));
		});
	}

	function getIndex(elm) {
		while (elm && elm.tagName !== 'DIV') {
			elm = elm.parentNode;
		}
		let elms;
		if (elm.classList.contains('item_name')) {
			elms = document.querySelectorAll('.item_name');
		} else {
			elms = document.querySelectorAll('.item_val');
		}
		return [].slice.call(elms).indexOf(elm);
	}

	function unselect() {
		document.querySelectorAll('.var_select').forEach(function(target) {
			target.classList.remove('var_select');
		});
	}

	function openTree(index) {
		const node = varName.childNodes[index + 1];
		if (!node.classList.contains('array')) {
			return;
		}
		const open = node.classList.contains('open');
		if (open) {
			node.classList.remove('open');
		} else {
			node.classList.add('open');
		}
		const indent = parseInt(node.getAttribute('indent'));
		const count = varName.childNodes.length;
		showTree(index + 2, count, !open, indent + 1);
		if (window.getSelection) {
			window.getSelection().removeAllRanges();
		}
	}
	function showTree(index, count, open, indent) {
		let j = index;
		for (; j < count; j++) {
			const nameNode = varName.childNodes[j];
			const valNode = varVal.childNodes[j];
			const nextIndent = parseInt(nameNode.getAttribute('indent'));
			if (nextIndent < indent) {
				return j - 1;
			}
			if (!open) {
				nameNode.style.display = 'none';
				valNode.style.display = 'none';
			} else {
				nameNode.style.display = 'block';
				valNode.style.display = 'block';
			}
			if (nameNode.classList.contains('array')) {
				const op = (!open) ? false : nameNode.classList.contains('open');
				j = showTree(j + 1, count, op, indent + 1);
			}
		}
		return j;
	}

	let prevName;
	let prevVal;
	function initVar() {
		prevName = varName.childNodes[0];
		prevVal = varVal.childNodes[0];
		for (let elm = prevName.nextSibling; elm; elm = elm.nextSibling) {
			elm.setAttribute('exist', 'false');
		}
		for (let elm = prevVal.nextSibling; elm; elm = elm.nextSibling) {
			elm.setAttribute('exist', 'false');
			elm.classList.remove('modify');
		}
	}
	function setVar(ei) {
		if (!ei) {
			return;
		}
		setVar(ei.parent);
		for (let key in ei.vi) {
			setvi(variable.id + '-' + ei.id, key, ei.vi[key], 0, true);
		}
	}
	function setvi(eid, key, v, indent, open) {
		let buf;
		if (v.type === TYPE_ARRAY) {
			buf = '{' + pg0_string.arrayToString(v.array) + '}';
		} else if (v.type === TYPE_STRING) {
			buf = '"' + ScriptExec.getValueString(v) + '"';
		} else {
			buf = ScriptExec.getValueString(v);
		}
		const newEid = eid + '-' + key;
		let nameNode = document.getElementById(newEid);
		let valNode;
		if (nameNode) {
			nameNode.setAttribute('exist', 'true');
			valNode = document.getElementById(newEid + '--val');
			valNode.setAttribute('exist', 'true');
			if (valNode.textContent !== buf) {
				valNode.classList.add('modify');
				valNode.textContent = buf;
			}
		} else {
			nameNode = document.createElement('div');
			nameNode.classList.add('item_name');
			nameNode.setAttribute('id', newEid);
			nameNode.setAttribute('indent', indent);
			nameNode.setAttribute('exist', 'true');
			nameNode.style.textIndent = (indent * 20) + 'px';
			const pspan = document.createElement('span');
			nameNode.appendChild(pspan);
			const ospan = document.createElement('span');
			ospan.classList.add('open_icon');
			setOpenEvent(ospan);
			pspan.appendChild(ospan);
			const span = document.createElement('span');
			span.textContent = key;
			pspan.appendChild(span);
			prevName.after(nameNode);
			setItemEvent(nameNode);

			valNode = document.createElement('div');
			valNode.setAttribute('id', newEid + '--val');
			valNode.setAttribute('exist', 'true');
			valNode.classList.add('item_val');
			valNode.classList.add('modify');
			valNode.textContent = buf;
			valNode.setAttribute('indent', indent);
			prevVal.after(valNode);
			setItemEvent(valNode);

			if (!open) {
				nameNode.style.display = 'none';
				valNode.style.display = 'none';
			}
		}
		prevName = nameNode;
		prevVal = valNode;
		if (v.type === TYPE_ARRAY) {
			nameNode.classList.add('array');
			const op = nameNode.classList.contains('open');
			v.array.forEach(function(a, i) {
				setvi(newEid, a.name || i, a.v, indent + 1, open && op);
			});
		} else {
			nameNode.classList.remove('array');
		}
	}
	function finalizeVar() {
		removeNode(varName.childNodes[1]);
		removeNode(varVal.childNodes[1]);
		function removeNode(elm) {
			while (elm) {
				if (elm.getAttribute('exist') !== 'true') {
					const wk = elm;
					elm = elm.nextSibling;
					wk.remove();
					continue;
				}
				elm = elm.nextSibling;
			}
		}
	}
}
