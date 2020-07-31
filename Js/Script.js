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
	
