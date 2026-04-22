window.buyBtnHandler = function ShopifyBuyBtn(divID, prodID) {
  var scriptURL =
    "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";

  if (window.ShopifyBuy && window.ShopifyBuy.UI) {
    ShopifyBuyInit(divID, prodID);
  } else {
    loadScript(divID, prodID);
  }

  function loadScript(divID, prodID) {
    var script = document.createElement("script");
    script.async = true;
    script.src = scriptURL;
    (document.head || document.body).appendChild(script);
    script.onload = function () {
      ShopifyBuyInit(divID, prodID);
    };
  }

  function ShopifyBuyInit(divID, prodID) {
    var node = document.getElementById(divID);
    if (!node) {
      throw new Error("ShopifyBuyBtn: No element found with id=" + divID);
    }

    var client = ShopifyBuy.buildClient({
      domain: "zvc3vb-8p.myshopify.com",
      storefrontAccessToken: "fec7337dce8ed72e6845cb45637d457e",
    });

    ShopifyBuy.UI.onReady(client).then(function (ui) {
      ui.createComponent("product", {
        id: prodID,
        node: node,
        moneyFormat: "%24%7B%7Bamount%7D%7D",
        options: {
          product: {
            styles: {
              product: {
                "@media (min-width: 601px)": {
                  "max-width": "calc(25% - 20px)",
                  "margin-left": "20px",
                  "margin-bottom": "50px",
                },
              },
              title: {
                "font-family": "Playfair Display, serif",
              },
              button: {
                "font-family": "Playfair Display, serif",
                ":hover": {
                  "background-color": "#d51818",
                },
                "background-color": "#7d0e0e",
                ":focus": {
                  "background-color": "#d51818",
                },
                "border-radius": "40px",
                "padding-left": "100px",
                "padding-right": "100px",
              },
            },
            text: {
              button: "Add to cart",
            },
            googleFonts: ["Playfair Display"],
          },
          productSet: {
            styles: {
              products: {
                "@media (min-width: 601px)": {
                  "margin-left": "-20px",
                },
              },
            },
          },
          modalProduct: {
            contents: {
              img: false,
              imgWithCarousel: true,
              button: false,
              buttonWithQuantity: true,
            },
            styles: {
              product: {
                "@media (min-width: 601px)": {
                  "max-width": "100%",
                  "margin-left": "0px",
                  "margin-bottom": "0px",
                },
              },
              button: {
                "font-family": "Playfair Display, serif",
                ":hover": {
                  "background-color": "#d51818",
                },
                "background-color": "#7d0e0e",
                ":focus": {
                  "background-color": "#d51818",
                },
                "border-radius": "40px",
                "padding-left": "100px",
                "padding-right": "100px",
              },
              title: {
                "font-family": "Helvetica Neue, sans-serif",
                "font-weight": "bold",
                "font-size": "26px",
                color: "#4c4c4c",
              },
            },
            googleFonts: ["Playfair Display"],
            text: {
              button: "Add to cart",
            },
          },
          option: {
            styles: {
              label: {
                "font-family": "Playfair Display, serif",
              },
              select: {
                "font-family": "Playfair Display, serif",
              },
            },
            googleFonts: ["Playfair Display"],
          },
          cart: {
            styles: {
              button: {
                "font-family": "Playfair Display, serif",
                ":hover": {
                  "background-color": "#d51818",
                },
                "background-color": "#7d0e0e",
                ":focus": {
                  "background-color": "#d51818",
                },
                "border-radius": "40px",
              },
            },
            text: {
              total: "Subtotal",
              button: "Checkout",
            },
            popup: false,
            googleFonts: ["Playfair Display"],
          },
          toggle: {
            styles: {
              toggle: {
                "font-family": "Playfair Display, serif",
                "background-color": "#7d0e0e",
                ":hover": {
                  "background-color": "#d51818",
                },
                ":focus": {
                  "background-color": "#d51818",
                },
              },
            },
            googleFonts: ["Playfair Display"],
          },
        },
      });
    });
  }
};
