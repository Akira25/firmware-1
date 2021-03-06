
function $(id) { return document.getElementById(id); }
function show(e) { e.style.display = 'block'; }
function hide(e) { e.style.display = 'none'; }
function setText(id, txt) { $(id).innerHTML = txt; }
function inArray(item, array) { return array.indexOf(item) != -1; }

function split(str)
{
	if (typeof str != 'string') {
		return [];
	}
	var a = str.match(/[^\s]+/g);
	return (a ? a : []);
}

function uniq(arr)
{
	var obj = {};
	for (var i in arr) obj[arr[i]] = 0;
	return Object.keys(obj);
}

//remove an item from a string list
function removeItem(str, item)
{
	var array = split(str);
	for (var i in array) {
		if (array[i] === item) {
			array.splice(i, 1);
		}
	}
	return array.join(' ');
}

function addItem(str, item)
{
	var array = split(str);
	for (var i in array) {
		if (array[i] === item) {
			return str;
		}
	}
	array.push(item);
	return array.sort().join(' ');
}

function replaceItem(str, old_item, new_item)
{
	var array = split(str);
	for (var i in array) {
		if (array[i] == old_item) {
			array[i] = new_item;
		}
	}
	return array.join(' ');
}

function addHelp(elem, text) {
	var help = $('help');

	if (help) {
		elem.onmouseover = function(e) {
			help.style.top = (e.clientY-20)+'px';
			help.style.left = (e.clientX+80)+'px';
			help.textContent = tr(text);
			show(help);
		};

		elem.onmouseout = function() {
			help.textContent = '';
			hide(help);
		};
	}
}

//to config file syntax
function toUCI(pkg_obj)
{
	var str = '\n';
	for (var sid in pkg_obj)
	{
		if (sid == 'pchanged') {
			continue;
		}

		var options = pkg_obj[sid];
		var sname = (sid.substring(0, 3) != 'cfg') ? (' \''+sid+'\'') : '';
		str += 'config '+options.stype+sname+'\n';
		for (var oname in options) {
			if (oname == 'stype'){
				continue;
			}
			var value = options[oname];
			if (typeof value == 'object') {
				for (var i in value)
					str += '	list '+oname+' \''+value[i]+'\'\n';
			}
			else
				str += '	option '+oname+' \''+value+'\'\n';
		}
		str += '\n';
	}
	return str;
}

// parses output from one or multiple
// calls like 'uci -qn export foo'
function fromUCI(pkgs_str)
{
	var pkg_objs = {};
	var pkg;
	var cfg;

	var lines = pkgs_str.split('\n');
	for (var i = 0; i < lines.length; ++i) {
		var line = lines[i];
		var items = split(line);

		if (items.length < 2) {
			continue;
		}

		switch(items[0])
		{
			case 'package':
				pkg = { pchanged : false };
				pkg_objs[items[1]] = pkg;
				break;
			case 'config':
				var val = (items.length == 3) ? line.match(/'(.*)'/)[1] : ('cfg'+(++gid));
				cfg = { stype : items[1] };
				pkg[val] = cfg;
				break;
			case 'option':
				var val = line.match(/'(.*)'/)[1];
				cfg[items[1]] = val;
				break;
			case 'list':
				var val = line.match(/'(.*)'/)[1];
				if (!(items[1] in cfg)) cfg[items[1]] = [];
				cfg[items[1]].push(val);
				break;
		}
	}
	return pkg_objs;
}

function firstSectionID(obj, stype)
{
	for (var id in obj) {
		if (obj[id].stype == stype) {
			return id;
		}
	}
}

function config_foreach(objs, stype, func)
{
	for (var key in objs) {
		var obj = objs[key];
		if ((obj['stype'] == stype || stype == '*') && func(key, obj)) {
			return true;
		}
	}
	return false;
}

function config_find(objs, mobj)
{
	for (var key in objs) {
		var obj = objs[key];
		var found = true;
		for (mkey in mobj) {
			if (obj[mkey] != mobj[mkey]) {
				found = false;
				break;
			}
		}
		if (found)
			return obj;
	}
	return null;
}

function params(obj)
{
	var str = '';
	for (var key in obj) {
		if (str.length) str += '&';
		else str += '?';
		str += encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
	}
	return str.replace(/%20/g, '+');
}

function send(url, obj, func)
{
	url += params(obj);
	jx.load(url, func, 'text');
}

function onDesc(e, tag, func)
{
	for (var i = 0; i < e.childNodes.length; ++i) {
		var c = e.childNodes[i];
		if (c.tagName == tag && func(c) == false) return;
		onDesc(c, tag, func);
	}
}

function onChilds(e, tag, func)
{
	for (var i = 0; i < e.childNodes.length; ++i) {
		var c = e.childNodes[i];
		if (c.tagName == tag && func(c) == false) return;
	}
}

function onParents(e, tag, func)
{
	while (e != document) {
		e = e.parentNode;
		if (e.tagName == tag && func(e) == false) return;
	}
}

function removeChilds(p)
{
	while (p.hasChildNodes())
		p.removeChild(p.firstChild);
}

function checkName(name)
{
	if (/[\w_]{2,12}/.test(name))
		return true;

	alert(tr(tr_invalid_name) + " " + name);
	return false;
}

//prepend input check
function addInputCheck(input, regex, msg)
{
	var prev_value = input.value;
	var prev_onchange = input.onchange;
	input.onchange = function(e) {
		if (regex.test(input.value)) {
			if (prev_onchange)
				prev_onchange(e);
			return;
		}
		alert(tr(msg));
		input.value = prev_value;
		e.stopPropagation();
	};
}

function collect_inputs(p, obj)
{
	if (p.tagName == 'SELECT')
		obj[p.name] = p.value;
	if (p.tagName == 'INPUT')
		if (p.type == 'text' || p.type == 'password' || (p.type == 'radio' && p.checked))
			obj[p.name] = p.value
		else if (p.type == 'checkbox' && p.checked)
		{
			var v = obj[p.name];
			v = (typeof v == 'undefined') ? (p.data || p.value) : (v + ' ' + (p.data || p.value));
			obj[p.name] = v;
		}

	for (var i = 0; i < p.childNodes.length; ++i)
		collect_inputs(p.childNodes[i], obj);
}

// Set text and optional translation class id
function opt_tr(e, value) {
	e.textContent = value;
	if (value.startsWith('tr_')) {
		e.classList.add(value);
	}
}

function append(parent, tag, id)
{
	var e = document.createElement(tag);
	if (id) e.id = id;
	parent.appendChild(e);
	return e;
}

function append_section(parent, title, id)
{
	var fs = append(parent, 'fieldset');
	var lg = append(fs, 'legend');
	opt_tr(lg, title);

	if (id) fs.id = id;
	return fs;
}

function append_button(parent, text, onclick)
{
	var button = append(parent, 'button');
	button.type = 'button';
	button.onclick = onclick;
	opt_tr(button, text);
	return button;
}

function append_label(parent, title, value)
{
	var div = append(parent, 'div');
	var label = append(div, 'label');
	var span = append(div, 'span');

	opt_tr(label, title);
	opt_tr(span, value);

	return div;
}

/*
 <select><option></option>... </select>
*/
function append_options(parent, name, selected, choices)
{
	var select = append(parent, 'select');
	select.style.minWidth = '5em';
	select.name = name;
	for (var i in choices)
	{
		var s = (typeof choices[i] != 'object');
		var choice_text = '' + (s ? choices[i] : choices[i][0]);
		var choice_value = '' + (s ? choices[i] : choices[i][1]);

		var option = append(select, 'option');
		option.value = choice_value;
		option.selected = (choice_value == selected) ? 'selected' : '';
		opt_tr(option, choice_text);
	}
	return select;
}

function append_selection(parent, title, name, selected, choices)
{
	var p = append(parent, 'div');
	var label = append(p, 'label');

	p.className = 'select_option';
	opt_tr(label, title);

	append_options(p, name, selected, choices);
	return p;
}

// Append an input field.
// E.g. append_input(parent, 'Name', 'name_string', 'MyName')
function append_input(parent, title, name, value)
{
	var div = append(parent, 'div');
	var label = append(div, 'label');
	var input = append(div, 'input');

	opt_tr(label, title);

	input.value = (typeof value == 'undefined') ? '' : value;
	input.name = name;
	input.type = 'text';

	return div;
}

// Append a radio field.
// E.g. append_radio(parent, 'Enabled', 'enabled', 0, [['Yes', 1], ['No', 0])
function append_radio(parent, title, name, selected, choices) {
	return _selection('radio', parent, title, name, [selected], choices);
}

// Append a checkbox field.
// E.g. append_check(parent, 'Enabled', 'enabled', ['grass'], [['Grass', 'grass'], ['Butter', 'butter']])
function append_check(parent, title, name, selected, choices) {
	return _selection('checkbox', parent, title, name, selected, choices);
}

function _selection(type, parent, title, name, selected, choices)
{
	var p = append(parent, 'div');
	var label = append(p, 'label');
	var span = append(p, 'span');

	p.className = 'radio_option';
	opt_tr(label, title);

	for (var i in choices) {
		var s = (typeof choices[i] == 'string');
		var choice_text = '' + (s ? choices[i] : choices[i][0]);
		var choice_value = '' + (s ? choices[i] : choices[i][1]);
		var choice_help = s ? undefined : choices[i][2];

		var div = append(span, 'div');
		var input = append(div, 'input');
		var label = append(div, 'label');

		input.name = name;
		input.value = choice_value;
		input.data = choice_value; //for IE :-(
		input.type = type;

		if (inArray(choice_value, selected)) {
			input.checked = 'checked'
		}

		opt_tr(label, choice_text);

		if (choice_text == '_') {
			hide(div);
		}

		if (choice_help) {
			addHelp(label, choice_help);
		}
	}
	return p;
}

//from jx_compressed.js
jx={getHTTPObject:function(){var A=false;if (typeof ActiveXObject!='undefined'){try{A=new ActiveXObject('Msxml2.XMLHTTP')}catch(C){try{A=new ActiveXObject('Microsoft.XMLHTTP')}catch(B){A=false}}}else{if (window.XMLHttpRequest){try{A=new XMLHttpRequest()}catch(C){A=false}}}return A},load:function(url,callback,format){var http=this.init();if (!http||!url){return }if (!format){var format='text'}format=format.toLowerCase();var now='uid='+new Date().getTime();url+=(url.indexOf('?')+1)?'&':'?';url+=now;http.open('GET',url,true);http.onreadystatechange=function(){if (http.readyState==4){if (http.status==200){var result='';if (http.responseText){result=http.responseText}if (format.charAt(0)=='j'){result=result.replace(/[\n\r]/g,'');result=eval('('+result+')')}if (callback){callback(result)}}else{alert(http.statusText)}}};http.send(null)},init:function(){return this.getHTTPObject()}}
