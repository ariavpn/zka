// Copyright (c) AriaVPN - No Rights Reserved
// The Unlicense https://unlicense.org/

ann.keep.interval=null;
freeAddresses();
newVisitorID();
webAnalytics();
maingui()
sessionStorage.removeItem('authorized');

ann.keep.unloadAnon=unloadAnon;
async function unloadAnon() {
    freeAddresses();
    ann.fetch('unloadAnon');
}
async function freeAddresses(keepwif) {

    let xmr=localStorage.getItem('XMR');
    let addresses={
        XMR: xmr
    }
    if (keepwif !== 'keepwif') {
        if (localStorage.getItem('enwif')) {
            localStorage.removeItem('wif');
        }
    }
    await ann.fetch('freeAddresses', addresses, 'POST');

    localStorage.removeItem('XMR');
    localStorage.removeItem('fixed');
    localStorage.removeItem('currency');
    localStorage.removeItem('plan');
    localStorage.removeItem('planinfo');
    localStorage.removeItem('txid');
}

async function webAnalytics() {
    let resolution=window.screen.width + "x" + window.screen.height;
    let data={
        referer: document.referrer,
        resolution: resolution
    }
    let response=await ann.fetch('anonAccess', data, 'POST');
    console.log('webAnalytics response :', response);

}

async function toggleLoader() {
    var loader=document.querySelector('.loader')
    if (loader && loader.parentElement) {
        loader=loader.parentElement
    }
    if (loader) {
        loader.classList.toggle('hide')
    }
}
ann.runLast(toggleLoader)


async function getPrices() {
    var prices=await ann.db.bulkGet(ann.db.ticker, [1]);

    const currenttime=new Date();
    const timehold=new Date(currenttime.getTime() - 30000);
    const epochTime=timehold.getTime();

    if (prices && prices[0] && prices[0].created && prices[0].created > epochTime) {
        prices=prices[0]
    } else {
        prices=await ann.fetch('getFiatPrice');
        await ann.db.bulkDelete(ann.db.ticker, [1]).catch((error) => {
            console.error('An error occurred:', error);
        });
        if (prices.ticker) {
            prices=prices.ticker;
        }
        prices.id=1;
        prices.created=Date.now();
        ann.db.bulkPut(ann.db.ticker, prices)

    }

    return prices;
}

ann.keep.payevent=null;
ann.keep.loader=document.querySelector('.loader');
ann.keep.waitforTimeout=false;

if (!ann.keep.loader) {
    ann.keep.loader=document.querySelector('.loader');
}


async function newVisitorID() {
    ann.waitForGlobal('bitcoin', async function () {
        let enwif=localStorage.getItem('enwif');
        if (!enwif) {
            let wif=localStorage.getItem('wif');
            let pub;
            if (!wif || wif.length !== 52) {
                let idneuron=ann.newNeuron();
                wif=idneuron.WIF;
                localStorage.setItem('wif', wif);
                pub=idneuron.publicAddressString;
            }
            if (pub) {
                let pubhash=await ann.sha256(pub)
                let refkey=await ann.sha256(wif)
                ann.fetch('visitorID', {
                    pubhash: pubhash,
                    refkey: refkey
                }, 'POST');
            }
        }
    })
}

async function prereg() {
    let wif=localStorage.getItem('wif');
    if (wif && wif.length === 52) {
        let pub=ann.getPublicAddressFromWif(wif);
        let pubhash=await ann.sha256(pub);
        let registerset={
            pubhash: pubhash
        }
        let fetchresponse=await ann.fetch('createID', registerset, 'POST');
        console.log('fetchresponse :', fetchresponse, fetchresponse[0]);
        if (fetchresponse && fetchresponse[0]) {
            localStorage.setItem('api-token', fetchresponse[1])
            var encrypted=await ann.encryptRoutine(wif, 'pass', fetchresponse[0]);
            let ik=encrypted.ik;
            let count=encrypted.count;
            let refkey=await ann.sha256(wif);
            let refkey2=await ann.sha256(encrypted.item);
            let msg=await ann.sha256(fetchresponse[0]);
            let updateset={
                pubhash: pubhash,
                ik: ik,
                count: count,
                msg: msg,
                refkey: refkey,
                refkey2: refkey2
            }
            let updateresponse=await ann.fetch('updateID', updateset, 'POST');
            console.log('updateresponse :', updateresponse);
            if (updateresponse && !updateresponse.success) {
                // unlikely case, ***insert your business logic here***
                return false;
            }
            return true;
        } else {
            // unlikely case, ***insert your business logic here***
            return false;
        }
    }
}

async function getWif(caller=null) {
    console.log('caller :', caller);
    var wif=localStorage.getItem('wif');
    if (!wif) {
        let enwif=localStorage.getItem('enwif');
        if (!enwif) {
            await ann.newVisitorID()
            wif=localStorage.getItem('wif');
        } else {
            wif=await ann.decryptWIF(enwif, caller)
        }
    }
    if (!wif) {
        backhome()
    }
    return wif
}

async function backToStep1() {
    if (ann.keep.payevent) {
        ann.keep.payevent.close()
    }
    if (ann.keep.interval) {
        clearInterval(ann.keep.interval)
    }


    let buystep2=document.querySelector('.buystep2-wrap')
    if (buystep2) {
        buystep2.remove()
    }

    if (ann.keep.interval) {
        clearInterval(ann.keep.interval)
    }

    await mainonoff(true)
}
async function backhome() {
    await moveFooter()
    await promooff()
    // policiesoff()
    let demoauth=document.querySelector('demoauth');
    if (demoauth) {
        demoauth.remove()
    }
    let moneropay=document.querySelector('moneropay');
    if (moneropay) {
        moneropay.remove()
    }
    let modal=document.querySelector('modal');
    if (modal) {
        modal.remove()
    }
    await backToStep1()
}
async function promooff() {

    let footerpromos=document.querySelectorAll('.footerpromos');
    for (let f of footerpromos) {
        console.log('f :', f);
        if (f) {
            f.remove()
        }
    }
}
async function policiesoff() {
    let policies=document.querySelectorAll('.policies');
    for (let p of policies) {
        if (p) {
            p.remove()
        }
    }
}

async function moveFooter(parent) {
    console.log('parent :', parent);

    let footer=document.querySelector('.footerwrap') // await ann.require('.') 

    if (!footer) {
        return;
    }
    if (!parent) {
        let main=document.querySelector('.section-wrap')
        main.append(footer)
        return;
    }

    parent.append(footer)
}

async function mainonoff(on=false) {
    await moveFooter();
    let footer=document.querySelector('.footerwrap')
    console.log('footer :', footer, parent);
    promooff()
    let demoauth=document.querySelector('demoauth')
    let moneropay=document.querySelector('.buystep2-wrap')
    let sw=document.querySelector('.section-wrap')

    if (on && on !== "terms" && on === true) {
        if (demoauth) {
            ann.show(demoauth, true, 'block')
            moveFooter(demoauth)
        } else if (moneropay) {
            ann.show(moneropay, true, 'block')
            moveFooter(moneropay)
        } else {
            ann.show(sw, true, 'flex')
        }
        return;
    }
    if (on && on === "terms") {
        if (demoauth) {
            ann.show(demoauth, false)
        } else if (moneropay) {
            ann.show(moneropay, false)
        }
        ann.show(sw, false);
        return;
    }
    if (demoauth) {
        demoauth.remove()
    }
    if (moneropay) {
        moneropay.remove()
    }
    ann.show(sw, false);

}

async function maingui() {

    let brandp1="AriaVPN"

    let logosrc='img/arialogo.svg';
    let menu=["ZKA", "LICENSE", "AUTH DEMO", "MONERO PAY", "FORK THIS", "FOOTER"];
    let maininfo=[intro, license, zkademoarea, payarea, forkthis, addfooter]
    async function zkademoarea() {}
    async function payarea() {}

    let [h, c, cl, pr]=ann.declareVars(21, true);

    h.v6=logosrc, h.v8=brandp1, h.v12='ZKA', h.v13='License', h.v14='Auth Demo', h.v15="Monero Pay", h.v16='Fork This', h.v17='My Dashboard', h.v18='Get AriaVPN', h.v19=menu, h.v21=maininfo,

        c.v1='mw-1920px'
    c.v2='main-inner jc-start', c.v3='z-max w-100 headershadow', c.v4='', c.v5='jc-start mw-1200', c.v6='logoimg', c.v7='jc-start', c.v8='f18rem m-0 cc-3 logotext Anek pointer', c.v9='hide', c.v11=c.v17='hide'
    c.v18='ariabuttonalt mr-40 media620 mediaabsr0', c.v19='pointer', c.v20='section-wrap scrollbar o-y-a z-mid'
    c.v21='pager h-100'
    cl.v6=getvpnmenu, cl.v8=getvpnmenu,
        cl.v12=zkamenu, cl.v13=licensemenu, cl.v14=demomenu, cl.v15=paymenu, cl.v16=forkthismenu, cl.v19=ann.onMenuClick;
    pr.v19=ann.get.menuCallback;

    let [html, css, clb, par]=ann.jsons2arrays([h, c, cl, pr])

    ann.cl.onload.maingui=async function maingui() {

        trianglesbg()
        let sections=document.querySelectorAll('section')

        try {
            sections[2].remove()
            sections[3].remove()

            let menulis=document.querySelectorAll('menu ul li')
            console.log('menuul :', menulis);
            ann.show(menulis[5], false)

            ann.createListener(menulis[1], 'click', licensemenu)
            ann.createListener(menulis[2], 'click', demomenu)
            ann.createListener(menulis[3], 'click', paymenu)
            ann.createListener(menulis[4], 'click', forkthismenu)

        } catch (e) {

        }
    }
    let name='maingui+ann.cl.onload.maingui'

    ann.Subroutine(name,
        ['div_y', 'div_y', 'div_x', 'header_x', 'div_x', 'img', '$5_div', 'h1', '$7_h2', //9
            '$5_menuh_x', '$10_span', '$10_span', '$10_span', '$10_span', '$10_span', '$10_span', '$10_span', '$5_button', //8
            '$3_menu_y', '$2_div_y', 'info_y'
        ],
        [...html], [...css], [...clb], [...par]
    );

    async function trianglesbg() {
        let mi=document.querySelector('.section-wrap')
        let div1=document.createElement('div')
        let div2=document.createElement('div')
        ann.addClasses(div1, 'flexitc toptriangles');
        ann.addClasses(div2, 'flexitc toptriangles')
        mi.prepend(div2);
        mi.prepend(div1)
    }

    async function zkamenu(id, e) {
        await backhome()
        ann.jumpPage(1)
    }

    async function licensemenu(id, e) {
        await backhome()
        ann.jumpPage(2)
    }
    async function demomenu(id, e) {
        await backhome()
        if (e.isTrusted) {
            await mainonoff()
            zkademo()

        }
    }
    async function paymenu(id, e) {
        await backhome()
        if (e.isTrusted) {            
            paydemo()
        }
    }

    async function forkthismenu(id, e) {
        await backhome()
        ann.jumpPage(4)
    }

    async function getvpnmenu(id, e) {
        window.open("https://ariavpn.net", '_self')

    }

    async function intro() {
        let [h, c, cl]=ann.declareVars(17);

        h.v3="100% trustless authentication"
        h.v4="Zero Knowledge Architecture",
            h.v5="Say goodbye to passwords, usernames, and personal data on third-party servers.",
            h.v6='Fork this'

        h.v9="img/lock.svg", h.v10="&nbsp;&nbsp;Cryptographic Proofs",
            h.v12="img/check.svg", h.v13="&nbsp;&nbsp;Trustless Sign-up",
            h.v15="img/nospy.svg", h.v16="&nbsp;&nbsp;Data Segregation"
        h.v17='img/zka.svg'

        c.v1='jump1', c.v2='center introwrap', c.v3='ariabutton ariabuttonalt2 butadj mb-20', c.v4='mainheading mb-20', c.v5='firstheading font1 mb-50 mt-10', c.v6='ariabutton', c.v7='highlights mt-80 mw-800', c.v8=c.v11=c.v14='o-v'
        c.v17='mt-50 mw-800 w-100 h-a'

        cl.v3=demomenu, cl.v6=forkthismenu;

        let [html, css, clb]=ann.jsons2arrays([h, c, cl])

        return ann.Subroutine('intro',
            ['intro_y', 'div_y', 'button', '$2_h1', '$2_h3', '$2_button', '$2_div_x',
                '$7_div_x', 'img', '$8_p',
                '$7_div_x', 'img', '$11_p',
                '$7_div_x', 'img', '$14_p', '$2_img'
            ],
            [...html], [...css], [...clb]
        );
    }

    async function license() {

        let [h, c, cl]=ann.declareVars(8);

        h.v3='100% permissive public licence',
        h.v6="The Unlicense",
        h.v7="<p>This is free and unencumbered software released into the public domain.</p><p>Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.</p><p>In jurisdictions that recognize copyright laws, the author or authors of this software dedicate any and all copyright interest in the software to the public domain. We make this dedication for the benefit of the public at large and to the detriment of our heirs and successors. We intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.</p><p>THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>",
        h.v8="*AriaVPN logo and trademark are exempt from the above license."

        c.v1='jump2', c.v2='mw-800 mediaw90 center', c.v4='code mt-20', c.v5='center',c.v8="center mt-20"
        let [html, css, clb]=ann.jsons2arrays([h, c, cl])

        return ann.Subroutine('license',
            ['license_y', 'div_y', 'h2', '$2_div_y', 'div_y', 'h3', '$4_div', '$2_p'],
            [...html], [...css], [...clb]
        );
    }

    async function zkademo() {
        await mainonoff()
        ann.keep.newID=async function newID(id, e) {
            var wif=localStorage.getItem('wif');
            if (!wif) {
                let idneuron=ann.newNeuron();
                wif=idneuron.WIF;
                localStorage.setItem('wif', wif);
                let pub=idneuron.publicAddressString;
                let pubhash=await ann.sha256(pub)
                let refkey=await ann.sha256(wif)
                console.log('pubhash :', pubhash, refkey);
                await ann.fetch('visitorID', {
                    pubhash: pubhash,
                    refkey: refkey
                }, 'POST');
            }
            var pub=ann.getPublicAddressFromWif(wif);
            if (pub) {
                var txt=document.querySelector("demoauth input")
                let keycopy=document.createElement('span');
                ann.addClasses(keycopy, 'keycopy copycontent copycontent2 w-100 mw-500 h-30 p-10 mt-20 mb-30 lh-30 center')
                ann.show(txt, false)
                txt.after(keycopy)
                keycopy.innerHTML=wif;
                ann.copyToClipboard();
                ann.createListener(keycopy, 'click', onEnterOrBlur, true)
                let info=keycopy.previousElementSibling.previousElementSibling
                info.innerHTML="<span class='septenary'>Copy your key and keep it safe; we cannot recover lost keys!</span>"
            } else {
                localStorage.removeItem('wif');
                location.reload();
            }
        }

        let demoauth=document.querySelector("demoauth");

        if (demoauth) {
            demoauth.remove()
        }

        let [h, c, cl]=ann.declareVars(21);

        h.v4="<span class='secondary'>Demo: </span>100% trustless authentication", h.v5="<span class='septenary'>Set your brand apart with our ZKA:</span> Be at the forefront of privacy and security innovation."
        h.v8="img/shield.svg",
        h.v9='Cryptographic Proofs',
        h.v11="img/anon.svg",
        h.v12='Trustless Sign-up',
        h.v14="img/pf.svg",
        h.v15='Data Segregation',
        h.v18="Enter Private Key", h.v19="Enter your private key and <b>press enter</b>"
        h.v21="Don't have a private key? <span class='ahref' onclick='ann.keep.newID()'><b>Generate one here!</b></span>"

        c.v1='w-100 scrollbar o-y-a o-x-h z-top', c.v2='mt-100 pb-150', c.v3='mw-800'
        c.v4='font2 center', c.v5='font3 fsize4 center p-5 cc-4', c.v6='flexalignleft referralgrid center'
        c.v8=c.v11=c.v14='pointer',
        c.v9=c.v12=c.v15='font3 fsize4 cc-4',
        c.v16="jc-start minw-300 mw-1000 p-20 mt-30", c.v17='demoinner'
        c.v18='cc-3 f12rem center', c.v19='fsize4 center p-10',
        c.v20='w-100 mw-500 h-30 w-90 p-10 mt-20 mb-30 keyinput', c.v21='fsize4 center p-10 pointer'

        cl.v20=onEnterOrBlur;

        let [html, css, clb]=ann.jsons2arrays([h, c, cl])

        if (ann.keep.waitforTimeout) {
            clearTimeout(ann.keep.waitforTimeout);
        }

        ann.cl.onload.demoauth=async function demoauth() {

            ann.keep.waitforTimeout=setTimeout(async () => {
                console.log('ann.cl.onload.demoauth');

                var txt=document.querySelector("demoauth input")
                txt.setAttribute('minlength', 52)
                txt.setAttribute('maxlength', 52)
                txt.setAttribute('placeholder', 'Paste your private key')
                ann.createListener(txt, 'keydown', onKeyDown);

                function onKeyDown(id, e) {
                    if (e.keyCode === 13) {
                        txt.blur()
                    }
                }
                let demoauth=document.querySelector("demoauth")
                moveFooter(demoauth)
                let enwif=localStorage.getItem('enwif')
                if (enwif && enwif.length > 52) {
                    let identity=await ann.validateIdentity("returnwif");
                    if (identity && identity.pubhash) {
                    console.log('identity :', identity);
                        let wif = identity.wif;
                        identity.wif = undefined;
                        authDemoLogin(identity, wif)
                    } else {
                        // unlikely case, ***insert your business logic here***
                    }
                }
            }, 500);
        }
        let name=['demoauth+ann.cl.onload.demoauth', document.querySelector('.main-inner')]

        return ann.Subroutine(name,
            ['demoauth', 'div_y', 'div_y', 'h1', '$3_p', '$3_div_x', // 6
                'div_y', '$7_img', '$7_h3', '$6_div_y', '$10_img', '$10_h3', '$6_div_y', '$13_img', '$13_h3', //15
                '$3_div_y', 'div_y', 'h4', '$17_p', '$17_input_@blur', '$17_p'
            ],
            [...html], [...css], [...clb]
        );

        async function onEnterOrBlur(id, e, isNew) {
            if (isNew) {
                let wif=localStorage.getItem('wif');
                var pub=ann.getPublicAddressFromWif(wif);
                if (pub) {
                    await prereg()
                    await ann.encryptWIF(wif, document.querySelector('demoauth'));
                    let identity=await ann.validateIdentity();
                    if (identity && identity.pubhash) {
                        authDemoLogin(identity, wif)
                    } else {
                        ann.modal("NOT FOUND", "The provided key is invalid. Please enter a valid Private Key.", 1, document.querySelector('demoauth'));
                    }
                }
            } else if (e.path[0].value && e.path[0].value.trim().length === 52) {
                let wif=e.path[0].value.trim()
                console.log('wif :', wif);
                var pub=ann.getPublicAddressFromWif(wif);
                console.log('pub :', pub);

                if ((pub && e.type === 'blur')) {
                    await ann.encryptWIF(wif, document.querySelector('demoauth'));
                    let identity=await ann.validateIdentity();
                    if (identity && identity.pubhash) {                        
                        authDemoLogin(identity, wif)
                    } else {
                        ann.modal("NOT FOUND", "The provided key is invalid. Please enter a valid Private Key.", 1, document.querySelector('demoauth'));
                    }
                } else if (e.path[0].value && e.path[0].value.trim().length === 52) {
                    ann.modal("INVALID KEY", "The provided key is invalid. Please enter a valid Private Key.", 1, document.querySelector('demoauth'));
                }


            } else if (e.path[0].value && e.path[0].value.trim().length !== 52 && e.keyCode === 13) {
                ann.modal("INVALID KEY", "The provided key is invalid. Please enter a valid Private Key.", 1, document.querySelector('demoauth'));
            }
        }
        async function authDemoLogin(identity, wif) {
            console.log('wif :', wif,identity);

            let dash=await ann.fetch('privateArea', identity, 'POST')
            authdemoActions(dash, wif)
          
        }

        async function authdemoActions(dash, wif) {
            console.log('dashset :', wif, dash);
            if (dash && dash.plan && dash.plan.includes('no plans found')) {
                ann.modal("NO PLANS FOUND", "There are no associated plans with this key. <br><br>Please purchase a VPN plan and use the provided private key to access your Dashboard.", 1, document.querySelector('demoauth'));
                return;
            }
            demodata1(dash, wif)


            async function demodata1(dash, wif) {

                var data=dash;
                let dashpart=await switchDashParts(0);
                if (dashpart && ann.isVisible(dashpart)) {
                    return
                }

                var tablearray=[
                    ['Identity Item', "Value", "Description"]
                ]

                let idset=dash['identity']

                var info="";
                for (let i in idset) {
                    var skip = false;
                    switch (i) {
                        case "pubhash":
                            info="A SHA256 checksum of the cryptographically derived Public Key from the Private Key is used as the primary identifier of the user's identity.";
                            break;
                        case "refkey":
                            info="Reference Key is a SHA256 checksum of the Private Key and is used as a secondary identifier. You may or may not need this, depending on your business logic.";
                            break;
                        case "token":
                            info="A CSRF token, or Cross-Site Request Forgery token, is a unique security measure that protects web applications from unauthorized or malicious requests. It verifies the authenticity of user requests and is crucial for preventing attackers from performing actions on behalf of unsuspecting users.";
                            break;
                        case "localid":
                            info="UUID can be used to identify multiple identities created from the same web browser and prevent bad actors from cheating your system. It's not bulletproof, however, it's privacy non-intrusive means that can be used to tackle certain challenges in a trustless authentication environment.";
                            break;
                        case "updated_at":
                            info="Date and time when this collection was last updated";
                            break;
                        case "created_at":
                            info="Date and time when this collection was created";
                            break;
                        case "stoken":
                            info="Laravel Sanctum token provides a featherweight authentication system for SPAs, mobile applications, and simple, token based APIs. Sanctum allows each user of your application to generate multiple API tokens for their account. These tokens may be granted abilities / scopes which specify which actions the tokens are allowed to perform.";
                            break;
                        case "count":
                            info="Encrypted count of iterations used to encrypt the Identity Key (see below). The 'count' is encrypted using the Private Key.";
                            break;
                        case "ik":
                            info="The Identity Key is an encrypted string generated through a cryptographic process executed strictly at the client end. This key comprises a public key and secret server messages. To validate the client's identity, the Private Key and decrypted count is required to decrypt the Identity Key.";
                            break;
                        case "refkey2":
                            info="Reference Key 2 is a SHA256 checksum of the encrypted Private Key and is used as a tertiary identifier. You may or may not need this, depending on your business logic.";
                            break;
                        default:
                            // We're skipping an interim record that shows fixed rate data associated with the identity collection upon access of the Monero Pay area. A copy of the record is shown in at the end of Monero Pay demo process.
                            skip = true;
                            break;
                    }
                    if(!skip) {                        
                        tablearray.push([i, idset[i], info])
                    }
                   
                }

                let demoinner=document.querySelector("demoauth .demoinner");
                ann.show(demoinner, false)

                let [h, c, cl]=ann.declareVars(4);

                h.v3="Your Private Key:<br><br>" + wif,
                h.v4=tablearray

                c.v1='dashpart w-90'
                c.v3='mb-30 mt-20 center'

                let [html, css, clb]=ann.jsons2arrays([h, c, cl])

                ann.cl.onload.demodata1=async function demodata1() {
                    demoAuthEvents()
                    
                }
                let name=['demodata1+ann.cl.onload.demodata1', demoinner.parentElement]


                return ann.Subroutine(name,
                    ['demodata1_y', 'div_y', 'p', '$2_table'],
                    [...html], [...css], [...clb] //,[...par]
                );
                async function demodata2() {
                    console.log('dash2')
                    let dashpart=await switchDashParts(1);
                    if (dashpart && ann.isVisible(dashpart)) {
                        return
                    }

                    let demoinner=document.querySelector("demoauth .demoinner");
                    ann.show(demoinner, false)
                    let [h, c, cl]=ann.declareVars(4);
                    h.v3="Trustless Authentication 101"
                    h.v4="<p>Upon loading the webpage, each visitor gets a unique private key (PK) generated on the client's end. At first, the PK is stored in local storage and not shown to the user unless needed. A cryptographic set, as defined in the Cryptographic Proofs section, is generated in the background during page load if the set does not already exist for the particular PK.</p>" +

                        "<p>The process can be divided into two parts. On the client side, a Public Key (pubkey) is derived from the PK, and the SHA256 sum of the pubkey is computed to create pubhash. The SHA256 sum of the PK is also computed, known as the Reference Key. On the server side, a CSRF token and client UUID are generated, stored in the identity collection, and as encrypted cookies.</p>" +

                        "<p>The second part of the process may happen during page load or later. This part involves the encrypted count of iterations used to encrypt the IK, the IK itself, the Sanctum token, and the Reference Key 2. The latter two records may be needed, depending on your business logic.</p>" +

                        "<p>When a user accesses a protected area for the first time, the PK is retrieved from local storage and shown to the user. The user is prompted to retain the PK and keep it safe. After the user copies the PK, the system asks the user to choose a PIN. When entered, the PK is stored encrypted by the PIN in the local storage, and the plain PK is removed.</p>" +

                        "<p>The PK is then used to encrypt a concatenation of pubkey and server message (for example, this can be a hash of collection object ID), producing an IK stored on the server but not directly shown to the user. Each time we need to verify the user's identity, we transmit the IK to the client side. The user retrieves their encrypted PK from local storage, decrypts it with their PIN, decrypts the IK with their PK, and transmits back a hash of the secret server message it contains, thus allowing us to validate the user's identity on the server side.</p>" +

                        "<p>We never see or keep a copy of the PK, pubkey, or PIN. We only store the PK encrypted by the PIN in the local storage and store all cryptographic proofs and tokens in our database.</p>"

                    c.v1='dashpart w-90', c.v2='o-v', c.v3=c.v4='mt-20 center mb-10'


                    let [html, css, clb]=ann.jsons2arrays([h, c, cl])


                    let name=['demodata2+ann.cl.onload.demodata2', demoinner.parentElement]

                    return ann.Subroutine(name,
                        ['demodata2_y', 'div_y', "h2", '$2_div'], //18
                        [...html], [...css], [...clb]
                    );


                }

                async function demodata3(id, e, dash=data) {

                    let dashpart=await switchDashParts(2);
                    if (dashpart && ann.isVisible(dashpart)) {
                        return
                    }

                    var tablearray=[
                        ['Anon Data', 'Value', 'Visits']
                    ]

                    let visset=dash['visitor']

                    console.log(visset);
                    const countItems=visset.reduce((acc, curr) => {

                        acc[curr.uuid]=(acc[curr.uuid] || 0) + 1;
                        acc['browser']=acc['browser'] || {};
                        acc['browser'][curr.browser]=(acc['browser'][curr.browser] || 0) + 1;
                        acc['city']=acc['city'] || {};
                        acc['city'][curr.city]=(acc['city'][curr.city] || 0) + 1;
                        acc['country']=acc['country'] || {};
                        acc['country'][curr.country]=(acc['country'][curr.country] || 0) + 1;
                        acc['connectiontype']=acc['connectiontype'] || {};
                        acc['connectiontype'][curr.connectiontype]=(acc['connectiontype'][curr.connectiontype] || 0) + 1;
                        acc['device']=acc['device'] || {};
                        acc['device'][curr.device]=(acc['device'][curr.device] || 0) + 1;
                        acc['devicetype']=acc['devicetype'] || {};
                        acc['devicetype'][curr.devicetype]=(acc['devicetype'][curr.devicetype] || 0) + 1;
                        acc['isp']=acc['isp'] || {};
                        acc['isp'][curr.isp]=(acc['isp'][curr.isp] || 0) + 1;
                        acc['platform']=acc['platform'] || {};
                        acc['platform'][curr.platform]=(acc['platform'][curr.platform] || 0) + 1;
                        acc['referer']=acc['referer'] || {};
                        acc['referer'][curr.referer]=(acc['referer'][curr.referer] || 0) + 1;
                        acc['resolution']=acc['resolution'] || {};
                        acc['resolution'][curr.resolution]=(acc['resolution'][curr.resolution] || 0) + 1;
                        acc['referer']=acc['referer'] || {};
                        acc['referer'][curr.referer]=(acc['referer'][curr.referer] || 0) + 1;
                        acc['route']=acc['route'] || {};
                        acc['route'][curr.route]=(acc['route'][curr.route] || 0) + 1;
                        acc['usertype']=acc['usertype'] || {};
                        acc['usertype'][curr.usertype]=(acc['usertype'][curr.usertype] || 0) + 1;
                        // acc['latitude']=acc['latitude'] || {};
                        // acc['latitude'][curr.latitude]=(acc['latitude'][curr.latitude] || 0) + 1;
                        acc['timeonsite']=acc['timeonsite'] || {};
                        acc['timeonsite'][curr.timeonsite]=(acc['timeonsite'][curr.timeonsite] || 0) + 1;
                        return acc;
                    }, {});

                    var z=0;
                    for (let i in countItems) {                     
                        var item=i;
                        if (item === "timeonsite") {
                            item="timeonsite (s)"
                        }
                        tablearray.push([item, ['rowspan', countItems[i], Object.keys(countItems[i]).length]])
                        z++
                    }

                    let demoinner=document.querySelector("demoauth .demoinner");
                    ann.show(demoinner, false)

                    let [h, c, cl]=ann.declareVars(4);

                    h.v3="Web analytics are important for marketing purposes, but can intrude on privacy if collected through a third-party service and linked to real-world identities. To address this concern, we have chosen to collect the necessary data ourselves and make sure that it cannot be linked to specific identities or sales records. The information is identified using a browser cookie that contains a separate and encrypted UUID (different from the one shown in the Cryptographic Proofs area). Only you, as the end user, can see that the data belongs to you."
                    h.v4=tablearray

                    c.v1='dashpart w-90'
                    c.v3='mb-30 mt-20 center'

                    let [html, css, clb]=ann.jsons2arrays([h, c, cl])

                    let name=['demodata3', demoinner.parentElement]
                    

                    return ann.Subroutine(name,
                        ['demodata3_y', 'div_y', 'p', '$2_table'],
                        [...html], [...css], [...clb] //,[...par]
                    );
                }


                async function demoAuthEvents() {
                    let imgs=document.querySelectorAll('demoauth .referralgrid img')
                    let index=0;
                    for (let img of imgs) {
                        if (index === 0) {
                            img.style.background="#ffffff2e";
                            index++;
                        }
                        ann.createListener(img, 'click', dashboardSections, imgs)

                    }
                    ann.createListener(imgs[0], 'click', demodata1);
                    ann.createListener(imgs[1], 'click', demodata2);
                    ann.createListener(imgs[2], 'click', demodata3);

                    function dashboardSections(id, e, imgs) {
                        console.log('id, e :', id, e);
                        for (let img of imgs) {
                            img.style.background='none';
                        }
                        e.target.style.background="#ffffff2e";

                    }

                }
                async function switchDashParts(index) {
                    let dashparts=document.querySelectorAll(".dashpart");
                    console.log('ashparts.length :', index, dashparts.length);
                    if (index == 2 && dashparts.length == 1) {
                        await demodata2();
                        dashparts=document.querySelectorAll(".dashpart");
                    }
                    var dashpart;
                    for (let d in dashparts) {
                        if (typeof dashparts[d] === 'object') {
                            if (d == index) {
                                ann.show(dashparts[d], true, 'flex');
                                dashpart=dashparts[d];
                            } else {
                                ann.show(dashparts[d], false)
                            }
                        }
                    }
                    return dashpart;
                }
            }
        }
    }

    async function paydemo(id, e) {

        let wif=await getWif();
        if (wif && wif.length === 52) {
            localStorage.setItem('wif', wif);
            let plan=0;
            localStorage.setItem('plan', plan)
            localStorage.setItem('planinfo', "demo")

            var current=2.00;
            current=current.toFixed(2)

            let prices=await getPrices();

            let xmrusd=prices.monero.usd;
            var xmr=(current / xmrusd).toFixed(6);

            pub=ann.getPublicAddressFromWif(wif);
            let pubhash=await ann.sha256(pub)

            localStorage.setItem('fixed', xmr)
            localStorage.setItem('currency', 'XMR')
            let fixprice={
                pubhash: pubhash,
                plan: plan,
                currency: 'monero',
                referer: document.referrer
            }
            hascredit=await ann.fetch('fixPrice', fixprice, 'POST');
            console.log('fixprice :', fixprice);

            let buystep2=document.querySelector('buystep2')
            if (buystep2) {
                buystep2.remove()
            }
            let innerstep=document.querySelector('.main-inner')

            let [h, c, cl]=ann.declareVars(15);
            c.v2='buystep2-inner',
                h.v3='Step 1', h.v4="Give our Monero Pay a try",
                h.v7='Select payment method',
                h.v9='img/xmr-logo.svg', h.v11='Monero', h.v12="<span class='cunit'>XMR</span> (100% private)", h.v13="$" + xmrusd.toFixed(2),
                h.v14="All test payments are accepted as donations and are final. Thank you for your support.";

            c.v1='mw-800'
            c.v3='stepc hide', c.v4='planinfo font3 fsize4 cc-4', c.v5='flexalignleft jc-start flexwrap pl-50 payopt-wrap', c.v6='paymentoptions flexalignleft mw-320 dyn-mr o-v mt-20', c.v7='mb-10 fsize4'
            c.v8='paymentoption XMR selected',
                c.v9='logo', c.v10='flexalignleft currinfo mw-200 pl-10',
                c.v11='font2 fsize4',
                c.v12='fs-08rem',
                c.v13='unitprices font2 f09rem center',
                c.v14='abs b-20 center mw-90 hideterms';


            let [html, css, clb]=ann.jsons2arrays([h, c, cl])
            await mainonoff()
            
            ann.cl.onload.buystep2=async function buystep2() {
                let buystep2=document.querySelector('buystep2');
                const dv=document.createElement('div')
                let dv2=document.createElement('div')
                ann.addClasses(dv, 'w-100 jc-start h-100 o-y-a o-x-h scrollbar buystep2-wrap');
                ann.addClasses(dv2, 'flexitc jc-start buystep2-inner mt-80 mb-200');
                buystep2.before(dv)
                dv.append(dv2)
                let head=document.createElement('h2')
                head.innerHTML="Accept Monero on your website"
                ann.addClasses(head, 'center mb-50');
                dv2.append(head)
                dv2.append(buystep2)
                await moveFooter(dv)
            }

            let name=['buystep2+ann.cl.onload.buystep2', innerstep]

            return ann.Subroutine(name,
                ['buystep2_y', 'div_y', 'span', '$2_span', '$2_div_x', 'div_y', 'p', //7
                    '$6_div_x', 'img', '$8_div_y', 'span', '$10_span', '$8_span', //13
                    '$1_p', qrinfo
                ],
                [...html], [...css], [...clb]
            );

            async function addressRequest(currency="XMR", amount) {
                console.log('currency :', currency);
                let pub;
                let address=localStorage.getItem(currency);
                console.log('address :', address);
                if (!address || address == "undefined" || address == "false") {
                    let wif=localStorage.getItem('wif');
                    if (wif && wif.length === 52) {
                        pub=ann.getPublicAddressFromWif(wif);
                        let pubhash=await ann.sha256(pub)
                        let request={
                            pubhash: pubhash,
                            currency: currency,
                            amount: amount
                        }
                        address=await ann.fetch('getCurrencyAddress', request, 'POST');
                        console.log('address :', address);
                        localStorage.setItem(currency, address.result);

                    } else {
                        let log={
                            function: 'addressRequest',
                            msg: 'nowif'
                        }
                        ann.fetch('errorLog', log, 'POST');
                    }
                }
                return address;

            }

            async function qrinfo() {

                let address=await addressRequest('XMR', xmr)
                var qrtext=["monero:" + address + "?amount=" + (xmr), null]
                console.log('address :', address);

                let [h, c, cl]=ann.declareVars(15);

                h.v2='Wallet Address', h.v3='Do NOT refesh this page. Do NOT send more than one transaction to this address!',
                    h.v4="Pay <span class='topay bold'>" + xmr + "</span> <span class='topaycurr bold'>XMR</span> or more to the address below.",
                    h.v5="Use high-priority fees for quicker confirmation.",
                    h.v7=[null, qrtext],
                    h.v11='Click address to copy', h.v12=address.result,
                    h.v14="Waiting for transaction. (Data will update in <span class='countdown'>10</span> seconds)",
                    h.v15='Your account will be auto-created after payment.'

                c.v1='flexalignleft payinfo mw-400 fsize4 mt-30', c.v2='mb-5', c.v3='red fs-08rem pr-10 mb-10 hide', c.v4='topayparent',
                    c.v5='red fsize4 hide font2 btcwarning', c.v6='flexalignleft ml--10 p-10-0', c.v8='flexalignleft mt-10',
                    c.v7='qrlink'
                c.v8='qrcanvas mqrcode', c.v10='f09rem mt-10 priceupdate', c.v11='addressvsmemo font2 fs-08rem cc-3 mt-5', c.v13='hide', c.v12='copycontent fs-085rem mr-20', c.v14='mb-20 f09rem mr-20', c.v15="mt-20 mb-30 fsize4 cc-4";

                let [html, css, clb]=ann.jsons2arrays([h, c, cl])

                ann.cl.onload.buystep2=async function buystep2(amnt=xmr) {
                    let maddress=await addressRequest('XMR', amnt)
                    if (ann.keep.payevent) {
                        ann.keep.payevent.close();
                    }
                    generateQR(maddress, amnt);
                    listenForPayment(maddress, "XMR");
                    ann.copyToClipboard()
                    await ann.handleUnload();
                    ann.get.donotunload=true;
                    countdown();
                }

                let name='qrinfo+ann.cl.onload.buystep2'
                return ann.Subroutine(name,
                    ['$5_div_y', 'p', '$1_p', '$1_p', '$1_p', '$1_div_x', 'a', 'canvas', '$6_div_y', 'p', '$9_span', '$9_address', //35
                        '$1_p', '$1_p', '$1_p'
                    ],
                    [...html], [...css], [...clb]
                );
            }
            function countdown() {
                if (ann.keep.interval) {
                    clearInterval(ann.keep.interval);
                }
                let count=10;
                const countdownDiv=document.querySelector('.countdown');
                if (countdownDiv) {
                    ann.keep.interval=setInterval(() => {
                        countdownDiv.textContent=count;
                        count--;

                        if (count < 1) {
                            clearInterval(ann.keep.interval);

                            countdown();
                        }
                    }, 1000);
                }
            }

            async function listenForPayment(address, curr) {
                var currency=curr;
                if (ann.keep.payevent) {
                    ann.keep.payevent.close()
                }
                if (!address) {
                    localStorage.getItem(currency)
                }
                if (address === 'undefined') {
                    return
                }
                let wif=localStorage.getItem('wif');
                if (wif && wif.length === 52) {
                    let pub=ann.getPublicAddressFromWif(wif);
                    let pubhash=await ann.sha256(pub)
                    var d;
                    let url="get" + currency + "Transfers";
                    ann.keep.payevent=new EventSource(url + "?address=" + address + "&pubhash=" + pubhash);

                    ann.keep.payevent.onmessage=async (e) => {
                        try {
                            d=JSON.parse(JSON.parse(e.data))
                        } catch {
                            d=JSON.parse(e.data)
                        }
                        if (d && d.pool) {
                            d.in=d.pool
                        }       
                        if (d && (d.notours || d.isdown || d.noid)) {
                            console.log('d :', d);
                            ann.modal('SERVER ERROR', "<span class='inlineb'>If you see this message, our " + currency + " service is offline. If you made a payment, please contact <span class='ahref' onclick='ariasupport()'>AriaVPN Support</span>, quoting reference code ARIA01E, or choose different payment method. We apologize for any inconvenience.</span>", 1);
                            if (ann.keep.payevent) {
                                ann.keep.payevent.close()
                            }
                            if (ann.keep.interval) {
                                clearInterval(ann.keep.interval)
                            }
                            return;
                        }
                        if ((d && d.in && Object.keys(d.in).length > 0) || (d && d.sales > 0)) {
                            ann.keep.payevent.close()
                            processPayment(d, currency);
                        }
                    }
                    ann.keep.payevent.onerror=(e) => {
                        ann.keep.payevent.close()
                        let address=localStorage.getItem(currency);
                        listenForPayment(address, currency);
                    }
                }
                async function processPayment(d, currency) {
                    if (ann.keep.interval) {
                        clearInterval(ann.keep.interval)
                    }
                    let doublespend=(d.in) ? d.in[0]['double_spend_seen'] : false;
                    var address=(d.in) ? d.in[0]['address'] : null

                    var pub=localStorage.getItem(currency);
                    console.log('pub :', pub, address, pub === address);
                    if (doublespend) {
                        ann.modal('DOUBLE SPEND', "<span class='inlineb'>Monero daemon detected attempt at double spend. If your transaction was genuine, please contact <span class='ahref' onclick='ariasupport()'>AriaVPN Support</span>, quoting reference code ARIA02E. We apologize for any inconvenience.</span>", 1);
                        return;
                    }
                    if (pub !== address) {
                        ann.modal('UNKNOWN ERROR', "<span class='inlineb'>Our server could not verify your payment due to a browser error. Please do NOT try again and contact <span class='ahref' onclick='ariasupport()'>AriaVPN Support</span>, quoting reference code ARIA03E. We apologize for any inconvenience.</span>", 1);
                        return;
                    }

                    if (ann.keep.payevent) {
                        ann.keep.payevent.close()
                    }
                    buystep3(d, currency, address);
                }
            }
            async function buystep3(data, curr, addy) {
                let hideterms=document.querySelector('.hideterms')
                if (hideterms) {
                    ann.show(hideterms, false)
                }
                var d=data;
                ann.show(document.querySelector('buystep2 back'), false)

                var address=addy;
                var txid=(d.in) ? d.in[0]['txid'] : null
                if(txid){
                    localStorage.setItem('txid', txid)
                    prereg(address, txid)
                    var confirms=(d.in && d.in[0]['confirmations']) ? d.in[0]['confirmations'] : 0;
                    var amount=(d.in) ? (d.in[0]['amount'] / 1000000000000) : 0
                    var receivedusd, expectedusd;
                    var paymenttype=document.createElement('span');
                    let wif=localStorage.getItem('wif');
                    if (wif && wif.length === 52) {
                        let pub=ann.getPublicAddressFromWif(wif);
                        let pubhash=await ann.sha256(pub);           
                        var issubst;
                        var valPlan=await ann.fetch('validatePlan', {
                            pubhash: pubhash,
                            txid: txid
                        }, 'POST');
                        console.log('valPlan :', valPlan);
                        issubst=Array.isArray(valPlan.result);
    
                        if (valPlan && issubst) {
                            localStorage.setItem('subst', 1)
    
                            receivedusd=valPlan.result[0];
                            expectedusd=valPlan.result[1];
    
                            if (receivedusd < expectedusd) {
                                paymenttype.innerHTML="UNDERPAYMENT";
                                ann.addClasses(paymenttype, 'under')
                            } else {
                                paymenttype.innerHTML="OVERPAYMENT";
                                ann.addClasses(paymenttype, 'over')
                            }
                            substitute=valPlan.result[3][0];
                        } else if (valPlan) {
                            receivedusd=valPlan.result;
                            paymenttype.innerHTML="CORRECT PAYMENT VERIFIED";
                            ann.addClasses(paymenttype, 'correct')
                        } else {
                            receivedusd=0
                        }
                        localStorage.setItem('receivedusd', receivedusd)
    
                        var timestamp=(d.in) ? d.in[0]['timestamp'] : Math.floor(new Date(d.created_at).getTime() / 1000);
                        const localDateTimeString=ann.localDateTimeFromEpoch(timestamp);
    
                        let buystep2=document.querySelector('buystep2 .buystep2-inner')
                        ann.show(buystep2, false)
    
                        let [h, c, cl]=ann.declareVars(29);

                        h.v4="Processing test payment"
                        h.v7='Deposit Recieved', h.v8='img/paid-' + curr + '.svg',
    
                        h.v9=paymenttype,
                        h.v12='Timestamp: ', h.v13=localDateTimeString,
                        h.v15='Address: ', h.v16=address,
                        h.v18='TXID: ', h.v19=txid,
                        h.v21='Amount: ', h.v22=amount.toFixed(6);
                        h.v24='Value ($): ', h.v25=receivedusd.toFixed(2),
                        // h.v27='Substitute Plan: ', h.v28=substitute,
                        h.v29='Processing... Please wait'
    
                        c.v2='f12rem crimson hide'
                        c.v3='jc-start mb-20 mediajcc',
                            c.v4='stepc', c.v5='hide', c.v7='font3 fsize4 cc-4', c.v8='p-10', c.v9='m-10-0', c.v10='paymentlabel',
                            c.v10='infolabels mt-5 mw-330 mr-10'
                        c.v11=c.v14=c.v17=c.v20=c.v23=c.v26='font3 jc-start flexalignleft mt-5 cc-4 f09rem d-t',
                        
                            c.v12=c.v15=c.v18=c.v21=c.v24=c.v27='deposititems'
                        c.v13=c.v16=c.v19=c.v22=c.v25=c.v28='ml-10 font1 cc-4 f09rem d-tc lb-a',
                            c.v28=c.v28 + " subst0"
                        c.v29='confirmations ariabuttonalt2 mt-30 mb-50',
                            c.v16=c.v16 + ' depaddress',
                            c.v19=c.v19 + ' txid';
    
                       // if (!issubst) {
                          c.v26=c.v26 + ' hide'; 
                       // }
    
                        let [html, css, clb]=ann.jsons2arrays([h, c, cl])
            
                        ann.cl.onload.buystep3=async function buystep3(salesdata = valPlan.data) {
    
                            var processingbtn=document.querySelector('.confirmations');
                            // do curr === 'XMR' if you want to wait for suggested_confirmations_threshold (usually 1 confirmation)
                            if (curr === 'XMRbypassfor0confs') {
                                let confs=document.querySelector('.confirmations');
                                var response, dataset;
                                let suggested_confirmations_threshold=(d.in[0]['suggested_confirmations_threshold']) ? d.in[0]['suggested_confirmations_threshold'] : 2;
                                while (confirms < 5) {
                                    await ann.sleep(3000);
                                    dataset={
                                        address: address,
                                        txid: txid
                                    };
                                    if (ann.keep.hasport && ann.keep.hasport.planid) {
                                        dataset['planid']=ann.keep.hasport.planid;
                                    }
                                    response=await ann.fetch('getConfirmations', dataset, 'POST');
                                    confs.innerHTML="Processing " + response.confirmations + " of " + suggested_confirmations_threshold + " confirmations... Please wait"
    
                                    if (response && response.fail) {
                                        break;
                                    }
                                    if (response && response.confirmations >= suggested_confirmations_threshold) {
                                        await ann.sleep(1000);
                                        break;
                                    }
                                }
                                if (response && response.fail) {
                                    ann.modal('UNKNOWN ERROR', "<span class='inlineb'>The payment failed. If you made a payment, please contact <span class='ahref' onclick='ariasupport()'>AriaVPN Support</span>, quoting reference code ARIAERR02M. We apologize for any inconvenience.</span>", 1);
                                    return;
                                }
                            } else {
                                await ann.sleep(7000);
                            }
                            if (localStorage.getItem('subst')) {
                                ann.addClasses(processingbtn, 'active');
                                if (parseFloat(localStorage.getItem('receivedusd')) < (0.001)) {
                                    subst0=document.querySelector('.subst0')
                                    subst0.innerHTML='Payment too low';
                                    processingbtn.innerHTML='Confirm Donation';
                                    ann.createListener(processingbtn, 'click', closebuysteps);
    
                                    function closebuysteps() {
                                        backToStep1()
                                        localStorage.removeItem('wif')
                                        localStorage.removeItem('pass')
                                        freeAddresses('bypass');
                                    }
                                } else {
                                    // processingbtn.innerHTML='Confirm Substitute Plan';
                                  //  ann.createListener(processingbtn, 'click', buystep4);
                                  buystep4(salesdata);
                                }
                                localStorage.removeItem('subst')
    
                            } else {
                                buystep4(salesdata);
                            }
                            localStorage.removeItem('receivedusd')
                        }
    
                        let name=['buystep3+ann.cl.onload.buystep3', buystep2.parentElement]
    
                        return ann.Subroutine(name,
                            ['buystep3_y', 'p', '$1_div_x', 'span', '$3_span', '$1_div_y', 'p', '$6_img', '$6_p', '$6_div_y',
                                '$10_div_x', 'span', '$11_span',
                                '$10_div_x', 'span', '$14_span',
                                '$10_div_x', 'span', '$17_span',
                                '$10_div_x', 'span', '$20_span',
                                '$10_div_x', 'span', '$23_span',
                                '$10_div_x', 'span', '$26_span',
                                '$6_button'
                            ],
                            [...html], [...css], [...clb]
                        );
                    }
                }
               
            }
            async function buystep4(salesdata) {
                console.log('salesdata :', salesdata);

                let buystep3=document.querySelector('buystep3')
                let terms=document.querySelector('.payingterms')
                ann.show(terms, false)
                ann.show(buystep3, false)
                let [h, c, cl, pr]=ann.declareVars(12, true);

                h.v3="Copy your private key"
                h.v8="Make a copy your Private Key",
                    h.v9='Use this private key for to access Auth Demo and Monero Pay.',
                    h.v10="Keep it safe; we cannot recover lost keys!",
                    h.v11=localStorage.getItem('wif'),
                    h.v12='VIEW DATA';

                c.v2='jc-start p-20',
                    c.v3='stepc', c.v4='hide', c.v6='hide', c.v8='font3 fsize4 cc-3', c.v7='hide', c.v9='cc-4 f09rem p-10 center',
                    c.v10='font2 red f09rem p-10 center', c.v11='copycontent copycontent2 keycopymedia mt-10',
                    c.v8=c.v8 + ' mt-40',
                    c.v12='mt-40 ariabuttonalt2 mb-50'

                cl.v12=registerStep; pr.v12=salesdata;

                let [html, css, clb, par]=ann.jsons2arrays([h, c, cl, pr])

                ann.cl.onload.buystep4=async function buystep4() {
                    ann.copyToClipboard();
                }
                let parent=(buystep3) ? buystep3.parentElement : document.querySelector('buystep2')
                let name=['buystep4+ann.cl.onload.buystep4', parent]

                return ann.Subroutine(name,
                    ['buystep4_y', 'div_x', 'span', '$2_span', '$1_div_y', "h3", '$5_select',
                        '$5_h3', '$5_p', '$5_p', '$5_p',
                        '$5_button'
                    ],
                    [...html], [...css], [...clb], [...par]
                );

                async function registerStep(id, e, salesdata) {
                    console.log('id, e, salesdata :', id, e, salesdata);

                    let copiedoff=document.querySelector('buystep4 .copycontent');
                    if (!copiedoff.classList.contains('off')) {
                        ann.modal('NOT COPIED', "Please copy your Private Key and keep it safe.", 1)
                        return;
                    }
                    ann.modal("ENTER PIN", "<p>Choose a 4-8 digit PIN code you will remember.<br><br></p><p>Your Private Key will be encrypted, securely held in browser's local storage and automatically retrieved each time you access a protected area.</p>", 2, e.path[2], 1);
                    await ann.modalResponse();
                    if (ann.get.modal.response == 0) {
                        return
                    }
                    let pass=localStorage.getItem('pass');
                    ann.createSession(pass, 15);
                    var encrypted=await ann.encryptRoutine(wif, pass);
                    console.log('encrypted :', encrypted);

                    if (encrypted && encrypted.item) {
                        localStorage.setItem('enwif', encrypted.item)
                        buystep5(salesdata)
                    }
                }

                async function buystep5(salesdata) {
                    console.log('salesdata :', salesdata);

                    let buystep4=document.querySelector('buystep4');
                    ann.show(buystep4, false);


                    var tablearray=[
                        ['Sales Item', 'Value', 'Description']
                    ]
                    var info;
                    for (let s in salesdata) {
                        if(s === "plan") {
                         let plan = salesdata[s];
                         for (let p in plan) {
                            let skip = false;
                            switch (p) {
                                case "fixprice":
                                    info="Fixed price in Monero we expected to recieve.";
                                    break;
                                case "usd":
                                    info="Current value of Monero in USD";
                                    break;
                                case "currency":
                                    info="Monero. Duh!";
                                    break;
                                case "referrer":
                                    info="Referring website so we can understand the origin of our sales traffic";
                                    break;
                                case "country":
                                    info="Country of sale derived from your IP address so we can understand the demographic demand.";
                                    break;                                                       
                                default:
                                    // Skipping records that aren't neccessary to show/define
                                    skip = true;
                                    break;
                            }
                            if(!skip) {    
                                tablearray.push([p, plan[p], info])
                            }
                         }                         
                        } else {
                            let skip = false;
                            switch (s) {
                                case "_id":
                                    info="Collection object ID";
                                    break;
                                case "pubhash":
                                    info="A SHA256 checksum of the cryptographically derived Public Key from the Private Key is used as the primary identifier of the user's identity. A foreign key to Identity collection (see Cryptographic Proofs in Auth Demo)";
                                    break;
                                case "address":
                                    info="Monero address of the recipient (ours)";
                                    break;
                                case "sales":
                                    info="The amount you paid.";
                                    break;
                                case "txid":
                                    info="Transaction ID of the transaction you've made.";
                                    break;
                                case "updated_at":
                                    info="Date and time when this collection was last updated";
                                    break;
                                case "created_at":
                                    info="Date and time when this collection was created";
                                    break;
                                case "double_spend_seen":
                                    info="Monero rpc record identifying double spend.";
                                    break;
                                case "confirmations":
                                    info="Number of confirmation. Monero Pay accept 0-confs by default.";
                                    break;                              
                                default:
                                    // Skipping records that aren't neccessary to show/define
                                    skip = true;
                                    break;
                            }
                            if(!skip) {                        
                                tablearray.push([s, salesdata[s], info])
                            }
                           
                        }
                    }

                    let [h, c, cl]=ann.declareVars(7);

                    h.v3='Data collected by Monero Pay'
                    h.v5="The following dataset is collected upon purchase. The sales data is associated with the Identity Collection using the pubhash value as a foreign key (see Cryptographic Proofs in Auth Demo)."
                    h.v6=tablearray
                    h.v7="Auth Demo",


                    c.v2='jc-start p-20', c.v3='stepc',c.v5='center mt-20 mb-20'
                    c.v7='mt-40 ariabuttonalt2 mb-50'

                    cl.v7=goToZKADemo

                    let [html, css, clb]=ann.jsons2arrays([h, c, cl])

                    let name=['buystep5', buystep4.parentElement]

                    return ann.Subroutine(name,
                        ['buystep5_y', 'div_x', 'span', '$1_div_y', 'p', '$4_table', '$4_button'],
                        [...html], [...css], [...clb]
                    );
                   
                    async function goToZKADemo(id, e) {

                        localStorage.removeItem('wif')
                        localStorage.removeItem('pass')

                        freeAddresses('bypass');

                        backToStep1()
                        await ann.sleep(500);
                        zkademo();
                    }
                }
            }

        } else {
            let log={
                function: 'buystep2',
                msg: 'nowif'
            }
            ann.fetch('errorLog', log, 'POST');
        }

        function generateQR(address, val=0.001, curr='XMR', size=150) {
            console.log('val :', val);

            var currency;
            if (curr === 'BCH') {
                currency='bitcoincash'
            } else if (curr === 'XMR') {
                currency='monero'
            } else if (curr === 'BTC') {
                currency='bitcoin'
            }
            var qrcodeEl=document.querySelector('.qrcanvas');
            console.log('qrcodeEl :', qrcodeEl);
            var color='#000000'
            qrcodeEl.innerHTML=''
            var qrtext=currency + ":" + address + "?amount=" + (val)
            var qrlink=document.querySelector('.qrlink');


            console.log('qrtext :', qrtext);
            qrlink.setAttribute('href', qrtext)
            var qr=new QRious({
                element: qrcodeEl,
                value: qrtext,
                foreground: color,
                size: size,
                // ,
            });
            ann.handleUnload();
        }


    }

    async function forkthis() {

        let [h, c, cl]=ann.declareVars(6);

            h.v3='Fork this on Github',
            h.v6="<a href='https://github.com/ariavpn/zka' target='_blank'>https://github.com/ariavpn/zka</a>"

        c.v1='jump4', c.v2='mw-800 mediaw90 center pb-150', c.v4='mt-20', c.v5='center',c.v6='f11rem center'
        let [html, css, clb]=ann.jsons2arrays([h, c, cl])


        return ann.Subroutine('forkthis',
            ['forkthis_y', 'div_y', 'h2', '$2_div_y', 'div_y', '$4_div'],
            [...html], [...css], [...clb]
        );

    }
    async function addfooter() {

        const root=window.location.origin;

        let copy='&copy;' + new Date().getFullYear() + '&nbsp;<a class="afoot" href="' + root + '">AriaVPN</a>.&nbsp;No Rights Reserved.';

        let [h, c, cl]=ann.declareVars(24);
        h.v5='<div class="flexitr"><a class="flexitr" href="https://ariavpn.net"><img src="img/arialogo.svg" alt="image 0" class="logoimg"><p class="f18rem m-0 cc-3 logotext Anek pointer">AriaVPN</p></a></div>',
            h.v9="<a class='afoot' href=" + root + ">AriaVPN</a>", h.v13='DEMO', h.v17='DISCOVER'
        h.v7='<button class="ariabuttonalt2">ALL SYSTEMS OPERATIONAL</button>'


        h.v11=['ZKA', 'License', "Fork This"],
            h.v15=['Auth Demo', 'Monero Pay'],
            h.v19=["Why Monero", "Get Monero Wallet", "Get Monero"]

        h.v21=copy,
            h.v23=['<a class="flex" href="https://hub.anne.media/signup_user_complete/?id=nuchzc4nuffa5kmwp3a7xt3mgc&md=link&sbr=fa" target="_blank"><img src="img/mattermost.svg" alt="AriaVPN iAMHub"></a>',
                '<a class="flex" href="https://x.com/ariavpn_net" target="_blank"><img src="img/x.svg" alt="AriaVPN X"></a>',
                '<a class="flex" href="https://www.linkedin.com/company/ariavpn" target="_blank"><img src="img/linkedin.svg" alt="AriaVPN LinkedIn"></a>',
                '<a class="flex" href="https://t.me/+ai1zHFrwvMdhZjY8" target="_blank"><img src="img/telegram.svg" alt="AriaVPN Telegram"></a>'
            ],
            h.v24="Made with <span class='red f12rem'>❤️</span> by Sovereign Privacy Rights Advocates"
        c.v1='o-v',
            c.v2='flexalignleft o-v', c.v3='footergrid o-v', c.v5='rel top-22', c.v6='h-100 minh-250 ac-c opssystem hide', c.v7='rel',
            c.v4=c.v8=c.v12=c.v16='footersection mw-300 w-100 h-a flexalignleft mb-30 r-10 o-v'
        c.v20='mt-30 jc-between copyfoot mb-20', c.v21='w-100', c.v22='jc-end mediajcc', c.v24='center'
        // c.v1='bg-alt h-30 bottom',c.v2='jself-start w-100 fontfix ml-50',c.v3='jself-start w-100 fontfix ml-50',
        // c.v5='ahref mr-75';


        cl.v11=[zkamenu, licensemenu, forkthismenu]
        cl.v15=[demomenu, paymenu]
        // cl.v7=[null, null, null, null, null, null, newsLetterSignUp]
        cl.v19=[whyMoneroVid, getWallet, getMonero]
        let [html, css, clb]=ann.jsons2arrays([h, c, cl])

        ann.cl.onload.footer=async function footer() {
            ann.waitForElement('footer', 'info', 'o-v');
            ann.waitForElement('footer', 'section', 'footerwrap');

        }

        return ann.Subroutine('footer+ann.cl.onload.footer',
            ['footer_y', 'div_y', 'div_x',
                '$3_div_y', 'div', '$4_ul', 'li',
                '$3_div_y', 'h3', '$8_ul', 'li',
                '$3_div_y', 'h3', '$12_ul', 'li',
                '$3_div_y', 'h3', '$16_ul', 'li',
                '$2_div_x', 'p', '$20_div_x', 'div_y', '$1_p'
            ],
            [...html], [...css], [...clb]
        );

        async function getWallet() {
            await mainonoff()
            let imgs=['img/m-gui.png', 'img/cake_logo.png', 'img/m-monerujo.png', 'img/m-feather.png']
            let headers=['Monero GUI Wallet', 'Cake Wallet', 'Monerujo', "Feather"];
            let texts=[
                'An open-source graphical user interface (GUI) wallet developed by the Monero community, completely free to use, suitable for both beginners and advanced users.',
                'Securely store, send and exchange your crypto with ease. Privately buy gift cards and pay at the counter with crypto, piece of cake.',
                'Android Wallet for Monero. With Monerujo, you can seamlessly move back and forth between several wallets. Making a new one is as simple as a few taps.',
                "Feather is a free, open-source Monero wallet for Linux, Tails, Windows and macOS. Easy-to-use, small, fast and beginner friendly.",
            ];

            let [h, c, cl]=ann.declareVars(10);
            h.v4='Monero: <span class="cc-3">Wallet Choices</span>', h.v9='<< Back'
            h.v6=imgs, h.v7=headers, h.v8=texts,
                h.v10='Curious? Learn more at <a class="fsize4" href="https://www.getmonero.org/" target="_blank">getmonero.org</a>';
            c.v1='w-100 h-100 scrollbar o-y-a z-top jc-start footerpromos', c.v3='mt-80 mw-1400 pb-150 o-v', c.v4='color-3 vmax4 mb-20 center',
                c.v5='service-container', c.v6='singleserviceb+serviceicon', c.v7='servicetitle',
                c.v8='serviceinner', c.v9='hide'

            c.v10='fsize4 font3 mt-20 center pb-150 cc-4';

            cl.v9=closeGetWallet

            let [html, css, clb]=ann.jsons2arrays([h, c, cl])

            ann.cl.onload.getWallet=async function getWallet() {
                let wallets=document.querySelectorAll('getwallet .singleserviceb')
                wallets.forEach(function (el, i) {
                    ann.createListener(el, 'click', openWallet, i)
                });

                function openWallet(id, e, i) {
                    console.log('id, e, i :', id, e, i);
                    if (i == 0 || !i) {
                        window.open("https://getmonero.org/downloads", '_blank')
                    } else if (i == 1) {
                        window.open("https://cakewallet.com", '_blank')
                    } else if (i == 2) {
                        window.open("https://monerujo.io", '_blank')
                    } else if (i == 3) {
                        window.open("https://featherwallet.org", '_blank')
                    }

                }
                let getwallet=document.querySelector("getwallet")
                moveFooter(getwallet)
            }
            let name=['getwallet+ann.cl.onload.getWallet', document.querySelector('.main-inner')]
            return ann.Subroutine(name,
                ['getwallet', 'div_y', 'div_y', 'h2', '$3_div_x', '^_img', '^_h3', '^_p',
                    '$2_back', '$3_p'
                ],
                [...html], [...css], [...clb]
            );

            function closeGetWallet() {
                let gw=document.querySelector('getwallet');
                gw.remove()
                mainonoff(true)
            }

        }
        async function getMonero() {
            await mainonoff()
            let imgs=['img/gm-localmonero.png', 'img/gm-tradeogre.png', 'img/gm-changenow.webp', 'img/m-kraken.jpg']
            let headers=['Local Monero', 'Tradeogre', 'ChangeNOW', "Kraken"];
            let texts=[
                'LocalMonero is the biggest, most trusted and well-established Peer-to-Peer Monero trading platform in the Monero community. No KYC checks - you can simply buy or sell monero anonymously without ID verification with PayPal, credit card, gift card, cash by mail or convert bitcoin to monero.',
                'A small but reliable non-KYC cryptocurrency exchange with just 0.2% trading fee on all fulfilled orders. Withdrawal fees are dynamically calculated based on the specific coin technology. Tradeogre strive to have minimal withdrawal fees.',
                'Fast crypto exchange. Buy, Sell, and Swap Crypto: Simple, Fast, Free of Custody. You can start from less than $2 and swap as much crypto as you want – there is no upper limit. Change NOW!',
                "Kraken is a crypto exchange for everyone. Crypto makes the world go forward and Kraken makes it easy to get started. Sign up today to buy and sell 200+ cryptocurrencies.",
            ];

            let [h, c, cl]=ann.declareVars(10);
            h.v4='Monero: <span class="cc-3">Where to buy</span>', h.v9='<< Back'
            h.v6=imgs, h.v7=headers, h.v8=texts,
                h.v10='Curious? Learn more at <a class="fsize4" href="https://www.getmonero.org/" target="_blank">getmonero.org</a>';
            c.v1='w-100 h-100 scrollbar o-y-a z-top jc-start footerpromos', c.v3='mt-80 mw-1400 pb-150 o-v', c.v4='color-3 vmax4 mb-20 center',
                c.v5='service-container', c.v6='singleserviceb+serviceicon', c.v7='servicetitle',
                c.v8='serviceinner', c.v9='hide',

                c.v10='fsize4 font3 mt-20 center pb-150 cc-4';

            cl.v9=closeGetMonero

            let [html, css, clb]=ann.jsons2arrays([h, c, cl])

            ann.cl.onload.getMonero=async function getMonero() {
                let places=document.querySelectorAll('getmonero .singleserviceb')
                places.forEach(function (el, i) {
                    console.log('els[i] :', el, i);
                    ann.createListener(el, 'click', openPlace, i)

                });

                function openPlace(id, e, i) {
                    console.log('id, e, i :', id, e, i);
                    if (i == 0 || !i) {
                        window.open("https://localmonero.co/?rc=bwx1", '_blank')
                    } else if (i == 1) {
                        window.open("https://tradeogre.com", '_blank')
                    } else if (i == 2) {
                        window.open("https://changenow.app.link/referral?link_id=78d81bf4d3ce8d", '_blank')
                    } else if (i == 3) {
                        window.open("https://www.kraken.com/learn/buy-monero-xmr", '_blank')
                    }
                }
                let getmonero=document.querySelector("getmonero")
                moveFooter(getmonero)
            }
            let name=['getmonero+ann.cl.onload.getMonero', document.querySelector('.main-inner')]
            return ann.Subroutine(name,
                ['getmonero', 'div_y', 'div_y', 'h2', '$3_div_x', '^_img', '^_h3', '^_p',
                    '$2_back', '$3_p'
                ],
                [...html], [...css], [...clb]
            );

            function closeGetMonero() {
                let gm=document.querySelector('getmonero');
                gm.remove()
                mainonoff(true)
            }

        }
        async function whyMoneroVid() {
            await mainonoff()
            let [h, c, cl]=ann.declareVars(7);
            h.v4='Monero: <span class="cc-3">The Essentials</span>', h.v6='<< Back'
            h.v7='Curious? Learn more at <a class="fsize4" href="https://www.getmonero.org/" target="_blank">getmonero.org</a>';
            c.v1='w-100 h-100 scrollbar o-y-a z-top jc-start footerpromos', c.v3='mt-50 mw-1400 pb-150', c.v4='color-3 vmax4 mb-20 center', c.v5="mw-70 w-100 pointer h-a",
                c.v6='hide', c.v7='fsize4 font3 mt-20 center'
            cl.v6=closeVid

            let [html, css, clb]=ann.jsons2arrays([h, c, cl])

            ann.cl.onload.whyMoneroVid=async function whyMoneroVid() {
                let vid=document.querySelector('mvid video')
                vid.poster="vids/monero-cash-video-poster.png"
                vid.preload="metadata"
                vid.setAttribute("aria-label", "Video Monero: The essentials")
                vid.src="vids/Monero%20-%20The%20Essentials.m4v"
                vid.controls=true;
                vid.play();
                let mvid=document.querySelector("mvid")
                moveFooter(mvid)
            }
            let name=['mvid+ann.cl.onload.whyMoneroVid', document.querySelector('.main-inner')]
            return ann.Subroutine(name,
                ['mvid', 'div_y', 'div_y', 'h2', '$3_video', '$2_back', '$3_p'],
                [...html], [...css], [...clb]
            );

            function closeVid() {
                let mvid=document.querySelector('mvid');
                mvid.remove()
                mainonoff(true)
            }

        }

    }

}

ann.runLast(ann.handleUnload);
