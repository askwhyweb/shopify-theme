/**
* jquery.matchHeight.js master
* http://brm.io/jquery-match-height/
* License: MIT
*/

;(function($) { // eslint-disable-line no-extra-semi
    /*
    *  internal
    */

    var _previousResizeWidth = -1,
        _updateTimeout = -1;

    /*
    *  _parse
    *  value parse utility function
    */

    var _parse = function(value) {
        // parse value and convert NaN to 0
        return parseFloat(value) || 0;
    };

    /*
    *  _rows
    *  utility function returns array of jQuery selections representing each row
    *  (as displayed after float wrapping applied by browser)
    */

    var _rows = function(elements) {
        var tolerance = 1,
            $elements = $(elements),
            lastTop = null,
            rows = [];

        // group elements by their top position
        $elements.each(function(){
            var $that = $(this),
                top = $that.offset().top - _parse($that.css('margin-top')),
                lastRow = rows.length > 0 ? rows[rows.length - 1] : null;

            if (lastRow === null) {
                // first item on the row, so just push it
                rows.push($that);
            } else {
                // if the row top is the same, add to the row group
                if (Math.floor(Math.abs(lastTop - top)) <= tolerance) {
                    rows[rows.length - 1] = lastRow.add($that);
                } else {
                    // otherwise start a new row group
                    rows.push($that);
                }
            }

            // keep track of the last row top
            lastTop = top;
        });

        return rows;
    };

    /*
    *  _parseOptions
    *  handle plugin options
    */

    var _parseOptions = function(options) {
        var opts = {
            byRow: true,
            property: 'height',
            target: null,
            remove: false
        };

        if (typeof options === 'object') {
            return $.extend(opts, options);
        }

        if (typeof options === 'boolean') {
            opts.byRow = options;
        } else if (options === 'remove') {
            opts.remove = true;
        }

        return opts;
    };

    /*
    *  matchHeight
    *  plugin definition
    */

    var matchHeight = $.fn.matchHeight = function(options) {
        var opts = _parseOptions(options);

        // handle remove
        if (opts.remove) {
            var that = this;

            // remove fixed height from all selected elements
            this.css(opts.property, '');

            // remove selected elements from all groups
            $.each(matchHeight._groups, function(key, group) {
                group.elements = group.elements.not(that);
            });

            // TODO: cleanup empty groups

            return this;
        }

        if (this.length <= 1 && !opts.target) {
            return this;
        }

        // keep track of this group so we can re-apply later on load and resize events
        matchHeight._groups.push({
            elements: this,
            options: opts
        });

        // match each element's height to the tallest element in the selection
        matchHeight._apply(this, opts);

        return this;
    };

    /*
    *  plugin global options
    */

    matchHeight.version = 'master';
    matchHeight._groups = [];
    matchHeight._throttle = 80;
    matchHeight._maintainScroll = false;
    matchHeight._beforeUpdate = null;
    matchHeight._afterUpdate = null;
    matchHeight._rows = _rows;
    matchHeight._parse = _parse;
    matchHeight._parseOptions = _parseOptions;

    /*
    *  matchHeight._apply
    *  apply matchHeight to given elements
    */

    matchHeight._apply = function(elements, options) {
        var opts = _parseOptions(options),
            $elements = $(elements),
            rows = [$elements];

        // take note of scroll position
        var scrollTop = $(window).scrollTop(),
            htmlHeight = $('html').outerHeight(true);

        // get hidden parents
        var $hiddenParents = $elements.parents().filter(':hidden');

        // cache the original inline style
        $hiddenParents.each(function() {
            var $that = $(this);
            $that.data('style-cache', $that.attr('style'));
        });

        // temporarily must force hidden parents visible
        $hiddenParents.css('display', 'block');

        // get rows if using byRow, otherwise assume one row
        if (opts.byRow && !opts.target) {

            // must first force an arbitrary equal height so floating elements break evenly
            $elements.each(function() {
                var $that = $(this),
                    display = $that.css('display');

                // temporarily force a usable display value
                if (display !== 'inline-block' && display !== 'inline-flex') {
                    display = 'block';
                }

                // cache the original inline style
                $that.data('style-cache', $that.attr('style'));

                $that.css({
                    'display': display,
                    'padding-top': '0',
                    'padding-bottom': '0',
                    'margin-top': '0',
                    'margin-bottom': '0',
                    'border-top-width': '0',
                    'border-bottom-width': '0',
                    'height': '100px',
                    'overflow': 'hidden'
                });
            });

            // get the array of rows (based on element top position)
            rows = _rows($elements);

            // revert original inline styles
            $elements.each(function() {
                var $that = $(this);
                $that.attr('style', $that.data('style-cache') || '');
            });
        }

        $.each(rows, function(key, row) {
            var $row = $(row),
                targetHeight = 0;

            if (!opts.target) {
                // skip apply to rows with only one item
                if (opts.byRow && $row.length <= 1) {
                    $row.css(opts.property, '');
                    return;
                }

                // iterate the row and find the max height
                $row.each(function(){
                    var $that = $(this),
                        display = $that.css('display');

                    // temporarily force a usable display value
                    if (display !== 'inline-block' && display !== 'inline-flex') {
                        display = 'block';
                    }

                    // ensure we get the correct actual height (and not a previously set height value)
                    var css = { 'display': display };
                    css[opts.property] = '';
                    $that.css(css);

                    // find the max height (including padding, but not margin)
                    if ($that.outerHeight(false) > targetHeight) {
                        targetHeight = $that.outerHeight(false);
                    }

                    // revert display block
                    $that.css('display', '');
                });
            } else {
                // if target set, use the height of the target element
                targetHeight = opts.target.outerHeight(false);
            }

            // iterate the row and apply the height to all elements
            $row.each(function(){
                var $that = $(this),
                    verticalPadding = 0;

                // don't apply to a target
                if (opts.target && $that.is(opts.target)) {
                    return;
                }

                // handle padding and border correctly (required when not using border-box)
                if ($that.css('box-sizing') !== 'border-box') {
                    verticalPadding += _parse($that.css('border-top-width')) + _parse($that.css('border-bottom-width'));
                    verticalPadding += _parse($that.css('padding-top')) + _parse($that.css('padding-bottom'));
                }

                // set the height (accounting for padding and border)
                $that.css(opts.property, (targetHeight - verticalPadding) + 'px');
            });
        });

        // revert hidden parents
        $hiddenParents.each(function() {
            var $that = $(this);
            $that.attr('style', $that.data('style-cache') || null);
        });

        // restore scroll position if enabled
        if (matchHeight._maintainScroll) {
            $(window).scrollTop((scrollTop / htmlHeight) * $('html').outerHeight(true));
        }

        return this;
    };

    /*
    *  matchHeight._applyDataApi
    *  applies matchHeight to all elements with a data-match-height attribute
    */

    matchHeight._applyDataApi = function() {
        var groups = {};

        // generate groups by their groupId set by elements using data-match-height
        $('[data-match-height], [data-mh]').each(function() {
            var $this = $(this),
                groupId = $this.attr('data-mh') || $this.attr('data-match-height');

            if (groupId in groups) {
                groups[groupId] = groups[groupId].add($this);
            } else {
                groups[groupId] = $this;
            }
        });

        // apply matchHeight to each group
        $.each(groups, function() {
            this.matchHeight(true);
        });
    };

    /*
    *  matchHeight._update
    *  updates matchHeight on all current groups with their correct options
    */

    var _update = function(event) {
        if (matchHeight._beforeUpdate) {
            matchHeight._beforeUpdate(event, matchHeight._groups);
        }

        $.each(matchHeight._groups, function() {
            matchHeight._apply(this.elements, this.options);
        });

        if (matchHeight._afterUpdate) {
            matchHeight._afterUpdate(event, matchHeight._groups);
        }
    };

    matchHeight._update = function(throttle, event) {
        // prevent update if fired from a resize event
        // where the viewport width hasn't actually changed
        // fixes an event looping bug in IE8
        if (event && event.type === 'resize') {
            var windowWidth = $(window).width();
            if (windowWidth === _previousResizeWidth) {
                return;
            }
            _previousResizeWidth = windowWidth;
        }

        // throttle updates
        if (!throttle) {
            _update(event);
        } else if (_updateTimeout === -1) {
            _updateTimeout = setTimeout(function() {
                _update(event);
                _updateTimeout = -1;
            }, matchHeight._throttle);
        }
    };

    /*
    *  bind events
    */

    // apply on DOM ready event
    $(matchHeight._applyDataApi);

    // update heights on load and resize events
    $(window).bind('load', function(event) {
        matchHeight._update(false, event);
    });

    // throttled update heights on resize events
    $(window).bind('resize orientationchange', function(event) {
        matchHeight._update(true, event);
    });

})(jQuery);

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
    if(formatString != undefined) {
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
    } else {
      return cents;
    }
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
  
    timber.RightDrawer = new timber.Drawers('CartDrawer', 'right', {
      'onDrawerOpen': ajaxCart.load
    });
  
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
        $productPrice2 = $('#proprice'),
      $comparePrice = $('#AddToCartForm--'+product_id+' #ComparePrice'),
         $comparePrice2 = $('#propricecompare'),
      $comparePriceClass = $('#AddToCartForm--'+product_id+' .ComparePrice'),
      $youSave = $('#AddToCartForm--'+product_id+' #YouSave'),
      $quantityElements = $('#AddToCartForm--'+product_id+' .quantity-selector, #AddToCartForm--'+product_id+' .js-qty'),
      $addToCartText = $('#AddToCartForm--'+product_id+' #AddToCartText');
  $AddToCartTextfree = $('#AddToCartForm--'+product_id+' #AddToCartTextfree');
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
    $productPrice2.html("<span class='money'>" + Shopify.formatMoney(variant.price, moneyFormat) + "</span>");
   
    if (variant.available) {
      $addToCart.removeClass('disabled').prop('disabled', false);
      
        $addToCartText.html('Add to Cart');
      
       
      $AddToCartTextfree.html('BUY NOW & SHIPS FREE');
                              
      
      if (variant.compare_at_price > variant.price) {
        $comparePrice.html("<span class='money'>" + Shopify.formatMoney(variant.compare_at_price, moneyFormat) + "</span>").show();
         $comparePrice2.html("<span class='money'>" + Shopify.formatMoney(variant.compare_at_price, moneyFormat) + "</span>").show();
              $comparePriceClass.show();
        
          var per = ((variant.compare_at_price - variant.price) * 100) / variant.compare_at_price;
          $youSave.html('You Save: <b id="save_value-'+product_id+'"><span class="money">'+Shopify.formatMoney((variant.compare_at_price - variant.price), moneyFormat)+'</span> ('+ per.toFixed(0) +'%)</b>').show();
        
      } else {
        $comparePrice.hide();
              $comparePrice2.hide();
        $comparePriceClass.hide();
        
          $youSave.hide();
        
      }
    } else {
      $addToCart.addClass('disabled').prop('disabled', true);
      $addToCartText.html("Sold Out");
      $productPrice.html("Sold Out");
      $productPrice2.html("Sold Out");
      $comparePrice.hide();
        $comparePrice2.hide();
      $comparePriceClass.hide();
      
        $youSave.hide();
      
    }
  } else {
    $comparePrice.hide();
      $comparePrice2.hide();
    $comparePriceClass.hide();
    
      $youSave.hide();
    
    $addToCart.addClass('disabled').prop('disabled', true);
    $addToCartText.html("Sold Out");
    $productPrice.html("Sold Out");
     $productPrice2.html("Sold Out");
  }
  
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

timber.bodySaveBar = function() {
  if(!$('body').hasClass('saveBarDisplay')) {
    $('body').addClass('saveBarDisplay');
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

    this.$nodes.page.on('click.drawer touchend.drawer', $.proxy(function () {
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
    
    //alert(options.offset);
    if(options.total_images > 2) {
      
        $('#bx-pager-'+options.product_id).bxSlider({
          infiniteLoop: false,
          slideWidth: 118,
           slideMargin: 10,
          minSlides: 4,
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
            if ($('.stickyform').length) {
              $(".stickyform").find("select[data-option='option3']").val(option3).change();
            }
          }
          if(op2) {
            $("#AddToCartForm--"+product_id).find("select[data-option='option2']").change();
            if ($('.stickyform').length) {
              $(".stickyform").find("select[data-option='option2']").val(option2).change();
            }
          }
          if(op1) {
            $("#AddToCartForm--"+product_id).find("select[data-option='option1']").change();
            if ($('.stickyform').length) {
              $(".stickyform").find("select[data-option='option1']").val(option1).change();
            }
          }
        }, 200);
      
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
    if ($('.stickyform').length) {
      var indexI = 1;
      $(this).closest('form').find('.single-option-selector').each(function(){
        var indexV = $(this).val();
        $(".stickyform").find("select[data-option='option"+(parseInt(indexI))+"']").val(indexV).trigger('change');
        indexI++;
      });
    }
  });
};

 

timber.progressStriped = function () {
  if ($('.progress.progress-striped').length) {
    
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
    $('#countdown-timer-'+options.product_id+' .header').html("");
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

timber.countDownTimerStickyExtend = function (options) {
  var cutoff = $('.sticky_bar_timer').data('cutoff');
  var reset = $('.sticky_bar_timer').data('reset');
$(window).bind("load", function() { 
  if (options.exp - options.now > 0) {
    $('.sticky_bar_timer').downCount({
      date: options.exp,
      offset: timezone()
    }, function () {
      $('.sticky_bar_timer').html("");
    });
    setTimeout(function(){
      $('.sticky_bar').css("visibility", "visible");
    }, 1000);
  } else {
    options.exp.addHours(reset);
    timber.countDownTimerStickyExtend({
      now: options.now,
      exp: options.exp
    });
  }
});
};

timber.countDownTimerSticky = function (options) {
  if ($('.sticky_bar_timer').length) {
    var now = new Date();
    var exp = now;
    var cutoff = $('.sticky_bar_timer').data('cutoff');
    var reset = $('.sticky_bar_timer').data('reset');
    if(cutoff == 0){
      exp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else {
      exp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()+cutoff, 0, 0);
    }
    $(window).bind("load", function() { 
    if (exp - now > 0) {
      $('.sticky_bar_timer').downCount({
        date: exp,
        offset: timezone()
      }, function () {
        $('.sticky_bar_timer').html("");
      });
      setTimeout(function(){
        $('.sticky_bar').css("visibility", "visible");
      }, 1000);
    } else {
      if(cutoff == 0){
        exp.addHours(reset);
        timber.countDownTimerStickyExtend({
          now: now,
          exp: exp
        });
      } else {
        $('.sticky_bar_timer').html("");
      }
    }
      });
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
    var min = 2;
    var max = 11;
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

  timber.flashSoldBar = function () {
    if ($('#TotalSold').length) {
      var minQty = 10;
      var maxQty = 15;
      var minTime = 24;
      var maxTime = 24;
      minQty = Math.ceil(minQty);
      maxQty = Math.floor(maxQty);
      minTime = Math.ceil(minTime);
      maxTime = Math.floor(maxTime);


      var parts = document.location.href.split('/');
      var current_product = parts.pop() || parts.pop();


      var qty = timber.getCookie('qty'+current_product);
      if (qty == null) {
          var qty = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
          qty = parseInt(qty);
          if(qty <= minQty){
              qty = minQty;
          }
          if(qty > maxQty){
              qty = maxQty;
          }
      }

      jQuery("#TotalSold").html(qty);
      timber.setCookie('qty'+current_product, qty, 1);
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


timber.setCookie = function (name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
timber.getCookie = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
timber.eraseCookie = function (name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

timber.soldInverse = function () {
  if ($('.remaining--text').length) {
    var current = $('.remaining--text').find('.danger').html();
    current = parseInt(current);
    if(current > 1){
      current = current - 1;
      $('.remaining--text').find('.danger').html(current);
      setTimeout(function(){
        timber.soldInverse();
      }, 10000);
    }
  }
}

  timber.PerTagLine = function () {
    if ($('#PerTagBuy').length) {
      var min = 81;
      var max = 94;
      min = Math.ceil(min);
      max = Math.floor(max);
      var per = Math.floor(Math.random() * (max - min + 1)) + min;
      per = parseInt(per);
      if(per <= min){
        per = min;
      }
      if(per > max){
        per = max;
      }
      jQuery("#PerTagBuy").html(per);
      
        setInterval(function(){
          $('.p-tag-emoji').fadeIn(function() {
            $(this).css("visibility", "visible");
          }).delay(1000).fadeIn(function() {
            $(this).css("visibility", "hidden");
          }).delay(600);
        }, 1600);
      
    }
  };

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
    
    controlNav: false,
     
      directionNav: true, 
    
    animation: "fade", 
    
    slideshowSpeed: 10*1000,
    before: function(){
      if(!canSlide) {
        slider.flexslider("stop");
      }
    }
  });
  
  

  if ($('.promotion-slider').length) {
    $(".promotion-slider").owlCarousel({
      items: 1,
      autoplay: true,
      autoPlaySpeed: 5000,
      autoPlayTimeout: 5000,
      autoplayHoverPause: true,
      nav:true,
     navText:["<span class='fa fa-angle-left'></span>", "<span class='fa fa-angle-right'></span>"],
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
  
  /***********************Deal of the Day ***************************/   
  if ($('.dealproduct').length) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!

    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
    var today = yyyy+'-'+mm+'-'+dd;
    $('.deal-'+today).addClass('deal-show');
    if($('.deal-show').length == 0){
       $('.deal-of-the-day h2').hide();
    }
    if($('.deal-show').length > 1){
     $(".dealproduct.owl-carousel").owlCarousel({
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
            items: 1
          },
          980: {
            items: 2
          },
          1220: {
            items: 1
          }
        }
      });
    }else if($('.deal-show').length == 1){
      $('.dealproduct.owl-carousel').css('display','block');
    }
    
  }
  /***********************END Deal of the Day ***************************/ 
  
  
  if ($('.carousel-product').length) {
    $(".carousel-product").owlCarousel({
      items: 1,
      autoplay: true,
      loop: true,
      autoPlaySpeed: 5000,
      autoPlayTimeout: 5000,
      autoplayHoverPause: true,
      nav:true,
      navText:["<span class='fa fa-angle-left'></span>", "<span class='fa fa-angle-right'></span>"],
      responsive: {
        0: {
          items: 2,
          slideBy: 2
        },
        650: {
          items: 2,
          slideBy: 2
        },
        980: {
          items: 3,
          slideBy: 3
        },
        1220: {
          items: 4,
          slideBy: 4
        }
      }
    });
  }
  
  $('#cartAddPopup').click(function(e){
    e.preventDefault();
    window.location.href = "/cart";  
  });
  
  $('.cart__hover').on('mouseenter', function(e) {
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

timber.modalBoxSize = function () {
  var modal;
    var modalHTML;
  var btn = $("[data-toggle='modal_size']");
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


  timber.cartTimer = function () {
    if ($('#cartTimer').length) {
      var completetime = 600 - 60;
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

timber.estimateTimer = function () {
  if ($('#estimateTimer').length) {
    var startTime = new Date();
    var endTime = new Date(startTime.getFullYear()+"/"+(startTime.getMonth()+1)+"/"+startTime.getDate()+' 16:00:00');
    var timer_time = Math.round((endTime - startTime) / 60000);
    
    var tomorrow = new Date();
    var date_one_days = $('#estimateTimer').parent("b").find(".dateEstimate").data("date");
    //tomorrow.setDate(tomorrow.getDate() + $('#estimateTimer').parent("b").find(".dateEstimate").data("date"));
    
    if(timer_time <= 0){
      endTime.setDate(endTime.getDate() + 1);
      timer_time = Math.round((endTime - startTime) / 60000);
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    
    var excludeDays = "SUN";
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
    var count_one = 0;
    do {
      tomorrow.setDate(tomorrow.getDate() + 1);
      if($.inArray(tomorrow.getDay(), excludeDays) <= -1){
        count_one++;
      }
    } while($.inArray(tomorrow.getDay(), excludeDays) > -1 || count_one < date_one_days);
    var fmt = new DateFmt();
    $(".dateEstimate").html(fmt.format(tomorrow,"%w %n %d"));
    
    var hours = Math.floor(timer_time / 60);          
    var minutes = Math.floor(timer_time % 60);
    var day_wek = fmt.format(tomorrow,"%y") +' '+hours+':'+minutes;
    var countDownDate = new Date(day_wek).getTime();

    // Update the count down every 1 second
    var x = setInterval(function() {

    // Get todays date and time
    var now = new Date().getTime();
    
    // Find the distance between now an the count down date
    var distance = countDownDate - now;

    // Output the result in an element with id="demo"
    document.getElementById("estimateTimer").innerHTML =hours + " hours " + minutes + " minutes";

    // If the count down is over, write some text 
    if (distance < 0) {
        clearInterval(x);
    //document.getElementById("estimateTimer").innerHTML = "EXPIRED";
    }
}, 100);
    
    
  }
};
if(window.template != "cart"){
  
    $( window ).scroll(function() {
      var scroll = $(window).scrollTop();
      if($(window).width() > 767){
        
      } else {
        
          if(scroll > 100){
            if(!$('.site-header .nav-bar').hasClass('sticky')){
              $('.site-header').removeClass('sticky');
              $('.site-header .nav-bar').addClass('sticky');
              $('.top--line').hide();
            }
          } else {
            $('.site-header').removeClass('sticky');
            $('.site-header .nav-bar').removeClass('sticky');
            $('.top--line').show();
          }
        
      }
    });
  
}

$( window ).resize(function() {
  $('.site-header').removeClass('sticky');
  $('.site-header .nav-bar').removeClass('sticky');
  $('.cart__footer-icon').removeClass('in');
  
});

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

timber.collectionImageSlide = function () {
  $( ".grid__image" ).mouseenter(function() {
    if ($(window).width() > 1024) {
      
        $(this).children('.first--image').css('opacity', '0');
        $(this).children('.second--image').css('opacity', '1');
      
    }
  }).mouseleave(function() {
    if ($(window).width() > 1024) {
      
        $(this).children('.first--image').css('opacity', '1');
        $(this).children('.second--image').css('opacity', '0');
      
    }
  });
};


  if($(window).width() > 767){
    $(".quick-shop").click(function(e){
      e.preventDefault();
      if($(window).width() > 767){
        var id = $(this).data('href');
        var $prod = $(this).closest(".grid__item");
        var template = $prod.find("[id^=product-template-"+id+"]").html();
        $('#quick-view').find('.modal-body').html(template);
        timber.modalBox();
        timber.modalBoxSize();
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
        
        if(product_json.variants.length == 1 && product_json.variants[0].title == "Default Title") {
          $('.selector-wrapper').hide();
        }
        
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
        
          
          
            timber.countDownFlipTimer({
              product_id: id
            });
          
        
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


timber.cartUpdatePopup = function (cart) {
  var cart_summary = $('#cart-popup');
  $('.CartCount').html(cart.item_count);
  if (cart_summary.length) {
    cart_summary.empty();
    jQuery.each(cart, function(key, value) {
      if (key === 'items') {
        var $html = '';
        if (value.length) {
          $html += '<form action="/cart" method="post" novalidate class="cartt ajaxcart">';
          $html += '<div class="container">';
          $html += '<div class="cartForm">';
          
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
            $html += '</a><a href="/cart/change?line='+(i+1)+'&quantity=0" data-line="'+(i+1)+'" data-variant="'+ item.variant_id +'" class="removeLineCartPop" rel="'+ item.variant_id +'"><i class="fa fa-times"></i></a>';
            $html += '</li>';
          });
          $html += '</ul>';
          $html += '<ul class="cart-popup-ul-top">';
          $html += '<li class="total-items"><b>Total: <span class="money">'+ Shopify.formatMoney(cart.total_price, window.money_format) +'</span></b></li>';
           
          $html += '</ul>';
          $html += '<ul class="cart-popup-ul-bottom">';
          $html += '<li><a href="/cart" class="btn--secondary btn--full cart__cartview">View My Cart</a></li><li>';
          $html += '<a href="/checkout" class="btn btn--full cart__checkout Checkout">';
          $html += '<img src="//cdn.shopify.com/s/files/1/0065/6356/1533/t/20/assets/checkout-button-icon.png?10401219496324850891" alt="" class="addIcon" />';
          $html += '<span id="CheckoutText">Secure Checkout</span>';
          $html += '</a>';
                   
          $html +='<li class="additional-checkout-buttons">';
          $html +='<button name="goto_pp" type="submit" id="paypal-express-button" class="additional-checkout-button additional-checkout-button--paypal-express" value="paypal_express" data-strategy="cart">Check out with <img alt="Checkout with: PayPal" src="//cdn.shopify.com/s/assets/checkout/easy-checkout-btn-paypal-9835af2c2b0e2a543b2905789a7f08b678d62de2c77c1b0d16fd7689aff463f3.png"></button>';
          $html +=  '</li><img alt="Checkout Secure" src="//cdn.shopify.com/s/files/1/0065/6356/1533/t/20/assets/checkout_icon.png?10401219496324850891" class="no-border checkout-img ratina-img">';
                  
          
            $html += '<div class="cart--promo-msg common_shipping_text"></div>';
          
          
          $html += '</li></ul></div></div>';
          $html += '</form>';

          
          cart_summary.removeClass('empty-popup');
        } else {
          $html = '<div class="container"><ul class="cart-popup-ul-bottom"><li class="empty-cart-popup-msg">Your Cart is Empty.</li></ul></div>';
          cart_summary.addClass('empty-popup');
        }
        cart_summary.append($html);
        
          var cookieCurrency = Currency.cookie.read();
          if (window.money_default !== cookieCurrency && cookieCurrency != "" && cookieCurrency != null) {
            Currency.convertAll(window.money_default, cookieCurrency);
          }
        
      }
    });
  }
};
timber.cartUpdatePopupModel = function (cart) {
  var needToShow = true;
  var cartAddItemNotification = $('#cartAddItemNotification');
  var cart_popup = $('#popup-cart-body');
  if (cart_popup.length) {
    cart_popup.empty();
    jQuery.each(cart, function(key, value) {
      if (key === 'items') {
        var $html = '';
        if (value.length) {
          jQuery.each(value, function(i, item) {
            $html += '<tr>';
            $html += '<td class="addCart-product-item-img"><img src="'+ Shopify.resizeImage(item.image, 'small') +'" alt="Image of '+ item.title +'" class="cart-item-image" /></td>';
            $html += '<td class="addCart-product-item-info">';
            $html += '<div class="addCart-product-title">'+ item.title +'</div>';
            $html += '<div class="addCart-product-qty">';
            $html += '<div class="ajaxcart__qty">';
            $html += '<button type="button" class="ajaxcart__qty-adjust ajaxcart__qty--minus icon-fallback-text" data-line="'+(i+1)+'">';
            $html += '<span class="icon icon-minus" aria-hidden="true"></span>';
            $html += '<span class="fallback-text" aria-hidden="true">&minus;</span>';
            $html += '<span class="visually-hidden">Reduce item quantity by one</span>';
            $html += '</button>';
            $html += '<input type="text" name="updates[]" class="ajaxcart__qty-num" value="'+ item.quantity +'" min="0" data-line="'+(i+1)+'" aria-label="quantity" pattern="[0-9]*">';
            $html += '<button type="button" class="ajaxcart__qty-adjust ajaxcart__qty--plus icon-fallback-text" data-line="'+(i+1)+'">';
            $html += '<span class="icon icon-plus" aria-hidden="true"></span>';
            $html += '<span class="fallback-text" aria-hidden="true">+</span>';
            $html += '<span class="visually-hidden">Increase item quantity by one</span>';
            $html += '</button>';
            $html += '</div></div>';
            $html += '</td>';
            $html += '<td class="addCart-product-item-price">';
            $html += '<p><span class="money">'+ Shopify.formatMoney(item.price, window.money_format) +'</span></p>';
            $html += '<a href="/cart/change?line='+(i+1)+'&quantity=0" data-line="'+(i+1)+'" data-variant="'+ item.variant_id +'" class="removeLineCartPopModel" rel="'+ item.variant_id +'"><i class="fa fa-times"></i></a>';
            $html += '</td>';
            $html += '</tr>';
          });
          cartAddItemNotification.find('.addCart-subtotal').html('<span class="money">' + Shopify.formatMoney(cart.total_price, window.money_format) +'</span>');
        } else {
          cart_popup.empty();
          needToShow = false;
          $('#cartAddItemNotification').removeClass("in");
        }
        cart_popup.append($html);
        
          var cookieCurrency = Currency.cookie.read();
          if (window.money_default !== cookieCurrency && cookieCurrency != "" && cookieCurrency != null) {
            Currency.convertAll(window.money_default, cookieCurrency);
          }
        
      }
    });
  }
                                                                 
  if($(window).width() > 540){
    var width = "500px";
  } else {
    var width = "90%";
  }
  cartAddItemNotification.find('.modal-content').css('width', width);
  if(needToShow) {
    cartAddItemNotification.addClass("in");
  }
  $('#cartAddItemNotification .addCart-popup-close').click(function(e){
    e.preventDefault();
    $('#cartAddItemNotification').removeClass("in");
  });
  $('#cartAddItemNotification .close').click(function(e){
    e.preventDefault();
    $('#cartAddItemNotification').removeClass("in");
  });
  $('#cartAddItemNotification').click(function(e){
    e.preventDefault();
    $('#cartAddItemNotification').removeClass("in");
  });
  $('.removeLineCartPopModel').click(function(e){
    e.preventDefault();
    var line = $(this).data('line');
    var qty = 0;
    setTimeout(function() {
      var $body = $(document.body),
          params = {
            type: 'POST',
            url: '/cart/change.js',
            data: 'quantity=' + qty + '&line=' + line,
            dataType: 'json',
            success: function(cart) {
              $.ajax({
                type: 'GET',
                url: '/cart.js',
                cache: false,
                dataType: 'json',
                success: function(cart) {
                  timber.cartUpdatePopupModel(cart);
                }
              });
            }
          };
      jQuery.ajax(params);
    }, 250);
  });
  $('.modal-content').click(function(e){
    e.stopPropagation();
  });
  $(document).find('.addCart-product-qty').find('.ajaxcart__qty').on('click', '.ajaxcart__qty-adjust', function() {
    var $el = $(this),
        $qtySelector = $el.siblings('.ajaxcart__qty-num'),
        qty = parseInt($qtySelector.val().replace(/\D/g, ''));
    var qty = timber.validateQty(qty);
    if ($el.hasClass('ajaxcart__qty--plus')) {
      qty += 1;
    } else {
      qty -= 1;
      if (qty <= 1) qty = 1;
    }
    $qtySelector.val(qty).trigger('change');
  });
};
timber.validateQty = function (qty) {
  if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {
    // We have a valid number!
  } else {
    // Not a number. Default to 1.
    qty = 1;
  }
  return qty;
};
$(document).on('change', '.addCart-product-qty .ajaxcart__qty-num', function() {
  var line = $(this).data('line');
  var qty = $(this).val();
  setTimeout(function() {
    var $body = $(document.body),
        params = {
          type: 'POST',
          url: '/cart/change.js',
          data: 'quantity=' + qty + '&line=' + line,
          dataType: 'json',
          success: function(cart) {
            $.ajax({
              type: 'GET',
              url: '/cart.js',
              cache: false,
              dataType: 'json',
              success: function(cart) {
                timber.cartUpdatePopupModel(cart);
              }
            });
          }
        };
    jQuery.ajax(params);
  }, 250);
});
timber.geoIP = function () {
  $(function(){
    var countriesWithCurrency = {"AD": "EUR", "AE": "AED", "AF": "AFN", "AG": "XCD", "AI": "XCD", "AL": "ALL", "AM": "AMD", "AO": "AOA", "AR": "ARS", "AS": "USD", "AT": "EUR", "AU": "AUD", "AW": "AWG", "AX": "EUR", "AZ": "AZN", "BA": "BAM", "BB": "BBD", "BD": "BDT", "BE": "EUR", "BF": "XOF", "BG": "BGN", "BH": "BHD", "BI": "BIF", "BJ": "XOF", "BL": "EUR", "BM": "BMD", "BN": "BND", "BO": "BOB", "BQ": "USD", "BR": "BRL", "BS": "BSD", "BT": "INR", "BV": "NOK", "BW": "BWP", "BY": "BYR", "BZ": "BZD", "CC": "AUD", "CD": "CDF", "CF": "XAF", "CG": "XAF", "CH": "CHE", "CI": "XOF", "CK": "NZD", "CL": "CLF", "CM": "XAF", "CN": "CNY", "CO": "COP", "CR": "CRC", "CU": "CUC", "CV": "CVE", "CW": "ANG", "CX": "AUD", "CY": "EUR", "CZ": "CZK", "DE": "EUR", "DJ": "DJF", "DK": "DKK", "DM": "XCD", "DO": "DOP", "DZ": "DZD", "EC": "USD", "EE": "EUR", "EG": "EGP", "EH": "MAD", "ER": "ERN", "ES": "EUR", "ET": "ETB", "FI": "EUR", "FJ": "FJD", "FK": "FKP", "FM": "USD", "FO": "DKK", "FR": "EUR", "GA": "XAF", "GB": "GBP", "GD": "XCD", "GE": "GEL", "GF": "EUR", "GG": "GBP", "GH": "GHS", "GI": "GIP", "GL": "DKK", "GM": "GMD", "GN": "GNF", "GP": "EUR", "GQ": "XAF", "GR": "EUR", "GS": "GBP", "GT": "GTQ", "GU": "USD", "GW": "XOF", "GY": "GYD", "HK": "HKD", "HM": "AUD", "HN": "HNL", "HR": "HRK", "HT": "HTG", "HU": "HUF", "ID": "IDR", "IE": "EUR", "IL": "ILS", "IM": "GBP", "IN": "INR", "IO": "USD", "IQ": "IQD", "IR": "IRR", "IS": "ISK", "IT": "EUR", "JE": "GBP", "JM": "JMD", "JO": "JOD", "JP": "JPY", "KE": "KES", "KG": "KGS", "KH": "KHR", "KI": "AUD", "KM": "KMF", "KN": "XCD", "KP": "KPW", "KR": "KRW", "KW": "KWD", "KY": "KYD", "KZ": "KZT", "LA": "LAK", "LB": "LBP", "LC": "XCD", "LI": "CHF", "LK": "LKR", "LR": "LRD", "LS": "LSL", "LT": "LTL", "LU": "EUR", "LV": "EUR", "LY": "LYD", "MA": "MAD", "MC": "EUR", "MD": "MDL", "ME": "EUR", "MF": "EUR", "MG": "MGA", "MH": "USD", "MK": "MKD", "ML": "XOF", "MM": "MMK", "MN": "MNT", "MO": "MOP", "MP": "USD", "MQ": "EUR", "MR": "MRO", "MS": "XCD", "MT": "EUR", "MU": "MUR", "MV": "MVR", "MW": "MWK", "MX": "MXN", "MY": "MYR", "MZ": "MZN", "NA": "NAD", "NC": "XPF", "NE": "XOF", "NF": "AUD", "NG": "NGN", "NI": "NIO", "NL": "EUR", "NO": "NOK", "NP": "NPR", "NR": "AUD", "NU": "NZD", "NZ": "NZD", "OM": "OMR", "PA": "USD", "PE": "PEN", "PF": "XPF", "PG": "PGK", "PH": "PHP", "PK": "PKR", "PL": "PLN", "PM": "EUR", "PN": "NZD", "PR": "USD", "PS": "ILS", "PT": "EUR", "PW": "USD", "PY": "PYG", "QA": "QAR", "RE": "EUR", "RO": "RON", "RS": "RSD", "RU": "RUB", "RW": "RWF", "SA": "SAR", "SB": "SBD", "SC": "SCR", "SD": "SDG", "SE": "SEK", "SG": "SGD", "SH": "SHP", "SI": "EUR", "SJ": "NOK", "SK": "EUR", "SL": "SLL", "SM": "EUR", "SN": "XOF", "SO": "SOS", "SR": "SRD", "SS": "SSP", "ST": "STD", "SV": "USD", "SX": "ANG", "SY": "SYP", "SZ": "SZL", "TC": "USD", "TD": "XAF", "TF": "EUR", "TG": "XOF", "TH": "THB", "TJ": "TJS", "TK": "NZD", "TL": "USD", "TM": "TMT", "TN": "TND", "TO": "TOP", "TR": "TRY", "TT": "TTD", "TV": "AUD", "TW": "TWD", "TZ": "TZS", "UA": "UAH", "UG": "UGX", "UM": "USD", "US": "USD", "UY": "UYU", "UZ": "UZS", "VA": "EUR", "VC": "XCD", "VE": "VEF", "VG": "USD", "VI": "USD", "VN": "VND", "VU": "VUV", "WF": "XPF", "WS": "WST", "XK": "EUR", "YE": "YER", "YT": "EUR", "ZA": "ZAR", "ZM": "ZMK", "ZW": "ZWL"};
    
     $.getJSON("https://members.shoptimized.net/api/geo-ip/info.json", function(data){
      var resp = data.result.data.country.iso_code;
      var resp1 = data.result.data.country.names.en;
      var countryCode = resp.toLowerCase();
    
      var countryName = resp1;
      if (countryName == 'United States')
        countryName = 'The United States';
     
    var d = new Date();
      var weekday = new Array(7);
weekday[0] =  "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";
    var n = weekday[d.getDay()];
     $('#DCTime').html(n);
    
      $('.flagImg').html('<i class="flag-icon flag-icon-'+countryCode+'"></i>');
      $('.countryName').text(countryName);
      var countryCurrency = countriesWithCurrency[countryCode.toUpperCase()];
      var supported_currencies = 'USD JPY CAD INR GBP EUR AUD';
      supported_currencies = supported_currencies.split(' ');
      
      if(countryCurrency != "" && countryCurrency != null && countryCurrency != undefined){
     
       if(jQuery.inArray(countryCurrency, supported_currencies) !== -1) {
         if ($.cookie('currencynewcookie')) {
           jQuery('[name=currencies]').val($.cookie("currencynewcookie")).change();
          jQuery('.selectedvalue').text($.cookie("currencynewcookie"));
         }
         else{
          jQuery('[name=currencies]').val(countryCurrency).change();
          jQuery('.selectedvalue').text(countryCurrency);
       		//alert(countryCurrency);
         }
      }
		
      }
    }, 'jsonp');
    
    
    
      var startTime = new Date();
      var endTime = new Date(startTime.getFullYear()+"/"+(startTime.getMonth()+1)+"/"+startTime.getDate()+' 16:00:00');
      var timer_time = Math.round((endTime - startTime) / 60000);

      var tomorrow = new Date();
      var date_one_days = $(".date_one_ship").data("date");
      //tomorrow.setDate(tomorrow.getDate() + $(".date_one_ship").data("date"));
      if(timer_time <= 0){
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      var excludeDays = "SUN";
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
      var count_one = 0;
      do {
        tomorrow.setDate(tomorrow.getDate() + 1);
        if($.inArray(tomorrow.getDay(), excludeDays) <= -1){
          count_one++;
        }
      } while($.inArray(tomorrow.getDay(), excludeDays) > -1 || count_one < date_one_days);
      var fmt = new DateFmt();
      $(".date_one_ship").html(fmt.format(tomorrow,"%w %n %d"));
    
      var tomorrow2 = new Date();
      if(timer_time <= 0){
        tomorrow2.setDate(tomorrow2.getDate() + 1);
      }
      //tomorrow2.setDate(tomorrow2.getDate() + $(".date_two_ship").data("date"));
      var date_two_days = $(".date_two_ship").data("date");
      var count_two = 0;
      do {
        tomorrow2.setDate(tomorrow2.getDate() + 1);
        if($.inArray(tomorrow2.getDay(), excludeDays) <= -1){
          count_two++;
        }
      } while($.inArray(tomorrow2.getDay(), excludeDays) > -1 || count_two < date_two_days);
      var fmt = new DateFmt();
      $(".date_two_ship").html(fmt.format(tomorrow2,"%w %n %d"));
    
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
        
         
        
           
          
       
           
          
       
        
   
        
        
        
          window.location.href = "/checkout";
        
        
           
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
      moneyFormat        : '$',
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

      // Modifying text and classes of ATC button
      $addToCart.removeClass('is-added').addClass('is-adding');
      
        $addToCart.find('span#AddToCartText').html('Adding to cart ...');
      

      // Remove any previous quantity errors
      $('.qty-error').remove();
      ShopifyAPI.addItemFromForm(evt.target, itemAddedCallback, itemErrorCallback, settings.isProduct);
    });
  };

  itemAddedCallback = function (product) {
    // Modifying text and classes of ATC button
    setTimeout(function () {
      $addToCart.removeClass('is-adding').addClass('is-added');
      
        $addToCart.find('span#AddToCartText').html('Item Added to Cart');
      
    }, 1000);

    setTimeout(function () {
      $addToCart.removeClass('is-adding is-added');
      
        $addToCart.find('span#AddToCartText').html('Add to Cart');
      
    }, 2000);

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
      $cartContainer.append('<p>' + "Your Cart is Empty." + '</p>');
      cartCallback(cart);
      jQuery('.AddToCart_hide_button').show();
          jQuery('.AddToCart_show_button').hide();
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
      totalCartDiscount: cart.total_discount === 0 ? 0 : "You're saving [savings]".replace('[savings]', Shopify.formatMoney(cart.total_discount, settings.moneyFormat)),
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
    
    $body.on('click', '.ajaxcart_remove', function(e){
      e.preventDefault();
      var line = $(this).data('line');
      updateQuantity(line, 0);
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

var free_shipping = '$99';
 

var national_country = 'USD';
var national_country = national_country.split(",");

var national_shipping = '$49'; 
var international_shipping =  '$99';

/*$.get("https://geoip-db.com/json/", function (response) {
    var currentcountry = response.country_code;
    var res = national_country.indexOf(currentcountry);
    if (res > 0) {
        var text = $('.shipping_bar p').html();
        text = text.replace('$x', national_shipping);
        $('.shipping_bar p').html(text);
       var textm = $('.mshop').html();
      if(textm != undefined){
        textm = textm.replace('$x', national_shipping);
        $('.mshop').html(textm);
      }
        free_shipping = national_shipping;
    } else {
        var text = $('.shipping_bar p').html();
        text = text.replace('$x', international_shipping);
        $('.shipping_bar p').html(text);
       var textm = $('.mshop').html();
      if(textm != undefined){
        textm = textm.replace('$x', international_shipping);
        $('.mshop').html(textm);
      }
        free_shipping = international_shipping;
    }

}, "jsonp");*/
 
$.ajax({
  url: "https://members.shoptimized.net/api/geo-ip/info.json",
  jsonpCallback: "callback",
  dataType: "json",
  success: function(response) {
     
      var resp = response.result.data.country.iso_code;
      var resp1 = response.result.data.country.names.en;
      var countryCode = resp.toLowerCase();
    var currentcountry = response.result.data.country.iso_code;
    var res = national_country.indexOf(currentcountry);
      
    if (res >= 0) {
      var text = $('.shipping_bar p').html();
      text = text.replace('$x', national_shipping);
      $('.shipping_bar p').html(text);
      var textm = $('.mshop').html();
      if(textm != undefined){
        textm = textm.replace('$x', national_shipping);
        $('.mshop').html(textm);
      }
      free_shipping = national_shipping;
    } else {
      var text = $('.shipping_bar p').html();
      text = text.replace('$x', international_shipping);
      $('.shipping_bar p').html(text);
      var textm = $('.mshop').html();
      if(textm != undefined){
        textm = textm.replace('$x', international_shipping);
        $('.mshop').html(textm);
      }
      free_shipping = international_shipping;
    }
  }
});
  
 
$('.button_text').click(function(){
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($("#coupan_code").val()).select();
  document.execCommand("copy");
  $temp.remove();
  $(this).html('Copied');
}); 
$('.button_copy_code').click(function(){
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($("#coupan_code_copy").text()).select();
  document.execCommand("copy");
  $temp.remove();
  $(this).html('Copied');
}); 


  
      $(window).on('load', function() { // makes sure the whole site is loaded 
        $('#preloader').delay(250).fadeOut('slow'); // will fade out the white DIV that covers the website. 
        $('body').delay(250).css({'overflow':'visible'});
      })
      
        $(document).ready(function () {
     
   var i =0;
  var j =0;
  var k =0, l=0;
    var m=0;      
  calculateheight(i, k, l);
  calHeight(i);
    calHeightcart(m);      
  $(window).resize(function() {
    console.log('hello');
    var i=0;
    var j=0, k=0, l=0;
        var m=0;
    calHeight(i);
      calHeightcart(m);  
    //calculateheight(i, k, l);
  });
  
  

      $('.collapse ul').find('.color-filters').each(function(){
        var $this = $(this);
        var Color = $this.find('a').text();
        $this.find('a').css('background-color', Color);
      });

        $('ul.accordion').accordion();
          
          $('.menu-dropdown-icon').hover(function(){
              $(this).addClass('slide');
          });

        $('.menu-dropdown-icon').mouseleave(function(){
          $(this).removeClass('slide');
      });
      
      $('.banner-slider').each(function(){
        var isMulti = ($(this).find('.item').length > 1) ? true : false;
        var myspeed = $(this).data('speed');
        $(this).owlCarousel({
          nav:isMulti,
          dots:true,
          autoplay:true,
          autoplayTimeout:myspeed,
          loop:isMulti,
          navText:["<span class='fa fa-angle-left'></span>", "<span class='fa fa-angle-right'></span>"],
          responsive:{
            0:{
              items:1,
            },
            640:{
              items:1,
            },
            1000:{
              items:1
            }
          }
        });
      });
         
      $('.mobile-banner-slider').each(function(){
        var isMultim = ($(this).find('.item').length > 1) ? true : false;
        var myspeed = 4000;
        $(this).owlCarousel({
          nav:isMultim,
          dots:true,
          autoplay:true,
          autoplayTimeout:myspeed,
          loop:isMultim,
          navText:["<span class='fa fa-angle-left'></span>", "<span class='fa fa-angle-right'></span>"],
          responsive:{
            0:{
              items:1,
            },
            640:{
              items:1,
            },
            1000:{
              items:1
            }
          }
        });
      });

      $('.collection_slide').owlCarousel({
        nav:true,
        dots:false,
        margin:28,
        loop:true,
        navText:["<span class='fa fa-angle-left'></span>", "<span class='fa fa-angle-right'></span>"],
        responsive:{
          0:{
            items:2,
            slideBy: 2
          },
          1000:{
            items:3,
            slideBy: 3
          }
        }
      })

      $('.category_wrap.homaa').owlCarousel({
        nav:true,
        dots:false,
        loop:true,
        navText:["<span class='fa fa-angle-left'></span>", "<span class='fa fa-angle-right'></span>"],
        center: false,
        responsive:{
          0:{
            items:2,
            slideBy: 2
          },
          1000:{
            items:5,
            slideBy: 5
          }
        }
      });
	  
           $('.category_wrap.homaa').each(function(){
            var viewport = $(window).width();
            var itemCount = $(this).children('.owl-stage-outer').children('.owl-stage').find('div').length;
            if((viewport >= 1000 && itemCount > 5) || (viewport <= 999 && itemCount > 2)) {
              $(this).find('.owl-controls').show();
            } else {
              
              $(this).find('.owl-controls').hide();
            } 
            var totalItems_wrap = $(this).children('.owl-stage-outer').children('.owl-stage').find('.grid__item').length;
             if (totalItems_wrap < 5) {
                var isLoopedcat_second_h = false;
				var isNavCat_second_h = false;
                $(this).find('.owl-controls').hide();
               } 
              else {
                var isLoopedcat_second_h = true;
                var isNavCat_second_h = true;
                $(this).find('.owl-controls').show();
               }
           
          });
          $( window ).resize(function() {
           
            $('.category_wrap.homaa').each(function(){
            var viewport = $(window).width();
            var totalItems_wrap1 = $(this).children('.owl-stage-outer').children('.owl-stage').find('.grid__item').length;
            
              if ((viewport >= 1000 && totalItems_wrap1 > 5) || (viewport <= 999 && totalItems_wrap1 > 2)) {
                $(this).find('.owl-controls').hide();
                
                $('.category_wrap.homaa').owlCarousel({
                  nav:true,
                  loop:true 
                });  
              } 
              else {
               $('.category_wrap.homaa').owlCarousel({
                  nav:false,
                  loop:false 
                }); 
                
               }
           
          });
		  });
   
      $('.testimonial_wrap').owlCarousel({
        nav:true,
        dots:false,
        margin:29,
        loop:true,
        slideBy:3,
        mouseDrag:false,
        navText:["<span class='fa fa-angle-left'></span>", "<span class='fa fa-angle-right'></span>"],
        responsive:{
          0:{
            items:1,
            margin:5,
            autoHeight:true,
            nav:true,
            mouseDrag:true,
            slideBy:1
          },
          640:{
            items:2,
            margin:15,
            nav:true,
            mouseDrag:true,
            slideBy:2
          },
          1000:{
            items:3
          }
        }
      });

//        $('.testimonial_wrap').each(function(){
//             var viewport = $(window).width();
//             var itemCount = $(this).children('.owl-stage-outer').children('.owl-stage').find('div').length;
           
//             if((viewport >= 1000 && itemCount >= 3) || (viewport <= 999 && itemCount > 2)) {
//               $(this).find('.owl-controls').show();
//             } else {
              
//               $(this).find('.owl-controls').hide();
//             } 
//             var totalItems_wrap = $(this).children('.owl-stage-outer').children('.owl-stage').find('.owl-item').length;
//              var totalItems_wrap_cloned = $(this).children('.owl-stage-outer').children('.owl-stage').find('.owl-item.cloned').length;
//             totalItems_wrap=totalItems_wrap - totalItems_wrap_cloned;
// 			if (totalItems_wrap <= 3) {
//               $(this).find('.owl-controls').hide();
                
//                } 
//               else {
             
//                $(this).find('.owl-controls').show();
                 
//                }
           
//           });

            $(document).ready(function () {
                var expire_in_days = 2 || 3;
                if (timber.getCookie('form_submited') == 'yes') {
                  $('.top_bar_save').show();
                  $(".header-space").addClass("morespace");
                  $(".cart.nm").addClass("morespaceincarticon");

                }

                if ($('.product-single__thumbnails li a').length < 5) {
                    $('.product-single__thumbnails li a').css('min-height', '118px')
                }


                $(document).on('click', '.footer-newsletter .btn-success', function (e) {
                    timber.setCookie('form_submited', 'yes', expire_in_days);
                });


                $(document).on('change', '.related-popup-variant', function (e) {
                    var selected = $(this).val();
					var img = $('option:selected', this).data('img');
                  var myprice = $('option:selected', this).data('myprice');
                    if(img != ""){
                      $(this).parent().find('.variant_img').attr('src', img);
                    }
                    $(this).parent().find('.related-popup-add-to-cart').attr('data-variant', selected);

                  $(this).parent().find('.corsssellprice').html("<span class='money'>" +myprice+ "</span>");
                    
          var cookieCurrency = Currency.cookie.read();
          if (window.money_default !== cookieCurrency && cookieCurrency != "" && cookieCurrency != null) {
            Currency.convertAll(window.money_default, cookieCurrency);
          }
        
                });

                if ($(document).width() < 768) {

                    //Zoom fix start
                    window.onpopstate = function (event) {
                        MagicZoom.stop();
                        MagicZoom.start();
                    }
                    mzOptions = {
                        onZoomIn: function () {
                            // window.location.hash = 'zoom';
                            history.pushState({what: 'zoomin'}, '', window.location + '#zoom');
                        },
                        onZoomOut: function () {
                            window.location.hash = '';
                        },
                        onExpandOpen: function() {
                            history.pushState({what: 'zoomin'}, '', window.location + '#zoom');
                        },
                        onExpandClose: function() {
                            window.location.hash = '';
                        }
                    };
                }

                $('.filter-mobile a').click(function(){
                    $('.mobile-sort').removeClass('visible');
                    $('.sidebar_wrap').toggleClass('visible');
                    $('.filters-container').css('z-index', '999')
                });

                $('.mobile-sort-btn a').click(function(){
                    $('.sidebar_wrap').removeClass('visible');
                    $('.mobile-sort').toggleClass('visible');
                    $('.filters-container').css('z-index', '0')
                });
            });


            //Zoom fix end

      $('.equal').matchHeight();
      $('.collection_imga').each(function(){
        $(this).find('img').hide();
        var _Bg = 'url('+ $(this).find('img').attr('src') + ')';
        $(this).css("background-image", _Bg);
        $(this).find('img').hide();
      });
      $('.collection_imgs').each(function(){
        $(this).find('img').hide();
        var _Bg = 'url('+ $(this).find('img').attr('src') + ')';
        $(this).css("background-image", _Bg);
        $(this).find('img').hide();
      });
          
          $('.collection_slidee .item a').each(function(){
        $(this).find('img').hide();
        var _Bg = 'url('+ $(this).find('img').attr('src') + ')';
        $(this).css("background-image", _Bg);
        $(this).find('img').hide();
      }); 
          
      
          if($(document).scrollTop() > 100){
            $("header.header").addClass("shrink");
            $("main.main-content").css("padding-top", $("header.header").height());
          } else {
            if($(document).scrollTop() == 0){
              $("header.header").removeClass("shrink");
              $("main.main-content").css("padding-top", "10px");
            }
          }
        $(document).on("scroll", function(){
          if($(document).scrollTop() > 100){
            $("header.header").addClass("shrink");
            $("main.main-content").css("padding-top", $("header.header").height());
          } else {
            if($(document).scrollTop() == 0){
              $("header.header").removeClass("shrink");
              $("main.main-content").css("padding-top", "10px");
            }
          }
        });
      
      $('.mega_Wrap').perfectScrollbar({
        suppressScrollX:true,
      });
    
     var md = new MobileDetect(window.navigator.userAgent);
     if ((md.mobile() != null) || (md.tablet() != null)) {
        jQuery('.menu-open').attr("href", "javascript:;");
       $('.menu-dropdown-icon').click(function(){
              $(this).toggleClass('slide');
         });
//         $(document).ready(function(){"use strict";$(".menu > ul > li:has( > ul)").addClass("menu-dropdown-icon"),$(".menu > ul > li > ul:not(:has(ul))").addClass("normal-sub"),$(".menu > ul").before('<a href="#" class="menu-mobile">Navigation</a>'),$(".menu > ul > li").click(function(l){$(window).width()>320&&($(this).children("ul").stop(!0,!1).slideToggle(350),l.preventDefault())}),$(".menu > ul > li").click(function(){$(window).width()<=320&&$(this).children("ul").slideToggle(350)}),$(".menu-mobile").click(function(l){$(".menu > ul").toggleClass("show-on-mobile"),l.preventDefault()})});
      }
              });
     
      function calculateheight(i, k, l){
  

 var divHeight = [], divHeight_home = [], divHeight_home_fcoll =[];
 var divheightMax, divheightHomeMax, divheightHomeFcollMax;
  jQuery('.recently--viewed-products #recently-viewed-products .grid__item').attr('style', "");
  jQuery('#shopify-section-1512472949407 .homaa .grid__item').attr('style', "");
  jQuery('#shopify-section-1512473088967 .homaa .grid__item').attr('style', "");
  
//  jQuery('.releted--products .carousel-product .grid__item').attr('style', "");
 
 setTimeout(function(){  
  
  $('.recently--viewed-products #recently-viewed-products .grid__item').each(function(){
    
      divHeight[i++] = $(this).height();
  // alert(divHeight);
    
  });
  var divheightMax = Math.max.apply(Math,divHeight);
  
  if(divheightMax != ''){
    $('.recently--viewed-products #recently-viewed-products .grid__item').each(function(){
        jQuery(this).attr('style', "height: "+divheightMax+"px;");
      
    });
   }
   
   $('#shopify-section-1512472949407 .homaa .grid__item').each(function(){ 
      divHeight_home[k++] = $(this).height(); 
  });
   
  var divheightHomeMax = Math.max.apply(Math,divHeight_home);
  
  if(divheightHomeMax != ''){
    $('#shopify-section-1512472949407 .homaa .grid__item').each(function(){
        jQuery(this).attr('style', "height: "+divheightHomeMax+"px;");
      
    });
   }
   
    $('#shopify-section-1512473088967 .homaa .grid__item').each(function(){
    
      divHeight_home_fcoll[l++] = $(this).height();
   //alert(divHeight);
    
  });
  var divheightHomeFcollMax = Math.max.apply(Math,divHeight_home_fcoll);
  
  if(divheightHomeFcollMax != ''){
    $('#shopify-section-1512473088967 .homaa .grid__item').each(function(){
        jQuery(this).attr('style', "height: "+divheightHomeFcollMax+"px;");
      
    });
   }
   
 
 }, 2000);
 
}

function calHeight(i){
  //var j=j;
  
 var divProductHeight = [];
 var divProductHeightMax;
  
  jQuery('.releted--products .carousel-product .grid__item').attr('style', "");
  
 
 setTimeout(function(){  
  
   $('.releted--products .carousel-product .grid__item').each(function(){
    //debugger
      divProductHeight[i++] = $(this).height();
   //alert(divHeight);
    
  });
   
  var divProductHeightMax = Math.max.apply(Math,divProductHeight);
  
  if(divProductHeightMax != ''){
    $('.releted--products .carousel-product .grid__item').each(function(){
       jQuery(this).attr('style', "height: "+divProductHeightMax+"px;");
      
    });
        
   }
   
 
 }, 3000);
}
function calHeightcart(m){
  //var j=j;
  
 var divProductHeightcart = [];
 var divProductHeightMaxcart;
  
  
  jQuery('.cart__row__related .grid__item').attr('style', "");
 
 setTimeout(function(){  
  
   $('.cart__row__related .grid__item').each(function(){
    //debugger
      divProductHeightcart[m++] = $(this).height();
   //alert(divHeight);
    
  });
  var divProductHeightMaxcart = Math.max.apply(Math,divProductHeightcart);
  
  if(divProductHeightMaxcart != ''){
    
        $('.cart__row__related .grid__item').each(function(){
      //  jQuery(this).attr('style', "height: "+divProductHeightMaxcart+"px;");
      
    });
   }
    
 }, 2000);
}
      $(document).ready(function(){
        //$(".category_wrap").find(".active:last-child").css({"border": "none !important"});
     
    });
      
      $(document).on("scroll", function(){
        if($(document).scrollTop() > 50 ){
          $(".titlecol").addClass("fix-cart-header");
        }
        else
        {
             $(".titlecol").removeClass("fix-cart-header");

        }
    });
      
      
(function() {
  
  $(".panel").on("show.bs.collapse hide.bs.collapse", function(e) {
    if (e.type=='show'){
      $(this).addClass('active');
    }else{
      $(this).removeClass('active');
    }
  });  

}).call(this);
      
  $(document).ready(function () {
    var ReleaseSlider = $('.category_wrap_collection');
    ReleaseSlider.find('.slide-new').removeClass('col-sm-4');
    ReleaseSlider.find('.slide-new').each(function(){
      $(this).wrap('<div class="item"></div>');
    });
    $('.category_wrap_collection').owlCarousel({
      nav: true,
      dots: false,
       
      navText:['<span class="fa fa-angle-left"></span>', '<span class="fa fa-angle-right"></></span>'],
      loop: false,
      responsive:{
        0:{
          items:2,
          slideBy: 2
        },
        768:{
          items:5,
          slideBy: 5
        }
      }
    });
    
    var viewport = $(window).width();
    var itemCount = $('.category_wrap_collection .owl-stage-outer .owl-stage > div').length;
    if((viewport >= 768 && itemCount > 5) || (viewport <= 767 && itemCount > 2)) {
      $('.category_wrap_collection .owl-controls').show();
    } else {
      $('.category_wrap_collection .owl-controls').hide();
    }
    $( window ).resize(function() {
      var viewport = $(window).width();
      var itemCount = $('.category_wrap_collection .owl-stage-outer .owl-stage > div').length;
      if((viewport >= 768 && itemCount > 5) || (viewport <= 767 && itemCount > 2)) {
        $('.category_wrap_collection .owl-controls').show();
      } else {
        $('.category_wrap_collection .owl-controls').hide();
      }
      $('.category_wrap.homaa').each(function(){
        var viewport = $(window).width();
        var itemCount = $(this).children('.owl-stage-outer').children('.owl-stage').find('div').length;
        if((viewport >= 1000 && itemCount > 5) || (viewport <= 999 && itemCount > 2)) {
          $(this).find('.owl-controls').show();
        } else {
          $(this).find('.owl-controls').hide();
        }
      });
    });
  });
var valueofstrange = 1;


$(document).ready(function() {
  
  $("#code_div").append('WOW0821240209BLCLJLLLML');
  if (!$.cookie('popupcookie')){
    
  } else {
    timber.bodySaveBar();
  }
  showEntryPopup();
});
  
  
  
   if (valueofstrange == 1)
    {
  function showEntryPopup() {
    
  if (!$.cookie('popuppurcookie') && !$.cookie('popupcookie')){
    
  } else {
    timber.bodySaveBar();
  }
}
  }
  
  
  
  
$(function() {
  //$('nav#menu').mmenu();
  $("nav#menu").mmenu({}, {
    classNames: {
      fixedElements: {
        fixed: "fix"
      }
    }
  });
  var API = $("nav#menu").data( "mmenu" );
  $("#mmmenu-close-button").click(function() {
    API.close();
  });
});
      $('.cart').click(function () {
        $('.cart-item').slideDown("300");
      });
      $('.cart').mouseleave(function(){
        $('.cart-item').hide();
      });
      
//       $(function() {
//         $('#searchlink').click(function(){
//           $('.search_panel').slideDown();
//         })
//         $('.search-close').click(function(){
//           $(this).parent().slideUp();
//         })
//       });

  $(function() {

  $('#searchlink').on('click', function(e){

      if($('.search_panel').hasClass('searchdown')) {
         $('.search_panel').removeClass('searchdown');
      } else {
        $('.search_panel').addClass('searchdown');
      }
    
  });
});
  
      
      
      timber.geoIP();
      
      timber.progressStriped();
      
      jQuery(function($) {
        timber.estimateTimer();
      });
      

  
    //Slider Control
jQuery(document).ready(function(){
    
//smooth scrolling

    $('.go-top').on('click',function (e) {
        e.preventDefault();
        var target =  $('#top'),
            $target = $(target);
        $('html, body').stop().animate({
            'scrollTop': $target.offset().top
        }, 700, 'swing', function () {
             
        });
    });
    
// Back to Top
    // Show or hide the sticky footer button
      $(window).scroll(function() {
        if ($(this).scrollTop() > 200) {
          if ($('.fix-cart').length && $('.fix-cart').hasClass('cart-bar')) {
            $('.go-top').css('bottom', '8em')
          } else {
            $('.go-top').css('bottom', '4em')
          }
          $('.go-top').fadeIn(200);
        } else {
          $('.go-top').fadeOut(200);
        }
      });
  
    // Animate the scroll to top
      $('.go-top').click(function(event) {
        event.preventDefault();
        $('html, body').animate({scrollTop: 0}, 700);
      });

});

  function hide_goods_in_cart (){
    $.getJSON('/cart.js', function (cart, textStatus) {
      //Setup free shipping header
      var product_ids_in_cart = [];
      $.each(cart.items, function(k, v) {
        product_ids_in_cart[k] = v.id;
      });

      $.each($('.r_addtocartbutton button'), function(k, v) {
        var btn = $(this);
        $.each(product_ids_in_cart, function (x, y) {
          if ($(v).attr('onclick').indexOf(y) != -1) {
            btn.attr('disabled', 'disabled' ).find('.r_AddToCartText').text('In cart').css('color', '#b4d641');
                                                                                           }
                                                                                           });
          });



        });
      }


      
   if($(window).width() < 767){    
$(".main-content").on('click',':not(.header-search)', function (e) {
     //e.stopPropagation();
//      $('.search_panel').css('display','none');
  $('.search_panel').removeClass('searchdown');
   //alert('hey');
});
   }
      
      
      function DropDown(el) {
        this.dd = el;
        this.placeholder = this.dd.children('span');
        this.opts = this.dd.find('ul.list > li');
        this.val = '';
        this.index = -1;
        this.initEvents();
      }
      DropDown.prototype = {
        initEvents : function() {
          var obj = this;

          obj.dd.on('click', function(event){
            $(this).toggleClass('open');
            return false;
          });

          obj.opts.on('click',function(){
            var opt = $(this);
            obj.val = opt.html();
            obj.index = opt.index();
            obj.placeholder.html(obj.val);
          });
        },
        getValue : function() {
          return this.val;
        },
        getIndex : function() {
          return this.index;
        }
      }

      $(function() {
          var dd = new DropDown( $('.dd-form') );

        $(document).click(function() {
          $('.slim').removeClass('open');
        });

      });

    
     $('.slide-new').matchHeight();
      
     setTimeout(function(){
      //$('.category_wrap .owl-item').matchHeight();
       }, 1000);
      
      setInterval(function(){
       
       // $.fn.matchHeight._update()
      },500);
    
  
      
$(document).ready(function(){
  $(".panel-group").click(function(){
    if($(this).find('.panel').hasClass('active')){
      var $this = $(this);
      setTimeout(function(){
        $('html, body').animate({
          scrollTop: ($this.offset().top - 150)
        }, 200);
      }, 500);
    }
  });
});

      jQuery(document).ready(function(){
        free_shipping_update();
        
          $('.sticky_bar').css("visibility", "visible");
        
      });
      function free_shipping_update() {
        
          $.getJSON('/cart.js', function (cart, textStatus) {
            var header_related_msg = $('#related_shipping_msg').html();
            var header_related_msg_free = $('#related_free_shipping_msg').html();

            var strip_bar_msg = $('#top_strip_shipping_msg').html();
            //var strip_bar_msg_free = $('#top_strip_free_shipping_msg').html();

            var product_page_msg = $('#product_page_msg').html();
            //var product_page_msg_free = $('#product_page_msg_free').html();

            var sticky_bar_msg = $('#sticky_bar_shipping_msg').html();
            var sticky_bar_msg_free = $('#sticky_bar_free_shipping_msg').html();

            var common_bar_msg = $('#common_shipping_msg').html();
            var common_bar_msg_free = $('#common_free_shipping_msg').html();

            var popup_model_bar_msg = $('#popup_model_shipping_msg').html();
            var popup_model_msg_free = $('#popup_model_free_shipping_msg').html();

             var mobile_bar_bar_msg = $('#mobile_bar_shipping_msg').html();
            var mobile_bar_msg_free = $('#mobile_bar_free_shipping_msg').html();


            var total_price = Shopify.formatMoney(cart.total_price, window.money_format);

            var money_symbol_free = free_shipping.charAt(0);
            var money_symbol_total = total_price.charAt(0);

            if(money_symbol_free == "D"){
              money_symbol_free = "Dhs.";
            }
            if(money_symbol_total == "D"){
              money_symbol_total = "Dhs.";
            }
            free_shipping = free_shipping.replace(',', '');
            total_price = total_price.replace(',', '');

            if(header_related_msg != "" && header_related_msg != undefined){
              if (Number.parseFloat(total_price.replace(money_symbol_total, '')) >= Number.parseFloat(free_shipping.replace(money_symbol_free, ''))) {
                $(".related_free_shipping_text").html(header_related_msg_free);
              } else {
                var shipping = Number.parseFloat(free_shipping.replace(money_symbol_free, '')) - Number.parseFloat(total_price.replace(money_symbol_total, ''));
                var formated = Shopify.formatMoney((shipping*100));
                $(".related_free_shipping_text").html(header_related_msg.replace('XX', formated).replace('$$', formated).replace('$x', formated).replace('$X', formated));
              }
            }

            if(strip_bar_msg != "" && strip_bar_msg != undefined){
              if (Number.parseFloat(total_price.replace(money_symbol_total, '')) >= Number.parseFloat(free_shipping.replace(money_symbol_free, ''))) {
                //$(".free_shipping_top_strip").html(common_bar_msg_free);
                
                  $(".free_shipping_top_strip").html(common_bar_msg_free);
                  $(".shipping_bar").find('.countryName').css('opacity', '0');
                  $(".shipping_bar").find('.flagImg').css('opacity', '0');
                
              } else {
                var shipping = Number.parseFloat(free_shipping.replace(money_symbol_free, '')) - Number.parseFloat(total_price.replace(money_symbol_total, ''));
                var formated = Shopify.formatMoney((shipping*100));
                $(".free_shipping_top_strip").html(strip_bar_msg.replace('XX', formated).replace('$$', formated).replace('$x', formated).replace('$X', formated));
                $(".shipping_bar").find('.countryName').css('opacity', '1');
                $(".shipping_bar").find('.flagImg').css('opacity', '1');
              }
            }

            if(product_page_msg != "" && product_page_msg != undefined){
              if (Number.parseFloat(total_price.replace(money_symbol_total, '')) >= Number.parseFloat(free_shipping.replace(money_symbol_free, ''))) {
                
                  $("#free_shipping_product_page").html(common_bar_msg_free);
                  $(".motivator--text").find('.countryName').css('opacity', '0');
                  $(".motivator--text").find('.flagImg').css('opacity', '0');
                
              } else {
                var shipping = Number.parseFloat(free_shipping.replace(money_symbol_free, '')) - Number.parseFloat(total_price.replace(money_symbol_total, ''));
                var formated = Shopify.formatMoney((shipping*100));
                $("#free_shipping_product_page").html(product_page_msg.replace('XX', formated).replace('$$', formated).replace('$x', formated).replace('$X', formated));
                $(".motivator--text").find('.countryName').css('opacity', '1');
                $(".motivator--text").find('.flagImg').css('opacity', '1');
              }
            }

            if(sticky_bar_msg != "" && sticky_bar_msg != undefined){
              if (Number.parseFloat(total_price.replace(money_symbol_total, '')) >= Number.parseFloat(free_shipping.replace(money_symbol_free, ''))) {
                $(".sticky_bar_text").html(sticky_bar_msg_free);
                $(".sticky_bar_timer").hide();
              } else {
                var shipping = Number.parseFloat(free_shipping.replace(money_symbol_free, '')) - Number.parseFloat(total_price.replace(money_symbol_total, ''));
                var formated = Shopify.formatMoney((shipping*100));
                $(".sticky_bar_text").html(sticky_bar_msg.replace('XX', formated).replace('$$', formated).replace('$x', formated).replace('$X', formated));
                $(".sticky_bar_timer").show();
              }
            }

            if(common_bar_msg != "" && common_bar_msg != undefined){
              if (Number.parseFloat(total_price.replace(money_symbol_total, '')) >= Number.parseFloat(free_shipping.replace(money_symbol_free, ''))) {
                $(".common_shipping_text").html(common_bar_msg_free);
              } else {
                var shipping = Number.parseFloat(free_shipping.replace(money_symbol_free, '')) - Number.parseFloat(total_price.replace(money_symbol_total, ''));
                var formated = Shopify.formatMoney((shipping*100));
                $(".common_shipping_text").html(common_bar_msg.replace('XX', formated).replace('$$', formated).replace('$x', formated).replace('$X', formated));
              }
            }


             if(popup_model_bar_msg != "" && popup_model_bar_msg != undefined){
              if (Number.parseFloat(total_price.replace(money_symbol_total, '')) >= Number.parseFloat(free_shipping.replace(money_symbol_free, ''))) {
                $(".popup_model_shipping_text").html(common_bar_msg_free);
              } else {
                var shipping = Number.parseFloat(free_shipping.replace(money_symbol_free, '')) - Number.parseFloat(total_price.replace(money_symbol_total, ''));
                var formated = Shopify.formatMoney((shipping*100));
                $(".popup_model_shipping_text").html(common_bar_msg.replace('XX', formated).replace('$$', formated).replace('$x', formated).replace('$X', formated));
              }
            }


             if(mobile_bar_bar_msg != "" && mobile_bar_bar_msg != undefined){
              if (Number.parseFloat(total_price.replace(money_symbol_total, '')) >= Number.parseFloat(free_shipping.replace(money_symbol_free, ''))) {
                $(".mobile_bar_shipping_text").html(mobile_bar_msg_free);
              } else {
                var shipping = Number.parseFloat(free_shipping.replace(money_symbol_free, '')) - Number.parseFloat(total_price.replace(money_symbol_total, ''));
                var formated = Shopify.formatMoney((shipping*100));
                $(".mobile_bar_shipping_text").html(mobile_bar_bar_msg.replace('XX', formated).replace('$$', formated).replace('$x', formated).replace('$X', formated));
              }
            }

          });
        
      }
      
      
      

     // $('.equal-line').matchHeight();
      
       document.addEventListener("DOMContentLoaded",
        function() {
            var div, n,
                v = document.getElementsByClassName("youtube-player");
            for (n = 0; n < v.length; n++) {
                div = document.createElement("div");
                div.setAttribute("data-id", v[n].dataset.id);
                div.innerHTML = labnolThumb(v[n].dataset.id);
                div.onclick = labnolIframe;
                v[n].appendChild(div);
            }
        });

    function labnolThumb(id) {
        var thumb = '<img src="https://i.ytimg.com/vi/ID/hqdefault.jpg">',
            play = '<div class="play"></div>';
        return thumb.replace("ID", id) + play;
    }

    function labnolIframe() {
        var iframe = document.createElement("iframe");
        var embed = "https://www.youtube.com/embed/ID?autoplay=1";
        iframe.setAttribute("src", embed.replace("ID", this.dataset.id));
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowfullscreen", "1");
        this.parentNode.replaceChild(iframe, this);
    }
      
       $(document).ready(function () {
      $('#currencies').selectpicker();
      
        if ($.cookie('currencynewcookie')) {
           jQuery('[name=currencies]').val($.cookie("currencynewcookie")).change();
          jQuery('.selectedvalue').text($.cookie("currencynewcookie"));
         }
    });
       $('li > a.menu-open').each(function(){
    var $this = $(this);
  	$this.hover(function(){
    	console.log('hurray');
    	$this.next('ul').find('.equal-line').matchHeight();
  	});
  });
  
  
  $(".nav-tabs a").click(function(){
     $(this).tab('show');
 });
      
      
         