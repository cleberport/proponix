import { CSSProperties } from 'react';

export interface EmailTemplateProps {
  title: string;
  greeting?: string;
  body: string[];
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    backgroundColor: '#ffffff',
    padding: '40px 16px',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    minHeight: '100%',
    color: '#111111',
  },
  container: {
    maxWidth: 480,
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
  },
  header: {
    padding: '32px 32px 0',
    textAlign: 'center' as const,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    color: '#e6296a',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  content: {
    padding: '28px 32px 32px',
  },
  greeting: {
    fontSize: 17,
    fontWeight: 600,
    color: '#111111',
    margin: '0 0 16px',
    lineHeight: 1.4,
  },
  title: {
    fontSize: 15,
    fontWeight: 400,
    color: '#333333',
    lineHeight: 1.6,
    margin: '0 0 12px',
  },
  text: {
    fontSize: 15,
    color: '#444444',
    lineHeight: 1.6,
    margin: '0 0 12px',
  },
  ctaWrapper: {
    textAlign: 'center' as const,
    padding: '12px 0 8px',
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
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    border: 'none',
    margin: '0',
  },
  footer: {
    padding: '20px 32px',
    textAlign: 'center' as const,
    backgroundColor: '#fafafa',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    margin: '0 0 4px',
    lineHeight: 1.5,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: 600,
    color: '#cccccc',
    margin: '8px 0 0',
  },
};

const EmailTemplate = ({ title, greeting, body, ctaText, ctaUrl, footerText }: EmailTemplateProps) => (
  <div style={styles.wrapper}>
    <div style={styles.container}>
      <div style={styles.header}>
        <p style={styles.logoText}>Freelox</p>
      </div>

      <div style={styles.content}>
        {greeting && <p style={styles.greeting}>{greeting}</p>}
        <p style={styles.title}>{title}</p>
        {body.map((paragraph, i) => (
          <p key={i} style={styles.text}>{paragraph}</p>
        ))}
        {ctaText && (
          <div style={styles.ctaWrapper}>
            <a href={ctaUrl || '#'} style={styles.cta}>{ctaText}</a>
          </div>
        )}
      </div>

      <hr style={styles.divider} />

      <div style={styles.footer}>
        {footerText && <p style={styles.footerText}>{footerText}</p>}
        <p style={styles.footerBrand}>© {new Date().getFullYear()} Freelox</p>
      </div>
    </div>
  </div>
);

export default EmailTemplate;
