# Manual do Tasty

Documento sobre a implementação entregue em 12 de setembro de 2026. Baseado no código do projeto, no manifesto web e na configuração de publicação.

- Aplicativo: [tasty-nu-five.vercel.app](https://tasty-nu-five.vercel.app/)
- Código-fonte: [GitHub — Tasty](https://github.com/ikeguimaraes-dot/tasty)

## 1. O que foi construído

O Tasty é uma rede social gastronômica para descobrir e avaliar pratos de restaurantes. A interface foi recriada a partir das capturas de tela do BOCA, com a identidade Tasty: vermelho e creme, títulos fortes, cartões arredondados e navegação inferior no celular.

As imagens foram usadas como referência visual e de fluxo. Não foi utilizado o código-fonte do BOCA. O comportamento e o banco de dados foram implementados para o Tasty, com adaptações para computador e foco na avaliação de pratos individuais.

## 2. Ele é nativo Android e iOS?

**Não. A versão entregue é um aplicativo web responsivo feito em React.** Ele roda no navegador e adapta a interface ao tamanho da tela.

| Característica                               | Situação da versão atual                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Acesso por link em computador                | Disponível                                                                    |
| Interface adaptada para celular              | Disponível                                                                    |
| Acesso pelo navegador no Android e no iPhone | É a forma de acesso prevista; recursos dependem do navegador e das permissões |
| Aplicativo Android nativo                    | Não foi desenvolvido                                                          |
| Aplicativo iOS nativo                        | Não foi desenvolvido                                                          |
| Arquivo Android APK/AAB                      | Não foi gerado                                                                |
| Aplicativo iOS compilado/IPA                 | Não foi gerado                                                                |
| Publicação na Google Play ou App Store       | Não foi realizada                                                             |
| Funcionamento completo sem internet          | Não está implementado                                                         |
| Notificações push com o app fechado          | Não estão implementadas                                                       |

O projeto contém um **manifesto web**, que declara nome, ícone, cores e preferência de abertura sem a barra do navegador. Isso prepara aspectos da experiência na tela inicial em navegadores compatíveis, mas não transforma o produto em aplicativo nativo. Não há um service worker para oferecer carregamento offline controlado, e a instalação na tela inicial não foi validada nesta entrega.

Os testes visuais foram feitos no navegador em dimensões de celular e computador. Isso não equivale a testes em aparelhos Android e iOS físicos.

## 3. Linguagens utilizadas

| Linguagem          | Para que foi utilizada                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **TypeScript**     | Linguagem principal da interface e da lógica do aplicativo. Acrescenta verificações de tipos ao JavaScript. |
| **JavaScript**     | Código executado pelo navegador após a compilação e scripts de integração do projeto.                       |
| **HTML**           | Estrutura inicial da página e elementos apresentados ao usuário.                                            |
| **CSS**            | Cores, tipografia, espaçamentos, animações e adaptação entre celular e computador.                          |
| **SQL e PL/pgSQL** | Estrutura do banco, relacionamentos, políticas de acesso, cálculos e funções dos jogos.                     |

Arquivos `.tsx` combinam TypeScript com a descrição dos componentes React. React e Tailwind são ferramentas; não são linguagens de programação.

## 4. Tecnologias e responsabilidades

As versões abaixo são as declaradas no projeto entregue.

| Tecnologia              | Versão        | Responsabilidade                                                |
| ----------------------- | ------------- | --------------------------------------------------------------- |
| React                   | 19.3.0        | Construção das telas e componentes interativos.                 |
| TypeScript              | 7.0.2         | Verificação dos tipos do código.                                |
| Tailwind CSS            | 4.3.3         | Estilos utilitários, combinados com CSS personalizado.          |
| Vite                    | 8.3.0         | Ambiente de desenvolvimento e geração dos arquivos de produção. |
| React Router            | 7.18.3        | Navegação entre feed, descoberta, perfil, jogos e demais telas. |
| Supabase JS             | 2.116.0       | Comunicação da interface com os serviços do Supabase.           |
| Leaflet / React Leaflet | 1.9.4 / 5.0.0 | Mapa interativo, usando mapas do OpenStreetMap.                 |
| Tesseract.js            | 7.0.0         | Leitura de texto em fotos de recibos, conhecida como OCR.       |
| Lucide React            | 1.45.0        | Ícones da interface.                                            |
| Vitest                  | 5.0.0         | Testes automatizados da lógica.                                 |

As fontes Outfit e Archivo Black são incluídas nos arquivos do app. A estrela visual do Tasty é um desenho vetorial próprio.

**Node.js** é usado nas ferramentas de desenvolvimento, compilação e testes. Não existe um servidor próprio Express ou uma API Node.js separada nesta implementação. Também não foi utilizado React Native.

## 5. Como a arquitetura funciona

O produto está dividido em três partes:

1. **Interface no navegador:** React apresenta as telas, recebe as ações do usuário e faz as consultas necessárias.
2. **Serviços no Supabase:** autenticação, banco PostgreSQL, armazenamento de fotos e comunicação em tempo real.
3. **Publicação na Vercel:** entrega os arquivos do aplicativo pelo domínio público. O GitHub armazena o código e seu histórico de alterações.

Por exemplo, ao publicar uma avaliação, o usuário escolhe restaurante e prato, informa a nota e escreve sua opinião. Se incluir uma foto, ela é enviada ao armazenamento do Supabase. A avaliação é gravada no banco vinculada ao usuário, ao prato e ao restaurante. As consultas usam esses registros para exibir o feed e calcular as notas.

A interface acessa o Supabase com uma chave publicável. As permissões são verificadas no banco, por políticas chamadas **RLS**, que controlam quais registros cada usuário pode consultar ou alterar. A chave administrativa não está no código do navegador.

## 6. Organização dos dados

O banco possui 15 tabelas, organizadas por finalidade:

| Área                            | Tabelas                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| Usuários e preferências         | `profiles`, `account_settings`                                    |
| Catálogo gastronômico           | `restaurants`, `dishes`                                           |
| Avaliações e interações         | `reviews`, `likes`, `comments`, `bookmarks`, `follows`, `reports` |
| Histórico e divisão de despesas | `checkins`, `bills`                                               |
| Jogos compartilhados            | `game_rooms`, `game_members`, `game_votes`                        |

Cada prato pertence a um restaurante. O banco impede vincular uma avaliação a um prato de outro restaurante. As notas são calculadas a partir das avaliações armazenadas.

Dados como nascimento, contas divididas, pratos salvos e check-ins têm acesso restrito ao proprietário. Nas salas de jogos, há verificações de participação, capacidade e autorização do anfitrião. Fotos publicadas em avaliações e perfis usam armazenamento público, com controle de quem pode enviar e remover arquivos.

## 7. Funcionalidades implementadas

| Funcionalidade      | Como funciona                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entrada e perfil    | E-mail e senha, fluxos de confirmação e recuperação, apresentação inicial e edição de nome, biografia e foto.                                                                        |
| Feed social         | Avaliações públicas ou de pessoas seguidas, curtidas, comentários, compartilhamento e denúncias.                                                                                     |
| Descoberta          | Busca por pratos, restaurantes e pessoas, categorias, filtros e rankings.                                                                                                            |
| Mapa                | Localização opcional, marcadores e seleção de restaurantes do catálogo.                                                                                                              |
| Avaliação de pratos | Nota em passos de 0,5, opinião, foto e critérios de serviço/ambiente ou delivery.                                                                                                    |
| Check-in e salvos   | Registro de visitas e lista pessoal de pratos para provar.                                                                                                                           |
| Conta Justa         | Leitura do recibo no navegador, correção manual dos itens, escolha de quem consumiu cada item e divisão proporcional do serviço. O cálculo distribui os centavos sem perder o total. |
| Jogos               | Match Maker e roleta, com modos individuais e salas compartilhadas. Os resultados podem ser atualizados em tempo real.                                                               |
| Notificações        | Página dentro do app com interações como seguidores, curtidas e comentários.                                                                                                         |

O OCR ajuda a preencher a conta; o usuário pode revisar os valores antes de dividir. Rascunhos são guardados no navegador, e usuários autenticados podem salvar a conta no Supabase.

## 8. O que ainda depende de configuração ou desenvolvimento

- **Google e Apple:** a interface de entrada está preparada, mas os provedores estão desativados no Supabase. Faltam as credenciais e configurações dos respectivos serviços.
- **E-mails de produção:** falta configurar um serviço SMTP próprio para envio amplo de confirmação de cadastro e recuperação de senha.
- **Push externo:** a preferência de notificação é registrada, mas não há entrega de notificações com o app fechado.
- **Catálogo comercial:** o conteúdo inicial tem 6 restaurantes, 10 pratos e 4 perfis demonstrativos, com fotos ilustrativas. Não há integração automática com uma base externa de estabelecimentos.
- **Inteligência artificial conversacional:** a busca consulta o catálogo; não existe um assistente de IA conectado.
- **Versões Android e iOS:** exigem uma etapa adicional de desenvolvimento, testes em dispositivos, compilação, assinatura e publicação nas lojas. O banco, as contas e grande parte das regras no Supabase podem ser reaproveitados.

## 9. Onde estão as partes do projeto

| Local no repositório  | Conteúdo                                                            |
| --------------------- | ------------------------------------------------------------------- |
| `src/pages`           | Telas do aplicativo.                                                |
| `src/components`      | Elementos reutilizados, navegação, mapa e componentes sociais.      |
| `src/lib`             | Integração com Supabase, dados compartilhados, tipos e cálculos.    |
| `src/styles.css`      | Estilos personalizados e regras para diferentes tamanhos de tela.   |
| `public`              | Ícone e manifesto web.                                              |
| `supabase/migrations` | Histórico de criação e atualização da estrutura do banco.           |
| `scripts`             | Testes de integração com o Supabase e de comunicação em tempo real. |
| `vercel.json`         | Configuração de publicação e navegação por URLs.                    |
| `README.md`           | Instruções técnicas de instalação, testes e configuração.           |

## 10. Manutenção e validação

Para desenvolver localmente, é necessário instalar as dependências, criar `.env.local` a partir de `.env.example`, informar a URL e a chave publicável do Supabase e iniciar o ambiente de desenvolvimento. As instruções completas estão no README.

Na entrega foram realizados: compilação de produção, 7 testes unitários, testes de integração com usuários temporários, verificação da transmissão de resultados entre duas sessões e testes no navegador dos principais fluxos. Também foram verificados o envio de uma avaliação e a leitura/divisão de uma conta de teste. Os registros temporários foram removidos ao final.

Essas verificações cobrem a versão entregue. Alterações futuras devem passar por novas verificações correspondentes ao que foi modificado.
