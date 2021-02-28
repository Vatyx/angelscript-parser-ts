import { Parser } from "./parser";

console.log("Hello");
let parser = new Parser("int x = 5;");
parser.ParseScript();