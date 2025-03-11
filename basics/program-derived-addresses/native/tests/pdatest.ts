import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("11111111111111111111111111111112");
const userPubkey = new PublicKey("24sbcWAXqJDHEyGrFC1fj9TnsuzNQnkkgitkyyz4fa5T");
const seed = Buffer.from("page_visits");

const [pda, bump] = PublicKey.findProgramAddressSync([seed,userPubkey.toBuffer()], programId);

console.log("Derived PDA:", pda.toBase58());
console.log("Bump:", bump);


// Local Wallet: 6fKxW1U3kLs2G8VCpYG3LSRxjSFQWQU8xHNWpaXw22FW
// Created User: 5RV34mr5cfbvHmfGBwuAxQaGZBjKYauiu9rgoHez29hp
// Test User PubKey is:  5RV34mr5cfbvHmfGBwuAxQaGZBjKYauiu9rgoHez29hp
// Test User pageVisits PDA  is:  4qr3bnuwvPv3tUfaca51e8Hnpe38EwqYYisAyR9uU9pK
//  255 Done BORSH S-deS 11111111111111111111111111111112
// Signed and Added the transaction456
// Page visits errrrrrrrrr PDA: 4qr3bnuwvPv3tUfaca51e8Hnpe38EwqYYisAyR9uU9pK

// Derived PDA: 6QfAoF7GymxS3RvJ3R5kS85DJGaUdk1MFFKR6vwNh6Dy
// Bump: 250