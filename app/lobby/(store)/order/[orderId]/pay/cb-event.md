```js

var requestOptions = {
  method: 'GET',
  redirect: 'follow'
};

fetch("https://www.example.com/orders.php?number=827746841326&value_coin=105.6&coin=polygon_usdc&txid_in=0xa22a82b4aefbc55f6382e1b5c0b4f0e3c034a654df3bcac431f7fed1942e22bc&txid_out=0x94c2c3e84c2021e6bf377aebf8abf03b49570611bb0c336e357d7f4516f56244&address_in=0x32e854bD1270670C832634CA87858fFd9F3e2c78", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));

// AFF
var requestOptions = {
  method: 'GET',
  redirect: 'follow'
};

fetch("https://api.paygate.to/control/custom-affiliate.php?address=0xF977814e90dA44bFA03b6295A0616a897441aceC&callback=https%3A%2F%2Fwww.example.com%2Forder%3Fnumber%3D82173313628090&affiliate=0x3c783c21a0383057D128bae431894a5C19F9Cf06&affiliate_fee=0.01&merchant_fee=0.98", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```
