document.body.onload = function()
{
    $(".dot-1").css("animation", "dot-light 2s 0s forwards");
    $(".dot-2").css("animation", "dot-light 2s 0.75s forwards");
    $(".dot-3").css("animation", "dot-light 2s 1.5s forwards");
    $(".dot-4").css("animation", "dot-light 2s 2.25s forwards");
    setTimeout(function(){$(".item-1").css("width", "0");}, 4000);
    setTimeout(function(){$(".item-2").css("height", "0");}, 5000);
    setTimeout(function(){$(".item-3").css("height", "0");}, 5300);
    setTimeout(function(){$(".item-4").css("height", "0");}, 5500);
 
    setTimeout(function(){$(".header").css({"opacity":"1", "transform":"translate(0)"});}, 6100);
    setTimeout(function(){$(".p-1").css({"opacity":"1", "transform":"translate(0)"});}, 6300);
    setTimeout(function(){$(".p-2").css({"opacity":"1", "transform":"translate(0)"});}, 6500);
    setTimeout(function(){$(".p-3").css({"opacity":"1", "transform":"translate(0)"});}, 6700);
 
    setTimeout(function(){$(".preloader").css("visibility", "hidden");}, 7000);
}



function copyToClipboardmail(text){
			var copytext=document.createElement('input')
			if(typeof text=='undefined') copytext.value="kolesnikov.nikitavlg@gmail.com"
			 else copytext.value=text
			    document.body.appendChild(copytext)
			    copytext.select()
			    document.execCommand('copy')
			    document.body.removeChild(copytext)
			    alert("Почтовый адрес скопирован в буфер обмена")
				}


function copyToClipboardDis(text){
			    var copytext=document.createElement('input')
			    if(typeof text=='undefined') copytext.value="fgeeha#9066"
			    else copytext.value=text
			    document.body.appendChild(copytext)
			    copytext.select()
			    document.execCommand('copy')
			    document.body.removeChild(copytext)
			    alert("Discord id скопирован в буфер обмена")
				}
	
