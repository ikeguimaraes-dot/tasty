# Tasty

Rede social gastronômica em React, TypeScript, Tailwind CSS e Supabase, inspirada nas referências visuais do BOCA. As avaliações são vinculadas a um prato e ao restaurante que o serve.

A identidade visual atual usa vermelho e creme. Esta implementação continua sendo web; a reconstrução nativa está descrita em uma proposta separada, ainda sujeita a alinhamento.

- [Manual do aplicativo atual](MANUAL_TASTY.md)
- [Proposta de arquitetura do Tasty nativo](PROPOSTA_TASTY_NATIVO.md)

**Aplicativo:** https://tasty-nu-five.vercel.app

**Repositório:** https://github.com/ikeguimaraes-dot/tasty

## Rodar localmente

```sh
npm ci
cp .env.example .env.local
# Preencha a URL e a chave PUBLICÁVEL do seu projeto Supabase.
npm run dev
```

```sh
npm run build
npm test
```

Use Node.js 24 ou mais recente. A chave administrativa nunca deve receber o prefixo `VITE_`, entrar no código do navegador ou ser versionada.

## Fluxos implementados

- Feed público e feed de pessoas seguidas, curtidas, comentários, compartilhamento e denúncia.
- Entrada com e-mail e senha, confirmação de e-mail, recuperação de senha, onboarding e perfil editável com foto.
- Descoberta de pratos, categorias, restaurantes e pessoas; notas calculadas no banco; rankings por comida, serviço e ambiente.
- Mapa interativo com OpenStreetMap, marcadores, seleção de restaurantes e localização opcional.
- Avaliação de pratos e delivery, fotos no Supabase Storage, recomendação e notas em passos de 0,5.
- Check-ins privados no histórico do perfil e pratos salvos por usuário.
- Conta Justa: OCR da imagem no próprio navegador, itens editáveis, participantes por item, serviço proporcional e distribuição exata de centavos. Rascunho local e salvamento privado na conta.
- Match Maker solo ou em dupla e roleta solo ou em sala. Salas com código, limite de participantes e resultados compartilhados por Supabase Realtime. Consulta periódica de reserva em caso de interrupção da conexão.
- Notificações de interações dentro do app. Layout responsivo, navegação mobile flutuante, teclado e modais com controle de foco.

## Banco e implantação

As migrações em `supabase/migrations` foram aplicadas ao projeto `xmyefntlraxwbsnipjqe`. Existem 15 tabelas com RLS. Os dados de contas, nascimento, check-ins, salvos e divisões de conta ficam restritos ao proprietário. Salas são visíveis apenas aos membros. Funções privilegiadas de jogos ficam em um esquema privado e validam a identidade, a capacidade e o anfitrião.

As views de notas usam `security_invoker`; notas e contagens são calculadas a partir das avaliações. Uma chave estrangeira composta impede avaliar um prato em um restaurante diferente. Uploads são limitados a JPG, PNG e WebP de até 8 MB e ao diretório do próprio usuário.

O projeto Vercel `tasty` usa `vercel.json` para configurar Vite e as rotas. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente de produção. As URLs de confirmação e recuperação já foram configuradas para `https://tasty-nu-five.vercel.app` e localhost. O arquivo `supabase/config.toml` preserva a confirmação de e-mail, TOTP e limites existentes.

## Configurações externas ainda necessárias

- **Google e Apple:** os provedores estão desativados no projeto Supabase. Os botões verificam a disponibilidade antes de iniciar OAuth. Para habilitar, configure as credenciais e URLs dos aplicativos dos provedores no painel do Supabase. A integração do frontend já está pronta.
- **E-mail em produção:** o projeto usa o serviço padrão do Supabase. Configure um SMTP próprio para entrega ampla de confirmações e recuperação de senha; o serviço padrão possui restrições de destinatários e frequência. O fluxo de login por senha foi validado com usuários temporários confirmados pela API administrativa, sem enviar mensagens a pessoas reais.
- **Push fora do app:** a preferência/permissão do navegador é registrada, mas não há entrega de Web Push com o aplicativo fechado. As interações estão disponíveis na página de notificações.
- **Catálogo:** os 6 restaurantes, 10 pratos e 4 perfis iniciais são demonstrativos, com fotos ilustrativas. Os exemplos são identificados na interface. Novas avaliações são persistidas normalmente. Para um catálogo comercial, substitua o seed por dados verificados ou conecte um provedor de lugares.
- **Busca:** consulta pratos, restaurantes e pessoas do catálogo. Não há provedor de IA conversacional configurado.

O verificador do Supabase apontou a proteção contra senhas vazadas como desativada na configuração do serviço. É uma configuração adicional do provedor; consulte [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). As políticas de acesso do app passaram nos testes de isolamento.

## Verificação

- Compilação TypeScript e build de produção aprovados.
- 7 testes unitários: divisão proporcional, arredondamento, valores não atribuídos, milhares de combinações em centavos, extração de itens e busca/distância.
- Testes de integração com 3 usuários temporários: login, perfis, leitura pública, bloqueio de escrita anônima, avaliação, vínculo prato/restaurante, privacidade, curtidas, comentários, seguidores, check-in, contas, capacidade e autorização das salas, votos e upload de fotos.
- Supabase Realtime: resultado da roleta recebido pela segunda sessão autenticada.
- Navegador a 390 × 844 e desktop: feed, descoberta, mapa, jogos, login, publicação de avaliação e OCR de uma conta de teste. A conta de R$ 80,00 com 10% de serviço fechou em R$ 88,00, com os valores recalculados conforme os participantes de cada item.
- Contas e registros temporários removidos após os testes. Nenhuma chave administrativa no código ou no bundle público.

Os testes remotos de `scripts/integration.mjs` exigem `TASTY_TEST_SERVICE_KEY` fornecida apenas ao processo de teste, e criam usuários de QA no projeto de destino. Use preferencialmente um projeto de desenvolvimento. Eles mantêm os registros para inspeção; execute o mesmo comando com `--cleanup` ao finalizar. `scripts/realtime-smoke.mjs` utiliza essas sessões temporárias para validar a transmissão entre jogadores.

## Recursos externos

Fontes Outfit e Archivo Black são empacotadas localmente via Fontsource. Ícones Lucide e estrela vetorial própria. Fotos ilustrativas hospedadas no Unsplash. O mapa mantém atribuição OpenStreetMap; sua disponibilidade e os arquivos de idioma do OCR dependem desses serviços externos.
