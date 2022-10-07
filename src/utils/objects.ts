export function objectEntries<In extends Record<string, unknown>>(input: In) {
  return Object.entries(input) as {
      [key in keyof In]: [key, In[key]];
  }[keyof In & string][];
}

export function fromEntries<In extends readonly (readonly [string, unknown])[]>(input: In) {
  return Object.fromEntries(input) as {
      [key in In[number][0]]: (In[number] & readonly [key, unknown])[1];
  }
}
