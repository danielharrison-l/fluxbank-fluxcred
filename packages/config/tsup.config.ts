import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  clean: true,
  format: ["cjs", "esm"],
  treeshake: "recommended",
  entry: ["base/*.{ts,js}"],
  onSuccess:
    "node -e \"const fs=require('node:fs');const path=require('node:path');fs.mkdirSync('dist',{recursive:true});for(const file of fs.readdirSync('base').filter((file)=>file.endsWith('.json'))){fs.copyFileSync(path.join('base',file),path.join('dist',file))}\"",
});
