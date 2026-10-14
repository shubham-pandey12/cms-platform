import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { EmbedThemeRoot, getEmbedRenderer } from '@/lib/embed/embedRenderers';

const theme = {
  colors: {
    primary: '#111',
    secondary: '#222',
    background: '#fff',
    text: '#000',
    accent: '#333',
  },
  fonts: { heading: 'Arial', body: 'Georgia' },
};

describe('embedRenderers', () => {
  it('renders widget-cta snapshot for stable SEO HTML', () => {
    const Cta = getEmbedRenderer('widget-cta');
    expect(Cta).toBeTruthy();
    const html = renderToString(
      <EmbedThemeRoot theme={theme}>
        {React.createElement(Cta!, {
          config: {
            heading: 'Hello',
            description: 'World',
            buttonText: 'Go',
            buttonUrl: 'https://example.com/x',
          },
          styles: { padding: 'md' },
          theme,
          lang: 'en-GB',
        })}
      </EmbedThemeRoot>
    );
    expect(html).toContain('Hello');
    expect(html).toContain('World');
    expect(html).toContain('https://example.com/x');
    expect(html).toContain('mcms-embed-widget-cta');
  });

  it('renders widget-button with link when url is absolute', () => {
    const Btn = getEmbedRenderer('widget-button');
    expect(Btn).toBeTruthy();
    const html = renderToString(
      React.createElement(Btn!, {
        config: { text: 'Click', url: 'https://example.org/' },
        styles: {},
        theme,
        lang: 'en-GB',
      })
    );
    expect(html).toContain('mcms-embed-widget-button');
    expect(html).toContain('https://example.org/');
    expect(html).toContain('Click');
  });

  it('renders widget-form with native form action and fields', () => {
    const Form = getEmbedRenderer('widget-form');
    expect(Form).toBeTruthy();
    const html = renderToString(
      React.createElement(Form!, {
        config: {
          title: 'Contact us',
          submitText: 'Send',
          submitEndpoint: 'https://api.example.com/contact',
          fields: [
            { id: 'a', name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@x.com' },
          ],
        },
        styles: { padding: 'md' },
        theme,
        lang: 'en-GB',
      })
    );
    expect(html).toContain('mcms-embed-widget-form');
    expect(html).toContain('method="post"');
    expect(html).toContain('https://api.example.com/contact');
    expect(html).toContain('Contact us');
    expect(html).toContain('name="email"');
  });
});
