import * as bcrypt from 'bcryptjs';

describe('Auth Service', () => {
  it('should hash passwords correctly', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 10);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject invalid passwords', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 10);
    
    const isValid = await bcrypt.compare('wrongPassword', hash);
    expect(isValid).toBe(false);
  });
});