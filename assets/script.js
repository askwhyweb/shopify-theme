

(function($){
	

	// $(window).scroll(function() {
	// 	var scrollDistance = $(window).scrollTop();
	// 	$('.nonprofit_single_cat_wrap').each(function(i) {
	// 			if ($(this).position().top <= scrollDistance-600) {
	// 					$('.non_profit_nav a.active').removeClass('active');
	// 					$('.non_profit_nav a').eq(i).addClass('active');
	// 			}
	// 	});
	// }).scroll();

	var component2    = $("#header");
	var state         = "BEFORE_SCROLL";
	var component     = $("#main");
	var page          = $("#page");
	var body          = $("body");
	burger            = $('.header__nav-button');
	var blurZone      = $("<div class='nav-blur-zone'></div>");
	var isOpen        = false;
	var activeElement = null;
	var mode          = $(window).innerWidth() >= 992 ? "PC" : "MOBILE";


	//-------- Events Handlers --------

function openBurger(){
	$('.header__nav-button').addClass('header__nav-button_open');
}

// closeBurger

function closeBurger(){
	$('.header__nav-button').removeClass('header__nav-button_open');
}


function open(){
	if(isOpen == false)
	{
		isOpen = true;

		body.css("overflow", "hidden");
		openBurger();
		component.addClass("nav_open");
		blurZone.prependTo("#page");
	}
}

// close
function close(){
	if(isOpen == true)
	{
		isOpen = false;		
		body.css("overflow", "auto");
		closeBurger();
		component.removeClass("nav_open");
		blurZone.remove();
	}
}

// changeState

function changeState(){
	component2.css('transitionDuration', '0.4s');

	if(pageYOffset >= 30 && state === "BEFORE_SCROLL")
	{
		state = "AFTER_SCROLL";
		console.log(pageYOffset);
		console.log("scrolling", state);
		component2.addClass("is_sticky");
	}

	else if(pageYOffset < 30 && state === "AFTER_SCROLL")
	{
		state = "BEFORE_SCROLL";
		console.log(pageYOffset);
		console.log("not scrolling", state);
		component2.removeClass("is_sticky");
		
	}
}




// Scroll
$(window).on('scroll', function(){
	changeState();
});
$(document).ready(function(){
	changeState();
});


$('body').on('click', '.nav-blur-zone', function(){
	close();
});





$('body').on('click', '.header__nav-button', function(e){


	$('#main').toggleClass('nav_open');
	$('.header__nav-button').toggleClass('header__nav-button_open');
});



	//Banner Text Rotater
	$("#js-rotating").Morphext({
    	animation: "fadeIn",
    	// An array of phrases to rotate are created based on this separator. Change it if you wish to separate the phrases differently (e.g. So Simple | Very Doge | Much Wow | Such Cool).
    	separator: ",",
    	// The delay between the changing of each phrase in milliseconds.
    	speed: 2000
    	});

	












})(jQuery);


