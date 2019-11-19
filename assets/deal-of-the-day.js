
  if (typeof backend == 'undefined') {
    var backend = {
      shopUrl: '',
      currencyName: 'USD'
    }
  }

  var $dealOfTheDay = $('.content-deal-of-the-day');
  var $dealOfTheDayProduct = $('.deal-of-the-day-product');

  var api_endpoint = backend.shopUrl + '/products.json?limit=250';
	
  //var currentDateHours = '{{ "now" | date: "%Y-%m-%d-%H-%M-%S"}}';
    
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();

    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
  
  var currentDateHours = yyyy+'-'+mm+'-'+dd+'-'+h+'-'+m+'-'+s;
  //var currentDateHours = '2018-03-17-08-31-15';
  var s_currentDate = currentDateHours.split('-');
  var currentDate = s_currentDate[0] + '-' + s_currentDate[1] + '-' + s_currentDate[2];
  //var currentDate = '2018-03-17';
  var currencySymbols = {
    'AED': 'د.إ',
    'AFN': '؋',
    'ALL': 'L',
    'ANG': 'ƒ',
    'AOA': 'Kz',
    'ARS': '$',
    'AUD': '$',
    'AWG': 'ƒ',
    'AZN': '₼',
    'BAM': 'KM',
    'BBD': '$',
    'BDT': '৳',
    'BGN': 'лв',
    'BHD': '.د.ب',
    'BIF': 'FBu',
    'BMD': '$',
    'BND': '$',
    'BOB': 'Bs.',
    'BRL': 'R$',
    'BSD': '$',
    'BTC': '฿',
    'BTN': 'Nu.',
    'BWP': 'P',
    'BYR': 'p.',
    'BZD': 'BZ$',
    'CAD': '$',
    'CDF': 'FC',
    'CHF': 'Fr.',
    'CLP': '$',
    'CNY': '¥',
    'COP': '$',
    'CRC': '₡',
    'CUC': '$',
    'CUP': '₱',
    'CVE': '$',
    'CZK': 'Kč',
    'DJF': 'Fdj',
    'DKK': 'kr',
    'DOP': 'RD$',
    'DZD': 'دج',
    'EEK': 'kr',
    'EGP': '£',
    'ERN': 'Nfk',
    'ETB': 'Br',
    'EUR': '€',
    'FJD': '$',
    'FKP': '£',
    'GBP': '£',
    'GEL': '₾',
    'GGP': '£',
    'GHC': '₵',
    'GHS': 'GH₵',
    'GIP': '£',
    'GMD': 'D',
    'GNF': 'FG',
    'GTQ': 'Q',
    'GYD': '$',
    'HKD': '$',
    'HNL': 'L',
    'HRK': 'kn',
    'HTG': 'G',
    'HUF': 'Ft',
    'IDR': 'Rp',
    'ILS': '₪',
    'IMP': '£',
    'INR': '₹',
    'IQD': 'ع.د',
    'IRR': '﷼',
    'ISK': 'kr',
    'JEP': '£',
    'JMD': 'J$',
    'JPY': '¥',
    'KES': 'KSh',
    'KGS': 'лв',
    'KHR': '៛',
    'KMF': 'CF',
    'KPW': '₩',
    'KRW': '₩',
    'KYD': '$',
    'KZT': '₸',
    'LAK': '₭',
    'LBP': '£',
    'LKR': '₨',
    'LRD': '$',
    'LSL': 'M',
    'LTL': 'Lt',
    'LVL': 'Ls',
    'MAD': 'MAD',
    'MDL': 'lei',
    'MGA': 'Ar',
    'MKD': 'ден',
    'MMK': 'K',
    'MNT': '₮',
    'MOP': 'MOP$',
    'MUR': '₨',
    'MVR': 'Rf',
    'MWK': 'MK',
    'MXN': '$',
    'MYR': 'RM',
    'MZN': 'MT',
    'NAD': '$',
    'NGN': '₦',
    'NIO': 'C$',
    'NOK': 'kr',
    'NPR': '₨',
    'NZD': '$',
    'OMR': '﷼',
    'PAB': 'B/.',
    'PEN': 'S/.',
    'PGK': 'K',
    'PHP': '₱',
    'PKR': '₨',
    'PLN': 'zł',
    'PYG': 'Gs',
    'QAR': '﷼',
    'RMB': '￥',
    'RON': 'lei',
    'RSD': 'Дин.',
    'RUB': '₽',
    'RWF': 'R₣',
    'SAR': '﷼',
    'SBD': '$',
    'SCR': '₨',
    'SDG': 'ج.س.',
    'SEK': 'kr',
    'SGD': '$',
    'SHP': '£',
    'SLL': 'Le',
    'SOS': 'S',
    'SRD': '$',
    'SSP': '£',
    'STD': 'Db',
    'SVC': '$',
    'SYP': '£',
    'SZL': 'E',
    'THB': '฿',
    'TJS': 'SM',
    'TMT': 'T',
    'TND': 'د.ت',
    'TOP': 'T$',
    'TRL': '₤',
    'TRY': '₺',
    'TTD': 'TT$',
    'TVD': '$',
    'TWD': 'NT$',
    'TZS': 'TSh',
    'UAH': '₴',
    'UGX': 'USh',
    'USD': '$',
    'UYU': '$U',
    'UZS': 'лв',
    'VEF': 'Bs',
    'VND': '₫',
    'VUV': 'VT',
    'WST': 'WS$',
    'XAF': 'FCFA',
    'XBT': 'Ƀ',
    'XCD': '$',
    'XOF': 'CFA',
    'XPF': '₣',
    'YER': '﷼',
    'ZAR': 'R',
    'ZWD': 'Z$'
  };

  var storeCurrencySymbol = currencySymbols[backend.currencyName];

  function getShopProductsByTag(tag, callback) {
    $.get(api_endpoint, {}, function(data) {
      var empty = true;
      $.each(data.products, function(index, value) {
        //console.log(value.tags);
        if (value.tags.indexOf(tag) != -1) {
          empty = false;
          callback(value);
          return false;
        }
      });
      if (empty) {
        callback(false);
      }
    });
  }

  function addProductToLocalStorage(callback) {
    var tag = 'deal-' + currentDate;
    //look for the first product with the tag deal-yyyy-mm-dd
    getShopProductsByTag(tag, function(product) {
      if (product) {
        //console.log('Deal of the day: Product updated');
        //save in local storage or replace the current one
        localStorage.setItem("deal_of_the_day", JSON.stringify({ product: product }));
        callback();

      } else {
        //console.log('Deal of the day: No product to add');
        localStorage.removeItem("deal_of_the_day");
      }
    });
  }

  function countDownTimer(fromDate, toDate) {
    var timer;

    var slice_FromDate = fromDate.split('-');
    var slice_ToDate = toDate.split('-');

    var toDate = new Date(slice_ToDate[0], slice_ToDate[1], slice_ToDate[2], 23, 59, 59);
    var fromDate = new Date(slice_FromDate[0], slice_FromDate[1], slice_FromDate[2], slice_FromDate[3], slice_FromDate[4], slice_FromDate[5]);
    var difference = toDate.getTime() - fromDate.getTime();

    //console.log(toDate, fromDate);

    /* percent of chart */
    /* 86400000 : 1 day time stamp */
    var base = 86400000;
    var percent = 100 - difference / base * 100;
    //jQuery(".dealzone-piechart").attr("data-percent", percent);

    $dealOfTheDayProduct.find('.progress-bar > .bar').animate({ width: percent + '%' });

    timer = setInterval(function() {

      timeBetweenDates(difference);

      difference -= 1000;
    }, 1000);

  }

  function timeBetweenDates(diff) {

    if (diff <= 0) {

      // Timer done
      clearInterval(timer);

    } else {

      var seconds = Math.floor(diff / 1000);
      var minutes = Math.floor(seconds / 60);
      var hours = Math.floor(minutes / 60);

      hours %= 24;
      minutes %= 60;
      seconds %= 60;

      var remain_time = new Date(0, 0, 0, hours, minutes, seconds);
      var output_rtime = remain_time.toTimeString().split(' ')[0];

      /*jQuery(".dealzoneCounter").text(hours + ":" + minutes + ":" + seconds);*/
      $dealOfTheDay.find(".dealzoneCounter").text(output_rtime);
      $dealOfTheDayProduct.find(".countdown").text(output_rtime);


      /* percent of chart */
      /* 86400000 : 1 day time stamp */
      var base = 86400000;
      var percent = 100 - diff / base * 100;


      //jQuery('#dealzone_bar_product .barChart__barFill').attr("style", "width: " + percent + "%");

    }
  }

  function init() {
    localstorage_dotd = JSON.parse(localStorage.getItem("deal_of_the_day"));
    $dealOfTheDay.fadeIn();

    var current_product_id = $dealOfTheDayProduct.attr('product-id');

    if (parseInt(current_product_id) === localstorage_dotd.product.id) {
      $dealOfTheDayProduct.fadeIn();
    }

    var compare_at = localstorage_dotd.product.variants[0].compare_at_price;
    var price = localstorage_dotd.product.variants[0].price;

    var discount_percentage = (price - compare_at) * 100 / compare_at;
    discount_percentage = Math.round(discount_percentage * 10) / 10;

    $dealOfTheDay.find('.discount-percentage').html(discount_percentage + '%');

    $dealOfTheDay.find('.compared_at').html(storeCurrencySymbol + compare_at);
    $dealOfTheDay.find('.price').html(storeCurrencySymbol + price);

    //get small image
    var image = localstorage_dotd.product.images[0].src.replace('.jpg', '_compact.jpg');

    $dealOfTheDay.find('.product-image').attr('src', image);
    $dealOfTheDay.find('.product-link').attr('href', window.location.origin + '/products/' + localstorage_dotd.product.handle);

    var dealDate = localstorage_dotd.product.tags[localstorage_dotd.product.tags.indexOf('deal-' + currentDate)].replace('deal-', '');
    countDownTimer(currentDateHours, dealDate);
  }

  //get object from local storage
  var localstorage_dotd = JSON.parse(localStorage.getItem("deal_of_the_day"));

  /**
   * If the shop today's date is different from the product deal
   * date fetch a new product and save it in the browser local storage
   *
   * This prevents excessive requests to the products
   */
  if (localstorage_dotd == null) {
    addProductToLocalStorage(function() {
      init();
    });
  } else {
    if (localstorage_dotd.product.tags.indexOf('deal-' + currentDate) == -1) {
      addProductToLocalStorage(function() {
        init();
      });
    } else {
      init();
    }
  }

  $dealOfTheDay.find('.product-link').click(function() {
    localStorage.removeItem("deal_of_the_day")
  });
