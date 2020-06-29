export function waitEvent(element, eventName) {
  return new Promise((resolve) => {
    element.addEventListener(eventName, resolve, { once: true });
  });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
