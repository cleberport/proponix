import { CSSProperties } from 'react';

export interface EmailTemplateProps {
  title: string;
  body: string[];
  ctaText?: string;
  ctaUrl?: string;
  footerExtra?: string;
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    backgroundColor: '#f4f4f5',
    padding: '40px 16px',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    minHeight: '100%',
  },
  container: {
    maxWidth: 600,
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  header: {
    padding: '32px 40px 24px',
    borderBottom: '1px solid #f0f0f0',
    textAlign: 'center' as const,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 700,
    color: '#e6296a',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  content: {
    padding: '32px 40px',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0a0a0b',
    margin: '0 0 20px',
    lineHeight: 1.3,
  },
  text: {
    fontSize: 15,
    color: '#52525b',
    lineHeight: 1.65,
    margin: '0 0 16px',
  },
  ctaWrapper: {
    textAlign: 'center' as const,
    padding: '8px 0 16px',
  },
  cta: {
    display: 'inline-block',
    padding: '12px 32px',
    backgroundColor: '#e6296a',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    textDecoration: 'none',
    letterSpacing: '0.01em',
  },
  footer: {
    padding: '24px 40px',
    borderTop: '1px solid #f0f0f0',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: 12,
    color: '#a1a1aa',
    margin: '0 0 4px',
    lineHeight: 1.5,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: 600,
    color: '#d4d4d8',
    margin: 0,
  },
};

const EmailTemplate = ({ title, body, ctaText, ctaUrl, footerExtra }: EmailTemplateProps) => (
  <div style={styles.wrapper}>
    <div style={styles.container}>
      <div style={styles.header}>
        <p style={styles.logoText}>Freelox</p>
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>{title}</h1>
        {body.map((paragraph, i) => (
          <p key={i} style={styles.text}>{paragraph}</p>
        ))}
        {ctaText && (
          <div style={styles.ctaWrapper}>
            <a href={ctaUrl || '#'} style={styles.cta}>{ctaText}</a>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        {footerExtra && <p style={styles.footerText}>{footerExtra}</p>}
        <p style={styles.footerText}>Se precisar de ajuda, entre em contato com nosso suporte.</p>
        <p style={styles.footerBrand}>© {new Date().getFullYear()} Freelox</p>
      </div>
    </div>
  </div>
);

export default EmailTemplate;
