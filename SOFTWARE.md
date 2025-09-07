## Tecnologia
* Dockercompose (App + Postgress)
* Dockerfile (Para rodar a aplicação em container)
* NextJS com Prisma
* NextAuth.js
* Typescript
## Boas práticas
* NextJS Project Structure: [https://nextjs.org/docs/app/getting-started/project-structure](https://nextjs.org/docs/app/getting-started/project-structure)
* Reutilizar códigos.
## Aplicação
### Telas
* Login
* Home
* Settings
* Create Session
* Session
### Funcionalidades
* Não é possível se cadastrar na aplicação, apenas contas previamente liberadas.
* A tela home mostra todas as sessões, tem um botão para criar uma nova sessão de disparo, tem um botão para as configurações. 
* Criar sessão de disparo
	* Os seguintes campos precisam ser definido: nome do disparo, template, marca de origem, lista de contatos via planilha, campos utilizados da planilha (Qual o campo é o número do cliente e quais outros campos é para as variáveis do template se tiver).
	* As marcas que podem ser selecionadas serão prefixadas e cada uma vai ter o numero de origem de disparo
	* Os templates serão listados de forma paginada direto da api do twilio content template, cada vez que scrollar vai pegando outra pagina.
	* A lista de contato vai ser importada de um csv
	* Alguns templates podem ter variaveis por isso é importante vincular as colunas da planilha com as variaveis.
* Deve ser possivel criar sessao de disparo a partir de uma existente apenas importando outra lista de contatos
* Após o início da sessão deve processar os disparos de mensagens usando a api da Twilio do lado do servidor.
* O disparo deve acontecer do lado do servidor
* Deve ter uma tela de configurações para registrar marcas e definir variáveis como a da Twilio.
* Deve ter uma conta de admin que já vem criada