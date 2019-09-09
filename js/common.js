var CreateTableOfContents = function () {
  var ToC = "<nav role='navigation' class='table-of-contents'><h2>Contenido</h2><ul>";
  $("h1, h2, h3, h4, h5, h6").each(function () {
    var el = $(this);
    var title = el.text();
    var id = 'h' + guidGenerator();
    el.attr("id", id);
    var level = el.prop("tagName").substring(1);

    ToC += "<li style='padding: 0 " + ((level - 1) * 10).toString() + "px;'><a href='#" + id + "'>" + title + "</a></li>";
  });
  ToC += "</ul></nav>";
  $('#TableOfContents').html(ToC);
}


/**************************************************************
 *                      RANDOM
 **************************************************************/
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}
 function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function guidGenerator() {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}


/**************************************************************
 *                      URL PARSING
 **************************************************************/
var GetURLParameter = function (sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) {
      return sParameterName[1].split('+');
    }
  }
}

function hyperlinkDownload(id, filename, text, type = "text/plain") {
  var a = document.getElementById(id);

  var blob = new Blob([text], { type: type });
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  // a.click(); // without asking the user to do a right click
}



