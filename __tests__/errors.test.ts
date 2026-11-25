import { errorMessage } from '@/utils/errors';

describe('errorMessage', () => {
  it('retorna a mensagem de erros conhecidos', () => {
    expect(errorMessage(new Error('rede indisponível'))).toBe('rede indisponível');
  });
  it('retorna uma mensagem explícita para falhas desconhecidas', () => {
    expect(errorMessage('falha')).toBe('Ocorreu um erro inesperado.');
  });
  it('trata nulo como uma falha desconhecida', () => {
    expect(errorMessage(null)).toBe('Ocorreu um erro inesperado.');
  });
});
