// Health Guard AI - Premium SaaS Frontend Script
const API_URL = window.location.origin && window.location.origin !== 'null' && window.location.protocol.startsWith('http')
  ? `${window.location.origin}/predict`
  : 'http://127.0.0.1:5050/predict';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let currentResults = [];

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  initDarkMode();
  initSuggestionChips();
  initScrollAnimations();
  initMobileMenu();
  initSmoothScrolling();
  initFormInteractions();
  
  // Global functions for onclick handlers
  window.predictDisease = predictDisease;
  window.scrollToForm = scrollToForm;
  window.scrollToFeatures = scrollToFeatures;
  window.addSymptom = addSymptom;
  window.resetForm = resetForm;
  window.exportResults = exportResults;
  window.toggleMobileMenu = toggleMobileMenu;
}

// === DARK MODE ===
function initDarkMode() {
  const toggle = document.querySelector('.dark-mode-toggle');
  toggle.addEventListener('click', toggleDarkMode);
  document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
  updateDarkModeIcon();
}

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
  localStorage.setItem('darkMode', isDarkMode);
  updateDarkModeIcon();
  
  // Add animation
  const toggle = document.querySelector('.dark-mode-toggle');
  toggle.style.transform = 'scale(1.2) rotate(360deg)';
  setTimeout(() => {
    toggle.style.transform = '';
  }, 300);
}

function updateDarkModeIcon() {
  const icon = document.querySelector('.dark-mode-toggle i');
  icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

// === MOBILE MENU ===
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', toggleMobileMenu);
  }
}

function toggleMobileMenu() {
  const navMenu = document.querySelector('.nav-menu');
  const toggle = document.querySelector('.mobile-menu-toggle');
  
  navMenu.classList.toggle('mobile-active');
  toggle.classList.toggle('active');
}

// === SMOOTH SCROLLING ===
function initSmoothScrolling() {
  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

function scrollToForm() {
  const formSection = document.getElementById('form-section');
  if (formSection) {
    formSection.scrollIntoView({ behavior: 'smooth' });
    
    // Add focus effect to symptoms input
    setTimeout(() => {
      const symptomsInput = document.getElementById('symptoms');
      if (symptomsInput) {
        symptomsInput.focus();
        symptomsInput.classList.add('pulse-once');
        setTimeout(() => symptomsInput.classList.remove('pulse-once'), 1000);
      }
    }, 800);
  }
}

function scrollToFeatures() {
  const featuresSection = document.getElementById('features');
  if (featuresSection) {
    featuresSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// === FORM INTERACTIONS ===
function initFormInteractions() {
  const inputs = document.querySelectorAll('.form-group input, .form-group select');
  inputs.forEach(input => {
    // Focus effects
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('focused');
    });
    
    // Real-time validation
    input.addEventListener('input', () => {
      validateInput(input);
    });
  });
}

function validateInput(input) {
  const wrapper = input.closest('.input-wrapper');
  if (!wrapper) return;
  
  // Remove existing validation states
  wrapper.classList.remove('valid', 'invalid');
  
  if (input.value.trim()) {
    if (input.type === 'number' && input.id === 'age') {
      const age = parseInt(input.value);
      if (age >= 1 && age <= 120) {
        wrapper.classList.add('valid');
      } else {
        wrapper.classList.add('invalid');
      }
    } else {
      wrapper.classList.add('valid');
    }
  }
}

// === SUGGESTION CHIPS ===
function initSuggestionChips() {
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', function() {
      addSymptom(this.textContent.trim());
      
      // Add animation
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });
  });
}

function addSymptom(symptom) {
  const input = document.getElementById('symptoms');
  if (!input) return;
  
  const value = input.value.trim();
  const symptoms = value ? value.split(',').map(s => s.trim()) : [];
  
  // Check if symptom already exists
  if (!symptoms.includes(symptom)) {
    symptoms.push(symptom);
    input.value = symptoms.join(', ');
    
    // Add animation
    input.classList.add('highlight');
    setTimeout(() => input.classList.remove('highlight'), 500);
  }
  
  input.focus();
  
  // Validate input
  validateInput(input);
}

// === FORM SUBMISSION ===
async function predictDisease(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const symptomsInput = document.getElementById('symptoms').value.trim();
  
  if (!symptomsInput) {
    showNotification('Please enter at least one symptom', 'warning');
    shakeElement(document.getElementById('symptoms'));
    return;
  }
  
  setLoading(true);
  
  try {
    const payload = { symptoms: parseSymptoms(symptomsInput) };
    
    // Add optional fields
    const age = document.getElementById('age').value;
    if (age) payload.age = parseInt(age);
    
    const gender = document.getElementById('gender').value;
    if (gender) payload.gender = gender;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    currentResults = result.predictions || [];
    showResults(currentResults);
    
    // Success notification
    showNotification('Analysis completed successfully!', 'success');
    
  } catch (error) {
    console.error('Prediction error:', error);
    showNotification('Server error. Please make sure the backend is running.', 'error');
  } finally {
    setLoading(false);
  }
}

// === RESULTS DISPLAY ===
function showResults(predictions) {
  const grid = document.getElementById('resultsGrid');
  const section = document.getElementById('resultsSection');
  
  if (!grid || !section) return;
  
  grid.innerHTML = '';
  section.classList.remove('hidden');
  
  // Create result cards with staggered animation
  predictions.slice(0, 3).forEach((pred, index) => {
    const card = createResultCard(pred, index + 1);
    grid.appendChild(card);
    
    // Staggered animation
    setTimeout(() => {
      card.classList.add('fade-in-up');
      
      // Animate progress bar
      const progressBar = card.querySelector('.progress-fill');
      if (progressBar) {
        progressBar.style.width = `${pred.confidence * 100}%`;
      }
    }, 200 * (index + 1));
  });
  
  // Scroll to results
  setTimeout(() => {
    section.scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

function createResultCard(prediction, rank) {
  const card = document.createElement('div');
  card.className = 'result-card';
  card.style.opacity = '0';
  
  const confidence = (prediction.confidence * 100).toFixed(1);
  const confidenceText = getConfidenceText(prediction.confidence);
  
  card.innerHTML = `
    <div class="result-rank">${rank}</div>
    <h3 class="result-title">${prediction.disease}</h3>
    <div class="result-confidence">${confidence}%</div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 0%"></div>
    </div>
    <div class="result-description">${confidenceText}</div>
  `;
  
  return card;
}

function getConfidenceText(conf) {
  if (conf > 0.8) return 'Very high confidence - Strong indicator';
  if (conf > 0.6) return 'High confidence - Likely match';
  if (conf > 0.4) return 'Moderate confidence - Possible match';
  return 'Low confidence - Consult healthcare provider';
}

// === LOADING STATES ===
function setLoading(loading) {
  const btn = document.getElementById('predictBtn');
  const content = btn.querySelector('.button-content');
  const loader = btn.querySelector('.button-loader');
  
  if (!btn || !content || !loader) return;
  
  btn.disabled = loading;
  
  if (loading) {
    content.style.opacity = '0';
    loader.style.opacity = '1';
    btn.classList.add('loading');
  } else {
    content.style.opacity = '1';
    loader.style.opacity = '0';
    btn.classList.remove('loading');
  }
}

// === UTILITY FUNCTIONS ===
function parseSymptoms(input) {
  return input.split(',')
    .map(s => s.trim().replace(/\b\w/g, l => l.toUpperCase()))
    .filter(Boolean);
}

function resetForm() {
  const form = document.querySelector('.prediction-form');
  if (form) {
    form.reset();
    
    // Clear validation states
    form.querySelectorAll('.input-wrapper').forEach(wrapper => {
      wrapper.classList.remove('focused', 'valid', 'invalid');
    });
    
    // Hide results
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
      resultsSection.classList.add('hidden');
    }
    
    // Clear current results
    currentResults = [];
    
    // Scroll to form
    scrollToForm();
    
    showNotification('Form reset successfully', 'success');
  }
}

function exportResults() {
  if (!currentResults.length) {
    showNotification('No results to export', 'warning');
    return;
  }
  
  const exportData = {
    timestamp: new Date().toISOString(),
    symptoms: document.getElementById('symptoms').value,
    age: document.getElementById('age').value,
    gender: document.getElementById('gender').value,
    predictions: currentResults
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `healthguard-analysis-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Results exported successfully', 'success');
}

// === SCROLL ANIMATIONS ===
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observe elements with animation classes
  document.querySelectorAll('.fade-in-up').forEach(el => {
    observer.observe(el);
  });
}

// === NOTIFICATIONS ===
function showNotification(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${getToastIcon(type)}"></i>
      <span>${message}</span>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Auto remove
  setTimeout(() => {
    toast.style.animation = 'slide-out 0.3s ease-out forwards';
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

function getToastIcon(type) {
  switch (type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    default: return 'fa-info-circle';
  }
}

// === ANIMATION HELPERS ===
function shakeElement(element) {
  if (!element) return;
  
  element.classList.add('shake');
  setTimeout(() => {
    element.classList.remove('shake');
  }, 500);
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
  .pulse-once {
    animation: pulse-once 1s ease-in-out;
  }
  
  @keyframes pulse-once {
    0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
  }
  
  .highlight {
    animation: highlight 0.5s ease-in-out;
  }
  
  @keyframes highlight {
    0%, 100% { background-color: transparent; }
    50% { background-color: rgba(59, 130, 246, 0.1); }
  }
  
  .shake {
    animation: shake 0.5s ease-in-out;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
  
  .focused .input-icon {
    color: var(--primary-blue);
    transform: translateY(-50%) scale(1.1);
  }
  
  .valid .input-icon {
    color: var(--success-green);
  }
  
  .invalid .input-icon {
    color: var(--error-red);
  }
  
  .loading {
    pointer-events: none;
  }
  
  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
  
  @keyframes slide-out {
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .mobile-menu-toggle.active {
    background: var(--primary-gradient);
    color: white;
  }
  
  .nav-menu.mobile-active {
    display: flex;
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    flex-direction: column;
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-lg);
  }
  
  @media (max-width: 768px) {
    .nav-menu {
      display: none;
    }
    
    .nav-menu.mobile-active {
      display: flex;
    }
  }
`;
document.head.appendChild(style);
