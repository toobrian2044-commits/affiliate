const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('[data-view]');
const pageCrumb = document.getElementById('pageCrumb');
const toast = document.getElementById('toast');
const sidebar = document.getElementById('sidebar');
const authScreen = document.getElementById('authScreen');
const appShell = document.querySelector('.app-shell');
const authForm = document.getElementById('authForm');
const authTabs = document.querySelectorAll('[data-auth-mode]');
const paymentStep = document.getElementById('paymentStep');
const transactionEndpoint = 'https://scholarpro-api-service.vercel.app/api/webhooks/zetupay';
const payoutEndpoint = 'https://scholarpro-api-service.vercel.app/api/withdrawals/request';
let authMode = 'signin';

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === 'signup';
  document.querySelectorAll('.signup-only').forEach((element) => {
    element.classList.toggle('auth-field-hidden', !isSignup);
    element.querySelectorAll('input').forEach((input) => { input.required = isSignup && input.id !== 'authReferral'; });
  });
  authTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.authMode === mode));
  document.getElementById('authEyebrow').textContent = isSignup ? 'START WITH CLARITY' : 'WELCOME BACK';
  document.getElementById('authTitle').textContent = isSignup ? 'Create your account' : 'Sign in to Kipepeo';
  document.getElementById('authSubtitle').textContent = isSignup ? 'Join the workspace and get your personal referral link.' : 'Continue to your referral workspace.';
  document.getElementById('authSubmit').firstChild.textContent = isSignup ? 'Create account ' : 'Sign in ';
  document.getElementById('authPassword').autocomplete = isSignup ? 'new-password' : 'current-password';
}

authTabs.forEach((tab) => tab.addEventListener('click', () => setAuthMode(tab.dataset.authMode)));
const referralParam = new URLSearchParams(window.location.search).get('ref');
if (referralParam) { document.getElementById('authReferral').value = referralParam; setAuthMode('signup'); }
authForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (authMode === 'signup' && !document.getElementById('authTerms').checked) {
    showToast('Accept the Terms and Privacy Policy to continue');
    return;
  }
  if (authMode === 'signup') {
    authForm.classList.add('auth-form-hidden');
    paymentStep.classList.add('payment-step-visible');
    document.querySelector('.auth-heading').classList.add('payment-heading');
    document.getElementById('authEyebrow').textContent = 'PAYMENT REQUIRED';
    document.getElementById('authTitle').textContent = 'Activate your account';
    document.getElementById('authSubtitle').textContent = 'One final step before your workspace is ready.';
    return;
  }
  authScreen.classList.add('auth-hidden');
  appShell.classList.remove('app-hidden');
  showToast(authMode === 'signup' ? 'Demo account created' : 'Signed in to your workspace');
});

document.getElementById('backToAuth').addEventListener('click', () => {
  authForm.classList.remove('auth-form-hidden');
  paymentStep.classList.remove('payment-step-visible');
  document.querySelector('.auth-heading').classList.remove('payment-heading');
  setAuthMode('signup');
});

document.getElementById('paymentSubmit').addEventListener('click', async () => {
  const submitButton = document.getElementById('paymentSubmit');
  submitButton.disabled = true;
  submitButton.firstChild.textContent = 'Connecting to Zetupay ';
  const payload = {
    amount: 100,
    currency: 'KES',
    name: document.getElementById('authName').value.trim(),
    email: document.getElementById('authEmail').value.trim(),
    phone: document.getElementById('authPhone').value.trim(),
    referral_code: document.getElementById('authReferral').value.trim() || null,
    callback_url: transactionEndpoint
  };
  try {
    const response = await fetch(transactionEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || `Payment request failed (${response.status})`);
    const checkoutUrl = result.checkout_url || result.payment_url || result.redirect_url || result.data?.checkout_url;
    if (checkoutUrl) { window.location.assign(checkoutUrl); return; }
    authScreen.classList.add('auth-hidden');
    appShell.classList.remove('app-hidden');
    showToast('Payment request accepted; awaiting verification');
  } catch (error) {
    showToast(error.message || 'Unable to connect to Zetupay');
    submitButton.disabled = false;
    submitButton.firstChild.textContent = 'Continue to Zetupay ';
  }
});

function navigate(viewName) {
  views.forEach((view) => view.classList.toggle('active-view', view.dataset.page === viewName));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === viewName));
  pageCrumb.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
  sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach((item) => item.addEventListener('click', () => navigate(item.dataset.view)));

document.getElementById('menuButton').addEventListener('click', () => sidebar.classList.toggle('open'));
document.querySelector('.close-note').addEventListener('click', (event) => event.currentTarget.parentElement.remove());

document.getElementById('copyButton').addEventListener('click', async () => {
  const link = 'https://kipepeo.co.ke/register?ref=AMW8F42';
  try { await navigator.clipboard.writeText(link); } catch (error) { /* Clipboard access can be unavailable in file previews. */ }
  showToast('Referral link copied to clipboard');
});
document.getElementById('copyButtonAlt').addEventListener('click', () => document.getElementById('copyButton').click());

document.querySelectorAll('[data-share]').forEach((button) => button.addEventListener('click', () => {
  const channel = button.dataset.share;
  document.getElementById('shareNote').textContent = `${channel.charAt(0).toUpperCase() + channel.slice(1)} share prepared`;
  showToast(`${channel.charAt(0).toUpperCase() + channel.slice(1)} sharing is ready`);
}));

const notificationButton = document.getElementById('notificationButton');
const notificationPopover = document.getElementById('notificationPopover');
notificationButton.addEventListener('click', () => notificationPopover.classList.toggle('open'));
document.getElementById('closeNotifications').addEventListener('click', () => notificationPopover.classList.remove('open'));

document.getElementById('withdrawForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById('withdrawAmount').value);
  if (amount < 500 || amount > 1250) {
    showToast('Enter an amount between KSh 500 and KSh 1,250');
    return;
  }
  const phone = document.querySelector('#withdrawForm input[type="tel"]').value.trim();
  try {
    const response = await fetch(payoutEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, currency: 'KES', phone, payment_method: 'mpesa' }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || `Withdrawal request failed (${response.status})`);
    showToast(result.message || 'Withdrawal request submitted for review');
  } catch (error) {
    showToast(error.message || 'Unable to submit withdrawal request');
  }
});

document.getElementById('saveProfile').addEventListener('click', () => showToast('Profile changes saved locally'));

document.getElementById('referralSearch').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll('#referralRows tr').forEach((row) => {
    row.hidden = !row.textContent.toLowerCase().includes(query);
  });
});
