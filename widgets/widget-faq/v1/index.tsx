'use client';

import React, { useEffect, useState } from 'react';
import { CustomRenderer } from '@/types/renderTemplate';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getPadding } from '@/lib/styleUtils';
import { fetchWidgetJson } from '@/lib/widgetApi';
import { getLocalizedValue, DEFAULT_LANG } from '@/lib/i18nWidgetConfig';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const defaultFaqs: FaqItem[] = [
  { id: 'faq-1', question: 'What services do you offer?', answer: 'We offer a wide range of services including design, development, and marketing solutions tailored to your needs.' },
  { id: 'faq-2', question: 'How can I get started?', answer: "Simply contact us through our form or give us a call. We'll schedule a free consultation to discuss your project." },
  { id: 'faq-3', question: 'What are your pricing options?', answer: 'Our pricing is flexible and based on the scope of your project. We offer packages for businesses of all sizes.' },
  { id: 'faq-4', question: 'What is your typical response time for support?', answer: 'We aim to respond to all support inquiries within 24 hours during business days. For urgent matters, we offer priority support with same-day response times.' },
  { id: 'faq-5', question: 'Can I customize the solutions to fit my specific needs?', answer: 'Absolutely! All our solutions are fully customizable. We work closely with you to understand your requirements and tailor our services to match your unique business needs and goals.' },
  { id: 'faq-6', question: 'What is your refund or cancellation policy?', answer: 'We offer a 30-day money-back guarantee on all our services. If you\'re not satisfied with our work, we\'ll refund your payment. Cancellations can be made at any time with 30 days notice.' },
  { id: 'faq-7', question: 'What are the technical requirements to use your services?', answer: 'Our services are designed to work with modern web browsers and don\'t require any special technical setup on your end. We handle all the technical implementation and provide you with easy-to-use interfaces.' },
  { id: 'faq-8', question: 'Do your solutions integrate with other platforms and tools?', answer: 'Yes! We offer integrations with popular platforms including CRM systems, payment processors, email marketing tools, and analytics platforms. We can also build custom integrations for your specific needs.' },
];

const toFaqsWithIds = (raw: unknown[]): FaqItem[] =>
  raw.map((faq: Record<string, unknown>, index: number) => ({
    id: (faq.id as string) || `faq-${index + 1}`,
    question: (faq.question as string) || '',
    answer: (faq.answer as string) || '',
  }));

export const FaqRenderer: CustomRenderer = ({ config, styles, theme, lang = DEFAULT_LANG }) => {
  const initialQuestions = Array.isArray(config.questions) ? toFaqsWithIds(config.questions as Record<string, unknown>[]) : defaultFaqs;
  const [faqs, setFaqs] = useState<FaqItem[]>(initialQuestions);

  const bgColor = (styles.backgroundColor as string) || 'transparent';
  const textColor = (styles.textColor as string) || theme.colors.text;
  const padding = getPadding(styles.padding as string);

  // Fetch questions from API when endpoint is set (API priority); otherwise use config.
  useEffect(() => {
    const apiEndpoint = config.apiEndpoint as string;
    const loadFaqs = async () => {
      if (apiEndpoint?.trim()) {
        try {
          const json = await fetchWidgetJson(apiEndpoint, undefined, 'FAQ');
          if (json) {
            const apiFaqs = (isRecord(json) && Array.isArray(json.questions))
              ? json.questions
              : (isRecord(json) && Array.isArray(json.faqs))
                ? json.faqs
                : (Array.isArray(json) ? json : []);
            setFaqs(toFaqsWithIds(apiFaqs as Record<string, unknown>[]));
            return;
          }
        } catch (error) {
          console.error('Failed to fetch FAQs:', error);
          setFaqs(defaultFaqs);
          return;
        }
      }
      const manualFaqs = (config.questions as FaqItem[]) || defaultFaqs;
      setFaqs(manualFaqs);
    };
    loadFaqs();
  }, [config.questions, config.apiEndpoint]);
  
  return (
    <div style={{ 
      backgroundColor: bgColor !== 'transparent' ? bgColor : theme.colors.background,
      padding,
      borderRadius: `${styles.borderRadius || 0}px`,
      opacity: ((styles.opacity as number) ?? 100) / 100,
    }}>
      <div className="w-full max-w-full md:max-w-3xl md:mx-auto px-4 md:px-6">
        <h2 
          className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-8 lg:mb-10"
          style={{ color: textColor, fontFamily: theme.fonts.heading }}
        >
          {getLocalizedValue(config.title, lang) || 'Frequently Asked Questions'}
        </h2>
        <Accordion type={config.allowMultiple ? 'multiple' : 'single'} collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border-b" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
              <AccordionTrigger 
                className="text-left font-medium py-3 md:py-4 min-h-[44px] text-sm md:text-base"
                style={{ color: theme.colors.text }}
              >
                {getLocalizedValue(faq.question, lang)}
              </AccordionTrigger>
              <AccordionContent 
                className="pb-3 md:pb-4 prose prose-xs sm:prose-sm md:prose-base max-w-none" 
                style={{ color: theme.colors.text, opacity: 0.8 }}
              >
                <div dangerouslySetInnerHTML={{ __html: getLocalizedValue(faq.answer, lang) || '' }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FaqRenderer;
