-- ==========================================
-- PRIMEIRO CONTATO - WHATSAPP
-- ==========================================
insert into public.message_templates (user_id, name, category, subject, body)
values
(
auth.uid(),
'Primeiro contato — WhatsApp',
'primeiro_contato',
null,
'Olá! Tudo bem?
Meu nome é [Seu Nome].
Estou entrando em contato porque vi o {cliente} e gostaria de falar com a pessoa responsável pelas compras de alimentos e bebidas.
Com quem posso conversar?'
),
-- ==========================================
-- PRIMEIRO CONTATO - EMAIL
-- ==========================================
(
auth.uid(),
'Primeiro contato — Email',
'primeiro_contato',
'Contato comercial - {cliente}',
'Olá!
Meu nome é [Seu Nome] e gostaria de entrar em contato com o responsável pelas compras do {cliente}.
Trabalho com o fornecimento de produtos voltados ao café da manhã e operação de hotéis e pousadas.
Se puder me indicar a pessoa responsável ou encaminhar este e-mail, agradeço.
Fico à disposição.
[Seu Nome]
[Telefone]'
),
-- ==========================================
-- APRESENTAÇÃO - WHATSAPP
-- ==========================================
(
auth.uid(),
'Apresentação — WhatsApp',
'apresentacao',
null,
'Perfeito!
Trabalho com fornecimento de produtos para hotéis e pousadas, principalmente para operações de café da manhã.
Atendemos com:
☕ Café
🥐 Pão de queijo
🧃 Sucos integrais
Se fizer sentido para vocês, posso apresentar nosso catálogo e condições sem compromisso.'
),
-- ==========================================
-- APRESENTAÇÃO - EMAIL
-- ==========================================
(
auth.uid(),
'Apresentação — Email',
'apresentacao',
'Apresentação comercial',
'Olá!
Conforme conversamos, segue uma breve apresentação.
Trabalhamos com fornecimento de produtos destinados ao café da manhã e demais operações de hotelaria.
Nosso portfólio inclui:
* Café
* Pão de queijo
* Sucos integrais
Caso tenha interesse, posso enviar nosso catálogo completo e apresentar as condições comerciais.
Permaneço à disposição.
[Seu Nome]
[Telefone]'
),
-- ==========================================
-- FOLLOW-UP 1
-- ==========================================
(
auth.uid(),
'Follow-up — 3 dias',
'follow_up',
null,
'Olá!
Passando apenas para verificar se conseguiu analisar minha mensagem.
Caso ainda não tenha visto, fico à disposição para apresentar nosso catálogo ou esclarecer qualquer dúvida.
Se preferir, posso retornar em outro momento.'
),
-- ==========================================
-- FOLLOW-UP 2
-- ==========================================
(
auth.uid(),
'Follow-up — 7 dias',
'follow_up',
null,
'Olá!
Sei que a rotina costuma ser corrida, então só estou retomando nosso contato.
Gostaria de saber se existe interesse em conhecer nossos produtos ou se este assunto pode ficar para outro momento.
Fico à disposição.'
),
-- ==========================================
-- NEGOCIAÇÃO
-- ==========================================
(
auth.uid(),
'Negociação',
'negociacao',
'Proposta comercial',
'Olá!
Conforme combinado, segue nossa proposta.
Caso queira ajustar quantidades, mix de produtos ou condições, podemos conversar para encontrar a melhor opção para sua operação.
Qualquer dúvida estou à disposição.'
),
-- ==========================================
-- PÓS PROPOSTA
-- ==========================================
(
auth.uid(),
'Pós proposta',
'negociacao',
null,
'Olá!
Gostaria de saber se conseguiu analisar a proposta que enviei.
Caso tenha qualquer dúvida ou queira fazer algum ajuste, fico à disposição.
Será um prazer atender vocês.'
),
-- ==========================================
-- REATIVAÇÃO
-- ==========================================
(
auth.uid(),
'Reativação',
'follow_up',
null,
'Olá!
Faz algum tempo que conversamos e resolvi retomar nosso contato.
Caso ainda estejam avaliando fornecedores para produtos do café da manhã, será um prazer apresentar nossas opções.
Se este não for o momento, sem problemas. Podemos conversar mais à frente.'
);