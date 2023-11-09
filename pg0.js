"use strict";

let verX = 400;
let verY = 150;
let consoleY = 150;

window.onload = function() {
	const _rw = window.getComputedStyle(document.body).getPropertyValue('--rezie-with');
	let rw = parseInt(_rw.replace(/[^0-9]/g, ''));
	const ua = user_agent.get();
	if (ua.isiOS || ua.isAndroid) {
		rw = 20;
		document.body.style.setProperty('--rezie-with', rw + 'px');
	}

	function setGridTemplate() {
		if (window.orientation !== undefined && window.orientation === 0) {
			document.getElementById('container').style.gridTemplateRows = `58px 1fr ${rw}px ${verY}px ${rw}px ${consoleY}px`;
			document.getElementById('container').style.gridTemplateColumns = 'auto';
		} else {
			document.getElementById('container').style.gridTemplateRows = `42px 1fr ${rw}px ${consoleY}px`;
			document.getElementById('container').style.gridTemplateColumns = `1fr ${rw}px ${verX}px`;
		}
	}
	setGridTemplate();

	document.getElementById('var_resizer_x').addEventListener('mousedown', function(e) {
		if (e.cancelable) {
			e.preventDefault();
		}
		let x = e.x;
		function resize(e) {
			verX += x - e.x;
			if (verX < 0) {
				verX = 0;
			} else if (verX > window.innerWidth - 100) {
				verX = window.innerWidth - 100;
			} else {
				x = e.x;
			}
			setGridTemplate();
		}
		document.addEventListener('mousemove', resize, false);
		['mouseup', 'mouseleave'].forEach(function(e) {
			document.addEventListener(e, function() {
				document.removeEventListener('mousemove', resize, false);
			}, false);
		});
	}, false);

	document.getElementById('var_resizer_x').addEventListener('touchstart', function(e) {
		if (e.cancelable) {
			e.preventDefault();
		}
		let x = e.touches[0].clientX;
		function resize(e) {
			verX += x - e.touches[0].clientX;
			if (verX < 0) {
				verX = 0;
			} else if (verX > window.innerWidth - 100) {
				verX = window.innerWidth - 100;
			} else {
				x = e.touches[0].clientX;
			}
			setGridTemplate();
		}
		document.addEventListener('touchmove', resize, false);
		['touchend'].forEach(function(e) {
			document.addEventListener(e, function() {
				document.removeEventListener('touchmove', resize, false);
			}, false);
		});
	}, false);

	document.getElementById('var_resizer_y').addEventListener('mousedown', function(e) {
		if (e.cancelable) {
			e.preventDefault();
		}
		let y = e.y;
		function resize(e) {
			verY += y - e.y;
			if (verY < 0) {
				verY = 0;
			} else if (verY > window.innerHeight - 100) {
				verY = window.innerHeight - 100;
			} else {
				y = e.y;
			}
			setGridTemplate();
		}
		document.addEventListener('mousemove', resize, false);
		['mouseup', 'mouseleave'].forEach(function(e) {
			document.addEventListener(e, function() {
				document.removeEventListener('mousemove', resize, false);
			}, false);
		});
	}, false);

	document.getElementById('var_resizer_y').addEventListener('touchstart', function(e) {
		if (e.cancelable) {
			e.preventDefault();
		}
		let y = e.touches[0].clientY;
		function resize(e) {
			verY += y - e.touches[0].clientY;
			if (verY < 0) {
				verY = 0;
			} else if (verY > window.innerHeight - 100) {
				verY = window.innerHeight - 100;
			} else {
				y = e.touches[0].clientY;
			}
			setGridTemplate();
		}
		document.addEventListener('touchmove', resize, false);
		['touchend'].forEach(function(e) {
			document.addEventListener(e, function() {
				document.removeEventListener('touchmove', resize, false);
			}, false);
		});
	}, false);

	document.getElementById('console_resizer').addEventListener('mousedown', function(e) {
		if (e.cancelable) {
			e.preventDefault();
		}
		let y = e.y;
		function resize(e) {
			if (window.orientation !== undefined && window.orientation === 0) {
				const wk = consoleY;
				consoleY += y - e.y;
				if (consoleY >= 0 && consoleY <= window.innerHeight - 100) {
					verY = verY - (consoleY - wk);
				}
			} else {
				consoleY += y - e.y;
			}
			if (consoleY < 0) {
				consoleY = 0;
			} else if (consoleY > window.innerHeight - 100) {
				consoleY = window.innerHeight - 100;
			} else {
				y = e.y;
			}
			consoleView.fixBottom(function() {
				setGridTemplate();
			});
		}
		document.addEventListener('mousemove', resize, false);
		['mouseup', 'mouseleave'].forEach(function(e) {
			document.addEventListener(e, function() {
				document.removeEventListener('mousemove', resize, false);
			}, false);
		});
	}, false);

	document.getElementById('console_resizer').addEventListener('touchstart', function(e) {
		if (e.cancelable) {
			e.preventDefault();
		}
		let y = e.touches[0].clientY;
		function resize(e) {
			if (window.orientation !== undefined && window.orientation === 0) {
				const wk = consoleY;
				consoleY += y - e.touches[0].clientY;
				if (consoleY >= 0 && consoleY <= window.innerHeight - 100) {
					verY = verY - (consoleY - wk);
				}
			} else {
				consoleY += y - e.touches[0].clientY;
			}
			if (consoleY < 0) {
				consoleY = 0;
			} else if (consoleY > window.innerHeight - 100) {
				consoleY = window.innerHeight - 100;
			} else {
				y = e.touches[0].clientY;
			}
			consoleView.fixBottom(function() {
				setGridTemplate();
			});
		}
		document.addEventListener('touchmove', resize, false);
		['touchend'].forEach(function(e) {
			document.addEventListener(e, function() {
				document.removeEventListener('touchmove', resize, false);
			}, false);
		});
	}, false);

	let prev_orientation;
	window.addEventListener('resize', function(e) {
		if (window.orientation !== undefined && window.orientation !== prev_orientation) {
			prev_orientation = window.orientation;
			setGridTemplate();
			setTimeout(function() {
				consoleView.toBottom();
			}, 1);
		}
	}, false);
}

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
	consoleView.error(`${escapeHTML(str)}`);
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
	consoleView.put(escapeHTML(str).replace(/\\n/, '<br />'));
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
		consoleView.put('<hr />');
	}
	consoleView.info(runMsg.CONSOLE_START);
	document.getElementById('stop_button').removeAttribute('disabled');
	document.getElementById('variable').innerHTML = '';
	const elm = document.getElementsByClassName('lib');
	if (0 < elm.length) {
		Array.from(elm).forEach(function(v) {
			return v.remove();
		});
	}
	const extension = document.getElementById('kind').value === 'PG0' ? false : true;
	const sci = Script.initScriptInfo(buf, {extension: extension});
	const scis = [sci];
	await _exec(scis, sci, false);
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

async function _exec(scis, sci, imp) {
	const sp = new ScriptParse(sci);
	try {
		await sp.parse(sci.src, {
			import: async function(file) {
				if (!document.getElementById(file)) {
					return -1;
				}
				const _buf = document.getElementById(file).value;
				if (!_buf) {
					return 0;
				}
				const _sci = Script.initScriptInfo(_buf, {extension: true});
				scis.push(_sci);
				await _exec(scis, _sci, false, true);
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
							if (run) {
								consoleView.info(runMsg.CONSOLE_END);
							} else {
								consoleView.info(runMsg.CONSOLE_STOP);
							}
							if (value) {
								if (value.type === TYPE_INTEGER || value.type === TYPE_FLOAT) {
									consoleView.info(runMsg.CONSOLE_RESULT, escapeHTML(ScriptExec.getValueString(value)));
								} else if (value.type === TYPE_STRING) {
									consoleView.info(runMsg.CONSOLE_RESULT, `"${escapeHTML(ScriptExec.getValueString(value))}"`);
								} else if (value.type === TYPE_ARRAY) {
									consoleView.info(runMsg.CONSOLE_RESULT, `{${escapeHTML(arrayToString(value.array))}}`);
								}
							}
							if (run) {
								document.getElementById('variable').innerHTML = '';
								showVariable(sci.ei);
							}
						},
						error: async function(error) {
							consoleView.error(`Error: ${error.msg} (${error.line + 1}): ${error.src}`);
							consoleView.info(runMsg.CONSOLE_END);
						}
					});
				} catch(e) {
					consoleView.error(`Error: ${e.message}`);
					consoleView.info(runMsg.CONSOLE_END);
				}
			},
			error: async function(error) {
				consoleView.error(`Error: ${error.msg} (${error.line + 1}): ${error.src}`);
				consoleView.info(runMsg.CONSOLE_END);
			}
		});
	} catch(e) {
		consoleView.error(`Error: ${e.message}`);
		consoleView.info(runMsg.CONSOLE_END);
	}
}

function stop() {
	run = false;
}

function clearConsole() {
	document.getElementById('variable').innerHTML = '';
	document.getElementById('console').innerHTML = '';
}
