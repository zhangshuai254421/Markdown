/* 可复用魔方渲染组件 · Reusable cube face / piece renderer
   颜色键：W白 Y黄 R红 O橙 G绿 B蓝 X灰（未知）
   用法：
     Cube.face(container, [
       ['W','W','W'],
       ['W','W','W'],
       ['W','W','W']
     ], { mark: [[1,1]], labels: {'1,1':'中心'} });
     Cube.pieces(container);  // 渲染三种块的图示 */
(function () {
  "use strict";

  var COLORS = {
    W: "#ffffff", Y: "#ffd500", R: "#c41e3a", O: "#ff8c00",
    G: "#009e60", B: "#0051ba", X: "#9aa0a6"
  };

  function colorName(key) {
    var map = { W: "白", Y: "黄", R: "红", O: "橙", G: "绿", B: "蓝", X: "灰" };
    return map[key] != null ? map[key] : key;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* 画一个 3×3 面。grid 为 3×3 二维数组；opts.mark 为高亮坐标数组 [[r,c]..]；
     opts.labels 为 { 'r,c': '文字' }。 */
  function face(grid, opts) {
    opts = opts || {};
    var marks = {};
    (opts.mark || []).forEach(function (rc) { marks[rc[0] + "," + rc[1]] = true; });
    var labels = opts.labels || {};

    var wrap = el("div", "cube-face");
    grid.forEach(function (row, r) {
      row.forEach(function (key, c) {
        var cell = el("div", "cube-cell");
        cell.style.background = COLORS[key] || COLORS.X;
        if (marks[r + "," + c]) cell.classList.add("is-mark");
        var label = labels[r + "," + c];
        if (label != null) {
          cell.classList.add("is-label");
          cell.textContent = label;
        }
        wrap.appendChild(cell);
      });
    });
    return wrap;
  }

  /* 三种块：中心块（1 贴纸）、棱块（2 贴纸）、角块（3 贴纸）。 */
  function pieces() {
    var row = el("div", "piece-row");

    function cellHtml(key) {
      var d = el("div", "cube-cell");
      d.style.width = "46px";
      d.style.height = "46px";
      d.style.borderRadius = "6px";
      d.style.background = COLORS[key] || COLORS.X;
      return d;
    }

    function make(name, meta, keys) {
      var box = el("div", "piece");
      var holder = el("div", "");
      holder.style.display = "flex";
      holder.style.gap = "3px";
      holder.style.justifyContent = "center";
      keys.forEach(function (k) { holder.appendChild(cellHtml(k)); });
      box.appendChild(holder);
      box.appendChild(el("div", "piece-name", name));
      box.appendChild(el("p", "piece-meta", meta));
      row.appendChild(box);
    }

    make("中心块", "1 张贴纸 · 共 6 个", ["G"]);
    make("棱块", "2 张贴纸 · 共 12 个", ["W", "R"]);
    make("角块", "3 张贴纸 · 共 8 个", ["W", "R", "G"]);
    return row;
  }

  window.Cube = { COLORS: COLORS, colorName: colorName, face: face, pieces: pieces, el: el };
})();
