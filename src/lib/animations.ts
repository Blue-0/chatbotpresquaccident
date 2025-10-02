import { animate } from 'animejs';

export function animateHeader(el: HTMLElement) {
  animate(el, {
    opacity: [0, 1],
    translateY: [-8, 0],
    duration: 600,
    easing: 'easeOutQuad'
  });
}

export function animateNewMessage(el: HTMLElement, _opts?: { user?: boolean }) {
  animate(el, {
    opacity: [0, 1],
    translateY: [8, 0],
    scale: [0.98, 1],
    duration: 450,
    easing: 'easeOutQuad'
  });
}

export function createMicPulse(el: HTMLElement) {
  const inst = animate(el, {
    scale: [1, 1.06],
    duration: 700,
    easing: 'easeInOutSine',
    direction: 'alternate',
    loop: true,
    autoplay: false,
  });
  return inst;
}

export function resetScale(el: HTMLElement) {
  animate(el, { scale: 1, duration: 250, easing: 'easeOutQuad' });
}
