// live reload CSS in development mode
if (__DEV__) {

  // esbuild server-sent event
  new EventSource('/esbuild').addEventListener('change', e => {

    const { added, removed, updated } = JSON.parse(e.data);

    // reload when CSS files are added or removed
    if (added.length || removed.length) {
      location.reload();
      return;
    }

    // replace updated CSS files
    Array.from(document.getElementsByTagName('link')).forEach(link => {

      const url = new URL(link.href), path = url.pathname;

      if (updated.includes(path) && url.host === location.host) {

        const css = link.cloneNode();
        css.onload = () => link.remove();
        css.href = `${ path }?${ +new Date() }`;
        link.after(css);

      }

    });

  });

}
