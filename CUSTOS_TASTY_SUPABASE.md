# Tasty — verificação de plano, custos e capacidade

Consulta de 12 de setembro de 2026. Valores em dólares americanos, sem impostos, câmbio, descontos contratuais ou serviços externos. Preços consultados na documentação oficial; projeções não são a fatura da conta.

## O que foi confirmado na conta

| Item                                                            | Resultado da consulta                                                             |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Organização que contém o Tasty                                  | Plano **Pro**, confirmado pelo conector Supabase                                  |
| Projetos nessa organização                                      | **6**; franquias compartilhadas não devem ser tratadas como exclusivas do Tasty   |
| Projeto Tasty                                                   | `tastyapp`, referência `xmyefntlraxwbsnipjqe`                                     |
| Estado e região                                                 | Ativo/saudável, São Paulo (`sa-east-1`)                                           |
| Banco                                                           | PostgreSQL 17; aproximadamente **12 MB**, incluindo estruturas internas           |
| Limite configurado no PostgreSQL                                | `max_connections = 60`; isso não revela, sozinho, o tamanho de compute contratado |
| Edge Functions do Tasty                                         | Nenhuma implantada na data da consulta                                            |
| pgmq, pg_cron e pg_net                                          | Disponíveis, mas ainda não habilitados neste projeto                              |
| Arquivos no bucket `tasty-photos`                               | 0 objetos na consulta; as imagens ilustrativas atuais são externas                |
| Compute exato, consumo mensal, créditos disponíveis e Spend Cap | Não confirmados pelas ferramentas acessíveis                                      |

O painel exigiu autenticação adicional. A revisão automática bloqueou o login via GitHub por exigir autorização específica para essa autenticação externa. Nenhum acesso alternativo foi usado para contornar o bloqueio. O plano Pro foi confirmado de forma independente pelo conector já autenticado; o saldo de franquia da organização permanece desconhecido.

## O plano atual cobre o MVP?

**Cobre a disponibilidade dos componentes escolhidos.** Edge Functions, PostgreSQL/rate limiting, Queues, Storage, Smart CDN e transformação de imagens podem fazer parte do MVP no Pro. Não é necessário contratar Team apenas para habilitá-los. A organização já paga o Pro, então não há uma nova assinatura Supabase obrigatória para começar no projeto existente. O preço de tabela do Pro começa em US$ 25/mês. [Planos Supabase](https://supabase.com/pricing).

**Isso não confirma saldo mensal suficiente nem capacidade de pico.** A fila usa CPU, memória, I/O e disco do mesmo Postgres que atende as avaliações. As franquias são compartilhadas com os demais projetos. O tamanho atual do banco e a ausência de funções no Tasty não permitem deduzir o consumo dos outros cinco projetos.

O banco continua tendo compute contratado enquanto está ativo. Edge Functions sob demanda não fazem o PostgreSQL escalar a zero. [Cobrança de compute](https://supabase.com/docs/guides/platform/manage-your-usage/compute).

## Franquias e excedentes

| Recurso                       | Incluído no Pro                       | Excedente de tabela                                           | Fonte                                                                                                       |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Edge Functions                | 2 milhões de invocações/ciclo         | US$ 2 por pacote adicional de 1 milhão                        | [Invocações](https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations)         |
| Storage                       | 100 GB médios no ciclo                | US$ 0,0213 por GB/mês, medido por GB-hora                     | [Storage](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size)                         |
| Transformação de imagens      | 100 imagens de origem distintas/ciclo | US$ 5 por pacote de 1.000 origens adicionais                  | [Transformações](https://supabase.com/docs/guides/platform/manage-your-usage/storage-image-transformations) |
| Saída sem cache               | 250 GB/ciclo                          | US$ 0,09/GB adicional                                         | [Egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress)                                |
| Saída com cache               | 250 GB/ciclo                          | US$ 0,03/GB adicional                                         | [Egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress)                                |
| Usuários ativos no mês        | 100.000                               | US$ 0,00325 por usuário adicional                             | [MAU](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users)                     |
| Conexões simultâneas Realtime | 500 de pico                           | US$ 10 por pacote de 1.000 adicionais                         | [Conexões Realtime](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-peak-connections)  |
| Mensagens Realtime            | 5 milhões/ciclo                       | US$ 2,50 por milhão adicional                                 | [Preços](https://supabase.com/pricing)                                                                      |
| Disco do banco                | 8 GB por projeto                      | US$ 0,125/GB adicional na configuração básica                 | [Preços](https://supabase.com/pricing)                                                                      |
| pgmq                          | Extensão no banco                     | Sem assinatura de fila separada; consome recursos do Postgres | [Queues](https://supabase.com/docs/guides/queues)                                                           |

Nas rubricas cobradas por pacote, uma fração excedente ocupa o pacote inteiro. A franquia de imagens conta origens distintas transformadas no ciclo, não apenas chamadas nem quantidade de tamanhos gerados. Invocações com erro também entram na contagem de Edge Functions. MAU conta atividade de autenticação, não simplesmente o total histórico de contas cadastradas.

## Exemplos para decidir com números

### MVP com 10 mil avaliações no mês

Hipótese ilustrativa: 10 mil usuários ativos, 10 mil avaliações com uma foto de 2 MB, estoque inicial de fotos vazio, até 300 mil invocações Edge, 50 GB de saída sem cache, 200 GB com cache, pico de 100 conexões Realtime e até 500 mil mensagens. Esses volumes mensais são um cenário de orçamento, não uma redução da meta de pico. Fotos mantidas de meses anteriores se acumulam no Storage e também entram na medição.

Se houvesse toda a franquia disponível, o compute permanecesse igual e o banco coubesse no disco incluído, as rubricas acima ficariam dentro da franquia, **exceto as transformações**. Transformar 10 mil origens distintas gera aproximadamente **US$ 50 adicionais no ciclo**: 9.900 origens além da franquia, arredondadas para 10 pacotes de US$ 5. Não é correto dizer que transformação ilimitada está incluída no Pro.

Se nenhuma origem adicional fosse transformada, esse custo específico não ocorreria. O plano mantém o serviço de transformação, com geração sob demanda e tamanhos reutilizados. O MVP não precisa pré-processar todo o catálogo para provar o fluxo.

### Um pico de 10 mil publicações em um minuto

Uma foto de 2 MB por avaliação representa **20 GB de upload no minuto**, cerca de 333 MB/s. Upload não é a mesma rubrica que saída de dados; armazenar esses arquivos e servi-los posteriormente tem custos próprios. Origens privadas, derivados persistidos e arquivos temporários devem ser somados ao armazenamento.

10 mil chamadas de publicação e 10 mil autorizações de upload correspondem a cerca de 20 mil invocações Edge antes dos consumidores e tracking. Cada lote de 50 mensagens processadas por uma chamada acrescenta uma invocação, sem contar retries. O fluxo de cadastro via Supabase Auth não deve ser contado automaticamente como uma Edge Function.

Se o uso adicional ultrapassar a franquia de Edge, haverá pelo menos um pacote de **US$ 2**; não US$ 0,04 calculado como fração de pacote. A confirmação de e-mail exige capacidade do provedor SMTP, além da cobrança do Supabase.

Um teste com 10 mil conexões Realtime bem-sucedidas pode gerar aproximadamente **US$ 100 adicionais de pico no ciclo**, mesmo que dure pouco. Esse custo é diferente de 10 mil cadastros ou requisições HTTP; só abrirá conexões quem participar de funcionalidades em tempo real. [Medição do pico Realtime](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-peak-connections).

### Ensaio sustentado de 15 minutos

A etapa de 15 minutos na taxa máxima envolve **150 mil cadastros e 150 mil avaliações**, além dos ensaios anteriores. Com uma foto nova de 2 MB por avaliação, são **300 GB de originais** recebidos. Transformar as 150 mil origens distintas custaria cerca de **US$ 750 de excedente**, considerando a franquia de 100 origens ainda integralmente disponível. [Cobrança por origem transformada](https://supabase.com/docs/guides/platform/manage-your-usage/storage-image-transformations).

Se as 150 mil contas também se tornarem usuários ativos no ciclo, excederão uma franquia totalmente disponível de 100 mil MAU em 50 mil usuários: **US$ 162,50 adicionais**. Esse valor não inclui e-mail, invocações, armazenamento médio, leituras, conexões Realtime nem compute. [Cobrança de MAU](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users).

Portanto, somente transformações e MAU desse cenário somariam aproximadamente **US$ 912,50 além do plano**, antes dos outros custos. Isso é uma simulação condicional, não um orçamento fechado nem um teste já executado. Ensaios menores verificarão o caminho de escrita primeiro; o aceite final continua exigindo a etapa completa e seu orçamento deve considerar todos os ensaios no mesmo ciclo. Reutilizar fotos ou usuários pode ser útil para diagnóstico, mas não comprova sozinho o cenário completo de novos cadastros e novas imagens.

### Se for preciso aumentar apenas o compute

Valores ilustrativos de tabela, mantendo o plano Pro. Os incrementos abaixo usam **Micro como referência**, não afirmam que o Tasty atualmente usa Micro.

| Compute | Valor aproximado/mês | Incremento em relação a Micro |
| ------- | -------------------- | ----------------------------- |
| Micro   | US$ 10               | referência                    |
| Small   | US$ 15               | + US$ 5/mês                   |
| Medium  | US$ 60               | + US$ 50/mês                  |
| Large   | US$ 111              | + US$ 101/mês                 |

O compute é cobrado por hora. Medium custa US$ 0,0822/h, contra US$ 0,01344/h de Micro: a diferença indicativa é US$ 0,06876/h. A cobrança considera horas e mudanças podem exigir reinicialização. O crédito mensal de US$ 10 pertence à organização e não se repete para cada projeto. Esses valores vêm da [tabela de compute](https://supabase.com/docs/guides/platform/manage-your-usage/compute).

Não foi identificado um tamanho de compute capaz de cumprir a meta sem benchmark. Subir para Team não é uma solução automática: as franquias de Functions e Storage indicadas na documentação são iguais às do Pro. Ajustar compute, disco e quotas específicas é uma decisão diferente de mudar o plano da organização.

## Custos que ainda não podem ser fechados

- A fatura incremental exata depende do uso dos seis projetos e do compute atualmente contratado.
- SMTP precisa de fornecedor, domínio e quota de envio compatíveis; não há preço universal que possa ser inferido apenas do Supabase.
- Build/distribuição mobile e contas das lojas permanecem itens separados do backend, conforme o plano mobile original.
- Ambiente de homologação remoto acrescenta compute. Começar localmente evita uma nova despesa fixa durante o desenvolvimento; teste local não comprova a capacidade da plataforma hospedada.
- Execuções de carga devem registrar invocações, imagens de origem transformadas, armazenamento temporário, MAU, egress e pico Realtime. Apagar os dados do ensaio não estorna necessariamente o uso já medido no ciclo.

## Decisão técnica

Manter **Supabase Pro e seus componentes nativos** para o MVP. Não contratar AWS, Redis externo ou servidor permanente na configuração inicial. Medir antes de aumentar compute ou substituir componentes. Corrigir consultas, índices, tamanho dos lotes, concorrência e retenção antes de concluir que é necessário outro fornecedor.

A meta de 10.000 cadastros + 10.000 avaliações/minuto e os critérios de latência continuam obrigatórios, mas **ainda não foram validados**. A autorização do usuário dispensa novas rodadas de aprovação rotineira na execução; a restrição de evitar novas faturas e custos antecipados permanece parte do plano.
