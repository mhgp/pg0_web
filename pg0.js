"use strict";

ScriptExec.lib['error'] = async function(ei, param, ret) {
	if (param.length === 0) {
		return -2;
	}
	let str = '';
	if (param[0].v.type === TYPE_ARRAY) {
		str = '{' + arrayToString(param[0].v.array) + '}'
	} else {
		str = ScriptExec.getValueString(param[0].v);
	}
	putConsoleTime(`<span class="error">${escapeHTML(str)}</span>`);
	return 0;
};

ScriptExec.lib['print'] = async function(ei, param, ret) {
	if (param.length === 0) {
		return -2;
	}
	let str = '';
	if (param[0].v.type === TYPE_ARRAY) {
		str = '{' + arrayToString(param[0].v.array) + '}'
	} else {
		str = ScriptExec.getValueString(param[0].v);
	}
	putConsole(escapeHTML(str).replace(/\\n/, '<br />'));
	return 0;
};

ScriptExec.lib['input'] = async function(ei, param, ret) {
	const str = window.prompt('input');
	if (str !== null) {
		ret.v.str = str;
		ret.v.type = TYPE_STRING;
	}
	return 0;
};

function putConsole(msg) {
	const console = document.getElementById('console');
	const wrapper = document.getElementById('console_wrapper');
	const toBottom = wrapper.scrollTop + wrapper.clientHeight >= console.offsetHeight;
	console.innerHTML += msg;
	if (toBottom) {
		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
	}
}

function putConsoleTime(msg) {
	const time = date_format.formatTime(new Date(), navigator.language);
	msg = `<div><span class="time">${time}</span> ${msg}</div>`;
	putConsole(msg);
}

function escapeHTML(str) {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function arrayToString(array) {
	let ret = '';
	array.forEach(function(a) {
		if (ret) {
			ret = ret + ', ';
		}
		if (a.name) {
			ret += '"' + a.name + '": ';
		}
		if (a.v.type === TYPE_ARRAY) {
			ret += '{' + arrayToString(a.v.array) + '}';
		} else if (a.v.type === TYPE_STRING) {
			ret += '"' + ScriptExec.getValueString(a.v) + '"';
		} else {
			ret += ScriptExec.getValueString(a.v);
		}
	});
	return ret;
}

function showVariable(ei) {
	if (!ei) {
		return;
	}
	showVariable(ei.parent);
	
	let buf = '';
	for (let key in ei.vi) {
		const v = ei.vi[key];
		buf += escapeHTML(key) + ': ';
		if (v.type === TYPE_ARRAY) {
			buf += '{' + escapeHTML(arrayToString(v.array)) + '}'
		} else if (v.type === TYPE_STRING) {
			buf += '"' + escapeHTML(ScriptExec.getValueString(v)) + '"'
		} else {
			buf += escapeHTML(ScriptExec.getValueString(v));
		}
		buf += '<br />';
	}
	document.getElementById('variable').innerHTML += buf;
}

let run = false;
let step = false;
let execLine = -1;
let nextStep = true;

async function exec(_step) {
	if (run) {
		if (_step) {
			step = true;
		} else if (step) {
			step = false;
		}
		nextStep = true;
		return;
	}
	const buf = document.getElementById('src').value;
	if (!buf) {
		return;
	}
	run = true;
	step = _step;
	execLine = -1;
	nextStep = false;
	if (document.getElementById('console').childElementCount > 0) {
		putConsole('<hr />');
	}
	putConsoleTime(`<span class="info">${runMsg.CONSOLE_START}</span>`);
	document.getElementById('stop_button').removeAttribute('disabled');
	document.getElementById('variable').innerHTML = '';
	const elm = document.getElementsByClassName('lib');
	if (0 < elm.length) {
		Array.from(elm).forEach(function(v) {
			return v.remove();
		});
	}
	const extension = document.getElementById('kind').value === 'PG0' ? false : true;
	const sci = Script.initScriptInfo({extension: extension});
	const scis = [sci];
	await _exec(scis, sci, buf, false);
	document.getElementById('stop_button').setAttribute('disabled', true);
	run = false;
}

async function loadScript(file) {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.classList.add('lib');
		script.src = file;
		script.onload = () => resolve(script);
		script.onerror = () => reject(new Error('Script load error'));
		document.head.appendChild(script);
	});
}

async function _exec(scis, sci, buf, imp) {
	const sp = new ScriptParse(sci);
	try {
		await sp.parse(buf, {
			import: async function(file) {
				if (!document.getElementById(file)) {
					return -1;
				}
				const _buf = document.getElementById(file).value;
				const _sci = Script.initScriptInfo({extension: true});
				scis.push(_sci);
				await _exec(scis, _sci, _buf, false, true);
				return 0;
			},
			library: async function(file) {
				try {
					await loadScript(file);
				} catch(e) {
					return -1;
				}
				return 0;
			},
			success: async function(token) {
				//console.log(token);
				const se = new ScriptExec(scis, sci);
				try {
					let syncCnt = 0;
					await se.exec(token, {}, {
						callback: async function(ei) {
							//console.log(`line=${ei.token[ei.index].line}, token=${ei.token[ei.index].type}, vi=${JSON.stringify(ei.vi)}`);
							if (ei.token[ei.index].line >= 0 && execLine !== ei.token[ei.index].line) {
								execLine = ei.token[ei.index].line;
								if (step) {
									document.getElementById('variable').innerHTML = '';
									showVariable(ei);
									while (!nextStep && run) {
										await new Promise(resolve => setTimeout(resolve, 100));
									}
									nextStep = false;
								} else {
									const speed = parseInt(document.getElementById('speed').value);
									if (speed === 0) {
										syncCnt++;
										if (syncCnt > 1000) {
											await new Promise(resolve => setTimeout(resolve, 0));
											syncCnt = 0;
										}
									} else {
										document.getElementById('variable').innerHTML = '';
										showVariable(ei);
										await new Promise(resolve => setTimeout(resolve, speed));
									}
								}
							}
							if (!run) {
								return 1;
							}
							return 0;
						},
						success: async function(value) {
							if (imp) {
								return;
							}
							putConsoleTime(`<span class="info">${runMsg.CONSOLE_END}</span>`);
							if (value) {
								if (value.type === TYPE_INTEGER || value.type === TYPE_FLOAT) {
									putConsoleTime(`<span class="info">${runMsg.CONSOLE_RESULT}</span> ${escapeHTML(ScriptExec.getValueString(value))}`);
								} else if (value.type === TYPE_STRING) {
									putConsoleTime(`<span class="info">${runMsg.CONSOLE_RESULT}</span> "${escapeHTML(ScriptExec.getValueString(value))}"`);
								} else if (value.type === TYPE_ARRAY) {
									putConsoleTime(`<span class="info">${runMsg.CONSOLE_RESULT}</span> {${escapeHTML(arrayToString(value.array))}}`);
								}
							}
							document.getElementById('variable').innerHTML = '';
							showVariable(sci.ei);
						},
						error: async function(error) {
							putConsoleTime(`<span class="error">Error: ${error.msg} (${error.line + 1})</span>`);
							putConsoleTime(`<span class="info">${runMsg.CONSOLE_END}</span>`);
						}
					});
				} catch(e) {
					putConsoleTime(`<span class="error">Error: ${e}</span>`);
					putConsoleTime(`<span class="info">${runMsg.CONSOLE_END}</span>`);
				}
			},
			error: async function(error) {
				putConsoleTime(`<span class="error">Error: ${error.msg} (${error.line + 1})</span>`);
				putConsoleTime(`<span class="info">${runMsg.CONSOLE_END}</span>`);
			}
		});
	} catch(e) {
		putConsoleTime(`<span class="error">Error: ${e}</span>`);
		putConsoleTime(`<span class="info">${runMsg.CONSOLE_END}</span>`);
	}
}

function stop() {
	run = false;
}

function clearConsole() {
	document.getElementById('variable').innerHTML = '';
	document.getElementById('console').innerHTML = '';
}
