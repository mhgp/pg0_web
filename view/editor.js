"use strict";

function editorView(editor, lineNumber) {
	const that = this;
	const editorContainer = editor.parentNode;

	const keywords = ['var', 'exit', 'if', 'else', 'while'];
	const keywords_extension = ['for', 'do', 'break', 'continue', 'switch', 'case', 'default', 'return', 'function'];
	const keywords_preprocessor = ['#import', '#option'];
	const regKeywords = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
	const regKeywordsEx = new RegExp(`\\b(${keywords_extension.join('|')})\\b`, 'gi');
	const regKeywordsPrep = new RegExp(`(${keywords_preprocessor.join('|')})`, 'gi');

	this.storageKey = 'pg0_text';
	this.undoCount = 50;
	this.currentContent = {text: '', caret: 0};
	this.paddingTop = 0;

	that.paddingTop = parseInt(getComputedStyle(editorContainer).paddingTop);

	editor.addEventListener('input', function(e) {
		if (e.isComposing) {
			return;
		}
		if (e.inputType === 'historyUndo') {
			e.preventDefault();
			that.undo();
		} else if (e.inputType === 'historyRedo') {
			e.preventDefault();
			that.redo();
		} else if (e.inputType === 'insertText' && e.data === '}') {
			const pos = getCaretPosition();
			const lines = that.getText().substr(0, pos).split("\n");
			const line = lines[lines.length - 1];
			if (/\t}$/.test(line)) {
				const selection = window.getSelection();
				if (!selection.rangeCount) {
					return;
				}
				let node = selection.focusNode;
				while (node && node.tagName !== 'DIV') {
					node = node.parentNode;
				}
				const str = line.replace(/\t}$/, '}') + node.textContent.substr(line.length);
				node.innerHTML = setKeyword(tagEscape(str));
				setCaretPosition(pos - 1);
				setCurrentContent();
			}
		} else {
			setCurrentContent();
		}
		updateContent();
	}, false);

	editor.addEventListener('compositionstart', function(e) {
		that.saveSelect();
	}, false);

	editor.addEventListener('compositionend', function(e) {
		setCurrentContent();
		updateContent();
	}, false);

	editor.addEventListener('paste', function(e) {
		e.preventDefault();
		that.deleteSelect();
		let str = (e.clipboardData || window.clipboardData).getData('text').replace(/\r/g, '');
		that.insertText(str);
	}, false);

	editor.addEventListener('keydown', function(e) {
		if (e.key === 'Tab') {
			e.preventDefault();
			that.deleteSelect();
			that.insertText("\t");
		} else if (e.key === 'Enter') {
			e.preventDefault();
			that.deleteSelect();
			const pos = getCaretPosition();
			const lines = that.getText().substr(0, pos).split("\n");
			const line = lines[lines.length - 1];
			const m = line.match(/^[ \t]+/);
			let indent = '';
			if (m && m.length > 0) {
				indent = m[0];
			}
			if (/{[ \t]*$/.test(line)) {
				indent += "\t";
			}
			that.insertText("\n" + indent);
		} else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
			e.preventDefault();
			that.undo();
			return;
		} else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
			e.preventDefault();
			that.redo();
			return;
		}
	}, false);

	editor.addEventListener('keyup', function(e) {
		if (e.isComposing) {
			return;
		}
		setTimeout(that.saveSelect, 0);
	}, false);

	let touchstart = 'mousedown';
	if ('ontouchstart' in window) {
		touchstart = 'touchstart';
	}
	editor.addEventListener(touchstart, function(e) {
		if (touchstart === 'mousedown') {
			document.addEventListener('mouseup', touchend);
		} else {
			document.addEventListener('touchend', touchend);
		}
	}, false);
	const touchend = function(e) {
		if (touchstart === 'mousedown') {
			document.removeEventListener('mouseup', touchend);
			setTimeout(that.saveSelect, 0);
		} else {
			document.removeEventListener('touchend', touchend);
			setTimeout(that.saveSelect, 100);
		}
	};

	let sc = {x: 0, y: 0};
	editor.addEventListener('focus', function(e) {
		that.restoreSelect();
		editorContainer.scrollTo(sc.x, sc.y);
	}, false);

	editor.addEventListener('blur', function(e) {
		sc.x = editorContainer.scrollLeft;
		sc.y = editorContainer.scrollTop;
	}, false);

	editorContainer.addEventListener('focus', function(e) {
		editor.focus();
	}, false);
	
	editorContainer.addEventListener('scroll', function(e) {
		sc.x = editorContainer.scrollLeft;
		sc.y = editorContainer.scrollTop;
		lineNumber.scrollTop = editorContainer.scrollTop;
	}, false);

	let startNode = null;
	let startY = 0;
	lineNumber.addEventListener(touchstart, function(e) {
		e.preventDefault();
		editor.focus();
		startNode = null;
		startY = (touchstart === 'mousedown') ? e.y : e.touches[0].clientY;
		selectLine(startY, function() {
			if (touchstart === 'mousedown') {
				document.addEventListener('mousemove', mousemove);
				document.addEventListener('mouseup', mouseup);
			} else {
				document.addEventListener('touchmove', mousemove);
				document.addEventListener('touchend', mouseup);
			}
		});
	}, false);
	const mousemove = function(e) {
		e.preventDefault();
		selectLine(((touchstart === 'mousedown') ? e.y : e.touches[0].clientY), null);
	};
	const mouseup = function(e) {
		if (touchstart === 'mousedown') {
			document.removeEventListener('mousemove', mousemove);
			document.removeEventListener('mouseup', mouseup);
		} else {
			document.removeEventListener('touchmove', mousemove);
			document.removeEventListener('touchend', mouseup);
		}
	};
	const selectLine = function(y, callback) {
		const index = Math.floor((lineNumber.scrollTop + y - editorContainer.offsetTop) / lineNumber.firstChild.offsetHeight);
		let node = getLineNode(index);
		if (node) {
			if (!startNode) {
				startNode = node;
			}
			const selection = window.getSelection();
			if (!selection.rangeCount) {
				return;
			}
			const range = document.createRange();
			if (startY <= y) {
				range.setStart(startNode, 0);
				if (node.nextSibling) {
					range.setEnd(node.nextSibling, 0);
				} else {
					range.setEndAfter(node);
				}
			} else {
				range.setStart(node, 0);
				if (startNode.nextSibling) {
					range.setEnd(startNode.nextSibling, 0);
				} else {
					range.setEndAfter(startNode);
				}
			}
			selection.removeAllRanges();
			selection.addRange(range);
			that.saveSelect();
			node.scrollIntoView({behavior: 'instant', block: 'nearest'});
			if (callback) {
				callback();
			}
		}
	};

	const observer = new ResizeObserver(function() {
		lineNumber.style.height = (editorContainer.clientHeight - that.paddingTop) + 'px';
		lineNumber.scrollTop = editorContainer.scrollTop;
	})
	observer.observe(editorContainer);
	updateLineNumber();

	this.loadState = function() {
		const str = localStorage.getItem(that.storageKey);
		if (str) {
			const state = JSON.parse(str);
			editor.textContent = decodeURIComponent(RawDeflate.inflate(atob(state.text)));
			setAllLine();
			updateLineNumber();
			that.currentContent = state;
			that.restoreSelect();
			that.showCaret();
		}
	};
	this.saveState = function() {
		localStorage.setItem(that.storageKey, JSON.stringify(that.currentContent));
	};

	this.getText = function() {
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
		let buf = '';
		let node;
		let firstDiv = true;
		while ((node = walker.nextNode())) {
			if (node.childNodes && node.childNodes.length > 0 && node.childNodes[0].tagName === 'DIV') {
				continue;
			}
			if (node.nodeType === Node.TEXT_NODE) {
				if (node.parentNode === editor && buf) {
					buf += "\n";
				}
				buf += node.nodeValue;
				firstDiv = false;
			} else if (node.tagName === 'DIV') {
				if (firstDiv) {
					firstDiv = false;
					continue;
				}
				buf += "\n";
			}
		}
		return buf;
	};

	this.unsetHighlight = function() {
		document.querySelectorAll('.highlight').forEach(function(span) {
			span.outerHTML = span.innerHTML;
		});
	};
	this.setHighlight = function(pos, color) {
		that.unsetHighlight();
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT, null, false);
		let node;
		let firstDiv = true;
		let line = 0;
		while ((node = walker.nextNode())) {
			if (node.childNodes && node.childNodes.length > 0 && node.childNodes[0].tagName === 'DIV') {
				continue;
			}
			if (node.tagName === 'DIV') {
				if (firstDiv && pos > 0) {
					firstDiv = false;
					continue;
				}
				line++;
				if (line >= pos) {
					node.innerHTML = `<span class="highlight" style="background-color: ${color};">${setKeyword(tagEscape(node.textContent))}</span>`;
					break;
				}
			}
		}
		const element = document.querySelector('.highlight');
		if (element) {
			element.scrollIntoView({behavior: 'instant', block: 'nearest'});
			editorContainer.scrollLeft = 0;
		}
	};

	this.showCaret = function() {
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		let node = selection.focusNode;
		while (node && node.tagName !== 'DIV') {
			node = node.parentNode;
		}
		if (node && node.id === 'editor') {
			return;
		}
		if (node) {
			const pos = getCaretPosition();
			const lines = that.getText().substr(0, pos).split("\n");
			const line = lines[lines.length - 1];

			const width = getTextWidth(line);
			let x = editorContainer.scrollLeft;
			if (width < (x + 1)) {
				x = width - 1;
				if (x < 0) {
					x = 0;
				}
			}
			if (width > (x - 1) + editorContainer.clientWidth) {
				x = width - editorContainer.clientWidth + 1;
			}
			if (x !== editorContainer.scrollLeft) {
				editorContainer.scrollLeft = x;
			}

			const height = lines.length * node.offsetHeight + that.paddingTop;
			let y = editorContainer.scrollTop;
			if ((height - node.offsetHeight) < y) {
				y = height - node.offsetHeight;
			}
			if (height > y + editorContainer.clientHeight) {
				y = height - editorContainer.clientHeight;
			}
			if (y !== editorContainer.scrollTop) {
				editorContainer.scrollTop = y;
			}
		}
	};
	this.moveCaret = function(move) {
		const caretPosition = getCaretPosition();
		if (caretPosition + move < 0) {
			return;
		}
		setCaretPosition(caretPosition + move);
		that.saveSelect();
	};

	this.saveSelect = function() {
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		const range = selection.getRangeAt(0);
		that.currentContent.start = rangeToOffset(range.startContainer, range.startOffset);
		that.currentContent.end = rangeToOffset(range.endContainer, range.endOffset);
		that.saveState();
	};
	this.restoreSelect = function() {
		if (that.currentContent.start !== undefined) {
			const selection = window.getSelection();
			if (!selection.rangeCount) {
				return;
			}
			const newRange = document.createRange();
			const start = offsetToRange(that.currentContent.start);
			if (start) {
				newRange.setStart(start.node, start.offset);
			}
			const end = offsetToRange(that.currentContent.end);
			if (end) {
				newRange.setEnd(end.node, end.offset);
			}
			selection.removeAllRanges();
			selection.addRange(newRange);
		}
	};
	this.deleteSelect = function() {
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		const range = selection.getRangeAt(0);
		const startContainer = range.startContainer;
		const startOffset = range.startOffset;
		let startDiv = startContainer;
		while (startDiv && startDiv.tagName !== 'DIV') {
			startDiv = startDiv.parentNode;
		}
		const endContainer = range.endContainer;
		let endDiv = endContainer;
		while (endDiv && endDiv.tagName !== 'DIV') {
			endDiv = endDiv.parentNode;
		}
		range.deleteContents();
		if (startDiv !== endDiv && startDiv.nextSibling === endDiv) {
	    	while (endDiv.childNodes.length > 0) {
				startDiv.appendChild(endDiv.firstChild);
			}
			endDiv.parentNode.removeChild(endDiv);
		}
		const newRange = document.createRange();
		newRange.setStart(startContainer, startOffset);
		newRange.collapse(true);
		selection.removeAllRanges();
		selection.addRange(newRange);
	};

	this.insertText = function(text) {
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		if (selection.focusNode === editor) {
			text = text.replace(/\n$/, '');
		}
		const node = document.createTextNode(text);
		selection.getRangeAt(0).insertNode(node);

		const newRange = document.createRange();
		newRange.setStart(node, text.length);
		newRange.collapse(true);
		selection.removeAllRanges();
		selection.addRange(newRange);

		setCurrentContent();
		updateContent();
		that.showCaret();
	};

	let undoStack = [];
	let redoStack = [];
	this.undo = function() {
		if (undoStack.length > 0) {
			redoStack.push(that.currentContent);
			that.currentContent = undoStack.pop();
			setUndoText(that.currentContent);
		}
	};
	this.redo = function() {
		if (redoStack.length > 0) {
			undoStack.push(that.currentContent);
			that.currentContent = redoStack.pop();
			setUndoText(that.currentContent);
		}
	};

	function tagEscape(str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
	function setKeyword(str) {
		str = str.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="string-literal">&quot;$1&quot;</span>');
		str = str.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '<span class="string-literal">&#39;$1&#39;</span>');
		str = str.replace(regKeywords, function(match) {return `<span class="keyword">${match}</span>`;});
		str = str.replace(regKeywordsEx, function(match) {return `<span class="keyword">${match}</span>`;});
		str = str.replace(regKeywordsPrep, function(match) {return `<span class="keyword">${match}</span>`;});
		str = str.replace(/(\/\/.*)$/gm, '<span class="comment">$1</span>');
		return str;
	}

	function getTextWidth(line) {
		const cssDecl = getComputedStyle(editor);
		const context = document.createElement('canvas').getContext('2d');
		context.font = cssDecl.font;
		const tabSize = parseInt(cssDecl.tabSize);
		const text = line.split('');
		let width = 0;
		let pos = 0;
		for (let i = 0; i < text.length; i++) {
			if (text[i] === '\t') {
				const spacesToNextTabStop = tabSize - (pos % tabSize);
				pos += spacesToNextTabStop;
				width += context.measureText(' '.repeat(spacesToNextTabStop)).width;
			} else {
				pos++;
				width += context.measureText(text[i]).width;
			}
		}
		return width;
	}

	function getLineNode(pos) {
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT, null, false);
		let node;
		let firstDiv = true;
		let line = 0;
		while ((node = walker.nextNode())) {
			if (node.childNodes && node.childNodes.length > 0 && node.childNodes[0].tagName === 'DIV') {
				continue;
			}
			if (node.tagName === 'DIV') {
				if (firstDiv && pos > 0) {
					firstDiv = false;
					continue;
				}
				line++;
				if (line >= pos) {
					return node;
				}
			}
		}
		return null;
	}
	function getLineCount() {
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT, null, false);
		let node;
		let firstDiv = true;
		let cnt = 1;
		while ((node = walker.nextNode())) {
			if (node.childNodes && node.childNodes.length > 0 && node.childNodes[0].tagName === 'DIV') {
				continue;
			}
			if (node.tagName === 'DIV') {
				if (firstDiv) {
					firstDiv = false;
					continue;
				}
				cnt++;
			}
		}
		return cnt;
	}
	function updateLineNumber() {
		const cnt = getLineCount();
		if (cnt > lineNumber.childElementCount) {
			for (let i = lineNumber.childElementCount; i < cnt; i++) {
				const div = document.createElement('div');
				div.textContent = i + 1;
				lineNumber.appendChild(div);
			}
		} else {
			for (let i = lineNumber.childElementCount; i > cnt; i--) {
				lineNumber.lastChild.remove();
			}
		}
	}
	function setAllLine() {
		const lines = that.getText().split("\n");
		let newContent = '';
		lines.forEach(function(line, index) {
			if (!line) {
				newContent += '<div><br /></div>';
			} else {
				newContent += `<div>${setKeyword(tagEscape(line))}</div>`;
			}
		});
		editor.innerHTML = newContent;
	}
	function updateLine() {
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		let node = selection.focusNode;
		while (node && node.tagName !== 'DIV') {
			node = node.parentNode;
		}
		if (node && node.tagName === 'DIV') {
			const line = node.textContent;
			let html;
			if (!line) {
				html = '<br />';
			} else {
				html = setKeyword(tagEscape(line));
			}
			if (node.innerHTML !== html) {
				node.innerHTML = html;
			}
		}
	}
	function isMultiLine() {
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
		let node;
		while ((node = walker.nextNode())) {
			if (node.nodeType === Node.TEXT_NODE) {
				if (node.parentNode === editor) {
					return true;
				}
				const l = node.nodeValue.split('\n');
				if (l.length > 1) {
					return true;
				}
			}
		}
		return false;
	}
	function updateContent() {
		that.saveSelect();
		if (!editor.childNodes[0] || editor.childNodes[0].nodeName !== 'DIV' || isMultiLine()) {
			setAllLine();
		} else {
			updateLine();
		}
		updateLineNumber();
		that.restoreSelect();
	}

	function rangeToOffset(container, offset) {
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		if (container === editor) {
			if (container.childNodes.length === 0) {
				return 0;
			} else if (container.childNodes.length <= offset) {
				container = null;
				offset = 0;
			} else {
				container = container.childNodes[offset];
				offset = 0;
			}
		}
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
		let caretOffset = 0;
		let firstDiv = true;
		let node;
		while ((node = walker.nextNode())) {
			if (node.childNodes && node.childNodes.length > 0 && node.childNodes[0].tagName === 'DIV') {
				continue;
			}
			if (node === container) {
				if (node.tagName === 'DIV') {
					if (caretOffset > 0 || !firstDiv) {
						caretOffset++;
					}
				} else {
					caretOffset += offset;
				}
				break;
			} else if (node.nodeType === Node.TEXT_NODE) {
				if (node.parentNode === editor && caretOffset > 0) {
					caretOffset++;
				}
				caretOffset += node.nodeValue.length;
				firstDiv = false;
			} else if (node.tagName === 'DIV') {
				if (firstDiv) {
					firstDiv = false;
					continue;
				}
				caretOffset++;
			}
		}
		return caretOffset;
	}
	function offsetToRange(position) {
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
		let charCount = 0;
		let firstDiv = true;
		let node;
		while ((node = walker.nextNode())) {
			if (node.childNodes && node.childNodes.length > 0 && node.childNodes[0].tagName === 'DIV') {
				continue;
			}
			if (node.nodeType === Node.TEXT_NODE) {
				const nextCharIndex = charCount + node.nodeValue.length;
				if (nextCharIndex >= position) {
					return {node: node, offset: position - charCount};
				}
				charCount = nextCharIndex;
				firstDiv = false;
			} else if (node.tagName === 'DIV') {
				if (firstDiv && position > 0) {
					firstDiv = false;
					continue;
				}
				charCount += 1;
				if (charCount >= position) {
					return {node: node, offset: 0};
				}
			}
		}
		return null;
	}
	function getCaretPosition() {
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		const range = selection.getRangeAt(0);
		return rangeToOffset(range.startContainer, range.startOffset);
	}
	function setCaretPosition(position) {
		const selection = window.getSelection();
		if (!selection.rangeCount) {
			return;
		}
		const select = offsetToRange(position);
		if (!select) {
			return;
		}
		const range = document.createRange();
		range.setStart(select.node, select.offset);
		range.collapse(true);
		selection.removeAllRanges();
		selection.addRange(range);
		that.showCaret();
	}

	function setCurrentContent() {
		const encodeText = btoa(RawDeflate.deflate(encodeURIComponent(that.getText())));
		if (that.currentContent.text === encodeText) {
			return;
		}
		undoStack.push(that.currentContent);
		redoStack = [];
		if (undoStack.length > that.undoCount) {
			undoStack.shift();
		}
		that.currentContent = {text: encodeText, caret: 0, select: {}};
		that.saveSelect();
	}
	function setUndoText(state) {
		editor.textContent = decodeURIComponent(RawDeflate.inflate(atob(state.text)));
		setAllLine();
		updateLineNumber();
		that.currentContent.start = state.start;
		that.currentContent.end = state.end;
		that.restoreSelect();
		that.showCaret();
		that.saveState();
	}
}

