"use strict";

const settingView = (function () {
	const me = {};

	me.storageKey = 'pg0_option';

	me.load = function() {
		const str = localStorage.getItem(me.storageKey);
		if (str) {
			const op = JSON.parse(str);
			options.execMode = (op.execMode !== undefined) ? op.execMode : options.execMode;
			options.execSpeed = (op.execSpeed !== undefined) ? op.execSpeed : options.execSpeed;
			options.fontSize = (op.fontSize !== undefined) ? op.fontSize : options.fontSize;
			options.showLineNum = (op.showLineNum !== undefined) ? op.showLineNum : options.showLineNum;
			options.boundary = (op.boundary !== undefined) ? op.boundary : options.boundary;
		}
	};

	me.save = function() {
		localStorage.setItem(me.storageKey, JSON.stringify(options));
	};

	me.show = function() {
		if (document.getElementById('modal-overlay')) {
			return;
		}
		const modal = document.createElement('div');
		modal.setAttribute('id', 'modal-overlay');
		modal.addEventListener('click', function(e) {
			me.close();
		}, false);
		document.body.append(modal);
		document.getElementById('setting').style.display = 'block';

		document.getElementById('setting-mode').value = options.execMode;
		document.getElementById('setting-font').value = options.fontSize;
		document.getElementById('setting-linenum').checked = options.showLineNum;
	};

	me.close = function() {
		document.getElementById('modal-overlay').remove();
		document.getElementById('setting').style.display = 'none';
	};

	document.addEventListener('DOMContentLoaded', function() {
		document.getElementById('setting-mode-title').textContent = resource.SETTING_MODE_TITLE;
		for (let key in resource.SETTING_MODE) {
			const op = document.createElement('option');
			op.value = key;
			op.textContent = resource.SETTING_MODE[key];
			document.getElementById('setting-mode').append(op);
		}
		document.getElementById('setting-font-title').textContent = resource.SETTING_FONT_SIZE_TITLE;
		for (let key in resource.SETTING_FONT_SIZE) {
			const op = document.createElement('option');
			op.value = key;
			op.textContent = resource.SETTING_FONT_SIZE[key];
			document.getElementById('setting-font').append(op);
		}
		document.getElementById('setting-linenum-title').textContent = resource.SETTING_LINENUM_TITLE;

		document.querySelector('#setting .close').addEventListener('click', function(e) {
			me.close();
		}, false);

		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape' && document.getElementById('modal-overlay')) {
				me.close();
			}
		}, false);

		document.querySelectorAll('.setting-item').forEach(function(item) {
			item.addEventListener('change', function(e) {
				options.execMode = document.getElementById('setting-mode').value;
				options.fontSize = document.getElementById('setting-font').value;
				options.showLineNum = document.getElementById('setting-linenum').checked;
				me.save();
				// Notify main event
				document.dispatchEvent(new CustomEvent('setting_change'));
			}, false);
		});
	}, false);

	return me;
})();
