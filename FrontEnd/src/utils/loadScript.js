
export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      console.log(`Script loaded: ${src}`);
      resolve();
    };

    script.onerror = () => {
      console.error(`Failed to load script: ${src}`);
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.body.appendChild(script);
  });
 
}
