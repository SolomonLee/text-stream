const loadSize = 0;
const valueSize = 0;
function loadChunkTextFile(
    /**  檔案位置URL */ path,
    /**  cb: Callback Function, 當取得一定長度的資料時, 回傳資料給 cb
     *| 資料格式: obj { data: "your chunk str" }
     *| 長度: chunkSize */ cb,
    /**  切分的檔案大小 */ chunkSize = 1024
) {
    const chunkStr = { data: "", done: false };
    const textDecoder = new TextDecoder();
    const state = {
        parseDone: false,
        inDecodeDeep: 0,
        waitingDecodeBuffers: [],
    };

    const chunkSplit = (str) => {
        let needLen = chunkSize - chunkStr.data.length;

        if (str.length < needLen) {
            chunkStr.data += str;
        } else if (str.length === needLen) {
            chunkStr.data += str;
            cb(chunkStr);
            chunkStr.data = "";
        } else if (str.length > needLen) {
            chunkStr.data += str.slice(0, needLen);
            cb(chunkStr);

            let pos = needLen;
            while (str.length - pos >= chunkSize) {
                chunkStr.data = str.slice(pos, pos + chunkSize);
                cb(chunkStr);
                pos = pos + chunkSize;
            }

            if (str.length - pos > 0) {
                chunkStr.data = str.slice(pos, str.length);
            } else {
                chunkStr.data = "";
            }
        }
    };

    const finalChunkSplit = (str) => {
        let needLen = chunkSize - chunkStr.data.length;

        if (str.length < needLen) {
            chunkStr.data += str;
            cb(chunkStr);
        } else if (str.length === needLen) {
            chunkStr.data += str;
            cb(chunkStr);
            chunkStr.data = "";
        } else if (str.length > needLen) {
            chunkStr.data += str.slice(0, needLen);
            cb(chunkStr);

            let pos = needLen;
            while (str.length - pos >= chunkSize) {
                chunkStr.data = str.slice(pos, pos + chunkSize);
                cb(chunkStr);
                pos = pos + chunkSize;
            }

            if (str.length - pos > 0) {
                chunkStr.data = str.slice(pos, str.length);
                cb(chunkStr);
            }
        }

        chunkStr.done = true;
        chunkStr.data = "";
        cb(chunkStr);
    };

    const decodeUint8ArrayBuffer = () => {
        setTimeout(() => {
            state.inDecodeDeep -= 1;
            chunkSplit(
                textDecoder.decode(state.waitingDecodeBuffers[0], {
                    stream: true,
                })
            );
            state.waitingDecodeBuffers.splice(0, 1);

            if (state.inDecodeDeep > 0) {
                decodeUint8ArrayBuffer();
            } else if (state.inDecodeDeep === 0 && state.parseDone) {
                finalChunkSplit(textDecoder.decode());
            }
        });
    };

    const addUint8ArrayBuffer = (buffer) => {
        state.waitingDecodeBuffers.push(buffer);
        state.inDecodeDeep += 1;

        if (state.inDecodeDeep === 1) {
            decodeUint8ArrayBuffer();
        }
    };

    fetch(path)
        .then(async (response) => {
            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    state.parseDone = true;
                    break;
                } else {
                    addUint8ArrayBuffer(value);
                }
            }
        })
        .catch(console.error);
}
