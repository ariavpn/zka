<!DOCTYPE html>
<html lang="en" translate="no">
	<head>
		<meta charset="utf-8">
        <meta name="csrf-token" content="{{ csrf_token() }}">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- Primary Meta Tags -->
        <title>Zero Knowledge Architecture | AriaVPN</title>
        <link rel="canonical" href="https://zka.ariavpn.net" />
        <link rel="alternate" hreflang="en-us" href="https://zka.ariavpn.net" />

        <meta name="application-name" content="AriaVPN">
        <meta name="msapplication-tooltip" content="AriaVPN">
        <meta name="msapplication-TileColor" content="#0E50FA">
        <meta name="msapplication-TileImage" content="{{ asset('fav/favicon.png') }}">
        
        <meta name="robots" content="index, follow">
        <meta name="title" content="Zero Knowledge Architecture | AriaVPN">
        <meta name="description" content="AriaVPN is a private VPN service that protects your online identity. Fortify your privacy and get premium VPN access today! We accept Monero, Bitcoin and Bitcoin Cash.">
        <meta name="domain" content="ariavpn.net">
        <meta name="mobile-web-app-capable" content="yes">
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url('/') }}">
        <meta property="og:title" content="Zero Knowledge Architecture | AriaVPN">
        <meta property="og:description" content="AriaVPN is a private VPN service that protects your online identity. Fortify your privacy and get premium VPN access today! We accept Monero, Bitcoin Cash and Bitcoin.">
        <meta property="og:image" content="{{ asset('img/ariavpn-banner.png?v=3') }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="627">
        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="{{ url('/') }}">
        <meta property="twitter:title" content="Zero Knowledge Architecture | AriaVPN">
        <meta property="twitter:description" content="AriaVPN is a private VPN service that protects your online identity. Fortify your privacy and get premium VPN access today! We accept Monero, Bitcoin Cash and Bitcoin.">
        <meta property="twitter:image" content="{{ asset('img/ariavpn-banner.png?v=3') }}">

        <link rel="icon" type="image/svg+xml" href="{{ asset('fav/favicon.svg') }}">
        <link rel="icon" type="image/png" href="{{ asset('fav/favicon.png') }}">

        <link rel="preload" href="fonts/aneklatin/AnekLatin-Medium.woff2" as="font" crossorigin="anonymous">
        <link rel="preload" href="fonts/raleway/Raleway-Bold.woff2" as="font" crossorigin="anonymous">
        <link rel="preload" href="fonts/inter/Inter-Regular.woff2" as="font" crossorigin="anonymous">
        <link rel="preload" href="fonts/inter/Inter-Medium.woff2" as="font" crossorigin="anonymous">
        <link rel="preload" href="fonts/inter/Inter-SemiBold.woff2" as="font" crossorigin="anonymous">


        <link rel="stylesheet" href="css/fonts-min.css?v=121" type="text/css" />
        <link rel="stylesheet" href="css/annika.css?v=121" type="text/css" />
        <link rel="stylesheet" href="css/aria.css?v=121" type="text/css" />
        <link rel="stylesheet" href="css/aria-media-min.css?v=121" type="text/css" />
        <script id='annika.js' src="js/annika/annika.js?v=121"></script>    
        

<style>

:root {
    --bg: #F3F4F4;
    --text1:#0E50FA;
    --text2:#667E93;
    --text3:#293041;
    --text4: #1D1D1D;
    --text5: #00aaff;
    --primary: #0E50FA;
    --primary-85:  hsla(226, 100%, 46%, 0.85);
    --secondary: #38ACFF;  /* rgb(94, 94, 94); */
    --secondary-90: rgba(94, 94, 94, 0.9);
    --tertiary: #ff6600;
    --tertiary-alt: #0AC18E;    
    --quaternary: #ffca00;
    /* --quaternary: #e7d321; */
    --quinary: #1e1e1e;
    --quinary-90: rgba(46, 46, 46, 0.9);
    --senary: #7a3100;
    --senary-alt: #1b4e40; 
    --septenary: #EB3231;
    --septenary-90: rgba(206, 109, 158, 0.9);
    /* septenary, octonary, nonary, and denary */
    --contrast-1: #ffffff;
    --contrast-2: #F3F4F4;
    --contrast-3: #DFDFDF;
    --contrast-4: #bdbdbd;
    --contrast-5: #ACACAC;
    --contrast-6: #ff9acc;
    --contrast-7: #000000;
    --contrast-8: #1a1a19;
    --contrast-9: #727272;
    --contrast-10: #0E50FA;
    --font1: 'Inter';
    --font2: 'Inter Medium';
    --font3: 'Inter Semibold';
    --font4: 'Inter Light';
    --font5: 'sugiono';
    --font6: 'Raleway Bold';
    --fsize1: 0.8rem;
    --fsize2: 0.85rem;
    --fsize3: 0.9rem;
    --fsize4: 0.95rem;
    --fsize5: 1rem;
    --fsize6: 1.1rem;
    --fsize7: 1.2rem;
    --fsize8: 1.3rem;
    --gradient1: radial-gradient(50% 50%at 50% 50%,rgba(12, 207, 113, 0.1),transparent),radial-gradient(50% 50%at 50% 50%,rgba(27, 27, 27, 0),rgba(27, 27, 27, 0) 49.48%);
    --gradient2: radial-gradient(50% 50%at 50% 50%,rgba(255, 255, 255, 0.1),rgba(255, 255, 255, 0)),linear-gradient(92deg,rgba(192, 112, 216, 0.3) 15.83%,rgba(23, 23, 23, 0.3) 63.01%),rgba(255, 255, 255, 0.1);
    --gradient3: linear-gradient(92deg,rgba(94, 164, 230, 0.2) 15.83%,rgba(23, 23, 23, 0.2) 63.01%),rgba(255, 255, 255, 0.02);
    --gradient4: radial-gradient(50% 50%at 50% 50%,rgba(255, 255, 255, 0.1),rgba(255, 255, 255, 0)),linear-gradient(92deg,var(--contrast-10) 15.83%,rgb(0 144 255 / 84%) 63.01%),rgba(255, 255, 255, 0.1);
    --gradient5: radial-gradient(50% 50%at 50% 50%,rgba(255, 255, 255, 0.1),rgba(255, 255, 255, 0)),linear-gradient(92deg,rgb(0 66 255 / 65%) 15.83%,rgb(0 144 255 / 84%) 63.01%),rgba(255, 255, 255, 0.1);
    --gradient6: linear-gradient(92deg, rgb(94 164 230 / 8%) 15.83%, rgba(23, 23, 23, 0.2) 63.01%), rgba(255, 255, 255, 0.02);
    --tshadow1: 0 0 24px #f1dbff1a, 0 0 34px #ffffff12, 0 0 34px #ffffff1f, 0 0 44px #ffffff1c, 0 0 54px #ffffff17;
    --tshadow1: 0 0 24px #f1dbff1a, 0 0 34px #ffffff12, 0 0 34px #ffffff1f, 0 0 44px #7a00ff36, 0 0 54px #ffbccb0f;
    --menu-button: center center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA50lEQVR4nO2ZSwrCQBBE61JqbiEGTyUEvJFGTyTJvtxkERtCT8SkW60Hta8PzSwGEEK8yxHADUAPgMHqAbQA6rkhzgnMc0LNnCWYXIeSIPcERunoWhIkw03QUVcShF8il2iDVBBDdNPUIoa/WWSD5dmtEWS7fA5UawTJIpdog1QQQ3TT1CKG6KapRQxeI3oQZ1DpHRkRfcTUsRuim6YWMUQ3TS1i0IP4QSo9iCOij5g6dkN009Qihp9ZpEtgko4eJUHaBEbp6FISpE5glI72KKRJYJYTOmEmh2HCDJ+j/eCleAkhBF54Aj2FLyjaL47VAAAAAElFTkSuQmCC);

    --menu-close: center center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAADEklEQVR4nO2a3WoUMRTHf3Zlq/VrQboLilqL3kipfQu9WKSoeCv1YfSq7+AH9kZEbRfK+h5e+YGtItSC29Uu1lGrF8ms29mZaXI6iSPmB7nZzUnO+U+SOZMEAoFAIBAIBAKBwP/IvoLaqQDngDNAHRgHDgGHC2p/E+gB68BHYAV4CWwX1L6YGWAB6AK/PJcu8BCYdh5lBreA7zkO+ioRMOc41iFmKEfwgyJ4HQkLDoLYa3kgCUSyCFaAT8BRSYcO2QCOY7kwjgg6Ok/5ggeooXyzQiLAaYGNL07ZGkgEaAhsfGHtm0SAcYGNL+q2BhIBjljW7wEvgC0Lmy1t07Psy9Y3kQD7Leo+BU4AU6g0uW1g09Z1p4CTug0Xvom5g9l7eZPht0UVWMqxWdJ1BjmGGgkmfd62DcblCFgBPid+i4BrQCulfkv/FyV+7+q2ivStj0QAU5tJ0helNBGygge1sk8a9lkxrNdHIoApB4D7DA9p2ClCXvBV4B4w6shHEfPY5ehp8zqmust/eetFWpm3DcblCIhpAs9QIyJJRPaTf6RtneJDAIDLwBPSRUgSB3/FqUcaXwKAmQhegwe/AoCap0XUKQyfAiwDV8lPiSPgBmrN8IIvAUyCj4lFWHTqkcaHAC1glvTgs16DsQhpGWOhuBagTX6S81iXNBG+AdeB5868E2KaCH0l+/s8meTkJUsN1OgpTSJkuun4GnWKkyR+8oNJTpPskbAGvDHs86dhvT4SAX4Y1juL+pQdJC34mCwRasBEwb71cSnAGHCXPyI0UCt7Xnrb1HXiqVPTbRws2Lc+kh0Um05mgQ/AW9ThadY8H+QSsIqaQhMoIV34BsgE+GJZfwy4YGkzKrCB4Q2YXZFMgbSFrSxY+yYRYE1g4wtr3yQCvBPY+OK9rYHkcHQE6FC+80Fvh6PbqMytbCzi8crMRVR+/7fvBMQlQh2keGWOcogQATcdx5rJNOpmRifHQVelg9p239OTL+qa3Ag7r8nVUXt/yW8BKRuoL8J11KtuFXhFCa7JBQKBQCAQCAQCgX+T32P1rXjZHIHkAAAAAElFTkSuQmCC);

    --menu-left: center center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAs0lEQVR4nO3YPQrCUBRE4VPYGC1ugq5QcBWCywoKFrH0p9ANRdJIEGPrncd8kCLlYZLwCJiZmelZAxsKiHgCPbCjgIheNWYFPD4ihusEzBBRA7cvEWdgiYjaEUl4iUxLXNVf7HBEEuElkogSlmiA+8TZqUJoiYv6EkWFDByjtkxXWswCMeEYsWWOwBwx4ZikvIzaMgfFD0AzcexvlX6Z/lpmj6gYxchGjB+z7fvOzMyM/3oBpEGsCx9x36kAAAAASUVORK5CYII=);

    --menu-right: center center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAq0lEQVR4nO3WWwrCQBBE0Tt7EXzMZgKKG9Mori/gYwv6oQQMiCS/0tXWgVnApRoSMDMzi6MBFohbA3fgBlTEI57vd1WNOX1EDO8MzBFTgMNITL/MCjHFMYGXaTOdWesYsWWWJIm5qMbsHRNQumWOIzEdMEMwZjexTCXJiVXEfy6lTmtqCUf8mpeIwktE4SWi8BJRlAxfbLJE9LbAQz3iO0Y6YrDJEGFmZv/nBXoyq5wBMXErAAAAAElFTkSuQmCC);
    
    --currency-input: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='16px' width='85px'><text x='5' y='16' fill='gray' font-size='12' font-family='Inconsolata'>BCH</text></svg>");
    --mvw: 90%;

    --active-collapsible: "I";

    --cyber-bg: url(../img/cyberpunk-bg.png) #ffffff;
    --cyber-bg2: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAG0lEQVQYV2P8//+/FCMj4zMGJMCIzIGxKRQEAJgPBAbJqUVTAAAAAElFTkSuQmCC);
    --ui-glow: 0 0 5px var(--septenary);
    --ui-glow-borders--500: 0 0 3px var(--primary);
    --ui-glow-color: rgba(0, 182, 0, 0.308);
    --ui-glow-text0: -9px -6px 10px var(--ui-glow-color);
    --ui-glow-text: 0 0 5px #fff, 0 0 10px #443b3b, 0 0 15px #fff, 0 0 20px var(--contrast-2) #2a3074, 0 0 30px #2a3074, 0 0 40px #2a3074, 0 0 30px #2a3074, 0 0 45px #2a3074;
    --ui-glow-text2: 0 0 5px #fff, 0 0 50px #fff, 0 0 15px #fff, 0 0 10px #af1135, 0 0 20px #af1135, 0 0 30px #af1135, 0 0 50px #af1135, 0 0 75px #af1135;
    --ui-glow-text3: 0 0 2.5px #02678B, 0 0 5px #026785, 0 0 5px #026785, 0 0 4.5px #af1135, 0 0 5px #af1135, 0 0 5px #af1135, 0 0 10px #026785, 0 0 7.5px #af1135;
    --ui-glow-text-dimmed: -0px -0px 20px var(--ui-glow-color);
    --planhead: "MOST POPULAR";

}
</style>
    </head>
    <body id="body" class='flexitc'>
        <div class='fs flexitc loader-wrap z-top'>
            <div class="loader">                
                <span><i></i></span>
            </div>
        </div>
 

        <?php ob_start() ?>
        <script>

   
      let scripts = ["annika/annika-protect.js"];
     // let scripts = ['libs/dexie.js', 'libs/qrcode.js','dbmodel-min.js', 'libs/qrcode.js', 'libs/aesjs.js', 'libs/bitcoin.js','libs/crypto-js.min.js','app-min.js?v=121'];

            const loader = new ann.ScriptLoader({ folder: 'js', src: scripts})
            loader.load();
        </script>
    </body>
</html>
