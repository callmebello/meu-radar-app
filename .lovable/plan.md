## Plano

1. **Confirmar o erro real do preview**
   - Ler os logs recentes do servidor de desenvolvimento para encontrar a causa exata do “Preview has not been built yet”.
   - Verificar se há erro de import, JSX quebrado, asset ausente ou rota gerada incorretamente.

2. **Corrigir somente a causa do build/preview**
   - Se o erro estiver em arquivos alterados recentemente, ajustar apenas o trecho necessário.
   - Não alterar layout, textos, mapa, funil ou navegação além do que estiver impedindo o preview de compilar.

3. **Validar que o preview voltou**
   - Conferir se a rota `/` responde corretamente.
   - Confirmar que não há erros recentes nos logs depois da correção.

## Escopo

- Foco exclusivo: fazer o preview voltar a buildar/carregar.
- Sem mudanças visuais novas e sem mexer em funcionalidades não relacionadas.
