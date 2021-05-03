$(document).ready(function() {

    $("#owl-demo").owlCarousel({
     autoplay: true,
  center: true,
  loop: true,
  nav: false,
   items:5,
   responsive : {
        0:{
            items:1,
            nav:true
        },
        480:{
            items:1,
            nav:false
        },
        768:{
            items:5,
            nav:true
           
        }
   }

    });

  $(".animsition").animsition({
    inClass: 'fade-in',
    outClass: 'fade-out',
    inDuration: 1500,
    outDuration: 800,
    linkElement: '.animsition-link',
    // e.g. linkElement: 'a:not([target="_blank"]):not([href^=#])'
    loading: true,
    loadingParentElement: 'body', //animsition wrapper element
    loadingClass: 'animsition-loading',
    loadingInner: '', // e.g '<img src="loading.svg" />'
    timeout: false,
    timeoutCountdown: 5000,
    onLoadEvent: true,
    browser: [ 'animation-duration', '-webkit-animation-duration'],
    // "browser" option allows you to disable the "animsition" in case the css property in the array is not supported by your browser.
    // The default setting is to disable the "animsition" in a browser that does not support "animation-duration".
    overlay : false,
    overlayClass : 'animsition-overlay-slide',
    overlayParentElement : 'body',
    transition: function(url){ window.location.href = url; }
  });
    /******slider********* */

  
  /****banner_slider******/


  });

  function setHeight() {
    windowHeight = $(window).innerHeight()- $(".header_sec").height();
    $('.banner_containt').css('height', windowHeight + 'px');
  };
  setHeight();
  
  $(window).resize(function() {
    setHeight();
  });
/***section_height***/

  



  
