import { validateField, validateForm } from './validators.js';
import { sendFeedback } from './api.js';

const FIELDS = ['name', 'phone', 'email', 'message'];

export function initFeedbackForm(formEl) {
  const submitBtn = formEl.querySelector('.contacts-form__button');
  const statusEl = formEl.querySelector('.contacts-form__status');
  let isSubmitting = false;

  const getGroup = (field) => {
    console.log('field: ', field);
    return formEl.querySelector(`#${field}`).closest('.contacts-form__group');
  };
  const getErrorEl = (field) => formEl.querySelector(`#${field}-error`);

  function showFieldError(field, message) {
    // console.log('field: ', field);
    const group = getGroup(field);
    const errorEl = getErrorEl(field);
    group.classList.remove('contacts-form__group-success');
    group.classList.add('contacts-form__group-error');
    errorEl.textContent = message;
  }

  function clearFieldError(field) {
    // console.log('field: ', field);
    const group = getGroup(field);
    const errorEl = getErrorEl(field);
    group.classList.remove('contacts-form__group-error');
    group.classList.add('contacts-form__group-success');
    errorEl.textContent = '';
  }

  function validateSingleField(field) {
    // console.log('field: ', field);
    const value = formEl.querySelector(`[name="${field}"]`).value;
    const error = validateField(field, value);
    if (error) {
      showFieldError(field, error);
      return false;
    }
    clearFieldError(field);
    return true;
  }

  // Live-валидация: на blur сразу, на input — с debounce (только если поле уже "тронуто")
  FIELDS.forEach((field) => {
    const input = formEl.querySelector(`[name="${field}"]`);
    let touched = false;
    let debounceTimer;

    input.addEventListener('blur', () => {
      touched = true;
      validateSingleField(field);
    });

    input.addEventListener('input', () => {
      if (!touched) {
        return;
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => validateSingleField(field), 300);
    });
  });

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    statusEl.textContent = '';
    statusEl.className = 'contacts-form__status';

    const formData = new FormData(formEl);
    const data = Object.fromEntries(formData.entries());
    console.log('data: ', data);

    // Honeypot: если бот заполнил скрытое поле — молча "успешно" завершаем,
    // не показывая боту, что его вычислили
    if (data.website) {
      statusEl.textContent = 'Thanks! The message has been sent.';
      statusEl.classList.add('contacts-form__status-success');
      formEl.reset();
      return;
    }

    const errors = validateForm(data);
    console.log('errors: ', Object.keys(errors));
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, msg]) => showFieldError(field, msg));
      // фокус на первое невалидное поле — доступность
      const firstInvalid = Object.keys(errors)[0];
      formEl.querySelector(`[name="${firstInvalid}"]`).focus();
      return;
    }
    
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.querySelector('.contacts-form__button-text').textContent = 'Sending...';
    
    console.log('isSubmitting: ', isSubmitting);
    try {
      const result = await sendFeedback({
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
      });

      if (result.success) {
        statusEl.textContent = 'Спасибо! Сообщение отправлено, мы свяжемся с вами.';
        statusEl.classList.add('contacts-form__status-success');
        formEl.reset();
        FIELDS.forEach((f) => getGroup(f).classList.remove('contacts-form__group-success'));
      } else {
        // Сервер вернул структурированные ошибки валидации
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, msg]) => showFieldError(field, msg));
        }
        console.log('result.message: ', result.message);
        statusEl.textContent = result.message || 'Не удалось отправить сообщение.';
        statusEl.classList.add('contacts-form__status-error');
      }
    } catch (err) {
      statusEl.textContent = 'Ошибка сети. Попробуйте позже.';
      statusEl.classList.add('contacts-form__status-error');
      console.error('Feedback form error:', err);
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.querySelector('.contacts-form__button-text').textContent = 'Submit';
    }
  });
}