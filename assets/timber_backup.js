if ((typeof Shopify) === 'undefined') { Shopify = {}; }
if (!Shopify.formatMoney) {
  Shopify.formatMoney = function(cents, format) {
    var value = '',
        placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
        formatString = (format || this.money_format);

    if (typeof cents == 'string') {
      cents = cents.replace('.','');
    }

    function defaultOption(opt, def) {
      return (typeof opt == 'undefined' ? def : opt);
    }

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal   = defaultOption(decimal, '.');

      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number/100.0).toFixed(precision);

      var parts   = number.split('.'),
          dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
          cents   = parts[1] ? (decimal + parts[1]) : '';

      return dollars + cents;
    }

    switch(formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  };
}

if (!Shopify.resizeImage) {
  Shopify.resizeImage=function(e,t){
    try{
      if("original"==t)
        return e;
      var n = e.match(/(.*\/[\w\-\_\.]+)\.(\w{2,4})/);
      return n[1]+"_"+t+"."+n[2]
    } catch(r) {
      return e;
    }
  }
}

// Timber functions
window.timber = window.timber || {};

timber.cacheSelectors = function () {
  timber.cache = {
    // General
    $html                    : $('html'),
    $body                    : $(document.body),

    // Navigation
    $navigation              : $('#AccessibleNav'),
    $mobileSubNavToggle      : $('.mobile-nav__toggle'),

    // Collection Pages
    $changeView              : $('.change-view'),

    // Product Page
    $productImage            : $('#ProductPhotoImg'),
    $thumbImages             : $('#ProductThumbs').find('a.product-single__thumbnail'),

    // Customer Pages
    $recoverPasswordLink     : $('#RecoverPassword'),
    $hideRecoverPasswordLink : $('#HideRecoverPasswordLink'),
    $recoverPasswordForm     : $('#RecoverPasswordForm'),
    $customerLoginForm       : $('#CustomerLoginForm'),
    $passwordResetSuccess    : $('#ResetSuccess')
  };
};

timber.init = function () {
  FastClick.attach(document.body);
  timber.cacheSelectors();
  timber.accessibleNav();
  timber.drawersInit();
  timber.mobileNavToggle();
  //timber.productImageSwitch();
  timber.responsiveVideos();
  timber.collectionViews();
  timber.loginForms();
};

timber.accessibleNav = function () {
  var $nav = timber.cache.$navigation,
      $allLinks = $nav.find('a'),
      $topLevel = $nav.children('li').find('a'),
      $parents = $nav.find('.site-nav--has-dropdown'),
      $subMenuLinks = $nav.find('.site-nav__dropdown').find('a'),
      activeClass = 'nav-hover',
      focusClass = 'nav-focus';

  // Mouseenter
  if ($(window).width() > 1024) {
  $parents.on('mouseenter touchstart', function(evt) {
    var $el = $(this);

    if (!$el.hasClass(activeClass)) {
      evt.preventDefault();
    }

    showDropdown($el);
  });

  // Mouseout
  $parents.on('mouseleave', function() {
    hideDropdown($(this));
  });

  }
    
  $subMenuLinks.on('touchstart', function(evt) {
    // Prevent touchstart on body from firing instead of link
    evt.stopImmediatePropagation();
  });

  $allLinks.focus(function() {
    handleFocus($(this));
  });

  $allLinks.blur(function() {
    removeFocus($topLevel);
  });

  // accessibleNav private methods
  function handleFocus ($el) {
    var $subMenu = $el.next('ul'),
        hasSubMenu = $subMenu.hasClass('sub-nav') ? true : false,
        isSubItem = $('.site-nav__dropdown').has($el).length,
        $newFocus = null;

    // Add focus class for top level items, or keep menu shown
    if (!isSubItem) {
      removeFocus($topLevel);
      addFocus($el);
    } else {
      $newFocus = $el.closest('.site-nav--has-dropdown').find('a');
      addFocus($newFocus);
    }
  }

  function showDropdown ($el) {
    $el.addClass(activeClass);

    setTimeout(function() {
      timber.cache.$body.on('touchstart', function() {
        hideDropdown($el);
      });
    }, 250);
  }

  function hideDropdown ($el) {
    $el.removeClass(activeClass);
    timber.cache.$body.off('touchstart');
  }

  function addFocus ($el) {
    $el.addClass(focusClass);
  }

  function removeFocus ($el) {
    $el.removeClass(focusClass);
  }
};

timber.drawersInit = function () {
  timber.LeftDrawer = new timber.Drawers('NavDrawer', 'left');
  {% if settings.ajax_cart_method == "drawer" %}
    timber.RightDrawer = new timber.Drawers('CartDrawer', 'right', {
      'onDrawerOpen': ajaxCart.load
    });
  {% endif %}
};

timber.mobileNavToggle = function () {
  timber.cache.$mobileSubNavToggle.on('click', function() {
    $(this).parent().toggleClass('mobile-nav--expanded');
  });
};

timber.getHash = function () {
  return window.location.hash;
};

timber.productPage = function (options) {
  var moneyFormat = options.money_format,
      variant = options.variant,
      selector = options.selector,
      product_id = options.product_id;

  var $productImage = $('#AddToCartForm--'+product_id+' #ProductPhotoImg'),
      $addToCart = $('#AddToCartForm--'+product_id+' #AddToCart'),
      $productPrice = $('#AddToCartForm--'+product_id+' #ProductPrice'),
      $comparePrice = $('#AddToCartForm--'+product_id+' #ComparePrice'),
      $comparePriceClass = $('#AddToCartForm--'+product_id+' .ComparePrice'),
      $youSave = $('#AddToCartForm--'+product_id+' #YouSave'),
      $quantityElements = $('#AddToCartForm--'+product_id+' .quantity-selector, #AddToCartForm--'+product_id+' .js-qty'),
      $addToCartText = $('#AddToCartForm--'+product_id+' #AddToCartText');
  	  $addToCartTextPopup = $('#quick-view #AddToCartForm--'+product_id+' #AddToCartText');
  	  $addToCartTextProduct = $('.template-product #AddToCartForm--'+product_id+' #AddToCartText');

  if (variant) {
    if (variant.featured_image) {
      var newImg = variant.featured_image,
          el = $productImage[0],
          variant_id = variant.id;
      var variant_img = $('#productSelect--'+product_id).find('option[value="'+variant_id+'"]').data('image');
      $("#bx-pager-"+product_id).find('img[data-ver="'+variant_img+'"]').parent("a").trigger('click');
      
      setTimeout(function(){
        var li = $("#bx-pager-"+product_id).find('img[data-ver="'+variant_img+'"]').parent("a").parent('li');
        var clickindex = $("#bx-pager-"+product_id+" li").index(li);
        if($("#bx-pager-"+product_id).find('img[data-ver="'+variant_img+'"]').parent("a").hasClass('active') && !$(li).parent('ul').parent('div').parent('div').children('.bx-controls').find('a[data-slide-index="'+clickindex+'"]').hasClass('active')){
          if($(li).is(':last-child') && !$(li).parent('ul').parent('div').parent('div').children('.bx-controls').find('a[data-slide-index="'+clickindex+'"]').hasClass('active')){
            $(li).parent('ul').parent('div').parent('div').children('.bx-controls').children('.bx-pager').children().last().children('a').trigger('click');
          } else {
          	$(li).parent('ul').parent('div').parent('div').children('.bx-controls').find('a[data-slide-index="'+clickindex+'"]').trigger('click');
          }
        }
      }, 100);
    }
    
    $productPrice.html("<span class='money'>" + Shopify.formatMoney(variant.price, moneyFormat) + "</span>");
    if (variant.available) {
      $addToCart.removeClass('disabled').prop('disabled', false);
      {% if settings.add_to_cart_button_text != "" %}
        $addToCartText.html('{{ settings.add_to_cart_button_text }}');
      {% else %}
      	$addToCartText.html({{ 'products.product.add_to_cart' | t | json }});
      {% endif %}
      {% if settings.enable_quick_buy_cart_skip %}
      	{% if settings.add_to_cart_button_text != "" %}
          $addToCartTextPopup.html('{{ settings.add_to_cart_button_text }}');
        {% else %}
          $addToCartTextPopup.html('{{ 'products.product.add_to_cart' | t }}');
        {% endif %}
      {% endif %}
      {% if settings.enable_product_cart_skip %}
        {% if settings.add_to_cart_button_text != "" %}
          $addToCartTextPopup.html('{{ settings.add_to_cart_button_text }}');
        {% else %}
          $addToCartTextPopup.html('{{ 'products.product.add_to_cart' | t }}');
        {% endif %}
      {% endif %}
      
      if (variant.compare_at_price > variant.price) {
        $comparePrice.html("<span class='money'>" + Shopify.formatMoney(variant.compare_at_price, moneyFormat) + "</span>").show();
        $comparePriceClass.show();
        {% if settings.show_saved_amount %}
          var per = ((variant.compare_at_price - variant.price) * 100) / variant.compare_at_price;
          $youSave.html('{{ 'products.general.you_save' | t }} <b id="save_value-'+product_id+'"><span class="money">'+Shopify.formatMoney((variant.compare_at_price - variant.price), moneyFormat)+'</span> ('+ per.toFixed(0) +'%)</b>').show();
        {% endif %}
      } else {
        $comparePrice.hide();
        $comparePriceClass.hide();
        {% if settings.show_saved_amount %}
          $youSave.hide();
        {% endif %}
      }
    } else {
      $addToCart.addClass('disabled').prop('disabled', true);
      $addToCartText.html({{ 'products.product.unavailable' | t | json }});
      $productPrice.html({{ 'products.product.unavailable' | t | json }});
      $comparePrice.hide();
      $comparePriceClass.hide();
      {% if settings.show_saved_amount %}
        $youSave.hide();
      {% endif %}
    }
  } else {
    $comparePrice.hide();
    $comparePriceClass.hide();
    {% if settings.show_saved_amount %}
      $youSave.hide();
    {% endif %}
    $addToCart.addClass('disabled').prop('disabled', true);
    $addToCartText.html({{ 'products.product.unavailable' | t | json }});
    $productPrice.html({{ 'products.product.unavailable' | t | json }});
  }
  {% if settings.show_multiple_currencies %}
    jQuery('#quick-view span.money').each(function() {
      jQuery(this).attr('data-currency-'+window.money_default, jQuery(this).html());
    });
    var cookieCurrency = Currency.cookie.read();
    if (cookieCurrency == null) {
      Currency.currentCurrency = window.money_default;
    } else {
      Currency.currentCurrency = cookieCurrency;
    }
    if (window.money_default !== cookieCurrency && cookieCurrency != "" && cookieCurrency != null) {
      Currency.convertAll(window.money_default, cookieCurrency);
    }
  {% endif %}
};

timber.productImageSwitch = function () {
  if (timber.cache.$thumbImages.length) {
    timber.cache.$thumbImages.on('click', function(evt) {
      evt.preventDefault();
      var newImage = $(this).attr('href');
      timber.switchImage(newImage, null, timber.cache.$productImage);
    });
  }
};

timber.switchImage = function (src, imgObject, el) {
  // Make sure element is a jquery object
  var $el = $(el);
  $el.attr('src', src);
};

timber.responsiveVideos = function () {
  var $iframeVideo = $('iframe[src*="youtube.com/embed"], iframe[src*="player.vimeo"]');
  var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');

  $iframeVideo.each(function () {
    // Add wrapper to make video responsive
    $(this).wrap('<div class="video-wrapper"></div>');
  });

  $iframeReset.each(function () {
    // Re-set the src attribute on each iframe after page load
    // for Chrome's "incorrect iFrame content on 'back'" bug.
    // https://code.google.com/p/chromium/issues/detail?id=395791
    // Need to specifically target video and admin bar
    this.src = this.src;
  });
};

timber.collectionViews = function () {
  if (timber.cache.$changeView.length) {
    timber.cache.$changeView.on('click', function() {
      var view = $(this).data('view'),
          url = document.URL,
          hasParams = url.indexOf('?') > -1;

      if (hasParams) {
        window.location = replaceUrlParam(url, 'view', view);
      } else {
        window.location = url + '?view=' + view;
      }
    });
  }
};

timber.loginForms = function() {
  function showRecoverPasswordForm() {
    timber.cache.$recoverPasswordForm.show();
    timber.cache.$customerLoginForm.hide();
  }

  function hideRecoverPasswordForm() {
    timber.cache.$recoverPasswordForm.hide();
    timber.cache.$customerLoginForm.show();
  }

  timber.cache.$recoverPasswordLink.on('click', function(evt) {
    evt.preventDefault();
    showRecoverPasswordForm();
  });

  timber.cache.$hideRecoverPasswordLink.on('click', function(evt) {
    evt.preventDefault();
    hideRecoverPasswordForm();
  });

  // Allow deep linking to recover password form
  if (timber.getHash() == '#recover') {
    showRecoverPasswordForm();
  }
};

timber.resetPasswordSuccess = function() {
  timber.cache.$passwordResetSuccess.show();
};

/*============================================================================
  Drawer modules
  - Docs http://shopify.github.io/Timber/#drawers
==============================================================================*/
timber.Drawers = (function () {
  var Drawer = function (id, position, options) {
    var defaults = {
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + position,
      openClass: 'js-drawer-open',
      dirOpenClass: 'js-drawer-open-' + position
    };

    this.$nodes = {
      parent: $('body, html'),
      page: $('#PageContainer'),
      moved: $('.is-moved-by-drawer')
    };

    this.config = $.extend(defaults, options);
    this.position = position;

    this.$drawer = $('#' + id);

    if (!this.$drawer.length) {
      return false;
    }

    this.drawerIsOpen = false;
    this.init();
  };

  Drawer.prototype.init = function () {
    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$drawer.find(this.config.close).on('click', $.proxy(this.close, this));
  };

  Drawer.prototype.open = function (evt) {
    // Keep track if drawer was opened from a click, or called by another function
    var externalCall = false;

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the drawer opens, the click event bubbles up to $nodes.page
    // which closes the drawer.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.drawerIsOpen && !externalCall) {
      return this.close();
    }

    // Notify the drawer is going to open
    timber.cache.$body.trigger('beforeDrawerOpen.timber', this);

    // Add is-transitioning class to moved elements on open so drawer can have
    // transition for close animation
    this.$nodes.moved.addClass('is-transitioning');
    this.$drawer.prepareTransition();

    this.$nodes.parent.addClass(this.config.openClass + ' ' + this.config.dirOpenClass);
    this.drawerIsOpen = true;

    // Set focus on drawer
    this.trapFocus(this.$drawer, 'drawer_focus');

    // Run function when draw opens if set
    if (this.config.onDrawerOpen && typeof(this.config.onDrawerOpen) == 'function') {
      if (!externalCall) {
        this.config.onDrawerOpen();
      }
    }

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    // Lock scrolling on mobile
    this.$nodes.page.on('touchmove.drawer', function () {
      return false;
    });

    this.$nodes.page.on('click.drawer', $.proxy(function () {
      this.close();
      return false;
    }, this));

    // Notify the drawer has opened
    timber.cache.$body.trigger('afterDrawerOpen.timber', this);
  };

  Drawer.prototype.close = function () {
    if (!this.drawerIsOpen) { // don't close a closed drawer
      return;
    }

    // Notify the drawer is going to close
    timber.cache.$body.trigger('beforeDrawerClose.timber', this);

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    // Ensure closing transition is applied to moved elements, like the nav
    this.$nodes.moved.prepareTransition({ disableExisting: true });
    this.$drawer.prepareTransition({ disableExisting: true });

    this.$nodes.parent.removeClass(this.config.dirOpenClass + ' ' + this.config.openClass);

    this.drawerIsOpen = false;

    // Remove focus on drawer
    this.removeTrapFocus(this.$drawer, 'drawer_focus');

    this.$nodes.page.off('.drawer');

    // Notify the drawer is closed now
    timber.cache.$body.trigger('afterDrawerClose.timber', this);
  };

  Drawer.prototype.trapFocus = function ($container, eventNamespace) {
    var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

    $container.attr('tabindex', '-1');

    $container.focus();

    $(document).on(eventName, function (evt) {
      if ($container[0] !== evt.target && !$container.has(evt.target).length) {
        $container.focus();
      }
    });
  };

  Drawer.prototype.removeTrapFocus = function ($container, eventNamespace) {
    var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

    $container.removeAttr('tabindex');
    $(document).off(eventName);
  };

  return Drawer;
})();

function addEvent(obj, evt, fn) {
  if (obj.addEventListener) {
    obj.addEventListener(evt, fn, false);
  } else if (obj.attachEvent) {
    obj.attachEvent("on" + evt, fn);
  }
}

Date.prototype.addHours= function(h){
  this.setHours(this.getHours()+h);
  return this;
}

function timezone() {
  var offset = new Date().getTimezoneOffset();
  var minutes = Math.abs(offset);
  var hours = Math.floor(minutes / 60);
  var prefix = offset < 0 ? "" : "-";
  return prefix+hours;
}

$('#goToReview').click(function(e){
  e.preventDefault();
  if($(window).width() > 767){
    $('a[href="#tabs-6"]').trigger('click');
    var topScroll = $("#tabs-6").offset().top - 300;
    $('html, body').animate({
      scrollTop: (topScroll)
    }, 1500);
  } else {
    if(!$('a[href="#collapse6"]').hasClass('panelactive')){
      $('a[href="#collapse6"]').trigger('click'); 
    }
    var topScroll = $("#collapse6").offset().top - 200;
    $('html, body').animate({
      scrollTop: (topScroll)
    }, 1500);
  }
});

$('.mobile-nav__toggle-open-slide').click(function(e){
  e.preventDefault();
  var id = $(this).data('id');
  $(id).css('display', 'block');
  $(this).parent('div').parent('div').parent('li').parent('ul').css('left', '-100%').css('display', 'none');
  $(id).animate({
    left: "0"
  }, 4, function() {
    $(id).css('position', 'relative').css('display', 'block');
  });
});

$('.mobile-nav__toggle-open-slide_a').click(function(e){
  e.preventDefault();
  var id = $(this).data('id');
  $(id).css('display', 'block');
  $(this).parent('div').parent('li').parent('ul').css('left', '-100%').css('display', 'none');
  $(id).animate({
    left: "0"
  }, 4, function() {
    $(id).css('position', 'relative').css('display', 'block');
  });
});

$('.mobile-nav__toggle-slide.open-parent, .mobile-nav__link.open-parent').click(function(e){
  e.preventDefault();
  var id = $(this).parent('div').find('.mobile-nav__toggle-open-parent').data('id');
  $(id).css('display', 'block');
  $(this).parent('div').parent('li').parent('ul').css('left', '100%').css('display', 'none');
  $(id).animate({
    left: "0"
  }, 4, function() {
    $(id).css('position', 'relative').css('display', 'block');
  });
});
                   
timber.bxSliderApply = function (options) {
  $(".product--images").css('visibility', 'visible');
  $(".product-single").css('visibility', 'visible');
  if(options.total_images > 1) {
    $('#bxslider-id-'+options.product_id).bxSlider({
      pagerCustom: '#bx-pager-'+options.product_id,
      infiniteLoop: false,
      touchEnabled: false,
      adaptiveHeight: true
    });
    if(options.total_images > options.offset) {
      {% if settings.thumb_as_slider %}
        $('#bx-pager-'+options.product_id).bxSlider({
          infiniteLoop: false,
          slideWidth: 80,
          slideMargin: 10,
          minSlides: 2,
          maxSlides: 4,
          moveSlides: 1
        });
      	$('#bx-pager-'+options.product_id).parent('div').parent('div').find('.bx-controls-direction .bx-prev').on('click', function(e){
          e.preventDefault();
          var currentLi = $(this).parent('div').parent('div').parent('div').children('.bx-viewport').find('a.active').parent('li');
          if($(currentLi).prev("li").length > 0) {
            $(currentLi).prev("li").children('a').children('img').trigger('click');
          }
          return false;
        });
      	$('#bx-pager-'+options.product_id).parent('div').parent('div').find('.bx-controls-direction .bx-next').on('click', function(e){
          e.preventDefault();
          var currentLi = $(this).parent('div').parent('div').parent('div').children('.bx-viewport').find('a.active').parent('li');
          if($(currentLi).next("li").length > 0) {
            $(currentLi).next("li").children('a').children('img').trigger('click');
          }
          return false;
        });
      {% endif %}
    }
  }
};
var slider, slider1;
timber.bxSliderApplyQuickView = function (options) {
  $(".product--images").css('visibility', 'visible');
  $(".product-single").css('visibility', 'visible');
  if(options.total_images > 1) {
    slider = $('#bxslider-id-'+options.product_id).bxSlider({
      pagerCustom: '#bx-pager-'+options.product_id,
      infiniteLoop: false,
      touchEnabled: false,
      adaptiveHeight: true
    });
    if(options.total_images > options.offset) {
      {% if settings.thumb_as_slider %}
        slider1 = $('#bx-pager-'+options.product_id).bxSlider({
          infiniteLoop: false,
          slideWidth: 80,
          slideMargin: 10,
          minSlides: 2,
          maxSlides: 2,
          moveSlides: 1
        });
      	$('#bx-pager-'+options.product_id).parent('div').parent('div').find('.bx-controls-direction .bx-prev').on('click', function(e){
          e.preventDefault();
          var currentLi = $(this).parent('div').parent('div').parent('div').children('.bx-viewport').find('a.active').parent('li');
          if($(currentLi).prev("li").length > 0) {
            $(currentLi).prev("li").children('a').children('img').trigger('click');
          }
          return false;
        });
      	$('#bx-pager-'+options.product_id).parent('div').parent('div').find('.bx-controls-direction .bx-next').on('click', function(e){
          e.preventDefault();
          var currentLi = $(this).parent('div').parent('div').parent('div').children('.bx-viewport').find('a.active').parent('li');
          if($(currentLi).next("li").length > 0) {
            $(currentLi).next("li").children('a').children('img').trigger('click');
          }
          return false;
        });
      {% endif %}
    }
  }
};
   
timber.sliderClickCallback = function () {
  $('.product-single__thumbnail img').click(function(e){
    e.preventDefault();
    var variant_img = $(this).data('ver');
    var product_id = $(this).parent('a').parent('li').parent('ul').data('product');
    if($("#productSelect--"+product_id+" option[data-image='"+variant_img+"']").val() !== undefined && $("#productSelect--"+product_id+" option[data-image='"+variant_img+"']").attr("disabled") === undefined){
      var option1 = $("#productSelect--"+product_id+" option[data-image='"+variant_img+"']").data('option1');
      var option2 = $("#productSelect--"+product_id+" option[data-image='"+variant_img+"']").data('option2');
      var option3 = $("#productSelect--"+product_id+" option[data-image='"+variant_img+"']").data('option3');
      {% if settings.variant_swatch %}
        setTimeout(function(){
          var op1 = op2 = op3 = false;
          if(option1 !== ""){
            if(!$("#AddToCartForm--"+product_id).find("input[value='"+option1+"']").is(':checked')){
              op1 = true;
              $("#AddToCartForm--"+product_id).find("input[value='"+option1+"']").attr("checked", "true");
            }
          }
          if(option2 !== ""){
            if(!$("#AddToCartForm--"+product_id).find("input[value='"+option2+"']").is(':checked')){
              op2 = true;
              $("#AddToCartForm--"+product_id).find("input[value='"+option2+"']").attr("checked", "true");
            }
          }
          if(option3 !== ""){
            if(!$("#AddToCartForm--"+product_id).find("input[value='"+option3+"']").is(':checked')){
              op3 = true;
              $("#AddToCartForm--"+product_id).find("input[value='"+option3+"']").attr("checked", "true");
            }
          }
          if(op3) {
            $("#AddToCartForm--"+product_id).find("input[value='"+option3+"']").change();
          } else if(op2) {
            $("#AddToCartForm--"+product_id).find("input[value='"+option2+"']").change();
          } else if(op1) {
            $("#AddToCartForm--"+product_id).find("input[value='"+option1+"']").change();
          }
        }, 200);
      {% else %}
      	setTimeout(function(){
          var op1 = op2 = op3 = false;
          if(option1 !== ""){
            var currentValue = $("#AddToCartForm--"+product_id).find("select[data-option='option1']").val();
            if(currentValue !== option1){
              op1 = true;
              $("#AddToCartForm--"+product_id).find("select[data-option='option1']").val(option1);
            }
          }
          if(option2 !== ""){
            var currentValue = $("#AddToCartForm--"+product_id).find("select[data-option='option2']").val();
            if(currentValue !== option2){
              op2 = true;
              $("#AddToCartForm--"+product_id).find("select[data-option='option2']").val(option2);
            }
          }
          if(option3 !== ""){
            var currentValue = $("#AddToCartForm--"+product_id).find("select[data-option='option3']").val();
            if(currentValue !== option3){
              op3 = true;
              $("#AddToCartForm--"+product_id).find("select[data-option='option3']").val(option3);
            }
          }
          if(op3) {
            $("#AddToCartForm--"+product_id).find("select[data-option='option3']").change();
          } else if(op2) {
            $("#AddToCartForm--"+product_id).find("select[data-option='option2']").change();
          } else if(op1) {
            $("#AddToCartForm--"+product_id).find("select[data-option='option1']").change();
          }
        }, 200);
      {% endif %}
    }
  });
};

timber.qtySelectors = function() {
  var numInputs = $('input[type="number"]');

  if (numInputs.length) {
    numInputs.each(function() {
      var $el = $(this),
          currentQty = $el.val(),
          inputName = $el.attr('name'),
          inputId = $el.attr('id');

      var itemAdd = currentQty + 1,
          itemMinus = currentQty - 1,
          itemQty = currentQty;

      var source   = $("#JsQty").html(),
          template = Handlebars.compile(source),
          data = {
            key: $el.data('id'),
            itemQty: itemQty,
            itemAdd: itemAdd,
            itemMinus: itemMinus,
            inputName: inputName,
            inputId: inputId
          };
      $el.after(template(data)).remove();
    });

    $('.js-qty__adjust').on('click', function() {
      var $el = $(this),
          id = $el.data('id'),
          $qtySelector = $el.siblings('.js-qty__num'),
          qty = parseInt($qtySelector.val().replace(/\D/g, ''));

      if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {
        
      } else {
        qty = 1;
      }

      if ($el.hasClass('js-qty__adjust--plus')) {
        qty += 1;
      } else {
        qty -= 1;
        if (qty <= 1) qty = 1;
      }

      $qtySelector.val(qty);
    });
  }
};

timber.swatchChange = function () {
  $('.swatch :radio').change(function() {
    var optionIndex = $(this).closest('.swatch').attr('data-option-index');
    var optionValue = $(this).val();
    $(this).closest('form').find('.single-option-selector').eq(optionIndex).val(optionValue).trigger('change');
  });
};

{% if settings.enable_image_zoom %}
  timber.magniflierImageZoom = function () {
    if ($('.magniflier').length) {
      if($(window).width() > 991){
        $(function() {
          var native_width = 0;
          var native_height = 0;
          var mouse = {x: 0, y: 0};
          var magnify;
          var cur_img;

          var ui = {
            magniflier: $('.magniflier')
          };

          if (ui.magniflier.length) {
            var div = document.createElement('div');
            div.setAttribute('class', 'glass');
            ui.glass = $(div);
            $('body').append(div);
          }

          var mouseMove = function(e) {
            var $el = $(this);
            var magnify_offset = cur_img.offset();
            mouse.x = e.pageX - magnify_offset.left;
            mouse.y = e.pageY - magnify_offset.top;
            if ( mouse.x < cur_img.width() && mouse.y < cur_img.height() && mouse.x > 0 && mouse.y > 0 ) {
              magnify(e);
            } else {
              ui.glass.fadeOut(100);
            }
            return;
          };

          var magnify = function(e) {
            var rx = Math.round(mouse.x/cur_img.width()*native_width - ui.glass.width()/2)*-1;
            var ry = Math.round(mouse.y/cur_img.height()*native_height - ui.glass.height()/2)*-1;
            var bg_pos = rx + "px " + ry + "px";
            // var glass_left = mouse.x - ui.glass.width() / 2;
            // var glass_top  = mouse.y - ui.glass.height() / 2;
            var glass_left = e.pageX - ui.glass.width() / 2;
            var glass_top  = e.pageY - ui.glass.height() / 2;
            ui.glass.css({
              left: glass_left,
              top: glass_top,
              backgroundPosition: bg_pos
            });
            return;
          };

          $('.magniflier').on('mousemove', function() {
            ui.glass.fadeIn(100);
            cur_img = $(this);
            var large_img_loaded = cur_img.data('large-img-loaded');
            var src = cur_img.data('large') || cur_img.attr('src');
            if (src) {
              ui.glass.css({
                'background-image': 'url(' + src + ')',
                'background-repeat': 'no-repeat'
              });
            }
            if (!cur_img.data('native_width')) {
              var image_object = new Image();
              image_object.onload = function() {
                native_width = image_object.width;
                native_height = image_object.height;
                cur_img.data('native_width', native_width);
                cur_img.data('native_height', native_height);
                mouseMove.apply(this, arguments);
                ui.glass.on('mousemove', mouseMove);
              };
              image_object.src = src;
              return;
            } else {
              native_width = cur_img.data('native_width');
              native_height = cur_img.data('native_height');
            }
            mouseMove.apply(this, arguments);
            ui.glass.on('mousemove', mouseMove);
          });

          addEvent(window,"load",function(e) {
            addEvent(document, "mouseout", function(e) {
              e = e ? e : window.event;
              var from = e.relatedTarget || e.toElement;
              if (!from || from.nodeName == "HTML") {
                ui.glass.fadeOut(100);
              }
            });
          });

          $('.site-header').hover(function(){
            ui.glass.fadeOut(100);
          });

          $('.glass').click(function(){
            ui.glass.fadeOut(100);
          });

          ui.glass.on('mouseout', function() {
            ui.glass.off('mousemove', mouseMove);
          });

        });
      }
    }
  };
{% endif %}

timber.progressStriped = function () {
  if ($('.progress.progress-striped').length) {
    {% if settings.product_progressbar_style == '1' %}
      $('.progress.progress-striped').each(function() {
        var qty = $(this).data('qty');
        var cnt = $(this).data('total');
        var pct = Math.ceil(100 * (cnt / qty));
        if (pct >= 100) {
          pct = 100;
        }
        if (pct >= 75) {
          $(this).find('.progress-bar').addClass('progress-bar-danger');
        }
        $(this).find('.progress-bar').css('width',pct + '%');
      });
    {% else %}
      $('.progress.progress-striped').each(function() {
        var qty = $(this).data('qty');
        var cnt = $(this).data('total');
        var pct = Math.ceil(100 * (cnt / qty));
        pct = 100 - pct;
        if (pct >= 100) {
          pct = 100;
        }
        if (pct < 0) {
          pct = 0;
        }
        if (pct <= 25) {
          $(this).find('.progress-bar').addClass('progress-bar-danger');
        }
        $(this).find('.progress-bar').css('width',pct + '%');
      });
    {% endif %}
  }
};

timber.fancybox = function () {
  if ($('.fancybox').length) {
    if($(window).width() > 767) {
      $('.fancybox').fancybox();
      $('body').on('click', '.glass', function(){
        var data_index = $('.product-single__thumbnails').find('.active').data('slide-index');
        $(".product-single__photos a[data-index-slide='" + data_index + "']").trigger('click');
      });
    } else {
      $('.fancybox').click(function(e) {
        e.preventDefault();
      });
      $(document).ready(function(){
        $('.fancyboxmobile').fancybox();      
      });
    }
  }
};

timber.stopSelling = function (options) {
  if (options.action == "text") {
    $('#countdown-timer-'+options.product_id+' .header').html("{{ settings.no_more_action_text }}");
    $('#countdown-timer-'+options.product_id+' .countdown').remove();
  }
};

timber.countDownTimerExtend = function (options) {
  if (options.pub - options.now > 0) {
    $('#countdown-timer-'+options.product_id+' .countdown').downCount({
      date: options.pub,
      offset: timezone()
    }, function () {
      timber.stopSelling({
        action: 'text',
        product_id: options.product_id
      });
    });
  } else {
    options.pub.addHours(options.exp);
    timber.countDownTimerExtend({
      now: options.now,
      exp: options.exp,
      pub: options.pub,
      product_id: options.product_id
    });
  }
};

timber.countDownTimer = function (options) {
  if ($('#countdown-timer-'+options.product_id).length) {
    var now = new Date();
    var exp = $('#countdown-timer-'+options.product_id).data('expire');
    var pub = new Date($('#countdown-timer-'+options.product_id).data('published'));
    if (pub - now > 0) {
      $('#countdown-timer-'+options.product_id+' .countdown').downCount({
        date: pub,
        offset: timezone()
      }, function () {
        timber.stopSelling({
          action: 'text',
          product_id: options.product_id
        });
      });
    } else {
      pub.addHours(exp);
      timber.countDownTimerExtend({
        now: now,
        exp: exp,
        pub: pub,
        product_id: options.product_id
      });
    }
  }
};

timber.countDownFlipTimer = function (options) {
  if ($('#countdown-timer-'+options.product_id).length) {
    var now = new Date();
    var exp = $('#countdown-timer-'+options.product_id).data('expire');
    var pub = new Date($('#countdown-timer-'+options.product_id).data('published'));
    if (pub - now > 0) {
      var clock = $('#countdown-timer-'+options.product_id).FlipClock(((pub - now) / 1000), {
        countdown: true
      });
    } else {
      pub.addHours(exp);
      timber.countDownFlipTimerExtend({
        now: now,
        exp: exp,
        pub: pub,
        product_id: options.product_id
      });
    }
  }
};

timber.countDownFlipTimerExtend = function (options) {
  if (options.pub - options.now > 0) {
    var clock = $('#countdown-timer-'+options.product_id).FlipClock(((options.pub - options.now) / 1000), {
      countdown: true,
      clockFace: 'DailyCounter'
    });
  } else {
    options.pub.addHours(options.exp);
    timber.countDownFlipTimerExtend({
      now: options.now,
      exp: options.exp,
      pub: options.pub,
      product_id: options.product_id
    });
  }
};

timber.visitorCounter = function () {
  if ($('#visitor_counter_visitors').length) {
    var min = {{ settings.visitor_counter_min }};
    var max = {{ settings.visitor_counter_max }};
    min = Math.ceil(min);
    max = Math.floor(max);
    var r = Math.floor(Math.random() * (max - min + 1)) + min;
    var inc = '1';
    var myRandom = ['1', '2', '3', '4', '5','10', '-1', '-2', '-3', '-4', '-5'];
    var randomlyValue='';
    var currentmyRandom='';
    var plus = ['10', '20', '15'];
    var range='';
    
    setInterval(function(){
      randomlyValue =  Math.floor(Math.random() * myRandom.length);
      currentmyRandom = myRandom[randomlyValue];
      r = parseInt(r) + parseInt(currentmyRandom);
      if(r <= min){
        r = min;
      }
      if(r > max){
        r = max;
      }
      jQuery("#visitor_counter_visitors").html(r);
    }, 2000);
  }
};
{% if settings.product_flash_sold_enable %}
  timber.flashSoldBar = function () {
    if ($('#TotalSold').length) {
      var minQty = {{ settings.flash_sold_min_qty }};
      var maxQty = {{ settings.flash_sold_max_qty }};
      var minTime = {{ settings.flash_sold_min_time }};
      var maxTime = {{ settings.flash_sold_max_time }};
      minQty = Math.ceil(minQty);
      maxQty = Math.floor(maxQty);
      minTime = Math.ceil(minTime);
      maxTime = Math.floor(maxTime);

      var qty = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
      qty = parseInt(qty);
      if(qty <= minQty){
        qty = minQty;
      }
      if(qty > maxQty){
        qty = maxQty;
      }
      jQuery("#TotalSold").html(qty);

      var time = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
      time = parseInt(time);
      if(time <= minTime){
        time = minTime;
      }
      if(time > maxTime){
        time = maxTime;
      }
      jQuery("#InHours").html(time);
      setInterval(function(){
		$('.flash-fire').fadeIn(function() {
          $(this).css("visibility", "visible");
        }).delay(400).fadeIn(function() {
          $(this).css("visibility", "hidden");
        }).delay(600);
      }, 1000);
    }
  };
{% endif %}
timber.buildTabs = function (options) {
  $(".tabs").tabs({ active: options.default });
  var ariacontrols = $('.ui-state-active').attr('aria-controls');
  $('#onChangeTrigger').val('#'+ariacontrols);
  
  $('.ui-tabs-anchor').on('click', function() {
   	var ariacontrols = $(this).attr('href');
    var ariacontrolsdrop = $('#onChangeTrigger').val();
    if(ariacontrols !== '#'+ariacontrolsdrop){
      $('#onChangeTrigger').val(ariacontrols);
    }
  });
  
  $('#onChangeTrigger').on('change', function() {
    var ariacontrols = $(this).val();
    $('a[href="'+ariacontrols+'"]').trigger('click');
  });
};

$(document).ready(function() {
  var slider, canSlide = true;
  slider = $('#homepage_slider').flexslider({
    touch: true, 
    smoothHeight: true,
    {% if settings.video_slide_embed_code != blank %}
      pauseOnHover: true,
      video: true,
      slideshow: true,
      pauseOnAction: true,
    {% endif %}
    controlNav: false,
    {% if settings.slideshow_arrows %} 
      directionNav: true, 
    {% else %} 
      directionNav: false, 
    {% endif %}
    animation: "{{ settings.slideshow_animation }}", 
    {% if settings.slideshow_animation == 'slide' %}
      useCSS: false,
    {% endif %}
    slideshowSpeed: {% if settings.slideshow_speed != blank %}{{ settings.slideshow_speed }}{% else %}10{% endif %}*1000,
    before: function(){
      if(!canSlide) {
        slider.flexslider("stop");
      }
    }
  });
  
  {% if settings.video_slide_embed_code != blank %}
    var tag = document.createElement('script');
    tag.src = "//www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  
    window.onYouTubeIframeAPIReady = function(){
      $('.flexslider iframe').each(function(){
        var player = new YT.Player(this, {
          playerVars: {
            autoplay: 0
          }
        });

        player.addEventListener("onStateChange", function(state){
          switch(state.data) {
            case YT.PlayerState.PLAYING:
              slider.flexslider("stop");
              canSlide = false;
              break;
            case YT.PlayerState.ENDED:
            case YT.PlayerState.PAUSED:
              slider.flexslider("play");
              canSlide = true;
              break;
          }
        });
        $(this).data('player', player);
      });
    }
    
    slider.on("click", ".flex-prev, .flex-next", function(){
      canSlide = true;
      $('.flexslider iframe').each(function(){
        if (typeof $(this).data('player').pauseVideo !== "undefined") {
          $(this).data('player').pauseVideo();
        }
      });
    });
  {% endif %}

  if ($('.promotion-slider').length) {
    $(".promotion-slider").owlCarousel({
      items: 1,
      autoplay: true,
      autoPlaySpeed: 5000,
      autoPlayTimeout: 5000,
      autoplayHoverPause: true,
      nav:true,
      responsive: {
        0: {
          items: 1
        },
        480: {
          items: 2
        },
        768: {
          items: 3
        }
      }
    });
  }
  
  if ($('.carousel-product').length) {
    $(".carousel-product").owlCarousel({
      items: 1,
      autoplay: true,
       loop: true,
      autoPlaySpeed: 5000,
      autoPlayTimeout: 5000,
      autoplayHoverPause: true,
      nav:true,
      responsive: {
        0: {
          items: 1
        },
        650: {
          items: 2
        },
        980: {
          items: 3
        },
        1220: {
          items: 4
        }
      }
    });
  }
  
  $('#cartAddPopup').click(function(e){
    e.preventDefault();
    window.location.href = "/cart";  
  });
  
  $('.cart__hover').on('mouseenter', function(e) {
    //alert('sd');
    if ($(window).width() > 767) {
      timber.addtocartPopupClose();
    }
  });
  
  $('.addCart-popup-close').on('click', function(e) {
    timber.addtocartPopupClose();
  });
});

timber.addtocartPopupClose = function () {
  $("#cartAddPopup").animate({
    top: "-200px"
  }, 500, function() {
    $("#cartAddPopup").css('visibility', 'hidden');
  });
};

timber.modalBox = function () {
	var modal;
    var modalHTML;
	var btn = $("[data-toggle='modal']");
	var close = $("[data-toggle='close-modal']");

    $(btn).click(function(e){
      e.preventDefault();
      modal = $($(this).data('target'));
      if($(window).width() > 767){
        var width = "600px";
      } else {
      	var width = "90%";  
      }
      $(modal).find('.modal-content').css('width', width);
      $(modal).addClass("in");
      modalHTML = $(this).data('target').replace("#", "");
    });
                   
    $(close).click(function(e){
      e.preventDefault();
      $(modal).removeClass("in");
    });

    window.onclick = function(event) {
      if (event.target.id == modalHTML) {
        $(modal).removeClass("in");
      }
    }
};

{% if settings.cart_timer_enable %}
  timber.cartTimer = function () {
    if ($('#cartTimer').length) {
      var completetime = {{ settings.cart_timer_minute }} - 60;
      var timer_time = completetime / 60;
       var hours = Math.floor(timer_time / 60);          
      var minutes = Math.floor(timer_time % 60);
      var seconds = 60;   
      //alert(timer_time+"->"+hours+" -> "+ minutes +"->"+ seconds);
      $('#cartTimer').countdowntimer({
        minutes : minutes,
        seconds : seconds,
      });
    }
  };
{% endif %}
timber.estimateTimer = function () {
  if ($('#estimateTimer').length) {
    var startTime = new Date();
    var endTime = new Date(startTime.getFullYear()+"/"+(startTime.getMonth()+1)+"/"+startTime.getDate()+' {{ settings.delivery_cutoff }}');
    var timer_time = Math.round((endTime - startTime) / 60000);
    
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + $('#estimateTimer').parent("b").find(".dateEstimate").data("date"));
    
    if(timer_time <= 0){
      endTime.setDate(endTime.getDate() + 1);
      timer_time = Math.round((endTime - startTime) / 60000);
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    
    var excludeDays = "{{ settings.delivery_off_days }}";
    excludeDays = excludeDays.split(" ");
    $.each(excludeDays, function(key, daySingle){
      if(daySingle === "SUN"){
        excludeDays[key] = 0;
      }
      if(daySingle === "MON"){
        excludeDays[key] = 1;
      }
      if(daySingle === "TUE"){
        excludeDays[key] = 2;
      }
      if(daySingle === "WED"){
        excludeDays[key] = 3;
      }
      if(daySingle === "THU"){
        excludeDays[key] = 4;
      }
      if(daySingle === "FRI"){
        excludeDays[key] = 5;
      }
      if(daySingle === "SAT"){
        excludeDays[key] = 6;
      }
    });
    if(excludeDays.length >= 7){
      excludeDays = [];
    }
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + $('#estimateTimer').parent("b").find(".dateEstimate").data("date"));
    do {
      tomorrow.setDate(tomorrow.getDate() + 1);
    } while($.inArray(tomorrow.getDay(), excludeDays) > -1);
    var fmt = new DateFmt();
    $(".dateEstimate").html(fmt.format(tomorrow,"%w %n %d"));
    
    var hours = Math.floor(timer_time / 60);          
    var minutes = Math.floor(timer_time % 60);

//     $('#estimateTimer').countdowntimer({
//       hours : hours,
//       minutes : minutes,
//       seconds : 00
//     });
    
    var day_wek = fmt.format(tomorrow,"%y") +' '+hours+':'+minutes;
    var countDownDate = new Date(day_wek).getTime();

    // Update the count down every 1 second
    var x = setInterval(function() {

    // Get todays date and time
    var now = new Date().getTime();
    
    // Find the distance between now an the count down date
    var distance = countDownDate - now;

    // Output the result in an element with id="demo"
    document.getElementById("estimateTimer").innerHTML =hours + " hours "
    + minutes + " minutes";
      
    
    // If the count down is over, write some text 
    if (distance < 0) {
        clearInterval(x);
    //document.getElementById("estimateTimer").innerHTML = "EXPIRED";
    }
}, 100);
    
    
  }
};
if(window.template != "cart"){
  {% if settings.enable_sticky_header or settings.enable_sticky_header_mobile %}
  var viewableOffset = $("#shopify-section-header").offset().top - $(window).scrollTop();
    $( window ).scroll(function() {
      
 // alert(viewableOffset);
      var scroll = $(window).scrollTop();
      if($(window).width() > 767){
        {% if settings.enable_sticky_header %}
        if(scroll >= viewableOffset){
          if(!$('.site-header').hasClass('sticky')){
            $('.site-header .nav-bar').removeClass('sticky');
            $('.site-header').addClass('sticky');
            $('.main-content').css('margin-top', '195px');
            $('.top--line').hide();
          }
        } else {
          $('.site-header .nav-bar').removeClass('sticky');
          $('.site-header').removeClass('sticky');
          $('.main-content').css('margin-top', '0');
          $('.top--line').show();
        }
        {% endif %}
      } else {
        {% if settings.enable_sticky_header_mobile %}
          if(scroll > 0){
            if(!$('.site-header .nav-bar').hasClass('sticky')){
              $('.site-header').removeClass('sticky');
              $('.site-header .nav-bar').addClass('sticky');
              $('.main-content').css('margin-top', '75px');
              $('.top--line').hide();
            }
          } else {
            $('.site-header').removeClass('sticky');
            $('.site-header .nav-bar').removeClass('sticky');
            $('.main-content').css('margin-top', '0');
            $('.top--line').show();
          }
        {% endif %}
      }
    });
  {% endif %}
}

$( window ).resize(function() {
  $('.site-header').removeClass('sticky');
  $('.site-header .nav-bar').removeClass('sticky');
  $('.cart__footer-icon').removeClass('in');
  $('.main-content').css('margin-top', '0');
  {% if settings.popup_disable_mobile %}
  	if($(window).width() > 767){
      $('#someone-purchased').show();
      $("#someone-purchased > div:gt(0)").hide();
    } else {
      $('#someone-purchased').hide();
    }
  {% endif %}
});
{% if settings.bottom_sticky_cart %}
  $( window ).scroll(function() {
    var scroll = $(window).scrollTop();
    if($(window).width() > 767){
      if(scroll >= 215){
        if(!$('.cart__footer-icon').hasClass('in')){
          $('.cart__footer-icon').addClass('in');
        }
      } else {
        $('.cart__footer-icon').removeClass('in');
      }
    } else {
      if(scroll >= 90){
        if(!$('.cart__footer-icon').hasClass('in')){
          $('.cart__footer-icon').addClass('in');
        }
      } else {
        $('.cart__footer-icon').removeClass('in');
      } 
    }
  });
{% endif %}
timber.collectionImageSlide = function () {
  $( ".grid__image" ).mouseenter(function() {
    if ($(window).width() > 1024) {
      {% if settings.product_transition %}
      	$(this).children('.first--image').animate({
          left: "-100%"
        }, 0, function() {});
        $(this).children('.second--image').animate({
          right: "0"
        }, 0, function() {});
      	$(this).children('.second--image').animate({
          left: "0"
        }, 0, function() {});
      {% else %}
        $(this).children('.first--image').css('opacity', '0');
        $(this).children('.second--image').css('opacity', '1');
      {% endif %}
    }
  }).mouseleave(function() {
    if ($(window).width() > 1024) {
      {% if settings.product_transition %}
        $(this).children('.first--image').animate({
          left: "0"
        }, 0, function() {});
        $(this).children('.second--image').animate({
          right: "-100%"
        }, 0, function() {});
        $(this).children('.second--image').animate({
          left: "100%"
        }, 0, function() {});
      {% else %}
        $(this).children('.first--image').css('opacity', '1');
        $(this).children('.second--image').css('opacity', '0');
      {% endif %}
    }
  });
};

{% if settings.collections_quickview %}
  if($(window).width() > 767){
    $(".quick-shop").click(function(e){
      e.preventDefault();
      if($(window).width() > 767){
        var id = $(this).data('href');
        var $prod = $(this).closest(".grid__item");
        var template = $prod.find("[id^=product-template-"+id+"]").html();
        $('#quick-view').find('.modal-body').html(template);
        timber.modalBox();
        $('#quick-view').find('.modal-content').css('width', "750px");
        $('#quick-view').addClass("in");
        var $total_images = $('#bx-pager-'+id).data('images');
        timber.bxSliderApplyQuickView({
          product_id: id,
          total_images: $total_images,
          offset: 3
        });
        $('#quick-view').find('.grid__item > .bx-wrapper').css('max-width', "170px");
        var selectCallbackQuick = function(variant, selector) {
          {% if settings.variant_swatch %}
          if (variant) {
            var form = jQuery('#' + selector.domIdPrefix).closest('form');
            for (var i=0,length=variant.options.length; i<length; i++) {
              var radioButton = form.find('.swatch[data-option-index="' + i + '"] :radio[value="' + variant.options[i] +'"]');
              if (radioButton.size()) {
                radioButton.get(0).checked = true;
              }
            }
          }
          {% endif %}
          timber.productPage({
            money_format: window.money_format,
            variant: variant,
            selector: selector,
            product_id: id
          });
        };
        var product_json = $prod.find("[id^=product-json-"+id+"]").html();
		product_json = JSON.parse(product_json);
        new Shopify.OptionSelectors('productSelect--'+id, {
          product: product_json,
          onVariantSelected: selectCallbackQuick,
          enableHistoryState: false
        });
        {% if settings.variant_swatch %}
        for(var i=0; i < product_json.options.length; i++){
          for(var j=0; j < product_json.variants.length; j++){
            var value = product_json.variants[j].options[i];
            value = value.toLowerCase().replace("'", "").replace(/[^\w\u00C0-\u024f]+/g, "-").replace(/^-+|-+$/g, "");
            if(product_json.variants[j].available){
              jQuery('.swatch[data-option-index="'+i+'"] .'+value).removeClass('soldout').addClass('available').find(':radio').removeAttr('disabled');
              jQuery('.swatch[data-option-index="'+i+'"] .'+value).find('.tooltip').remove();
            }
          }
        }
        {% endif %}
        {% if settings.show_multiple_currencies %}
          jQuery('#quick-view span.money').each(function() {
            jQuery(this).attr('data-currency-'+window.money_default, jQuery(this).html());
          });
          var cookieCurrency = Currency.cookie.read();
          if (cookieCurrency == null) {
            Currency.currentCurrency = window.money_default;
          } else {
            Currency.currentCurrency = cookieCurrency;
          }
          if (window.money_default !== cookieCurrency && cookieCurrency != "" && cookieCurrency != null) {
            Currency.convertAll(window.money_default, cookieCurrency);
          }
        {% endif %}
        $('.close-quickview').click(function(){
          if(typeof slider === 'object'){
            slider.destroySlider();
          }
          if(typeof slider1 === 'object'){
            slider1.destroySlider();
          }
          $('#quick-view').find('.modal-body').html("");
          $('#quick-view').removeClass("in");
        });
        $('#quick-view').click(function(){
          if(typeof slider === 'object'){
            slider.destroySlider();
          }
          if(typeof slider1 === 'object'){
            slider1.destroySlider();
          }
          $('#quick-view').find('.modal-body').html("");
          $('#quick-view').removeClass("in");
        });
        $('.modal-content').click(function(e){
          e.stopPropagation();
        });
        timber.sliderClickCallback();
        timber.swatchChange();
        timber.qtySelectors();
        timber.progressStriped();
        {% if settings.enable_countdown_timer %}
          {% if settings.timer_model == "timer_model_1" %}
            timber.countDownTimer({
              product_id: id
            });
          {% endif %}
          {% if settings.timer_model == "timer_model_2" %}
            timber.countDownFlipTimer({
              product_id: id
            });
          {% endif %}
        {% endif %}
        jQuery(function($) {
          ajaxCart.init({
            formSelector: 'form[action^="/cart/add"]',
            cartContainer: '#CartContainer',
            addToCartSelector: '.AddToCart',
            cartCountSelector: '.CartCount',
            cartCostSelector: '#CartCost',
            isProduct: false,
            moneyFormat: window.money_format
          });
        });
      }
    });
  }
{% endif %}

timber.cartUpdatePopup = function (cart) {
  var cart_summary = $('#cart-popup');
  $('.CartCount').html(cart.item_count);
  if (cart_summary.length) {
    cart_summary.empty();
    jQuery.each(cart, function(key, value) {
      if (key === 'items') {
        var $html = '';
        if (value.length) {
          $html += '<form action="/cart" method="post" novalidate class="cart ajaxcart">';
          $html += '<div class="container">';
          $html += '<div class="cartForm">';
          $html += '<ul class="cart-popup-ul-top">';
          $html += '<li class="total-items"><b>{{ "cart.general.total" | t }}: </b><span class="cart-current-items">'+cart.item_count+'</span> Items</li>';
          $html += '<li class="total-price"><span class="money">'+ Shopify.formatMoney(cart.total_price, window.money_format) +'</span></li>';
          $html += '</ul>';
          $html += '<ul class="cart-popup-ul-middle">';
          jQuery.each(value, function(i, item) {
            $html += '<li>';
            $html += '<a href="'+ item.url +'">';
            $html += '<div class="cart-img-div">';
            $html += '<img src="'+ Shopify.resizeImage(item.image, 'small') +'" alt="Image of '+ item.title +'" class="cart-item-image" />';
            $html += '<span class="pop-qty-crat">'+ item.quantity +'</span>';
            $html += '</div>';
            $html += '<div class="cart-item-info">';
            $html += '<span class="cart-item-title">'+ item.title +'</span>';
            $html += '<p class="cart-item-price"><span class="money">'+ Shopify.formatMoney(item.price, window.money_format) +'</span></p>';
            $html += '</div>';
            $html += '</a><a href="/cart/change?line='+(i+1)+'&quantity=0" data-line="'+(i+1)+'" data-variant="'+ item.variant_id +'" class="removeLineCartPop" rel="'+ item.variant_id +'">x</a>';
            $html += '</li>';
          });
          $html += '</ul>';

          $html += '<ul class="cart-popup-ul-bottom">';
          $html += '<li><a href="/cart" class="btn--secondary btn--full cart__cartview">{{ "cart.general.button" | t }}</a></li><li>';
          $html += '<a href="/checkout" class="btn btn--full cart__checkout Checkout">';
          $html += '<img src="{{ 'checkout-button-icon.png' | asset_url }}" alt="" class="addIcon" />';
          $html += '<span id="CheckoutText">{{ 'cart.general.checkout' | t }}</span>';
          $html += '</a>';
                   
          $html +='<li class="additional-checkout-buttons">';
          $html +='<button name="goto_pp" type="submit" id="paypal-express-button" class="additional-checkout-button additional-checkout-button--paypal-express" value="paypal_express" data-strategy="cart"><img alt="Checkout with: PayPal" src="//cdn.shopify.com/s/assets/checkout/easy-checkout-btn-paypal-9835af2c2b0e2a543b2905789a7f08b678d62de2c77c1b0d16fd7689aff463f3.png" /></button>';
          $html +=  '</li>';
                  
          {% if settings.cart_popup_text != "" %}
          $html += '<div class="cart--promo-msg">{{ settings.cart_popup_text }}{% if settings.cart_display_user_country %}&nbsp;<span class="countryName"></span>{% endif %}{% if settings.cart_display_user_country_flag %}&nbsp;<span class="flagImg f32"></span>{% endif %}</div>';
          {% endif %}
          $html += '</li></ul></div></div>';
          $html += '</form>';

          
          cart_summary.removeClass('empty-popup');
        } else {
          $html = '<div class="container"><ul class="cart-popup-ul-bottom"><li class="empty-cart-popup-msg">{{ 'cart.general.empty' | t }}</li><li><a href="/collections/all" class="btn btn-large btn-primary">Shop Now</a></li></ul></div>';
          cart_summary.addClass('empty-popup');
        }
//         if (window.Shopify && Shopify.StorefrontExpressButtons) {
//           Shopify.StorefrontExpressButtons.initialize();
//         }
        cart_summary.append($html);
        var cookieCurrency = Currency.cookie.read();
        if (window.money_default !== cookieCurrency && cookieCurrency != "" && cookieCurrency != null) {
          Currency.convertAll(window.money_default, cookieCurrency);
        }
      }
    });
  }
};
timber.geoIP = function () {
  $(function(){
    var countriesWithCurrency = {"AD": "EUR", "AE": "AED", "AF": "AFN", "AG": "XCD", "AI": "XCD", "AL": "ALL", "AM": "AMD", "AO": "AOA", "AR": "ARS", "AS": "USD", "AT": "EUR", "AU": "AUD", "AW": "AWG", "AX": "EUR", "AZ": "AZN", "BA": "BAM", "BB": "BBD", "BD": "BDT", "BE": "EUR", "BF": "XOF", "BG": "BGN", "BH": "BHD", "BI": "BIF", "BJ": "XOF", "BL": "EUR", "BM": "BMD", "BN": "BND", "BO": "BOB", "BQ": "USD", "BR": "BRL", "BS": "BSD", "BT": "INR", "BV": "NOK", "BW": "BWP", "BY": "BYR", "BZ": "BZD", "CC": "AUD", "CD": "CDF", "CF": "XAF", "CG": "XAF", "CH": "CHE", "CI": "XOF", "CK": "NZD", "CL": "CLF", "CM": "XAF", "CN": "CNY", "CO": "COP", "CR": "CRC", "CU": "CUC", "CV": "CVE", "CW": "ANG", "CX": "AUD", "CY": "EUR", "CZ": "CZK", "DE": "EUR", "DJ": "DJF", "DK": "DKK", "DM": "XCD", "DO": "DOP", "DZ": "DZD", "EC": "USD", "EE": "EUR", "EG": "EGP", "EH": "MAD", "ER": "ERN", "ES": "EUR", "ET": "ETB", "FI": "EUR", "FJ": "FJD", "FK": "FKP", "FM": "USD", "FO": "DKK", "FR": "EUR", "GA": "XAF", "GB": "GBP", "GD": "XCD", "GE": "GEL", "GF": "EUR", "GG": "GBP", "GH": "GHS", "GI": "GIP", "GL": "DKK", "GM": "GMD", "GN": "GNF", "GP": "EUR", "GQ": "XAF", "GR": "EUR", "GS": "GBP", "GT": "GTQ", "GU": "USD", "GW": "XOF", "GY": "GYD", "HK": "HKD", "HM": "AUD", "HN": "HNL", "HR": "HRK", "HT": "HTG", "HU": "HUF", "ID": "IDR", "IE": "EUR", "IL": "ILS", "IM": "GBP", "IN": "INR", "IO": "USD", "IQ": "IQD", "IR": "IRR", "IS": "ISK", "IT": "EUR", "JE": "GBP", "JM": "JMD", "JO": "JOD", "JP": "JPY", "KE": "KES", "KG": "KGS", "KH": "KHR", "KI": "AUD", "KM": "KMF", "KN": "XCD", "KP": "KPW", "KR": "KRW", "KW": "KWD", "KY": "KYD", "KZ": "KZT", "LA": "LAK", "LB": "LBP", "LC": "XCD", "LI": "CHF", "LK": "LKR", "LR": "LRD", "LS": "LSL", "LT": "LTL", "LU": "EUR", "LV": "EUR", "LY": "LYD", "MA": "MAD", "MC": "EUR", "MD": "MDL", "ME": "EUR", "MF": "EUR", "MG": "MGA", "MH": "USD", "MK": "MKD", "ML": "XOF", "MM": "MMK", "MN": "MNT", "MO": "MOP", "MP": "USD", "MQ": "EUR", "MR": "MRO", "MS": "XCD", "MT": "EUR", "MU": "MUR", "MV": "MVR", "MW": "MWK", "MX": "MXN", "MY": "MYR", "MZ": "MZN", "NA": "NAD", "NC": "XPF", "NE": "XOF", "NF": "AUD", "NG": "NGN", "NI": "NIO", "NL": "EUR", "NO": "NOK", "NP": "NPR", "NR": "AUD", "NU": "NZD", "NZ": "NZD", "OM": "OMR", "PA": "USD", "PE": "PEN", "PF": "XPF", "PG": "PGK", "PH": "PHP", "PK": "PKR", "PL": "PLN", "PM": "EUR", "PN": "NZD", "PR": "USD", "PS": "ILS", "PT": "EUR", "PW": "USD", "PY": "PYG", "QA": "QAR", "RE": "EUR", "RO": "RON", "RS": "RSD", "RU": "RUB", "RW": "RWF", "SA": "SAR", "SB": "SBD", "SC": "SCR", "SD": "SDG", "SE": "SEK", "SG": "SGD", "SH": "SHP", "SI": "EUR", "SJ": "NOK", "SK": "EUR", "SL": "SLL", "SM": "EUR", "SN": "XOF", "SO": "SOS", "SR": "SRD", "SS": "SSP", "ST": "STD", "SV": "USD", "SX": "ANG", "SY": "SYP", "SZ": "SZL", "TC": "USD", "TD": "XAF", "TF": "EUR", "TG": "XOF", "TH": "THB", "TJ": "TJS", "TK": "NZD", "TL": "USD", "TM": "TMT", "TN": "TND", "TO": "TOP", "TR": "TRY", "TT": "TTD", "TV": "AUD", "TW": "TWD", "TZ": "TZS", "UA": "UAH", "UG": "UGX", "UM": "USD", "US": "USD", "UY": "UYU", "UZ": "UZS", "VA": "EUR", "VC": "XCD", "VE": "VEF", "VG": "USD", "VI": "USD", "VN": "VND", "VU": "VUV", "WF": "XPF", "WS": "WST", "XK": "EUR", "YE": "YER", "YT": "EUR", "ZA": "ZAR", "ZM": "ZMK", "ZW": "ZWL"};
    $.get('https://freegeoip.net/json/', function(data) {
      var countryCode = data.country_code.toLowerCase();
      var countryName = data.country_name;
      if (countryName == 'United States')
        countryName = 'The United States';
	  
      $('.flagImg').html('<i class="flag animated flash '+countryCode+'"></i>');
      $('.countryName').text(countryName);
      
      var countryCurrency = countriesWithCurrency[countryCode.toUpperCase()];
      var supported_currencies = '{{ settings.supported_currencies }}';
      supported_currencies = supported_currencies.split(' ');
      if(countryCurrency != "" && countryCurrency != null && countryCurrency != undefined){
        if(jQuery.inArray(countryCurrency, supported_currencies) !== -1) {
          jQuery('[name=currencies]').val(countryCurrency).change();
        }
      }
    }, 'jsonp');
    {% if settings.enable_delivery_option %}
 
      var tomorrow = new Date();
     
      tomorrow.setDate(tomorrow.getDate() + $(".date_one_ship").data("date"));
        alert(tomorrow);
      var excludeDays = "{{ settings.delivery_off_days }}";
      excludeDays = excludeDays.split(" ");
      $.each(excludeDays, function(key, daySingle){
        if(daySingle === "SUN"){
          excludeDays[key] = 0;
        }
        if(daySingle === "MON"){
          excludeDays[key] = 1;
        }
        if(daySingle === "TUE"){
          excludeDays[key] = 2;
        }
        if(daySingle === "WED"){
          excludeDays[key] = 3;
        }
        if(daySingle === "THU"){
          excludeDays[key] = 4;
        }
        if(daySingle === "FRI"){
          excludeDays[key] = 5;
        }
        if(daySingle === "SAT"){
          excludeDays[key] = 6;
        }
      });
      if(excludeDays.length >= 7){
		excludeDays = [];
      }
      do {
        tomorrow.setDate(tomorrow.getDate() + 1);
      } while($.inArray(tomorrow.getDay(), excludeDays) > -1);
      var fmt = new DateFmt();
      $(".date_one_ship").html(fmt.format(tomorrow,"%w %n %d"));
    
      var tomorrow2 = new Date();
      tomorrow2.setDate(tomorrow2.getDate() + $(".date_two_ship").data("date"));
      do {
        tomorrow2.setDate(tomorrow2.getDate() + 1);
      } while($.inArray(tomorrow2.getDay(), excludeDays) > -1);
      var fmt = new DateFmt();
      $(".date_two_ship").html(fmt.format(tomorrow2,"%w %n %d"));
    {% endif %}
  });
};
timber.recordLastCollection = function (options) {
  jQuery.cookie('shopify_collection', options.collection, { path: '/' });
};
function openpopup(url,name) {
  window.open(url,name,'width=500,height=300');	
}
function DateFmt() {
  this.dateMarkers = { 
    d:['getDate',function(v) { return ("0"+v).substr(-2,2)}], 
    m:['getMonth',function(v) { return ("0"+v).substr(-2,2)}],
    n:['getMonth',function(v) {
      var mthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return mthNames[v];
    }],
    w:['getDay',function(v) {
      var dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      return dayNames[v];
    }],
    y:['getFullYear'],
    H:['getHours',function(v) { return ("0"+v).substr(-2,2)}],
    M:['getMinutes',function(v) { return ("0"+v).substr(-2,2)}],
    S:['getSeconds',function(v) { return ("0"+v).substr(-2,2)}],
    i:['toISOString',null]
  };

  this.format = function(date, fmt) {
    var dateMarkers = this.dateMarkers
    var dateTxt = fmt.replace(/%(.)/g, function(m, p){
      var rv = date[(dateMarkers[p])[0]]()

      if ( dateMarkers[p][1] != null ) rv = dateMarkers[p][1](rv)

      return rv
    });

    return dateTxt
  }
}
$(timber.init);

/*============================================================================
  Ajax the add to cart experience by revealing it in a side drawer
  Plugin Documentation - http://shopify.github.io/Timber/#ajax-cart
  (c) Copyright 2015 Shopify Inc. Author: Carson Shold (@cshold). All Rights Reserved.

  This file includes:
    - Basic Shopify Ajax API calls
    - Ajax cart plugin

  This requires:
    - jQuery 1.8+
    - handlebars.min.js (for cart template)
    - modernizr.min.js
    - snippet/ajax-cart-template.liquid

  Customized version of Shopify's jQuery API
  (c) Copyright 2009-2015 Shopify Inc. Author: Caroline Schnapp. All Rights Reserved.
==============================================================================*/
if ((typeof ShopifyAPI) === 'undefined') { ShopifyAPI = {}; }

/*============================================================================
  API Helper Functions
==============================================================================*/
function attributeToString(attribute) {
  if ((typeof attribute) !== 'string') {
    attribute += '';
    if (attribute === 'undefined') {
      attribute = '';
    }
  }
  return jQuery.trim(attribute);
};

/*============================================================================
  API Functions
==============================================================================*/
ShopifyAPI.onCartUpdate = function(cart) {
  // alert('There are now ' + cart.item_count + ' items in the cart.');
};

ShopifyAPI.updateCartNote = function(note, callback) {
  var $body = $(document.body),
  params = {
    type: 'POST',
    url: '/cart/update.js',
    data: 'note=' + attributeToString(note),
    dataType: 'json',
    beforeSend: function() {
      $body.trigger('beforeUpdateCartNote.ajaxCart', note);
    },
    success: function(cart) {
      if ((typeof callback) === 'function') {
        callback(cart);
      }
      else {
        ShopifyAPI.onCartUpdate(cart);
      }
      $body.trigger('afterUpdateCartNote.ajaxCart', [note, cart]);
    },
    error: function(XMLHttpRequest, textStatus) {
      $body.trigger('errorUpdateCartNote.ajaxCart', [XMLHttpRequest, textStatus]);
      ShopifyAPI.onError(XMLHttpRequest, textStatus);
    },
    complete: function(jqxhr, text) {
      $body.trigger('completeUpdateCartNote.ajaxCart', [this, jqxhr, text]);
    }
  };
  jQuery.ajax(params);
};

ShopifyAPI.onError = function(XMLHttpRequest, textStatus) {
  var data = eval('(' + XMLHttpRequest.responseText + ')');
  if (!!data.message) {
    //alert(data.message + '(' + data.status  + '): ' + data.description);
  }
};

/*============================================================================
  POST to cart/add.js returns the JSON of the cart
    - Allow use of form element instead of just id
    - Allow custom error callback
==============================================================================*/
ShopifyAPI.addItemFromForm = function(form, callback, errorCallback, isProduct) {
  var flag_addcart = true;
  $('.product_properties').each(function(){
    var val = $(this).find('input').val();
    var val_charlimit = $(this).find('input').data('charlimit');
    if(val == "") {
      flag_addcart = false;
      $(this).find('input').addClass("ui-state-error");
      var topScroll = $(this).find('input').offset().top - 300;
      
      $('html, body').animate({
        scrollTop: (topScroll)
      }, 2000);
    } else {
      $(this).find('input').removeClass("ui-state-error");
      $(this).find('.error-limit').hide();
      if(val_charlimit != undefined) {
        if(val.length > val_charlimit){
          flag_addcart = false;
          $(this).find('input').addClass("ui-state-error");
          $(this).find('.error-limit').html("Oops, we won't have space to print all that, try something shorter.").show();
        }
      }
    }
  });
  if(flag_addcart) {
    var $body = $(document.body),
    params = {
      type: 'POST',
      url: '/cart/add.js',
      data: jQuery(form).serialize(),
      dataType: 'json',
      beforeSend: function(jqxhr, settings) {
        $body.trigger('beforeAddItem.ajaxCart', form);
      },
      success: function(line_item) {
        if(isProduct) {
          {% if settings.enable_product_cart_skip %}
            window.location.href = "/checkout";
          {% endif %}
        } else {
          {% if settings.enable_quick_buy_cart_skip %}
            window.location.href = "/checkout";
          {% endif %}
        }
        {% if settings.atc_cart_style == "popup" %}
          $('.cart__hover').addClass('active_cart');
          setTimeout(function(){
            $('.active_cart').removeClass('active_cart');
          }, 5000);
        {% endif %}
        if ((typeof callback) === 'function') {
          callback(line_item, form);
        } else {
          ShopifyAPI.onItemAdded(line_item, form);
        }
        $body.trigger('afterAddItem.ajaxCart', [line_item, form]);
      },
      error: function(XMLHttpRequest, textStatus) {
        if ((typeof errorCallback) === 'function') {
          errorCallback(XMLHttpRequest, textStatus);
        }
        else {
          ShopifyAPI.onError(XMLHttpRequest, textStatus);
        }
        $body.trigger('errorAddItem.ajaxCart', [XMLHttpRequest, textStatus]);
      },
      complete: function(jqxhr, text) {
        $body.trigger('completeAddItem.ajaxCart', [this, jqxhr, text]);
      }
    };
    jQuery.ajax(params);
  }
};

// Get from cart.js returns the cart in JSON
ShopifyAPI.getCart = function(callback) {
 
  $(document.body).trigger('beforeGetCart.ajaxCart');
 
  $.ajax({
    type: 'GET',
    url: '/cart.js',
    cache: false,
    dataType: 'json',
    success: function(cart) {
      if ((typeof callback) === 'function') {
        callback(cart);
      } else {
        ShopifyAPI.onCartUpdate(cart);
      }
      $(document.body).trigger('afterGetCart.ajaxCart', cart);
    }
  });
};

// POST to cart/change.js returns the cart in JSON
ShopifyAPI.changeItem = function(line, quantity, callback) {
  var $body = $(document.body),
  params = {
    type: 'POST',
    url: '/cart/change.js',
    data: 'quantity=' + quantity + '&line=' + line,
    dataType: 'json',
    beforeSend: function() {
      $body.trigger('beforeChangeItem.ajaxCart', [line, quantity]);
    },
    success: function(cart) {
      if ((typeof callback) === 'function') {
        callback(cart);
      } else {
        ShopifyAPI.onCartUpdate(cart);
      }
      $body.trigger('afterChangeItem.ajaxCart', [line, quantity, cart]);
    },
    error: function(XMLHttpRequest, textStatus) {
      $body.trigger('errorChangeItem.ajaxCart', [XMLHttpRequest, textStatus]);
      ShopifyAPI.onError(XMLHttpRequest, textStatus);
    },
    complete: function(jqxhr, text) {
      $body.trigger('completeChangeItem.ajaxCart', [this, jqxhr, text]);
    }
  };
  jQuery.ajax(params);
};

/*============================================================================
  Ajax Shopify Add To Cart
==============================================================================*/
var ajaxCart = (function(module, $) {

  'use strict';

  // Public functions
  var init, loadCart;

  // Private general variables
  var settings, isUpdating, $body;

  // Private plugin variables
  var $formContainer, $addToCart, $cartCountSelector, $cartCostSelector, $cartContainer, $drawerContainer;

  // Private functions
  var updateCountPrice, formOverride, itemAddedCallback, itemErrorCallback, cartUpdateCallback, buildCart, cartCallback, adjustCart, adjustCartCallback, createQtySelectors, qtySelectors, validateQty;

  /*============================================================================
    Initialise the plugin and define global options
  ==============================================================================*/
  init = function (options) {

    // Default settings
    settings = {
      formSelector       : 'form[action^="/cart/add"]',
      cartContainer      : '#CartContainer',
      addToCartSelector  : 'input[type="submit"]',
      cartCountSelector  : null,
      cartCostSelector   : null,
      moneyFormat        : '${{amount}}',
      disableAjaxCart    : false,
      enableQtySelectors : true,
      isProduct : true,
      lastItemRemoved : -1
    };
    // Override defaults with arguments
    $.extend(settings, options);

    // Select DOM elements
    $formContainer     = $(settings.formSelector);
    $cartContainer     = $(settings.cartContainer);
    $addToCart         = $formContainer.find(settings.addToCartSelector);
    $cartCountSelector = $(settings.cartCountSelector);
    $cartCostSelector  = $(settings.cartCostSelector);

    // General Selectors
    $body = $(document.body);

    // Track cart activity status
    isUpdating = false;

    // Setup ajax quantity selectors on the any template if enableQtySelectors is true
    if (settings.enableQtySelectors) {
      qtySelectors();
    }

    // Take over the add to cart form submit action if ajax enabled
    if (!settings.disableAjaxCart && $addToCart.length) {
      formOverride();
    }

    // Run this function in case we're using the quantity selector outside of the cart
    adjustCart();
  };

  loadCart = function () {
    $body.addClass('drawer--is-loading');
    ShopifyAPI.getCart(cartUpdateCallback);
  };

  updateCountPrice = function (cart) {
    if ($cartCountSelector) {
      $cartCountSelector.html(cart.item_count).removeClass('hidden-count');

      if (cart.item_count === 0) {
        $cartCountSelector.addClass('hidden-count');
      }
    }
    if ($cartCostSelector) {
      $cartCostSelector.html(Shopify.formatMoney(cart.total_price, settings.moneyFormat));
    }
  };

  formOverride = function () {
    $formContainer.on('submit', function(evt) {
      evt.preventDefault();

      // Add class to be styled if desired
      $addToCart.removeClass('is-added').addClass('is-adding');

      // Remove any previous quantity errors
      $('.qty-error').remove();

      ShopifyAPI.addItemFromForm(evt.target, itemAddedCallback, itemErrorCallback, settings.isProduct);
    });
  };

  itemAddedCallback = function (product) {
    $addToCart.removeClass('is-adding').addClass('is-added');
	$('#quick-view').find('.modal-body').html("");
    $('#quick-view').removeClass("in");
    ShopifyAPI.getCart(cartUpdateCallback);
  };

  itemErrorCallback = function (XMLHttpRequest, textStatus) {
    var data = eval('(' + XMLHttpRequest.responseText + ')');
    $addToCart.removeClass('is-adding is-added');

    if (!!data.message) {
      if (data.status == 422) {
        $formContainer.after('<div class="errors qty-error">'+ data.description +'</div>')
      }
    }
  };

  cartUpdateCallback = function (cart) {
    // Update quantity and price
    updateCountPrice(cart);
    buildCart(cart);
  };

  buildCart = function (cart) {
    // Start with a fresh cart div
    $cartContainer.empty();

    // Show empty cart
    if (cart.item_count === 0) {
      $cartContainer.append('<p>' + {{ 'cart.general.empty' | t | json }} + '</p><a href="/collections/all" class="btn btn-default btn-large">' + {{ 'cart.general.continue_browsing_html' | t | json }} + '</a>');
      cartCallback(cart);
      return;
    }

    // Handlebars.js cart layout
    var items = [],
        item = {},
        data = {},
        source = $("#CartTemplate").html(),
        template = Handlebars.compile(source);

    // Add each item to our handlebars.js data
    $.each(cart.items, function(index, cartItem) {
      if (cartItem.image != null){
        var prodImg = cartItem.image.replace(/(\.[^.]*)$/, "_small$1").replace('http:', '');
      } else {
        var prodImg = "//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif";
      }
      
     
      
      item = {
        key: cartItem.key,
        line: index + 1, // Shopify uses a 1+ index in the API
        url: cartItem.url,
        img: prodImg,
        name: cartItem.product_title,
        variation: cartItem.variant_title,
        properties: cartItem.properties,
        itemAdd: cartItem.quantity + 1,
        itemMinus: cartItem.quantity - 1,
        itemQty: cartItem.quantity,
        price: Shopify.formatMoney(cartItem.price, settings.moneyFormat),
        vendor: cartItem.vendor,
        linePrice: Shopify.formatMoney(cartItem.line_price, settings.moneyFormat),
        originalLinePrice: Shopify.formatMoney(cartItem.original_line_price, settings.moneyFormat),
        discounts: cartItem.discounts,
        discountsApplied: cartItem.line_price === cartItem.original_line_price ? false : true
      };

      items.push(item);
    });

    // Gather all cart data and add to DOM
    data = {
      items: items,
      note: cart.note,
      totalPrice: Shopify.formatMoney(cart.total_price, settings.moneyFormat),
      totalCartDiscount: cart.total_discount === 0 ? 0 : {{ 'cart.general.savings_html' | t: price: '[savings]' | json }}.replace('[savings]', Shopify.formatMoney(cart.total_discount, settings.moneyFormat)),
      totalCartDiscountApplied: cart.total_discount === 0 ? false : true
    }
    
   
	  $cartContainer.append(template(data));
    
    
    cartCallback(cart);
    var cookieCurrency = Currency.cookie.read();
    if (window.money_default !== cookieCurrency && cookieCurrency != "" && cookieCurrency != null) {
      Currency.convertAll(window.money_default, cookieCurrency);
    }
    
  };

  cartCallback = function(cart) {
    $body.removeClass('drawer--is-loading');
    $body.trigger('afterCartLoad.ajaxCart', cart);

    if (window.Shopify && Shopify.StorefrontExpressButtons) {
      Shopify.StorefrontExpressButtons.initialize();
    }
  };

  adjustCart = function () {
    // Delegate all events because elements reload with the cart
    // Add or remove from the quantity
    $body.on('click', '.ajaxcart__qty-adjust', function() {
      if (isUpdating) {
        return;
      }

      var $el = $(this),
          line = $el.data('line'),
          $qtySelector = $el.siblings('.ajaxcart__qty-num'),
          qty = parseInt($qtySelector.val().replace(/\D/g, ''));

      var qty = validateQty(qty);

      // Add or subtract from the current quantity
      if ($el.hasClass('ajaxcart__qty--plus')) {
        qty += 1;
      } else {
        qty -= 1;
        if (qty <= 0) qty = 0;
      }

      // If it has a data-line, update the cart.
      // Otherwise, just update the input's number
      if (line) {
        updateQuantity(line, qty);
      } else {
        $qtySelector.val(qty);
      }
    });

    // Update quantity based on input on change
    $body.on('change', '.ajaxcart__qty-num', function() {
      if (isUpdating) {
        return;
      }

      var $el = $(this),
          line = $el.data('line'),
          qty = parseInt($el.val().replace(/\D/g, ''));

      var qty = validateQty(qty);

      // If it has a data-line, update the cart
      if (line) {
        updateQuantity(line, qty);
      }
    });

    // Prevent cart from being submitted while quantities are changing
    $body.on('submit', 'form.ajaxcart', function(evt) {
      if (isUpdating) {
        evt.preventDefault();
      }
    });

    // Highlight the text when focused
    $body.on('focus', '.ajaxcart__qty-adjust', function() {
      var $el = $(this);
      setTimeout(function() {
        $el.select();
      }, 50);
    });
    
    $body.on('click', '.removeLineCartPop', function(e){
      e.preventDefault();
      var line = $(this).data('line');
      var variant = $(this).data('variant');
      if(variant != settings.lastItemRemoved){
        settings.lastItemRemoved = variant;
        ShopifyAPI.changeItem(line, 0, itemAddedCallback);
      }
    });

    function updateQuantity(line, qty) {
      isUpdating = true;

      // Add activity classes when changing cart quantities
      var $row = $('.ajaxcart__row[data-line="' + line + '"]').addClass('is-loading');

      if (qty === 0) {
        $row.parent().addClass('is-removed');
      }

      // Slight delay to make sure removed animation is done
      setTimeout(function() {
        ShopifyAPI.changeItem(line, qty, adjustCartCallback);
      }, 250);
    }

    // Save note anytime it's changed
    $body.on('change', 'textarea[name="note"]', function() {
      var newNote = $(this).val();

      // Update the cart note in case they don't click update/checkout
      ShopifyAPI.updateCartNote(newNote, function(cart) {});
    });
  };

  adjustCartCallback = function (cart) {
    // Update quantity and price
    updateCountPrice(cart);

    // Reprint cart on short timeout so you don't see the content being removed
    setTimeout(function() {
      isUpdating = false;
      ShopifyAPI.getCart(buildCart);
    }, 150)
  };

  createQtySelectors = function() {
    // If there is a normal quantity number field in the ajax cart, replace it with our version
    if ($('input[type="number"]', $cartContainer).length) {
      $('input[type="number"]', $cartContainer).each(function() {
        var $el = $(this),
            currentQty = $el.val();

        var itemAdd = currentQty + 1,
            itemMinus = currentQty - 1,
            itemQty = currentQty;

        var source   = $("#AjaxQty").html(),
            template = Handlebars.compile(source),
            data = {
              key: $el.data('id'),
              itemQty: itemQty,
              itemAdd: itemAdd,
              itemMinus: itemMinus
            };

        // Append new quantity selector then remove original
        $el.after(template(data)).remove();
      });
    }
  };

  qtySelectors = function() {
    // Change number inputs to JS ones, similar to ajax cart but without API integration.
    // Make sure to add the existing name and id to the new input element
    var numInputs = $('input[type="number"]');

    if (numInputs.length) {
      numInputs.each(function() {
        var $el = $(this),
            currentQty = $el.val(),
            inputName = $el.attr('name'),
            inputId = $el.attr('id');

        var itemAdd = currentQty + 1,
            itemMinus = currentQty - 1,
            itemQty = currentQty;

        var source   = $("#JsQty").html(),
            template = Handlebars.compile(source),
            data = {
              key: $el.data('id'),
              itemQty: itemQty,
              itemAdd: itemAdd,
              itemMinus: itemMinus,
              inputName: inputName,
              inputId: inputId
            };

        // Append new quantity selector then remove original
        $el.after(template(data)).remove();
      });

      // Setup listeners to add/subtract from the input
      $('.js-qty__adjust').on('click', function() {
        var $el = $(this),
            id = $el.data('id'),
            $qtySelector = $el.siblings('.js-qty__num'),
            qty = parseInt($qtySelector.val().replace(/\D/g, ''));

        var qty = validateQty(qty);

        // Add or subtract from the current quantity
        if ($el.hasClass('js-qty__adjust--plus')) {
          qty += 1;
        } else {
          qty -= 1;
          if (qty <= 1) qty = 1;
        }

        // Update the input's number
        $qtySelector.val(qty);
      });
    }
  };

  validateQty = function (qty) {
    if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      // Not a number. Default to 1.
      qty = 1;
    }
    return qty;
  };

  module = {
    init: init,
    load: loadCart
  };

  return module;

}(ajaxCart || {}, jQuery));


// Dropdown menu 
jQuery(document).on('click', ".icon-arrow-down", function(){
 if (!$(this).parent().hasClass('nav-hover'))
  {  $('.site-nav--has-dropdown').removeClass('nav-hover');  $(this).parent().addClass('nav-hover'); }
  else{ $(this).parent().removeClass('nav-hover');}
});
