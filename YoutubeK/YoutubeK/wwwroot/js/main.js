$(document).on('ready', function() {
    var controller = new ScrollMagic.Controller();
    var scrollLocked = false;
    
    var box1 = '#box-1',
        box2 = '#box-2',
        box3 = '#box-3',
        box4 = '#box-4';
        box5 = '#box-5';
    
    var scene1 = new ScrollMagic.Scene({triggerElement: '#box-intro', duration: $('#box-intro').outerHeight()})
        //.addIndicators({name: '1'})
        .setClassToggle('#box-intro', "active")
        .addTo(controller);

    var scene1 = new ScrollMagic.Scene({triggerElement: box1})
      //  .addIndicators({name: '1'})
        .setClassToggle(box1, "passed")
        .addTo(controller);

    var scene2 = new ScrollMagic.Scene({triggerElement: box2})
       // .addIndicators({name: '2'})
        .setClassToggle(box2, "passed")
        .addTo(controller);

    var scene3 = new ScrollMagic.Scene({triggerElement: box3})
        //.addIndicators({name: '3'})
        .setClassToggle(box3, "passed")
        .addTo(controller);

    var scene4 = new ScrollMagic.Scene({triggerElement: box4})
        //.addIndicators({name: '4'})
        .setClassToggle(box4, "passed")
        .addTo(controller);


    function scrollClip() {
        $(window).on('scroll', function() {
            if (!scrollLocked) {
                if ($(window).scrollTop() >= $(box5).offset().top) {
                    var percent = $(window).scrollTop() - $(box5).offset().top;
                    var result = (percent / $(box5).outerHeight()) * 200;
                    $('#box-5 .black-version').css({ 'clip-path': 'inset(0px 0px '+ result +'%)' });
                    $(box5).addClass('passed');
                    if ($(window).scrollTop() + $(window).height() >= $('#box-6').offset().top) {
                        $(box5).addClass('passed-away');
                        $(box5).removeClass('passed');
                    } else {
                        $(box5).removeClass('passed-away');
                    }
                } else {
                    $(box5).removeClass('passed');
                    $(box5).removeClass('passed-away');
                }
            }
        });
    };
    
    scrollClip();

    var scene5 = new ScrollMagic.Scene({triggerElement: box5, duration: $('#box-5').outerHeight()})
        .on('enter', function() {
            scrollLocked = false;
            scrollClip();
        })
        .on('leave', function() {
            $(box5).removeClass('passed');
            scrollLocked = true;
        })
        //.addIndicators({name: '5'})
        .addTo(controller);

    $('.owl-carousel').owlCarousel({
        loop: true,
        items: 1,
        autoplay: true,
        autoplayTimeout: 5000,
        autoplaySpeed: 1000,
        autoplayHoverPause: true,
    });
});