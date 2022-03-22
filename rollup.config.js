import { nodeResolve as resolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "es",
      sourcemap: true,
    },
    external: ["util"],
    plugins: [resolve(), commonjs(), typescript({ tsconfig: './tsconfig.json' })],
  },
  // {
  //   input: "build/compiled/index.d.ts",
  //   output: {
  //     file: "lockstep-api.d.ts",
  //     format: "es",
  //   },
  //   plugins: [dts()],
  // },
];
