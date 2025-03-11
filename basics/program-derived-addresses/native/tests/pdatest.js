"use strict";
exports.__esModule = true;
var web3_js_1 = require("@solana/web3.js");
var programId = new web3_js_1.PublicKey("11111111111111111111111111111112");
var userPubkey = new web3_js_1.PublicKey("BHRFKxsniJAVdSeeAGWh6VtSDSctvdzU6jrN3emvDkH5");
var seed = Buffer.from("page_visits");
var _a = web3_js_1.PublicKey.findProgramAddressSync([seed, userPubkey.toBuffer()], programId), pda = _a[0], bump = _a[1];
console.log("Derived PDA:", pda.toBase58());
console.log("Bump:", bump);
