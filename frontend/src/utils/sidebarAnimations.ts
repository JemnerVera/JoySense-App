/**
 * Funciones de animación para sub-menús del sidebar
 * Basadas en la plantilla de Estilo_Sidebar
 */

const ANIMATION_DURATION = 300;

export const slideUp = (target: HTMLElement, duration: number = ANIMATION_DURATION): Promise<void> => {
  return new Promise((resolve) => {
    const parentElement = target.parentElement;
    if (parentElement) {
      parentElement.classList.remove('open');
    }
    
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = `${duration}ms`;
    target.style.boxSizing = 'border-box';
    target.style.height = `${target.offsetHeight}px`;
    // Force reflow
    void target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = '0';
    target.style.paddingTop = '0';
    target.style.paddingBottom = '0';
    target.style.marginTop = '0';
    target.style.marginBottom = '0';
    
    window.setTimeout(() => {
      target.style.display = 'none';
      target.style.removeProperty('height');
      target.style.removeProperty('padding-top');
      target.style.removeProperty('padding-bottom');
      target.style.removeProperty('margin-top');
      target.style.removeProperty('margin-bottom');
      target.style.removeProperty('overflow');
      target.style.removeProperty('transition-duration');
      target.style.removeProperty('transition-property');
      resolve();
    }, duration);
  });
};

export const slideDown = (target: HTMLElement, duration: number = ANIMATION_DURATION): Promise<void> => {
  return new Promise((resolve) => {
    const parentElement = target.parentElement;
    if (parentElement) {
      parentElement.classList.add('open');
    }
    
    target.style.removeProperty('display');
    let { display } = window.getComputedStyle(target);
    if (display === 'none') display = 'block';
    target.style.display = display;
    const height = target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = '0';
    target.style.paddingTop = '0';
    target.style.paddingBottom = '0';
    target.style.marginTop = '0';
    target.style.marginBottom = '0';
    // Force reflow
    void target.offsetHeight;
    target.style.boxSizing = 'border-box';
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = `${duration}ms`;
    target.style.height = `${height}px`;
    target.style.removeProperty('padding-top');
    target.style.removeProperty('padding-bottom');
    target.style.removeProperty('margin-top');
    target.style.removeProperty('margin-bottom');
    
    window.setTimeout(() => {
      target.style.removeProperty('height');
      target.style.removeProperty('overflow');
      target.style.removeProperty('transition-duration');
      target.style.removeProperty('transition-property');
      resolve();
    }, duration);
  });
};

export const slideToggle = async (target: HTMLElement, duration: number = ANIMATION_DURATION): Promise<void> => {
  if (window.getComputedStyle(target).display === 'none') {
    return slideDown(target, duration);
  }
  return slideUp(target, duration);
};
