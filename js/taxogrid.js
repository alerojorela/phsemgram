/************************************************
Renders treemaps

2019 Alejandro Rojo Gualix

Creative Commons license
CC BY-NC Attribution & Non-commercial
*************************************************/

/*	
	( ) 	{ } 	[ ]
	Round brackets or parentheses
	Curly brackets or braces
	Square brackets or simply brackets (US) 
*/


/**************************************************************
 *                         TAREAS
 **************************************************************/
/*

PARSER
  glosas sucesivas / grupo palabras sin analizar
    Dos maneras de interpretar esto:
    [V puedes crear]
    haz un triángulo NO SE ANALIZA
    glosas en misma lengua o  en diferentes lenguas


Name Children Object structure
{
	OR (debe haber uno u otro o los dos)
		id: "",
		name: "",
	children: [ 
		{ tag: "", children: [ ... ]
	],
	color: #...
}


Editor, click sobre nodos SVG


*/
var xmlns = "http://www.w3.org/2000/svg";



/**************************************************************
 *                      FILE DOWNLOAD
 **************************************************************/

// https://stackoverflow.com/questions/923885/capture-html-canvas-as-gif-jpg-png-pdf/3514404#3514404
// canvas: a canvas element
// rawSVG
function drawInlineSVG(canvas, rawSVG) {
	const ctx = canvas.getContext("2d");

	var img = new Image();
	img.width = canvas.width;
	img.height = canvas.height;
	img.onload = function () {
		ctx.drawImage(img, 0, 0, img.width, img.height);
	};
	var svgAsXML = (new XMLSerializer).serializeToString(rawSVG);
	img.src = 'data:image/svg+xml,' + encodeURIComponent(svgAsXML);

	/*
	  var svg = new Blob([rawSVG], { type: "image/svg+xml;charset=utf-8" }),
		domURL = self.URL || self.webkitURL || self,
		url = domURL.createObjectURL(svg),
		img = new Image();
	  img.src = url;
	  img.onload = function () {
		ctx.drawImage(this, 0, 0);
		domURL.revokeObjectURL(url);
		callback(this);
	  };
	*/
}

/**************************************************************
 *                      	CSS
 **************************************************************/

function CreateCss() {
	var style = document.createElement('style');
	style.type = 'text/css';
	style.appendChild(document.createTextNode(""));

	document.head.appendChild(style);
	console.log(style.sheet.cssRules); // length is 0, and no rules
	return style;
}

function AddCss(fileName) {
	/*
	style.innerHTML = '.cssClass { color: #F00; }';
	document.getElementsByTagName('head')[0].appendChild(style);
	document.getElementById('someElementId').className = 'cssClass';
	*/
	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = fileName;

	document.head.appendChild(link);
}

// alert(document.styleSheets.length);
// var sheet = document.styleSheets[0];
var style = CreateCss();
var sheet = style.sheet;
// alert(document.styleSheets.length);



/**************************************************************
 *                      DATA PROPERTIES
 **************************************************************/
//#region

// https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays?page=3&tab=oldest#tab-top
// because ES6 method requires depth .flat(depth);
const deepFlatten = arr =>
	arr.reduce(
		(acc, val) =>
			Array.isArray(val)
				? acc.concat(deepFlatten(val))
				: acc.concat(val),
		[]
	);


var GetMaxDepth = function (expr, depth = 0) {
	var newdepth = depth;
	if (Array.isArray(expr)) {
		for (var n = 0; n < expr.length; n++) {
			var branchdepth = GetMaxDepth(expr[n], depth + 1);
			var newdepth = Math.max(depth, branchdepth);
		}
	}
	return newdepth
}


var GetNodesBelow = function (obj) {
	var list = [obj];
	if ('children' in obj) {
		for (var n = 0; n < obj.children.length; n++) {
			list.push(...GetNodesBelow(obj.children[n]));
		}
	}
	return list;
}

var getTerminals = function (obj) { // terminals
	var list = [];
	if ('children' in obj) {
		for (var n = 0; n < obj.children.length; n++) {
			list.push(...getTerminals(obj.children[n]));
		}
	} else {
		list.push(obj);// push only if terminal
	}
	return list;
}




//#endregion  
/**************************************************************
 *                      PARSING
 **************************************************************/
//#region

//CN OBJECT children name 
var CNOflatten = function (expr) {
	// console.log(expr, output);
	var output = expr.id;
	if ('children' in expr) {
		for (var n = 0; n < expr.children.length; n++) {
			output = output.concat(CNOflatten(expr.children[n]));
		}
	}
	return output;
}

var PrefixNotationCheck = function (stringexpr, operators) {
	if (stringexpr == '') return;
	var ArityCount = 0;
	for (var n = 0; n < stringexpr.length; n++) {
		if (stringexpr[n] != '' && stringexpr[n] in operators) ArityCount += operators[stringexpr[n]]["arity"];
	}
	return ArityCount == stringexpr.length - 1;// formula
}
/*
Converts
based on pre-specified arity for operators
this
	⿱⿱⺈田一
to
	{
	"name": "⿱",
	"children": [
		{
		"name": "⿱",
		"children": [
			{"name": "⺈"},
			{"name": "田"}
		]
		},
		{"name": "一"}
	]
	}
[⿱[⿱[丶][一]][亡]]

exprarray: list
			si se proporciona una string los operadores y argumentos se analizarán como si tuvieran un caracter de longitud
operators: object { "+": { "arity": 2}... }
*/
var PrefixNotationCNObjetify = function (exprarray, operators) {
	if (exprarray == '') return;

	var operator = exprarray[0];
	if (!(operator in operators)) {
		alert('SyntaxError\n' + exprarray); return;// throw SyntaxError; // operator heads
	}
	var arity = operators[operator]["arity"];//arguments number
	if (arity === undefined) {
		alert('SyntaxError: arity undefined for\n' + operator); return;
	}


	var output = { id: operator, name: operator };// create object
	var children = [];

	for (var n = 1; n < exprarray.length; n++) {// n = 1 excluding operator
		var item = exprarray[n];
		if (item != '') {
			if (item in operators) {
				var rv = PrefixNotationCNObjetify(exprarray.substring(n), operators);
				children.push(rv);
				var ft = CNOflatten(rv);// descendants
				// console.log(ft);
				n += ft.length - 1;// Advance as far as consumed characters
			} else {
				children.push(
					{ id: item, name: item });
			}
			arity -= 1;
			if (arity <= 0) { // all arguments have been read
				break;
			}
		}
	}

	if (children.length > 0) output.children = children;
	return output;
}




// Convierte un objeto a una expresión entre paréntesis
// expr: con mínimo contenido {id: '...', children: '...'}
// [躑 [足 [口] [龰]] [鄭 [奠 [酋 [丷] [酉 [西 [兀 [一] [儿]] [口]] [一]]] [大]] [阝]]]
var objectToBracketedExpression = function (obj, tabify = false, depth = 0) {

	var namesubstrings = [GetName(obj)];
	if ('namesubstrings' in obj && obj.namesubstrings.length > 0) namesubstrings.push(...obj.namesubstrings);
	for (var n = 0; n < namesubstrings.length; n++) {
		if (namesubstrings[n].includes(' ')) namesubstrings[n] = '«' + namesubstrings[n] + '»';
	}
	var tags = namesubstrings.join(' ');


	var outputexpr = [];
	// console.log(obj);
	if ('children' in obj) {
		for (var n = 0; n < obj.children.length; n++) {
			outputexpr.push(objectToBracketedExpression(obj.children[n], tabify, depth + 1));
		}
		var sep = ' ';
		if (tabify) sep = '\n' + '\t'.repeat(depth + 1);
		return '[' + tags + sep + outputexpr.join(sep) + ']';
	} else {
		return '[' + tags + ']';
	}
}

var ParseBrackettedExpr = function (rawexpr) {

	// var parsedexpr = PARSER.parse("[  Alfa «beta  gamma» «» delta epsilon «dseta eta zeta» [B [ C ] [ D [ E ] [ F ] ]]]");

	var parsedexpr = PARSER.parse(rawexpr);
	ParsingNamesubstrings(parsedexpr);
	console.log('ParseBrackettedExpr>\t', JSON.stringify(parsedexpr));
	return parsedexpr;

}
var ParsingNamesubstrings = function (obj) {
	console.log('ParsingNamesubstrings>\t', obj);
	if (!(obj.namesubstrings.length == 0)) {
		obj.name = obj.namesubstrings.shift(); // Transfer first item
		if (obj.namesubstrings.length == 0) delete obj.namesubstrings;
	}

	if ('children' in obj) {
		for (var n = 0; n < obj.children.length; n++) {
			ParsingNamesubstrings(obj.children[n]);
		}
	}
}

/* Obsolete
var SimpleParser = function (simpleexpr) {
	// Try to convert expression to JSON
	input = simpleexpr;

	// No serviría Replace, con un primer argumento string, solo cambia la primera ocurrencia hallada

	// [] are the standard brackets
	input = input.replace(/[({⟨]/g, "[");
	input = input.replace(/[)}⟩]/g, "]");
	console.log(input);


	// Validación de grupos
	// https://stackoverflow.com/questions/881085/count-the-number-of-occurrences-of-a-character-in-a-string-in-javascript
	openingCount = (input.match(/\[/g) || []).length;
	closingCount = (input.match(/\]/g) || []).length;
	if (openingCount != closingCount) {
		alert("invalid data format\nBrackets mismatched!");
		return;
	}
	var children = 0;
	var brk = 0;
	for (var n = 0; n < input.length; n++) {
		if (input[n] == "[") {
			brk += 1;

		} else if (input[n] == "]") {
			brk -= 1;
			if (brk == 0) { // Hemos terminado una sección
				children += 1;
			}
		}
	}
	if (children > 1) input = "[· " + input + "]"
	// console.log("children", children);


	// Quotate tokens
	var newstring = "";
	var start = 0;
	var Regexp = /[^\[\]\s]+/g; // TOKENS
	while ((result = Regexp.exec(input)) !== null) {
		newstring += input.substring(start, result.index).trim(); // non-TOKEN
		var token = result[0];
		newstring += '"' + input.substr(result.index, token.length) + '" '; // TOKEN
		start = result.index + token.length;
		// console.log(result);
	}
	newstring += input.substring(start);
	console.log(newstring);

	// Remove spaces
	newstring = newstring.replace(/\s+/g, "");
	// add Commas
	newstring = newstring.replace(/\](?=[\[|\"])/g, '], '); // [ or " preceded by ]
	newstring = newstring.replace(/\"(?=[\[|\"])/g, '", ');



	try {
		var JSONexpr = JSON.parse(newstring);
		return JSONexpr;
	} catch (e) {
		console.log(newstring);
		alert("invalid data format\nnot JSON!");
		return;
	}

}
*/

//#endregion  
/**************************************************************
 *                      RENDERING
 **************************************************************/
//#region

const orientation = {
	column: 0,
	row: 1,
}
var DefaultOrientation = orientation.column;
const size = 200;
const Twidth = size;
const Theight = size;


// Independiente de la implementación en lista o CNobjeto
// expr. a list or dictionary
var GetChildren = function (expr) {
	// console.log('> ' + expr);

	if (Array.isArray(expr)) {
		return expr;
	} else if (typeof expr === 'object') {
		if ('children' in expr) {
			return expr.children;
		} else {// terminal
			return;// expr.id;
		}
	} else {
		return;// terminal
	}
}


var GetName = function (obj) {
	if (typeof obj === 'object') {
		if (!('name' in obj || 'id' in obj)) {
			console.log(obj);
			alert('data error\nno name and id fields');
			obj.name = '';
		} else if (!('name' in obj)) {
			obj.name = obj.id;
		} else if (!('id' in obj)) {
			obj.id = obj.name;
		}
		return obj.name;
	} else {
		alert('data error');
	}
}


// [1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17]

// items: an array
// returns a matrix ot items
var CreateSquareMatrix = function (items) {
	// const numberseries = [...Array(items.length).keys()];


	const rows = Math.ceil(Math.sqrt(items.length));
	/* There are two kinds of rows, first ones without the remainder and the last ones where the remainder is distributed
	(+1/last rows because remainder < rows always)
	e.g.
	5 items, we look for an square ratio, so >2x2 (~3)x3
	5/3 rows = 1 per row
	5%3 rows = 2 remainder to distribute in last rows
	so:
		1º row: 1
		2º row: 1+1
		3º row: 1+1
		[1 ,2, 2]
	*/
	const rows2remainder = items.length % rows;
	const rows1 = rows - rows2remainder;
	const itemsperrow1 = Math.floor(items.length / rows);// minimun items per row (without taking into account the remainder)
	const itemsperrow2 = itemsperrow1 + 1;

	const divisionitem = rows1 * itemsperrow1;
	var matrix = [[items[0]]];
	for (var n = 1; n < items.length; n++) {
		if ((n < divisionitem && n % itemsperrow1 == 0) ||	// non remainder rows
			(n >= divisionitem && (n - divisionitem) % itemsperrow2 == 0)) {//  remainder rows
			matrix.push([items[n]]);
		} else {
			matrix[matrix.length - 1].push(items[n]);
		}
	}

	console.log('CreateSquareMatrix\t', matrix);
	return matrix;
}


const renderoptions = {
	inline: 0,
	inline_alternating: 1,
	square: 2
}

var render = {
	TaxoGridCSSGrid: function (obj, options = renderoptions.inline_alternating) {

		var Parse = function (obj, or = DefaultOrientation, gridarea = { col: 1, row: 1, colspan: 1, rowspan: 1 }, depth = 0) {

			var cell = document.createElement('div'); // .createElementNS(xmlns, 'div');
			/* 
			cell position within container
				grid-column grid-row
				grid-area: grid-row-start / grid-column-start / grid-row-end / grid-column-end | itemname;
			define cells
				grid-template-columns grid-template-rows
			*/
			if (depth != 0) {
				cell.style.gridArea = `${gridarea.row} / ${gridarea.col} / span ${gridarea.rowspan} / span ${gridarea.colspan}`;
				/*
				cell.style.gridColumn = `col ${gridarea.col} / span ${gridarea.colspan}`;
				cell.style.gridRow = `row ${gridarea.row} / span ${gridarea.rowspan}`;
				*/
			}


			if ('children' in obj) { // non-terminal
				cell.classList.add("branch");
				cell.style.display = 'grid';


				if (options == renderoptions.square) {
					const sm = CreateSquareMatrix(obj.children);
					const rows = sm.length;
					const rows2remainder = obj.children.length % rows;
					const rows1 = rows - rows2remainder;
					const itemsperrow1 = Math.floor(obj.children.length / rows);// minimun items per row (without taking into account the remainder)
					var maxcols = itemsperrow1;
					if (rows2remainder != 0) maxcols = itemsperrow1 * (itemsperrow1 + 1);
					// 5 -> 1*2 = 2

					for (var row = 0; row < rows; row++) {
						var itemsperrow = sm[row].length;
						var colspan = maxcols / itemsperrow;
						for (var n = 0; n < itemsperrow; n++) {
							var item = sm[row][n];
							var ga = {
								row: row + 1, rowspan: 1,
								col: (colspan * n) + 1, colspan: colspan,
							};

							var child = Parse(item, or, ga, depth + 1);
							cell.appendChild(child);
						}
					}

					cell.style.gridTemplateColumns = `repeat(${maxcols}, [col] 1fr)`;
					cell.style.gridTemplateRows = `repeat(${rows}, [row] 1fr)`;

				} else {
					var neworientation =
						(options == renderoptions.inline_alternating) ? (or + 1) % 2 : or;

					for (var n = 0; n < obj.children.length; n++) {
						var item = obj.children[n];
						var ga = { row: 1, rowspan: 1, col: 1, colspan: 1, };
						if (or == orientation.column) {
							ga.row = n + 1;
						} else {
							ga.col = n + 1;
						}
						var child = Parse(item, neworientation, ga, depth + 1);
						cell.appendChild(child);
					}

					if (or == orientation.column) {
						cell.style.gridTemplateColumns = 'repeat(1, [col] 1fr)';
						cell.style.gridTemplateRows = `repeat(${obj.children.length}, [row] 1fr)`;
					} else {
						cell.style.gridTemplateColumns = `repeat(${obj.children.length}, [col] 1fr)`;
						cell.style.gridTemplateRows = 'repeat(1, [row] 1fr)';
					}
				}

			} else { // terminal
				cell.classList.add("terminal");

				// color size onclick
				var name = GetName(obj);
				if (!('id' in obj)) obj.id = guidGenerator();
				cell.id = obj.id;

				cell.setAttributeNS(null, 'idx', name);
				var anode = document.createElement('a');
				anode.classList.add("fittedtext");
				anode.appendChild(document.createTextNode(name));
				if ('color' in obj) anode.style.color = obj.color;

				var content = document.createElement('div');
				content.classList.add("content");
				content.appendChild(anode);

				cell.appendChild(content);


			}

			return cell;
		}

		var result = Parse(obj);

		var taxogram = document.createElement('div');
		taxogram.classList.add("taxogram");
		taxogram.classList.add("cssgrid");
		taxogram.appendChild(result);

		return taxogram;

	},
	TaxoGridCSSFlex: function (obj, options = renderoptions.inline_alternating) {


		var Parse = function (obj, or = DefaultOrientation, width = 100, height = 100, depth = 0) {

			var cell = document.createElement('div'); // .createElementNS(xmlns, 'div');
			cell.style.flexGrow = 1; // expand, every cell in a row has the same width
			//cell.style.flex = flexGrow flexShrink flexBasis;
			cell.style.width = width + '%';
			cell.style.height = height + '%';
			if (or == orientation.column) {
				cell.style.flexDirection = "column";
			} else {
				cell.style.flexDirection = "row";
			}


			if ('children' in obj) { // non-terminal
				cell.classList.add("branch");

				if (options == renderoptions.square) {
					const sm = CreateSquareMatrix(obj.children);
					var rows = sm.length;
					for (var row = 0; row < rows; row++) {
						var itemsperrow = sm[row].length;
						for (var n = 0; n < itemsperrow; n++) {
							var item = sm[row][n];
							var child = Parse(item, or, 100 / itemsperrow, 100 / rows, depth + 1);
							cell.appendChild(child);
						}
					}

				} else {
					var neworientation =
						(options == renderoptions.inline_alternating) ? (or + 1) % 2 : or;

					for (var n = 0; n < obj.children.length; n++) {
						var item = obj.children[n];
						if (or == orientation.column) {
							var child = Parse(item, neworientation, 100, 100 / obj.children.length, depth + 1);
						} else {
							var child = Parse(item, neworientation, 100 / obj.children.length, 100, depth + 1);
						}
						cell.appendChild(child);
					}
				}

			} else { // terminal
				cell.classList.add("terminal");

				var name = GetName(obj);
				if (!('id' in obj)) obj.id = guidGenerator();
				cell.id = obj.id;

				var anode = document.createElement('a');
				anode.classList.add("fittedtext");
				anode.appendChild(document.createTextNode(name));
				if ('color' in obj) anode.style.color = obj.color;

				var content = document.createElement('div'); // .createElementNS(xmlns, 'div');
				content.classList.add("content");
				content.appendChild(anode);

				cell.appendChild(content);
			}

			return cell;
		}


		var result = Parse(obj);

		var taxogram = document.createElement('div');
		taxogram.classList.add("taxogram");
		taxogram.classList.add("flexgrid");
		taxogram.appendChild(result);

		return taxogram;
	},

	TaxoGridSVG: function (obj, options = renderoptions.inline_alternating) {
		// HAS ERRORS

		var ParseSVG = function (obj, or = DefaultOrientation, Left = 0, Top = 0, Width = Twidth, Height = Theight) {

			// createElementNS(xmlns, 'g');
			var group = document.createElementNS(xmlns, 'g');

			if (Array.isArray(obj)) {
				var child;
				for (var n = 0; n < obj.length; n++) {
					if (or == orientation.column) {
						child = ParseSVG(obj[n], orientation.row, Left, Top + n / obj.length * Height, Width, Height);
					} else {
						child = ParseSVG(obj[n], orientation.column, Left + n / obj.length * Width, Top, Width, Height);
					}
					group.appendChild(child);
				}

			} else { // terminal
				/*
				https://stackoverflow.com/questions/3492322/javascript-createelement-and-svg
				https://stackoverflow.com/questions/23588384/dynamically-created-svg-element-not-displaying
				document.createElementNS (xmlns, "rect"); will create an unknown HTML DOM element. You have to use the correct namespace to create an SVG DOM element.
				var rect = document.createElementNS('http://www.w3.org/2000/svg', "rect");
				*/
				group.setAttributeNS(null, 'transform', `matrix(1 0 0 1 ${Left} ${Top})`); // Template literals are enclosed by the (` `) grave accent character

				var rect = group.appendChild(document.createElementNS(xmlns, 'rect'));
				rect.setAttributeNS(null, 'width', Width);
				rect.setAttributeNS(null, 'height', Height);

				var text = group.appendChild(document.createElementNS(xmlns, 'text'));
				text.appendChild(document.createTextNode(obj));
				// centered
				text.setAttributeNS(null, 'x', Width / 2);
				text.setAttributeNS(null, 'y', Height / 2);

			}
			return group
		}

		var group = ParseSVG(obj);
return group;
	},
};



//#endregion  