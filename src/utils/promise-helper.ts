export function waitEvent(element: HTMLElement, eventName: string) {
  return new Promise((resolve) => {
    element.addEventListener(eventName, resolve, { once: true });
  });
}


export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
