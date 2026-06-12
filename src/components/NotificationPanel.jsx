import { useState, useEffect } from 'react';
import {
  CancelIcon,
  NotificationIcon,
  MailIcon,
  TickDoubleIcon,
} from '../lib/icons.jsx';
import { fetchNotifications, subscribeEmail } from '../lib/api.js';
import './NotificationPanel.css';

export default function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(localStorage.getItem('rcf_email') || '');
  const [emailInput, setEmailInput] = useState(
    localStorage.getItem('rcf_email') || '',
  );
  const [emailError, setEmailError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    if (!emailInput.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError('Enter a valid email');
      return;
    }
    setSaving(true);
    setEmailError('');
    try {
      await subscribeEmail(emailInput);
      localStorage.setItem('rcf_email', emailInput);
      setEmail(emailInput);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setEmailError(err.message || 'Could not subscribe. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className='notif-overlay'
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className='notif-panel'>
        <div className='notif-panel__header'>
          <div className='notif-panel__title'>
            <NotificationIcon size={16} />
            <span>Notifications</span>
          </div>
          <button className='notif-panel__close' onClick={onClose}>
            <CancelIcon size={16} />
          </button>
        </div>

        <div className='notif-panel__email'>
          <div className='notif-panel__email-label'>
            <MailIcon size={13} />
            <span>
              {email ? 'Subscribed as' : 'Get notified of new recordings'}
            </span>
          </div>
          {email ? (
            <div className='notif-panel__subscribed-stack'>
              <div className='notif-panel__subscribed'>
                <TickDoubleIcon size={14} />
                <span>{email}</span>
              </div>
              <button
                className='notif-panel__link-btn'
                onClick={() => {
                  setEmail('');
                  setEmailInput(email);
                  localStorage.removeItem('rcf_email');
                }}
              >
                Change email
              </button>
            </div>
          ) : (
            <div className='notif-panel__subscribe-form'>
              <input
                className={`input ${emailError ? 'error' : ''}`}
                type='email'
                placeholder='your@email.com'
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setEmailError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
              />
              <button
                className='btn btn--primary btn--sm'
                onClick={handleSubscribe}
                disabled={saving || !emailInput}
              >
                {saving ? 'Saving…' : saved ? 'Done!' : 'Subscribe'}
              </button>
              {emailError && <p className='form-error'>{emailError}</p>}
            </div>
          )}
        </div>

        <div className='notif-panel__list'>
          {loading ? (
            <div className='notif-panel__loading'>Loading…</div>
          ) : notifications.length === 0 ? (
            <div className='notif-panel__empty'>
              <NotificationIcon size={28} />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className='notif-item'>
                <div className='notif-item__dot' />
                <div className='notif-item__body'>
                  <p>{n.title}</p>
                  <span>
                    {new Date(n.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
