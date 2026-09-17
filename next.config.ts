import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Modo standalone: o build produz .next/standalone com o servidor e apenas
   * as dependencias que o codigo realmente importa.
   *
   * Sem isto, a imagem de producao precisaria carregar o node_modules inteiro
   * — centenas de megabytes de ferramenta de build que nao rodam em servidor.
   */
  output: "standalone",
};

export default nextConfig;
