
// Copyright (c) Anne Media - No Rights Reserved
// The Unlicense https://unlicense.org/

ann = {}, window.ann = ann, ann.get = {}, ann.iam = {}, ann.cl = {}, ann.cl.auth = {}, ann.cl.reg = {}, ann.docs = {}, ann.cl.onload = {}, ann.cl.onresize = {}, ann.keep = {}, ann.bool = {}, ann.utils = {}, window.ann = ann; ann.get.modal = {};
ann.get.hasCollapsible = true;
ann.get.hasHovertips = false;
ann.get.hasModaltips = false;
ann.get.hasCopyToClipboard = true;

ann.get.hasDynResolution = true;
ann.get.lastRunInterval = 1000;
ann.get.regex1 = /[\s~`!@#$%^&*()_+\-={[}\]|\\:;"'<,>.?/]+/g // replaces special chars with _, removes spaces and replaces 1 with _
ann.get.collapsenonactive = true;  
ann.get.collapsiblefirstopen = true;
ann.get.showSliderInput = false;

ann.get.failsafetimeout = 10000;

ann.get.pageIndex = 0;

ann.get.modal.btnone = 'CANCEL';
ann.get.modal.btntwo = 'CONFIRM';
ann.get.modal.btnonealt = 'OK'

ann.get.menuCallback = null;
ann.get.modal.response = -1;
ann.get.completedsubs = -1

ann.get.subid = {
  id: -1
};
ann.get.this = -1;
ann.keep.isChecked = false;
ann.utils.imgholder = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
ann.get.menuid = null;
ann.get.multiArrayPrintType = 1;

// abstracts:
// ann.get.menuCallback = async function menuCallback(id, e) {
//       // You may want to copy this to your script.
//       // See the docs at https://annika.anne.media (The Subroutine section) for more info
// }

// ann.cl.onresize.callback = function customOnResize() {
      // You may want to copy this to your script.
      // See the docs at https://annika.anne.media (The Annika API section) for more info
// }


ann.sleep = async function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var globalstart = Date.now();
var globaltimeout = 1000;
async function loadFailSafe() {
  if((Date.now() - globalstart) < globaltimeout && ann.get.subid.id < 2) {    
    await ann.sleep(100);
    loadFailSafe();
  } else if ((Date.now() - globalstart) >= globaltimeout && ann.get.subid.id < 2 && ann.get.completedsubs > 1) {
    location.reload();
  }
}
loadFailSafe();

ann.Subroutine = async function Subroutine(nameorarray, commands, htmls = [], classes = [], callbacks = [], params = []) {
    // each interation returns Sub id
    var returnid, givenparent, appendmethod;
    var name = nameorarray
   // console.log('nameorarray :', nameorarray);
    // Sub must have a name
    if(!name) {
        console.error('Subroutine must a name. Specify a name.')
        return;
    } else if(Array.isArray(name)) {
        givenparent = name[1]
        appendmethod = name[2]
        name = name[0]
    }

    // all arguments must be arrays of the same length
    var agreeablelength = commands.length;
    for(var i in arguments) {
        //i>0 to skip checking first parameter (name)
        if(i>0 && agreeablelength !== arguments[i].length) {
            console.error('wrong number of arguments passed into parameter array ' + arguments[i] + ' of the Subroutine ' + name);
            return;
        }
    }
    var childsub = (typeof commands[commands.length - 1] === 'function' || (commands[commands.length - 1] && typeof commands[commands.length - 1][0] === 'function')) ? commands[commands.length - 1] : false;
    var childparams, childparent

    if(childsub) {
      let allparams = arguments[arguments.length-1]
      childparams = allparams[allparams.length-1];
      childparent = givenparent;
  //    console.log('arguments :',allparams, childparams);
        for(var i in arguments) {
            if(i>0) {
            //  console.log('arguments[i] :', arguments[i]);
              arguments[i].pop();          

            }
        }
    }
  
    // Sub unique id's
    ann.get.subid.id++
    var subid = ann.get.subid.id;
    if(ann.get.runs.indexOf(ann.get.subid.id) === -1) {
        ann.get.runs.push(ann.get.subid.id);
    } else {
        subid = ann.get.subid.id++;
        while(ann.get.runs.indexOf(subid) !== -1){
            subid = ann.get.subid.id++;
            ann.get.runs.push(subid);
            console.warn("This should never run, but if you see this message it means the Sub is to making sure the DOM ids are always unique. Double check your DOM for any ID duplications.")
        }
    }

      // lasthtmls is used to determine the last html array, needed if makeFractals fc is triggered, to exec subroutineOnLoad fc at the last iteration
    // childsub indentifies if function object has been passed into commands array. This function will execute in the onLoad function after the main sub completed execution.
    var lasthtmls;
    for(var i = htmls.length - 1; i >= 0; i--) {
        lasthtmls = (typeof htmls[i] === 'object') ? htmls[i] : false;
        if(lasthtmls) break;        
    }
    // if(name == 'qrinfo') {
    // console.log('name :', name);

    // }



    var flextype; //true when _x is found, false if _y is found // undefined if not specified
    var targetparent;
    var depth = -1;
    var hasevent = false;
    var el;
    var elarr = [];
    var priordepth = depth;
    var inputtype;
    var elmultiplier = 1;
    // splits name of the Sub and it's onLoad function (if specified)
    var onLoad = (name.split('+')[1]) ? name.split('+')[1] : false;

    var subname = (name.split('+')[0]) ? name.split('+')[0] : name;
    // var docFragment = document.createDocumentFragment();
    // loop through the commands
    var rand = ann.generateRandomString(4);
    for(var i in commands) {
    
        flextype = (commands[i].includes('_x')) ? 'flexitr' : (commands[i].includes('_y')) ? 'flexitc' : undefined;
        // target parent is preceding element if $ index is not specified;
        targetparent = (!Array.isArray(commands[i]) && commands[i].startsWith('$')) ? parseInt(commands[i].split("_")[0].replace('$', '')) - 1 : i - 1;
        //  hasevent = (commands[i].includes('@')) ? true : false;
        hasevent = (callbacks[i]) ? true : false;

        if(!Array.isArray(commands[i]) && commands[i].startsWith('x') && commands[i].includes('_')) {
          let multitest = ann.returnNumber(commands[i].split("_")[0])
          elmultiplier = (commands[i].startsWith('x') && !isNaN(multitest)) ? multitest : 1;
        }
        var elemtype = (!Array.isArray(commands[i])) ? getElementTypeFromCommand(commands, i) : undefined
        var noFractals = (!htmls[i] || htmls[i] === null || htmls[i] instanceof Element || typeof htmls[i] === 'string' || typeof htmls[i] === 'number' || typeof htmls[i] === 'function' || commands[i].includes('croppie')) || elemtype === 'a' ? true : false;
        el = document.createElement(elemtype);
        elarr.push(el)

        if(commands[i].includes('widgets')) {
          for (var h in htmls[i]) {           
            ann.widgetLoader(htmls[i][h], elarr[targetparent])        
          }
          return;
        }       
       // console.log('name :',i, elemtype, depth, priordepth, name, subid, commands);
        if(noFractals && elmultiplier < 2) { 
   
            depth = -1;
            priordepth = depth;
            
            el.id = elemtype + '-' + subid + '-' + i;

            if(elemtype === 'input') { inputtype = ann.getPartString(commands[i],'input_', 1); el.type = inputtype; } 
            if(inputtype && inputtype.includes('input')) { inputtype = 'text'; el.type = inputtype;}

                        
            if(i==0){ el.setAttribute('sub',subname); returnid = el.id             
              if(givenparent) {
            
                if(!appendmethod) {
                  givenparent.append(el)
                } else if(appendmethod === 'prepend') {
                  givenparent.prepend(el)
                } else if(appendmethod === 'before') {
                  givenparent.before(el)
                } else if(appendmethod === 'after') {
                  givenparent.after(el)
                }
                
              }
            }
            
            var isNaNu = isNaN(targetparent)
            if(isNaNu) { targetparent = ann.returnNumber(targetparent)}
            if(commands[i].includes('register')) {
              var cb = callbacks[i];
              ann.evalObject(ann.cl.reg.makeReg).then(function(resolve){
                if(cb && cb[1] && typeof cb[1] === 'function') {
                  ann.cl.reg.makeReg(cb[0], cb[1])
                } else if(cb && cb[0] && typeof cb[0] === 'function'){
                  ann.cl.reg.makeReg(cb[0])
                } else if(cb === 'function'){
                  ann.cl.reg.makeReg(cb);
                } else {
                  ann.cl.reg.makeReg();
                  console.info("Default registration module was activated without callbacks. If that is the intent, that's ok")
                }
              })
              continue;
            }
            if(commands[i].includes('form')) {
                // laravel/php csrf                   
                let csrf = (document.querySelector('meta[name=csrf-token]')) ? document.querySelector('meta[name=csrf-token]').content : null;
                if(csrf) {
                  let inp = document.createElement('input');
                  inp.setAttribute('name', '_token');
                  inp.setAttribute('value', csrf);
                  inp.setAttribute('type', 'hidden');
                  el.append(inp);                  
                }
            }

            if(commands[i].includes('croppie')) {                
                let label, imgsrc;
                if(htmls[i] && htmls[i][0]) {
                  label = htmls[i][0];
                }
                if(htmls[i] && htmls[i][1]) {
                  imgsrc = htmls[i][1];                  
                }
                
                ann.createCroppie(el, commands[i], elarr[targetparent], label, imgsrc)
                continue;
            }
            if(commands[i].includes('slider')) {
                let hasinput = false
                if(commands[i].includes('_i') && !commands[i].includes('_ih')) { hasinput = true }
                let command = commands[i].split('_i')[0];              
                let mininput = (commands[i].split('_ih')[1]) ? ann.returnNumber(commands[i].split('_ih')[1]) : (commands[i].split('_i')[1]) ? ann.returnNumber(commands[i].split('_i')[1]) : 0;                
                if(!isNaN(parseFloat(mininput))) { mininput = parseFloat(mininput) }
                let range = ann.getPartString(command,'_',2)
                if(!isNaN(range)) { range = parseFloat(range)} else { range = 100}              
                ann.rangeSlider(el, elarr[targetparent], callbacks[i], range, hasinput, mininput);
                continue;
            }
            if(commands[i].includes('countries')) {
        //     console.log('commands[i] :', commands[i]);
              let cdata = await ann.getCountries();              
              inputtype = (commands[i].includes('checkbox')) ? 'checkbox' : 'radio'
              for(var n in cdata) {
                let input = document.createElement('input');
                ann.addClasses(input, 'hide') 
                input.type = inputtype; input.id = cdata[n].code;
                input.name = subid + '-country'
                let label = document.createElement('label');  
                label.innerHTML = cdata[n].emoji + "&nbsp;" + cdata[n].name;
                label.setAttribute('for', input.id)
                el.append(input);el.append(label);
              }
              // continue;    
            }

            if(elemtype === 'a') {
              if(typeof htmls[i] === 'string') {
                el.setAttribute('href',"#")
                el.innerHTML = htmls[i];
              } else if(typeof htmls[i] === 'object' && htmls[i][0] instanceof Element) {
                  el.append(htmls[i][0])
                   if(htmls[i][1]) { el.setAttribute('href',htmls[i][1])}
              }       
              else  {
                if(htmls[i][0]) { el.innerHTML = htmls[i][0] }
                if(htmls[i][1]) { el.setAttribute('href',htmls[i][1])}
                if(htmls[i][2]) { el.setAttribute('target', htmls[i][2]) }
              } 
            } else if (typeof htmls[i] === 'string') {
                if(elemtype === 'img') {
                    el.src = htmls[i];
                    el.setAttribute('alt', 'image ' + subid);
                } else if(!htmls[i].includes('label_')) {
                    el.innerHTML = htmls[i];
                }
            } else if (typeof htmls[i] === 'number') {              
                  el.innerHTML = htmls[i];
            } else if(typeof htmls[i] === 'function') {
                let fcid = await htmls[i](elarr[targetparent]);
                let el2 = document.getElementById(fcid);
                if(el2) {el.innerHTML = el2.innerHTML;}              
            } else if(htmls[i] instanceof Element) {
              el.append(htmls[i]);
            }
            if(targetparent === -1 || commands[i].startsWith('$0')) {
                if(!givenparent) {
                  document.body.append(el)          
                }
            } else if(i != 0 && !isNaN(targetparent) && elarr[targetparent]) {
              elarr[targetparent].append(el)
            } else {
                //this scerario is a failsafe, and may happen when first dom element in childsub has the $ append-to command bit, meaning we want to append it to a parent dom element that is part of a parent sub. The childsub at this point starts new loop so we don't have direct means to recognize the parent in this place, for now, append to body, BUT store the targetparent reference number and redo the append withing the scope of childsub if clause at the bottom of the Subroutine function.               
                el.setAttribute('subparent',targetparent);
                //experimental exclusion
                if(!givenparent) {
                  document.body.append(el)
                }
              
            }       
            
            if(classes[i] && classes[i].includes('openqr')) {
            }                        

            if (elemtype === 'input' || elemtype === 'textarea' ||  elemtype === 'select')  {
                if(inputtype === 'button') {
                    el.setAttribute('value', htmls[i]);       
                } else if(inputtype && inputtype.includes('password')) {
                    el.type = 'password'
                    el.setAttribute('autocomplete', 'current-password')
                    let wrap = document.createElement('div');
                    wrap.classList.add('eyewrap');
                    let par = el.parentNode;
                    par.append(wrap)
                    wrap.append(el);
                    if(classes[i].includes('hide')) {
                      ann.addClasses(wrap, 'hide')
                    }
                    let eye = document.createElement('img');
                    eye.setAttribute('alt', 'See password');
                    eye.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAADQ0lEQVRoge3YT4ydUxjH8Y9JpS1KyzQy/g2qM9LEtosSgjQkiHS0o7VhZeFPmnRjI5b+l7KzlGAh7FBBtFNtpNNSbMQ0pohE6ZS2I2kZnWvxnGte03nfOff2Tlm83+Rszj3P8/yee57z76WmpqampqampmauOKuDvs7HTViFFehDNxal38cxhm/wNXZhKPX/5yzCA/gIE2i02CbwIe43lfAZpRcv4GhB1F/YjScxiOvEjMxPbWnqG8RTGE42Tfuj2IwrzkQCS/ES/igI2ItHkuh2/D2Kzwr+TuDFNv1lsQ6HCgF34a4O+r8BHxf8/4YHdXAd9+L9QoBPcWuG3VrswO+pDWEgw261KNFmvK1Jw2lxL44lh+OiDLqwHPdU2G1RvsA3V9itS767sFH8AY2kYbCdBOaJxdwM/gGuxDl4XqyRsrJaW5FEs60psV2ffD+XYl0ldrUGJlPseblJLMH2ZHwSj4s6XYWRgpiy3WVHRiLbS2z7CmNGcL2YnSeSloZYR4tnS+ISfJUMxnBb6t/o1HNiYYmP8YxEjpXYnjtt3AQ2pd9ux+HU/yV6ypLoxYE08FtcgwV4tUTMBXOQyOKS8a+LUuvDaOobNcMm0IP9acDnuDj1DVeIubZEzFBGIttKbFdU2OzDZUnXvtS337SZ2VsYvETU/0iF04byXWQgI5G7S2zXz2I3iqtxIb4wdSD/wyfi3+/GMnyXIea1EjHEFltm92yF3RsZcX9Ev7gV7EnaT2E5vs9w1qzzqmvEGlFCzQNxm/KZkITlrK8GfhAzMyPzTZVYbttSIaxVXm4x9u6keUYuws4WnP2JmzuQxC1aewbsTForWYi3W3B6SNRsu/SLMys33lviWMiiSyzKyUznh+VdJKezGr9mxpjEM0lby9xp6jSdrZ3Em+JONhuX4hX/flhVtTHc0U4CRS7Hu5kBG+JhtBUP4UZROv3iPf+weBKcaMHfO+Ig7Bj34ZcWBJxu+xkbOplAkfPwGI7MYQLjeFrGDbcTdIsPCAc7mMBB8eFizt7qVZwtXorv4XiG2OntuFh/A8lX23TyA90CrBSLeqW4QvSI71UNcU35STwR9ojH1bB4EdbU1NTU1NTU1PyP+RtTbxerEpB44AAAAABJRU5ErkJggg=='
                    wrap.append(eye);
                    eye.classList.add('eye');
                 //   let minmax = ann.getPartString(inputtype,'password_', 1);                  
                    let minlength = 4; //ann.getPartString(minmax,'-', 0);
                    let maxlength = 8; //ann.getPartString(minmax,'-', 1);
                    el.setAttribute('minlength', minlength);
                    el.setAttribute('maxlength', maxlength);
                    let pwvalidation = document.createElement('span');
                    ann.addClasses(pwvalidation, 'pwvalidation hide fadeOut')
                    pwvalidation.innerHTML = "Please enter a PIN between " + minlength + " and " + maxlength + " characters";
                    wrap.append(pwvalidation);
                    ann.createListener(eye,'click', toggleInputType)           
                } else if(inputtype && (inputtype.includes('radio') || inputtype.includes('checkbox'))) {
                      el.setAttribute('name', inputtype + '-' + elemtype + '-' + subid + '-' + rand); 
                      el.setAttribute('type', inputtype); 
                }
                if(typeof htmls[i] === 'string' && htmls[i].includes('label_')) {
                    let labelel = document.createElement('label');
                    labelel.setAttribute('for', el.id);
                    labelel.classList.add('customlabel');
                    labeltext = ann.getPartString(htmls[i],'_', 1)
                    console.log('labeltext :', labeltext);
                    labelel.innerHTML = labeltext;
                    if(classes[i] && classes[i] !== null && classes[i].includes('hide')) {ann.addClasses(labelel,'hide') }
                    if(htmls[i].includes('xlabel_')) {
                        let par = el.parentNode;                        
                    //    console.log('par :', par);
                        let wrapl = document.createElement('label');
                        wrapl.classList.add('flexitr')
                        wrapl.append(el)
                        wrapl.append(labelel)                      
                      //  console.log('wrapl :', wrapl);
                        par.prepend(wrapl);
                      //  par.insertAdjacentHTML('beforebegin', labelel.outerHTML);   
                    } else {
                        el.insertAdjacentHTML('beforebegin', labelel.outerHTML);   
                    }
                }
            }
            if(flextype) { ann.addClasses(el, flextype) }
            
            if(classes[i] && classes[i] !== null) { ann.addClasses(el, classes[i]) }
        
            if(hasevent) {
                let lastindex = commands[i].lastIndexOf('@');
                let listenertype = commands[i].substring(lastindex + 1)
                if(lastindex === -1 && callbacks[i]) { listenertype = 'click'}
                ann.createListener(el, listenertype, callbacks[i], params[i]);
            } else {
                if(params[i]) {
                    // untested
                    callbacks[i](...params[i], el.id);
                } else if(callbacks[i]) {
                    callbacks[i](el.id);
                } else {
                    // console.info("Subroutine " + subid + ' executed ' + commands[i]);
                    //  el.classList.toggle("hide");
                }
            }
        } else {
      //    console.log('name :',i, elemtype, depth, priordepth, name, subid, commands);
          // Rube Goldberg's bridge, find a better way to limiting the execution
              // x > i ensures the depth count begins using next element in sequence after current commands[i]
              // the depth is a helper variable preventing command execution repetion, passing on correct workload to the makeFractals fc. 
            if(depth === -1 && htmls[i]) {
                if(htmls[i].length > 0) {
                    depth = 0;
                }
                var agreeabledepth = htmls[i].length || Object.keys(htmls[i]).length;            
                for(var x in htmls) {
                    if(x > i) {
                        if(elemtype === 'select'){
                            depth = 0;                            
                        } else if(htmls[x] && ((agreeabledepth === htmls[x].length) || agreeabledepth === Object.keys(htmls[x]).length)) { 
                          if(elemtype !== 'info') {
                              depth++;
                          } else {
                              depth = 0;
                          }
                      }
                        else {
                            break;
                        }
                    }
                }
            }
            // the priordepth might no longer be needed, need some testing, this is a quick fix for specific scenario where the prior depth gets value 0 for the second select in the row but it should be -1
            if(elemtype === 'select' && commands[parseInt(i)-1] && commands[parseInt(i)-1].includes('select')) {
              priordepth = -1;
            }

           // console.log('name :',i, elemtype, depth, priordepth, name, subid, commands);
            if((typeof htmls[i] == 'object' && depth >= 0 && priordepth < 0) || elmultiplier > 1) { 
      
               // console.log('name :',depth, priordepth, name, subid, commands);
            
               
                priordepth = depth;

                makeFractals(name, subid, elarr, elemtype, i, commands, htmls, classes, callbacks, params, onLoad, lasthtmls, flextype,targetparent,depth, elmultiplier);
            //    console.log('name :',i, elemtype, depth, priordepth, name, subid, commands);
                elmultiplier = 1;
                depth = -1;
          }
        }
    }

    function toggleInputType(id, e) {
      const password = e.target.previousSibling;
      const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', type);
      e.target.classList.toggle('invert-05');
    }

    function getElementTypeFromCommand(commands, i) {
        var elemtype = (commands[i].startsWith('$')) ? commands[i].replace(commands[i].split("_@")[1],'').replace('_x', '').replace('_y','').replace(commands[i].split("_")[0],'').split("_")[0] : commands[i].replace('_x', '').replace('_y', '').replace(commands[i].split("_@")[1],'').replace('_@', '');
        if (elemtype === '') { elemtype = commands[i].replace('_x', '').replace('_y','').replace(commands[i].split("_")[0],'')}
        if (elemtype.startsWith('_', 0)) { elemtype = elemtype.substring(1, elemtype.length)}
        if (elemtype.startsWith('x', 0) && elemtype.includes('_')) {  elemtype = elemtype.split("_")[1]}
        if (elemtype.includes('-')) { elemtype = elemtype.replace('-','')}
        if (elemtype.includes('^w_')) { elemtype = elemtype.replace('^w_','')}
        if (elemtype.includes('^_')) { elemtype = elemtype.replace('^_','')}
        if (elemtype.includes('#_')) { elemtype = elemtype.replace('#_','')}
        if (elemtype.includes('_@')) { elemtype = elemtype.replace(commands[i].split("_@")[1],'').replace('_@', '')}
        if (elemtype.includes('input')) { elemtype = 'input' }
        if (elemtype.includes('croppie')) { elemtype = 'croppie' }
        if (elemtype.includes('slider')) { elemtype = 'slider' }
        if (elemtype.includes('countries')) { elemtype = 'countries' }
        if (elemtype.includes('_checkbox') && !elemtype.includes('input')) { elemtype = elemtype.replace('_checkbox','') }
        if (elemtype.includes('_radio') && !elemtype.includes('input')) { elemtype = elemtype.replace('_radio','') }
        return elemtype;
    }


    var remeberonLoad; // remeber so it can be exec'ed only once at after last command is processed
    ann.get.zindexcontrol = 1000;

    async function makeFractals(name, subid, elarr, elemtype, i, commands, htmls = [], classes = [], callbacks = [], params = [], onLoad, lasthtmls = [], flextype,targetparent,depth, elmultiplier) {
       // console.log('name :', name, subid, commands);

        var hasFractalParent = (commands[i].includes('^_') || commands[i].includes('#_') || Array.isArray(commands[i])) ? true : false;
        var el;
        var ind = i;
        if(onLoad) { remeberonLoad = onLoad}

        if(elmultiplier > 1) {
          for (var e = 0; e < elmultiplier; e++) {
            el = document.createElement(elemtype);
            ann.addClasses(el, classes[i]);                
            elarr[targetparent].append(el)
          }
          // console.log('remeberonLoad :', name, commands[i], lasthtmls, remeberonLoad);
          // TODO: onload does not trigger here (it should but there's a dup). As an alternative fix, a Sub can be called with await, and onload code can be executed underneath.
          return;
        }

        if(hasFractalParent) {
            var isFractalChild;
            var commandsarray = []; 
            var classesarray = [];
            var reorgs = [];
            var hasevents = [];
            var listenertypes = [];
            var callbacksarray = [];
            var paramsarray = [];

            // i is passed from the original commands loop, looping only through subsequent html elements
            for(var f = i; f < htmls.length; f++) {
              
              if(htmls[f] && typeof htmls[f][0] === 'object' && commands[i].includes('#_')) {
                jsonPrint(subid, htmls[f],commands, classes[f], callbacks[f], params[f],elarr,f,targetparent,remeberonLoad)                
                return;
              } else if(Array.isArray(commands[i])) {
                  if(ann.get.multiArrayPrintType === 1) {
                    multiArrayPrint(subid, htmls[f],commands[f], classes[f], callbacks[f], params[f],elarr,f,targetparent,remeberonLoad)   
                  //  console.log('running multiArrayPrint1') 
                  } else {
               //     console.log('running multiArrayPrint2')
                    multiArrayPrint2(name, subid, htmls[f],commands[f], classes[f], callbacks[f], params[f],elarr,f,targetparent,remeberonLoad)    
                  }                  
                  return;
              }
                isFractalChild = (commands[f].includes('^_')) ? true : false;
                // hasFractalParent = (commands[i].includes('^w_')) ? true : false;
                // $ identifies where the vertical order should break 
                let outoforder = (commands[f].includes('$')) ? true : false;
                if(!outoforder) {
                    commandsarray.push(getElementTypeFromCommand(commands, f));
                    reorgs.push(htmls[f]);
                    
                    classesarray.push(classes[f]);
                    // let hasevent = (commands[f].includes('@')) ? true : false;
                    let hasevent = (callbacks[f]) ? true : false;
                    hasevents.push(hasevent);
                    let lastindex =  commands[f].lastIndexOf('@');
                    let listenertype = commands[f].substring(lastindex + 1)
                    if(lastindex === - 1 && callbacks[f]) {listenertype = 'click'}
                    listenertypes.push(listenertype);
                    callbacksarray.push(callbacks[f])
                    paramsarray.push(params[f])
                } else {
                    break;
                }
                if(!hasFractalParent && !isFractalChild) {
                    break;
                }
                
            }
            verticalPrint(commandsarray, reorgs, classesarray, elarr, subid, hasevents, listenertypes, callbacksarray,paramsarray, targetparent, remeberonLoad, ind, lasthtmls)          
            return;
        }
      
        var hasevent;
        if(elemtype === 'select') {
        
            var selectwrap = document.createElement('div');
            console.log('name :', name, subid, commands);
            console.log('selectwrap :', selectwrap);
            selectwrap.id = 'selectwrap-' + subid + '-' + i;
            selectwrap.classList.add('selectwrap');
            selectwrap.style.zIndex = ann.get.zindexcontrol;
            ann.get.zindexcontrol--;
            var selected = document.createElement('div');
            selected.classList.add('selected')
            selected.innerHTML = 'Select...';
            el = document.createElement('ul');
            el.id = elemtype + '-' + subid + '-' + i;
            el.classList.add('hide');
            if(classes[i].includes('hideselectwrap')) {
              selectwrap.classList.add('hide');
            }
            selectwrap.append(selected); selectwrap.append(el); 
            var array, subarray, index1, index2, index3, labeltext, keys
            if(htmls[i].length > 1 && (htmls[i][0].constructor == Object || htmls[i][0].constructor == Array)) {
              labeltext = htmls[i][1];
              index1 = parseInt(htmls[i][2]);
              index2 = htmls[i][3];
              if(index2 && isNaN(index2) && index2.includes('+')) {
                index3 = parseInt(ann.getPartString(index2,'+',1));
                index2 = parseInt(ann.getPartString(index2,'+',0));
              }
              if(isNaN(index1)) { index1 = 0;}
              if(isNaN(index2)){ index2 = 1;}
            }
            console.log('htmls[i] :', htmls[i]);
            if(htmls[i].constructor == Object) {
              keys = Object.keys(htmls[i]);
              array = ann.json2array(htmls[i])
            } else if(htmls[i][0].constructor == Object) {
              array = ann.json2array(htmls[i][0])
              keys = Object.keys(htmls[i][0]);          
            } else if(htmls[i][0].constructor == Array) {
              array = htmls[i][0]; 
            } else { array = htmls[i] }
           
            for (var x in array) {
              console.log('array :', array[x]);
                let option = document.createElement('li');                
                if(array[x].constructor == Object) {
                  subarray = ann.json2array(array[x])
                  console.log('subarray :', subarray);
                  option.setAttribute('value', subarray[index1]);
                  if(!isNaN(index3)) {
                    option.innerHTML =  subarray[index2] + "&nbsp;" + subarray[index3]; 
                  } else {
                    option.innerHTML =  subarray[index2];
                  }
                } else {
                  if(keys) {               
                    option.setAttribute('value', keys[x]);
                  } else {
                    option.value = (parseInt(x) + 1);
                  }
                
                  option.innerHTML =  array[x];
                  console.log('option :', option);
                }
                el.append(option);
                if(commands[i].startsWith('$')) {
                    elarr[targetparent].append(selectwrap);
                    elarr[targetparent].classList.add('z-top')
                } else if(elarr[elarr.length - 1]) {
                    elarr[elarr.length - 1].append(selectwrap)
                    elarr[elarr.length - 1].classList.add('z-top')
                    // elarr[elarr.length - 1].append(el)
                } else {
                    document.body.append(selectwrap)
                }
            }

            if(labeltext) {

        
              let labelel = document.createElement('label');
              labelel.setAttribute('for', el.id);
              labelel.classList.add('customlabel');
              labeltext = ann.getPartString(labeltext,'_', 1)              
              labelel.innerHTML = labeltext;
              if(labeltext.includes('xlabel')) {
                let par = selectwrap.parentNode;
                par.insertAdjacentHTML('beforebegin', labelel.outerHTML);   
              } else {
                selectwrap.insertAdjacentHTML('beforebegin', labelel.outerHTML);   
              }
            }
            let call = htmls[i][2];
            let par = htmls[i][3];
            let calls = (par) ? [call, par] : call
            ann.createListener(selectwrap, 'mousedown', selecttoggle, calls);
          
            if(classes[i] !== null) { ann.addClasses(el, classes[i]) }

            function selecttoggle(id, e, callback, par) { 
              var select = e.path[1];
              var option = e.path[0];
              var currentevent = option.tagName;
              if(currentevent == 'LI') {
                  selected.innerHTML = option.innerHTML;      
                  selected.setAttribute('value', option.getAttribute('value'))
                  select.classList.add('hide');
                  if(callback && typeof callback === 'function') {
                    console.log('callback :', callback);
                    callback(id, e, par)
                  }
              } else if (currentevent == 'DIV') {
                  option.nextElementSibling.classList.toggle('hide');
              }
            }
            //{_id: ObjectId('6504420672241e79920d5194')}
            subroutineOnLoad(commands, htmls,i,remeberonLoad, lasthtmls);
            return;
        }
        if(elemtype === 'table') {
          tablePrint(name, subid, elarr, elemtype, i, commands, htmls, classes, callbacks, params, onLoad, lasthtmls, flextype,targetparent,depth, elmultiplier)
          subroutineOnLoad(commands, htmls,i,remeberonLoad, lasthtmls);
          return;
      }
        var inputtype, grid, menu, menuul, autoinput,inputwrap
        // depth of loop defined by equal length of arrays
        for(var z = 0; z <= depth; z++) {
            var y = parseInt(i) + parseInt(z);
            var lastindex =  commands[y].lastIndexOf('@');
            var listenertype = commands[y].substring(lastindex + 1);
            if(lastindex === - 1 && callbacks[y]) { listenertype = 'click'}
            autoinput = ((commands[y].includes('_checkbox') && !commands[y].includes('input')) || commands[y].includes('_radio') && !commands[y].includes('input'))
            elemt = getElementTypeFromCommand(commands, y);
            
            if(z > 0 || elemt === 'grid' || elemt === 'menu' || autoinput) {
                elemtype = getElementTypeFromCommand(commands, y);
                if(elemtype === 'grid') {
                      grid = document.createElement(elemtype);
                      grid.classList.add('scrollbar');                
                      elarr[targetparent].append(grid)
                } else if(elemtype === 'menu') {
                    var menubutton = document.createElement('menubutton');
                    var menuclose = document.createElement('menuclose');
                    var menuleft = document.createElement('menuleft');
                    menuleft.classList.add('invert-05');
                    var menuright = document.createElement('menuright');
                    menubutton.id = 'menubutton-' + subid + '-' + y
                    menuleft.id = 'menuleft-' + subid + '-' + y
                    menuright.id = 'menuright-' + subid + '-' + y
                    menuclose.id = 'menuclose-' + subid + '-' + y
                    menuclose.classList.add("hide");
                    menu = document.createElement(elemtype);
                    menu.id = 'menu-' + subid + '-' + y;
                    menu.classList.add("hide");
                  //   menu.classList.add("hide");
                    menuul = document.createElement('ul');
                    if(flextype) { ann.addClasses(menuul, flextype + ' flexalignleft') }
                    // menu.classList.add("slide-up");
                    menu.append(menuul);
                    menu.append(menuclose);                    
                    el = menu;                   
                    elarr[targetparent].append(menubutton);
                    elarr[targetparent].append(menuclose);
                    elarr[targetparent].append(menuleft);
                    elarr[targetparent].append(menuright);
                    elarr[targetparent].append(menu);
                    ann.createListener(menubutton, 'click', menuopen);
                    ann.createListener(menuleft, 'click', navleft);
                    ann.createListener(menuright, 'click', navright);
                    // ann.createListener(menuclose.id, 'click', menuexit);      
                    menuexit()
                
                    async function menuopen(id, e) {
                        ann.toggleSlide(menu.id, 'right')
                        menubutton.classList.add("hide");
                        menuclose.classList.remove("hide");

                    }
                    async function navleft(id, e) {
                      let allnav = menu.querySelectorAll('li')
                      for(let a in allnav){
                        if(parseInt(ann.getPartString(allnav[a].id, '-', 3)) == ann.get.pageIndex) {
                          let previndex = parseInt(a)-1;
                          if(allnav[previndex]){ 
                            ann.onMenuClick(allnav[previndex].id,null,ann.get.menuCallback);                        
                          }
                          break;
                        }
                      }
                    }
                    async function navright(id, e) {
                      let allnav = menu.querySelectorAll('li')
                      for(let a in allnav){
                        if(parseInt(ann.getPartString(allnav[a].id, '-', 3)) == ann.get.pageIndex) {
                          let nextindex = parseInt(a)+1;
                          if(allnav[nextindex]) {
                            ann.onMenuClick(allnav[nextindex].id,null,ann.get.menuCallback);                            
                          }
                          break;
                        }
                      }
                    }
                    async function menuexit() {
         
                        document.addEventListener('click', (event) => {
                 
                            const withinBoundaries = (event.composedPath().includes(menu)) || (event.composedPath().includes(menubutton))
                        //    console.log('withinBoundaries :', event.composedPath());
                            if (!withinBoundaries && event.isTrusted) {
                                menu.classList.add('slide-right')
                                menubutton.classList.remove("hide");
                                menuclose.classList.add("hide");
                            }
                        })
                    }
                } else if (autoinput) {
                    inputwrap = document.createElement(elemtype);
                    elarr[targetparent].append(inputwrap);
                }
            }            
            for (var x in htmls[y]) {
                if(elemtype === 'grid') {
                    let elinput = document.createElement('input');
                    elinput.type = 'radio';
                    elinput.name = elinput.type + '-' + subid + '-' + y;
                    elinput.id = elinput.type + '-' + subid + '-' + y + '-' + x;
                    grid.append(elinput);
                    el = document.createElement('label');
                    el.setAttribute('for', elinput.id)
                    el.innerHTML = htmls[y][x];
                    grid.append(el);
                } else if(elemtype === 'menu') {
                    let li = document.createElement('li');
                    li.innerHTML = htmls[y][x]; 
                    li.classList.add("w-100");
                    menuul.append(li);
                } else if (autoinput) {
                  inputtype = (commands[y].includes('checkbox')) ? 'checkbox' : 'radio'
                    let input = document.createElement('input');
                    ann.addClasses(input, 'hide') 
                    input.type = inputtype; input.id = htmls[y][x]
                    input.name = subid + '-' + inputtype + '-' + y
                    let label = document.createElement('label');  
                    label.innerHTML = htmls[y][x]
                    label.setAttribute('for', input.id)           
                    inputwrap.append(input);inputwrap.append(label);  
                }
                else {
                    el = document.createElement(elemtype);                   
                }
                if(elemtype === 'img') {
                    el.setAttribute('src', htmls[y][x]);
                    el.setAttribute('alt', 'image ' + subid);
                } else if(elemtype === 'info' && typeof htmls[y][x] == 'function') {
                  // Explicit. Skip.      
                } else if(elemtype !== 'menu' && typeof htmls[y][x] !== 'object' && !autoinput) {
                    el.innerHTML = htmls[y][x];                    
                } else if(typeof htmls[y][x] === 'object' && htmls[y][x] instanceof Element) {
                  el.append(htmls[y][x])
                }                
                if(elemtype === 'info') {
                  el.id = elemtype + '-' + subid + '-' + y + '-' + x;    
                  if(classes[y].includes('pager')) {
                    let section = document.createElement('section')
            
                  //  ann.addClasses(section,'dyn-w')
                   // ann.addClasses(section, 'section-wrap')
                    let inner = document.createElement('div')
                    ann.addClasses(inner,'inner dyn-w')

                    section.append(inner)
                    inner.append(el)
                    elarr[targetparent].append(section)    
                 //   console.log("pager", section)
                  } else {
                    elarr[targetparent].append(el)       
                  }                   
                            
                  if(flextype) { ann.addClasses(el, flextype) }
                  if(typeof htmls[y][x] == 'function') {
                      var fcid = await htmls[y][x]();
                      var child = document.getElementById(fcid);
                      var parent = document.getElementById(el.id)                                                       
                      parent.append(child);
                      
                  } 
                } else if (elemtype === 'grid' || elemtype === 'menu' || autoinput) {
                  // Explicit. Skip.
                }
                else if(i==y){              
                    elarr[targetparent].append(el)                    
                 //   console.log('el :', el, el.innerHTML);
                    if(elemtype === 'input') {
                        inputtype = ann.getPartString(commands[y],'input_', 1);
                        el.type = inputtype;
                        el.id = elemtype + '-' + subid + '-' + y + '-' + x;
                        el.name = inputtype + '-' + subid + '-' + y;
                        if(inputtype === 'radio' || inputtype === 'checkbox') {
                            let label = document.createElement('label');
                            label.setAttribute("for", el.id);
                            label.innerHTML = htmls[y][x];
                            elarr[targetparent].append(label);                            
                        }
                    }                
                } else {
                  elarr[targetparent].append(el)  
             //    console.log('elarr[targetparent] :', elarr[targetparent]);
                  console.warn('this condition should not run? el :', el, el.innerHTML);
                }
                let whichel = (elemtype === 'grid') ? grid : (elemtype === 'menu') ? menu : (autoinput) ? inputwrap : el;

                if(classes[y]) { ann.addClasses(whichel, classes[y], elemtype, x) }

                hasevent = (callbacks[y]) ? true : (elemtype === 'menu') ? true : false;

                if(hasevent) {
                    if(elemtype === 'menu') {
                        el.firstChild.children[x].id = elemtype + '-' + subid + '-' + y + '-' + x;                       
                        if(!callbacks[y]) { callbacks[y] = ann.onMenuClick }
                        ann.createListener(el.firstChild.children[x].id, 'click', callbacks[y], params[y]);
                        
                    } else {
                        el.id = elemtype + '-' + subid + '-' + y + '-' + x;                    
                        let calls = (callbacks[y] && callbacks[y][x]) ? callbacks[y][x] : callbacks[y];
                        let pars = (params[y] && params[y][x]) ? params[y][x] : params[y];
                        ann.createListener(el.id, listenertype, calls, pars);   
                                     
                    }                    
                }
            }
        }
        subroutineOnLoad(commands,htmls,i,remeberonLoad,lasthtmls);
    }

    async function verticalPrint(commandsarray, htmlarray, classesarray = [], elarr, subid, hasevents = [],listenertypes = [],callbacks=[], params = [], targetparent, remeberonLoad, ind, lasthtmls) {
    //    console.log('commandsarray :', subid, commandsarray);
        var col_len = htmlarray.length;
        var row_len = htmlarray[0].length;
        var wel, secondclass;
        for (var i = 0; i < row_len; i++) {
            for (var j = 0; j < col_len; j++) {
                if(j === 0) {
                    wel = document.createElement('div');
                  //  console.log('wel :', wel);
                    if(classesarray[j] !== null) { 
                   // console.log('classesarray[j] :', classesarray[j], classesarray[j][i]);
                        secondclass = (typeof classesarray[j] === 'object' && classesarray[j][i]) ?  classesarray[j][i].split("+")[1] : classesarray[j].split("+")[1];
                   //   console.log('secondclass :', secondclass);
                        if(secondclass) {
                          let firstclass;
                          if(typeof classesarray[j] === 'object' && classesarray[j][i]) {
                            firstclass = classesarray[j][i].split("+")[0];
                          } else {
                            firstclass = classesarray[j].split("+")[0];
                          }
                          ann.addClasses(wel, firstclass) 
                         
                        }            
                        //  else if(classesarray[j][i] && wel.classList) {
                        // console.log('classesarray[j][i] :', classesarray[j][i]);
                        //   ann.addClasses(wel, classesarray[j][i]) 
                        // }
                        else {
                            ann.addClasses(wel, classesarray[j]) 
                        }
                      
                        if(classesarray[j][i]) {
                          ann.addClasses(wel, classesarray[j][i]) 
                      //    console.log('wel :', wel);
                        } 
                    }
                    elarr[targetparent].append(wel);
                }
                let elemt = commandsarray[j];
                var el = document.createElement(elemt);
                el.id = elemt + '-' + subid + '-' + j + '-' + i;
                if(elemt === 'img' && htmlarray[j][i]) {
                    el.setAttribute('src', htmlarray[j][i]); 
                    el.setAttribute('alt', 'image ' + subid);
                } 
                 else if(elemt!=='input'){
                    el.innerHTML =  htmlarray[j][i];
                }
              
                if(elemt === 'input') {
                  //     console.log('htmls[j]  :', htmlarray[j] );
                  if(htmlarray[j] && typeof htmlarray[j][i] === 'string' && htmlarray[j][i].includes('label_')) {
                    let labelel = document.createElement('label');
                    labelel.setAttribute('for', el.id);
                    //labelel.classList.add('customlabel');
                    labeltext = ann.getPartString(htmlarray[j][i],'_', 1)
                    labelel.innerHTML = labeltext;
                //    console.log('labelel :', labelel);
                   if(htmlarray[j][i].includes('xlabel_')) {
                     let wrapl = document.createElement('label');
                     wrapl.classList.add('flexitr')
                     wrapl.append(el)
                     wrapl.append(labelel)
                     wel.append(wrapl)
                    } else {
                      wel.append(labelel)
                    }
                 
                  } else {
                    wel.append(el);
                  }
                    if(classesarray[j].includes('radio')) {
                      el.setAttribute('name', 'radio' + elemt + '-' + subid + '-' + j); 
                      el.setAttribute('type', 'radio'); 
                    } else if(classesarray[j].includes('checkbox')) {
                      el.setAttribute('name', 'checkbox' + elemt + '-' + subid + '-' + j); 
                      el.setAttribute('type', 'checkbox'); 
                    }
  
                } else {
                  wel.append(el);
                  
              
                }
                
                if(classesarray[j] !== null) { 
                    if(secondclass && j === 0) {
                        ann.addClasses(el, secondclass) 
                    } else {
                      if(elemt !== 'input') {
                        if(classesarray[j][i]) {
                        //  ann.addClasses(el, classesarray[j][i]) 
                        } else {
                          ann.addClasses(el, classesarray[j]) 
                        }
                        ann.addClasses(el, classesarray[j]) 
                      }
                    }
                } 
             
                if(hasevents[j]) {
                  //  console.log(el,'hasevents[j] :', hasevents[j]);
                
                    
                    ann.createListener(el.id, listenertypes[j], callbacks[j], params[j], i);
                }


                
            }

            if(i == (row_len-1)) {               
              if(remeberonLoad) {
                subroutineOnLoad(commandsarray, htmlarray,ind,remeberonLoad, lasthtmls, true);              
                remeberonLoad = undefined;
              }
            }
        }
                       
  
        ann.get.completedsubs++;
    }

    async function tablePrint(name, subid, elarr, elemtype, i, commands, htmls, classes, callbacks, params, onLoad, lasthtmls, flextype,targetparent,depth, elmultiplier) {
      let table = document.createElement('table');
      let thead = document.createElement('thead');
      let tbody = document.createElement('tbody')
      let tr1 = document.createElement('tr'); 
      table.append(thead)
      table.append(tbody)
      thead.append(tr1)
      let rowindex = 101;
      for(let h in htmls[i]) {       
          let tr = document.createElement('tr'); 
          ann.addClasses(tr,'rel')
          tr.style.zIndex = rowindex--;
          tbody.append(tr);
          for(let t in htmls[i][h]) {
            if(h==0){             
              let th = document.createElement('th');
              if(htmls[i][h][t][0].includes('input')) {              
                let el = createCheckbox(htmls[i][h][t][0])                
                th.append(el)
              } else {
                th.innerHTML = htmls[i][h][t];
              }
              tr1.append(th);
            } else {
              let td = document.createElement('td');
              tr.append(td);
              if(htmls[i][h][t][0] && typeof htmls[i][h][t] === 'object') {                         
                if(htmls[i][h][t][0] === 'select') {
                  createSelect(td, htmls[i][h][t][1], htmls[i][h][t][2])
                } else if(htmls[i][h][t][0].includes('input')) {
                  let el = createCheckbox(htmls[i][h][t][0])                         
                  td.append(el)
                } else if(htmls[i][h][t][0] === "rowspan") {
                  console.log('htmls[i][h][t][0]  :',t, h, htmls[i][h][t][1], htmls[i][h][t][2]);
                  let td2 = document.createElement("td");
                  if(typeof htmls[i][h][t][1] === 'object') {
                    
                    for(let x in htmls[i][h][t][1]) {
                      let el = document.createElement("p");
                      if(x!="undefined") {
                        el.innerHTML = x;
                        td.append(el);
                    
                        let value = htmls[i][h][t][1][x];
                        if (typeof value === "object") {
                          for (let key in value) {
                            let subEl = document.createElement("p");
                            subEl.innerHTML = value[key];
                            td2.append(subEl);
                          }
                        } else {
                          let subEl = document.createElement("p");
                          subEl.innerHTML = value;
                          td2.append(subEl);
                        }
                      }
                    }
                    tr.append(td);                    
                  } else {
                    td2.innerHTML = htmls[i][h][t][1]
                    console.log('htmls[i][h][t][1] :', htmls[i][h][t][1]);
                  }
                  tr.append(td2);
                } else {
                  let el = document.createElement(htmls[i][h][t][0]);
                  //console.log('el :', el);
                  el.innerHTML = htmls[i][h][t][1]
                  td.append(el)
                }              
              }
              else {
                
                td.innerHTML = htmls[i][h][t];               
              }
            }
          }    
        //  console.log(htmls[i][h])
      }
  
      elarr[targetparent].append(table);  
    }
      
    function createCheckbox(inputstring) {
      let inputtype = ann.getPartString(inputstring,'input_', 1);                  
      let el = document.createElement('input');
      el.type = (inputtype) ? inputtype : 'text';
      return el; // console.log('el :', el);
    }
    async function createSelect(parent, array, callback) {
  //   console.log('array :', array);
      var selectwrap = document.createElement('div');
     ann.addClasses(selectwrap, 'selectwrap rel')
      var selected = document.createElement('div');
      selected.classList.add('selected')
      selected.innerHTML = 'Select...';
      let el = document.createElement('ul');
      ann.addClasses(el, 'customselect scrollbar z-top hide')
      selectwrap.append(selected); selectwrap.append(el); 
      let keys = Object.keys(array);
  //    console.log('keys :', keys);
      for (var x in array) {
     //     console.log('array :', array[x], x);
          let option = document.createElement('li');    
          if(keys){
            option.setAttribute('value', x)
          } else {
            option.setAttribute(parseInt(x) + 1)
          }
    //      console.log('option.value :', option.value);
          option.innerHTML =  array[x];
          el.append(option);
          parent.append(selectwrap)
      }
      ann.createListener(selectwrap, 'mousedown', selecttoggle, callback);      

      if(classes[i] !== null) { ann.addClasses(el, classes[i]) }

      function selecttoggle(id, e, callback) {
        var select = e.path[1];
        var option = e.path[0];
        var currentevent = option.tagName;
        if(currentevent == 'LI') {
            selected.innerHTML = option.innerHTML;      
            selected.setAttribute('value', option.getAttribute('value'))
            select.classList.add('hide');
            if(callback) {
              callback(id, e)
            }
        } else if (currentevent == 'DIV') {
            option.nextElementSibling.classList.toggle('hide');
        }
        
      }
    }
    

    async function jsonPrint(subid, array,commands, classes, callbacks, params,elarr, i, targetparent, remeberonLoad) {

          let data = array[0];        
          let keys = array[1];
          let labels = array[2];
          if(keys.length !== labels.length) {
            console.error('Keys and labels arrays must be of the same length');
            return;
          }
          var wrap, wrap2, currentwrap, firstwrap, el, inputtype, prevelemtype;
          var extralinksarr=[];
          var label, setlabel;
          for (let d in data) {
            var elemtype = getElementTypeFromCommand(commands, i);
            var flextype = (commands[i].includes('_x')) ? 'flexitr' : (commands[i].includes('_y')) ? 'flexitc' : undefined;
            var wrapel = document.createElement(elemtype);
            if(flextype) { ann.addClasses(wrapel, flextype) }
            if(classes && !classes[0]) { 
              ann.addClasses(wrapel, classes) 
            }
            elarr[targetparent].append(wrapel);        
            for (let a in keys) {
                let haswrap = ann.getPartString(keys[a],'^', 0);
                let keyel = ann.getPartString(keys[a],'+', 1);
                elemtype = ann.getPartString(keys[a],'#', 1);
                if(elemtype) { elemtype = elemtype.replace(keyel,'').replace('+','').replace('^yx', '').replace('^xy', '').replace('^y', '').replace('^x', '') }
                if(elemtype.includes('input')) { inputtype = ann.getPartString(elemtype,'input_', 1);} else { inputtype = 'text'}
                if (elemtype.includes('input')) { elemtype = 'input' }
                if(!elemtype) { elemtype = 'span'}
                if(!keyel) {
                  console.error('Mising key element, jsonPrint aborted')
                  return;
                }
                el = document.createElement(elemtype);
                if(classes && classes[a]) {
                  ann.addClasses(el, classes[a]) 
                }
                label = (labels[a] === null) ? '' : "<label>" + labels[a] + " </label>";
                if(elemtype === 'input') {
                    el.type = inputtype;
                    el.id = elemtype + '-' + subid + '-' + a + '-' + d;
                    
                    
                    if(inputtype === 'radio' || inputtype === 'checkbox') {
                        let label = document.createElement('label');
                        el.name = elemtype + '-' + subid + '-' + a
                        label.setAttribute("for", el.id);
                        label.innerHTML = data[d][keyel];
                        if(classes[a] === 'moodcolors') {
                          label.style.background = data[d]['hex']
                          label.style.color = data[d]['contrast']
                        } else {
                          ann.addClasses(label, classes[a]) 
                        }       
                        console.log('callbacks[a] :', callbacks);
                        if(callbacks) {                        
                          ann.createListener(el, 'change', callbacks, params);     
                        }
                             
                        wrapel.append(el);   
                        wrapel.append(label);                            
                    } else {
                      ann.addClasses(el, classes[a]) 
                    }
                } else if(elemtype === 'label') {                             
                  if(prevelemtype==='input') {
                      subel.setAttribute('for', el.id)
                  }
                } else if(elemtype === 'img') {
                  el.src = data[d][keyel];
                  el.setAttribute('alt', 'image ' + subid);
                } else if(elemtype === 'a') {
                  let link = data[d][keyel];
                  el.setAttribute('href', '#');
                  if(typeof link === 'object') {
                    for(var l in link) {
                      if(link[l]) {
                        let extrael = document.createElement(elemtype);
                        if(l==0){
                          setlabel = true;
                          el.setAttribute('href', link[l]);
                          el.setAttribute('alt', 'image ' + subid);
                          el.setAttribute('target', '_blank');
                          el.innerHTML = link[l].replace('https://','').replace('http://','');               
                        } else {
                          extrael.innerHTML = link[l].replace('https://','').replace('http://',''); 
                          extrael.setAttribute('href', link[l]);
                          extrael.setAttribute('target', '_blank');
                          extralinksarr.push(extrael);
                        }
                      }                    
                    }
                  } else if(link) {
                    setlabel = true;
                    el.setAttribute('href', link);      
                    el.setAttribute('target', '_blank');
                    el.innerHTML = link.replace('https://','').replace('http://',''); 
                  }
                } else if(keyel === 'country' && data[d][keyel].length === 2) {
                  let cdata = await ann.getCountries();
                  for(var n in cdata) {
                    if(data[d][keyel] === cdata[n].code) {
                      el.innerHTML = label + cdata[n].emoji + "&nbsp;" + cdata[n].name;
                      el.setAttribute('country',cdata[n].code)
                      break;
                    }
                  }
                } else if(keyel === 'created_at' || keyel === 'updated_at' || keyel === 'created_dt' || keyel === 'updated_dt') {
                  let date = new Date(data[d][keyel]).toDateString();
                  el.innerHTML = label + date;
                } else if(keyel.includes('.')){
                  let partkey = data[d][ann.getPartString(keyel, '.',0)];
                  if(partkey) {                   
                    el.innerHTML = label + partkey[ann.getPartString(keyel, '.',1)]                                       
                  }
                } else {
                  el.innerHTML = label + data[d][keyel];
                }
                if(haswrap && haswrap.includes('^')) {
                    wrap = document.createElement('div');  
                    currentwrap = wrap;
                  if(haswrap.startsWith('^xy')) {
                    wrap.classList.add('flexitr');
                    wrap2 = document.createElement('div');                  
                    wrap2.classList.add('flexitc');
                    currentwrap = wrap2;
                    firstwrap = wrap;
                  } else if(haswrap.startsWith('^yx')) {
                    wrap.classList.add('flexitc');
                    wrap2 = document.createElement('div');
                    wrap2.classList.add('flexitr');
                    currentwrap = wrap2;
                    firstwrap = wrap;
                  } else if(haswrap.startsWith('^x')) {
                    wrap.classList.add('flexitc');
                  } else if (haswrap.startsWith('^y')) {
                    wrap.classList.add('flexitc');
                  } else {}
                } else {
                  currentwrap = wrapel;
                }
                if(inputtype !== 'radio' && inputtype !== 'checkbox') {
                  if(wrap && wrap2) {
                    wrapel.append(wrap);
                    wrap.append(wrap2);
                    wrap2.append(el);  
                    appendLinks(extralinksarr, wrap2, el, a)
                  } else if(wrap) {
                    firstwrap.append(wrap);
                    wrap.append(el);
                    appendLinks(extralinksarr, wrap, el, a)
                  } else if(currentwrap) {
                    currentwrap.append(el);
                    appendLinks(extralinksarr, currentwrap, el, a)
                  }
                }
                inputtype = null;
                wrap = null; wrap2 = null;
            }
          }
          function appendLinks(arr, parent, el, a) {
            if(setlabel && label) {
              
              el.insertAdjacentHTML('beforebegin', label);
              el.previousSibling.classList.add('alabel')
              setlabel = false;
            }
            if(arr[0]) {
              for(var z in arr) {
                parent.append(arr[z])
                ann.addClasses(arr[z], classes[a]) 
              }
            }
            extralinksarr=[];                       
          }
          // el.innerHTML = htmls[y][x]['pub'];
          // continue;
          if(remeberonLoad){
            ann.executeFunctionByName(remeberonLoad)
            remeberonLoad = undefined;
          }
          ann.get.completedsubs++;
    }

    async function multiArrayPrint(subid, array,commands, classes, callbacks, params,elarr, i, targetparent, remeberonLoad) {
      var elemtype,inputtype,wrap;
      var target = (commands[0].startsWith('$')) ? parseInt(commands[0].split("_")[0].replace('$', '')) - 1 : i - 1;
      var parent = elarr[target];
      var els = []
      for (var a = 0; a < array.length; a++) {
          wrap = document.createElement(array[a][0])
          parent.append(wrap)             
          for (var b = 1; b < array[a].length; b++) {                            
            for (var c = 0; c < commands.length; c++) {                    
              elemtype = getElementTypeFromCommand(commands, c)
              let subel = document.createElement(elemtype) 
              subel.id = elemtype + '-' + subid + '-' + a + '-' + b;            
              if(elemtype === 'label') {
                let prevelemtype;
                try {prevelemtype = getElementTypeFromCommand(commands, (c-1))} catch{}
                if(prevelemtype==='input'){
                    subel.setAttribute('for', subel.id)
                }
              }           
              els.push(subel)
              if(elemtype === 'input') { inputtype = ann.getPartString(commands[c],'input_', 1); subel.type = inputtype } else { inputtype = 'text'}
              ann.addClasses(subel,classes[c])
              if(c===0){ wrap.append(subel) } else {
                target = (commands[c].startsWith('$')) ? parseInt(commands[c].split("_")[0].replace('$', '')) - 1 : c - 1;
                (els[target]) ? els[target].append(subel) : null
                if(els.length === commands.length) {
                  els = []
                }
              }                             
            }

          }
      }
    }
    async function multiArrayPrint2(name, subid, array,commands, classes, callbacks, params,elarr, i, targetparent, remeberonLoad) {
      var elemtype,inputtype,wrap,subel
      var target = (commands[0].startsWith('$')) ? parseInt(commands[0].split("_")[0].replace('$', '')) - 1 : i - 1;
      var parent = elarr[target];
      var els = []
          
      for (var a = 0; a < array.length; a++) {        
          if(a === 0) {
            wrap = document.createElement(array[a])
            parent.append(wrap) 
          } else {
            for (var c = 0; c < commands.length; c++) {                    
              elemtype = getElementTypeFromCommand(commands, c)
              subel = document.createElement(elemtype)
              if(elemtype === 'input') { 
               // console.log('classes[c] :', classes[c]);
                if((classes[0][c] && classes[0][c].includes('radio')) || (classes[c] && classes[c].includes('radio'))) { 
                  subel.type = 'radio'; subel.setAttribute('name', 'radio' + subid + '-' + name)} else {            
                inputtype = ann.getPartString(commands[c],'input_', 1); subel.type = inputtype }
                subel.id = ann.crc32((name + '-' + array[0].replace(ann.get.regex1,'_') + '-' + array[a][0].replace(ann.get.regex1,'_')));
              } else { inputtype = 'text'}
              if(elemtype === 'label') {
                let prevelemtype;
                try {prevelemtype = getElementTypeFromCommand(commands, (c-1))} catch{}
                if(prevelemtype==='input'){
                    subel.setAttribute('for', els[els.length - 1].id)
                  // console.log('array[a][0] :', array[0], array[a][0]);
                }
              }  
              els.push(subel)
              if(classes[0][c]) { ann.addClasses(subel,classes[0][c])} else {ann.addClasses(subel,classes[c]) }
              let hasarraycontent = (classes[c] && classes[c].includes('arraycontent')) ? true : false;
              if(hasarraycontent || (classes[0][c] && classes[0][c].includes('arraycontent'))) {
                subel.innerHTML = array[a][0]
                subel.setAttribute('name',array[a][0].replace(ann.get.regex1,'_'));
              }            
              if(c===0){ wrap.append(subel) } else {
                target = (commands[c].startsWith('$')) ? parseInt(commands[c].split("_")[0].replace('$', '')) - 1 : c - 1;
                (els[target]) ? els[target].append(subel) : null                
                if(els.length === commands.length) {
                  els = []
                }
                let hasevent = (callbacks && callbacks[c]) ? true : false;
                if(hasevent) {
                  if(!Array.isArray(callbacks[c])) {      
                    let lastindex =  commands[c].lastIndexOf('@');
                    let listenertype = commands[c].substring(lastindex + 1)
                    if(lastindex === - 1 && callbacks[c]) {listenertype = 'click'}                                  
                    ann.createListener(subel, listenertype, callbacks[c], params[c]);                        
                  } else if(callbacks[0][c]) {
                    let lastindex =  commands[0][c].lastIndexOf('@');
                    let listenertype = commands[0][c].substring(lastindex + 1)
                    if(lastindex === - 1 && callbacks[0][c]) {listenertype = 'click'}  
                    let par = (params && params[0][c]) ? params[0][c] : null
                    ann.createListener(subel, listenertype, callbacks[0][c], par);    
                  }
                }
               
              }                                
            }
            if(array[a][1][0]) {
              var containername, innerel,subwrap, sel;
              let innerels = [];
              for (var b = 0; b < array[a].length; b++) {
                if(b === 0) { containername = array[a][b].replace(ann.get.regex1,'_');
            //    console.log('containername :', containername);
                    subwrap = document.createElement('div')
                    ann.addClasses(subwrap, 'ccontent ' + containername)
                    sel = document.querySelector(name + " [name='"+containername+"']").parentElement;
                   // console.log('sel :', sel);
                    sel.append(subwrap) 
                  //  console.log('sel :', sel);
                  } else {
                  for (var d = 0; d < array[a][b].length; d++) {                    
                    for (var c = 0; c < commands.length; c++) {
                      elemtype = getElementTypeFromCommand(commands, c)
                      innerel = document.createElement(elemtype)

                      if(elemtype === 'input') { 
                        if((classes[1][c] && classes[1][c].includes('radio'))) { 
                          innerel.type = 'radio'; innerel.setAttribute('name', 'radio' + subid + '-' + a + '-' + name)} else {           
                          inputtype = ann.getPartString(commands[c],'input_', 1); innerel.type = inputtype 
                          }
                        innerel.id = ann.crc32((name + '-' + array[0].replace(ann.get.regex1,'_') + '-'+ containername + '-'+ array[a][b][d].replace(ann.get.regex1,'_')));  
                      }
                      else { inputtype = 'text'}
                      if(elemtype === 'label') {
                        let prevelemtype;
                        try {prevelemtype = getElementTypeFromCommand(commands, (c-1))} catch{}
                        if(prevelemtype==='input'){
                          innerel.setAttribute('for', innerels[innerels.length - 1].id)
                          // console.log('array[a][0] :', array[0], array[a][0]);
                        }
                      }  
                      innerels.push(innerel)
                      if(classes[1][c]) { ann.addClasses(innerel,classes[1][c])} else {ann.addClasses(innerel,classes[c]) }
                      let hasarraycontent = (classes[c] && classes[c].includes('arraycontent')) ? true : false;
                      if(hasarraycontent || (classes[1][c] && classes[1][c].includes('arraycontent'))) {
                        innerel.innerHTML = array[a][b][d];
                        let innername = containername + '-' + array[a][b][d].replace(ann.get.regex1,'_');
                        innerel.setAttribute('name',innername);
                      }            
                      if(c===0){ subwrap.append(innerel) } else {
                        target = (commands[c].startsWith('$')) ? parseInt(commands[c].split("_")[0].replace('$', '')) - 1 : c - 1;
                        (innerels[target]) ? innerels[target].append(innerel) : null
                        if(innerels.length === commands.length) {
                          innerels = []
                        }
                      let hasevent = (callbacks && callbacks[c]) ? true : false;
                      if(hasevent) {                                                
                        if(!Array.isArray(callbacks[c])) {                       
                          let lastindex =  commands[c].lastIndexOf('@');
                          let listenertype = commands[c].substring(lastindex + 1)
                          if(lastindex === - 1 && callbacks[c]) {listenertype = 'click'}                                  
                          ann.createListener(innerel, listenertype, callbacks[c], params[c]);                        
                        } else if(callbacks[1][c]) {
                       //   ann.colorLog('hasevent2 :' + subel, 'success');  
                          let lastindex =  commands[1][c].lastIndexOf('@');
                          let listenertype = commands[1][c].substring(lastindex + 1)
                          if(lastindex === - 1 && callbacks[1][c]) {listenertype = 'click'}  
                          let par = (params && params[1][c]) ? params[1][c] : null
                          ann.createListener(innerel, listenertype, callbacks[1][c], par);    
                        }
                      }
                    }
                  }
                }
              }
            }  
          }
        }
      }      
    }

    ann.colorLog = function colorLog(message, color) {

      color = color || "black";
  
      switch (color) {
          case "success":  
               color = "Green"; 
               break;
          case "info":     
                  color = "DodgerBlue";  
               break;
          case "error":   
               color = "Red";     
               break;
          case "warning":  
               color = "Orange";   
               break;
          default: 
               color = color;
      }
  
      console.log("%c" + message, "color:" + color);
  }

    async function subroutineOnLoad(commands,htmls, i,remeberonLoad, lasthtmls, vertical = false) {
     // console.log('triggeredby :', vertical);

   //     console.log('commands,htmls, lasthtmls :',remeberonLoad, htmls, lasthtmls);
        if((lasthtmls == htmls[i] && remeberonLoad) || (vertical && remeberonLoad)) {
     //     console.log('htmls,remeberonLoad, lasthtmls :',htmls[i],remeberonLoad, lasthtmls);
            ann.executeFunctionByName(remeberonLoad)
            remeberonLoad = undefined;
        }
    }
    if(onLoad && !remeberonLoad) {
            ann.executeFunctionByName(onLoad)        
            onLoad = undefined;
    }

    if(childsub) {
        let parentarr = elarr;
        var mainsub = document.getElementById(returnid) 
        if(childsub[0]) {
          for(var c in childsub) {
            let childsubid = await childsub[c](childparams);                  
            let subsub = document.getElementById(childsubid)
            
            if(subsub) {
              let targetindex = subsub.getAttribute('subparent')         
              if(targetindex) {
                parentarr[targetindex].append(subsub);              
              } else {
                mainsub.append(subsub);
              }
            } else (console.warn('Childsub DOM expected but not found. Did you return the child Subroutine?'))
          }
        } else {
          let childsubid = await childsub(childparams);                                     
          let subsub = document.getElementById(childsubid)
          
          if(subsub) {
            let targetindex = subsub.getAttribute('subparent')         
            if(targetindex) {
              parentarr[targetindex].append(subsub);
              
            } else {
              mainsub.append(subsub);
            }
          } else (console.warn('Childsub DOM expected but not found. Did you return the child Subroutine?'))
        }
        childsub = null;
    }

    ann.get.completedsubs++;
    return returnid;
}

ann.generateRandomString = function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

ann.sha256 = async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);                    

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string                  
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

window.sha256 = ann.sha256

ann.MD5 = function MD5(e) {
  function h(a, b) {
      var c, d, e, f, g;
      e = a & 2147483648;
      f = b & 2147483648;
      c = a & 1073741824;
      d = b & 1073741824;
      g = (a & 1073741823) + (b & 1073741823);
      return c & d ? g ^ 2147483648 ^ e ^ f : c | d ? g & 1073741824 ? g ^ 3221225472 ^ e ^ f : g ^ 1073741824 ^ e ^ f : g ^ e ^ f
  }

  function k(a, b, c, d, e, f, g) {
      a = h(a, h(h(b & c | ~b & d, e), g));
      return h(a << f | a >>> 32 - f, b)
  }

  function l(a, b, c, d, e, f, g) {
      a = h(a, h(h(b & d | c & ~d, e), g));
      return h(a << f | a >>> 32 - f, b)
  }

  function m(a, b, d, c, e, f, g) {
      a = h(a, h(h(b ^ d ^ c, e), g));
      return h(a << f | a >>> 32 - f, b)
  }

  function n(a, b, d, c, e, f, g) {
      a = h(a, h(h(d ^ (b | ~c), e), g));
      return h(a << f | a >>> 32 - f, b)
  }

  function p(a) {
      var b = "",
          d = "",
          c;
      for (c = 0; 3 >= c; c++) d = a >>> 8 * c & 255, d = "0" + d.toString(16), b += d.substr(d.length - 2, 2);
      return b
  }
  var f = [],
      q, r, s, t, a, b, c, d;
  e = function(a) {
      a = a.replace(/\r\n/g, "\n");
      for (var b = "", d = 0; d < a.length; d++) {
          var c = a.charCodeAt(d);
          128 > c ? b += String.fromCharCode(c) : (127 < c && 2048 > c ? b += String.fromCharCode(c >> 6 | 192) : (b += String.fromCharCode(c >> 12 | 224), b += String.fromCharCode(c >> 6 & 63 | 128)), b += String.fromCharCode(c & 63 | 128))
      }
      return b
  }(e);
  f = function(b) {
      var a, c = b.length;
      a = c + 8;
      for (var d = 16 * ((a - a % 64) / 64 + 1), e = Array(d - 1), f = 0, g = 0; g < c;) a = (g - g % 4) / 4, f = g % 4 * 8, e[a] |= b.charCodeAt(g) << f, g++;
      a = (g - g % 4) / 4;
      e[a] |= 128 << g % 4 * 8;
      e[d - 2] = c << 3;
      e[d - 1] = c >>> 29;
      return e
  }(e);
  a = 1732584193;
  b = 4023233417;
  c = 2562383102;
  d = 271733878;
  for (e = 0; e < f.length; e += 16) q = a, r = b, s = c, t = d, a = k(a, b, c, d, f[e + 0], 7, 3614090360), d = k(d, a, b, c, f[e + 1], 12, 3905402710), c = k(c, d, a, b, f[e + 2], 17, 606105819), b = k(b, c, d, a, f[e + 3], 22, 3250441966), a = k(a, b, c, d, f[e + 4], 7, 4118548399), d = k(d, a, b, c, f[e + 5], 12, 1200080426), c = k(c, d, a, b, f[e + 6], 17, 2821735955), b = k(b, c, d, a, f[e + 7], 22, 4249261313), a = k(a, b, c, d, f[e + 8], 7, 1770035416), d = k(d, a, b, c, f[e + 9], 12, 2336552879), c = k(c, d, a, b, f[e + 10], 17, 4294925233), b = k(b, c, d, a, f[e + 11], 22, 2304563134), a = k(a, b, c, d, f[e + 12], 7, 1804603682), d = k(d, a, b, c, f[e + 13], 12, 4254626195), c = k(c, d, a, b, f[e + 14], 17, 2792965006), b = k(b, c, d, a, f[e + 15], 22, 1236535329), a = l(a, b, c, d, f[e + 1], 5, 4129170786), d = l(d, a, b, c, f[e + 6], 9, 3225465664), c = l(c, d, a, b, f[e + 11], 14, 643717713), b = l(b, c, d, a, f[e + 0], 20, 3921069994), a = l(a, b, c, d, f[e + 5], 5, 3593408605), d = l(d, a, b, c, f[e + 10], 9, 38016083), c = l(c, d, a, b, f[e + 15], 14, 3634488961), b = l(b, c, d, a, f[e + 4], 20, 3889429448), a = l(a, b, c, d, f[e + 9], 5, 568446438), d = l(d, a, b, c, f[e + 14], 9, 3275163606), c = l(c, d, a, b, f[e + 3], 14, 4107603335), b = l(b, c, d, a, f[e + 8], 20, 1163531501), a = l(a, b, c, d, f[e + 13], 5, 2850285829), d = l(d, a, b, c, f[e + 2], 9, 4243563512), c = l(c, d, a, b, f[e + 7], 14, 1735328473), b = l(b, c, d, a, f[e + 12], 20, 2368359562), a = m(a, b, c, d, f[e + 5], 4, 4294588738), d = m(d, a, b, c, f[e + 8], 11, 2272392833), c = m(c, d, a, b, f[e + 11], 16, 1839030562), b = m(b, c, d, a, f[e + 14], 23, 4259657740), a = m(a, b, c, d, f[e + 1], 4, 2763975236), d = m(d, a, b, c, f[e + 4], 11, 1272893353), c = m(c, d, a, b, f[e + 7], 16, 4139469664), b = m(b, c, d, a, f[e + 10], 23, 3200236656), a = m(a, b, c, d, f[e + 13], 4, 681279174), d = m(d, a, b, c, f[e + 0], 11, 3936430074), c = m(c, d, a, b, f[e + 3], 16, 3572445317), b = m(b, c, d, a, f[e + 6], 23, 76029189), a = m(a, b, c, d, f[e + 9], 4, 3654602809), d = m(d, a, b, c, f[e + 12], 11, 3873151461), c = m(c, d, a, b, f[e + 15], 16, 530742520), b = m(b, c, d, a, f[e + 2], 23, 3299628645), a = n(a, b, c, d, f[e + 0], 6, 4096336452), d = n(d, a, b, c, f[e + 7], 10, 1126891415), c = n(c, d, a, b, f[e + 14], 15, 2878612391), b = n(b, c, d, a, f[e + 5], 21, 4237533241), a = n(a, b, c, d, f[e + 12], 6, 1700485571), d = n(d, a, b, c, f[e + 3], 10, 2399980690), c = n(c, d, a, b, f[e + 10], 15, 4293915773), b = n(b, c, d, a, f[e + 1], 21, 2240044497), a = n(a, b, c, d, f[e + 8], 6, 1873313359), d = n(d, a, b, c, f[e + 15], 10, 4264355552), c = n(c, d, a, b, f[e + 6], 15, 2734768916), b = n(b, c, d, a, f[e + 13], 21, 1309151649), a = n(a, b, c, d, f[e + 4], 6, 4149444226), d = n(d, a, b, c, f[e + 11], 10, 3174756917), c = n(c, d, a, b, f[e + 2], 15, 718787259), b = n(b, c, d, a, f[e + 9], 21, 3951481745), a = h(a, q), b = h(b, r), c = h(c, s), d = h(d, t);
  return (p(a) + p(b) + p(c) + p(d)).toLowerCase()
};
window.MD5 = ann.MD5
ann.crc32=function(r){for(var a,o=[],c=0;c<256;c++){a=c;for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;o[c]=a}for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r.charCodeAt(t))];return(-1^n)>>>0};
window.crc32 = ann.crc32

ann.generateUniqueString = function generateUniqueString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

ann.isValidHttpUrl = function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

ann.stringOccurrences = function stringOccurrences(string, subString, allowOverlapping) {

  string += "";
  subString += "";
  if (subString.length <= 0) return (string.length + 1);

  var n = 0,
      pos = 0,
      step = allowOverlapping ? 1 : subString.length;

  while (true) {
      pos = string.indexOf(subString, pos);
      if (pos >= 0) {
          ++n;
          pos += step;
      } else break;
  }
  return n;
}
ann.exists = function exists(arr, search) {
  return arr.some(row => row.includes(search));
}
ann.sortJson = function sortJson(data, key) {
  data.sort(function (a, b) {
    return a[key].localeCompare(b[key]);
  });
}

ann.localDateTimeFromEpoch = function localDateTimeFromEpoch(timestamp) {
  const date = new Date(timestamp * 1000);
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',hour12: false };
  const currentLocale = navigator.language || navigator.userLanguage;
  return date.toLocaleString(currentLocale, options);
}

ann.doesImageExist = doesImageExist = (url) =>
  new Promise((resolve) => {
    const img = new Image();

    img.src = url;
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });

if(ann.get.hasDynResolution) {
  window.addEventListener('resize', function(e){
    ann.applyResolution();
    if(ann.cl.onresize.callback) {
      ann.cl.onresize.callback(e)      
    }
  }); 
}

ann.isElementInViewport = function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();
  return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

ann.ip4 = async function ip4() {
  return fetch('https://ipv4.ipleak.net/json')
      .then(response => response.json())
      .then(data => {return data })
      .catch(error => console.error('Error fetching IPv4:', error));
  }
ann.ip6 = async function ip6() {
  return fetch('https://ipv6.ipleak.net/json')
      .then(response => response.json())
      .then(data => { return data })
      .catch(error => console.error('Error fetching IPv6:', error));
  }
ann.ipLeak = async function ipLeak() {
  
    try {
      const randomHash = [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      console.log(randomHash);
  
      let url = 'https://' + randomHash + '.ipleak.net/dnsdetection/';
      let resp = await fetch(url)
        if (!resp.ok) {
          return false;
        }
        let data = await resp.json();
        if(data) {
          var arr = [];
          const ips = Object.keys(data.ip);
          for(let i=0; i<2;i++) {
            let response = await fetch('https://ipleak.net/json/'+ips[i]);                
            if (!response.ok) {
              continue;
            }
            arr[i] = await response.json();
          }
          return arr;
        }
    } catch(e) {
      if(ann.keep.loader && ann.keep.loader.parentElement) { ann.show(ann.keep.loader.parentElement, false) }
    }
      
  };
// Each widget must contain 1 js file, 1 css file and both must be inside same subfolder which must match the name of both files. 
// e.g. mywidget/mywidget.js mywidget/mywidget.css
// Any additional files must be loaded by the widget's main js file.
// The widget's function must be of the same name as the widget name, prefixed with a namespace. Default is 'ann.iam.'
// If the widget has as onload function it also must be of the same name, prefixed with "ann.cl.onload." namespace.
// The widgets folder is assumed to be located in the root of the public folder, a custom path may be passed in argument.
// When loading widgets via main Sub (use 'widgets' command and pass names of widgets into the HTML array), 
// default parent is assumed as specified in the main Sub that calls the widgets. If we want to override this parent
// we have two options...

// For example...
// 1: let widgets = [['widget1','childwidget1'],['widget2',['childwidget2', 'childwidget3','childwidget3']],'widget3'] 
// at widgets[0][0],  widgets[1][0], and  widgets[2] are a parent widgets, each of the parent widgets will be appended to the parent
// specified in the main sub. At widgets[0][1], widgets[1][1] are child widgets, each of them will be appended to its particular parent widget
// specified at widgets[0][0] widgets[1][0] using the parent widget's first DOM object
// 2: If we want to append a child widget into a parent widget at deeper level inside its DOM tree, e.g. the fourth DOM object specified 
// in the Sub of the parent widget, we do so by assigning a unique class (e.g. 'childwidget2parent' (widget name + parent))
 // to the particular DOM object of the parent widget. (that's it, magic)
ann.widgetLoader = async function widgetLoader(nameorarray, parent, path = 'widgets', namespace = "ann.iam.") {

    var p = path, n = namespace;
    if(!nameorarray) { console.error("Missing argument. What's the name of the widget you're loading?")}

    if(Array.isArray(nameorarray) && Array.isArray(nameorarray[1])) {
        let par = await loadWidget(nameorarray[0], parent)
        for(var x in nameorarray[1]) {
          loadWidget(nameorarray[1][x], par)
        }        
    } else if(Array.isArray(nameorarray) &&  nameorarray[1] && !Array.isArray(nameorarray[1])) {
          let par = await loadWidget(nameorarray[0], parent)
          loadWidget(nameorarray[1], par)
    } else {
          loadWidget(nameorarray, parent)
    }

    async function loadWidget(name, par, path = p, namespace = n) {
      let folder = path + '/' + name;
      let js = name + '.js';
      let css = folder + '/' + name + '.css';
      let scripts = [js];
      const loader = new ann.ScriptLoader({ folder: folder, src: scripts})
      loader.load();
      ann.addStyleSheet(css)
      let fc = namespace + name;
      let id = await ann.executeFunctionByName(fc)
    //  console.log('id :', id,fc);
      if(!id) {
     //   console.warn('Widget ' + name  + " returned no id and failed to load, retrying.")
        let timer = Date.now()
        while(!id) {
          await ann.sleep(100);
          id = await ann.executeFunctionByName(fc)
          if(id) { break;}
          ann.colorLog('Waiting max 10s for widget ' + name + ' Does the widget return a Subroutine or its ID?', 'error')
          if((Date.now() - timer) >= ann.get.failsafetimeout) {
              if(ann.get.failsafetimeout > 0) {
                location.reload();
              } else { break; }
          }
        }
        ann.colorLog('Widget ' + name + ' has loaded', 'success')
      }
      let dom = document.getElementById(id)

      let trytargetclass = "." + name + 'parent'
      let overrideparent = document.querySelector(trytargetclass)
  
      if(overrideparent) {
        overrideparent.append(dom)
      } else if(par) { par.append(dom) } else {
        document.body.append(dom)
        ann.colorLog('Widget ' + name  + " has no parent and was appended to body", 'error')
      }
      // if(hasonload) {  //trying onload anyway
        let fconload = "ann.cl.onload." + name
       // console.log('fconload :', fconload);
        ann.executeFunctionByName(fconload)
 //     }
      ann.get.completedsubs++;
      return dom;
  }
}


ann.addStyleSheet = async function addStyleSheet(source) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = source;
  link.type = 'text/css';
  var toplink = document.getElementsByTagName('link')[0];
  toplink.parentNode.insertBefore(link, toplink);
}

ann.getCSSProp = (propName, element = document.documentElement) => getComputedStyle(element).getPropertyValue(propName);
ann.setCSSProp = (propName, value, element = document.documentElement) => element.style.setProperty(propName, value);

ann.applyResolution = async function applyResolution() {
  let vh = (window.innerHeight - 30) * 0.01;
  ann.setCSSProp('--vh', `${vh}px`);
  let vw = (window.innerWidth - 20) * 0.01;
  ann.setCSSProp('--vw', `${vw}px`);
}
ann.require3 = async function require3(selector, getall = false, timeout = 3000, reload = false) {
 
  var start = Date.now();
  var objs = selector;
  return await foo();

  async function foo(obj = objs) {
    var o = document.querySelector(selector)
    if(!o){
      await ann.sleep(100)
      if (timeout && (Date.now() - start) >= timeout && reload) {
         location.reload();

        return;
      } else if (timeout && (Date.now() - start) >= timeout) {
        console.error('selector '+ selector + ' failed to load' )
        return;
      }
      foo(selector);
    }
    else {
      // if(callback) {
      //   callback()
      // }
      return o;
    }
  }
}
// Require dom
ann.require = async function require(selector, getall = false) {
  return new Promise(resolve => {
 // console.log('resolve :', selector, resolve);
    if (document.querySelector(selector)) {
      if(getall) {
        return resolve(document.querySelectorAll(selector));
      }
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
        if (document.querySelector(selector)) {
            if(getall) {
              resolve(document.querySelectorAll(selector));
            }
            resolve(document.querySelector(selector));
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
      });
  });
}

ann.waitForElement = async function waitForElement(selector, targettag, classList) {
  let outro = document.querySelector(selector)
  async function foo(b = outro) {
      let s = b.closest(targettag)
     // console.log('s :', s);
      return s
  }
  let s = await foo()
  while(!s) {
      await ann.sleep(100)
      s = await foo();
  }
  ann.addClasses(s,classList)    
}

// Require object
ann.requireObject = async function requireObject(object, timeout = 3000, reload = false) {
console.log('object :', object);

  var target = object;
  var start = Date.now();
  var callback = callback;
  var loader = document.querySelector('.loader')
  if(loader && loader.parentElement) { loader = loader.parentElement }
  return await new Promise(waitForFoo);

  async function waitForFoo(resolve, reject) {
      if (target) {
          resolve(target);
          if(loader) ann.show(loader, false);
      }
      else if (timeout && (Date.now() - start) >= timeout) {
        reject(new Error("timeout"));          
        if(reload) {
         location.reload();
        }
      }
      else {        
        if(loader) ann.show(loader)
        setTimeout(waitForFoo.bind(this, resolve, reject), 100);
      }
          
  }
}
// This seems a more reliable way to wait for an object, use instead requireObject
ann.evalObject = async function evalObject(objectstring, callback, reload = false, timeout = 1000) {
 
  var start = Date.now();
  var objs = objectstring;
  return foo();
  async function foo(obj = objs) {
    var o = eval(obj)
    if(!o){
      await ann.sleep(100)
      if (timeout && (Date.now() - start) >= timeout && reload) {
        location.reload();
        return;
      } else if (timeout && (Date.now() - start) >= timeout) {
        return;
      }
      foo(objectstring,callback, reload, timeout);
     // console.log('objectstring,callback, reload, timeout :', objectstring,callback, reload, timeout);
    }
    else {
      if(callback) {
        callback()
      }
      return o;
    }
  }
}

ann.waitForGlobal = function waitForGlobal(key, callback) {
    if (window[key]) {
        callback();
    } else {
        setTimeout(function() {
        waitForGlobal(key, callback);
        }, 100);
    }
};     

// javascript extras
// counts occurences of specific character
// commands[i].count("!") === 0
String.prototype.count=function(c) { 
    var result = 0, i = 0;
    for(i;i<this.length;i++)if(this[i]==c)result++;
    return result;
  };

ann.ScriptLoader = class ScriptLoader {
    constructor (options) {
      const { folder, src } = options
      this.folder = folder
      this.src = src
      this.script;
      this.trigger = false;
      
    }
    async loadScripts () {
        var folder = this.folder;
        var srcarr = this.src;
        for(var src in srcarr) {              
                new Promise((resolve, reject) => {

                const script = document.createElement('script')
                script.type = 'text/javascript'
                script.id = srcarr[src].split(/(\\|\/)/g).pop();
                script.async = true
                if(srcarr[src] && srcarr[src].includes("://")) {
                  script.src = srcarr[src];
                } else {
                  script.src = folder + '/' + srcarr[src];  
                }

                const el = document.getElementsByTagName('script')[0]
                el.parentNode.insertBefore(script, el)

                script.addEventListener('load', () => {
                  resolve(script)
                  resolve(window[script.id.replace('.js','')]);    
                })
                script.addEventListener('error', () => {
                  // reject(new Error(`${srcarr[src]} failed to load.`))
                })
            })
        } 
    }
  
    async load () {
      return new Promise(async (resolve, reject) => {
          try { 
            await this.loadScripts();    
          } catch (e) {
            reject(e)
          }
      })
    }
}
ann.getMenuID = function getMenuID() {
  if(!ann.get.menuid) { ann.get.menuid = document.querySelector('menu').id }
  return ann.get.menuid;
}

ann.isVisible = function isVisible(elorid) {
  var el = ann.getEl(elorid);
  if (typeof el === 'object') {     
      let isVis = (!el.classList.contains('hide') && !el.classList.contains('slide-up') && !el.classList.contains('slide-down') && 
      !el.classList.contains('slide-left') && !el.classList.contains('slide-left-center') && !el.classList.contains('slide-right') 
      && !el.classList.contains('fadeOut') && (window.getComputedStyle(el, null).display != 'none') && el.style.display != 'none')
   //   console.log('isVis :',elorid, el.style.display, window.getComputedStyle(el, null).display, isVis);
      return isVis

  } else {
      console.error('ann.isVisible function requires element parameter.')
  }
}

// https://dmitripavlutin.com/javascript-fetch-async-await/
ann.fetch = async function fetchUrl(url, dataset, method = 'GET', content = "application/json") {

    var token = localStorage.getItem('api-token');
    var csrf = (document.querySelector('meta[name=csrf-token]')) ? document.querySelector('meta[name=csrf-token]').content : null;
    if(token){ token = token.valueOf()}
    if(url) {
        const response = await fetch(url, {
        method: method,
        headers: {
        //   "Content-type": "application/x-www-form-urlencoded"  
            "Authorization": "Bearer " + token,
            "X-CSRF-TOKEN": csrf,
            "Accept": content,
            "Content-Type": content,
        },  
        body: JSON.stringify(dataset),
         
        })
       // console.log('response :', response);
        if (!response.ok) {

            if(response.status == '419') {
            //  await ann.modal("TIMEOUT",'Your session has expired due to inactivity and will be reloaded.',1);
           //   console.error('419')
              location.reload(); 
              return;
            }
            const message = `An error has occured: ${response.status}`;            
            ann.modal('SERVER ERROR',message + ' Please try again.',1);
            throw new Error(message);
        }
        const contentType = response.headers.get('content-type');

    //    console.log('contentType :', contentType);
        if(contentType == 'application/json') {
          return await response.json();    
        } else if(contentType == 'application/zip' || contentType == 'application/text') {          
            const blob = await response.blob(); // Await the response.blob() method
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const disposition = response.headers.get('content-disposition');
            const fileName = disposition.split(';')[1].trim().split('=')[1].replace(/"/g, '');
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            return response;
        }
         else {
          return await response;
        }
    }
}

ann.fetch().catch(error => {
});


// Create a session cookie that expires in 10 minutes
ann.createSession = function createSession(password, minutes) {

  const expiryTime = new Date().getTime() + minutes * 60 * 1000;

  const sessionData = {
    password: password,
    expiryTime: expiryTime,
  };

  sessionStorage.setItem('authorized', JSON.stringify(sessionData));
}

ann.checkSession = function checkSession() {
  const sessionData = sessionStorage.getItem('authorized');
  //console.log('sessionData :', sessionData);

  if (sessionData) {
    const { password, expiryTime } = JSON.parse(sessionData);
    // console.log('new Date().getTime() :', new Date().getTime(), expiryTime);
    // console.log('password :', password);
    if (new Date().getTime() < expiryTime) {    
      return password;
    } else {
      console.log('authorized removed :');
      sessionStorage.removeItem('authorized');
    }
  }

  return null;
}


ann.toggleSlide = function toggleSlide(elorid, direction = 'up', timeout = 500) {
    
  var el = ann.getEl(elorid);

  if(typeof el === 'object') {
    if(ann.isVisible(el)) {
        el.classList.remove('z-mid');  
        el.classList.add('slide-' + direction);                  
        setTimeout(function(){
          //  el.classList.add('slide-' + direction); 
            el.classList.add('hide');            
        },timeout)
    }
    else{
      el.classList.add('z-mid');
      el.classList.remove('slide-' + direction);
      el.classList.remove('hide');     
      setTimeout(function(){
        el.classList.add('slide-in');
      },timeout)          
    }
  }
}


ann.toggleFade = function toggleFade(elorid, forceflex = false) {

    var el = ann.getEl(elorid);

    if(typeof el === 'object') {
        if(!ann.isVisible(el)) {
          if(forceflex) {
              ann.show(el, true, forceflex);
          } else {
            ann.show(el)
          }
          el.classList.remove('fadeOut')
          el.classList.remove('z-low')
          el.classList.add('fadeIn')
          el.classList.add('z-top');          
        } else {
          el.classList.remove('fadeIn')
          el.classList.remove('z-top')
          el.classList.add('fadeOut')
          el.classList.add('z-low');
          setTimeout(function(){
            el.classList.add('hide');            
          },1500)
        }
    }
}

ann.getEl = function getEl(elorid) {
  var el;
  if(typeof elorid === 'string') {
      el = document.getElementById(elorid)
  } else {
      el = elorid;        
  }
  return el
}

ann.show = function show(elorid, show = true, forcedisplay = false) {
  var el = ann.getEl(elorid);
  // console.log('el :', el);
  if(el && typeof el === 'object') {
    if(show){
      if(el.classList.contains('flexitc') || el.classList.contains('flexitr') || forcedisplay) {
      // console.log('el :', el);
        if(forcedisplay === true) {
          el.style.display = 'flex';
        } else if (forcedisplay !== false){
          el.style.display = forcedisplay;
        } else {
          el.style.display = 'unset';
        }
        
      } else {
        el.style.display = 'unset';
      }
      
      el.classList.remove('hide');
    } else {
      el.style.display = 'none';
      el.classList.add('hide');
    }
  }
}


ann.createListener = function createListener(elorid, type, callback, params, i) {
//console.log('elorid, type, callback, params, i :', elorid, type, callback, params, i);
    var type = type;
    var callback = callback;
    var paramArray = params;
    if(!type) { return } 
    var el = ann.getEl(elorid);

    if(typeof el === 'object') {
        if(type === true) { type = 'click'}
        el.addEventListener(type, function(e, c = callback, p = paramArray, elem = el){
            if(type == 'submit') { e.preventDefault(); }
            // var el = document.getElementById(id);
            if(!e.path) { e.path = e.composedPath() }
            // console.log('paramArray :',elem, p, c);
            runEvent(c, p, elem, e);
           

         });
    
        function runEvent(callback, paramArray, el, e) {
            if(paramArray) {              
                if(Array.isArray(paramArray)) {
                    callback(el.id, e, ...paramArray)
                } else { callback(el.id, e, paramArray) }
            } else if(callback) {
                if(callback[i]) {
                    callback[i](el.id, e)
                } else {                 
               //   console.log('callback :', callback);
                    callback(el.id, e);              
                    
                }
                
            } else {
                el.classList.add("hide");
                console.warn(id, 'listener was created without callback, add a callback function');
            }
        };
    } else {
      console.error(el, type, 'DOM element not found, listener not created');
    } 
}


ann.addClasses = async function addClasses(elorid, classesstring, elemtype, x) {
  if(classesstring) {
 // console.log('classesstring :', classesstring);
    var el = ann.getEl(elorid);
    if(typeof el === 'object' && typeof classesstring === 'string') {
      var classesarr = classesstring.split(" ");
      for(var i in classesarr) { 
      // console.log('el :', el,classesarr[i]);
        if(classesarr[i]) {
          el.classList.add(classesarr[i]);
        }
      }
      if(elemtype === 'info' && x == 0) {
          el.classList.remove('hide')
          el.classList.remove('fadeOut')
          el.classList.add('fadeIn')
      }
    }
  }    
}

ann.removeClasses = async function removeClasses(elorid, classesstring, elemtype, x) {
  if(classesstring) {
    var el = ann.getEl(elorid);
    if(typeof el === 'object') {
      var classesarr = classesstring.split(" ");
      for(var i in classesarr) { 
       // console.log('el :', el,classesarr[i]);
          el.classList.remove(classesarr[i]);   
      }
    }
  }    
}

ann.get.runs = [];

ann.declareVarsLegacy = function declareVarsLegacy(count) {
  var c = {}
  for (var i=1;i<=count;i++) {
      c['v' +i] = null  
  }
  return c;
}
ann.declareVars = function declareVars(count, params) {
  var a = {}, b = {}, c = {}, d = {}
  for (var i=1;i<=count;i++) {
      a['v' +i] = null  
      b['v' +i] = null  
      c['v' +i] = null  
      if(params) {
        d['v' +i] = null  
      }
  }
  if(params) {
    return [a, b, c, d];
  }
  return [a, b, c];
}
ann.json2array = function json2array(json){
  var result = [];
  var keys = Object.keys(json);
  keys.forEach(function(key){
      result.push(json[key]);
  });
  return result;
}
ann.jsons2arrays = function jsons2arrays(jsonsarray){
  var a = [], b = [], c = [], d = []
  for(let j in jsonsarray) {

    var keys = Object.keys(jsonsarray[j]);
    if(j == 0) { keys.forEach(function(key){ a.push(jsonsarray[j][key])})}
    if(j == 1) { keys.forEach(function(key){ b.push(jsonsarray[j][key])})}
    if(j == 2) { keys.forEach(function(key){ c.push(jsonsarray[j][key])})}
    if(j == 3) { keys.forEach(function(key){ d.push(jsonsarray[j][key])})}
  }
  if(jsonsarray.length == 4) {
    return [a,b,c,d];
  }
  return [a,b,c];
}



ann.selectItem = function selectItem(select, item) {
  let list = select.querySelectorAll('li');
  for(var l in list){
    if(typeof list[l] === 'object') {
      if(item === list[l].innerHTML || item === list[l].getAttribute('value')) {
        select.previousSibling.setAttribute('value',list[l].getAttribute('value'))
        select.previousSibling.innerHTML = list[l].innerHTML;
      }
    }
  }
}

ann.arraysEqual = function arraysEqual(a1,a2) {
  if(typeof a1 === 'object' && typeof a2 === 'object') {
      return JSON.stringify(a1)==JSON.stringify(a2);
  }
  return false;           
}
ann.rangeSlider = async function rangeSlider(el, parent, callback, percentrange = 100, isInputVisible = false, mininput = 1) {
        
      var sliderinput = document.createElement('input');
      sliderinput.classList.add('slider__input');
      sliderinput.value = mininput;
      sliderinput.setAttribute('value', mininput);
      parent.append(sliderinput);
      if(!isInputVisible) { sliderinput.classList.add('hide') }
      el.classList.add('slider');
      parent.append(el);
      let container = document.createElement('div');
      container.classList.add('slider__box');
      container.callback = callback;
      container.percentrange = percentrange;
      el.append(container);
      let sliderbtn = document.createElement('span');
      sliderbtn.classList.add('slider__btn');
      sliderbtn.id = 'btn-' + el.id;
      let slidercolor = document.createElement('span');
      slidercolor.classList.add('slider__color');
      let slidertooltip = document.createElement('span');
      slidertooltip.classList.add('slider__tooltip');
      slidertooltip.innerHTML = mininput + ' Day';
      container.append(sliderbtn);
      container.append(slidercolor);
      container.append(slidertooltip);
      sliderbtn.style.left = '-8.17188px';
      slidercolor.style.width = '0.886094%'
      slidertooltip.style.left = '-30.1719px'
      slidertooltip.style.zIndex = '100';
      makeItMove(container,sliderbtn,slidercolor,slidertooltip);

    function makeItMove(container,btn,color,tooltip) {

        dragElement = (container,btn,color,tooltip) => {
       
            container.addEventListener('mousedown', (e) => {
                onMouseMove(e);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            container.addEventListener('touchstart', (e) => {
              onMouseMove(e);
              document.addEventListener('touchmove', onMouseMove);
              document.addEventListener('touchend', onMouseUp);
          });
            
            onMouseMove = (e) => {
       //     console.warn('e :', e);
      
              //mobile fix try/catch
                if(!e.touches) { e.preventDefault() }             
                var btn, target, sliderinput,inputval;
                
                if(!e.path) { e.path = e.composedPath() }
                if(e.path) {
               
               
                  for(var z in e.path) {
                    btn = e.path[z].querySelector('.slider__btn')
                    color = e.path[z].querySelector('.slider__color')
                    tooltip = e.path[z].querySelector('.slider__tooltip')    
                    if(btn) {break}
                  }
                  for(var z in e.path) {
                    target = e.path[z].querySelector('.slider__box')
                    if(target) {break}
                  }
                  for(var z in e.path) {
                    sliderinput = e.path[z].querySelector('.slider__input')
                    if(sliderinput) {break}
                  }
                }
                var mininput = sliderinput.getAttribute('value')
                
                let targetRect = target.getBoundingClientRect();
                let x = e.pageX - targetRect.left + 10;
                if(!x && e.touches && e.touches[0].pageX) { x = e.touches[0].pageX - targetRect.left + 10;}
                if (x > targetRect.width) { x = targetRect.width};
                if (x < 0){ x = 0};
                btn.x = x - 10;
                btn.style.left = btn.x + 'px';
                var percentPosition = ((btn.x + 10) / targetRect.width) * target.percentrange;
             //   console.log('percentPosition :', btn.x, targetRect.width, target.percentrange, percentPosition);
                if(isNaN(percentPosition)) { percentPosition = mininput}
                color.style.width = (percentPosition/(target.percentrange/100)) + "%";
                tooltip.style.left = btn.x - 20 + 'px';
              //  tooltip.style.opacity = 1;
                let days = Math.round(percentPosition); if(days===0) {days=1}
                tooltip.textContent = days + ' Days';                     
                inputval = parseFloat((10 * days / 100).toFixed(2));            
                if(inputval < 1) {
                  inputval = 1                  
                } 
                  sliderinput.value = inputval;
                  sliderinput.setAttribute('value', inputval);
            //      console.log('sliderinput :', sliderinput, inputval);
              
                if(target.callback) { target.callback(e, inputval, sliderinput, tooltip) }
            };
          
            onMouseUp = (e) => {
               document.removeEventListener('mousemove', onMouseMove);
               document.removeEventListener('touchmove', onMouseMove);
                // btn.addEventListener('mouseover', function() {
                //   tooltip.style.opacity = 1;
                //   tooltip.style.zIndex = 100;
                // });
                
                // btn.addEventListener('mouseout', function() {
                //   tooltip.style.opacity = 1;
                //   setTimeout(function(){
                //     tooltip.style.zIndex = -1;
                //   },2500)
                  
                // });
            };
          };
          dragElement(container,btn,color,tooltip);
    }
}


var currentsubid = ann.get.subid.id;

ann.runLast = async function runLast(functionorarrayoffunctions, paramsorofarrayparams, delay = ann.get.lastRunInterval) {
    var f = functionorarrayoffunctions;
    var p = paramsorofarrayparams;
    var timeindex = 0;
    var interval = setInterval(async function() {
      currentsubid = ann.get.subid.id;
      if(ann.get.completedsubs >= currentsubid && currentsubid > -1) {
          clearInterval(interval);
          if(f[0]) {
            for(var x in f) {
             let resolve = await ann.evalObject(f[x])
           //  console.log('resolve :', resolve);
             if(p && p[x]) { return resolve(p[x]) } else { return resolve()}
         
            }
          } else {
            let resolve = await ann.evalObject(f)
           // console.log('resolve :', resolve);
            if(p) { return resolve(p) } else { return resolve()}
           
          }
      } else {
          currentsubid = ann.get.subid.id;
          timeindex = timeindex + delay;
          if(timeindex>20000) {
              console.error('Guru Meditation ' + timeindex + " runLast has expired at Sub " + currentsubid);
              clearInterval(interval);
          }
      }
    }, delay);
}
ann.recalculateOffsetTop = function recalculateOffsetTop(element) {
  var offsetTop = element.offsetTop;
  var parent = element.offsetParent;

  while (parent !== null) {
    offsetTop += parent.offsetTop;
    parent = parent.offsetParent;
  }

  return offsetTop;
}

ann.jumpPage = async function jumpPage(index, extraoffset = 125) {
  let target = document.querySelector('.section-wrap')
  let offsettop = 0
  let el = document.querySelector('.jump' + index)
  if(el) { offsettop = (ann.recalculateOffsetTop(el) - extraoffset)}

  target.scrollTo({
      top: offsettop,
      behavior: 'smooth'
    });
}

ann.onMenuClick = async function onMenuClick(id, e, callback, opencollapsible = ann.get.collapsiblefirstopen) {
    if(!callback) { callback = ann.get.menuCallback}
    var elarr = [];
    var newid;
    var targetid, subroutineindex, parentindex, childindex;
    if(typeof callback === 'string') { newid = callback } else { newid = id }
    var targetid = newid.replace(getCharsBefore(newid, '-'), 'info');
    var subroutineindex = parseInt(ann.getPartString(newid, '-', 1));
    var parentindex = parseInt(ann.getPartString(newid, '-', 2));
    var childindex = parseInt(ann.getPartString(newid, '-', 3));

    let menu = document.querySelector('menu');
    let menur = document.querySelector('menuright');
    let menul = document.querySelector('menuleft');
    let allnav = menu.querySelectorAll('li')

    if(childindex === 0) {
      menul.classList.add('invert-05');
    }
    if(childindex < allnav.length-1) {
      menur.classList.remove('invert-05')   
    }
    if(childindex === allnav.length-1) {
      menur.classList.add('invert-05');
    }
    if(childindex > 0) {
      menul.classList.remove('invert-05');   
    }

    ann.get.pageIndex = childindex;
    var targetindex = parentindex + 1;
    targetid = targetid.replace('-' + parentindex +  '-', '-' + targetindex +  '-')    
    var infoels = document.getElementsByTagName('info')
    var infosubroutineindex, infochildindex;
    for (var i = 0; i < infoels.length; i++) {
        infosubroutineindex = parseInt(ann.getPartString(infoels[i].id, '-', 1));
        if(infosubroutineindex === subroutineindex) {
            elarr.push(infoels[i])
        }
    }
    if(infoels[0].id === targetid) {
    } else {
        for (var i = 0; i < infoels.length; i++) {
            infochildindex = parseInt(ann.getPartString(infoels[i].id, '-', 3));
            if(infosubroutineindex === subroutineindex && infochildindex === childindex) {
                targetid = infoels[i].id;
                break;
            }
        }         
    } 
    if(childindex===0) {
      ann.jumpPage(childindex)
    } else if(childindex===5) {
      ann.jumpPage(childindex-1)
    } else {
      ann.jumpPage(childindex)
    }
    
    console.log('childindex :', childindex);

    if(opencollapsible) {
      let info = document.getElementById(targetid);
      if(info) {
        let collapsible = info.querySelector('.collapsible')
        if(collapsible){
          collapsible.click();
        }
      }      
    }
    if(typeof callback === 'function') {
      callback(id, e);
    }

    function getCharsBefore(str, chr) {
      var index = str.indexOf(chr);
      if (index != -1) {
          return(str.substring(0, index));
      }
      return("");
    }
}
ann.swapInfo = function swapInfo(id, elarr, htmlarray) {
  for (var i = 0; i < elarr.length; i++) {

      elarr[i].classList.add('fadeOut');     
      elarr[i].classList.add('hide');  
      elarr[i].classList.remove('z-mid');
      // elarr[i].classList.remove('z-top');
      elarr[i].classList.add('z-low');        
  }
  var el = document.getElementById(id);
  el.classList.remove('hide');
  el.classList.remove('fadeOut');
  el.classList.remove('z-low');
  el.classList.add('fadeIn');
  el.classList.add('z-mid');

}
if(ann.get.collapsenonactive) {
  document.documentElement.style.setProperty('--active-collapsible', "''");
}


ann.collapsible = async function collapsible(openfirst = ann.get.collapsiblefirstopen, collapsenonactive = ann.get.collapsenonactive, delay = ann.get.lastRunInterval) {
    ann.require('.collapsible', true).then(async function(resolve) {
        var i;
        await ann.sleep(delay);
        var collapsibles = resolve;
        if(openfirst) {
          collapsibles[0].classList.add("active");
            let content = collapsibles[0].nextElementSibling;
            content.style.maxHeight = content.scrollHeight + "px";
        }
        for (i = 0; i < collapsibles.length; i++) {
          if(!collapsibles[i].processed) {

            if(!collapsibles[i].nextElementSibling || !collapsibles[i].parentElement) {
         //     console.log('collapsibles[i] :', collapsibles[i]);
              console.error('Collapsibles failed to load, check your HTML syntax');
              return;
            }

            collapsibles[i].parentElement.classList.add('o-v')          
            // collapsibles[i].nextElementSibling.classList.add('ccontent')
            collapsibles[i].addEventListener("click", function() {
                  if(collapsenonactive) {
                      var els = document.getElementsByClassName("collapsible");
                      this.style.setProperty('--active-collapsible', "''");
                      for(var x in els) {
                          if(typeof els[x] === 'object' && this.tagName !== 'SPAN') {
                              if(els[x]) { 
                                  els[x].classList.remove('active') 
                                  let content = els[x].nextElementSibling;
                                  if (content.style.maxHeight){
                                      content.classList.add("hide");
                                      content.style.maxHeight = null;
                                  }
                              }
                          }
                      }
                  } else {
                    this.style.setProperty('--active-collapsible', "'I'");
                  }
                  this.classList.add("active");
                  var content = this.nextElementSibling;
                  if (content.style.maxHeight){
                      content.classList.add("hide");
                      content.style.maxHeight = null;
                  } else {
                      content.classList.remove("hide");
                      content.style.maxHeight = content.scrollHeight + "px";                    
                  }
                  if(this.tagName === 'SPAN'){
                    let parentcc = content.closest("div.parentcc");                
                    if(parentcc){
                      parentcc.style.maxHeight = (ann.returnNumber(parentcc.style.maxHeight) + ann.returnNumber(content.style.maxHeight)) + "px";                
                    }
                  }
                  // if(this.closest('.scrollbar')) {
                  //   var topPos = this.offsetTop;
                  //   this.closest('.scrollbar').scrollTop = topPos;
                  // }
              });
            collapsibles[i].processed = true;
          }
        }
    })
}

ann.hovertips = async function hovertips() {
    var hovertips = document.getElementsByTagName('hoverwrap')
    for(var x in hovertips) {
      if(!hovertips[x].processed) {
        hovertips[x].onmousemove = function(e) {
            if(!e.path) { e.path = e.composedPath() }
            var parent = (e.path) ? e.path[1] : e.target.parentElement;
            if(parent) {
              var p = parent.getBoundingClientRect();
              // this works great but might need more conditions (vertical)
              // observation: does not work well when the layout is resized by the user
              var tip = (e.path) ? e.path[0].children[0] : (e.target.children) ? e.target.children[0] : null;  
              if(tip) {
                if(e.x < (p.right - 150)) {
                    tip.style.left = "0px"
                    tip.style.right = "unset"           
                } else {
                    tip.style.left = "unset"
                    tip.style.right = "0px"
                }
              }
            }
        }
      }
      hovertips[x].processed = true;
    }
}

ann.modaltips = async function modaltips(parentelorid) {
      var parent = ann.getEl(parentelorid); 
      if(typeof parent !== 'object') { 
        parent = document.body
      }
      var modaltips = parent.getElementsByTagName('modalcall');
      for(var x in modaltips) {
          if(typeof modaltips[x] == 'object'){
            if(!modaltips[x].processed) {
              modaltips[x].onclick = function(e) {
                  var modaltip = this.querySelector('modaltip');
                  tooltip(modaltip.innerHTML, parent)
              }
            }
            modaltips[x].processed = true;
          }
      }

    function tooltip(content, parentel) {
      var parent = parentel;
      var tooltip = document.getElementsByTagName('tooltip')[0];
     
      if(tooltip) {tooltip.remove()}
      ann.cl.tooltip = {};

      ann.cl.onload.tooltipOnload = function tooltipOnload (){
          var tooltip = document.getElementsByTagName('tooltip')[0];
 
          parent.append(tooltip);
          ann.toggleFade(tooltip);
      }

      return ann.Subroutine('tooltip+ann.cl.onload.tooltipOnload',
          ['tooltip_y', 'div', 'div'],
          [ null, content, 'x' ],
          ['tooltip hide fadeOut', 'customtooltip scrollbar mw-180px', 'tooltipclose'],
          [ null, null, tooltipclose ],
      );

      function tooltipclose() {
          var tooltip = document.getElementsByTagName('tooltip')[0];
          tooltip.classList.add('fadeOut')
          setTimeout(function(){
              if(tooltip) {tooltip.remove()}
          },1000)
      }
    }
}

ann.copyToClipboard = function copyToClipboard() {

    let copyels = document.getElementsByClassName('copycontent');
    for(var x in copyels) {
      if(!copyels[x].processed) {
        copyels[x].onclick = function (e) {
            if(!e.path) { e.path = e.composedPath() }
            let el = e.path[0];
            let range = document.createRange();
            range.selectNode(el);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand("copy");
            navigator.clipboard.writeText(el.innerText.trim())
            .then(() => {
            })
            .catch(err => {
            })   
            ann.changePseudoAttribute(el, 'on');
            window.getSelection().removeAllRanges();
            setTimeout(function(){
              ann.changePseudoAttribute(el, 'off');
            },2000)
        }
        copyels[x].processed = true;
      }
    }
}
ann.changePseudoAttribute = function changePseudoAttribute(el, onoff) {
  el.className=el.className.replace(' on', '').replace(' off', '') + " " + onoff;
}

ann.handleUnload = async function handleUnload(callback, params = true) {



 
  await ann.sleep(3000);

  var callback = callback;
  var params = params;
  let anchors = document.querySelectorAll('a');

  for(var a in anchors) {
    if(typeof anchors[a] === 'object') {
      ann.createListener(anchors[a],'click',function(e) {
       console.log('e :', e);
        ann.get.donotunload = true;
      });
    }
  }
  let forms = document.querySelectorAll('form');
  for(var f in forms) {
    if(typeof forms[f] === 'object') {
      ann.createListener(forms[f],'submit',function(e) {
        ann.get.donotunload = true;
      });
    }
  }

  let inputs = document.querySelectorAll('input[type=submit]');
  for(var i in inputs) {
    if(typeof inputs[i] === 'object') {
      ann.createListener(inputs[i],'submit',function(e) {
        ann.get.donotunload = true;
      });
    }
  }

  window.removeEventListener('beforeunload', unloadThis, true);
  if (window.onbeforeunload) {
    window.onbeforeunload = null;
  }
  // ann.createListener(window, 'beforeunload', unloadThis, callback)
  console.log('handleUnload runs :', ann.get.donotunload);

  window.removeEventListener('beforeunload', unloadThis, true);
  window.addEventListener("beforeunload", unloadThis, true);

  ann.get.donotunload = false;

}

async function unloadThis(e, callback) {
  console.log('unloadThis ann.get.donotunload :', ann.get.donotunload, e, callback);
  if(!ann.get.donotunload && ann.keep.unloadAnon) {
    ann.keep.unloadAnon()
    return false;
  }
  ann.get.donotunload = false;      
  console.log('unloadThis runs :', ann.get.donotunload);
}

// pwmodal 0 = none, 1 = session pass, 2 = session pass + safekeeping
ann.modal = function modal(title, content, buttoncount = 2, parentel = false, pwmodal = 0) {

    let m = document.querySelector('modal'); if(m) {m.remove()}
    var subname;
    var title = title;

    ann.get.modal.modalparent = parentel
    ann.get.modal.response = -1;
    if(!parentel) { subname = 'modal' } else { subname = 'modal+ann.get.modal.onLoad' }
    var confirmbuttonclass = 'iambutton';
    var pwinputclass = 'custominput hide';
    var pwinputclass2 = 'custominput hide';
    var message2 = 'modalmessage pt-20 hide';
    var cancelbuttontext = ann.get.modal.btnone;
    var safekeeping = "<span class='inlineb'>Enter <hoverwrap><u>secret PIN</u>.<hovertip>This PIN will be used to encrypt &amp; protect the key in our database. We cannot recover your PIN. If you lose it, you won't be able to decrypt your key.</hovertip></hoverwrap></span>"
    if(buttoncount === 1) { cancelbuttontext = ann.get.modal.btnonealt; confirmbuttonclass = 'iambutton hide'}
    if(pwmodal > 0) { pwinputclass = 'custominput'; if(buttoncount === 1) {cancelbuttontext = ann.get.modal.btntwo}}
    if(pwmodal === 2) { title = "DATA KEY GUARD"; pwinputclass2 = 'custominput'; message2 = "modalmessage pt-20" }
    ann.get.modal.onLoad = async function onLoad(response) {
        let modal = document.getElementsByTagName('modal')[0];
        if(ann.get.modal.modalparent && modal) {
            ann.get.modal.modalparent.append(modal);
        } else {
          let header = document.querySelector('header');
    //      console.log('header.nextElementSibling :', header.nextElementSibling);
          if(header && header.nextElementSibling && header.nextElementSibling.tagName === 'DIV') {          
            header.nextElementSibling.append(modal)
          }
        }
    }
    let cancelbuttonclass = "iambutton"
    if(cancelbuttontext === 'CANCEL') { cancelbuttonclass = 'iambutton btncancel'}
    let [h, c, cl] = ann.declareVars(12); 
    h.v3=title, h.v5=content, h.v7=safekeeping,h.v11=cancelbuttontext, h.v12='CONFIRM';
    c.v1='modalcall',c.v2='custommodal',c.v3='modaltitle',c.v4='overflow-v',c.v5='modalmessage',c.v6=pwinputclass,c.v7=message2,c.v8=pwinputclass2,c.v9=pwinputclass2,c.v10='mt-10',c.v11=cancelbuttonclass,c.v12=confirmbuttonclass;
    cl.v6=pwBlur,cl.v11=cl.v12=modalResponse;
    let [html, css, clb] = ann.jsons2arrays([h, c, cl])
    
    return ann.Subroutine(subname,
        ['modal','div','div','$2_form_y','div_x','$4_input_password_4-30','$4_div','$4_input_password_8-30','$4_input_password_8-30', '$2_div_x', 'button', '$10_button' ],
        [...html],[...css],[...clb]
    );

    function pwBlur(id, e) {
    }

    async function modalResponse(id, e) {
        e.preventDefault();
        var modal = document.getElementsByTagName('modal')[0];
        var buttons = modal.querySelectorAll('button');
        if(buttoncount === 2 && buttons[0].id == id) {
          ann.get.modal.response = 0;
          destroyModal(modal);
          return;
        }

        var firstinput = modal.querySelector('input:not([type=hidden])');
        var pwinputvisible = ann.isVisible(firstinput);
        var pwinput = modal.querySelectorAll('input:not([type=hidden])');
        var pw1; var pw2;
        for(var x in pwinput) {
          //console.log('x :', x, pwinput[x]);
          if(typeof pwinput[x] === 'object' && ann.isVisible(pwinput[x])) {
            let min = parseInt(pwinput[x].getAttribute('minlength'));
            let max = parseInt(pwinput[x].getAttribute('maxlength'));
            if(isNaN(min)) { min = 4}
            if(isNaN(max)) { max = 8}
            if(!pwinput[x].value || pwinput[x].value.trim() == '' || pwinput[x].value.trim().length<min || pwinput[x].value.trim().length>max) {
           
              ann.toggleFade(pwinput[x].nextElementSibling.nextElementSibling);
                setTimeout(function(){ ann.toggleFade(pwinput[x].nextElementSibling.nextElementSibling) },3500)
                ann.get.modal.response = -1;
               // modalResponse(id, e);
                return;              
            } else if(pwinput[x].value.trim().length>=min && pwinput[x].value.trim().length<=max) {
                let value = pwinput[x].value.trim();
                let valuehash = await ann.sha256(value);
                if(x == 2) {
                  pw2 = valuehash;
                } else if(x == 1) {
                  pw1 = valuehash;
                } else if(x == 0) {
                  localStorage.setItem('pass', valuehash);
                  console.log('valuehash :', valuehash);
                }
                //L5epzvR2ZKTB5ZmcnCxBu8PUg876iitMqXbFE7ArjbFh95MCcm2s
                if(pw1 && pw2 && pw1 !== pw2 && x == 2) {
                  var pwvalidation2 = document.getElementsByClassName('pwvalidation2')[0];                  
                  if(pwvalidation2) {pwvalidation2.remove()}
                  pwvalidation2=document.createElement('span');
                  ann.addClasses(pwvalidation2, 'pwvalidation hide fadeOut')
                  pwvalidation2.innerHTML = "Secret password does not match.";
                  pwinput[x].nextElementSibling.nextElementSibling.insertAdjacentHTML('afterend', pwvalidation2.outerHTML);
                  pwvalidation2 = pwinput[x].nextElementSibling.nextElementSibling.nextElementSibling
                  ann.toggleFade(pwvalidation2);
                  setTimeout(function(){ ann.toggleFade(pwvalidation2) },3500)
                  ann.get.modal.response = -1;
                  return; 
                } else if(pw1 && pw2 && pw1 === pw2 && x == 2) {
                  let pwinp = await ann.sha256(pwinput[x].value.trim())
                  localStorage.setItem('safekeeping', pwinp);
                }
                if(x == 0) {
                   ann.get.modal.response = 1;
                }
            }
          }
        }
        if(buttoncount === 2 && buttons[1].id == id) {
            ann.get.modal.response = 1;          
        } else if(!pwinputvisible) {
           ann.get.modal.response = 0;
        }
        destroyModal(modal)
    }
    function destroyModal(modal) {
      modal.classList.add('fadeOut');
      setTimeout(function(){
          if(modal) {modal.remove()}
      },2000)
    }
}

ann.validateIdentity = async function validateIdentity(returnpass, callback) {
  var enwif = localStorage.getItem('enwif');
  if(enwif && enwif.length > 52) {
      let wif = await ann.decryptWIF(enwif, null, document.body, returnpass)  
      if(wif)  {
          var pub = ann.getPublicAddressFromWif(wif);
          if(pub) {
              var pubhash = await ann.sha256(pub)
              var identity = { pubhash: pubhash }
               var resolve = await ann.fetch('getIK',identity,'POST')
               console.log('resolve :', resolve);
              if(!resolve.ik.includes('not found')){                                                                      
                  if(resolve.count && resolve.ik) {   
                    const sessionData = sessionStorage.getItem('authorized');
                    if (sessionData) {                    
                      const { password, expiryTime } = JSON.parse(sessionData);
                      if(password) {
                        var msg = await ann.decryptRoutine(wif, password, resolve.ik, resolve.count)
                        console.log('msg :', msg);
                        if(msg.pub && msg.item && msg.item.length === 52 && msg.msg) {
                          let msghash = await ann.sha256(msg.msg)
                          pubhash = await ann.sha256(msg.pub)
                          let result = { pubhash: pubhash, msg: msghash}         
                          if(returnpass === "returnwif") {
                            result['wif'] = wif;
                          }
                          return result;                         
                        }
                      }                                                  
                    }
                }
             } 
          }
      }
  }
  if(returnpass) {
    let pass = localStorage.getItem('pass');
    console.log('pass :', pass);
    localStorage.removeItem('pass');
    return  { password: pass };
  }
  return null;
}

ann.encryptWIF = async function encryptWIF(wif, parent = document.body) {

  ann.modal("ENTER PIN","<p>Choose a 4-8 digit PIN code that is easy to remember.<br><br>Your Private Key will be securely stored in the browser's local storage and automatically retrieved when accessing a protected area.</p>",2,parent,1);
  await ann.modalResponse();
  if(ann.get.modal.response==0) {return}
  let pass = localStorage.getItem('pass')
  console.log('pass :', pass);

  ann.createSession(pass, 15);
 // localStorage.removeItem('pass');
  let enwif = await ann.encryptRoutine(wif,pass);
  if(enwif && enwif.item && enwif.item.length > 52) {                        
      localStorage.setItem('enwif', enwif.item)      
      console.log('enwif.item :', enwif.item);
      return enwif;
  } else {
      return false;
  }
  
}

ann.decryptWIF = async function decryptWIF(enwif, caller, parent = document.body, returnpass = false) {
  console.log('caller :', caller);
  // 9e4067ac93c6febda554d724d453d78bf3e28a7742cdec57ee47c5c706fbe940
  var call = caller;
  var wif = true;
  let pass = ann.checkSession()
 console.log('passenwif :', enwif, pass);
 let i = 0
  while((wif && wif.length !== 52)) {   
      let decwif = await ann.decryptRoutine(enwif, pass);                             
      console.log('decwif :', decwif);
      if(decwif) {
        wif = decwif.item;
        console.log('wif :', wif);  
      }
      if(!pass || wif.length !== 52) {
        await ann.modal("ENTER PIN","Please enter your PIN code",2,parent,1);
        let cmod = document.querySelector('.custommodal')
        let para = document.createElement('p')
        let span = document.createElement('span')
        ann.addClasses(para, 'mt-5')
        ann.addClasses(span, 'ahref fsize1')
        span.innerHTML = "Forgot my PIN";
        para.appendChild(span)
        cmod.appendChild(para)
        ann.createListener(span, 'click', forgotPIN, [call, cmod, para])
        if(i>0){
          let pwvalidation = document.querySelector('.pwvalidation')
          pwvalidation.style.backgroundColor = "var(--septenary)";
          pwvalidation.innerHTML = "Incorrect PIN"
          ann.toggleFade(pwvalidation);
          setTimeout(function(){ ann.toggleFade(pwvalidation) },3500)
        }
        i++;

        await ann.modalResponse();
        if(ann.get.modal.response==0) {return null}
        pass = localStorage.getItem('pass');
        
        // if(!returnpass) {
        //   localStorage.removeItem('pass');
        // }    
      } else {
        if(returnpass) {
          localStorage.setItem('pass', pass);
        }
        
        ann.createSession(pass, 15);
      }
  }


  async function forgotPIN(id, e, callback, cmod, para) { 
    sessionStorage.clear();                   
    ann.show(para, false);
    let modaltitle = cmod.querySelector('.modaltitle')
    modaltitle.innerHTML = "ACCESS RECOVERY";
    let modalmessage = cmod.querySelector('.modalmessage')
    modalmessage.innerHTML = "We cannot recover your PIN. If you have your Private Key, please enter it. If you cannot remember your PIN and do not have your Private Key, you may choose to create a new cryptographic identity.";
    let btn = document.createElement('button')
    btn.innerHTML = "Confirm Key"
    ann.addClasses(btn, 'iambutton upper')
    let btncancel = cmod.querySelector('button')    
    btncancel.after(btn)
    ann.createListener(btn, 'click', confirmKey, cmod)
    btn.nextElementSibling.innerHTML = "NEW IDENTITY"
    ann.createListener(btn.nextElementSibling, 'click', newID)
    let eyewrap = cmod.querySelector('.eyewrap')
    ann.show(eyewrap, false)
    let div = document.createElement('div')
    ann.addClasses(div,'flexitc')
    let wifinput = document.createElement('input')
    wifinput.setAttribute('type', "text")
    wifinput.setAttribute('placeholder', 'Paste your Private Key')
    ann.addClasses(wifinput, 'wifinput custominput w-100 fsize2 mw-85')
    eyewrap.after(div)
    div.innerHTML = "<span class='pwvalidation2 septenary hide fadeOut'>Please enter a valid private key.</span>"
    div.prepend(wifinput);
    // L5epzvR2ZKTB5ZmcnCxBu8PUg876iitMqXbFE7ArjbFh95MCcm2s
    async function newID(id, e) {
      sessionStorage.clear();
      localStorage.removeItem('enwif');
      let idneuron = ann.newNeuron();
      let wif = idneuron.WIF;
      localStorage.setItem('wif', wif);
      let pub = idneuron.publicAddressString;
      let pubhash = await ann.sha256(pub)
      let refkey = await ann.sha256(wif)
      ann.fetch('visitorID', { pubhash: pubhash, refkey: refkey }, 'POST');
      if(callback) { callback[0](callback[1], callback[2]); } 
      cmod.parentElement.remove();
    }
    async function confirmKey(id,e, cmod) {
      let wif = cmod.querySelector(".wifinput")
      console.log('wifinput :', wif);
      if(wif.value && wif.value.length === 52) {
        let pub = ann.getPublicAddressFromWif(wif.value);
        if(pub) {
          localStorage.removeItem('enwif');
          cmod.parentElement.remove();
          localStorage.setItem('wif', wif.value)  
          let pubhash = await ann.sha256(pub)
          let refkey = await ann.sha256(wif)
          await ann.fetch('visitorID', { pubhash: pubhash, refkey: refkey }, 'POST');
          await ann.encryptWIF(wif.value);
          if(callback) { await callback[0](callback[1], callback[2]); }                  
          
        } else {
          invalidWIF(cmod)
        }
      } else {
        invalidWIF(cmod)
      }
      function invalidWIF(cmod) {
      console.log('cmod :', cmod);
        let pwvalidation = cmod.querySelector('.pwvalidation2')    
        console.log('pwvalidation :', pwvalidation);
        ann.toggleFade(pwvalidation);
        setTimeout(function(){ ann.toggleFade(pwvalidation) },3500)
      }
    }
  }
  return wif;
}


ann.modalResponse = async function modalResponse(timeout = 100000000) {
  while (ann.get.modal.response < 0)
  await new Promise(resolve => setTimeout(resolve, 500), ann.evalObject(ann.get.modal.response).then(function(resolve){
     ann.get.modal.response = resolve;
  })) 
}


// depends on https://github.com/foliotek/croppie
// Sub command example - croppie_120_120
ann.createCroppie = function createCroppie(el, command, parent, label = 'Profile Picture', url) {
      
      var command = (command.startsWith('$')) ? command.replace(ann.getPartString(command,'_',0),'').substring(1) : command;
      var width = parseInt(ann.getPartString(command,'_', 1));       
      var height = parseInt(ann.getPartString(command,'_', 2));
      if(isNaN(width)) { width = 90 }
      if(isNaN(height)) { height = 90 }

       var crwrap = el; ann.addClasses(crwrap, 'flexitc'); parent.append(crwrap);
       crwrap.style.maxWidth  = (width + 10) + 'px';
       let crinner = document.createElement('div'); crinner.classList.add('croppie-inner'); crwrap.append(crinner);
       let piclabel = document.createElement('div'); piclabel.classList.add('customlabel'); piclabel.innerHTML = label;
       var cr = document.createElement('div'); 
       crinner.append(piclabel); crinner.append(cr);
       let fileup = document.createElement('input'); fileup.setAttribute('type', 'file'); fileup.setAttribute('accept','image/*'); fileup.setAttribute('onclick',"this.value=null"); ann.addClasses(fileup, 'btn-upload-image');       
      //  let fileup2 = document.createElement('input'); fileup2.setAttribute('type', 'button'); ann.addClasses(fileup2, 'btn-upload-image');        
       let upconf = document.createElement('input'); upconf.setAttribute('type', 'button'); ann.addClasses(upconf, 'btn-upload-image hide'); 
        // cr.append(fileup); cr.append(fileup2); cr.append(upconf);
       cr.append(fileup); cr.append(upconf);
       let crpreview = document.createElement('div'); crpreview.classList.add('targetimage'); crinner.append(crpreview);
       let discardimage = document.createElement('div'); ann.addClasses(discardimage,'discardimage hide'); discardimage.innerHTML = 'x'; crinner.append(discardimage);
 
       ann.createListener(fileup,'change',uploadImage)
       ann.createListener(upconf,'click',confirmImage)
       ann.createListener(discardimage,'click',discardImage)
       var url = url;
       ann.waitForGlobal('Croppie', function(){
      //  if(url) {
      //     ann.fetch(url)
      //     .then(function() {
      //       cr.croppie = croppiefn(cr, width, height, url)
      //     })
      //     .catch(function() { 
      //         url = ''; // 'images/identity/IAM.jpg'
      //         cr.croppie = croppiefn(cr, width, height)
      //     })
      //     return;
      //   }
        cr.croppie = croppiefn(cr, width, height, url);
      //  cr.croppie.img = url; 
        
      })
      return crwrap;
    
     function croppiefn(cr, width, height, url = '') {
            var cropp = new Croppie(cr,{
                enableExif: true,
                enableOrientation: true,
                url: url,
                width: width,
                height: height,
                viewport: { 
                    width: width,
                    height: height,
                    type: 'square'
                },
                boundary: {
                    width: width + 5,
                    height: height + 5
                }
            });
            // cropp.croppie('setZoom', 100);
        return cropp;       
    }

    function uploadImage(id, ev) {
      var reader = new FileReader();
      reader.onload = function (e) {
        ev.path[1].croppie.bind({
          url: e.target.result
        }).then(function () {
              ann.show(ev.path[0],false);
              ann.show(ev.path[0].nextElementSibling);
              ev.path[0].nextElementSibling.classList.remove('hide');
              ann.show(ev.path[1].querySelector('.cr-slider-wrap .cr-slider'));
              ann.show(ev.path[1].querySelector('.cr-slider-wrap'));                                
        });
      };
      reader.readAsDataURL(ev.target.files[0]);
   }

   function confirmImage(id, ev) {

      var croppie = ev.path[1].croppie;
      croppie.result({
        type: 'canvas',
        size: 'viewport',
      }).then(function (img) {
          croppie.img = img;                           
          let html = "<img src=" + img + " />";
          let targetimage = ev.path[1].nextElementSibling;
          let discardimage = targetimage.nextElementSibling;
          targetimage.innerHTML = '';
          ann.show(ev.path[1], false);
          ann.show(targetimage);
          ann.show(discardimage);
          targetimage.innerHTML = html;              
      });
   }
   function discardImage(id, ev) {
      var cr = ev.path[1].querySelector('.croppie-container');
      // cr.croppie.destroy();
     // cr.croppie = croppiefn(cr, width, height);
      let discardimage = ev.path[0];
      let targetimage = discardimage.previousSibling;
      targetimage.innerHTML = '';
      ann.show(discardimage,false);
      ann.show(targetimage,false);
      ann.show(cr);
      ann.show(cr.querySelector('.cr-slider-wrap .cr-slider'), false);
      ann.show(cr.querySelector('.cr-slider-wrap'), false);  
      ann.show(cr.firstChild)
      ann.show(cr.firstChild.nextElementSibling,false);
    }
}

// depends on bitcoin.js
ann.newNeuron=function(){var e=new Object;return e.privateKey=new window.bitcoin.PrivateKey,e.WIF=e.privateKey.toWIF(),e.publicKey=e.privateKey.toPublicKey(),e.publicAddress=e.publicKey.toAddress(),e.publicAddressString=e.publicAddress.toString(),e};
ann.getPublicAddressFromWif=function(t){if(52!==t.length)return"";var r="";try{r=new window.bitcoin.PrivateKey(t)}catch(t){return""}return r.toPublicKey().toAddress().toString()};
// depends on aesjs
ann.decrypt_it=function(e,t,s=5){var n=aesjs.utils.hex.toBytes(e),r=new aesjs.ModeOfOperation.ctr(t,new aesjs.Counter(s)).decrypt(n);return aesjs.utils.utf8.fromBytes(r)};
ann.encrypt_it=function(e,t,s=5){var n=aesjs.utils.utf8.toBytes(e),r=new aesjs.ModeOfOperation.ctr(t,new aesjs.Counter(s)).encrypt(n);return aesjs.utils.hex.fromBytes(r)};

// depends on crypto-js
ann.cryptoJSAesDecrypt = function cryptoJSAesDecrypt(encrypted_json_string,passphrase){
  var obj_json = JSON.parse(encrypted_json_string);
  var encrypted = obj_json.ciphertext;
  var salt = CryptoJS.enc.Hex.parse(obj_json.salt);
  var iv = CryptoJS.enc.Hex.parse(obj_json.iv);
  var key = CryptoJS.PBKDF2(passphrase, salt, { hasher: CryptoJS.algo.SHA512, keySize: 64/8, iterations: 999});
  var decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv: iv});
  return decrypted.toString(CryptoJS.enc.Utf8);
}
// depends on crypto-js
ann.cryptoJSAesEncrypt = function cryptoJSAesEncrypt(plain_text,passphrase){
  var salt = CryptoJS.lib.WordArray.random(256);
  var iv = CryptoJS.lib.WordArray.random(16);
  var key = CryptoJS.PBKDF2(passphrase, salt, { hasher: CryptoJS.algo.SHA512, keySize: 64/8, iterations: 999 });
  var encrypted = CryptoJS.AES.encrypt(plain_text, key, {iv: iv});
  var data = {
      ciphertext : CryptoJS.enc.Base64.stringify(encrypted.ciphertext),
      salt : CryptoJS.enc.Hex.stringify(salt),
      iv : CryptoJS.enc.Hex.stringify(iv)    
  }
  return JSON.stringify(data);
}


ann.getRecoveryCount=function(n){for(var e=0,r=0;r<n.length;r++)e+=n.charCodeAt(r);return e};

ann.encryptRoutine = async function encryptRoutine(item, pw, servermsg) {
  var encrypteditem, encryptedIK, pub, userid, encrypted_count;
  var enc_pass = await ann.sha256(pw);
  var hash = await ann.sha256(item);
  var recovery_count = Math.ceil(ann.getRecoveryCount(hash)/10);
  const encoder = new TextEncoder();
  var encryption_key = encoder.encode(hash);
  var encryption_key2 = encoder.encode(enc_pass);
  var big = 32;
  if (encryption_key.length > big) encryption_key = encryption_key.slice(0, big);
  if (encryption_key2.length > big) encryption_key2 = encryption_key2.slice(0, big);

  if(item.length === 52 && servermsg && servermsg !==false) {
      pub = ann.getPublicAddressFromWif(item);
      if(pub !== '') {
          userid = pub + "_@@@_" + servermsg;
          encrypteditem = ann.encrypt_it(item, encryption_key2, 100);
          encryptedIK = ann.encrypt_it(userid, encryption_key, recovery_count);
          encrypted_count = ann.encrypt_it(recovery_count, encryption_key, 100);
      }
  }
  else if (item.length === 52) {
      console.log('encryptRoutine item :', item);
      console.log('encryptRoutine pw :', pw);
      console.log('encryptRoutine hash :', enc_pass);
      pub = ann.getPublicAddressFromWif(item);  
      if(pub !== '') {
          encrypteditem = ann.encrypt_it(item, encryption_key2, 100);
          encrypted_count = ann.encrypt_it(recovery_count, encryption_key2, 100);                        
      }
  }
  else {
      encrypteditem = ann.encrypt_it(item, encryption_key2, 100);
  }
  return {
      pub: pub,
      item: encrypteditem,
      ik: encryptedIK,
      count: encrypted_count
  };
} 
ann.decryptRoutine = async function decryptRoutine(itemorwif, pw, servermsg, encrypted_count) {
  var decrypteditem, pub, decryptedmsg, p;
  const encoder = new TextEncoder();  
  var big = 32;

  if(!pw || !itemorwif) {
    console.warn('Missing item or PIN, nothing to decrypt')
    return;
  }
  // if enwif isn't in localstorage, user passes in plain text wif and pw must be set true
  var item = itemorwif;
  // let's find out that is the case
  let testwif = ann.getPublicAddressFromWif(item);
  if(testwif && item.length === 52 && servermsg && encrypted_count) {
      decrypteditem = item;
      p = testwif;
  } else {   
      let pass = await ann.sha256(pw);
      let encryption_key = encoder.encode(pass);
      if (encryption_key.length > big) { encryption_key = encryption_key.slice(0, big) }
      decrypteditem = ann.decrypt_it(item, encryption_key, 100);
      if(decrypteditem && decrypteditem.length === 52) {
        p = ann.getPublicAddressFromWif(decrypteditem); 
      }
  }

  if(servermsg && encrypted_count) {
    if(decrypteditem && decrypteditem.length === 52) { 
      if(p) {
        let hash = await ann.sha256(decrypteditem);
        let encryption_key2 = encoder.encode(hash);
        if (encryption_key2.length > big) { encryption_key2 = encryption_key2.slice(0, big) }
        let recovery_count = parseInt(ann.decrypt_it(encrypted_count, encryption_key2, 100));
        let decryptmsg = ann.decrypt_it(servermsg, encryption_key2, recovery_count);
        let fullmesage = decryptmsg.split("_@@@_");
        pub = fullmesage[0]
        if(p !== pub) {
          console.error('Invalid message')
          return;
        }
        decryptedmsg = fullmesage[1]
      } else {
        console.warn('Invalid WIF key, nothing to decrypt')
      }
    } else {
      console.warn('Invalid WIF key, nothing to decrypt')
    }
  } else if(servermsg) {
      console.warn("In order to decrypt the server message we need the encrypted_count. Can't decrypt.")
  } 
  if(!pub && !servermsg) { pub = p }

  return {
    pub: pub,
    item: decrypteditem,
    msg: decryptedmsg
  };
  
}

ann.downloadBase64File = function downloadBase64File(contentBase64, fileName) {
    const linkSource = `data:application/pdf;base64,${contentBase64}`;
    const downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);

    downloadLink.href = linkSource;
    downloadLink.target = '_self';
    downloadLink.download = fileName;
    downloadLink.click(); 
}
ann.imageUrlToBase64 = async function imageUrlToBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((onSuccess, onError) => {
    try {
      const reader = new FileReader() ;
      reader.onload = function(){ onSuccess(this.result) } ;
      reader.readAsDataURL(blob) ;
    } catch(e) {
      onError(e);
    }
  });
};
ann.removeLastCharacter = function removeLastCharacter(str,char) {
  if (str.charAt(str.length - 1) === char) {
    return str.slice(0, -1);
  }
  return str;
}
ann.getPartString = function getPartString(str, chr, index) {
    var str = str;
    if(str.includes("_@")) {
      str = str.split('_@')[0];
    }
    let split = str.split(chr)[index]
    if(!split) { split = str}
    return split;
}

ann.executeFunctionByName = async function executeFunctionByName(functionName) {

    return ann.evalObject(functionName).then(async function(resolve) {
        if(resolve) {
          let id = await resolve();
          return id
        }
        // var context = window;
        // var args = Array.prototype.slice.call(arguments, 2);
        // var namespaces = functionName.split(".");
        // var func = namespaces.pop();
        // for(var i = 0; i < namespaces.length; i++) {
        //   context = context[namespaces[i]];
        // }
        // if(context[func]) {
        //   let id = context[func].apply(context, args);
        //   return id;
        // }
    })
  }

ann.returnNumber = function returnNumber(str) { 
    var num;
    if(isNaN(str)) {
        num = str.replace(/[^0-9.]/g, ''); 
        return parseFloat(num, 10);
    }
    return parseFloat(str);
}


ann.findDuplicateIds = function findDuplicateIds() {
    var ids = {};
    var all = document.all || document.getElementsByTagName("*");
    for (var i = 0, l = all.length; i < l; i++) {
        var id = all[i].id;
        if (id) {
            if (ids[id]) {
                console.error("Duplicate id: #" + id);
            } else {
                ids[id] = 1;
            }
        }
    }
}

ann.getOddEvenNums = function getOddEvenNums(arr, odd = false) {
    if(odd) {
        return arr.filter((num) => num % 2 !== 0);
    }
    return arr.filter((num) => num % 2 === 0);
}
ann.flattenArray = function flattenArray(array) {
  array.reduce((accumulator, currentValue) => {
    return accumulator.concat(currentValue);
  }, []);
}

ann.returnLargerThan = (arr, num) => arr.filter(n => n > num);
ann.returnLowerThan = (arr, num) => arr.filter(n => n < num);
ann.secondMin = (arr, min) => arr.reduce((pre, cur) => (cur < pre && cur !== min) ? cur : pre, Infinity);
ann.randbetween = function randbetween(num1, num2) { return Math.random() * (num2 - num1) + num1;}

ann.addYearsToDate = function addYearsToDate(years, date = new Date()) {
    date.setFullYear(date.getFullYear() + 1);
    return date;
}

ann.getDaysArray = function getDaysArray(start, end) {
    for(var arr=[],dt=new Date(start); dt<=new Date(end); dt.setDate(dt.getDate()+1)){
        arr.push(new Date(dt).toDateString());
    }
    return arr;
}
  
ann.requireurl = function requireurl(url){
        if (url.toLowerCase().substr(-3)!=='.js') url+='.js'; // to allow loading without js suffix;
        if (!require.cache) require.cache=[]; //init cache
        var exports=require.cache[url]; //get from cache
        if (!exports) { //not cached
                try {
                    exports={};
                    var X=new XMLHttpRequest();
                    X.open("GET", url, 0); // sync
                    X.send();
                    if (X.status && X.status !== 200)  throw new Error(X.statusText);
                    var source = X.responseText;
                    // fix (if saved form for Chrome Dev Tools)
                    if (source.substr(0,10)==="(function("){ 
                        var moduleStart = source.indexOf('{');
                        var moduleEnd = source.lastIndexOf('})');
                        var CDTcomment = source.indexOf('//@ ');
                        if (CDTcomment>-1 && CDTcomment<moduleStart+6) moduleStart = source.indexOf('\n',CDTcomment);
                        source = source.slice(moduleStart+1,moduleEnd-1); 
                    } 
                    // fix, add comment to show source on Chrome Dev Tools
                    source="//@ sourceURL="+window.location.origin+url+"\n" + source;
                    //------
                    var module = { id: url, uri: url, exports:exports }; //according to node.js modules 
                    var anonFn = new Function("require", "exports", "module", source); //create a Fn with module code, and 3 params: require, exports & module
                    anonFn(require, exports, module); // call the Fn, Execute the module
                    require.cache[url]  = exports = module.exports; //cache obj exported by module
                } catch (err) {
                    throw new Error("Error loading module "+url+": "+err);
                }
        }
        return exports; //require returns object exported by module
    }

ann.ordinalNumber = function ordinalNumber(number){
    switch (number) {
        case 1: 
            return number + 'st';
        case 2: 
            return number + 'nd';
        case 3: 
            return number + 'rd';
        default:
            return number + 'th'
            
        }
}
ann.percentage = function percentage(a, b) {
  return a / b * 100 > 100 ? 100 : a / b * 100;
}

ann.getCountryInfo = async function getCountryInfo(code) {
  let data = await ann.getCountries();   
  return data.filter(
      function(data){ return data.code == code }
  );
}

ann.validateEmail = async function validateEmail(e, input, parent,btncount,message) {
  var email, par;
  if(input) { email = input } else { email = e.path[1].querySelectorAll('input:not([type="hidden"]')[4]}
  if(parent) { par = parent} else { par = e.path[2]}
  if(!email || !email.value || !email.value.includes('@') || !email.value.includes('.') || !email.value.length > 6 ) {
      if(!message) {
          ann.modal('INVALID EMAIL', "Adding your email is convenient for updates and support, but not required. Proceed without email?",2,par);
      } else {
          ann.modal('INVALID EMAIL', message,btncount,par);
      }
      return 0;
  } else {
      if(ann.cl.reg && ann.cl.reg.regset) {
        ann.cl.reg.regset.email = email.value;
        return 1;
      }
      
  }
}

ann.getCountries = async function getCountries() {
    var country_data = [
     {
        code: "AC",
        unicode: "U+1F1E6 U+1F1E8",
        name: "Ascension Island",
        emoji: "🇦🇨"
      },
      {
        code: "AD",
        unicode: "U+1F1E6 U+1F1E9",
        name: "Andorra",
        emoji: "🇦🇩"
      },
      {
        code: "AE",
        unicode: "U+1F1E6 U+1F1EA",
        name: "United Arab Emirates",
        emoji: "🇦🇪"
      },
      {
        code: "AF",
        unicode: "U+1F1E6 U+1F1EB",
        name: "Afghanistan",
        emoji: "🇦🇫"
      },
      {
        code: "AG",
        unicode: "U+1F1E6 U+1F1EC",
        name: "Antigua & Barbuda",
        emoji: "🇦🇬"
      },
      {
        code: "AI",
        unicode: "U+1F1E6 U+1F1EE",
        name: "Anguilla",
        emoji: "🇦🇮"
      },
      {
        code: "AL",
        unicode: "U+1F1E6 U+1F1F1",
        name: "Albania",
        emoji: "🇦🇱"
      },
      {
        code: "AM",
        unicode: "U+1F1E6 U+1F1F2",
        name: "Armenia",
        emoji: "🇦🇲"
      },
      {
        code: "AO",
        unicode: "U+1F1E6 U+1F1F4",
        name: "Angola",
        emoji: "🇦🇴"
      },
      {
        code: "AQ",
        unicode: "U+1F1E6 U+1F1F6",
        name: "Antarctica",
        emoji: "🇦🇶"
      },
      {
        code: "AR",
        unicode: "U+1F1E6 U+1F1F7",
        name: "Argentina",
        emoji: "🇦🇷"
      },
      {
        code: "AS",
        unicode: "U+1F1E6 U+1F1F8",
        name: "American Samoa",
        emoji: "🇦🇸"
      },
      {
        code: "AT",
        unicode: "U+1F1E6 U+1F1F9",
        name: "Austria",
        emoji: "🇦🇹"
      },
      {
        code: "AU",
        unicode: "U+1F1E6 U+1F1FA",
        name: "Australia",
        emoji: "🇦🇺"
      },
      {
        code: "AW",
        unicode: "U+1F1E6 U+1F1FC",
        name: "Aruba",
        emoji: "🇦🇼"
      },
      {
        code: "AX",
        unicode: "U+1F1E6 U+1F1FD",
        name: "Åland Islands",
        emoji: "🇦🇽"
      },
      {
        code: "AZ",
        unicode: "U+1F1E6 U+1F1FF",
        name: "Azerbaijan",
        emoji: "🇦🇿"
      },
      {
        code: "BA",
        unicode: "U+1F1E7 U+1F1E6",
        name: "Bosnia & Herzegovina",
        emoji: "🇧🇦"
      },
      {
        code: "BB",
        unicode: "U+1F1E7 U+1F1E7",
        name: "Barbados",
        emoji: "🇧🇧"
      },
      {
        code: "BD",
        unicode: "U+1F1E7 U+1F1E9",
        name: "Bangladesh",
        emoji: "🇧🇩"
      },
      {
        code: "BE",
        unicode: "U+1F1E7 U+1F1EA",
        name: "Belgium",
        emoji: "🇧🇪"
      },
      {
        code: "BF",
        unicode: "U+1F1E7 U+1F1EB",
        name: "Burkina Faso",
        emoji: "🇧🇫"
      },
      {
        code: "BG",
        unicode: "U+1F1E7 U+1F1EC",
        name: "Bulgaria",
        emoji: "🇧🇬"
      },
      {
        code: "BH",
        unicode: "U+1F1E7 U+1F1ED",
        name: "Bahrain",
        emoji: "🇧🇭"
      },
      {
        code: "BI",
        unicode: "U+1F1E7 U+1F1EE",
        name: "Burundi",
        emoji: "🇧🇮"
      },
      {
        code: "BJ",
        unicode: "U+1F1E7 U+1F1EF",
        name: "Benin",
        emoji: "🇧🇯"
      },
      {
        code: "BL",
        unicode: "U+1F1E7 U+1F1F1",
        name: "St. Barthélemy",
        emoji: "🇧🇱"
      },
      {
        code: "BM",
        unicode: "U+1F1E7 U+1F1F2",
        name: "Bermuda",
        emoji: "🇧🇲"
      },
      {
        code: "BN",
        unicode: "U+1F1E7 U+1F1F3",
        name: "Brunei",
        emoji: "🇧🇳"
      },
      {
        code: "BO",
        unicode: "U+1F1E7 U+1F1F4",
        name: "Bolivia",
        emoji: "🇧🇴"
      },
      {
        code: "BQ",
        unicode: "U+1F1E7 U+1F1F6",
        name: "Caribbean Netherlands",
        emoji: "🇧🇶"
      },
      {
        code: "BR",
        unicode: "U+1F1E7 U+1F1F7",
        name: "Brazil",
        emoji: "🇧🇷"
      },
      {
        code: "BS",
        unicode: "U+1F1E7 U+1F1F8",
        name: "Bahamas",
        emoji: "🇧🇸"
      },
      {
        code: "BT",
        unicode: "U+1F1E7 U+1F1F9",
        name: "Bhutan",
        emoji: "🇧🇹"
      },
      {
        code: "BV",
        unicode: "U+1F1E7 U+1F1FB",
        name: "Bouvet Island",
        emoji: "🇧🇻"
      },
      {
        code: "BW",
        unicode: "U+1F1E7 U+1F1FC",
        name: "Botswana",
        emoji: "🇧🇼"
      },
      {
        code: "BY",
        unicode: "U+1F1E7 U+1F1FE",
        name: "Belarus",
        emoji: "🇧🇾"
      },
      {
        code: "BZ",
        unicode: "U+1F1E7 U+1F1FF",
        name: "Belize",
        emoji: "🇧🇿"
      },
      {
        code: "CA",
        unicode: "U+1F1E8 U+1F1E6",
        name: "Canada",
        emoji: "🇨🇦"
      },
      {
        code: "CC",
        unicode: "U+1F1E8 U+1F1E8",
        name: "Cocos (Keeling) Islands",
        emoji: "🇨🇨"
      },
      {
        code: "CD",
        unicode: "U+1F1E8 U+1F1E9",
        name: "Congo - Kinshasa",
        emoji: "🇨🇩"
      },
      {
        code: "CF",
        unicode: "U+1F1E8 U+1F1EB",
        name: "Central African Republic",
        emoji: "🇨🇫"
      },
      {
        code: "CG",
        unicode: "U+1F1E8 U+1F1EC",
        name: "Congo - Brazzaville",
        emoji: "🇨🇬"
      },
      {
        code: "CH",
        unicode: "U+1F1E8 U+1F1ED",
        name: "Switzerland",
        emoji: "🇨🇭"
      },
      {
        code: "CI",
        unicode: "U+1F1E8 U+1F1EE",
        name: "Côte d’Ivoire",
        emoji: "🇨🇮"
      },
      {
        code: "CK",
        unicode: "U+1F1E8 U+1F1F0",
        name: "Cook Islands",
        emoji: "🇨🇰"
      },
      {
        code: "CL",
        unicode: "U+1F1E8 U+1F1F1",
        name: "Chile",
        emoji: "🇨🇱"
      },
      {
        code: "CM",
        unicode: "U+1F1E8 U+1F1F2",
        name: "Cameroon",
        emoji: "🇨🇲"
      },
      {
        code: "CN",
        unicode: "U+1F1E8 U+1F1F3",
        name: "China",
        emoji: "🇨🇳"
      },
      {
        code: "CO",
        unicode: "U+1F1E8 U+1F1F4",
        name: "Colombia",
        emoji: "🇨🇴"
      },
      {
        code: "CP",
        unicode: "U+1F1E8 U+1F1F5",
        name: "Clipperton Island",
        emoji: "🇨🇵"
      },
      {
        code: "CR",
        unicode: "U+1F1E8 U+1F1F7",
        name: "Costa Rica",
        emoji: "🇨🇷"
      },
      {
        code: "CU",
        unicode: "U+1F1E8 U+1F1FA",
        name: "Cuba",
        emoji: "🇨🇺"
      },
      {
        code: "CV",
        unicode: "U+1F1E8 U+1F1FB",
        name: "Cape Verde",
        emoji: "🇨🇻"
      },
      {
        code: "CW",
        unicode: "U+1F1E8 U+1F1FC",
        name: "Curaçao",
        emoji: "🇨🇼"
      },
      {
        code: "CX",
        unicode: "U+1F1E8 U+1F1FD",
        name: "Christmas Island",
        emoji: "🇨🇽"
      },
      {
        code: "CY",
        unicode: "U+1F1E8 U+1F1FE",
        name: "Cyprus",
        emoji: "🇨🇾"
      },
      {
        code: "CZ",
        unicode: "U+1F1E8 U+1F1FF",
        name: "Czechia",
        emoji: "🇨🇿"
      },
      {
        code: "DE",
        unicode: "U+1F1E9 U+1F1EA",
        name: "Germany",
        emoji: "🇩🇪"
      },
      {
        code: "DG",
        unicode: "U+1F1E9 U+1F1EC",
        name: "Diego Garcia",
        emoji: "🇩🇬"
      },
      {
        code: "DJ",
        unicode: "U+1F1E9 U+1F1EF",
        name: "Djibouti",
        emoji: "🇩🇯"
      },
      {
        code: "DK",
        unicode: "U+1F1E9 U+1F1F0",
        name: "Denmark",
        emoji: "🇩🇰"
      },
      {
        code: "DM",
        unicode: "U+1F1E9 U+1F1F2",
        name: "Dominica",
        emoji: "🇩🇲"
      },
      {
        code: "DO",
        unicode: "U+1F1E9 U+1F1F4",
        name: "Dominican Republic",
        emoji: "🇩🇴"
      },
      {
        code: "DZ",
        unicode: "U+1F1E9 U+1F1FF",
        name: "Algeria",
        emoji: "🇩🇿"
      },
      {
        code: "EA",
        unicode: "U+1F1EA U+1F1E6",
        name: "Ceuta & Melilla",
        emoji: "🇪🇦"
      },
      {
        code: "EC",
        unicode: "U+1F1EA U+1F1E8",
        name: "Ecuador",
        emoji: "🇪🇨"
      },
      {
        code: "EE",
        unicode: "U+1F1EA U+1F1EA",
        name: "Estonia",
        emoji: "🇪🇪"
      },
      {
        code: "EG",
        unicode: "U+1F1EA U+1F1EC",
        name: "Egypt",
        emoji: "🇪🇬"
      },
      {
        code: "EH",
        unicode: "U+1F1EA U+1F1ED",
        name: "Western Sahara",
        emoji: "🇪🇭"
      },
      {
        code: "ER",
        unicode: "U+1F1EA U+1F1F7",
        name: "Eritrea",
        emoji: "🇪🇷"
      },
      {
        code: "ES",
        unicode: "U+1F1EA U+1F1F8",
        name: "Spain",
        emoji: "🇪🇸"
      },
      {
        code: "ET",
        unicode: "U+1F1EA U+1F1F9",
        name: "Ethiopia",
        emoji: "🇪🇹"
      },
      {
        code: "EU",
        unicode: "U+1F1EA U+1F1FA",
        name: "European Union",
        emoji: "🇪🇺"
      },
      {
        code: "FI",
        unicode: "U+1F1EB U+1F1EE",
        name: "Finland",
        emoji: "🇫🇮"
      },
      {
        code: "FJ",
        unicode: "U+1F1EB U+1F1EF",
        name: "Fiji",
        emoji: "🇫🇯"
      },
      {
        code: "FK",
        unicode: "U+1F1EB U+1F1F0",
        name: "Falkland Islands",
        emoji: "🇫🇰"
      },
      {
        code: "FM",
        unicode: "U+1F1EB U+1F1F2",
        name: "Micronesia",
        emoji: "🇫🇲"
      },
      {
        code: "FO",
        unicode: "U+1F1EB U+1F1F4",
        name: "Faroe Islands",
        emoji: "🇫🇴"
      },
      {
        code: "FR",
        unicode: "U+1F1EB U+1F1F7",
        name: "France",
        emoji: "🇫🇷"
      },
      {
        code: "GA",
        unicode: "U+1F1EC U+1F1E6",
        name: "Gabon",
        emoji: "🇬🇦"
      },
      {
        code: "GB",
        unicode: "U+1F1EC U+1F1E7",
        name: "United Kingdom",
        emoji: "🇬🇧"
      },
      {
        code: "GD",
        unicode: "U+1F1EC U+1F1E9",
        name: "Grenada",
        emoji: "🇬🇩"
      },
      {
        code: "GE",
        unicode: "U+1F1EC U+1F1EA",
        name: "Georgia",
        emoji: "🇬🇪"
      },
      {
        code: "GF",
        unicode: "U+1F1EC U+1F1EB",
        name: "French Guiana",
        emoji: "🇬🇫"
      },
      {
        code: "GG",
        unicode: "U+1F1EC U+1F1EC",
        name: "Guernsey",
        emoji: "🇬🇬"
      },
      {
        code: "GH",
        unicode: "U+1F1EC U+1F1ED",
        name: "Ghana",
        emoji: "🇬🇭"
      },
      {
        code: "GI",
        unicode: "U+1F1EC U+1F1EE",
        name: "Gibraltar",
        emoji: "🇬🇮"
      },
      {
        code: "GL",
        unicode: "U+1F1EC U+1F1F1",
        name: "Greenland",
        emoji: "🇬🇱"
      },
      {
        code: "GM",
        unicode: "U+1F1EC U+1F1F2",
        name: "Gambia",
        emoji: "🇬🇲"
      },
      {
        code: "GN",
        unicode: "U+1F1EC U+1F1F3",
        name: "Guinea",
        emoji: "🇬🇳"
      },
      {
        code: "GP",
        unicode: "U+1F1EC U+1F1F5",
        name: "Guadeloupe",
        emoji: "🇬🇵"
      },
      {
        code: "GQ",
        unicode: "U+1F1EC U+1F1F6",
        name: "Equatorial Guinea",
        emoji: "🇬🇶"
      },
      {
        code: "GR",
        unicode: "U+1F1EC U+1F1F7",
        name: "Greece",
        emoji: "🇬🇷"
      },
      {
        code: "GS",
        unicode: "U+1F1EC U+1F1F8",
        name: "South Georgia & South Sandwich Islands",
        emoji: "🇬🇸"
      },
      {
        code: "GT",
        unicode: "U+1F1EC U+1F1F9",
        name: "Guatemala",
        emoji: "🇬🇹"
      },
      {
        code: "GU",
        unicode: "U+1F1EC U+1F1FA",
        name: "Guam",
        emoji: "🇬🇺"
      },
      {
        code: "GW",
        unicode: "U+1F1EC U+1F1FC",
        name: "Guinea-Bissau",
        emoji: "🇬🇼"
      },
      {
        code: "GY",
        unicode: "U+1F1EC U+1F1FE",
        name: "Guyana",
        emoji: "🇬🇾"
      },
      {
        code: "HK",
        unicode: "U+1F1ED U+1F1F0",
        name: "Hong Kong SAR China",
        emoji: "🇭🇰"
      },
      {
        code: "HM",
        unicode: "U+1F1ED U+1F1F2",
        name: "Heard & McDonald Islands",
        emoji: "🇭🇲"
      },
      {
        code: "HN",
        unicode: "U+1F1ED U+1F1F3",
        name: "Honduras",
        emoji: "🇭🇳"
      },
      {
        code: "HR",
        unicode: "U+1F1ED U+1F1F7",
        name: "Croatia",
        emoji: "🇭🇷"
      },
      {
        code: "HT",
        unicode: "U+1F1ED U+1F1F9",
        name: "Haiti",
        emoji: "🇭🇹"
      },
      {
        code: "HU",
        unicode: "U+1F1ED U+1F1FA",
        name: "Hungary",
        emoji: "🇭🇺"
      },
      {
        code: "IC",
        unicode: "U+1F1EE U+1F1E8",
        name: "Canary Islands",
        emoji: "🇮🇨"
      },
      {
        code: "ID",
        unicode: "U+1F1EE U+1F1E9",
        name: "Indonesia",
        emoji: "🇮🇩"
      },
      {
        code: "IE",
        unicode: "U+1F1EE U+1F1EA",
        name: "Ireland",
        emoji: "🇮🇪"
      },
      {
        code: "IL",
        unicode: "U+1F1EE U+1F1F1",
        name: "Israel",
        emoji: "🇮🇱"
      },
      {
        code: "IM",
        unicode: "U+1F1EE U+1F1F2",
        name: "Isle of Man",
        emoji: "🇮🇲"
      },
      {
        code: "IN",
        unicode: "U+1F1EE U+1F1F3",
        name: "India",
        emoji: "🇮🇳"
      },
      {
        code: "IO",
        unicode: "U+1F1EE U+1F1F4",
        name: "British Indian Ocean Territory",
        emoji: "🇮🇴"
      },
      {
        code: "IQ",
        unicode: "U+1F1EE U+1F1F6",
        name: "Iraq",
        emoji: "🇮🇶"
      },
      {
        code: "IR",
        unicode: "U+1F1EE U+1F1F7",
        name: "Iran",
        emoji: "🇮🇷"
      },
      {
        code: "IS",
        unicode: "U+1F1EE U+1F1F8",
        name: "Iceland",
        emoji: "🇮🇸"
      },
      {
        code: "IT",
        unicode: "U+1F1EE U+1F1F9",
        name: "Italy",
        emoji: "🇮🇹"
      },
      {
        code: "JE",
        unicode: "U+1F1EF U+1F1EA",
        name: "Jersey",
        emoji: "🇯🇪"
      },
      {
        code: "JM",
        unicode: "U+1F1EF U+1F1F2",
        name: "Jamaica",
        emoji: "🇯🇲"
      },
      {
        code: "JO",
        unicode: "U+1F1EF U+1F1F4",
        name: "Jordan",
        emoji: "🇯🇴"
      },
      {
        code: "JP",
        unicode: "U+1F1EF U+1F1F5",
        name: "Japan",
        emoji: "🇯🇵"
      },
      {
        code: "KE",
        unicode: "U+1F1F0 U+1F1EA",
        name: "Kenya",
        emoji: "🇰🇪"
      },
      {
        code: "KG",
        unicode: "U+1F1F0 U+1F1EC",
        name: "Kyrgyzstan",
        emoji: "🇰🇬"
      },
      {
        code: "KH",
        unicode: "U+1F1F0 U+1F1ED",
        name: "Cambodia",
        emoji: "🇰🇭"
      },
      {
        code: "KI",
        unicode: "U+1F1F0 U+1F1EE",
        name: "Kiribati",
        emoji: "🇰🇮"
      },
      {
        code: "KM",
        unicode: "U+1F1F0 U+1F1F2",
        name: "Comoros",
        emoji: "🇰🇲"
      },
      {
        code: "KN",
        unicode: "U+1F1F0 U+1F1F3",
        name: "St. Kitts & Nevis",
        emoji: "🇰🇳"
      },
      {
        code: "KP",
        unicode: "U+1F1F0 U+1F1F5",
        name: "North Korea",
        emoji: "🇰🇵"
      },
      {
        code: "KR",
        unicode: "U+1F1F0 U+1F1F7",
        name: "South Korea",
        emoji: "🇰🇷"
      },
      {
        code: "KW",
        unicode: "U+1F1F0 U+1F1FC",
        name: "Kuwait",
        emoji: "🇰🇼"
      },
      {
        code: "KY",
        unicode: "U+1F1F0 U+1F1FE",
        name: "Cayman Islands",
        emoji: "🇰🇾"
      },
      {
        code: "KZ",
        unicode: "U+1F1F0 U+1F1FF",
        name: "Kazakhstan",
        emoji: "🇰🇿"
      },
      {
        code: "LA",
        unicode: "U+1F1F1 U+1F1E6",
        name: "Laos",
        emoji: "🇱🇦"
      },
      {
        code: "LB",
        unicode: "U+1F1F1 U+1F1E7",
        name: "Lebanon",
        emoji: "🇱🇧"
      },
      {
        code: "LC",
        unicode: "U+1F1F1 U+1F1E8",
        name: "St. Lucia",
        emoji: "🇱🇨"
      },
      {
        code: "LI",
        unicode: "U+1F1F1 U+1F1EE",
        name: "Liechtenstein",
        emoji: "🇱🇮"
      },
      {
        code: "LK",
        unicode: "U+1F1F1 U+1F1F0",
        name: "Sri Lanka",
        emoji: "🇱🇰"
      },
      {
        code: "LR",
        unicode: "U+1F1F1 U+1F1F7",
        name: "Liberia",
        emoji: "🇱🇷"
      },
      {
        code: "LS",
        unicode: "U+1F1F1 U+1F1F8",
        name: "Lesotho",
        emoji: "🇱🇸"
      },
      {
        code: "LT",
        unicode: "U+1F1F1 U+1F1F9",
        name: "Lithuania",
        emoji: "🇱🇹"
      },
      {
        code: "LU",
        unicode: "U+1F1F1 U+1F1FA",
        name: "Luxembourg",
        emoji: "🇱🇺"
      },
      {
        code: "LV",
        unicode: "U+1F1F1 U+1F1FB",
        name: "Latvia",
        emoji: "🇱🇻"
      },
      {
        code: "LY",
        unicode: "U+1F1F1 U+1F1FE",
        name: "Libya",
        emoji: "🇱🇾"
      },
      {
        code: "MA",
        unicode: "U+1F1F2 U+1F1E6",
        name: "Morocco",
        emoji: "🇲🇦"
      },
      {
        code: "MC",
        unicode: "U+1F1F2 U+1F1E8",
        name: "Monaco",
        emoji: "🇲🇨"
      },
      {
        code: "MD",
        unicode: "U+1F1F2 U+1F1E9",
        name: "Moldova",
        emoji: "🇲🇩"
      },
      {
        code: "ME",
        unicode: "U+1F1F2 U+1F1EA",
        name: "Montenegro",
        emoji: "🇲🇪"
      },
      {
        code: "MF",
        unicode: "U+1F1F2 U+1F1EB",
        name: "St. Martin",
        emoji: "🇲🇫"
      },
      {
        code: "MG",
        unicode: "U+1F1F2 U+1F1EC",
        name: "Madagascar",
        emoji: "🇲🇬"
      },
      {
        code: "MH",
        unicode: "U+1F1F2 U+1F1ED",
        name: "Marshall Islands",
        emoji: "🇲🇭"
      },
      {
        code: "MK",
        unicode: "U+1F1F2 U+1F1F0",
        name: "Macedonia",
        emoji: "🇲🇰"
      },
      {
        code: "ML",
        unicode: "U+1F1F2 U+1F1F1",
        name: "Mali",
        emoji: "🇲🇱"
      },
      {
        code: "MM",
        unicode: "U+1F1F2 U+1F1F2",
        name: "Myanmar (Burma)",
        emoji: "🇲🇲"
      },
      {
        code: "MN",
        unicode: "U+1F1F2 U+1F1F3",
        name: "Mongolia",
        emoji: "🇲🇳"
      },
      {
        code: "MO",
        unicode: "U+1F1F2 U+1F1F4",
        name: "Macau SAR China",
        emoji: "🇲🇴"
      },
      {
        code: "MP",
        unicode: "U+1F1F2 U+1F1F5",
        name: "Northern Mariana Islands",
        emoji: "🇲🇵"
      },
      {
        code: "MQ",
        unicode: "U+1F1F2 U+1F1F6",
        name: "Martinique",
        emoji: "🇲🇶"
      },
      {
        code: "MR",
        unicode: "U+1F1F2 U+1F1F7",
        name: "Mauritania",
        emoji: "🇲🇷"
      },
      {
        code: "MS",
        unicode: "U+1F1F2 U+1F1F8",
        name: "Montserrat",
        emoji: "🇲🇸"
      },
      {
        code: "MT",
        unicode: "U+1F1F2 U+1F1F9",
        name: "Malta",
        emoji: "🇲🇹"
      },
      {
        code: "MU",
        unicode: "U+1F1F2 U+1F1FA",
        name: "Mauritius",
        emoji: "🇲🇺"
      },
      {
        code: "MV",
        unicode: "U+1F1F2 U+1F1FB",
        name: "Maldives",
        emoji: "🇲🇻"
      },
      {
        code: "MW",
        unicode: "U+1F1F2 U+1F1FC",
        name: "Malawi",
        emoji: "🇲🇼"
      },
      {
        code: "MX",
        unicode: "U+1F1F2 U+1F1FD",
        name: "Mexico",
        emoji: "🇲🇽"
      },
      {
        code: "MY",
        unicode: "U+1F1F2 U+1F1FE",
        name: "Malaysia",
        emoji: "🇲🇾"
      },
      {
        code: "MZ",
        unicode: "U+1F1F2 U+1F1FF",
        name: "Mozambique",
        emoji: "🇲🇿"
      },
      {
        code: "NA",
        unicode: "U+1F1F3 U+1F1E6",
        name: "Namibia",
        emoji: "🇳🇦"
      },
      {
        code: "NC",
        unicode: "U+1F1F3 U+1F1E8",
        name: "New Caledonia",
        emoji: "🇳🇨"
      },
      {
        code: "NE",
        unicode: "U+1F1F3 U+1F1EA",
        name: "Niger",
        emoji: "🇳🇪"
      },
      {
        code: "NF",
        unicode: "U+1F1F3 U+1F1EB",
        name: "Norfolk Island",
        emoji: "🇳🇫"
      },
      {
        code: "NG",
        unicode: "U+1F1F3 U+1F1EC",
        name: "Nigeria",
        emoji: "🇳🇬"
      },
      {
        code: "NI",
        unicode: "U+1F1F3 U+1F1EE",
        name: "Nicaragua",
        emoji: "🇳🇮"
      },
      {
        code: "NL",
        unicode: "U+1F1F3 U+1F1F1",
        name: "Netherlands",
        emoji: "🇳🇱"
      },
      {
        code: "NO",
        unicode: "U+1F1F3 U+1F1F4",
        name: "Norway",
        emoji: "🇳🇴"
      },
      {
        code: "NP",
        unicode: "U+1F1F3 U+1F1F5",
        name: "Nepal",
        emoji: "🇳🇵"
      },
      {
        code: "NR",
        unicode: "U+1F1F3 U+1F1F7",
        name: "Nauru",
        emoji: "🇳🇷"
      },
      {
        code: "NU",
        unicode: "U+1F1F3 U+1F1FA",
        name: "Niue",
        emoji: "🇳🇺"
      },
      {
        code: "NZ",
        unicode: "U+1F1F3 U+1F1FF",
        name: "New Zealand",
        emoji: "🇳🇿"
      },
      {
        code: "OM",
        unicode: "U+1F1F4 U+1F1F2",
        name: "Oman",
        emoji: "🇴🇲"
      },
      {
        code: "PA",
        unicode: "U+1F1F5 U+1F1E6",
        name: "Panama",
        emoji: "🇵🇦"
      },
      {
        code: "PE",
        unicode: "U+1F1F5 U+1F1EA",
        name: "Peru",
        emoji: "🇵🇪"
      },
      {
        code: "PF",
        unicode: "U+1F1F5 U+1F1EB",
        name: "French Polynesia",
        emoji: "🇵🇫"
      },
      {
        code: "PG",
        unicode: "U+1F1F5 U+1F1EC",
        name: "Papua New Guinea",
        emoji: "🇵🇬"
      },
      {
        code: "PH",
        unicode: "U+1F1F5 U+1F1ED",
        name: "Philippines",
        emoji: "🇵🇭"
      },
      {
        code: "PK",
        unicode: "U+1F1F5 U+1F1F0",
        name: "Pakistan",
        emoji: "🇵🇰"
      },
      {
        code: "PL",
        unicode: "U+1F1F5 U+1F1F1",
        name: "Poland",
        emoji: "🇵🇱"
      },
      {
        code: "PM",
        unicode: "U+1F1F5 U+1F1F2",
        name: "St. Pierre & Miquelon",
        emoji: "🇵🇲"
      },
      {
        code: "PN",
        unicode: "U+1F1F5 U+1F1F3",
        name: "Pitcairn Islands",
        emoji: "🇵🇳"
      },
      {
        code: "PR",
        unicode: "U+1F1F5 U+1F1F7",
        name: "Puerto Rico",
        emoji: "🇵🇷"
      },
      {
        code: "PS",
        unicode: "U+1F1F5 U+1F1F8",
        name: "Palestinian Territories",
        emoji: "🇵🇸"
      },
      {
        code: "PT",
        unicode: "U+1F1F5 U+1F1F9",
        name: "Portugal",
        emoji: "🇵🇹"
      },
      {
        code: "PW",
        unicode: "U+1F1F5 U+1F1FC",
        name: "Palau",
        emoji: "🇵🇼"
      },
      {
        code: "PY",
        unicode: "U+1F1F5 U+1F1FE",
        name: "Paraguay",
        emoji: "🇵🇾"
      },
      {
        code: "QA",
        unicode: "U+1F1F6 U+1F1E6",
        name: "Qatar",
        emoji: "🇶🇦"
      },
      {
        code: "RE",
        unicode: "U+1F1F7 U+1F1EA",
        name: "Réunion",
        emoji: "🇷🇪"
      },
      {
        code: "RO",
        unicode: "U+1F1F7 U+1F1F4",
        name: "Romania",
        emoji: "🇷🇴"
      },
      {
        code: "RS",
        unicode: "U+1F1F7 U+1F1F8",
        name: "Serbia",
        emoji: "🇷🇸"
      },
      {
        code: "RU",
        unicode: "U+1F1F7 U+1F1FA",
        name: "Russia",
        emoji: "🇷🇺"
      },
      {
        code: "RW",
        unicode: "U+1F1F7 U+1F1FC",
        name: "Rwanda",
        emoji: "🇷🇼"
      },
      {
        code: "SA",
        unicode: "U+1F1F8 U+1F1E6",
        name: "Saudi Arabia",
        emoji: "🇸🇦"
      },
      {
        code: "SB",
        unicode: "U+1F1F8 U+1F1E7",
        name: "Solomon Islands",
        emoji: "🇸🇧"
      },
      {
        code: "SC",
        unicode: "U+1F1F8 U+1F1E8",
        name: "Seychelles",
        emoji: "🇸🇨"
      },
      {
        code: "SD",
        unicode: "U+1F1F8 U+1F1E9",
        name: "Sudan",
        emoji: "🇸🇩"
      },
      {
        code: "SE",
        unicode: "U+1F1F8 U+1F1EA",
        name: "Sweden",
        emoji: "🇸🇪"
      },
      {
        code: "SG",
        unicode: "U+1F1F8 U+1F1EC",
        name: "Singapore",
        emoji: "🇸🇬"
      },
      {
        code: "SH",
        unicode: "U+1F1F8 U+1F1ED",
        name: "St. Helena",
        emoji: "🇸🇭"
      },
      {
        code: "SI",
        unicode: "U+1F1F8 U+1F1EE",
        name: "Slovenia",
        emoji: "🇸🇮"
      },
      {
        code: "SJ",
        unicode: "U+1F1F8 U+1F1EF",
        name: "Svalbard & Jan Mayen",
        emoji: "🇸🇯"
      },
      {
        code: "SK",
        unicode: "U+1F1F8 U+1F1F0",
        name: "Slovakia",
        emoji: "🇸🇰"
      },
      {
        code: "SL",
        unicode: "U+1F1F8 U+1F1F1",
        name: "Sierra Leone",
        emoji: "🇸🇱"
      },
      {
        code: "SM",
        unicode: "U+1F1F8 U+1F1F2",
        name: "San Marino",
        emoji: "🇸🇲"
      },
      {
        code: "SN",
        unicode: "U+1F1F8 U+1F1F3",
        name: "Senegal",
        emoji: "🇸🇳"
      },
      {
        code: "SO",
        unicode: "U+1F1F8 U+1F1F4",
        name: "Somalia",
        emoji: "🇸🇴"
      },
      {
        code: "SR",
        unicode: "U+1F1F8 U+1F1F7",
        name: "Suriname",
        emoji: "🇸🇷"
      },
      {
        code: "SS",
        unicode: "U+1F1F8 U+1F1F8",
        name: "South Sudan",
        emoji: "🇸🇸"
      },
      {
        code: "ST",
        unicode: "U+1F1F8 U+1F1F9",
        name: "São Tomé & Príncipe",
        emoji: "🇸🇹"
      },
      {
        code: "SV",
        unicode: "U+1F1F8 U+1F1FB",
        name: "El Salvador",
        emoji: "🇸🇻"
      },
      {
        code: "SX",
        unicode: "U+1F1F8 U+1F1FD",
        name: "Sint Maarten",
        emoji: "🇸🇽"
      },
      {
        code: "SY",
        unicode: "U+1F1F8 U+1F1FE",
        name: "Syria",
        emoji: "🇸🇾"
      },
      {
        code: "SZ",
        unicode: "U+1F1F8 U+1F1FF",
        name: "Swaziland",
        emoji: "🇸🇿"
      },
      {
        code: "TA",
        unicode: "U+1F1F9 U+1F1E6",
        name: "Tristan da Cunha",
        emoji: "🇹🇦"
      },
      {
        code: "TC",
        unicode: "U+1F1F9 U+1F1E8",
        name: "Turks & Caicos Islands",
        emoji: "🇹🇨"
      },
      {
        code: "TD",
        unicode: "U+1F1F9 U+1F1E9",
        name: "Chad",
        emoji: "🇹🇩"
      },
      {
        code: "TF",
        unicode: "U+1F1F9 U+1F1EB",
        name: "French Southern Territories",
        emoji: "🇹🇫"
      },
      {
        code: "TG",
        unicode: "U+1F1F9 U+1F1EC",
        name: "Togo",
        emoji: "🇹🇬"
      },
      {
        code: "TH",
        unicode: "U+1F1F9 U+1F1ED",
        name: "Thailand",
        emoji: "🇹🇭"
      },
      {
        code: "TJ",
        unicode: "U+1F1F9 U+1F1EF",
        name: "Tajikistan",
        emoji: "🇹🇯"
      },
      {
        code: "TK",
        unicode: "U+1F1F9 U+1F1F0",
        name: "Tokelau",
        emoji: "🇹🇰"
      },
      {
        code: "TL",
        unicode: "U+1F1F9 U+1F1F1",
        name: "Timor-Leste",
        emoji: "🇹🇱"
      },
      {
        code: "TM",
        unicode: "U+1F1F9 U+1F1F2",
        name: "Turkmenistan",
        emoji: "🇹🇲"
      },
      {
        code: "TN",
        unicode: "U+1F1F9 U+1F1F3",
        name: "Tunisia",
        emoji: "🇹🇳"
      },
      {
        code: "TO",
        unicode: "U+1F1F9 U+1F1F4",
        name: "Tonga",
        emoji: "🇹🇴"
      },
      {
        code: "TR",
        unicode: "U+1F1F9 U+1F1F7",
        name: "Turkey",
        emoji: "🇹🇷"
      },
      {
        code: "TT",
        unicode: "U+1F1F9 U+1F1F9",
        name: "Trinidad & Tobago",
        emoji: "🇹🇹"
      },
      {
        code: "TV",
        unicode: "U+1F1F9 U+1F1FB",
        name: "Tuvalu",
        emoji: "🇹🇻"
      },
      {
        code: "TW",
        unicode: "U+1F1F9 U+1F1FC",
        name: "Taiwan",
        emoji: "🇹🇼"
      },
      {
        code: "TZ",
        unicode: "U+1F1F9 U+1F1FF",
        name: "Tanzania",
        emoji: "🇹🇿"
      },
      {
        code: "UA",
        unicode: "U+1F1FA U+1F1E6",
        name: "Ukraine",
        emoji: "🇺🇦"
      },
      {
        code: "UG",
        unicode: "U+1F1FA U+1F1EC",
        name: "Uganda",
        emoji: "🇺🇬"
      },
      {
        code: "UM",
        unicode: "U+1F1FA U+1F1F2",
        name: "U.S. Outlying Islands",
        emoji: "🇺🇲"
      },     
      {
        code: "US",
        unicode: "U+1F1FA U+1F1F8",
        name: "United States",
        emoji: "🇺🇸"
      },
      {
        code: "UY",
        unicode: "U+1F1FA U+1F1FE",
        name: "Uruguay",
        emoji: "🇺🇾"
      },
      {
        code: "UZ",
        unicode: "U+1F1FA U+1F1FF",
        name: "Uzbekistan",
        emoji: "🇺🇿"
      },
      {
        code: "VA",
        unicode: "U+1F1FB U+1F1E6",
        name: "Vatican City",
        emoji: "🇻🇦"
      },
      {
        code: "VC",
        unicode: "U+1F1FB U+1F1E8",
        name: "St. Vincent & Grenadines",
        emoji: "🇻🇨"
      },
      {
        code: "VE",
        unicode: "U+1F1FB U+1F1EA",
        name: "Venezuela",
        emoji: "🇻🇪"
      },
      {
        code: "VG",
        unicode: "U+1F1FB U+1F1EC",
        name: "British Virgin Islands",
        emoji: "🇻🇬"
      },
      {
        code: "VI",
        unicode: "U+1F1FB U+1F1EE",
        name: "U.S. Virgin Islands",
        emoji: "🇻🇮"
      },
      {
        code: "VN",
        unicode: "U+1F1FB U+1F1F3",
        name: "Vietnam",
        emoji: "🇻🇳"
      },
      {
        code: "VU",
        unicode: "U+1F1FB U+1F1FA",
        name: "Vanuatu",
        emoji: "🇻🇺"
      },
      {
        code: "WF",
        unicode: "U+1F1FC U+1F1EB",
        name: "Wallis & Futuna",
        emoji: "🇼🇫"
      },
      {
        code: "WS",
        unicode: "U+1F1FC U+1F1F8",
        name: "Samoa",
        emoji: "🇼🇸"
      },
      {
        code: "XK",
        unicode: "U+1F1FD U+1F1F0",
        name: "Kosovo",
        emoji: "🇽🇰"
      },
      {
        code: "YE",
        unicode: "U+1F1FE U+1F1EA",
        name: "Yemen",
        emoji: "🇾🇪"
      },
      {
        code: "YT",
        unicode: "U+1F1FE U+1F1F9",
        name: "Mayotte",
        emoji: "🇾🇹"
      },
      {
        code: "ZA",
        unicode: "U+1F1FF U+1F1E6",
        name: "South Africa",
        emoji: "🇿🇦"
      },
      {
        code: "ZM",
        unicode: "U+1F1FF U+1F1F2",
        name: "Zambia",
        emoji: "🇿🇲"
      },
      {
        code: "ZW",
        unicode: "U+1F1FF U+1F1FC",
        name: "Zimbabwe",
        emoji: "🇿🇼"
      }
    ]
    ann.sortJson(country_data,'name')
    return country_data;
}

ann.getColors = async function getColors() {
  var colorset = [
     {
      "hex": "#FFFFFF",
      "contrast": "#000000",
      "mood": "Bright"
    },
    {
      "hex": "#E6FFFF",
      "contrast": "#545454",
      "mood": "Tranquil"
    },
    {
      "hex": "#9EDEE0",
      "contrast": "#372C2C",
      "mood": "Morning Glory"
    },
    {
      "hex": "#D2F8B0",
      "contrast": "#821C1C",
      "mood": "Gossip"
    },
    {
      "hex": "#C1A004",
      "contrast": "#040404",
      "mood": "Buddha Gold"
    },
    {
      "hex": "#33CC99",
      "contrast": "#1E1818",
      "mood": "Shamrock"
    },
    {
      "hex": "#377475",
      "contrast": "#FFFFF1",
      "mood": "Oracle"
    },
    {
      "hex": "#016D39",
      "contrast": "#5EF390",
      "mood": "Fun Green"
    },
    {
      "hex": "#327DA0",
      "contrast": "#FFFFFF",
      "mood": "Thunder"
    },
    {
      "hex": "#0066CC",
      "contrast": "#FFFFFF",
      "mood": "Science Blue"
    },
    {
      "hex": "#2F519E",
      "contrast": "#FFFFFF",
      "mood": "Saphire"
    },
    {
      "hex": "#F091A9",
      "contrast": "#130F0F",
      "mood": "Mauvelous"
    },
    {
      "hex": "#AE4560",
      "contrast": "#FFFFFF",
      "mood": "Hippie Pink"
    },
    {
      "hex": "#AB0563",
      "contrast": "#FFFFFF",
      "mood": "Lipstick"
    },
    {
      "hex": "#C04737",
      "contrast": "#FFFFFF",
      "mood": "Mojo"
    },
    {
      "hex": "#8B0723",
      "contrast": "#F0F0F0",
      "mood": "Monarch"
    },
    {
      "hex": "#350E42",
      "contrast": "#ffd700",
      "mood": "Valentino"
    },
    {
      "hex": "#AAA5A9",
      "contrast": "#2E0025",
      "mood": "Shady Lady"
    },
    {
      "hex": "#5D4C51",
      "contrast": "#FFE0FD",
      "mood": "Don Juan"
    },
    {
      "hex": "#605B73",
      "contrast": "#61FFC0",
      "mood": "Stoned"
    },
    {
      "hex": "#000000",
      "contrast": "#FFFFFF",
      "mood": "Dark"
    },

  ]
  return colorset;
}

ann.createSortableUUID = async function createSortableUUID() {
  // Generate a random UUID
  const uuid = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

  // Convert UUID to BigInt
  const uuidBigInt = BigInt('0x' + uuid);

  // Get the current timestamp
  const timestamp = Date.now();

  // Combine UUID and timestamp
  const combined = uuidBigInt * BigInt(10 ** 13) + BigInt(timestamp);

  // Convert combined value to BigInt(20)
  const sortableUUID = BigInt(combined.toString().substring(0, 20));
  console.log('sortableUUID :', sortableUUID);

  return sortableUUID;
}

ann.createSortableUUID2 = async function createSortableUUID2() {
  const uuid = [];
  const hexDigits = "0123456789abcdef";
  const epochTime = (new Date()).getTime();

  // Generate UUID
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid.push("-");
    } else if (i === 14) {
      uuid.push("4");
    } else {
      uuid.push(hexDigits[Math.floor(Math.random() * 16)]);
    }
  }

  // Convert epoch time to hex string
  const hexTime = epochTime.toString(16);

  // Insert epoch time into UUID
  uuid.splice(0, 8, hexTime.slice(0, 8));
  uuid.splice(9, 4, hexTime.slice(8, 12));

  // Return UUID as string
  return uuid.join("");
}

ann.rgbToHex = function rgbToHex(a){
  if(~a.indexOf("#"))return a;
  a=a.replace(/[^\d,]/g,"").split(","); 
  return"#"+((1<<24)+(+a[0]<<16)+(+a[1]<<8)+ +a[2]).toString(16).slice(1)
}


ann.hexToRgb =function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
  });
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16),parseInt(result[2], 16),parseInt(result[3], 16)] : null;
}

ann.hex2filter = function hex2filter(hex) {

  var rgb = hex;
  if(~a.indexOf("#")) {
    rgb = ann.hexToRgb(hex);
  } else {
    console.error("invalid hex, can't get filter color")
    return null;
  }
  const color = new Color(rgb[0], rgb[1], rgb[2]);
  const solver = new Solver(color);
  const result = solver.solve();

  class Color {
      constructor(r, g, b) {
          this.set(r, g, b);
      }

      toString() {
          return `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)})`;
      }

      set(r, g, b) {
          this.r = this.clamp(r);
          this.g = this.clamp(g);
          this.b = this.clamp(b);
      }

      hueRotate(angle = 0) {
          angle = angle / 180 * Math.PI;
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);

          this.multiply([
              0.213 + cos * 0.787 - sin * 0.213,
              0.715 - cos * 0.715 - sin * 0.715,
              0.072 - cos * 0.072 + sin * 0.928,
              0.213 - cos * 0.213 + sin * 0.143,
              0.715 + cos * 0.285 + sin * 0.140,
              0.072 - cos * 0.072 - sin * 0.283,
              0.213 - cos * 0.213 - sin * 0.787,
              0.715 - cos * 0.715 + sin * 0.715,
              0.072 + cos * 0.928 + sin * 0.072
          ]);

      }

      grayscale(value = 1) {
          this.multiply([
              0.2126 + 0.7874 * (1 - value),
              0.7152 - 0.7152 * (1 - value),
              0.0722 - 0.0722 * (1 - value),
              0.2126 - 0.2126 * (1 - value),
              0.7152 + 0.2848 * (1 - value),
              0.0722 - 0.0722 * (1 - value),
              0.2126 - 0.2126 * (1 - value),
              0.7152 - 0.7152 * (1 - value),
              0.0722 + 0.9278 * (1 - value)
          ]);

      }

      sepia(value = 1) {
          this.multiply([
              0.393 + 0.607 * (1 - value),
              0.769 - 0.769 * (1 - value),
              0.189 - 0.189 * (1 - value),
              0.349 - 0.349 * (1 - value),
              0.686 + 0.314 * (1 - value),
              0.168 - 0.168 * (1 - value),
              0.272 - 0.272 * (1 - value),
              0.534 - 0.534 * (1 - value),
              0.131 + 0.869 * (1 - value)
          ]);

      }

      saturate(value = 1) {
          this.multiply([
              0.213 + 0.787 * value,
              0.715 - 0.715 * value,
              0.072 - 0.072 * value,
              0.213 - 0.213 * value,
              0.715 + 0.285 * value,
              0.072 - 0.072 * value,
              0.213 - 0.213 * value,
              0.715 - 0.715 * value,
              0.072 + 0.928 * value
          ]);

      }

      multiply(matrix) {
          const newR = this.clamp(this.r * matrix[0] + this.g * matrix[1] + this.b * matrix[2]);
          const newG = this.clamp(this.r * matrix[3] + this.g * matrix[4] + this.b * matrix[5]);
          const newB = this.clamp(this.r * matrix[6] + this.g * matrix[7] + this.b * matrix[8]);
          this.r = newR;
          this.g = newG;
          this.b = newB;
      }

      brightness(value = 1) {
          this.linear(value);
      }
      contrast(value = 1) {
          this.linear(value, -(0.5 * value) + 0.5);
      }

      linear(slope = 1, intercept = 0) {
          this.r = this.clamp(this.r * slope + intercept * 255);
          this.g = this.clamp(this.g * slope + intercept * 255);
          this.b = this.clamp(this.b * slope + intercept * 255);
      }

      invert(value = 1) {
          this.r = this.clamp((value + this.r / 255 * (1 - 2 * value)) * 255);
          this.g = this.clamp((value + this.g / 255 * (1 - 2 * value)) * 255);
          this.b = this.clamp((value + this.b / 255 * (1 - 2 * value)) * 255);
      }

      hsl() {
          // Code taken from https://stackoverflow.com/a/9493060/2688027, licensed under CC BY-SA.
          const r = this.r / 255;
          const g = this.g / 255;
          const b = this.b / 255;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let h, s, l = (max + min) / 2;

          if (max === min) {
              h = s = 0;
          } else {
              const d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                  case r:
                      h = (g - b) / d + (g < b ? 6 : 0);
                      break;

                  case g:
                      h = (b - r) / d + 2;
                      break;

                  case b:
                      h = (r - g) / d + 4;
                      break;
              }

              h /= 6;
          }

          return {
              h: h * 100,
              s: s * 100,
              l: l * 100
          };

      }

      clamp(value) {
          if (value > 255) {
              value = 255;
          } else if (value < 0) {
              value = 0;
          }
          return value;
      }
  }


  class Solver {
      constructor(target, baseColor) {
          this.target = target;
          this.targetHSL = target.hsl();
          this.reusedColor = new Color(0, 0, 0);
      }

      solve() {
          const result = this.solveNarrow(this.solveWide());
          return {
              values: result.values,
              loss: result.loss,
              filter: this.css(result.values)
          };

      }

      solveWide() {
          const A = 5;
          const c = 15;
          const a = [60, 180, 18000, 600, 1.2, 1.2];

          let best = {
              loss: Infinity
          };
          for (let i = 0; best.loss > 25 && i < 3; i++) {
              if (window.CP.shouldStopExecution(0)) break;
              const initial = [50, 20, 3750, 50, 100, 100];
              const result = this.spsa(A, a, c, initial, 1000);
              if (result.loss < best.loss) {
                  best = result;
              }
          }
          window.CP.exitedLoop(0);
          return best;
      }

      solveNarrow(wide) {
          const A = wide.loss;
          const c = 2;
          const A1 = A + 1;
          const a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
          return this.spsa(A, a, c, wide.values, 500);
      }

      spsa(A, a, c, values, iters) {
          const alpha = 1;
          const gamma = 0.16666666666666666;

          let best = null;
          let bestLoss = Infinity;
          const deltas = new Array(6);
          const highArgs = new Array(6);
          const lowArgs = new Array(6);

          for (let k = 0; k < iters; k++) {
              if (window.CP.shouldStopExecution(1)) break;
              const ck = c / Math.pow(k + 1, gamma);
              for (let i = 0; i < 6; i++) {
                  if (window.CP.shouldStopExecution(2)) break;
                  deltas[i] = Math.random() > 0.5 ? 1 : -1;
                  highArgs[i] = values[i] + ck * deltas[i];
                  lowArgs[i] = values[i] - ck * deltas[i];
              }
              window.CP.exitedLoop(2);

              const lossDiff = this.loss(highArgs) - this.loss(lowArgs);
              for (let i = 0; i < 6; i++) {
                  if (window.CP.shouldStopExecution(3)) break;
                  const g = lossDiff / (2 * ck) * deltas[i];
                  const ak = a[i] / Math.pow(A + k + 1, alpha);
                  values[i] = fix(values[i] - ak * g, i);
              }
              window.CP.exitedLoop(3);

              const loss = this.loss(values);
              if (loss < bestLoss) {
                  best = values.slice(0);
                  bestLoss = loss;
              }
          }
          return {
              values: best,
              loss: bestLoss
          };

          function fix(value, idx) {
              let max = 100;
              if (idx === 2 /* saturate */ ) {
                  max = 7500;
              } else if (idx === 4 /* brightness */ || idx === 5 /* contrast */ ) {
                  max = 200;
              }

              if (idx === 3 /* hue-rotate */ ) {
                  if (value > max) {
                      value %= max;
                  } else if (value < 0) {
                      value = max + value % max;
                  }
              } else if (value < 0) {
                  value = 0;
              } else if (value > max) {
                  value = max;
              }
              return value;
          }
      }

      loss(filters) {
          // Argument is array of percentages.
          const color = this.reusedColor;
          color.set(0, 0, 0);

          color.invert(filters[0] / 100);
          color.sepia(filters[1] / 100);
          color.saturate(filters[2] / 100);
          color.hueRotate(filters[3] * 3.6);
          color.brightness(filters[4] / 100);
          color.contrast(filters[5] / 100);

          const colorHSL = color.hsl();
          return (
              Math.abs(color.r - this.target.r) +
              Math.abs(color.g - this.target.g) +
              Math.abs(color.b - this.target.b) +
              Math.abs(colorHSL.h - this.targetHSL.h) +
              Math.abs(colorHSL.s - this.targetHSL.s) +
              Math.abs(colorHSL.l - this.targetHSL.l));

      }

      css(filters) {
          function fmt(idx, multiplier = 1) {
              return Math.round(filters[idx] * multiplier);
          }
          return `invert(${fmt(0)}%) sepia(${fmt(1)}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(4)}%) contrast(${fmt(5)}%)`;
      }
  }

  return result.filter;
}

ann.heart = async function(parent) {
  var parent = parent;
  var selector = '.heart';
  ann.require(selector).then(async function(resolve) {
   // parent = document.body;
    if(!parent) { parent = document.body; }
    window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) {
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();
      window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));
      var loaded = false;
      var init = function () {
          if (loaded) return;
          loaded = true;
          var mobile = window.isDevice;
          var koef = mobile ? 0.5 : 1;

          var canvas = document.querySelector(selector);          
        // var canvas = document.createElement('canvas');
          canvas.id = 'heart';
        //  ann.addClasses(canvas,'hide fadeOut');
          parent.append(canvas);
          var ctx = canvas.getContext('2d');
          var width = canvas.width = koef * innerWidth;
          var height = canvas.height = koef * innerHeight;
          var rand = Math.random;
          ctx.fillStyle = "rgba(0,0,0,0)";
          ctx.fillRect(0, 0, width, height);

          var heartPosition = function (rad) {
              //return [Math.sin(rad), Math.cos(rad)];
              return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
          };
          var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
              return [dx + pos[0] * sx, dy + pos[1] * sy];
          };

          window.addEventListener('resize', function () {
              width = canvas.width = koef * innerWidth;
              height = canvas.height = koef * innerHeight;
              // width = 200;
              // height = 200;
              ctx.fillStyle = "rgba(0,0,0,0)";
              ctx.fillRect(0, 0, width, height);
          });

          var traceCount = mobile ? 20 : 50;
          var pointsOrigin = [];
          var i;
          var dr = mobile ? 0.3 : 0.1;
          for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
          for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
          for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
          var heartPointsCount = pointsOrigin.length;

          var targetPoints = [];
          var pulse = function (kx, ky) {
              for (i = 0; i < pointsOrigin.length; i++) {
                  targetPoints[i] = [];
                  targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
                  targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
              }
          };

          var e = [];
          for (i = 0; i < heartPointsCount; i++) {
              var x = rand() * width;
              var y = rand() * height;
              e[i] = {
                  vx: 0,
                  vy: 0,
                  R: 2,
                  speed: rand() + 5,
                  q: ~~(rand() * heartPointsCount),
                  D: 2 * (i % 2) - 1,
                  force: 0.2 * rand() + 0.7,
                  f: "hsla(0," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)",
                  trace: []
              };
              for (var k = 0; k < traceCount; k++) e[i].trace[k] = {x: x, y: y};
          }

          var config = {
              traceK: 0.4,
              timeDelta: 0.01
          };

          var time = 0;
          var loop = function () {
              var n = -Math.cos(time);
              pulse((1 + n) * .5, (1 + n) * .5);
              time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .2 : 1) * config.timeDelta;
              ctx.fillStyle = "rgba(0,0,0,0)";
              ctx.fillRect(0, 0, width, height);
              for (i = e.length; i--;) {
                  var u = e[i];
                  var q = targetPoints[u.q];
                  var dx = u.trace[0].x - q[0];
                  var dy = u.trace[0].y - q[1];
                  var length = Math.sqrt(dx * dx + dy * dy);
                  if (10 > length) {
                      if (0.95 < rand()) {
                          u.q = ~~(rand() * heartPointsCount);
                      }
                      else {
                          if (0.99 < rand()) {
                              u.D *= -1;
                          }
                          u.q += u.D;
                          u.q %= heartPointsCount;
                          if (0 > u.q) {
                              u.q += heartPointsCount;
                          }
                      }
                  }
                  u.vx += -dx / length * u.speed;
                  u.vy += -dy / length * u.speed;
                  u.trace[0].x += u.vx;
                  u.trace[0].y += u.vy;
                  u.vx *= u.force;
                  u.vy *= u.force;
                  for (k = 0; k < u.trace.length - 1;) {
                      var T = u.trace[k];
                      var N = u.trace[++k];
                      N.x -= config.traceK * (N.x - T.x);
                      N.y -= config.traceK * (N.y - T.y);
                  }
                  ctx.fillStyle = u.f;
                  for (k = 0; k < u.trace.length; k++) {
                      ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
                  }
              }
              //ctx.fillStyle = "rgba(255,255,255,1)";
              //for (i = u.trace.length; i--;) ctx.fillRect(targetPoints[i][0], targetPoints[i][1], 2, 2);
        
              window.requestAnimationFrame(loop, canvas);
          };
          loop();
          // ctx.font = "80pt Pulstar";
          // ctx.textAlign = 'center';
          // var text = "ANNIKA";
          // ctx.fillStyle = "white";
          // ctx.fillText(text,canvas.width/2,canvas.height - 100);
          // ctx.font = "200pt Verdana";
          // var text = "I";
          // ctx.fillStyle = "white";
          // ctx.fillText(text,100,canvas.height/2 + 50);
      };
      var s = document.readyState;
      if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
      else document.addEventListener('DOMContentLoaded', init, false);
    });
}

ann.getFeelz = async function getFeelz() {

  var feelz = [
    ['positive', ['awe', ['amazed', 'awe', 'impressed', 'inspired', 'moved']],
      ['confidence', ['confident', 'patriotic', 'proud', 'sexy']],
      ['curiosity & intrigue', ['curious', 'excited', 'interested', 'intrigued', 'wanting more']],
      ['hope & prayer', ['hopeful', 'optimistic', 'prayerful']],
      ['improved', ['educated', 'helped', 'informed']],
      ['joy & happiness', ['amused', 'cheerful', 'happy', 'humored', 'joyous']],
      ['love & passion', ['affectionate', 'empathetic', 'love', 'passionate', 'sentimental', 'sympathetic']],
      ['peace', ['content', 'peaceful']],
      ['reflection', ['introspective', 'mindful', 'nostalgia', 'reflective']],
      ['relief', ['relieved', 'vindicated']],
      ['surprise', ['surprised', 'astonished']],
      ['thankfullness', ['blessed', 'grateful', 'lucky', 'thankful']]
    ],
    ['neutral', ['caution', ['cautious', 'leery', 'tentative']],
      ['indifference', ['indifferent', 'irrelevant', 'pointless', 'who cares']],
      ['neutral', ['bored', 'neutral', 'ok']],
      ['nothingness', ['nothing', 'numb']]
    ],
    ['negative', ['anger', ['aggressive', 'angry', 'contemptful', 'frustrated', 'hate', 'livid', 'rageful', 'sick n tired', 'triggered', 'upset']],
    ['confusion', ['confused', 'disoriented', 'distracted']],
    ['depression', ['depressed', 'nostalgia', 'sadness']],
    ['disappointment', ['disappointed', 'let down', 'unsatisfied']],
    ['disgust', ['disgusted', 'repulsed']],
    ['distrust', ['distrusting', 'misinformed', 'pessimistic', 'skeptical']],
    ['envy & jealousy', ['envious', 'jealous']],
    ['hurt', ['disturbed', 'hurt', 'irritated', 'offended']],
    ['regret', ['ashamed', 'embarrassment', 'pity', 'regret', 'remorseful']],
    ['worry & fear', ['afraid', 'creepy', 'intimidated', 'stressed', 'worried']]
  ],
    
  ];
  return feelz;
}

setTimeout(function(){
  if(ann.get.hasCollapsible){ann.runLast(ann.collapsible)}
  if(ann.get.hasHovertips){ann.runLast(ann.hovertips)}
  if(ann.get.hasCopyToClipboard){ann.runLast(ann.copyToClipboard)}
  if(ann.get.hasDynResolution){ ann.runLast(ann.applyResolution)}
  if(ann.get.hasModaltips){ann.runLast(ann.modaltips)}

},ann.get.lastRunInterval)
