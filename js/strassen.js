// Scalar stuff
var Scalar = {};
(function () {
  "use strict";
  Scalar.mulFunc = function (first, second) {
    return first * second;
  };

  Scalar.addFunc = function (first, second) {
    return first + second;
  };

  Scalar.subFunc = function (first, second) {
    return first - second;
  };
})();

// Matrix stuff
var Matrix = {};
(function () {
  "use strict";
  var Create2DArray = function (a, b) {
    var arr = [];
    for (var i = 0; i < a; i++) {
      arr[i] = [];
      for (var j = 0; j < b; j++) {
        arr[i][j] = 0.0;
      }
    }
    return arr;
  };

  var windower = function(win) {
    var _win = win || {};
    return {
      from_i: _win.from_i || 0,
      to_i:     _win.to_i || 0,
      from_j: _win.from_j || 0,
      to_j:     _win.to_j || 0
    };
  };

  var randomizer = function (matrix, from, to) {
    for (var i = 0; i < matrix.n; i++) {
      for (var j = 0; j < matrix.m; j++) {
        matrix.set(i, j, randomInt(from, to));
      }
    }
    return matrix;
  };

  var add = function(a, b) {
    if (a.n !== b.n || a.m !== b.m) {
      throw "incompatible matrices, different dimensions";
    }
    var c = Matrix.new(a.n, a.m, "(" + a.name + "+" + b.name + ")");
    for (var i = 0; i < c.n; i++) {
      for (var j = 0; j < c.m; j++) {
        var sum = Scalar.addFunc(a.get(i, j),b.get(i, j));
        c.set(i, j, sum);
      }
    }
    return c;
  };

  var sub = function(a, b) {
    if (a.n !== b.n || a.m !== b.m) {
      throw "incompatible matrices, different dimensions";
    }
    var c = Matrix.new(a.n, a.m, "(" + a.name + "-" + b.name + ")");
    for (var i = 0; i < c.n; i++) {
      for (var j = 0; j < c.m; j++) {
        var diff = Scalar.subFunc(a.get(i, j),b.get(i, j));
        c.set(i, j, diff);
      }
    }
    return c;
  };

  var mul = function(a, b, c) {
    if (a.m !== b.n) {
      throw "incompatible matrices";
    }
    for (var i = 0; i < a.n; i++) {
      for (var j = 0; j < b.m; j++) {
        var val = 0.0;
        for (var k = 0; k < a.m; k++) {
          var aCell = a.get(i, k);
          var bCell = b.get(k, j);
          var tmp = Scalar.mulFunc(aCell, bCell);
          val = Scalar.addFunc(val, tmp);
        }
        c.set(i, j, val);
      }
    }
  };

  Matrix.new = function(n, m, name) {
    var win = windower({to_i:n, to_j: m});
    return newWindowedMatrix(new Create2DArray(n,m), win, name);
  };

  var newWindowedMatrix = function (mat, windows, name) {
    var i0 = windows.from_i,
        i1 = windows.to_i,
        j0 = windows.from_j,
        j1 = windows.to_j;

    var partitioner = function(from_i, from_j, to_i, to_j, name) {
      var win = windower({
        from_i: i0 + from_i,
        to_i: i0 + to_i,
        from_j: j0 + from_j,
        to_j: j0 + to_j
      });
      return newWindowedMatrix(mat, win, name);
    };

    var checkRange = function(i, j) {
      if (i < i0)       {
        throw "i too low, was "+i+" but must be under " + i0 + " in matrix " + name;
      }
      if (i >= i1) {
        throw "i too high, was "+i+" but must not exceed " + i1 + " in matrix " + name;
      }
      if (j < j0)       {
        throw "j too low, was "+j+" but must be under " + j0 + " in matrix " + name;
      }
      if (j >= j1) {
        throw "j too high, was "+j+" but must not exceed " + j1 + " in matrix " + name;
      }
    };

    var getter = function(i, j) {
      var real_i = i + i0,
          real_j = j + j0;
      checkRange(real_i, real_j);
      return mat[real_i][real_j];
    };

    var setter = function(i, j, val) {
      var real_i = i + i0,
          real_j = j + j0;
      checkRange(real_i, real_j);
      mat[real_i][real_j] = val;
    };

    var latexifier = function () {
      var n = i1 - i0,
          m = j1 - j0;
      var str = "\\overset{" + name + n + "\\times" + m + "}{\\begin{bmatrix}\n";
      for (var i = i0; i < i1; i++) {

        for (var j = j0; j < j1; j++) {
          str += mat[i][j];
          if (j !== j1 - 1) {
            str += " & ";
          }
        }
        if (i !== i1 - 1) {
          str += "\\\\";
        }
      }
      return str + "\\end{bmatrix}}";
    };

    return {
      name: name || "",
      _mat: mat,
      partition: partitioner,
      randomize: function(from, to) { return randomizer(this, from, to); },
      add: function(other) { return add(this, other); },
      sub: function(other) { return sub(this, other); },
      get: getter,
      set: setter,
      toLaTeX: latexifier,
      n: i1 - i0,
      m: j1 - j0
    };
  };



  Matrix.stdMatrixMul = function (a, b) {
    var c = Matrix.new(a.n, b.m, "(" + a.name + b.name + ")");
    mul(a,b,c);
    return c;
  };

  var nextPow2 = function(n) {
    var currentPow2 = Math.floor(Math.log(n)/Math.log(2));
    return Math.pow(2, currentPow2 + 1);
  };

  var growNextPowerOf2 = function(orig) {
    if (orig.n !== orig.m) {
      throw "incompatible matrices, different dimensions";
    }

    var nextN = nextPow2(orig.n);
    if (nextN/2 === orig.n) {
      // Don't need to grow it
      return orig;
    }
    var grownMat = Matrix.new(nextN, nextN);
    for (var i = 0; i < orig.n; i++) {
      for (var j = 0; j < orig.n; j++) {
        grownMat.set(i, j, orig.get(i, j));
      }
    }
    return grownMat;
  };


  var strassen = function(a, b, c, leafSize) {

    if (a.n <= leafSize) {
      mul(a, b, c);
      return;
    }

    var A = growNextPowerOf2(a);
    var B = growNextPowerOf2(b);

    var n = A.n;

    var A11 = A.partition(0,   0,   n/2, n/2, "A11");
    var A12 = A.partition(0,   n/2, n/2, n,   "A12");
    var A21 = A.partition(n/2, 0,   n,   n/2, "A21");
    var A22 = A.partition(n/2, n/2, n,   n,   "A22");

    var B11 = B.partition(0,   0,   n/2, n/2, "B11");
    var B12 = B.partition(0,   n/2, n/2, n,   "B12");
    var B21 = B.partition(n/2, 0,   n,   n/2, "B21");
    var B22 = B.partition(n/2, n/2, n,   n,   "B22");

    var M1 = Matrix.new(n, n, "M1");
    var M2 = Matrix.new(n, n, "M2");
    var M3 = Matrix.new(n, n, "M3");
    var M4 = Matrix.new(n, n, "M4");
    var M5 = Matrix.new(n, n, "M5");
    var M6 = Matrix.new(n, n, "M6");
    var M7 = Matrix.new(n, n, "M7");

    strassen(A11.add(A22), B11.add(B22), M1, leafSize);
    strassen(A21.add(A22), B11         , M2, leafSize);
    strassen(A11         , B12.sub(B22), M3, leafSize);
    strassen(A22         , B21.sub(B11), M4, leafSize);
    strassen(A11.add(A12), B22         , M5, leafSize);
    strassen(A21.sub(A11), B11.add(B12), M6, leafSize);
    strassen(A12.sub(A22), B21.add(B22), M7, leafSize);

    var C11 = M1.add(M4).sub(M5).add(M7);
    var C12 = M3.add(M5);
    var C21 = M2.add(M4);
    var C22 = M1.add(M3).sub(M2).add(M6);

    var halfN = C11.n;
    for (var i = 0; i < c.n; i++) {
      for (var j = 0; j < c.n; j++) {
        if (i < halfN && j < halfN) {
          c.set(i, j, C11.get(i, j));
        }
        else if (i < halfN && j >= halfN) {
          c.set(i, j, C12.get(i, j - halfN));
        }
        else if (i >= halfN && j < halfN) {
          c.set(i, j, C21.get(i - halfN, j));
        }
        else if (i >= halfN && j >= halfN) {
          c.set(i, j, C22.get(i - halfN, j - halfN));
        }
      }
    }
  };

  Matrix.strassenMatrixMul = function (a, b, leafSize) {
    if (a.n !== b.n || a.m !== b.m) {
      throw "incompatible matrices, different dimensions";
    }
    if (a.n !== a.m) {
      throw "incompatible matrices, not square matrices";
    }
    var c = Matrix.new(a.n, b.m, "C");
    strassen(a, b, c, leafSize);
    return c;
  };
})();


/*module.exports= {
  "Matriz" : Matrix 
}

/*
//inicia llamadas de funciones
var tam = 2; //tamaño de las matrices

var A = Matrix.new(tam,tam,"A");
var B = Matrix.new(tam,tam,"B");
var C;
var cont = 1;
console.log("Matriz A");
//ingresa datos a matriz A
for(var i =0 ; i<tam;i++){
  for(var j =0 ; j<tam;j++){
    A.set(i,j,cont); 
    cont++;
  }
}
//verifica datos en matriz A
for(var i =0 ; i<tam;i++){
  for(var j =0 ; j<tam;j++){
    console.log(A.get(i,j));
  }
}
console.log("Matriz B");
//ingresa datos a matriz B
for(var i =0 ; i<tam;i++){
  for(var j =0 ; j<tam;j++){
    B.set(i,j,cont);
    cont++;
  }
}
//verifica datos en matriz B
for(var i =0 ; i<tam;i++){
  for(var j =0 ; j<tam;j++){
    console.log(B.get(i,j));
  }
}
//Multiplicacion de matrices por Strassen
C = Matrix.strassenMatrixMul(A,B,tam);//tengo duda con el ultimo parametro de esta funcion
console.log("Matriz C");
for(var i =0 ; i<tam;i++){
  for(var j =0 ; j<tam;j++){
    console.log(C.get(i,j));
  }
}
*/