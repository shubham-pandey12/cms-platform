import { useState, useCallback } from 'react';
import { submitForm, FormSubmissionConfig, FormSubmissionResult } from '@/services/formSubmissionService';
import { validateForm, validateField as validateFieldUtil, FieldValidationConfig, isFormValid } from '@/lib/formValidation';
import { announceToScreenReader } from '@/lib/accessibility';

export interface UseFormSubmissionOptions {
  fieldConfigs: FieldValidationConfig[];
  submissionConfig: FormSubmissionConfig;
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface FormState {
  values: Record<string, string | number | boolean>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isSuccess: boolean;
  submitError: string | null;
}

export const useFormSubmission = (options: UseFormSubmissionOptions) => {
  const {
    fieldConfigs,
    submissionConfig,
    onSuccess,
    onError,
    successMessage,
    errorMessage,
  } = options;

  const [state, setState] = useState<FormState>({
    values: {},
    errors: {},
    touched: {},
    isSubmitting: false,
    isSuccess: false,
    submitError: null,
  });

  // Update field value
  const setValue = useCallback((name: string, value: string | number | boolean) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [name]: value },
      // Clear error when user starts typing
      errors: prev.touched[name] ? { ...prev.errors, [name]: '' } : prev.errors,
    }));
  }, []);

  // Mark field as touched
  const setTouched = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [name]: true },
    }));
  }, []);

  // Validate a single field
  const validateField = useCallback((name: string) => {
    const config = fieldConfigs.find((f) => f.name === name);
    if (!config) return;

    const value = state.values[name];
    const error = validateFieldUtil(value, config);

    setState((prev) => ({
      ...prev,
      errors: error ? { ...prev.errors, [name]: error } : { ...prev.errors, [name]: '' },
    }));

    return !error;
  }, [fieldConfigs, state.values]);

  // Validate entire form
  const validate = useCallback(() => {
    const errors = validateForm(state.values, fieldConfigs);
    setState((prev) => ({
      ...prev,
      errors,
      // Mark all fields as touched
      touched: fieldConfigs.reduce((acc, config) => ({ ...acc, [config.name]: true }), {}),
    }));
    return isFormValid(errors);
  }, [state.values, fieldConfigs]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate form
    const isValid = validate();
    if (!isValid) {
      announceToScreenReader('Form has validation errors. Please check the fields.', 'assertive');
      return;
    }

    setState((prev) => ({
      ...prev,
      isSubmitting: true,
      submitError: null,
      isSuccess: false,
    }));

    try {
      const result: FormSubmissionResult = await submitForm(state.values, submissionConfig);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          isSuccess: true,
          submitError: null,
        }));

        const message = successMessage || 'Form submitted successfully!';
        announceToScreenReader(message, 'polite');

        if (onSuccess) {
          onSuccess(result.data);
        }

        // Reset form after success (optional, can be controlled)
        setTimeout(() => {
          setState({
            values: {},
            errors: {},
            touched: {},
            isSubmitting: false,
            isSuccess: false,
            submitError: null,
          });
        }, 2000);
      } else {
        const errorMsg = result.error || errorMessage || 'Form submission failed';
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          isSuccess: false,
          submitError: errorMsg,
        }));

        announceToScreenReader(errorMsg, 'assertive');

        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        isSuccess: false,
        submitError: errorMsg,
      }));

      announceToScreenReader(errorMsg, 'assertive');

      if (onError) {
        onError(errorMsg);
      }
    }
  }, [state.values, submissionConfig, validate, onSuccess, onError, successMessage, errorMessage]);

  // Reset form
  const reset = useCallback(() => {
    setState({
      values: {},
      errors: {},
      touched: {},
      isSubmitting: false,
      isSuccess: false,
      submitError: null,
    });
  }, []);

  return {
    ...state,
    setValue,
    setTouched,
    validateField,
    validate,
    handleSubmit,
    reset,
  };
};
