// Copyright (c) 2022 Anne Media Patrons | Collaborative Public Licence (https://annika.anne.media/)
protect();

async function protect() {

    // let scripts = ['libs/sha256.js']
    // var loader = new ann.ScriptLoader({ folder: 'js', src: scripts})
    // loader.load();

    let modaltitle = 'PRIVATE MODE'
    let modaltext = 'Please enter your demo key';
    document.body.style.position = 'unset';
    let pass = localStorage.getItem('demopass');

    if(!pass) {
        ann.modal(modaltitle,modaltext,1,null,1);
        let mpw = document.querySelector('modal input[type=password]')
        console.log('mpw :', mpw);
        mpw.setAttribute('maxlength', 60)
        await ann.modalResponse()
        if(ann.get.modal.response==0) {return}
        pass = localStorage.getItem('pass');       
        localStorage.setItem('demopass', pass);
        localStorage.removeItem('pass');
    }
    let response = await ann.fetch('privateMode', { pass: pass }, 'POST');
    if(!response.fail) {
        let scripts = response.scripts;
        let loader = new ann.ScriptLoader({ folder: 'js', src: scripts})
        loader.load();
        if(ann.get.hasCollapsible){ann.runLast(ann.collapsible)}
        setTimeout(function(){
            document.body.style.position = 'relative';
            if(ann.get.hasCollapsible){ann.runLast(ann.collapsible)}
            if(ann.get.hasHovertips){ann.runLast(ann.hovertips)}
            if(ann.get.hasCopyToClipboard){ann.runLast(ann.copyToClipboard)}
            if(ann.get.hasDynResolution){ ann.runLast(ann.applyResolution)}
            if(ann.get.hasModaltips){ann.runLast(ann.modaltips)}
          },2000)          
          

    } else {
        localStorage.removeItem('demopass');
        protect();
    }

}
