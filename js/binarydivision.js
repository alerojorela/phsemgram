/************************************************
Renders binary division diagrams from an array

2019 Alejandro Rojo Gualix

Creative Commons license
CC BY-NC Attribution & Non-commercial
*************************************************/


/**************************************************************
 *                         TAREAS
 **************************************************************/
/*

Propiedades visuales
  controlar parámetros ¿ventana emergente?
    ángulo, ancho, tamaño letra

    texto 
      encima de intersección interrumpiendo líneas 
      a un lado ¿y si es muy largo?
  solapamientos palabras

Editor, click sobre nodos SVG

*/


/**************************************************************
 *                      GEOMETRY
 *************************************************************/
//#region


var options = {
  /*
  90º menos altura
  70º
  60º equilátero
  */
  angle: 1.231, // 70º
  set angleDegrees(angleDegrees) {// to radians
    this.angle = 2 * Math.PI * angleDegrees / 360
  },
  GridCell: {
    Width: 80,
    Height: 56.57
  },
  set GridCellHeight(Height) {
    this.GridCell.Height = Height;
    this.GridCell.Width = 2 * Height / Math.tan(this.angle / 2);
    // this.GridCell.Width = 2 * Height / Math.sqrt(2); //
  },
  set GridCellWidth(Width) {
    this.GridCell.Width = Width;
    this.GridCell.Height = Width / 2 / Math.tan(this.angle / 2);
  },
  fontcolor: 'black',
  linestroke: '#777',
  fontsize: 18,
  textseparation: 8, // this.GridCell.Height / 6
  set TextFractionofWidth(fraction) {
    this.fontsize = fraction * this.GridCell.Width;
    // this.textseparation = Math.floor(this.fontsize / 2);
  },

  flattentext: true

};
console.log(Math.PI, options.angle, options.GridCell.Width, options.GridCell.Height);

options.customstyle = ` 
  g line {
    stroke: ${options.linestroke};
    stroke-width: 2px
  } 
  text {
      font-family: 'Lucida Console Unicode', Arial, Helvetica, Serif;
      font-size: ${options.fontsize}px;
      fill: ${options.fontcolor};
  }
  .tag {
      font-weight: 700;
  }
  .extra {
      font-style: italic;
  }`


// Returns an svg object
var Render = function (obj) {

  var dynamicContainer = {
    xmin: 0, ymin: 0,
    xmax: 0, ymax: 0
  };
  var logdynamicContainer = function (x, y) {
    dynamicContainer.xmin = Math.min(dynamicContainer.xmin, x);
    dynamicContainer.ymin = Math.min(dynamicContainer.ymin, y);

    dynamicContainer.xmax = Math.max(dynamicContainer.xmax, x);
    dynamicContainer.ymax = Math.max(dynamicContainer.ymax, y);
  }


  /*
  Creates an svg markup based on annotated spatial data
  */
  var WriteSvg = function (obj, textalign = 0) {
    var tag = GetName(obj);

    var x = obj.grid.x, y = obj.grid.y;

    var textanchor = ['leftnode', 'centralnode', 'rightnode'];
    // Separaciones, hacia arriba y habia abajo en terminales

    var DebugBranch = 'data-branch="' + objectToBracketedExpression(obj) + '"';
    var group = '<g ' + DebugBranch + '>';
    if ('children' in obj) {

      var color1 = 'color' in obj.children[0] ? `style="stroke:${obj.children[0].color}"` : '';
      if (obj.children.length == 2) {  // BIFURCACIÓN, aquí es donde adquieren dimensión los triángulos al converger dos líneas
        var color2 = 'color' in obj.children[1] ? `style="stroke:${obj.children[1].color}"` : '';
        group += WriteText(obj, textanchor[textalign + 1], 'node', x, y - options.textseparation) +
          `<line x1="${x}px" y1="${y}px" x2="${obj.children[0].grid.x}px" y2="${obj.children[0].grid.y}px" ${color1}/>
          <line x1="${x}px" y1="${y}px" x2="${obj.children[1].grid.x}px" y2="${obj.children[1].grid.y}px" ${color2}/>` +
          WriteSvg(obj.children[0], -1) + WriteSvg(obj.children[1], +1);

        logdynamicContainer(x, y);
        logdynamicContainer(obj.children[0].grid.x, obj.children[0].grid.y);
        logdynamicContainer(obj.children[1].grid.x, obj.children[1].grid.y);


      } else if (obj.children.length == 1) { // SIN BIFURCACIÓN [SN [N casa]]  
        if (textalign == 0) textalign = -1;
        group += WriteText(obj, textanchor[textalign + 1], 'node', x, y - options.textseparation) +
          `<line x1="${x}px" y1="${y}px" x2="${obj.children[0].grid.x}px" y2="${obj.children[0].grid.y}px" ${color1}/>` +
          WriteSvg(obj.children[0], textalign)

        logdynamicContainer(x, y);
        logdynamicContainer(obj.children[0].grid.x, obj.children[0].grid.y);

      } else {
        alert("No more than two children per node are allowed. Subexpression:\n" + objectToBracketedExpression(obj));//JSON.stringify(obj));
        // alert('No se admiten más de dos nodos hijos en la subexpresión\n' + JSON.stringify(obj));
      }
    } else {// TERMINAL [N casa]
      group += WriteText(obj, 'terminal', 'tag', x, y)
    }

    return group + '</g>';
  }

  // textclass usually alignment info
  var WriteText = function (obj, textclass, tspanclass, x, y) {
    var tag = GetName(obj);

    var group = `<text class="${textclass}" x="${x}px" y="${y}px">
      <tspan class="${tspanclass}">${tag}</tspan>`;

    logdynamicContainer(x, y);

    if ('namesubstrings' in obj) {
      for (var n = 0; n < obj.namesubstrings.length; n++) {// 1 is tag
        // console.log('namesubstrings ', obj.namesubstrings[n]);
        if (textclass == 'terminal') {
          group += `<tspan class="extra" x="${x}px" dy="${2}em" >${obj.namesubstrings[n]}</tspan>`;
        } else {
          group += `<tspan class="extra">${obj.namesubstrings[n]}</tspan>`;
        }
      }
    }

    return group + '</text>';
  }


  var gridobj = JSON.parse(JSON.stringify(obj)); // no es el método más eficiente para clonar
  ParseGrid(gridobj);
  console.log('WriteText>\t', JSON.stringify(gridobj));

  // RENDERING
  transformGrid(gridobj, transform3); // Grid to canvas coordinates
  //   console.log('WriteText>\t',JSON.stringify(gridobj));


  // Esto se podría determinar a priori, según se van especificando los elementos SVG
  var Container = RenderContainer(gridobj); // Container
  // var Container = dynamicContainer; // Container

  const Size = {
    x: (Container.xmax - Container.xmin),
    y: (Container.ymax - Container.ymin)
  }
  var margin = {
    x: 0.2 * Size.x,
    y: 0.2 * Size.y
  };
  var margin = { // 20% or 75
    x: Math.max(0.2 * Size.x, 100),
    y: Math.max(0.2 * Size.y, 100)
  };

  const ContainerSize = {
    width: Size.x + 2 * margin.x,
    height: Size.y + 2 * margin.y
  }
  const Displacement = {
    x: - Container.xmin + margin.x,
    y: - Container.ymin + margin.y
  }
  /*
  console.log(">>>>>>>>>>>", Container);
  console.log(">>>>>>>>>>>", Size);
  console.log(">>>>>>>>>>>", Displacement);
  */


  // minifier
  // https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
  var root = WriteSvg(gridobj);

  var template = document.createElement('template');  // template.content.firstChild;
  template.innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" 
      width=${ContainerSize.width} height=${ContainerSize.height}>
      <style type="text/css">
        text.node {
          dominant-middle: baseline; /* vertical align: baseline middle hanging */
          text-anchor: middle; /* horizontal align: start middle end */
        }
        text.rightnode {
          dominant-middle: baseline; /* vertical align: baseline middle hanging */
          text-anchor: start;
        }
        text.leftnode {
          dominant-middle: baseline; /* vertical align: baseline middle hanging */
          text-anchor: end;
        }
        text.terminal {
          dominant-baseline: hanging;
          text-anchor: middle; 
        }
        ${options.customstyle}
      </style>
      <g transform="matrix(1 0 0 1 ${Displacement.x} ${Displacement.y})">
        ${root}
      </g>
    </svg>`;
  // template.content.firstChild.firstChild.setAttributeNS(null, 'transform', `matrix(1 0 0 1 ${Displacement.x} ${Displacement.y})`);

  return { content: template.content, ContainerSize: ContainerSize };
}

var RenderContainer = function (obj) { // Nudos
  var Pos = {
    xmin: obj.grid.x, ymin: obj.grid.y,
    xmax: obj.grid.x, ymax: obj.grid.y
  };

  if ('children' in obj) {
    for (var n = 0; n < obj.children.length; n++) {
      var PosChild = RenderContainer(obj.children[n]);
      Pos.xmin = Math.min(Pos.xmin, PosChild.xmin);
      Pos.ymin = Math.min(Pos.ymin, PosChild.ymin);
      Pos.xmax = Math.max(Pos.xmax, PosChild.xmax);
      Pos.ymax = Math.max(Pos.ymax, PosChild.ymax);
    }
  }

  return Pos;
}

//#endregion
/**************************************************************
 *                      TRANSFORMATIONS
 *************************************************************/
//#region


// Applies geometric transformations
// array    obj
// function fTransformation
var transformGrid = function (obj, fTransformation) {
  fTransformation(obj.grid);
  if ('children' in obj) {
    for (var n = 0; n < obj.children.length; n++) {
      transformGrid(obj.children[n], fTransformation);
    }
  }
}
var transform1 = function (grid) {
  grid.x *= options.GridCell.Width;
  grid.y *= options.GridCell.Width;
}
var transform2 = function (grid) {
  grid.x *= options.GridCell.Width;
  grid.y *= -options.GridCell.Width; // Reverse
}
var transform3 = function (grid) { // Distort horizontally
  grid.x = grid.x * options.GridCell.Width + grid.y * options.GridCell.Width / 2;
  grid.y *= - options.GridCell.Height;  // Reverse
}
var transform4 = function (grid) { // Gira 90º, horizontal
  return {
  };
}


var DisplaceArray = function (obj, dx = 0, dy = 0) {
  if (dx == 0 && dy == 0) return;
  obj.grid.x += dx;
  obj.grid.y += dy;
  if ('children' in obj) {
    for (var n = 0; n < obj.children.length; n++) {
      DisplaceArray(obj.children[n], dx, dy);
    }
  }
}


var ParseGridexample = {
  input: {
    'name': 'A',
    'children': [
      {
        'name': 'B',
        'children': [
          {
            'name': 'B1',
          },
          {
            'name': 'B2',
          }
        ]
      },
      {
        'name': 'C',
      }
    ]
  },
  output: {
    "name": "A",
    "children": [
      {
        "name": "B",
        "children": [
          {
            "name": "B1",
            "grid": {
              "xsize": 0,
              "ysize": 0,
              "x": 0,
              "y": 0
            }
          },
          {
            "name": "B2",
            "grid": {
              "xsize": 0,
              "ysize": 0,
              "x": 1,
              "y": 0
            }
          }
        ],
        "grid": {
          "x": 0,
          "y": 1,
          "xsize": 1,
          "ysize": 1
        }
      },
      {
        "name": "C",
        "grid": {
          "xsize": 0,
          "ysize": 0,
          "x": 2,
          "y": 0
        }
      }
    ],
    "grid": {
      "x": 0,
      "y": 2,
      "xsize": 2,
      "ysize": 2
    }
  }
}
/*
Calculates & annotates coordinates for taxogram rendering
obj: a CNObject
dx: horizontal increment: 0 for left branch, 1 for right branch
*/
var ParseGrid = function (obj, dx = 0, debugDepth = 0) {
  const log = false;

  var tag = GetName(obj);

  if ('children' in obj) {
    if (obj.children.length == 2) { // BIFURCACIÓN, aquí es donde adquieren dimensión los triángulos al converger dos líneas
      if (log) console.log("  ".repeat(debugDepth), "x" + tag, "<");

      var Lbranch = ParseGrid(obj.children[0], 0, debugDepth + 1); // Izquierda
      if (log) console.log("  ".repeat(debugDepth), "(left)", "_" + tag, `\t xylength[${Lbranch.grid.xlength}, ${Lbranch.grid.ylength}] \t xy[${Lbranch.grid.x}, ${Lbranch.grid.y}] `);
      var Rbranch = ParseGrid(obj.children[1], 1, debugDepth + 1); // Derecha, desplaza x según el ancho del triángulo hijo
      if (log) console.log("  ".repeat(debugDepth), "(right)", tag + "_", `\t xylength[${Rbranch.grid.xlength}, ${Rbranch.grid.ylength}] \t xy[${Rbranch.grid.x}, ${Rbranch.grid.y}] `);

      /* HOW TO GET THE CONTAINER TRIANGLE
      First we overlap both branches and calculate the smallest container triangle possible
      Why do we use y and not x length? because ylength >= xlength

        var OverlappingTriangleSide = Math.max(Lbranch.grid.ylength, Rbranch.grid.ylength);

      Next we must move Right triangle Lbranch.grid.xlength units to yuxtapose it with left triangle.
      this moved right triangle projects back as a bigger triangle of Lbranch.grid.xlength+Rbranch.grid.ylength side

        var JuxtaposedTriangleSide = Lbranch.grid.xlength + Rbranch.grid.ylength;

      Now we select the biggest triangle and make it loose by incrementing its side +1
        
        var LooseTriangleSide = 1 + Math.max(OverlappingTriangleSide, JuxtaposedTriangleSide);

      We can reduce this expressions:
      */
      var LooseTriangleSide = 1 + Math.max(Lbranch.grid.ylength, Lbranch.grid.xlength + Rbranch.grid.ylength);

      // Finally we move Right triangle to the right border of the final triangle
      var Rdisplacement = LooseTriangleSide - Rbranch.grid.xlength;
      if (log) console.log("  ".repeat(debugDepth + 1), Lbranch.grid.y + 1, Lbranch.grid.xlength, Rbranch.grid.xlength, "|  DESPLAZANDO RAMA-derecha: " + Rdisplacement);
      DisplaceArray(obj.children[1], Rdisplacement);

      obj.grid = {
        x: 0,// Initial value, later may be displaced rightwards
        y: LooseTriangleSide,
        xlength: LooseTriangleSide, ylength: LooseTriangleSide // Son iguales porque al unirse dos ramas se conforma un triángulo isósceles
      }

    } else if (obj.children.length == 1) { // SIN BIFURCACIÓN [SN [N casa]]
      if (log) console.log("  ".repeat(debugDepth), (dx == 0 ? '/' : '\\') + tag, "<");

      var branch = ParseGrid(obj.children[0], dx, debugDepth + 1); // Mantiene el sentido definido por dx
      DisplaceArray(obj.children[0], dx); // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

      obj.grid = {
        xlength: branch.grid.xlength + dx,
        ylength: branch.grid.ylength + 1,// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        x: 0, // Initial value, later may be displaced rightwards 
        y: branch.grid.y + 1 // Siempre suben 1, puesto que no son bifurcaciones y no deben hacer ningún ajuste con otra rama
      };

    } else {
      alert("No more than two children per node are allowed. Subexpression:\n" + objectToBracketedExpression(obj));//JSON.stringify(obj));
    }
  } else {// TERMINAL [N casa]
    if (log) console.log("  ".repeat(debugDepth), "·" + tag, "<");

    obj.grid = {
      xlength: 0, ylength: 0, // 0, because they are dots, dimensionless
      x: 0, // Initial value, later may be displaced rightwards 
      y: 0 // y = 0 always on baseline
    };
  }

  //if (log) console.log("  ".repeat(debugDepth), tag, ">");
  return obj;
}



/*
  simétrico
  [A
  [Z [2 2]]
  [C [1 1]]
  ]

  asimétrico izquierda
  [A
  [B [C [1 1]]]
  [Z [2 2]]
  ]

  asimétrico derecha
  [A
  [Z [2 2]]
  [B [C [1 1]]]
  ]

  INSERCIONES
  en C asimétrico izquierda
  [A
  [B
    [C [1 1] [3 3]]
  ]
  [Z [2 2]]
  ]

  en B asimétrico izquierda
  [A
  [B [C [1 1]] [3 3]]
  [Z [2 2]]
  ]

  en Z asimétrico izquierda
  [A
  [B [C [1 1]]]
  [Z [2 2] [3 3]]
  ]


  [A
  [B [C [1 1]] [3 3]]
  [X [Y [Z [1 1]]]]
  ]

  [A
  [X [Y [Z [1 1]]]]
  [B [C [1 1]] [3 3]]
]*/

//#endregion
