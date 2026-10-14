'use client';

import React, { useEffect, useRef } from 'react';
import { CustomRenderer } from '@/types/renderTemplate';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import { FieldValidationConfig } from '@/lib/formValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getPadding } from '@/lib/styleUtils';
import { toast } from 'sonner';
import { copy } from '@/lib/copy';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: string;
  validationRules?: Array<{
    type: 'minLength' | 'maxLength' | 'pattern';
    value: number | string;
    message?: string;
  }>;
}

const defaultFields: FormField[] = [
  { id: 'field-1', name: 'name', label: 'Your Name', type: 'text', placeholder: 'Enter your name', required: true },
  { id: 'field-2', name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter your email', required: true },
  { id: 'field-3', name: 'message', label: 'Your Message', type: 'textarea', placeholder: 'Enter your message', required: true },
];

export const FormRenderer: CustomRenderer = ({ config, styles, theme, lang = DEFAULT_LANG, actions = {}, isPreviewMode = false }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  
  useFocusTrap(isPreviewMode && !formRef.current?.querySelector('[aria-invalid="true"]'), {
    initialFocus: { current: formRef.current?.querySelector('input, textarea, select') as HTMLElement || null },
  });

  const bgColor = (styles.backgroundColor as string) || 'transparent';
  const textColor = (styles.textColor as string) || theme.colors.text;
  const padding = getPadding(styles.padding as string);
  
  const configFields = (config.fields as FormField[]) || defaultFields;
  const fields = configFields.map((field, index) => ({
    ...field,
    id: field.id || `field-${index + 1}`,
  }));
  const endpoint =
    (config.submitEndpoint as string) ||
    (config.endpoint as string) ||
    '/api/contact';
  const successMessage =
    getLocalizedValue(config.successMessage, lang) ||
    'Thank you! Your message has been sent successfully.';
  const errorMessage =
    getLocalizedValue(config.errorMessage, lang) ||
    'Something went wrong. Please try again.';
  const submitText = getLocalizedValue(config.submitText, lang) || 'Send Message';
  const title = getLocalizedValue(config.title, lang) || 'Contact Us';
  const successDescription = getLocalizedValue(config.successDescription, lang) || 'Your form has been submitted successfully.';
  const submittingText = getLocalizedValue(config.submittingText, lang) || 'Submitting...';

  const fieldConfigs: FieldValidationConfig[] = fields.map((field) => ({
    name: field.name,
    type: field.type,
    required: field.required,
    rules: field.validationRules?.map((rule) => ({
      type: rule.type as 'minLength' | 'maxLength' | 'pattern',
      value: rule.value,
      message: rule.message,
    })),
  }));

  const {
    values,
    errors,
    touched,
    isSubmitting,
    isSuccess,
    submitError,
    setValue,
    setTouched,
    validateField,
    handleSubmit,
    reset,
  } = useFormSubmission({
    fieldConfigs,
    submissionConfig: {
      endpoint,
      method: (config.method as 'POST' | 'PUT' | 'PATCH') || 'POST',
      headers: (config.headers as Record<string, string>) || {},
      timeout: (config.timeout as number) || 30000,
      retries: (config.retries as number) || 0,
      retryDelay: (config.retryDelay as number) || 1000,
    },
    onSuccess: (data) => {
      toast.success(successMessage, {
        description: copy.builder.renderers.formSubmitted,
      });
    },
    onError: (error) => {
      toast.error(errorMessage, {
        description: error,
      });
    },
    successMessage,
    errorMessage,
  });

  useEffect(() => {
    if (isSuccess && successRef.current) {
      successRef.current.focus();
    }
  }, [isSuccess]);

  const handleInputChange = (name: string, value: string | number | boolean) => {
    if (!isPreviewMode) return;
    setValue(name, value);
    if (touched[name]) {
      validateField(name);
    }
  };

  const handleBlur = (name: string) => {
    if (!isPreviewMode) return;
    setTouched(name);
    validateField(name);
  };

  const renderField = (field: FormField) => {
    const fieldId = field.id;
    const fieldName = field.name;
    const fieldValue = values[fieldName] || '';
    const fieldError = errors[fieldName];
    const isTouched = touched[fieldName];
    const showError = isTouched && fieldError;
    const errorId = `${fieldId}-error`;
    const describedBy = showError ? errorId : undefined;
    const isInvalid = !!showError;

    const baseInputStyle = { 
      borderColor: isInvalid ? 'rgb(239 68 68)' : 'rgba(0,0,0,0.15)',
    };

    const ariaProps = {
      id: fieldId,
      name: fieldName,
      'aria-required': field.required || undefined,
      'aria-invalid': isInvalid || undefined,
      'aria-describedby': describedBy,
      'aria-label': field.type === 'checkbox' ? getLocalizedValue(field.label, lang) : undefined,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <div key={fieldId} className="space-y-1">
            <Textarea
              {...ariaProps}
              value={fieldValue as string}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              onBlur={() => handleBlur(fieldName)}
              placeholder={getLocalizedValue(field.placeholder, lang)}
              rows={4}
              className="w-full px-3 py-2 text-sm md:text-base border rounded-lg resize-none min-h-[44px]"
              style={baseInputStyle}
              required={field.required}
              disabled={!isPreviewMode || isSubmitting}
            />
            {showError && (
              <div id={errorId} role="alert" className="text-sm text-red-600 flex items-center gap-1" aria-live="polite">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{fieldError}</span>
              </div>
            )}
          </div>
        );
      case 'select':
        const options = field.options?.split(',').map(o => o.trim()) || [];
        return (
          <div key={fieldId} className="space-y-1">
            <select
              {...ariaProps}
              value={fieldValue as string}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              onBlur={() => handleBlur(fieldName)}
              className="w-full px-3 py-2 text-sm md:text-base border rounded-lg min-h-[44px] bg-background"
              style={baseInputStyle}
              required={field.required}
              disabled={!isPreviewMode || isSubmitting}
            >
              <option value="">{getLocalizedValue(field.placeholder, lang) || 'Select...'}</option>
              {options.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
            {showError && (
              <div id={errorId} role="alert" className="text-sm text-red-600 flex items-center gap-1" aria-live="polite">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{fieldError}</span>
              </div>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div key={fieldId} className="flex items-start gap-2 min-h-[44px] space-y-1">
            <input
              {...ariaProps}
              type="checkbox"
              checked={fieldValue === true || fieldValue === 'true'}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              onBlur={() => handleBlur(fieldName)}
              className="w-5 h-5 md:w-4 md:h-4 mt-1"
              required={field.required}
              disabled={!isPreviewMode || isSubmitting}
            />
            <label htmlFor={fieldId} className="text-sm md:text-base flex-1" style={{ color: textColor }}>
              {getLocalizedValue(field.label, lang)}
              {field.required && <span className="text-red-500 ml-1" aria-label="Required">*</span>}
            </label>
            {showError && (
              <div id={errorId} role="alert" className="text-sm text-red-600 flex items-center gap-1 w-full" aria-live="polite">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{fieldError}</span>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div key={fieldId} className="space-y-1">
            <Input
              {...ariaProps}
              type={field.type}
              value={fieldValue as string}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              onBlur={() => handleBlur(fieldName)}
              placeholder={getLocalizedValue(field.placeholder, lang)}
              style={baseInputStyle}
              required={field.required}
              disabled={!isPreviewMode || isSubmitting}
            />
            {showError && (
              <div id={errorId} role="alert" className="text-sm text-red-600 flex items-center gap-1" aria-live="polite">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{fieldError}</span>
              </div>
            )}
          </div>
        );
    }
  };

  if (isSuccess) {
    return (
      <div
        style={{
          backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.background,
          padding,
          borderRadius: `${styles.borderRadius || 0}px`,
          opacity: ((styles.opacity as number) ?? 100) / 100,
        }}
      >
        <div className="w-full max-w-full md:max-w-lg md:mx-auto px-4 md:px-6">
          <div
            ref={successRef}
            role="alert"
            className="text-center p-6 rounded-lg bg-green-50 border border-green-200"
            tabIndex={-1}
            aria-live="polite"
          >
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">{successMessage}</h3>
            <p className="text-sm text-green-700">{successDescription}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      style={{
        backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.background,
        padding,
        borderRadius: `${styles.borderRadius || 0}px`,
        opacity: ((styles.opacity as number) ?? 100) / 100,
      }}
    >
      <div className="w-full max-w-full md:max-w-lg md:mx-auto px-4 md:px-6">
        <h2
          className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-8"
          style={{ color: textColor, fontFamily: theme.fonts.heading }}
        >
          {title}
        </h2>
        <form
          ref={formRef}
          className="space-y-3 md:space-y-4"
          onSubmit={handleSubmit}
          noValidate
          aria-label={title}
        >
          {fields.map((field) => (
            <div key={field.id}>
              {field.type !== 'checkbox' && (
                <label
                  htmlFor={field.id}
                  className="block text-xs md:text-sm font-medium mb-1 md:mb-2"
                  style={{ color: textColor }}
                >
                  {getLocalizedValue(field.label, lang)}
                  {field.required && (
                    <span className="text-red-500 ml-1" aria-label="Required">*</span>
                  )}
                </label>
              )}
              {renderField(field)}
            </div>
          ))}

          {submitError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2"
              aria-live="assertive"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full min-h-[44px] text-sm md:text-base"
            disabled={isSubmitting || !isPreviewMode}
            aria-label={isSubmitting ? submittingText : submitText}
            style={{
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
              pointerEvents: isPreviewMode ? 'auto' : 'none',
              cursor: isPreviewMode ? 'pointer' : 'default',
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                {submittingText}
              </span>
            ) : (
              submitText
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FormRenderer;
