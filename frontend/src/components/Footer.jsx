import { useLocation } from 'react-router-dom'

const CONTACTS = [
  {
    href: 'https://wa.me/201127603628',
    label: 'WhatsApp',
    value: '01127603628',
    color: '#25D366',
    hoverBorder: 'rgba(37,211,102,0.35)',
    external: true,
  },
  {
    href: 'tel:+201127603628',
    label: 'Phone',
    value: '01127603628',
    color: 'var(--blue)',
    hoverBorder: 'rgba(68,136,255,0.35)',
  },
  {
    href: 'mailto:mahmoudwafi33@gmail.com',
    label: 'Email',
    value: 'mahmoudwafi33@gmail.com',
    color: 'var(--amber)',
    hoverBorder: 'rgba(255,170,0,0.35)',
  },
  {
    href: 'https://github.com/Mahmoud-Wafi/',
    label: 'GitHub',
    value: 'Mahmoud-Wafi',
    color: '#f5f7ff',
    hoverBorder: 'rgba(255,255,255,0.22)',
    external: true,
  },
]

export default function Footer() {
  const location = useLocation()

  if (location.pathname.startsWith('/question/')) return null

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(10,10,15,0.88)',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: '0 auto auto 50%',
        transform: 'translateX(-50%)',
        width: 420,
        height: 180,
        background: 'radial-gradient(circle, rgba(0,255,136,0.08), transparent 72%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '30px 20px 34px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(68,136,255,0.20)',
            boxShadow: '0 0 28px rgba(68,136,255,0.10)',
          }}>
            <img
              src="/pypractice-mark.png"
              alt=""
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: 0,
              lineHeight: 1.15,
            }}>
              <span style={{ color: 'var(--blue)' }}>Py</span>
              <span style={{ color: 'var(--text)' }}>Practice</span>
            </div>
            <div style={{
              fontSize: 11,
              color: 'var(--text3)',
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}>
              Master Python in the browser
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 12,
          color: 'var(--text3)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}>
          Developed By
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          <img
            src="/developer-avatar.jpg"
            alt="Mahmoud Wafi"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(68,136,255,0.35)',
              boxShadow: '0 0 22px rgba(68,136,255,0.16)',
            }}
          />
          <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700, letterSpacing: '0.4px' }}>
            Mahmoud Wafi
          </div>
          <span style={{
            color: 'var(--green)',
            fontSize: 12,
            fontWeight: 600,
            background: 'rgba(0,255,136,0.1)',
            border: '1px solid rgba(0,255,136,0.18)',
            padding: '5px 12px',
            borderRadius: 999,
            fontFamily: 'var(--font-mono)',
          }}>
            Full Stack Developer
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginTop: 4,
          width: '100%',
        }}>
          {CONTACTS.map(contact => (
            <a
              key={contact.label}
              href={contact.href}
              target={contact.external ? '_blank' : undefined}
              rel={contact.external ? 'noreferrer' : undefined}
              style={{
                minWidth: 190,
                flex: '1 1 190px',
                maxWidth: 230,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = contact.hoverBorder
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
            >
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: contact.color,
                boxShadow: `0 0 12px ${contact.color}`,
                flexShrink: 0,
              }} />
              <span style={{ minWidth: 0 }}>
                <span style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'var(--text3)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {contact.label}
                </span>
                <span style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--text2)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {contact.value}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
