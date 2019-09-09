document.getElementById("logogramselectionModal");




/**************************************************************
 *                   SHOW / HIDE
 **************************************************************/
// Get the modal
var modal = document.getElementById("logogramselectionModal");


// Get the button that opens the modal
$('.logogramselectiontrigger').click(event, function () {
    modal.style.display = "block";
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

$('.modal .closebutton').click(event, function () {
    modal.style.display = "none";
});

/**************************************************************
 *                      SELECTION
 **************************************************************/


$('.modal .resetbutton').click(event, function () {
    $('#radicalselection span').removeClass("selected");
    $('#logogramsfilter').empty().hide();
});

$('#radicalselection span').click(event, function () {

    $('#radicalselection span').removeClass("selected");// solo 1
    var target = event.target;
    if (target.classList.contains("selected")) {
        target.classList.remove("selected");
    } else {
        target.classList.add("selected");
    }

    var text = $(this).text();
    updateselection(text);
});



var updateselection = function (text) {
    /*
    工 a b c y de estos 
    var prueba ="⿱廿⿻巾⿰入入";
    alert(prueba.includes('冂'));
    
    */
    // Use each: 'i' is the postion in the array, obj is the DOM object that you are iterating (can be accessed through the jQuery wrapper $(this) as well).

    $('#radicalselection span .selected').each(function (i, obj) {
        alert(obj.text());
    });

    //var text = '口';
    var filtered = Object.fromEntries(Object.entries(logograms).filter(([key, value]) =>
        value.radical == text ||
        value.decomposition.includes(text) ||
        ('etymology' in value && 'semantic' in value.etymology && value.etymology.semantic == text)
    ));

    $('#logogramsfilter').show();

    $('#logogramsfilter').html(
        hreflogograms(Object.keys(filtered)));
    $('#logogramsfilter span').click(event, function () {
        var text = $(this).text();
        window.open('?q=' + text);
    });



    return;
    $('#logogramsfilter').html(Object.entries(filtered).keys.join(' '));
    for (const [key, value] of Object.entries(filtered)) {

    }
}
