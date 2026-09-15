
export const rulesValidators = {
  name: (value) => {
    const v = value.trim();
    if (!v) {
      return 'Enter a name';
    }
    if (v.length < 2) {
      return 'The name is too short';
    }
    if (v.length > 100) {
      return 'The name is too long';
    }
    if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(v)) {
      return 'The name contains invalid characters';
    }
    return null;
  },

  phone: (value) => {
    const v = value.trim();
    if (!v) {
      return 'Enter your phone number';
    }
    // допускаем + и цифры, от 10 до 15 цифр (E.164-подобно)
    const digits = v.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return 'Incorrect phone number';
    }
    if (!/^[+()\d\s-]+$/.test(v)) {
      return 'The phone contains invalid characters';
    }
    return null;
  },

  email: (value) => {
    const v = value.trim();
    if (!v) {
      return 'Enter your email address';
    }
    if (v.length > 150) {
      return 'The email is too long';
    }
    // достаточно строгий, но не over-engineered паттерн для клиента
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(v)) {
      return 'Incorrect email address';
    }
    return null;
  },

  message: (value) => {
    const v = value.trim();
    if (!v) {
      return 'Enter a message';
    }
    if (v.length < 10) {
      return 'The message is too short (min. 10 characters)';
    }
    if (v.length > 2000) {
      return 'The message is too long (max. 2000 characters)';
    }
    return null;
  },
};

export function validateField(name, value) {
  const fn = rulesValidators[name];
  return fn ? fn(value) : null;
}

export function validateForm(data) {
  const errors = {};
  for (const key of Object.keys(rulesValidators)) {
    const err = validateField(key, data[key] ?? '');
    if (err) {
      errors[key] = err;
    }
  }
  return errors; // {} если всё ок
}