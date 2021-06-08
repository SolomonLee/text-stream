const loadSize = 0;
const valueSize = 0;
function loadChunkTextFile(
    /**  檔案位置URL */ path,
    /**  cb: Callback Function, 當取得一定長度的資料時, 回傳資料給 cb
     *| 資料格式: obj { data: "your chunk str" }
     *| 長度: chunkSize */ cb,
    /**  切分的檔案大小 */ chunkSize = 1024,
    /**  當 Worker 沒有回傳資料達到一定時間時, 將自動關閉, 時間單位: 毫秒 */ timeout = 60000
) {
    const loadChunkTextFileWorker = new Worker("loadChunkTextFileWorker.js");
    let autoCloseWorkerTimer = -1;

    loadChunkTextFileWorker.onmessage = (e) => {
        // e.data =
        // {
        //     done: false,
        //     result: decode data,
        // }
        setCloseWorkerTimer();
        if (!e.data.done) {
            chunkSplit(e.data.result);
        } else {
            finalChunkSplit(e.data.result);
        }
    };

    const chunkStr = { data: "" };

    /** 回傳資料至 callback 函數 */
    const result = (isDone, errorMessage = "") => {
        cb({
            data: chunkStr.data,
            done: isDone,
            error: errorMessage.length > 0,
            errorMessage,
        });
    };

    /** 將 worker 取得的資料進行切割, 當超出 chunkSize 時, 將 call result(boolean), 回傳資料 */
    const chunkSplit = (str) => {
        let needLen = chunkSize - chunkStr.data.length;

        if (str.length < needLen) {
            chunkStr.data += str;
        } else if (str.length === needLen) {
            chunkStr.data += str;
            result(false);
            chunkStr.data = "";
        } else if (str.length > needLen) {
            chunkStr.data += str.slice(0, needLen);
            result(false);

            let pos = needLen;
            while (str.length - pos >= chunkSize) {
                chunkStr.data = str.slice(pos, pos + chunkSize);
                result(false);
                pos = pos + chunkSize;
            }

            if (str.length - pos > 0) {
                chunkStr.data = str.slice(pos, str.length);
            } else {
                chunkStr.data = "";
            }
        }
    };

    /** 將 worker 取得的資料進行切割, 當超出 chunkSize 時, 將 call result(boolean), 回傳資料, 並回傳在 chunkStr 內資料, 且關閉 worker */
    const finalChunkSplit = (str) => {
        let needLen = chunkSize - chunkStr.data.length;

        if (str.length < needLen) {
            chunkStr.data += str;
            result(false);
        } else if (str.length === needLen) {
            chunkStr.data += str;
            result(false);
            chunkStr.data = "";
        } else if (str.length > needLen) {
            chunkStr.data += str.slice(0, needLen);
            result(false);

            let pos = needLen;
            while (str.length - pos >= chunkSize) {
                chunkStr.data = str.slice(pos, pos + chunkSize);
                result(false);
                pos = pos + chunkSize;
            }

            if (str.length - pos > 0) {
                chunkStr.data = str.slice(pos, str.length);
                result(false);
            }
        }

        chunkStr.data = "";
        result(true);
        loadChunkTextFileWorker.terminate();
    };

    const setCloseWorkerTimer = () => {
        clearTimeout(autoCloseWorkerTimer);
        autoCloseWorkerTimer = setTimeout(() => {
            loadChunkTextFileWorker.terminate();
            result(false, "ERROR: WorkerTimeout!!");
        }, timeout);
    };

    loadChunkTextFileWorker.postMessage({ path });
    setCloseWorkerTimer();
}
