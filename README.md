# Strassen
Esta es una pagina sencilla en el que mostramos mediante una animacion el funcionamiento del Algoritmo de Strassen.
En Animacion.html se dividiob en 2, uno para solicitar el tamaño, llenado de las matrices y nos dará el resultado de
forma consecutiva en el lado izquierdo.

Al llenar ambas matrices (A,B), se desplegará el boton de calcular. Al darle click, nos dará el resultado automaticamente
y del lado derecho podremos ver las matrices con los datos que colocó el usuario y listas para animar el proceso mediante
el boton de "animar".

Fue creado y desarrollado en javaScript, puedes encontrarlo en animacion.html y el algoritmo en ./js/matriz_dinamica.js

**OBSERVACION**: La animacion tiene como limitante que las matrices no sean mayores a 4x4, en caso de querer una animacion con
dimensiones mayores, tendrás que ampliar el margin-bottom del div de la animacion.

NOTA IMPORTANTE: El algoritmo de Strassen funciona con cualquier dimension cuadrada (2x2,3x3,4x4, ... , NxN) No hay ningun problema. 
Pero para la animacion solo funciona con matrices cuadradas con bases pares.
Ejemplo: (2x2,4x4,6x6,8x8).
En caso de que se quiera una matriz impar(3x3,5x5,7x7) para la animacion, sera necesario que le aumentes +1 a las dimensiones de las 
matrices al momento que crearlas y los espacios sobrantes lo rellenes con ceros. 
