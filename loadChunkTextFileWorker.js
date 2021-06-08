onmessage = function (e) {
    const path = e.data.path;
    const textDecoder = new TextDecoder();
    fetch(path)
        .then(async (response) => {
            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    postMessage({
                        done: true,
                        result: textDecoder.decode(),
                    });
                    break;
                } else {
                    postMessage({
                        done: false,
                        result: textDecoder.decode(value, { stream: true }),
                    });
                }
            }
        })
        .catch(console.error);
};
