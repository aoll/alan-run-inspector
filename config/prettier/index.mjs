import * as tailwind from "prettier-plugin-tailwindcss";

/** @type {import("prettier").Config} */
const config = {
  printWidth: 120,
  plugins: [tailwind],
};

export default config;
