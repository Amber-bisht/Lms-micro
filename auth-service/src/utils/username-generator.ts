import User from '../models/User';

export async function generateUniqueUsername(base: string): Promise<string> {
  let username = base.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  let counter = 1;
  
  while (await User.findOne({ username })) {
    username = `${base.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')}${counter}`;
    counter++;
  }
  
  return username;
}

