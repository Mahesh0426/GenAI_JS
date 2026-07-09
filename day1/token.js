import { get_encoding } from "tiktoken";

const encoderForGpt2 = get_encoding("gpt2");

const encoed = encoderForGpt2.encode("Hello, I am mahesh");

console.log(encoed);

const deco = encoderForGpt2.decode(encoed);

console.log(new TextDecoder().decode(deco));
