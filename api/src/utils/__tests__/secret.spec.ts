import { generateRandomSecret } from '../secret';

describe('generateRandomSecret', () => {
  it('returns the requested number of alphanumeric characters', () => {
    expect(generateRandomSecret(32)).toMatch(/^[A-Za-z0-9]{32}$/);
  });

  it('does not repeat itself', () => {
    const secrets = new Set(
      Array.from({ length: 1000 }, () => generateRandomSecret(16)),
    );
    expect(secrets.size).toBe(1000);
  });

  it('does not use Math.random', () => {
    const mathRandom = jest.spyOn(Math, 'random');
    generateRandomSecret(16);
    expect(mathRandom).not.toHaveBeenCalled();
    mathRandom.mockRestore();
  });
});
