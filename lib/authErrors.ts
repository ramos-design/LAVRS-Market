const errorTranslations: Record<string, string> = {
  'Invalid login credentials': 'Neplatné přihlašovací údaje.',
  'Email not confirmed': 'E-mail nebyl potvrzen. Zkontrolujte svou e-mailovou schránku.',
  'Error sending confirmation email': 'Chyba při odesílání potvrzovacího e-mailu. Zkuste to prosím později.',
  'New password should be different from the old password.': 'Nové heslo se musí lišit od stávajícího hesla.',
  'New password should be different from the old password': 'Nové heslo se musí lišit od stávajícího hesla.',
  'User already registered': 'Tento e-mail je již zaregistrován.',
  'Password should be at least 6 characters': 'Heslo musí mít alespoň 6 znaků.',
  'Unable to validate email address: invalid format': 'Neplatný formát e-mailové adresy.',
  'Signup requires a valid password': 'Pro registraci je vyžadováno platné heslo.',
  'User not found': 'Uživatel nebyl nalezen.',
  'Email rate limit exceeded': 'Příliš mnoho pokusů. Zkuste to prosím později.',
  'Request timeout': 'Server neodpovídá. Zkuste to prosím později.',
};

export function translateAuthError(message: string, fallback?: string): string {
  if (!message) return fallback || 'Nastala neočekávaná chyba.';

  // Exact match
  if (errorTranslations[message]) {
    return errorTranslations[message];
  }

  // Partial matches for dynamic messages
  if (message.includes('For security purposes, you can only request this after')) {
    const seconds = message.match(/after (\d+) seconds/)?.[1];
    return `Z bezpečnostních důvodů můžete tuto akci provést až za ${seconds || 'několik'} sekund.`;
  }

  if (message.includes('Email link is invalid or has expired')) {
    return 'Odkaz vypršel nebo je neplatný. Zkuste to prosím znovu.';
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Příliš mnoho pokusů. Zkuste to prosím později.';
  }

  return fallback || message;
}
